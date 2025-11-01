/**
 * Prisma Type Exports
 * This file provides type aliases for Prisma types.
 * 
 * IMPORTANT: Run `pnpm prisma generate` in apps/web before building!
 * Once Prisma client is generated, these will use the actual Prisma types.
 */

// Try to import types, fallback to any if not available
type PrismaModule = typeof import("@prisma/client");

export type PrismaClient = PrismaModule extends { PrismaClient: any }
  ? PrismaModule["PrismaClient"]
  : any;

export type Order = PrismaModule extends { Order: any }
  ? PrismaModule["Order"]
  : any;

export type User = PrismaModule extends { User: any }
  ? PrismaModule["User"]
  : any;

export type Product = PrismaModule extends { Product: any }
  ? PrismaModule["Product"]
  : any;

export type Cart = PrismaModule extends { Cart: any }
  ? PrismaModule["Cart"]
  : any;

export type CartItem = PrismaModule extends { CartItem: any }
  ? PrismaModule["CartItem"]
  : any;

export type Organization = PrismaModule extends { Organization: any }
  ? PrismaModule["Organization"]
  : any;

export type Membership = PrismaModule extends { Membership: any }
  ? PrismaModule["Membership"]
  : any;

export type OrderItem = PrismaModule extends { OrderItem: any }
  ? PrismaModule["OrderItem"]
  : any;

export type Branch = PrismaModule extends { Branch: any }
  ? PrismaModule["Branch"]
  : any;

export type Address = PrismaModule extends { Address: any }
  ? PrismaModule["Address"]
  : any;

export type Prisma = PrismaModule extends { Prisma: any }
  ? PrismaModule["Prisma"]
  : any;

