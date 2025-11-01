import bcrypt from "bcryptjs";
// Use dynamic import for PrismaClient to handle cases where it's not generated yet
let PrismaClient: any;
try {
  const prismaModule = require("@prisma/client");
  PrismaClient = prismaModule.PrismaClient;
} catch {
  throw new Error("Prisma Client not generated. Please run 'pnpm prisma generate' first.");
}

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create test user
  const hashedPassword = await bcrypt.hash("Password123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
    },
  });

  console.log("Created user:", user.email);

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      name: "Demo Store",
      vatNumber: "VAT123456",
    },
  });

  console.log("Created organization:", org.name);

  // Create membership
  const membership = await prisma.membership.upsert({
    where: { userId: user.id },
    update: { role: "OWNER" },
    create: {
      userId: user.id,
      orgId: org.id,
      role: "OWNER",
    },
  });

  console.log("Created membership with OWNER role");

  // Create addresses for branch
  const billing = await prisma.address.create({
    data: {
      line1: "123 Main Street",
      city: "New York",
      postalCode: "10001",
      country: "USA",
    },
  });

  const shipping = await prisma.address.create({
    data: {
      line1: "123 Main Street",
      city: "New York",
      postalCode: "10001",
      country: "USA",
    },
  });

  // Create branch
  const branch = await prisma.branch.create({
    data: {
      orgId: org.id,
      name: "Main Branch",
      billingId: billing.id,
      shippingId: shipping.id,
    },
  });

  console.log("Created branch:", branch.name);

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "PROD-001",
        slug: "demo-product-1",
        name: "Demo Product 1",
        description: "This is a demo product",
        priceCents: 1999, // $19.99
        currency: "AED",
        vatRate: 0.2,
        stock: 100,
        isVisible: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: "PROD-002",
        slug: "demo-product-2",
        name: "Demo Product 2",
        description: "Another demo product",
        priceCents: 2999, // $29.99
        currency: "AED",
        vatRate: 0.2,
        stock: 50,
        isVisible: true,
      },
    }),
  ]);

  console.log(`Created ${products.length} products`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

