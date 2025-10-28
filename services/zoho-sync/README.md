# Zoho Sync Service

A standalone service that syncs products from Zoho Inventory to the database using cron jobs.

## Features

- ✅ Runs independently from Next.js application
- ✅ Scheduled sync every 15 minutes
- ✅ Automatic token refresh
- ✅ Error handling and logging
- ✅ Supports multiple organizations

## Setup

### Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ecommerce_dev"
ZOHO_CLIENT_ID="your-client-id"
ZOHO_CLIENT_SECRET="your-client-secret"
ZOHO_ORGANIZATION_ID="806552835"
```

### Running Locally

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run in development mode
pnpm dev

# Build and run
pnpm build
pnpm start

# Run one-time sync
pnpm sync
```

### Running with Docker

The service is included in `docker-compose.yml` and runs automatically.

## How It Works

1. **Token Management**: Automatically refreshes Zoho access tokens when needed
2. **Multi-Org Support**: Syncs products for all organizations with Zoho connections
3. **Upsert Logic**: Creates new products or updates existing ones
4. **Error Handling**: Continues syncing even if individual products fail
5. **Cron Schedule**: Runs every 15 minutes (`*/15 * * * *`)

## Manual Sync

You can trigger a sync manually by calling:

```bash
curl -X POST http://localhost:8080/sync
```

## Logs

The service logs all activity:
- Start/completion of sync jobs
- Number of products fetched and synced
- Errors encountered

## Monitoring

Check service logs:
```bash
docker logs zoho-sync-service --follow
```

