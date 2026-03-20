#!/usr/bin/env node
/**
 * RDW MCP Server
 *
 * An MCP (Model Context Protocol) server that provides access to Dutch RDW
 * (Rijksdienst voor het Wegverkeer) open vehicle data.
 *
 * Supports both stdio (for Claude Desktop / local) and streamable HTTP
 * (for remote / cloud deployment) transports.
 *
 * Tools:
 *   - rdw_kenteken_zoeken: Quick license plate lookup
 *   - rdw_voertuig_details: Full vehicle details from multiple datasets
 *   - rdw_apk_status: APK (MOT) inspection status check
 *   - rdw_terugroep_acties: Recall actions lookup
 *   - rdw_merk_zoeken: Search by brand with filters
 *   - rdw_slim_zoeken: Natural language smart search
 */

import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import express, { Request, Response, NextFunction } from "express";

// Tool registrations
import { registerKentekenZoeken } from "./tools/rdw-kenteken.js";
import { registerVoertuigDetails } from "./tools/rdw-details.js";
import { registerApkStatus } from "./tools/rdw-apk.js";
import { registerTerugroepActies } from "./tools/rdw-recalls.js";
import { registerMerkZoeken } from "./tools/rdw-merk.js";
import { registerSlimZoeken } from "./tools/rdw-slim-zoeken.js";

// Auth & onboarding
import { initDb } from "./db.js";
import { landingRouter } from "./landing.js";
import { RdwOAuthProvider, issueAuthorizationCode } from "./auth-provider.js";

// ---------- Create server ----------

const server = new McpServer({
  name: "rdw-mcp-server",
  version: "1.0.0",
});

// ---------- Register all tools ----------

registerKentekenZoeken(server);
registerVoertuigDetails(server);
registerApkStatus(server);
registerTerugroepActies(server);
registerMerkZoeken(server);
registerSlimZoeken(server);

// ---------- Transport: stdio ----------

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RDW MCP Server running via stdio");
}

// ---------- Transport: Streamable HTTP ----------

async function runHTTP(): Promise<void> {
  // Initialize user database
  initDb();

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS — allow any MCP client to connect
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (_req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Health check (no auth required)
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      server: "rdw-mcp-server",
      version: "1.0.0",
      transport: "streamable-http",
      tools: [
        "rdw_kenteken_zoeken",
        "rdw_voertuig_details",
        "rdw_apk_status",
        "rdw_terugroep_acties",
        "rdw_merk_zoeken",
        "rdw_slim_zoeken",
      ],
      timestamp: new Date().toISOString(),
    });
  });

  // Landing / onboarding page + signup (no auth required)
  app.use(landingRouter());

  // ---------- OAuth 2.1 with Dynamic Client Registration (RFC 7591) ----------

  const provider = new RdwOAuthProvider();
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${process.env.PORT || "8000"}`;
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const issuerUrl = new URL(`${protocol}://${domain}`);
  const mcpServerUrl = new URL(`${protocol}://${domain}/mcp`);

  console.error(`[oauth] Issuer URL:  ${issuerUrl.toString()}`);
  console.error(`[oauth] Resource URL: ${mcpServerUrl.toString()}`);
  console.error(`[oauth] RAILWAY_PUBLIC_DOMAIN = ${process.env.RAILWAY_PUBLIC_DOMAIN ?? "(not set)"}`);

  // Mount SDK auth router: handles /.well-known/oauth-authorization-server,
  // /.well-known/oauth-protected-resource, /register, /authorize, /token, /revoke
  app.use(mcpAuthRouter({
    provider,
    issuerUrl,
    resourceServerUrl: mcpServerUrl,
    scopesSupported: ["mcp:tools"],
  }));

  // Authorization form submit handler (email login)
  app.post("/authorize/submit", (req: Request, res: Response) => {
    const { client_id, redirect_uri, code_challenge, state, scopes, resource, email } =
      req.body as Record<string, string>;

    if (!email || !redirect_uri || !client_id || !code_challenge) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const code = issueAuthorizationCode({
      clientId: client_id,
      codeChallenge: code_challenge,
      redirectUri: redirect_uri,
      state: state || undefined,
      scopes: scopes || undefined,
      resource: resource || undefined,
      email,
    });

    const targetUrl = new URL(redirect_uri);
    targetUrl.searchParams.set("code", code);
    if (state) targetUrl.searchParams.set("state", state);
    res.redirect(302, targetUrl.toString());
  });

  // ---------- Bearer auth middleware for /mcp ----------

  const bearerAuth = requireBearerAuth({
    verifier: provider,
    resourceMetadataUrl: `${protocol}://${domain}/.well-known/oauth-protected-resource`,
  });

  // ---------- Stateful session management for SSE support ----------

  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: McpServer }>();

  function createSessionServer(): McpServer {
    const s = new McpServer({ name: "rdw-mcp-server", version: "1.0.0" });
    registerKentekenZoeken(s);
    registerVoertuigDetails(s);
    registerApkStatus(s);
    registerTerugroepActies(s);
    registerMerkZoeken(s);
    registerSlimZoeken(s);
    return s;
  }

  // MCP endpoint — stateful with SSE support (auth required)
  app.post("/mcp", bearerAuth, async (req: Request, res: Response) => {
    try {
      // Check for existing session
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res, req.body);
        return;
      }

      // New session: only allowed via initialize request
      if (sessionId && !sessions.has(sessionId)) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Create new stateful transport + per-session server
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      const sessionServer = createSessionServer();

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) sessions.delete(sid);
      };

      await sessionServer.connect(transport);
      await transport.handleRequest(req, res, req.body);

      const sid = transport.sessionId;
      if (sid) {
        sessions.set(sid, { transport, server: sessionServer });
      }
    } catch (error: unknown) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // GET /mcp — SSE stream for server-to-client notifications (auth required)
  app.get("/mcp", bearerAuth, async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: "Missing or invalid session ID. Send an initialize POST first." });
      return;
    }
    const session = sessions.get(sessionId)!;

    // Keep-alive: prevent reverse proxies (Railway, Render) from killing idle SSE
    const keepAlive = setInterval(() => {
      if (!res.writableEnded) {
        res.write(":keep-alive\n\n");
      }
    }, 25_000);
    res.on("close", () => clearInterval(keepAlive));

    await session.transport.handleRequest(req, res);
  });

  // DELETE /mcp — session cleanup (auth required)
  app.delete("/mcp", bearerAuth, async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
  });

  const port = parseInt(process.env.PORT || "8000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.error(`RDW MCP Server running on http://0.0.0.0:${port}/mcp`);
    console.error(`Health check: http://0.0.0.0:${port}/health`);
    console.error(`Onboarding:  http://0.0.0.0:${port}/`);
  });
}

// ---------- Main ----------

const transport = process.argv.includes("--http")
  ? "http"
  : process.env.TRANSPORT || "stdio";

if (transport === "http") {
  runHTTP().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error: unknown) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
