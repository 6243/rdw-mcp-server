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
  return `<!DOCTYPE html>
<html class="light" lang="nl"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>RDW Voertuigdata — MCP Server voor je AI</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "tertiary-fixed-dim": "#4edea3",
              "inverse-on-surface": "#ebf1ff",
              "on-primary-container": "#eeefff",
              "on-tertiary": "#ffffff",
              "inverse-surface": "#2a313d",
              "secondary-container": "#e2e0fc",
              "tertiary-fixed": "#6ffbbe",
              "tertiary-container": "#007d55",
              "outline": "#737686",
              "surface-container-highest": "#dce2f3",
              "on-surface": "#151c27",
              "error-container": "#ffdad6",
              "on-primary-fixed-variant": "#003ea8",
              "on-secondary-fixed": "#1a1a2e",
              "error": "#ba1a1a",
              "primary-fixed": "#dbe1ff",
              "outline-variant": "#c3c6d7",
              "on-tertiary-fixed": "#002113",
              "surface-variant": "#dce2f3",
              "on-error-container": "#93000a",
              "on-tertiary-fixed-variant": "#005236",
              "surface": "#f9f9ff",
              "on-background": "#151c27",
              "surface-bright": "#f9f9ff",
              "on-tertiary-container": "#bdffdb",
              "inverse-primary": "#b4c5ff",
              "surface-container-low": "#f0f3ff",
              "surface-container-lowest": "#ffffff",
              "secondary-fixed-dim": "#c6c4df",
              "on-secondary-container": "#63627a",
              "surface-container-high": "#e2e8f8",
              "on-secondary-fixed-variant": "#45455b",
              "secondary": "#5d5c74",
              "on-primary-fixed": "#00174b",
              "surface-container": "#e7eefe",
              "on-error": "#ffffff",
              "primary-fixed-dim": "#b4c5ff",
              "surface-dim": "#d3daea",
              "tertiary": "#006242",
              "primary-container": "#2563eb",
              "background": "#f9f9ff",
              "on-surface-variant": "#434655",
              "on-secondary": "#ffffff",
              "surface-tint": "#0053db",
              "secondary-fixed": "#e2e0fc",
              "primary": "#004ac6",
              "on-primary": "#ffffff"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
          },
        },
      }
</script>
<style>
    .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .tonal-layering {
        background: linear-gradient(135deg, #004ac6 0%, #2563eb 100%);
    }
    .faq-answer { display: none; }
    .faq-item.open .faq-answer { display: block; }
    .faq-item.open .faq-icon { transform: rotate(180deg); }
    .faq-icon { transition: transform 0.2s; }
</style>
</head>
<body class="bg-surface font-body text-on-surface antialiased">

<!-- Top Navigation Bar -->
<header class="fixed top-0 z-50 w-full bg-[#f9f9ff] shadow-sm">
<nav class="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
  <div class="flex items-center gap-8">
    <span class="text-xl font-extrabold text-[#1A1A2E] font-headline tracking-tight">RDW Voertuigdata</span>
    <div class="hidden md:flex gap-6 items-center">
      <a class="font-headline font-bold text-[#2563EB] border-b-2 border-[#2563EB] pb-1 text-sm" href="#tools">Vehicle Check</a>
      <a class="font-headline font-bold text-[#737686] hover:text-[#1A1A2E] transition-colors duration-200 text-sm" href="#ai-platforms">AI Integration</a>
      <a class="font-headline font-bold text-[#737686] hover:text-[#1A1A2E] transition-colors duration-200 text-sm" href="#faq">FAQ</a>
    </div>
  </div>
  <div class="flex items-center gap-4">
    <a href="#ai-platforms" class="bg-primary-container text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all no-underline">Get Started</a>
  </div>
</nav>
</header>

<main class="pt-24">
<!-- Hero Section -->
<section class="max-w-7xl mx-auto px-8 py-20 text-center">
  <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low mb-6">
    <span class="text-xs font-bold text-primary tracking-widest uppercase">Model Context Protocol</span>
    <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
  </div>
  <h1 class="font-headline text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
    RDW Voertuigdata <span class="text-primary italic">voor je AI</span>
  </h1>
  <p class="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
    Integreer offici&euml;le Nederlandse voertuiggegevens direct in je favoriete AI-modellen. Snellere checks, nauwkeurigere analyses, volledige automatisering.
  </p>
  <div class="flex flex-col sm:flex-row justify-center gap-4">
    <a href="#ai-platforms" class="tonal-layering text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all no-underline">Start Gratis Integratie</a>
    <a href="#faq" class="bg-surface-container-highest text-on-surface px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-high transition-all no-underline">Meer informatie</a>
  </div>
</section>

<!-- Core Tools Bento Grid -->
<section id="tools" class="max-w-7xl mx-auto px-8 py-16">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col items-start hover:translate-y-[-4px] transition-transform">
      <div class="w-12 h-12 bg-primary-fixed rounded-lg flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-primary text-3xl">auto_fix_high</span>
      </div>
      <h3 class="font-headline text-xl font-bold mb-3">Automatische Verkoop &amp; Offertes</h3>
      <p class="text-on-surface-variant text-sm leading-relaxed mb-6">Laat je AI-model ruwe RDW-specificaties direct omzetten in wervende verkoopteksten voor advertenties, of in glasheldere reparatie-offertes. Geen handmatig knip- en plakwerk meer.</p>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col items-start hover:translate-y-[-4px] transition-transform">
      <div class="w-12 h-12 bg-tertiary-fixed rounded-lg flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-tertiary text-3xl">directions_car</span>
      </div>
      <h3 class="font-headline text-xl font-bold mb-3">Wagenpark &amp; Milieuzone-analyse</h3>
      <p class="text-on-surface-variant text-sm leading-relaxed mb-6">Laat je AI in &eacute;&eacute;n prompt controleren of voertuigen voldoen aan emissie-eisen (zero-emissiezones), wanneer de APK verloopt, en identificeer risicovoertuigen in je vloot.</p>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col items-start hover:translate-y-[-4px] transition-transform">
      <div class="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-secondary text-3xl">extension</span>
      </div>
      <h3 class="font-headline text-xl font-bold mb-3">Plug &amp; Play voor AI-Agents</h3>
      <p class="text-on-surface-variant text-sm leading-relaxed mb-6">Geef jouw custom AI-assistenten via MCP direct real-time toegang tot RDW-data. Ontworpen voor naadloze integratie met LLM&apos;s zoals Claude, zonder complexe API-bouw.</p>
    </div>
  </div>
</section>

<!-- AI App Selection -->
<section id="ai-platforms" class="bg-surface-container-low py-20 px-8">
  <div class="max-w-7xl mx-auto">
    <div class="mb-12">
      <h2 class="font-headline text-3xl font-extrabold mb-4">Kies je AI platform</h2>
      <p class="text-on-surface-variant">Activeer onze MCP server op jouw favoriete omgeving.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <a href="/setup/claude-desktop" class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 group cursor-pointer hover:bg-white transition-all no-underline text-inherit">
        <div class="flex justify-between items-start mb-6">
          <div class="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-on-surface-variant text-3xl">desktop_windows</span>
          </div>
          <span class="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-[10px] font-bold uppercase tracking-wider">Makkelijkst</span>
        </div>
        <h4 class="font-headline font-bold text-lg mb-1">Claude Desktop</h4>
        <p class="text-xs text-on-surface-variant">Directe integratie via config.json</p>
      </a>
      <a href="/setup/chatgpt" class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 group cursor-pointer hover:bg-white transition-all no-underline text-inherit">
        <div class="flex justify-between items-start mb-6">
          <div class="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-on-surface-variant text-3xl">chat_bubble</span>
          </div>
          <span class="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-wider">Plus/Team vereist</span>
        </div>
        <h4 class="font-headline font-bold text-lg mb-1">ChatGPT</h4>
        <p class="text-xs text-on-surface-variant">Via Custom GPT of API connectors</p>
      </a>
      <a href="/setup/claude-code" class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 group cursor-pointer hover:bg-white transition-all no-underline text-inherit">
        <div class="flex justify-between items-start mb-6">
          <div class="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-on-surface-variant text-3xl">code</span>
          </div>
          <span class="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider">Developers</span>
        </div>
        <h4 class="font-headline font-bold text-lg mb-1">Claude Code</h4>
        <p class="text-xs text-on-surface-variant">Command-line interface tools</p>
      </a>
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 opacity-70">
        <div class="flex justify-between items-start mb-6">
          <div class="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-on-surface-variant text-3xl">diamond</span>
          </div>
          <span class="px-3 py-1 rounded-full bg-surface-container-highest text-outline text-[10px] font-bold uppercase tracking-wider">Binnenkort</span>
        </div>
        <h4 class="font-headline font-bold text-lg mb-1 text-outline">Gemini</h4>
        <p class="text-xs text-outline">Nog niet ondersteund</p>
      </div>
    </div>
  </div>
</section>

<!-- FAQ Section -->
<section id="faq" class="max-w-3xl mx-auto px-8 py-24">
  <h2 class="font-headline text-3xl font-extrabold text-center mb-12">Veelgestelde vragen</h2>
  <div class="space-y-4">
    <div class="faq-item open bg-surface-container-lowest rounded-xl p-6 border-l-4 border-primary shadow-sm cursor-pointer" onclick="toggleFaq(this)">
      <button class="flex justify-between items-center w-full text-left">
        <span class="font-headline font-bold">Wat is een MCP server?</span>
        <span class="material-symbols-outlined text-primary faq-icon">expand_more</span>
      </button>
      <div class="faq-answer mt-4 text-on-surface-variant text-sm leading-relaxed">
        Model Context Protocol (MCP) is een open standaard waarmee AI-modellen veilig toegang krijgen tot externe databronnen. Deze server geeft je AI toegang tot de offici&euml;le RDW-database met voertuiggegevens.
      </div>
    </div>
    <div class="faq-item bg-surface-container-low rounded-xl p-6 transition-all hover:bg-surface-container cursor-pointer" onclick="toggleFaq(this)">
      <button class="flex justify-between items-center w-full text-left">
        <span class="font-headline font-bold">Is het gratis?</span>
        <span class="material-symbols-outlined text-outline faq-icon">expand_more</span>
      </button>
      <div class="faq-answer mt-4 text-on-surface-variant text-sm leading-relaxed">
        Ja, deze server is volledig gratis. De RDW voertuigdata is openbaar beschikbaar &mdash; wij maken het alleen makkelijk om die data vanuit je AI te gebruiken.
      </div>
    </div>
    <div class="faq-item bg-surface-container-low rounded-xl p-6 transition-all hover:bg-surface-container cursor-pointer" onclick="toggleFaq(this)">
      <button class="flex justify-between items-center w-full text-left">
        <span class="font-headline font-bold">Welke gegevens worden opgeslagen?</span>
        <span class="material-symbols-outlined text-outline faq-icon">expand_more</span>
      </button>
      <div class="faq-answer mt-4 text-on-surface-variant text-sm leading-relaxed">
        Alleen je e-mailadres (als je dat invult voor ChatGPT). Er worden geen voertuiggegevens of zoekopdrachten opgeslagen.
      </div>
    </div>
  </div>
</section>
</main>

<!-- Footer -->
<footer class="bg-[#1A1A2E] text-white pt-20 pb-12 px-8">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
      <div>
        <span class="font-headline font-black text-2xl block mb-6">RDW Voertuigdata</span>
        <p class="text-[#737686] text-xs leading-loose">Open source MCP server. Gebouwd voor moderne AI-workflows.</p>
      </div>
      <div>
        <h5 class="font-headline text-xs font-bold uppercase tracking-widest text-primary-fixed mb-6">Product</h5>
        <ul class="space-y-4 text-xs font-label uppercase tracking-widest text-[#737686] list-none">
          <li><a class="hover:text-white transition-all no-underline" href="#ai-platforms">AI Integration</a></li>
          <li><a class="hover:text-white transition-all no-underline" href="#faq">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h5 class="font-headline text-xs font-bold uppercase tracking-widest text-primary-fixed mb-6">Support</h5>
        <ul class="space-y-4 text-xs font-label uppercase tracking-widest text-[#737686] list-none">
          <li><a class="hover:text-white transition-all no-underline" href="#faq">FAQ</a></li>
          <li><a class="hover:text-white transition-all no-underline" href="/signup?platform=chatgpt">Account aanmaken</a></li>
        </ul>
      </div>
    </div>
    <div class="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="font-label text-[10px] uppercase tracking-widest text-[#737686]">&copy; 2025 RDW Voertuigdata MCP Server</p>
    </div>
  </div>
</footer>

<script>
function toggleFaq(el) {
  el.classList.toggle('open');
  if (el.classList.contains('open')) {
    el.classList.remove('bg-surface-container-low');
    el.classList.add('bg-surface-container-lowest', 'border-l-4', 'border-primary', 'shadow-sm');
    el.querySelector('.material-symbols-outlined').classList.remove('text-outline');
    el.querySelector('.material-symbols-outlined').classList.add('text-primary');
  } else {
    el.classList.add('bg-surface-container-low');
    el.classList.remove('bg-surface-container-lowest', 'border-l-4', 'border-primary', 'shadow-sm');
    el.querySelector('.material-symbols-outlined').classList.add('text-outline');
    el.querySelector('.material-symbols-outlined').classList.remove('text-primary');
  }
}
</script>
</body></html>`;
}

function setupClaudeDesktop(): string {
  const domain = RAILWAY_DOMAIN();
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const mcpUrl = `${protocol}://${domain}/mcp`;

  return setupPageShell("Claude Desktop Integratie | RDW Voertuigdata", "claude-desktop", `
<!-- Hero Section -->
<section class="relative overflow-hidden rounded-3xl bg-hero-gradient p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-12">
  <div class="relative z-10 space-y-6 max-w-xl">
    <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-bold tracking-wider uppercase">
      <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">verified</span>
      OFFICIAL RDW INTEGRATION
    </div>
    <h1 class="font-headline text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">Connect to Claude Desktop</h1>
    <p class="text-primary-fixed-dim/90 text-lg leading-relaxed font-medium">
      Seamlessly query RDW vehicle data directly from your Claude interface. Analyze license plates, technical specs, and APK statuses with natural language.
    </p>
  </div>
  <div class="relative shrink-0">
    <div class="absolute inset-0 bg-white/20 blur-[80px] rounded-full scale-150"></div>
    <div class="relative bg-white p-10 rounded-[2rem] shadow-2xl">
      <span class="material-symbols-outlined text-primary text-7xl" style="font-variation-settings: 'FILL' 1;">desktop_windows</span>
    </div>
  </div>
</section>

<!-- Configuration Bento Grid -->
<section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div class="lg:col-span-2 bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/30 flex flex-col space-y-8">
    <div>
      <h2 class="font-headline text-2xl font-black text-on-surface mb-2">Config Instellen</h2>
      <p class="text-on-surface-variant font-medium">Plak hieronder de inhoud van je <code class="bg-surface-container-high px-2 py-1 rounded text-primary font-mono text-sm">claude_desktop_config.json</code> bestand. Wij voegen de RDW server er automatisch aan toe.</p>
    </div>

    <div class="flex gap-2">
      <button type="button" id="os-windows" onclick="setOS('windows')" class="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white transition-all">Windows</button>
      <button type="button" id="os-mac" onclick="setOS('mac')" class="px-4 py-2 rounded-lg text-sm font-bold bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-all">Mac / Linux</button>
    </div>

    <div class="space-y-3">
      <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-outline">Plak hier je huidige config (mag ook leeg zijn)</label>
      <textarea id="config-input" rows="6" placeholder="Plak hier de inhoud van claude_desktop_config.json..." class="w-full bg-surface-container-low border-2 border-outline-variant/30 py-4 px-6 rounded-xl font-mono text-sm focus:outline-none focus:border-primary transition-colors resize-y"></textarea>
    </div>

    <button type="button" onclick="mergeConfig()" class="w-full bg-primary text-white py-4 rounded-xl font-black text-base hover:opacity-90 active:scale-[0.98] transition-all">
      Voeg RDW toe
    </button>

    <div id="config-error" class="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium" style="display:none"></div>

    <div id="config-result" style="display:none" class="space-y-4">
      <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-outline">Klaar! Kopieer dit en plak het terug in je config-bestand</label>
      <div class="relative">
        <div id="config-output" class="bg-on-background rounded-xl p-6 overflow-x-auto font-mono text-sm text-surface-variant leading-relaxed whitespace-pre cursor-pointer" onclick="navigator.clipboard.writeText(this.innerText)" title="Klik om te kopi&euml;ren"></div>
        <button onclick="navigator.clipboard.writeText(document.getElementById('config-output').innerText)" class="absolute top-4 right-4 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform">
          <span class="material-symbols-outlined text-sm">content_copy</span>
          Kopieer
        </button>
      </div>
      <div class="p-4 bg-tertiary/10 rounded-xl border border-tertiary/20 flex items-center gap-3">
        <span class="material-symbols-outlined text-tertiary">check_circle</span>
        <p class="text-sm text-on-surface font-medium">De RDW server is toegevoegd. Al je bestaande instellingen blijven behouden.</p>
      </div>
    </div>

    <div id="config-path" class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10 flex items-center gap-4">
      <span class="material-symbols-outlined text-primary">folder_open</span>
      <div>
        <p class="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Config bestand locatie</p>
        <span id="path-text" class="text-on-surface text-xs font-bold">%AppData%\\Roaming\\Anthropic\\Claude\\claude_desktop_config.json</span>
      </div>
    </div>
  </div>
  <div class="bg-surface-container-low p-8 md:p-10 rounded-3xl border border-outline-variant/30 space-y-8">
    <h3 class="font-headline text-xl font-black text-on-surface">Key Benefits</h3>
    <ul class="space-y-6">
      <li class="flex gap-4">
        <div class="bg-tertiary/10 text-tertiary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl">bolt</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Real-time Data</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Fetch the latest APK, technical specs, and ownership data directly.</p>
        </div>
      </li>
      <li class="flex gap-4">
        <div class="bg-primary/10 text-primary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl">chat_bubble</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Natural Queries</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Ask &ldquo;Which SUVs in this set are diesel?&rdquo; and get instant answers.</p>
        </div>
      </li>
      <li class="flex gap-4">
        <div class="bg-secondary/10 text-secondary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl">shield</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Secure &amp; Private</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">OAuth 2.0 authentication via your browser. No API keys needed.</p>
        </div>
      </li>
    </ul>
  </div>
</section>

<!-- MCP Setup Guide -->
<section class="space-y-10">
  <div class="text-center max-w-2xl mx-auto">
    <h2 class="font-headline text-3xl font-black text-on-surface">MCP Setup Guide</h2>
    <p class="text-on-surface-variant font-medium mt-2">Deploy your intelligence in minutes with these three steps.</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">1</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">1</div>
        <h3 class="font-headline text-lg font-bold">Configure Config</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Open your Claude Desktop config file and paste the MCP server configuration provided in the section above.</p>
      </div>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">2</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">2</div>
        <h3 class="font-headline text-lg font-bold">Restart Claude</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Completely exit and restart your Claude Desktop application to initialize the new MCP server integration.</p>
      </div>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">3</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">3</div>
        <h3 class="font-headline text-lg font-bold">Start Querying</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Your browser will open for login. Then ask Claude about any Dutch license plate, APK status, or vehicle specs.</p>
      </div>
    </div>
  </div>
</section>

<script>
var currentOS = 'windows';
var mcpUrl = '${mcpUrl}';

function setOS(os) {
  currentOS = os;
  var winBtn = document.getElementById('os-windows');
  var macBtn = document.getElementById('os-mac');
  var pathText = document.getElementById('path-text');
  if (os === 'windows') {
    winBtn.className = 'px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white transition-all';
    macBtn.className = 'px-4 py-2 rounded-lg text-sm font-bold bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-all';
    pathText.textContent = '%AppData%\\\\Roaming\\\\Anthropic\\\\Claude\\\\claude_desktop_config.json';
  } else {
    macBtn.className = 'px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white transition-all';
    winBtn.className = 'px-4 py-2 rounded-lg text-sm font-bold bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high transition-all';
    pathText.textContent = '~/Library/Application Support/Claude/claude_desktop_config.json';
  }
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

  if (!config.mcpServers || typeof config.mcpServers !== 'object') {
    config.mcpServers = {};
  }

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

  return setupPageShell("ChatGPT Integratie | RDW Voertuigdata", "chatgpt", `
<!-- Hero Section -->
<section class="relative overflow-hidden rounded-3xl bg-hero-gradient p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-12">
  <div class="relative z-10 space-y-6 max-w-xl">
    <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-bold tracking-wider uppercase">
      <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">verified</span>
      OFFICIAL RDW INTEGRATION
    </div>
    <h1 class="font-headline text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">Connect to ChatGPT</h1>
    <p class="text-primary-fixed-dim/90 text-lg leading-relaxed font-medium">
      Infuse your Custom GPTs with institutional-grade vehicle data from RDW. Perform natural language queries on license plates, specs, and history instantly.
    </p>
  </div>
  <div class="relative shrink-0">
    <div class="absolute inset-0 bg-white/20 blur-[80px] rounded-full scale-150"></div>
    <div class="relative bg-white p-10 rounded-[2rem] shadow-2xl">
      <span class="material-symbols-outlined text-primary text-7xl" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
    </div>
  </div>
</section>

<!-- API Configuration Bento Grid -->
<section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div class="lg:col-span-2 bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/30 flex flex-col justify-between space-y-10">
    <div>
      <h2 class="font-headline text-2xl font-black text-on-surface mb-2">Platform Authentication</h2>
      <p class="text-on-surface-variant font-medium">You need an API key to connect ChatGPT to the RDW database. Create an account to get your key.</p>
    </div>
    <div class="space-y-4">
      <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-outline">MCP Server URL</label>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-grow relative">
          <input class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 py-4 px-6 rounded-lg font-mono text-sm focus:outline-none focus:border-primary transition-colors" readonly type="text" value="${escapeHtml(mcpUrl)}" title="Klik om te kopi&euml;ren"/>
          <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)" class="absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined hover:scale-110 transition-transform">content_copy</button>
        </div>
        <a href="/signup?platform=chatgpt" class="bg-primary text-white font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-colors whitespace-nowrap text-center no-underline">
          Get API Key
        </a>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
        <p class="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Status</p>
        <span class="inline-flex items-center gap-1.5 text-tertiary text-xs font-bold">
          <span class="w-2 h-2 rounded-full bg-tertiary"></span>
          Active
        </span>
      </div>
      <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
        <p class="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Protocol</p>
        <span class="text-on-surface text-xs font-bold">MCP over HTTP</span>
      </div>
      <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
        <p class="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Auth</p>
        <span class="text-on-surface text-xs font-bold">Bearer Token</span>
      </div>
      <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10">
        <p class="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Encrypted</p>
        <span class="text-on-surface text-xs font-bold">TLS 1.3</span>
      </div>
    </div>
  </div>
  <div class="bg-surface-container-low p-8 md:p-10 rounded-3xl border border-outline-variant/30 space-y-8">
    <h3 class="font-headline text-xl font-black text-on-surface">Key Benefits</h3>
    <ul class="space-y-6">
      <li class="flex gap-4">
        <div class="bg-tertiary/10 text-tertiary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl">bolt</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Real-time Data</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Fetch the latest APK, technical specs, and ownership data directly.</p>
        </div>
      </li>
      <li class="flex gap-4">
        <div class="bg-primary/10 text-primary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl">chat_bubble</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Natural Queries</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Ask &ldquo;Which SUVs in this set are diesel?&rdquo; and get instant answers.</p>
        </div>
      </li>
      <li class="flex gap-4">
        <div class="bg-secondary/10 text-secondary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl">shield</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Institutional Security</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Enterprise-grade data masking and request filtering protocols.</p>
        </div>
      </li>
    </ul>
  </div>
</section>

<!-- Step-by-Step Guide -->
<section class="space-y-10">
  <div class="text-center max-w-2xl mx-auto">
    <h2 class="font-headline text-3xl font-black text-on-surface">Custom GPT Setup Guide</h2>
    <p class="text-on-surface-variant font-medium mt-2">Deploy your intelligence in minutes with these three steps.</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">1</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">1</div>
        <h3 class="font-headline text-lg font-bold">Get API Key</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Click &ldquo;Get API Key&rdquo; above to create an account and receive your Bearer token for authentication.</p>
      </div>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">2</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">2</div>
        <h3 class="font-headline text-lg font-bold">Add MCP Server</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">In ChatGPT Settings &rarr; Tools &amp; integrations &rarr; MCP Servers, add the server URL and paste your Bearer token.</p>
      </div>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">3</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">3</div>
        <h3 class="font-headline text-lg font-bold">Start Querying</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Ask ChatGPT about any Dutch license plate, APK status, or vehicle specification and get instant RDW data.</p>
      </div>
    </div>
  </div>
</section>
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
        <div class="code-box copyable" onclick="copyText(this)" title="Klik om te kopi\\xEBren">${escapeHtml(mcpUrl)}</div>
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

  return setupPageShell("Claude Code Integratie | RDW Voertuigdata", "claude-code", `
<!-- Hero Section -->
<section class="relative overflow-hidden rounded-3xl bg-hero-gradient p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-12">
  <div class="relative z-10 space-y-6 max-w-xl">
    <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-bold tracking-wider uppercase">
      <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">verified</span>
      OFFICIAL RDW INTEGRATION
    </div>
    <h1 class="font-headline text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">Connect to Claude Code</h1>
    <p class="text-primary-fixed-dim/90 text-lg leading-relaxed font-medium">
      Supercharge your development workflow with the official Anthropic Claude CLI tool. Integrated directly into your terminal for maximum velocity.
    </p>
  </div>
  <div class="relative shrink-0">
    <div class="absolute inset-0 bg-white/20 blur-[80px] rounded-full scale-150"></div>
    <div class="relative bg-white p-10 rounded-[2rem] shadow-2xl">
      <span class="material-symbols-outlined text-primary text-7xl" style="font-variation-settings: 'FILL' 1;">terminal</span>
    </div>
  </div>
</section>

<!-- Main Body Layout -->
<section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div class="lg:col-span-2 bg-surface-container-lowest p-8 md:p-10 rounded-3xl border border-outline-variant/30 flex flex-col justify-between space-y-10">
    <div>
      <h2 class="font-headline text-2xl font-black text-on-surface mb-2">MCP Server Toevoegen</h2>
      <p class="text-on-surface-variant font-medium">Voer onderstaand commando uit in je terminal om de RDW MCP server aan Claude Code toe te voegen.</p>
    </div>
    <div class="space-y-4">
      <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-outline">Installatie Commando</label>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-grow relative">
          <input class="w-full bg-surface-container-low border-b-2 border-outline-variant/30 py-4 px-6 rounded-lg font-mono text-sm focus:outline-none focus:border-primary transition-colors" readonly type="text" value="claude mcp add --transport http rdw-mcp ${escapeHtml(mcpUrl)}"/>
          <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)" class="absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined hover:scale-110 transition-transform">content_copy</button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10 flex items-center gap-3">
        <span class="material-symbols-outlined text-primary">verified_user</span>
        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-outline">Auth</p>
          <span class="text-on-surface text-xs font-bold">OAuth 2.0</span>
        </div>
      </div>
      <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10 flex items-center gap-3">
        <span class="material-symbols-outlined text-primary">update</span>
        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-outline">Updates</p>
          <span class="text-on-surface text-xs font-bold">Automatic</span>
        </div>
      </div>
      <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10 flex items-center gap-3">
        <span class="material-symbols-outlined text-primary">security</span>
        <div>
          <p class="text-[9px] font-black uppercase tracking-widest text-outline">Security</p>
          <span class="text-on-surface text-xs font-bold">Encrypted</span>
        </div>
      </div>
    </div>
  </div>
  <div class="bg-surface-container-low p-8 md:p-10 rounded-3xl border border-outline-variant/30 space-y-8">
    <h3 class="font-headline text-xl font-black text-on-surface">Key Benefits</h3>
    <ul class="space-y-6">
      <li class="flex gap-4">
        <div class="bg-tertiary/10 text-tertiary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">speed</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Real-time data</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Live indexing of your local filesystem for instant context-aware replies.</p>
        </div>
      </li>
      <li class="flex gap-4">
        <div class="bg-primary/10 text-primary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">terminal</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">AI-driven CLI</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Generate git commits, refactor functions, and fix bugs without leaving the terminal.</p>
        </div>
      </li>
      <li class="flex gap-4">
        <div class="bg-secondary/10 text-secondary p-2 rounded-lg h-fit">
          <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">security</span>
        </div>
        <div>
          <h4 class="font-bold text-sm text-on-surface mb-0.5">Secure access</h4>
          <p class="text-xs text-on-surface-variant leading-relaxed">Enterprise-grade encryption for all code data transmissions.</p>
        </div>
      </li>
    </ul>
  </div>
</section>

<!-- Step-by-Step Guide -->
<section class="space-y-10">
  <div class="text-center max-w-2xl mx-auto">
    <h2 class="font-headline text-3xl font-black text-on-surface">CLI Setup Guide</h2>
    <p class="text-on-surface-variant font-medium mt-2">Deploy your intelligence in minutes with these three steps.</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">1</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">1</div>
        <h3 class="font-headline text-lg font-bold">Install Claude Code</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Run <code class="bg-surface-container-low px-1 rounded font-mono">npm install -g @anthropic-ai/claude-code</code> to install the CLI globally.</p>
      </div>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">2</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">2</div>
        <h3 class="font-headline text-lg font-bold">Add MCP Server</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Run the command above to connect the RDW MCP server. Your browser will open for secure OAuth login.</p>
      </div>
    </div>
    <div class="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 relative group overflow-hidden">
      <span class="absolute -right-4 -top-8 text-9xl font-black text-surface-container-low/40 group-hover:text-primary/5 transition-colors">3</span>
      <div class="relative z-10 space-y-5">
        <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">3</div>
        <h3 class="font-headline text-lg font-bold">Start Coding</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed">Use <code class="bg-surface-container-low px-1 rounded font-mono">claude &ldquo;zoek kenteken AB-123-C op&rdquo;</code> to get instant RDW data in your terminal.</p>
      </div>
    </div>
  </div>
</section>
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

function setupPageShell(title: string, activePlatform: string, mainContent: string): string {
  const platforms = [
    { id: "chatgpt", name: "ChatGPT", icon: "smart_toy", href: "/setup/chatgpt" },
    { id: "claude-desktop", name: "Claude Desktop", icon: "auto_awesome", href: "/setup/claude-desktop" },
    { id: "claude-code", name: "Claude Code", icon: "terminal", href: "/setup/claude-code" },
  ];
  const sidebarItems = platforms.map(p => {
    if (p.id === activePlatform) {
      return `<a class="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest text-primary font-bold shadow-sm" href="${p.href}"><span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">${p.icon}</span><span class="text-sm">${p.name}</span></a>`;
    }
    return `<a class="flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors font-medium" href="${p.href}"><span class="material-symbols-outlined text-xl">${p.icon}</span><span class="text-sm">${p.name}</span></a>`;
  }).join("\n          ");
  return `<!DOCTYPE html>
<html class="light" lang="nl"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${title}</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Manrope:wght@700;800;900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script>
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "error": "#ba1a1a", "on-tertiary-fixed": "#002113", "tertiary-fixed": "#6ffbbe",
        "on-background": "#151c27", "surface-variant": "#dce2f3", "tertiary": "#006242",
        "on-secondary-fixed": "#1a1a2e", "secondary": "#5d5c74", "surface-dim": "#d3daea",
        "inverse-on-surface": "#ebf1ff", "on-tertiary": "#ffffff", "primary-fixed": "#dbe1ff",
        "surface-container-low": "#f0f3ff", "on-error": "#ffffff", "surface-tint": "#2563EB",
        "surface-container-high": "#e2e8f8", "primary-container": "#2563eb",
        "outline-variant": "#c3c6d7", "on-primary": "#ffffff", "background": "#f9f9ff",
        "on-tertiary-fixed-variant": "#005236", "surface-container-highest": "#dce2f3",
        "primary-fixed-dim": "#b4c5ff", "outline": "#737686", "on-primary-container": "#eeefff",
        "surface-container-lowest": "#ffffff", "on-primary-fixed-variant": "#003ea8",
        "secondary-container": "#e2e0fc", "on-surface-variant": "#434655",
        "on-primary-fixed": "#00174b", "surface-container": "#e7eefe",
        "on-secondary-fixed-variant": "#45455b", "tertiary-fixed-dim": "#4edea3",
        "on-error-container": "#93000a", "inverse-primary": "#b4c5ff",
        "on-secondary": "#ffffff", "on-surface": "#151c27", "secondary-fixed": "#e2e0fc",
        "error-container": "#ffdad6", "surface-bright": "#f9f9ff", "primary": "#2563EB",
        "inverse-surface": "#2a313d", "surface": "#f9f9ff",
        "on-secondary-container": "#63627a", "on-tertiary-container": "#bdffdb",
        "tertiary-container": "#007d55", "secondary-fixed-dim": "#c6c4df"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      borderRadius: {"DEFAULT": "0.5rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "3xl": "1.5rem", "full": "9999px"},
    },
  },
}
</script>
<style>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.bg-hero-gradient { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); }
</style>
</head>
<body class="bg-surface font-body text-on-surface flex flex-col min-h-screen">
<nav class="bg-surface flex justify-between items-center w-full px-8 py-4 max-w-full mx-auto sticky top-0 z-50 border-b border-outline-variant/30">
  <div class="flex items-center gap-8">
    <a href="/" class="text-2xl font-black text-primary tracking-tighter font-headline no-underline">RDW Voertuigdata</a>
    <div class="hidden md:flex gap-6 items-center">
      <a class="font-headline font-bold tracking-tight text-on-surface-variant hover:text-primary transition-colors no-underline" href="/">Home</a>
      <a class="font-headline font-bold tracking-tight text-primary border-b-2 border-primary pb-1 no-underline" href="#">Integraties</a>
      <a class="font-headline font-bold tracking-tight text-on-surface-variant hover:text-primary transition-colors no-underline" href="/#faq">FAQ</a>
    </div>
  </div>
  <div class="flex items-center gap-4">
    <a href="/#ai-platforms" class="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95 transition-all text-sm no-underline">Platform kiezen</a>
  </div>
</nav>
<main class="flex-grow flex flex-col md:flex-row w-full max-w-[1440px] mx-auto">
  <aside class="w-full md:w-64 bg-surface-container-low p-6 border-r border-outline-variant/30 space-y-8">
    <div>
      <h3 class="font-headline font-extrabold text-[10px] uppercase tracking-[0.15em] text-outline mb-6">AI Platforms</h3>
      <nav class="space-y-1">
          ${sidebarItems}
      </nav>
    </div>
  </aside>
  <div class="flex-grow p-8 md:p-12 space-y-12">
    ${mainContent}
  </div>
</main>
<footer class="bg-surface-container-low w-full border-t border-outline-variant/30 px-8 py-10 mt-auto">
  <div class="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center">
    <div class="mb-6 md:mb-0">
      <span class="text-lg font-black text-primary font-headline">RDW Voertuigdata</span>
      <p class="text-xs text-on-surface-variant mt-2 font-medium">&copy; 2025 RDW Voertuigdata MCP Server</p>
    </div>
    <div class="flex flex-wrap justify-center gap-8">
      <a class="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors no-underline" href="/">Home</a>
      <a class="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors no-underline" href="/#faq">FAQ</a>
    </div>
  </div>
</footer>
<script>
function copyText(el) {
  var text = el.innerText || el.value;
  navigator.clipboard.writeText(text).then(function() {
    var orig = el.getAttribute('title');
    el.setAttribute('title', 'Gekopieerd!');
    setTimeout(function() { el.setAttribute('title', orig); }, 2000);
  });
}
</script>
</body></html>`;
}

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
  .platform-card:hover:not(.disabled){border-color:#2563eb;box-shadow:0 2px 8px rgba(37,99,235,.15);text-decoration:none}
  .platform-card.disabled{opacity:.45;cursor:default;pointer-events:none}
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
