# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

# Security: run as non-root
RUN addgroup -S mcp && adduser -S mcp -G mcp

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Create data directory for SQLite (mount a Railway Volume here)
RUN mkdir -p /data && chown mcp:mcp /data

# Default to HTTP transport for hosted deployment
ENV TRANSPORT=http
ENV PORT=8000
ENV DB_PATH=/data/users.db
ENV NODE_ENV=production

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8000/health || exit 1

USER mcp
CMD ["node", "dist/index.js", "--http"]
