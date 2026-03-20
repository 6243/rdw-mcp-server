/**
 * Minimal OAuth 2.0 authorization-code flow for ChatGPT custom connectors.
 *
 * Endpoints:
 *   GET  /oauth/authorize  — shows email login form, issues auth code
 *   POST /oauth/token      — exchanges code for access_token (= user API key)
 *   GET  /.well-known/oauth-authorization-server — metadata document
 *
 * Auth codes are stored in memory and expire after 5 minutes.
 */

import { Router, Request, Response } from "express";
import { createUser } from "./db.js";
import { v4 as uuidv4 } from "uuid";

const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || "rdw-mcp-client";
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || "rdw-mcp-secret";

interface PendingCode {
  email: string;
  redirectUri: string;
  expiresAt: number;
}

const pendingCodes = new Map<string, PendingCode>();

// Clean up expired codes every minute
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of pendingCodes) {
    if (entry.expiresAt <= now) pendingCodes.delete(code);
  }
}, 60_000);

export function oauthRouter(): Router {
  const router = Router();

  // ---------- Authorization endpoint ----------

  router.get("/oauth/authorize", (req: Request, res: Response) => {
    const { client_id, redirect_uri, response_type, state } = req.query as Record<string, string>;

    const formHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RDW MCP — Sign In</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         background:#f5f7fa;display:flex;align-items:center;justify-content:center;
         min-height:100vh;padding:1rem}
    .card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);
          padding:2.5rem;max-width:400px;width:100%}
    h1{font-size:1.4rem;margin-bottom:.5rem;color:#1a1a2e}
    p{color:#555;margin-bottom:1.5rem;font-size:.95rem}
    label{display:block;font-weight:600;margin-bottom:.4rem;font-size:.9rem}
    input[type=email]{width:100%;padding:.65rem .8rem;border:1px solid #d1d5db;
         border-radius:8px;font-size:1rem;margin-bottom:1rem}
    button{width:100%;padding:.7rem;background:#2563eb;color:#fff;font-size:1rem;
           border:none;border-radius:8px;cursor:pointer;font-weight:600}
    button:hover{background:#1d4ed8}
  </style>
</head>
<body>
  <div class="card">
    <h1>RDW MCP</h1>
    <p>Sign in with your email to connect your AI agent.</p>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(client_id || "")}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirect_uri || "")}">
      <input type="hidden" name="response_type" value="${escapeHtml(response_type || "code")}">
      <input type="hidden" name="state" value="${escapeHtml(state || "")}">
      <label for="email">Email address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com">
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;

    res.type("html").send(formHtml);
  });

  router.post("/oauth/authorize", (req: Request, res: Response) => {
    const { email, redirect_uri, state } = req.body as Record<string, string>;

    if (!email || !redirect_uri) {
      res.status(400).json({ error: "email and redirect_uri are required" });
      return;
    }

    // Ensure user exists
    createUser(email);

    // Issue authorization code
    const code = uuidv4();
    pendingCodes.set(code, {
      email,
      redirectUri: redirect_uri,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);

    res.redirect(302, redirectUrl.toString());
  });

  // ---------- Token endpoint ----------

  router.post("/oauth/token", (req: Request, res: Response) => {
    const { grant_type, code, client_id, client_secret } = req.body as Record<string, string>;

    if (client_id !== OAUTH_CLIENT_ID || client_secret !== OAUTH_CLIENT_SECRET) {
      res.status(401).json({ error: "invalid_client" });
      return;
    }

    if (grant_type !== "authorization_code") {
      res.status(400).json({ error: "unsupported_grant_type" });
      return;
    }

    const entry = pendingCodes.get(code);
    if (!entry || entry.expiresAt <= Date.now()) {
      pendingCodes.delete(code);
      res.status(400).json({ error: "invalid_grant", error_description: "Code expired or invalid" });
      return;
    }

    pendingCodes.delete(code);

    // The user's API key is the access token
    const apiKey = createUser(entry.email);

    res.json({
      access_token: apiKey,
      token_type: "Bearer",
      expires_in: 31536000, // 1 year (effectively non-expiring)
    });
  });

  // ---------- OAuth metadata ----------
  // Note: /.well-known/oauth-authorization-server is intentionally NOT served
  // here. mcp-remote (Claude Desktop bridge) discovers it and attempts OAuth
  // dynamic client registration, which conflicts with our simple Bearer-token
  // auth. ChatGPT custom connectors can be configured with direct URLs:
  //   authorization_endpoint: /oauth/authorize
  //   token_endpoint:         /oauth/token

  return router;
}

function getBaseUrl(req: Request): string {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
