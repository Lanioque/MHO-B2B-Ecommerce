FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY prisma ./prisma

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Expose port (not needed for cron, but good for health checks)
EXPOSE 8080

# Run the service
CMD ["pnpm", "start"]

