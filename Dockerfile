# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

# Security: run as non-root
RUN addgroup -S mcp && adduser -S mcp -G mcp

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Default to HTTP transport for hosted deployment
ENV TRANSPORT=http
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

USER mcp
CMD ["node", "dist/index.js", "--http"]
