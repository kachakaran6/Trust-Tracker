# Multi-stage Dockerfile for Trust-Tracker Fullstack (Vite + Node/Express + PostgreSQL)

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl and wget for health checks
RUN apk add --no-cache curl wget

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and backend assets
COPY --from=frontend-builder /app/dist ./dist
COPY --from=server-builder /app/server/dist ./server/dist
COPY server/src/db/schema.sql ./server/dist/db/schema.sql

# Mark server/dist as CommonJS so Node treats compiled CJS properly despite root "type": "module"
RUN echo '{"type": "commonjs"}' > ./server/dist/package.json

# Expose HTTP port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the fullstack application
CMD ["node", "server/dist/index.js"]
