# RDW MCP Server

MCP (Model Context Protocol) server that provides access to Dutch RDW (Rijksdienst voor het Wegverkeer) open vehicle data. Query vehicle registrations, APK status, recall actions and more — directly from Claude, Cursor or any MCP client.

## Features

| Tool | Description |
|------|-------------|
| `rdw_kenteken_zoeken` | Quick license plate lookup — vehicle info, fuel data, alerts |
| `rdw_voertuig_details` | Full details combining multiple RDW datasets (fuel, axles, bodywork) |
| `rdw_apk_status` | APK (MOT) inspection status check with days-until-expiry |
| `rdw_terugroep_acties` | Recall actions by brand or kenteken |
| `rdw_merk_zoeken` | Search by brand with filters (model, year, fuel, color) |
| `rdw_slim_zoeken` | Natural language smart search (Dutch & English) |

### Highlights

- **No API key needed** — RDW is fully open data
- **Bilingual** — Dutch labels + English descriptions
- **Smart alerts** — flags expired APK, open recalls, missing insurance
- **In-memory caching** — 1-hour TTL reduces redundant API calls
- **Rate limiting** — max 10 concurrent requests to RDW API
- **Dual transport** — stdio (local) and streamable HTTP (remote)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build
npm run build

# 3. Run (stdio mode — for Claude Desktop / local)
npm start

# 3b. Run (HTTP mode — for remote / cloud deployment)
npm run start:http
```

## Setup: Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rdw": {
      "command": "node",
      "args": ["/absolute/path/to/rdw-mcp-server/dist/index.js"]
    }
  }
}
```

## Setup: Claude.ai / Cowork (Remote)

Start the server in HTTP mode:

```bash
TRANSPORT=http PORT=3000 npm start
```

Then connect to `http://localhost:3000/mcp` (or your deployed URL).

## Setup: Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rdw": {
      "command": "node",
      "args": ["/absolute/path/to/rdw-mcp-server/dist/index.js"]
    }
  }
}
```

## Example Queries

Once connected, you can ask:

- "Zoek kenteken GJ680V" — full vehicle lookup
- "Is de APK van 12-AB-CD nog geldig?" — APK check
- "Terugroepacties voor Tesla" — recall search
- "Alle rode BMW 3-serie na 2020" — brand search with filters
- "Elektrische auto's van Hyundai" — smart search
- "Dieselautos ouder dan 10 jaar" — natural language query

## Project Structure

```
rdw-mcp-server/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts              # Entry point — transport selection
│   ├── constants.ts          # API URLs, dataset IDs, brand aliases, labels
│   ├── types.ts              # TypeScript interfaces
│   ├── schemas/
│   │   └── rdw-schemas.ts    # Zod input schemas for all tools
│   ├── services/
│   │   ├── rdw-client.ts     # API client (caching, rate limiting, error handling)
│   │   ├── formatter.ts      # Response formatting (markdown, summaries)
│   │   └── kenteken-utils.ts # License plate validation & normalization
│   └── tools/
│       ├── rdw-kenteken.ts   # rdw_kenteken_zoeken
│       ├── rdw-details.ts    # rdw_voertuig_details
│       ├── rdw-apk.ts        # rdw_apk_status
│       ├── rdw-recalls.ts    # rdw_terugroep_acties
│       ├── rdw-merk.ts       # rdw_merk_zoeken
│       └── rdw-slim-zoeken.ts # rdw_slim_zoeken
└── dist/                     # Compiled JavaScript (after npm run build)
```

## RDW Datasets Used

| Dataset | Resource ID | Contents |
|---------|-------------|----------|
| Gekentekende voertuigen | `m9d7-ebf2` | Main vehicle registrations |
| Brandstof | `8ys7-d773` | Fuel type, emissions, consumption |
| Assen | `3huj-srit` | Axle data |
| Carrosserie | `vezc-m2t6` | Bodywork data |
| Terugroepacties | `af5r-44mf` | Recall actions |

All data is fetched via the Socrata/SODA API at `opendata.rdw.nl`.

## Deployment (Railway / Fly.io)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
EXPOSE 3000
ENV TRANSPORT=http PORT=3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js", "--http"]
```

## Next Steps (from the business plan)

1. **Add API key authentication** — middleware layer with tier-based rate limiting
2. **Add CBS (Statistics Netherlands)** — extend with CBS OData v4 tools
3. **Landing page + Stripe** — billing integration via Lovable
4. **Deploy** — Railway or Fly.io with Supabase for key management

## License

MIT
