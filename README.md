# Restaurant Management Platform

A complete restaurant management and e-commerce platform built with Next.js, Prisma, and PostgreSQL.

## Features

- **Multi-tenant Architecture** - Support for multiple restaurants/organizations
- **Restaurant-Focused** - Food restrictions, employee management, branch locations
- **Inventory Management** - Track products with dietary information and allergens
- **Online Ordering** - Complete e-commerce functionality for food businesses
- **Employee Management** - Staff tracking with roles and departments
- **Payment Processing** - Telr payment gateway integration
- **Optional Zoho Sync** - Advanced inventory sync available as optional feature

## Tech Stack

- **Frontend/Backend:** Next.js 16 with App Router
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js with RBAC
- **Cache:** Redis (Upstash)
- **Payment:** Telr Gateway
- **UI:** shadcn/ui components

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop
- PostgreSQL (or use Docker)

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd MHO
   pnpm install
   ```

2. **Start Docker Services**
   ```bash
   docker-compose up -d
   ```

3. **Setup Environment**
   ```bash
   cd apps/web
   cp env.example .env
   # Edit .env with your credentials
   ```

4. **Run Migrations**
   ```bash
   pnpm prisma migrate dev
   ```

5. **Seed Database (Optional)**
   ```bash
   pnpm db:seed
   ```

6. **Start Dev Server**
   ```bash
   pnpm dev
   ```

Visit: `http://localhost:3001`

## Default Credentials

After seeding:
- Email: `admin@example.com`
- Password: `Password123!`

## Project Structure

```
apps/web/
├── app/              # Next.js pages and API routes
├── lib/              # Utilities and services
├── prisma/           # Database schema
├── components/       # UI components
└── public/           # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/me` - Current user

### Organizations
- `GET /api/orgs` - List user's organizations
- `POST /api/orgs` - Create organization
- `GET /api/orgs/:id` - Get organization
- `PATCH /api/orgs/:id` - Update organization

### Branches
- `GET /api/branches` - List branches
- `POST /api/branches` - Create branch

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product

## Onboarding Flow

1. User registers
2. Creates organization with:
   - Company details
   - Employee count
   - Supported food restrictions
3. Adds branch location
4. Redirected to dashboard

## Notes

- Platform works standalone without Zoho
- Zoho integration is optional
- All restaurant features built-in
- Ready for production deployment

## License

Proprietary - All rights reserved
