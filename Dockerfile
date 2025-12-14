# Build stage
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files for workspace dependency resolution
COPY packages/core/package.json ./packages/core/
COPY packages/bot/package.json ./packages/bot/
COPY packages/backend/package.json ./packages/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for all packages
COPY packages/core ./packages/core
COPY packages/bot ./packages/bot
COPY packages/backend ./packages/backend
COPY data ./data

# Build all packages
RUN pnpm run build

# Development stage
FROM base AS development
CMD ["pnpm", "run", "dev"]

# Production stage (default)
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files
COPY packages/core/package.json ./packages/core/
COPY packages/bot/package.json ./packages/bot/
COPY packages/backend/package.json ./packages/backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from base
COPY --from=base /app/packages/core/dist ./packages/core/dist
COPY --from=base /app/packages/bot/dist ./packages/bot/dist
COPY --from=base /app/packages/backend/dist ./packages/backend/dist
COPY --from=base /app/data ./data

# Run as non-root user
USER node

# Start the bot from backend package
CMD ["node", "packages/backend/dist/index.js"]

