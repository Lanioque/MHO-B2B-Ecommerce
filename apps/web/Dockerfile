# Development Dockerfile for Next.js app
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files only
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy application code
COPY apps/web/prisma ./apps/web/prisma
COPY apps/web/app ./apps/web/app
COPY apps/web/lib ./apps/web/lib
COPY apps/web/components ./apps/web/components
COPY apps/web/public ./apps/web/public
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/tailwind.config.ts* ./apps/web/
COPY apps/web/postcss.config.mjs* ./apps/web/
COPY apps/web/components.json ./apps/web/
COPY apps/web/proxy.ts ./apps/web/

WORKDIR /app/apps/web

# Generate Prisma Client
RUN pnpm prisma generate

# Expose port
EXPOSE 3000

# Start dev server
CMD ["pnpm", "dev"]
