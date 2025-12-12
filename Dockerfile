# Build stage
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY data ./data

# Build the application
RUN pnpm run build

# Development stage
FROM base AS development
CMD ["pnpm", "run", "dev"]

# Production stage (default)
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from base
COPY --from=base /app/dist ./dist
COPY --from=base /app/data ./data

# Run as non-root user
USER node

# Start the bot
CMD ["node", "dist/index.js"]

