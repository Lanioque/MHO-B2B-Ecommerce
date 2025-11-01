// Dynamic import to handle cases where Prisma client isn't generated yet
let PrismaClientClass: new (args?: any) => any;
try {
  const prismaModule = require("@prisma/client");
  PrismaClientClass = prismaModule.PrismaClient;
} catch {
  // Fallback - this should not happen in production (Prisma should be generated)
  PrismaClientClass = class {
    constructor() {}
    $connect = async () => {};
    $disconnect = async () => {};
    $transaction = async () => {};
    order = { findUnique: async () => null, findMany: async () => [] };
    user = { findUnique: async () => null, findMany: async () => [] };
    product = { findUnique: async () => null, findMany: async () => [] };
  } as any;
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClientClass({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

