/**
 * Onboarding landing page served at /.
 *
 * Shows a sign-up form (email only). On submit, creates a user and shows
 * their API key plus step-by-step setup instructions for Claude Code,
 * Claude Desktop, ChatGPT, and Gemini.
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
    <p class="features">Look up license plates, check APK status, find recalls, search by brand, and more — all through natural language.</p>
    ${error ? `<p class="error">${error}</p>` : ""}
    <form method="POST" action="/signup">
      <label for="email">Email address</label>
      <input type="email" id="email" name="email" required placeholder="you@example.com">
      <button type="submit">Get API Key</button>
    </form>
    <p class="hint">Free to use. Your email is only used to identify your API key.</p>
  </div>
</body>
</html>`;
}

function successPage(email: string, apiKey: string): string {
  const domain = RAILWAY_DOMAIN();
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const mcpUrl = `${protocol}://${domain}/mcp`;
  const claudeCodeCmd = `claude mcp add --transport http rdw-mcp ${mcpUrl} --header "Authorization: Bearer ${apiKey}"`;

  const desktopConfig = JSON.stringify({
    mcpServers: {
      rdw: {
        command: "npx",
        args: ["mcp-remote", mcpUrl, "--header", `Authorization: Bearer ${apiKey}`],
      },
    },
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RDW MCP — Your API Key</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="card wide">
    <h1>You're all set!</h1>
    <p class="subtitle">Welcome, <strong>${escapeHtml(email)}</strong></p>

    <div class="key-section">
      <label>Your API Key</label>
      <div class="code-box copyable" onclick="copyText(this)" title="Click to copy">${escapeHtml(apiKey)}</div>
      <p class="hint">Save this key — you'll need it below to connect your AI agent.</p>
      <div class="info-box">
        <strong>Only this key is needed.</strong> The RDW open data API is public — this MCP server handles all communication with <code>opendata.rdw.nl</code> for you. You do <em>not</em> need to register at the RDW or obtain a separate API key from them.
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('claude-code')">Claude Code</button>
      <button class="tab" onclick="showTab('claude-desktop')">Claude Desktop</button>
      <button class="tab" onclick="showTab('chatgpt')">ChatGPT</button>
      <button class="tab" onclick="showTab('gemini')">Gemini</button>
    </div>

    <!-- Claude Code -->
    <div id="tab-claude-code" class="tab-content active">
      <h2>Connect with Claude Code (CLI)</h2>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Open your terminal</strong>
            <p>Make sure you have <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank">Claude Code</a> installed.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Run this command</strong>
            <div class="code-box copyable small" onclick="copyText(this)" title="Click to copy">${escapeHtml(claudeCodeCmd)}</div>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Start using it</strong>
            <p>Ask Claude things like: <em>"Look up license plate AB-123-C"</em> or <em>"What's the APK status of 12-ABC-3?"</em></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Claude Desktop -->
    <div id="tab-claude-desktop" class="tab-content">
      <h2>Connect with Claude Desktop</h2>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Install Node.js</strong>
            <p>Download and install from <a href="https://nodejs.org" target="_blank">nodejs.org</a> (LTS version). Restart your computer after installing.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Open Claude Desktop settings</strong>
            <p>Go to <strong>Settings</strong> &rarr; <strong>Developer</strong> &rarr; <strong>Edit Config</strong></p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Add the MCP server config</strong>
            <p>Merge this into your <code>claude_desktop_config.json</code>:</p>
            <div class="code-box copyable small" onclick="copyText(this)" title="Click to copy">${escapeHtml(desktopConfig)}</div>
            <p class="hint">If you already have other settings in the file, add the <code>"mcpServers"</code> block alongside them.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <div>
            <strong>Restart Claude Desktop</strong>
            <p>Fully quit (system tray &rarr; Quit) and reopen. Check <strong>Settings &rarr; Developer</strong> — "rdw" should show as connected.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">5</span>
          <div>
            <strong>Start using it</strong>
            <p>Ask Claude things like: <em>"Look up license plate AB-123-C"</em> or <em>"Check the APK status of my car 12-ABC-3"</em></p>
          </div>
        </div>
      </div>
    </div>

    <!-- ChatGPT -->
    <div id="tab-chatgpt" class="tab-content">
      <h2>Connect with ChatGPT</h2>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Open ChatGPT settings</strong>
            <p>In <a href="https://chatgpt.com" target="_blank">ChatGPT</a> (Plus/Team/Enterprise required), click your profile icon &rarr; <strong>Settings</strong>.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Go to the MCP section</strong>
            <p>Navigate to <strong>Settings</strong> &rarr; <strong>Tools &amp; integrations</strong> &rarr; <strong>MCP Servers</strong> &rarr; <strong>Add MCP Server</strong>.</p>
            <p class="hint">If you don't see this option, MCP support may not be available on your plan yet. Check <a href="https://help.openai.com" target="_blank">OpenAI's documentation</a> for the latest availability.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Enter the server URL</strong>
            <div class="code-box copyable small" onclick="copyText(this)" title="Click to copy">${escapeHtml(mcpUrl)}</div>
          </div>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <div>
            <strong>Add authentication</strong>
            <p>Set the authentication type to <strong>Bearer Token</strong> and paste your API key:</p>
            <div class="code-box copyable small" onclick="copyText(this)" title="Click to copy">${escapeHtml(apiKey)}</div>
          </div>
        </div>
        <div class="step">
          <span class="step-num">5</span>
          <div>
            <strong>Start using it</strong>
            <p>In any chat, ask: <em>"Look up Dutch license plate AB-123-C"</em> or <em>"Search for all Tesla models in the RDW database"</em></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gemini -->
    <div id="tab-gemini" class="tab-content">
      <h2>Connect with Gemini</h2>
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Open Google AI Studio</strong>
            <p>Go to <a href="https://aistudio.google.com" target="_blank">Google AI Studio</a> and sign in with your Google account.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Create or open a project</strong>
            <p>Open an existing project or create a new one.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Add MCP Server tool</strong>
            <p>In the left panel, find <strong>Tools</strong> and click <strong>Add MCP Server</strong> (or use the tool configuration panel).</p>
            <p class="hint">MCP support in Gemini may be limited to Google AI Studio. Check <a href="https://ai.google.dev" target="_blank">Google's AI documentation</a> for the latest on MCP support.</p>
          </div>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <div>
            <strong>Enter the server URL</strong>
            <div class="code-box copyable small" onclick="copyText(this)" title="Click to copy">${escapeHtml(mcpUrl)}</div>
          </div>
        </div>
        <div class="step">
          <span class="step-num">5</span>
          <div>
            <strong>Configure authentication</strong>
            <p>Add a custom header for authentication:</p>
            <div class="code-box small">Header: <strong>Authorization</strong><br>Value: <strong>Bearer ${escapeHtml(apiKey)}</strong></div>
          </div>
        </div>
        <div class="step">
          <span class="step-num">6</span>
          <div>
            <strong>Start using it</strong>
            <p>Ask Gemini things like: <em>"Look up Dutch license plate AB-123-C"</em> or <em>"What recalls exist for my car 12-ABC-3?"</em></p>
          </div>
        </div>
      </div>
    </div>

    <div class="tools-section">
      <h2>Available Tools</h2>
      <div class="tools-grid">
        <div class="tool"><strong>rdw_kenteken_zoeken</strong><span>Quick license plate lookup</span></div>
        <div class="tool"><strong>rdw_voertuig_details</strong><span>Full vehicle details</span></div>
        <div class="tool"><strong>rdw_apk_status</strong><span>APK (MOT) inspection status</span></div>
        <div class="tool"><strong>rdw_terugroep_acties</strong><span>Recall actions lookup</span></div>
        <div class="tool"><strong>rdw_merk_zoeken</strong><span>Search by brand</span></div>
        <div class="tool"><strong>rdw_slim_zoeken</strong><span>Natural language search</span></div>
      </div>
    </div>
  </div>

  <script>
    function showTab(id) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelector('[onclick="showTab(\\'' + id + '\\')"]').classList.add('active');
      document.getElementById('tab-' + id).classList.add('active');
    }

    function copyText(el) {
      const text = el.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const orig = el.getAttribute('title');
        el.setAttribute('title', 'Copied!');
        el.classList.add('copied');
        setTimeout(() => {
          el.setAttribute('title', orig);
          el.classList.remove('copied');
        }, 2000);
      });
    }
  </script>
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
  .card.wide{max-width:680px}
  h1{font-size:1.5rem;margin-bottom:.4rem;color:#1a1a2e}
  h2{font-size:1.15rem;margin-bottom:.8rem;color:#1a1a2e;margin-top:.5rem}
  .subtitle{color:#555;margin-bottom:.5rem;font-size:.95rem}
  .features{color:#6b7280;margin-bottom:1.5rem;font-size:.9rem;line-height:1.5}
  .error{color:#dc2626;margin-bottom:1rem;font-size:.9rem}
  label{display:block;font-weight:600;margin-bottom:.4rem;font-size:.9rem;margin-top:1rem}
  input[type=email]{width:100%;padding:.65rem .8rem;border:1px solid #d1d5db;
       border-radius:8px;font-size:1rem;margin-bottom:1rem}
  button{padding:.7rem 1.2rem;background:#2563eb;color:#fff;font-size:1rem;
         border:none;border-radius:8px;cursor:pointer;font-weight:600}
  button:hover{background:#1d4ed8}
  form button{width:100%}
  .code-box{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:.7rem .9rem;
            font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
            font-size:.9rem;margin-bottom:.5rem;word-break:break-all;position:relative}
  .code-box.small{font-size:.82rem}
  .code-box.copyable{cursor:pointer;transition:border-color .2s}
  .code-box.copyable:hover{border-color:#2563eb}
  .code-box.copied{border-color:#16a34a}
  .hint{color:#6b7280;font-size:.85rem;margin-top:.5rem}

  .info-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.7rem .9rem;
            font-size:.85rem;color:#1e40af;margin-top:.8rem;line-height:1.5}
  .info-box strong{color:#1e3a8a}
  .info-box code{background:#dbeafe;padding:.1rem .3rem;border-radius:3px;font-size:.8rem}

  .key-section{margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid #e5e7eb}

  .tabs{display:flex;gap:.4rem;margin:1.5rem 0 0;border-bottom:2px solid #e5e7eb;padding-bottom:0}
  .tab{background:none;color:#6b7280;border:none;padding:.6rem 1rem;font-size:.9rem;
       font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;
       border-radius:0}
  .tab:hover{color:#1a1a2e;background:none}
  .tab.active{color:#2563eb;border-bottom-color:#2563eb;background:none}

  .tab-content{display:none;padding-top:1.2rem}
  .tab-content.active{display:block}

  .steps{display:flex;flex-direction:column;gap:1rem}
  .step{display:flex;gap:.8rem;align-items:flex-start}
  .step-num{background:#2563eb;color:#fff;width:26px;height:26px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;font-size:.8rem;
            font-weight:700;flex-shrink:0;margin-top:.1rem}
  .step div{flex:1}
  .step strong{display:block;margin-bottom:.2rem}
  .step p{color:#555;font-size:.9rem;line-height:1.5;margin-top:.2rem}
  .step a{color:#2563eb;text-decoration:none}
  .step a:hover{text-decoration:underline}
  .step code{background:#f1f5f9;padding:.1rem .4rem;border-radius:4px;font-size:.85rem}
  .step em{color:#6b7280;font-style:italic}

  .tools-section{margin-top:2rem;padding-top:1.5rem;border-top:1px solid #e5e7eb}
  .tools-grid{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
  .tool{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:.6rem .8rem}
  .tool strong{display:block;font-size:.8rem;color:#1a1a2e}
  .tool span{font-size:.78rem;color:#6b7280}

  @media(max-width:600px){
    .tabs{flex-wrap:wrap}
    .tab{font-size:.8rem;padding:.5rem .7rem}
    .tools-grid{grid-template-columns:1fr}
    .card{padding:1.5rem}
  }
`;
