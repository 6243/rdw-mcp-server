# Plan: Landing Page & Onboarding Redesign

## Doel
De landing page en setup-instructies zo aanpassen dat iedereen — ook mensen zonder technische kennis — eenvoudig aan de slag kan met de RDW MCP server.

---

## Huidige situatie
- **Landing page** (`/`): email-formulier → API key + setup-instructies voor 4 platforms
- **OAuth login** (`/authorize`): minimaal email-formulier voor OAuth flow
- **Probleem**: De instructies zijn te technisch (JSON config, CLI commands, Bearer tokens). Niet-technische gebruikers haken af.

---

## Voorgestelde wijzigingen

### 1. Nieuwe Landing Page (`/`)
**Wat verandert:**
- Duidelijke uitleg in gewoon Nederlands: "Wat is dit?" en "Wat kun je ermee?"
- Visuele voorbeelden van vragen die je kunt stellen (bijv. "Is mijn APK nog geldig?")
- Simpele stappen: "Kies je AI-app" → "Volg de stappen" → "Stel je vraag"
- De API key verdwijnt van de hoofdpagina — die is niet meer nodig voor Claude Desktop (OAuth regelt dat nu)

### 2. Platform-specifieke Setup Pagina's
**Wat verandert:**
- Per platform (Claude Desktop, ChatGPT, Gemini, Claude Code) een duidelijke stap-voor-stap guide
- Met screenshots/visuele hints waar mogelijk
- Claude Desktop: simpelste flow — kopieer 1 blok JSON, plak, herstart
- ChatGPT/Gemini: URL + eventueel Bearer token
- Claude Code: 1 terminal commando

### 3. Vereenvoudigde Setup Flow
**Per platform:**

| Platform | Wat de gebruiker moet doen |
|---|---|
| **Claude Desktop** | 1. Installeer Node.js 2. Open Settings → Developer → Edit Config 3. Plak config 4. Herstart 5. Browser opent voor email login |
| **ChatGPT** | 1. Ga naar Settings → MCP Servers 2. Voer URL in 3. Email login |
| **Gemini** | 1. Open AI Studio 2. Add MCP Server 3. Voer URL in |
| **Claude Code** | 1. Run 1 commando in terminal |

### 4. Pagina Layout
```
┌─────────────────────────────────────────┐
│  RDW MCP                                │
│  "Vraag je AI alles over Nederlands     │
│   voertuigdata"                         │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Kenteken │ │  APK    │ │ Recalls  │  │
│  │ opzoeken │ │ status  │ │ checken  │  │
│  └─────────┘ └─────────┘ └──────────┘  │
│                                         │
│  "Kies je AI-app om te beginnen:"       │
│                                         │
│  [Claude Desktop] [ChatGPT]             │
│  [Gemini]         [Claude Code]         │
│                                         │
│  → Klik opent setup-instructies         │
└─────────────────────────────────────────┘
```

### 5. Bestanden die aangepast worden

| Bestand | Wat |
|---|---|
| `src/landing.ts` | Volledige redesign van de landing page + setup instructies |

Geen nieuwe bestanden nodig — alles past in het bestaande `landing.ts`.

---

## Wat NIET verandert
- Backend/auth code (werkt al)
- OAuth flow (werkt al)
- API endpoints
- Tool registraties

## Taal
- De website wordt **Nederlands** (doelgroep is Nederlandse autorijders)
- Met eenvoudige, niet-technische bewoordingen
