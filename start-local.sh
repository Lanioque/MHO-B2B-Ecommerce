#!/bin/bash

# Start local development environment

echo "🚀 Starting e-commerce platform locally..."

# Start Docker services
echo "📦 Starting Docker services (Postgres & Redis)..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if containers are running
if ! docker ps | grep -q ecom-postgres; then
    echo "❌ Postgres container failed to start"
    exit 1
fi

if ! docker ps | grep -q ecom-redis; then
    echo "❌ Redis container failed to start"
    exit 1
fi

echo "✅ Docker services are running"

# Navigate to web app
cd apps/web

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
fi

# Run migrations
echo "🗄️  Running database migrations..."
pnpm prisma migrate deploy

# Seed database
echo "🌱 Seeding database..."
pnpm db:seed

# Start dev server
echo "🎯 Starting Next.js dev server..."
echo ""
echo "📍 App will be available at: http://localhost:3000"
echo "📍 Login: admin@example.com / Password123!"
echo ""
echo "Press Ctrl+C to stop"
echo ""

pnpm dev

