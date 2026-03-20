/**
 * Landing page & onboarding — Dutch-language, accessible to non-technical users.
 *
 * Routes:
 *   GET  /           — landing page with platform picker
 *   GET  /setup/:id  — platform-specific setup instructions
 *   POST /signup     — email signup (for ChatGPT/Gemini Bearer token flow)
 */

import { Router, Request, Response } from "express";
import { createUser } from "./db.js";

const RAILWAY_DOMAIN = () => process.env.RAILWAY_PUBLIC_DOMAIN || "localhost:8000";

export function landingRouter(): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.type("html").send(landingPage());
  });

  router.get("/setup/claude-desktop", (_req: Request, res: Response) => {
    res.type("html").send(setupClaudeDesktop());
  });

  router.get("/setup/chatgpt", (_req: Request, res: Response) => {
    res.type("html").send(setupChatGPT());
  });

  router.get("/setup/gemini", (_req: Request, res: Response) => {
    res.type("html").send(setupGemini());
  });

  router.get("/setup/claude-code", (_req: Request, res: Response) => {
    res.type("html").send(setupClaudeCode());
  });

  // Email signup for ChatGPT/Gemini (Bearer token flow)
  router.post("/signup", (req: Request, res: Response) => {
    const email = (req.body as Record<string, string>).email;
    const platform = (req.body as Record<string, string>).platform || "chatgpt";
    if (!email) {
      res.status(400).type("html").send(signupPage(platform, "Vul een geldig e-mailadres in."));
      return;
    }
    const apiKey = createUser(email);
    res.type("html").send(signupSuccessPage(email, apiKey, platform));
  });

  router.get("/signup", (req: Request, res: Response) => {
    const platform = (req.query as Record<string, string>).platform || "chatgpt";
    res.type("html").send(signupPage(platform));
  });

  return router;
}

// ---------- Pages ----------

function landingPage(): string {
  return page("RDW MCP — Vraag je AI alles over voertuigdata", `
  <div class="hero">
    <div class="hero-badge">Open source &middot; Gratis</div>
    <h1>RDW Voertuigdata voor je AI</h1>
    <p class="hero-sub">Stel vragen over kentekens, APK-status, terugroepacties en meer — direct vanuit je favoriete AI-app.</p>
  </div>

  <div class="features">
    <div class="feature-card">
      <div class="feature-icon">🔍</div>
      <h3>Kenteken opzoeken</h3>
      <p>&ldquo;Wat voor auto is AB-123-C?&rdquo;</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">✅</div>
      <h3>APK-status</h3>
      <p>&ldquo;Is de APK van mijn auto nog geldig?&rdquo;</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">⚠️</div>
      <h3>Terugroepacties</h3>
      <p>&ldquo;Zijn er recalls voor mijn auto?&rdquo;</p>
    </div>
  </div>

  <div class="section">
    <h2>Kies je AI-app om te beginnen</h2>
    <p class="section-sub">Klik op de app die je gebruikt. We helpen je stap voor stap.</p>
    <div class="platform-grid">
      <a href="/setup/claude-desktop" class="platform-card">
        <div class="platform-name">Claude Desktop</div>
        <div class="platform-desc">Desktop app van Anthropic</div>
        <div class="platform-tag easy">Makkelijkst</div>
      </a>
      <a href="/setup/chatgpt" class="platform-card">
        <div class="platform-name">ChatGPT</div>
        <div class="platform-desc">OpenAI&apos;s chat interface</div>
        <div class="platform-tag">Plus/Team vereist</div>
      </a>
      <a href="/setup/gemini" class="platform-card">
        <div class="platform-name">Gemini</div>
        <div class="platform-desc">Google AI Studio</div>
        <div class="platform-tag">AI Studio</div>
      </a>
      <a href="/setup/claude-code" class="platform-card">
        <div class="platform-name">Claude Code</div>
        <div class="platform-desc">CLI voor developers</div>
        <div class="platform-tag dev">Developers</div>
      </a>
    </div>
  </div>

  <div class="section faq">
    <h2>Veelgestelde vragen</h2>
    <details>
      <summary>Wat is een MCP server?</summary>
      <p>MCP (Model Context Protocol) is een manier om AI-apps extra mogelijkheden te geven. Deze server geeft je AI toegang tot de officiële RDW-database met voertuiggegevens.</p>
    </details>
    <details>
      <summary>Is het gratis?</summary>
      <p>Ja, deze server is volledig gratis. De RDW voertuigdata is openbaar beschikbaar — wij maken het alleen makkelijk om die data vanuit je AI te gebruiken.</p>
    </details>
    <details>
      <summary>Welke gegevens worden opgeslagen?</summary>
      <p>Alleen je e-mailadres (als je dat invult voor ChatGPT/Gemini). Er worden geen voertuiggegevens of zoekopdrachten opgeslagen.</p>
    </details>
  </div>
  `);
}

function setupClaudeDesktop(): string {
  const domain = RAILWAY_DOMAIN();
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const mcpUrl = `${protocol}://${domain}/mcp`;

  return page("Claude Desktop instellen — RDW MCP", `
  <a href="/" class="back-link">&larr; Terug naar overzicht</a>
  <h1>Claude Desktop instellen</h1>
  <p class="page-sub">In 4 stappen heb je toegang tot RDW voertuigdata vanuit Claude Desktop. Er wordt automatisch ingelogd via je browser — geen API key nodig.</p>

  <div class="steps">
    <div class="step">
      <span class="step-num">1</span>
      <div>
        <strong>Installeer Node.js</strong>
        <p>Download de <strong>LTS-versie</strong> van <a href="https://nodejs.org" target="_blank">nodejs.org</a> en installeer deze. <strong>Herstart je computer</strong> na de installatie.</p>
        <div class="info-box">Heb je Node.js al? Dan kun je deze stap overslaan.</div>
      </div>
    </div>
    <div class="step">
      <span class="step-num">2</span>
      <div>
        <strong>Open de Claude Desktop instellingen</strong>
        <p>Open Claude Desktop en ga naar:</p>
        <p><strong>Settings</strong> &rarr; <strong>Developer</strong> &rarr; <strong>Edit Config</strong></p>
        <p>Er opent een bestand genaamd <code>claude_desktop_config.json</code>. <strong>Kopieer de volledige inhoud</strong> van dat bestand.</p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">3</span>
      <div>
        <strong>Voeg de RDW server toe</strong>
        <p>Plak hieronder de inhoud van je config-bestand. Wij voegen de RDW server er automatisch aan toe.</p>

        <div class="config-tool">
          <div class="os-toggle">
            <button type="button" class="os-btn active" onclick="setOS('windows')">Windows</button>
            <button type="button" class="os-btn" onclick="setOS('mac')">Mac / Linux</button>
          </div>

          <label for="config-input">Plak hier je huidige config (mag ook leeg zijn):</label>
          <textarea id="config-input" rows="8" placeholder="Plak hier de inhoud van claude_desktop_config.json..."></textarea>
          <button type="button" class="btn full" onclick="mergeConfig()">Voeg RDW toe</button>

          <div id="config-error" class="error" style="display:none"></div>

          <div id="config-result" style="display:none">
            <label>Klaar! Kopieer dit en plak het terug in je config-bestand:</label>
            <div class="code-box copyable" id="config-output" onclick="copyText(this)" title="Klik om te kopiëren"></div>
            <div class="info-box">De RDW server is toegevoegd. Al je bestaande instellingen blijven behouden.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="step">
      <span class="step-num">4</span>
      <div>
        <strong>Herstart Claude Desktop</strong>
        <p>Sluit Claude Desktop volledig af (rechtermuisknop op het icoon in de taakbalk &rarr; <strong>Quit</strong>) en open het opnieuw.</p>
        <p>Je browser opent automatisch een inlogpagina — vul je e-mailadres in en je bent klaar!</p>
      </div>
    </div>
  </div>

  <div class="try-section">
    <h2>Probeer het uit!</h2>
    <p>Stel Claude een vraag zoals:</p>
    <ul class="examples">
      <li>&ldquo;Wat voor auto is <strong>AB-123-C</strong>?&rdquo;</li>
      <li>&ldquo;Is de APK van kenteken <strong>12-ABC-3</strong> nog geldig?&rdquo;</li>
      <li>&ldquo;Zijn er terugroepacties voor mijn auto?&rdquo;</li>
      <li>&ldquo;Zoek alle Tesla&apos;s in de RDW database&rdquo;</li>
    </ul>
  </div>

  <script>
    var currentOS = 'windows';
    var mcpUrl = '${mcpUrl}';

    function setOS(os) {
      currentOS = os;
      document.querySelectorAll('.os-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelector('.os-btn' + (os === 'windows' ? ':first-child' : ':last-child')).classList.add('active');
      // Re-run merge if there's already a result showing
      if (document.getElementById('config-result').style.display !== 'none') {
        mergeConfig();
      }
    }

    function mergeConfig() {
      var input = document.getElementById('config-input').value.trim();
      var errorEl = document.getElementById('config-error');
      var resultEl = document.getElementById('config-result');
      var outputEl = document.getElementById('config-output');

      errorEl.style.display = 'none';
      resultEl.style.display = 'none';

      var config;
      if (!input || input === '') {
        config = {};
      } else {
        try {
          config = JSON.parse(input);
        } catch (e) {
          errorEl.textContent = 'Dit is geen geldige JSON. Kopieer de volledige inhoud van je config-bestand en probeer opnieuw.';
          errorEl.style.display = 'block';
          return;
        }
      }

      if (typeof config !== 'object' || Array.isArray(config)) {
        errorEl.textContent = 'De config moet een JSON object zijn (begint met { en eindigt met }).';
        errorEl.style.display = 'block';
        return;
      }

      // Ensure mcpServers exists
      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        config.mcpServers = {};
      }

      // Add rdw server
      config.mcpServers.rdw = {
        command: currentOS === 'windows' ? 'npx.cmd' : 'npx',
        args: ['-y', 'mcp-remote', mcpUrl]
      };

      outputEl.textContent = JSON.stringify(config, null, 2);
      resultEl.style.display = 'block';
    }
  </script>
  `);
}

function setupChatGPT(): string {
  const domain = RAILWAY_DOMAIN();
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const mcpUrl = `${protocol}://${domain}/mcp`;

  return page("ChatGPT instellen — RDW MCP", `
  <a href="/" class="back-link">&larr; Terug naar overzicht</a>
  <h1>ChatGPT instellen</h1>
  <p class="page-sub">Verbind ChatGPT met de RDW database. Je hebt een ChatGPT Plus-, Team- of Enterprise-account nodig.</p>

  <div class="steps">
    <div class="step">
      <span class="step-num">1</span>
      <div>
        <strong>Maak eerst een account aan</strong>
        <p>Je hebt een API-sleutel nodig om ChatGPT te verbinden.</p>
        <a href="/signup?platform=chatgpt" class="btn">Account aanmaken &rarr;</a>
      </div>
    </div>
    <div class="step">
      <span class="step-num">2</span>
      <div>
        <strong>Open ChatGPT instellingen</strong>
        <p>Ga naar <a href="https://chatgpt.com" target="_blank">chatgpt.com</a>, klik op je profielfoto &rarr; <strong>Settings</strong>.</p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">3</span>
      <div>
        <strong>Voeg de MCP server toe</strong>
        <p>Ga naar <strong>Tools &amp; integrations</strong> &rarr; <strong>MCP Servers</strong> &rarr; <strong>Add MCP Server</strong>.</p>
        <p>Voer deze URL in:</p>
        <div class="code-box copyable" onclick="copyText(this)" title="Klik om te kopiëren">${escapeHtml(mcpUrl)}</div>
      </div>
    </div>
    <div class="step">
      <span class="step-num">4</span>
      <div>
        <strong>Stel authenticatie in</strong>
        <p>Kies <strong>Bearer Token</strong> als authenticatietype en plak de API-sleutel die je in stap 1 hebt ontvangen.</p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">5</span>
      <div>
        <strong>Klaar!</strong>
        <p>Stel ChatGPT een vraag over een kenteken, APK-status of terugroepactie.</p>
      </div>
    </div>
  </div>
  `);
}

function setupGemini(): string {
  const domain = RAILWAY_DOMAIN();
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const mcpUrl = `${protocol}://${domain}/mcp`;

  return page("Gemini instellen — RDW MCP", `
  <a href="/" class="back-link">&larr; Terug naar overzicht</a>
  <h1>Gemini instellen</h1>
  <p class="page-sub">Verbind Google Gemini via AI Studio met de RDW database.</p>

  <div class="steps">
    <div class="step">
      <span class="step-num">1</span>
      <div>
        <strong>Maak eerst een account aan</strong>
        <p>Je hebt een API-sleutel nodig om Gemini te verbinden.</p>
        <a href="/signup?platform=gemini" class="btn">Account aanmaken &rarr;</a>
      </div>
    </div>
    <div class="step">
      <span class="step-num">2</span>
      <div>
        <strong>Open Google AI Studio</strong>
        <p>Ga naar <a href="https://aistudio.google.com" target="_blank">Google AI Studio</a> en log in met je Google-account.</p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">3</span>
      <div>
        <strong>Voeg een MCP server toe</strong>
        <p>Klik in het linkerpaneel op <strong>Tools</strong> &rarr; <strong>Add MCP Server</strong>.</p>
        <p>Voer deze URL in:</p>
        <div class="code-box copyable" onclick="copyText(this)" title="Klik om te kopiëren">${escapeHtml(mcpUrl)}</div>
      </div>
    </div>
    <div class="step">
      <span class="step-num">4</span>
      <div>
        <strong>Stel authenticatie in</strong>
        <p>Voeg een custom header toe:</p>
        <div class="code-box">Header: <strong>Authorization</strong><br>Value: <strong>Bearer</strong> <em>[jouw API-sleutel uit stap 1]</em></div>
      </div>
    </div>
    <div class="step">
      <span class="step-num">5</span>
      <div>
        <strong>Klaar!</strong>
        <p>Stel Gemini een vraag over een kenteken, APK-status of terugroepactie.</p>
      </div>
    </div>
  </div>
  `);
}

function setupClaudeCode(): string {
  const domain = RAILWAY_DOMAIN();
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const mcpUrl = `${protocol}://${domain}/mcp`;

  return page("Claude Code instellen — RDW MCP", `
  <a href="/" class="back-link">&larr; Terug naar overzicht</a>
  <h1>Claude Code instellen</h1>
  <p class="page-sub">Eén commando in je terminal en je bent klaar.</p>

  <div class="steps">
    <div class="step">
      <span class="step-num">1</span>
      <div>
        <strong>Open je terminal</strong>
        <p>Zorg dat je <a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank">Claude Code</a> geïnstalleerd hebt.</p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">2</span>
      <div>
        <strong>Voer dit commando uit</strong>
        <div class="code-box copyable" onclick="copyText(this)" title="Klik om te kopiëren">claude mcp add --transport http rdw-mcp ${escapeHtml(mcpUrl)}</div>
        <p>Je browser opent automatisch om in te loggen met je e-mailadres.</p>
      </div>
    </div>
    <div class="step">
      <span class="step-num">3</span>
      <div>
        <strong>Klaar!</strong>
        <p>Vraag Claude Code dingen als: <em>&ldquo;Zoek kenteken AB-123-C op&rdquo;</em> of <em>&ldquo;Check de APK-status van 12-ABC-3&rdquo;</em></p>
      </div>
    </div>
  </div>
  `);
}

function signupPage(platform: string, error?: string): string {
  const platformName = platform === "gemini" ? "Gemini" : "ChatGPT";
  return page(`Account aanmaken — RDW MCP`, `
  <a href="/setup/${escapeHtml(platform)}" class="back-link">&larr; Terug naar ${escapeHtml(platformName)} setup</a>
  <h1>Account aanmaken</h1>
  <p class="page-sub">Vul je e-mailadres in om een API-sleutel te ontvangen. Deze heb je nodig om ${escapeHtml(platformName)} te verbinden.</p>
  ${error ? `<p class="error">${error}</p>` : ""}
  <form method="POST" action="/signup">
    <input type="hidden" name="platform" value="${escapeHtml(platform)}">
    <label for="email">E-mailadres</label>
    <input type="email" id="email" name="email" required placeholder="naam@voorbeeld.nl">
    <button type="submit" class="btn full">API-sleutel aanvragen</button>
  </form>
  <p class="hint">Gratis. Je e-mailadres wordt alleen gebruikt om je API-sleutel aan te koppelen.</p>
  `);
}

function signupSuccessPage(email: string, apiKey: string, platform: string): string {
  const platformName = platform === "gemini" ? "Gemini" : "ChatGPT";
  return page(`Je API-sleutel — RDW MCP`, `
  <a href="/setup/${escapeHtml(platform)}" class="back-link">&larr; Terug naar ${escapeHtml(platformName)} setup</a>
  <h1>Je API-sleutel is klaar!</h1>
  <p class="page-sub">Welkom, <strong>${escapeHtml(email)}</strong></p>

  <div class="key-section">
    <label>Jouw API-sleutel</label>
    <div class="code-box copyable" onclick="copyText(this)" title="Klik om te kopiëren">${escapeHtml(apiKey)}</div>
    <p class="hint">Bewaar deze sleutel goed — je hebt hem nodig in de volgende stappen.</p>
  </div>

  <div class="info-box">
    <strong>Alleen deze sleutel is nodig.</strong> De RDW-data is openbaar — deze server regelt alle communicatie met de RDW voor je. Je hoeft je niet apart bij de RDW te registreren.
  </div>

  <a href="/setup/${escapeHtml(platform)}" class="btn" style="margin-top:1.5rem;display:inline-block;">Ga verder met de installatie &rarr;</a>
  `);
}

// ---------- Helpers ----------

function page(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="container">${content}</div>
  <script>
    function copyText(el) {
      var text = el.innerText;
      navigator.clipboard.writeText(text).then(function() {
        el.classList.add('copied');
        var orig = el.getAttribute('title');
        el.setAttribute('title', 'Gekopieerd!');
        setTimeout(function() {
          el.classList.remove('copied');
          el.setAttribute('title', orig);
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
       background:#f5f7fa;min-height:100vh;padding:2rem 1rem;color:#1a1a2e}
  a{color:#2563eb;text-decoration:none}
  a:hover{text-decoration:underline}
  code{background:#f1f5f9;padding:.1rem .4rem;border-radius:4px;font-size:.85rem}

  .container{max-width:680px;margin:0 auto}

  /* Hero */
  .hero{text-align:center;padding:2rem 0 1.5rem}
  .hero-badge{display:inline-block;background:#ecfdf5;color:#065f46;font-size:.8rem;
              font-weight:600;padding:.3rem .8rem;border-radius:20px;margin-bottom:1rem;
              border:1px solid #a7f3d0}
  .hero h1{font-size:1.8rem;margin-bottom:.6rem;line-height:1.3}
  .hero-sub{color:#555;font-size:1.05rem;max-width:500px;margin:0 auto;line-height:1.6}

  /* Feature cards */
  .features{display:grid;grid-template-columns:repeat(3,1fr);gap:.8rem;margin:1.5rem 0 2.5rem}
  .feature-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1.2rem;
                text-align:center}
  .feature-icon{font-size:1.5rem;margin-bottom:.5rem}
  .feature-card h3{font-size:.95rem;margin-bottom:.3rem}
  .feature-card p{color:#6b7280;font-size:.85rem;font-style:italic}

  /* Sections */
  .section{background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:2rem;margin-bottom:1.5rem}
  .section h2{font-size:1.2rem;margin-bottom:.3rem}
  .section-sub{color:#6b7280;font-size:.9rem;margin-bottom:1.2rem}

  /* Platform grid */
  .platform-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}
  .platform-card{display:block;background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;
                 padding:1.2rem;text-decoration:none;transition:border-color .2s,box-shadow .2s}
  .platform-card:hover{border-color:#2563eb;box-shadow:0 2px 8px rgba(37,99,235,.15);text-decoration:none}
  .platform-name{font-size:1rem;font-weight:700;color:#1a1a2e;margin-bottom:.2rem}
  .platform-desc{font-size:.85rem;color:#6b7280;margin-bottom:.5rem}
  .platform-tag{display:inline-block;font-size:.75rem;font-weight:600;padding:.2rem .5rem;
                border-radius:6px;background:#f1f5f9;color:#6b7280}
  .platform-tag.easy{background:#ecfdf5;color:#065f46}
  .platform-tag.dev{background:#eff6ff;color:#1e40af}

  /* FAQ */
  .faq details{border-bottom:1px solid #e5e7eb;padding:.8rem 0}
  .faq details:last-child{border-bottom:none}
  .faq summary{font-weight:600;cursor:pointer;font-size:.95rem;padding:.2rem 0}
  .faq summary:hover{color:#2563eb}
  .faq details p{color:#555;font-size:.9rem;line-height:1.6;margin-top:.5rem}

  /* Setup pages */
  .back-link{display:inline-block;color:#6b7280;font-size:.9rem;margin-bottom:1.5rem}
  .back-link:hover{color:#2563eb}
  h1{font-size:1.5rem;margin-bottom:.4rem}
  .page-sub{color:#555;font-size:.95rem;margin-bottom:1.5rem;line-height:1.5}

  /* Steps */
  .steps{display:flex;flex-direction:column;gap:1.2rem;margin:1.5rem 0}
  .step{display:flex;gap:.8rem;align-items:flex-start;background:#fff;border:1px solid #e2e8f0;
        border-radius:12px;padding:1.2rem}
  .step-num{background:#2563eb;color:#fff;width:28px;height:28px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;font-size:.85rem;
            font-weight:700;flex-shrink:0;margin-top:.1rem}
  .step > div{flex:1}
  .step strong{display:block;margin-bottom:.3rem;font-size:1rem}
  .step p{color:#555;font-size:.9rem;line-height:1.5;margin-top:.3rem}

  /* Code blocks */
  .code-box{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:.7rem .9rem;
            font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
            font-size:.82rem;margin:.5rem 0;word-break:break-all;white-space:pre-wrap;position:relative}
  .code-box.copyable{cursor:pointer;transition:border-color .2s}
  .code-box.copyable:hover{border-color:#2563eb}
  .code-box.copied{border-color:#16a34a}

  /* Info boxes */
  .info-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.7rem .9rem;
            font-size:.85rem;color:#1e40af;margin-top:.8rem;line-height:1.5}
  .info-box strong{color:#1e3a8a}

  /* Forms & buttons */
  label{display:block;font-weight:600;margin-bottom:.4rem;font-size:.9rem;margin-top:1rem}
  input[type=email]{width:100%;padding:.65rem .8rem;border:1px solid #d1d5db;
       border-radius:8px;font-size:1rem;margin-bottom:1rem}
  .btn{display:inline-block;padding:.7rem 1.4rem;background:#2563eb;color:#fff;font-size:1rem;
       border:none;border-radius:8px;cursor:pointer;font-weight:600;text-decoration:none;
       text-align:center}
  .btn:hover{background:#1d4ed8;text-decoration:none}
  .btn.full{width:100%}
  .hint{color:#6b7280;font-size:.85rem;margin-top:.5rem}
  .error{color:#dc2626;margin-bottom:1rem;font-size:.9rem}

  /* Key section */
  .key-section{margin:1.5rem 0;padding:1.2rem;background:#fff;border:1px solid #e2e8f0;border-radius:12px}

  /* Try section */
  .try-section{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:1.5rem;margin-top:2rem}
  .try-section h2{font-size:1.1rem;margin-bottom:.5rem}
  .examples{list-style:none;padding:0;margin-top:.5rem}
  .examples li{padding:.4rem 0;color:#555;font-size:.9rem}
  .examples li:before{content:"💬 ";margin-right:.3rem}

  /* Config merger tool */
  .config-tool{margin-top:.8rem}
  .os-toggle{display:flex;gap:0;margin-bottom:1rem;border:2px solid #e2e8f0;border-radius:8px;
             overflow:hidden;width:fit-content}
  .os-btn{padding:.5rem 1.2rem;background:#f8fafc;border:none;font-size:.9rem;font-weight:600;
          cursor:pointer;color:#6b7280;transition:background .2s,color .2s}
  .os-btn.active{background:#2563eb;color:#fff}
  .os-btn:hover:not(.active){background:#f1f5f9}
  textarea{width:100%;padding:.7rem .9rem;border:1px solid #d1d5db;border-radius:8px;
           font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
           font-size:.82rem;resize:vertical;margin-bottom:.8rem;min-height:120px}
  textarea:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}

  @media(max-width:600px){
    .features{grid-template-columns:1fr}
    .platform-grid{grid-template-columns:1fr}
    .hero h1{font-size:1.4rem}
    .step{flex-direction:column;gap:.5rem}
    .step-num{margin-bottom:.2rem}
  }
`;
