/**
 * MCP OAuth 2.1 provider with dynamic client registration (RFC 7591).
 *
 * Implements OAuthServerProvider using SQLite for persistent storage.
 * Used by the SDK's mcpAuthRouter to handle all OAuth endpoints.
 */

import { randomUUID, randomBytes } from "node:crypto";
import { Response } from "express";
import type { OAuthServerProvider, AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { OAuthClientInformationFull, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import {
  getOAuthClient,
  storeOAuthClient,
  storeAuthCode,
  getAuthCode,
  deleteAuthCode,
  storeAccessToken,
  getAccessToken,
  deleteAccessToken,
  createUser,
} from "./db.js";

// ---------- Clients Store (RFC 7591) ----------

class RdwClientsStore implements OAuthRegisteredClientsStore {
  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    const row = getOAuthClient(clientId);
    if (!row) return undefined;

    const metadata = JSON.parse(row.metadata);
    return {
      ...metadata,
      client_id: row.client_id,
      client_secret: row.client_secret,
      client_id_issued_at: row.client_id_issued_at,
      client_secret_expires_at: row.client_secret_expires_at,
    } as OAuthClientInformationFull;
  }

  async registerClient(
    client: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">
  ): Promise<OAuthClientInformationFull> {
    const clientId = randomUUID();
    const clientSecret = randomBytes(32).toString("hex");
    const issuedAt = Math.floor(Date.now() / 1000);

    const { client_secret, client_secret_expires_at, ...metadata } = client as Record<string, unknown>;

    const stored: OAuthClientInformationFull = {
      ...(metadata as Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at" | "client_secret" | "client_secret_expires_at">),
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: issuedAt,
      client_secret_expires_at: 0, // no expiry
    };

    storeOAuthClient({
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: issuedAt,
      client_secret_expires_at: 0,
      metadata: JSON.stringify(metadata),
    });

    return stored;
  }
}

// ---------- OAuth Server Provider ----------

export class RdwOAuthProvider implements OAuthServerProvider {
  clientsStore = new RdwClientsStore();

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    // Show a simple email login form
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
    <form method="POST" action="/authorize/submit">
      <input type="hidden" name="client_id" value="${escapeHtml(client.client_id)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirectUri)}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(params.codeChallenge)}">
      <input type="hidden" name="state" value="${escapeHtml(params.state || "")}">
      <input type="hidden" name="scopes" value="${escapeHtml((params.scopes || []).join(" "))}">
      <input type="hidden" name="resource" value="${escapeHtml(params.resource?.toString() || "")}">
      <label for="email">Email address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com">
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>`;

    res.type("html").send(formHtml);
  }

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string
  ): Promise<string> {
    const row = getAuthCode(authorizationCode);
    if (!row || row.expires_at < Date.now()) {
      throw new Error("Invalid or expired authorization code");
    }
    return row.code_challenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    _redirectUri?: string,
    _resource?: URL
  ): Promise<OAuthTokens> {
    const row = getAuthCode(authorizationCode);
    if (!row || row.expires_at < Date.now()) {
      throw new Error("Invalid or expired authorization code");
    }
    if (row.client_id !== client.client_id) {
      throw new Error("Authorization code was not issued to this client");
    }

    deleteAuthCode(authorizationCode);

    // Create access token (= user's API key for RDW access)
    const token = randomUUID();
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year

    storeAccessToken({
      token,
      client_id: client.client_id,
      scopes: row.scopes,
      resource: row.resource,
      expires_at: expiresAt,
    });

    return {
      access_token: token,
      token_type: "bearer",
      expires_in: 365 * 24 * 60 * 60,
      scope: row.scopes || "",
    };
  }

  async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    _refreshToken: string,
    _scopes?: string[],
    _resource?: URL
  ): Promise<OAuthTokens> {
    throw new Error("Refresh tokens are not supported");
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const row = getAccessToken(token);
    if (!row || row.expires_at < Date.now()) {
      throw new Error("Invalid or expired access token");
    }

    return {
      token,
      clientId: row.client_id,
      scopes: row.scopes ? row.scopes.split(" ") : [],
      expiresAt: Math.floor(row.expires_at / 1000),
      resource: row.resource ? new URL(row.resource) : undefined,
    };
  }

  async revokeToken(
    _client: OAuthClientInformationFull,
    request: { token: string; token_type_hint?: string }
  ): Promise<void> {
    deleteAccessToken(request.token);
  }
}

// ---------- Authorization code issuance (called from POST /authorize/submit) ----------

export function issueAuthorizationCode(params: {
  clientId: string;
  codeChallenge: string;
  redirectUri: string;
  state?: string;
  scopes?: string;
  resource?: string;
  email: string;
}): string {
  const code = randomUUID();

  // Ensure user exists in users table
  createUser(params.email);

  storeAuthCode({
    code,
    client_id: params.clientId,
    code_challenge: params.codeChallenge,
    redirect_uri: params.redirectUri,
    scopes: params.scopes || null,
    resource: params.resource || null,
    email: params.email,
    expires_at: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return code;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
