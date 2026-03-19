/**
 * SQLite user database for API key management.
 *
 * Stores users (email + UUID API key) and validates bearer tokens.
 */

import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DB_PATH || "./data/users.db";

let db: Database.Database;

export function initDb(): void {
  // Ensure parent directory exists
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
  `);
}

/**
 * Check whether an API key exists in the database.
 */
export function validateApiKey(key: string): boolean {
  const row = db.prepare("SELECT 1 FROM users WHERE api_key = ?").get(key);
  return row !== undefined;
}

/**
 * Create a new user. Returns the generated API key.
 * If the email already exists, returns the existing key.
 */
export function createUser(email: string): string {
  const existing = db
    .prepare("SELECT api_key FROM users WHERE email = ?")
    .get(email) as { api_key: string } | undefined;

  if (existing) return existing.api_key;

  const apiKey = uuidv4();
  db.prepare("INSERT INTO users (email, api_key) VALUES (?, ?)").run(
    email,
    apiKey,
  );
  return apiKey;
}
