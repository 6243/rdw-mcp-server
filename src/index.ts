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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response, NextFunction } from "express";

// Tool registrations
import { registerKentekenZoeken } from "./tools/rdw-kenteken.js";
import { registerVoertuigDetails } from "./tools/rdw-details.js";
import { registerApkStatus } from "./tools/rdw-apk.js";
import { registerTerugroepActies } from "./tools/rdw-recalls.js";
import { registerMerkZoeken } from "./tools/rdw-merk.js";
import { registerSlimZoeken } from "./tools/rdw-slim-zoeken.js";

// Auth & onboarding
import { initDb, validateApiKey } from "./db.js";
import { oauthRouter } from "./oauth.js";
import { landingRouter } from "./landing.js";

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

  // OAuth 2.0 endpoints (no auth required)
  app.use(oauthRouter());

  // ---------- Bearer token auth middleware for /mcp ----------

  app.use("/mcp", (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or malformed Authorization header. Use: Bearer <api_key>" });
      return;
    }

    const token = authHeader.slice(7);
    if (!validateApiKey(token)) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    next();
  });

  // MCP endpoint — stateless JSON mode
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      res.on("close", () => transport.close());

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error: unknown) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Handle GET and DELETE on /mcp for protocol compliance
  app.get("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({ error: "Method not allowed. Use POST for MCP requests." });
  });

  app.delete("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({ error: "Method not allowed. Use POST for MCP requests." });
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
