/**
 * Onboarding landing page served at /.
 *
 * Shows a sign-up form (email only). On submit, creates a user and shows
 * their API key plus the exact command to connect Claude Code.
 */

import { Router, Request, Response } from "express";
import { createUser } from "./db.js";

const RAILWAY_DOMAIN = () => process.env.RAILWAY_PUBLIC_DOMAIN || "localhost:8000";

export function landingRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.type("html").send(signupPage());
  });

  router.post("/signup", (req: Request, res: Response) => {
    const email = (req.body as Record<string, string>).email;
    if (!email) {
      res.status(400).type("html").send(signupPage("Please enter a valid email address."));
      return;
    }

    const apiKey = createUser(email);
    res.type("html").send(successPage(email, apiKey));
  });

  return router;
}

function signupPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RDW MCP</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="card">
    <h1>RDW MCP</h1>
    <p class="subtitle">Connect your AI agent to the official Dutch RDW vehicle database</p>
    ${error ? `<p class="error">${error}</p>` : ""}
    <form method="POST" action="/signup">
      <label for="email">Email address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com">
      <button type="submit">Get API Key</button>
    </form>
  </div>
</body>
</html>`;
}

function successPage(email: string, apiKey: string): string {
  const domain = RAILWAY_DOMAIN();
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const mcpUrl = `${protocol}://${domain}/mcp`;
  const cmd = `claude mcp add --transport http rdw-mcp ${mcpUrl} --header "Authorization: Bearer ${apiKey}"`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RDW MCP — Your API Key</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="card">
    <h1>You're all set!</h1>
    <p class="subtitle">Welcome, <strong>${escapeHtml(email)}</strong></p>

    <label>Your API Key</label>
    <div class="code-box">${escapeHtml(apiKey)}</div>

    <label>Connect Claude Code</label>
    <div class="code-box" style="font-size:.82rem;word-break:break-all">${escapeHtml(cmd)}</div>

    <p class="hint">Run the command above in your terminal to connect Claude Code to RDW data.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       background:#f5f7fa;display:flex;align-items:center;justify-content:center;
       min-height:100vh;padding:1rem}
  .card{background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);
        padding:2.5rem;max-width:520px;width:100%}
  h1{font-size:1.5rem;margin-bottom:.4rem;color:#1a1a2e}
  .subtitle{color:#555;margin-bottom:1.5rem;font-size:.95rem}
  .error{color:#dc2626;margin-bottom:1rem;font-size:.9rem}
  label{display:block;font-weight:600;margin-bottom:.4rem;font-size:.9rem;margin-top:1rem}
  input[type=email]{width:100%;padding:.65rem .8rem;border:1px solid #d1d5db;
       border-radius:8px;font-size:1rem;margin-bottom:1rem}
  button{width:100%;padding:.7rem;background:#2563eb;color:#fff;font-size:1rem;
         border:none;border-radius:8px;cursor:pointer;font-weight:600}
  button:hover{background:#1d4ed8}
  .code-box{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:.7rem .9rem;
            font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
            font-size:.9rem;margin-bottom:.5rem;user-select:all;word-break:break-all}
  .hint{color:#6b7280;font-size:.85rem;margin-top:1rem}
`;
