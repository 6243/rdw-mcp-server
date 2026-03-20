/**
 * SQLite database for user management and OAuth state.
 */

import Database from "better-sqlite3";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DB_PATH || "./data/users.db";

let db: Database.Database;

export function initDb(): void {
  mkdirSync(dirname(DB_PATH), { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      api_key    TEXT    NOT NULL UNIQUE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS oauth_clients (
      client_id                  TEXT PRIMARY KEY,
      client_secret              TEXT,
      client_id_issued_at        INTEGER NOT NULL,
      client_secret_expires_at   INTEGER,
      metadata                   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_codes (
      code            TEXT PRIMARY KEY,
      client_id       TEXT NOT NULL,
      code_challenge  TEXT NOT NULL,
      redirect_uri    TEXT NOT NULL,
      scopes          TEXT,
      resource        TEXT,
      email           TEXT,
      expires_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS access_tokens (
      token       TEXT PRIMARY KEY,
      client_id   TEXT NOT NULL,
      scopes      TEXT,
      resource    TEXT,
      expires_at  INTEGER NOT NULL
    );
  `);
}

// ---------- Users ----------

export function validateApiKey(key: string): boolean {
  const row = db.prepare("SELECT 1 FROM users WHERE api_key = ?").get(key);
  return row !== undefined;
}

export function createUser(email: string): string {
  const existing = db
    .prepare("SELECT api_key FROM users WHERE email = ?")
    .get(email) as { api_key: string } | undefined;
  if (existing) return existing.api_key;

  const apiKey = randomUUID();
  db.prepare("INSERT INTO users (email, api_key) VALUES (?, ?)").run(email, apiKey);
  return apiKey;
}

// ---------- OAuth Clients (RFC 7591) ----------

export interface StoredClient {
  client_id: string;
  client_secret?: string;
  client_id_issued_at: number;
  client_secret_expires_at?: number;
  metadata: string; // JSON of OAuthClientMetadata fields
}

export function getOAuthClient(clientId: string): StoredClient | undefined {
  return db.prepare("SELECT * FROM oauth_clients WHERE client_id = ?").get(clientId) as StoredClient | undefined;
}

export function storeOAuthClient(client: StoredClient): void {
  db.prepare(
    "INSERT OR REPLACE INTO oauth_clients (client_id, client_secret, client_id_issued_at, client_secret_expires_at, metadata) VALUES (?, ?, ?, ?, ?)"
  ).run(client.client_id, client.client_secret ?? null, client.client_id_issued_at, client.client_secret_expires_at ?? null, client.metadata);
}

// ---------- Auth Codes ----------

export interface StoredAuthCode {
  code: string;
  client_id: string;
  code_challenge: string;
  redirect_uri: string;
  scopes: string | null;
  resource: string | null;
  email: string | null;
  expires_at: number;
}

export function storeAuthCode(data: StoredAuthCode): void {
  db.prepare(
    "INSERT INTO auth_codes (code, client_id, code_challenge, redirect_uri, scopes, resource, email, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(data.code, data.client_id, data.code_challenge, data.redirect_uri, data.scopes, data.resource, data.email, data.expires_at);
}

export function getAuthCode(code: string): StoredAuthCode | undefined {
  return db.prepare("SELECT * FROM auth_codes WHERE code = ?").get(code) as StoredAuthCode | undefined;
}

export function deleteAuthCode(code: string): void {
  db.prepare("DELETE FROM auth_codes WHERE code = ?").run(code);
}

// ---------- Access Tokens ----------

export interface StoredToken {
  token: string;
  client_id: string;
  scopes: string | null;
  resource: string | null;
  expires_at: number;
}

export function storeAccessToken(data: StoredToken): void {
  db.prepare(
    "INSERT INTO access_tokens (token, client_id, scopes, resource, expires_at) VALUES (?, ?, ?, ?, ?)"
  ).run(data.token, data.client_id, data.scopes, data.resource, data.expires_at);
}

export function getAccessToken(token: string): StoredToken | undefined {
  return db.prepare("SELECT * FROM access_tokens WHERE token = ?").get(token) as StoredToken | undefined;
}

export function deleteAccessToken(token: string): void {
  db.prepare("DELETE FROM access_tokens WHERE token = ?").run(token);
}
