# MHO B2B E-commerce Platform

A modern, scalable B2B e-commerce platform with real-time Zoho Inventory integration, built with Next.js 16, Prisma, and Docker.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

## ✨ Features

### 🎨 Modern UI/UX
- **Beautiful Product Catalog** - Grid/List views with smooth animations
- **Shadcn/Radix UI** - Modern component library with accessibility
- **Responsive Design** - Mobile-first approach
- **Stock Badges** - Color-coded inventory status (In Stock/Low Stock/Out of Stock)
- **Product Modals** - Quick view with detailed information

### 🔄 Zoho Integration
- **Real-time Sync** - Automatic product synchronization from Zoho Inventory
- **OAuth 2.0** - Secure authentication with token refresh
- **Comprehensive Data** - 50+ product fields synced (pricing, stock, images, etc.)
- **Multi-organization** - Support for multiple Zoho organizations
- **Service Account** - Background sync service for scheduled updates

### 🏢 B2B Features
- **Multi-branch Support** - Manage multiple business locations
- **Organization Management** - Company and branch hierarchy
- **Role-based Access** - Admin, Manager, Customer roles
- **Branch Switching** - Easy switching between locations

### 🔐 Authentication & Security
- **NextAuth.js** - Secure authentication with session management
- **Redis Sessions** - Fast, scalable session storage
- **Protected Routes** - Role-based access control
- **Secure API** - JWT-based authentication

### 🚀 Performance
- **Docker Compose** - Complete containerized environment
- **PostgreSQL** - Robust relational database
- **Redis Caching** - Fast session and data caching
- **Image Optimization** - Sharp for image compression
- **Optimistic Loading** - Skeleton states for better UX

## 🏗️ Architecture

```
MHO/
├── apps/web/                 # Next.js frontend & API
│   ├── app/                  # Next.js 16 App Router
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── products/     # Product management
│   │   │   ├── zoho/         # Zoho integration
│   │   │   └── orgs/         # Organization management
│   │   ├── products/         # Product catalog page
│   │   ├── dashboard/        # Admin dashboard
│   │   └── onboarding/       # User onboarding flow
│   ├── components/           # React components
│   │   └── ui/               # Shadcn UI components
│   ├── lib/                  # Utilities & helpers
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Database client
│   │   ├── redis.ts          # Redis client
│   │   └── zoho.ts           # Zoho API client
│   └── prisma/               # Database schema & migrations
├── services/zoho-sync/       # Standalone Zoho sync service
│   ├── src/
│   │   ├── index.ts          # Service entry point
│   │   ├── sync.ts           # Sync logic
│   │   └── zoho-client.ts    # Zoho API wrapper
│   └── Dockerfile
└── docker-compose.yml        # Container orchestration
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- pnpm
- Zoho Inventory account

### 1. Clone the Repository
```bash
git clone https://github.com/Lanioque/MHO-B2B-Ecommerce.git
cd MHO-B2B-Ecommerce
```

### 2. Environment Setup
```bash
cp apps/web/env.example apps/web/.env
```

Edit `apps/web/.env` with your credentials:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_dev

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Zoho (Get from Zoho API Console)
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_ORGANIZATION_ID=your_org_id
ZOHO_REGION=eu  # or us, in, au
```

### 3. Start with Docker
```bash
docker-compose up -d
```

The application will be available at:
- **Web App**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. Initial Setup
1. Visit http://localhost:3000/register to create an account
2. Complete the onboarding process
3. Go to http://localhost:3000/test-zoho to connect Zoho
4. Click "Sync to Database" to import products

## 🔧 Development

### Local Development (without Docker)
```bash
# Install dependencies
pnpm install

# Start PostgreSQL & Redis
docker-compose up postgres redis -d

# Run migrations
cd apps/web
pnpm prisma migrate dev

# Start dev server
pnpm dev
```

### Database Management
```bash
# Generate Prisma client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name your_migration_name

# Open Prisma Studio
pnpm prisma studio

# Seed database
pnpm db:seed
```

### Building for Production
```bash
# Build all services
docker-compose build

# Start in production mode
docker-compose up -d
```

## 📦 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with React Compiler
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS
- **Shadcn UI** - Component library
- **Radix UI** - Headless UI primitives
- **Lucide Icons** - Beautiful icon set

### Backend
- **Next.js API Routes** - RESTful API
- **NextAuth.js** - Authentication
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **Redis** - Session & cache store
- **Zod** - Runtime validation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **pnpm** - Fast package manager
- **ESLint & Prettier** - Code quality

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signout` - Sign out

### Products
- `GET /api/products` - List products (paginated)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)

### Zoho Integration
- `GET /api/zoho/oauth/start` - Start OAuth flow
- `GET /api/zoho/oauth/callback` - OAuth callback
- `GET /api/zoho/products` - Fetch from Zoho (live)
- `POST /api/zoho/sync` - Sync to database

### Organizations
- `GET /api/orgs` - List organizations
- `POST /api/orgs` - Create organization
- `GET /api/branches` - List branches

## 🔐 Environment Variables

See `apps/web/env.example` for all required variables.

## 📝 Database Schema

Key models:
- **User** - Authentication & profile
- **Organization** - Company entities
- **Branch** - Business locations
- **Membership** - User-org relationships with roles
- **Product** - Product catalog (global)
- **ZohoConnection** - OAuth tokens & settings

## 🎯 Roadmap

- [ ] Shopping cart & checkout
- [ ] Order management
- [ ] Invoice generation
- [ ] Email notifications
- [ ] Advanced search & filters
- [ ] Product recommendations
- [ ] Analytics dashboard
- [ ] Multi-currency support
- [ ] API documentation (Swagger)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Zoho Inventory](https://www.zoho.com/inventory/)

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js & TypeScript
