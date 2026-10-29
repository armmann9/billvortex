import { PrismaClient } from "@prisma/client";
import { SAMPLE_FASHION_PRODUCTS, CATEGORIES_MASTER, AGE_GROUPS, STYLE_ATTRIBUTES } from "@app/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Women's Fashion Catalogue and Inventory into Database...");

  // 1. Ensure Default Business exists
  let business = await prisma.business.findFirst({
    where: { name: "Royal Fashion Boutique" },
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        name: "Royal Fashion Boutique",
        stateCode: "08",
        gstin: "08AAAAA0000A1Z5",
        address: "Plot 42, Fashion Hub, Commercial Area, Jaipur, Rajasthan",
        settings: {
          categoriesMaster: CATEGORIES_MASTER,
          ageGroups: AGE_GROUPS,
          styleAttributes: STYLE_ATTRIBUTES,
        },
      },
    });
    console.log(`✓ Created Business: ${business.name} (${business.id})`);
  }

  // 2. Ensure Default Stock Location exists
  let location = await prisma.stockLocation.findFirst({
    where: { businessId: business.id },
  });

  if (!location) {
    location = await prisma.stockLocation.create({
      data: {
        businessId: business.id,
        name: "Main Showroom & Store",
        isDefault: true,
      },
    });
    console.log(`✓ Created Stock Location: ${location.name}`);
  }

  // 3. Ensure Default Cashier User exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Store Manager",
        // hashed version or demo hash
        passwordHash: "$2b$10$w8.1UuCqWvQdJ9R4.J7Xxe8rR.0T3U8V7X7.v8Ue1/uD.x",
        memberships: {
          create: {
            businessId: business.id,
            role: "OWNER",
          },
        },
      },
    });
    console.log(`✓ Created User: ${user.email}`);
  }

  // 4. Seed all 14 Sample Fashion Products
  console.log(`\n📦 Seeding ${SAMPLE_FASHION_PRODUCTS.length} Women's Fashion items...`);

  for (const item of SAMPLE_FASHION_PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: {
        businessId_sku: {
          businessId: business.id,
          sku: item.sku,
        },
      },
    });

    if (!existing) {
      const product = await prisma.product.create({
        data: {
          businessId: business.id,
          sku: item.sku,
          barcode: item.barcode,
          name: item.name,
          category: item.category,
          brand: "Aura Fashion",
          design: `${item.pattern ?? "Solid"} • ${item.fabric}`,
          hsn: item.hsn ?? "6204",
          gstRate: item.gstRate,
          unit: item.unit,
          isFabric: item.isFabric,
          salePrice: item.salePrice,
          costPrice: item.costPrice,
          reorderLevel: item.lowStockThreshold,
          variants: {
            create: {
              businessId: business.id,
              sku: `${item.sku}-${item.size}`,
              size: item.size,
              colour: item.color,
              style: `${item.fit ?? "Regular"} / ${item.occasion ?? "Daily"}`,
              salePrice: item.salePrice,
            },
          },
        },
      });

      // Record opening stock movement in ledger
      await prisma.stockMovement.create({
        data: {
          businessId: business.id,
          locationId: location.id,
          productId: product.id,
          delta: item.stock,
          unit: item.unit,
          reason: "OPENING",
          refType: "SEED_CATALOGUE",
          refId: item.sku,
        },
      });

      console.log(`  + [${item.sku}] ${item.name} (${item.category} | Size: ${item.size} | Color: ${item.color} | MRP: ₹${item.salePrice} | Stock: ${item.stock})`);
    } else {
      console.log(`  ~ [${item.sku}] ${item.name} already exists`);
    }
  }

  // 5. Seed sample fashion retail customers
  const demoCustomers = [
    { name: "Pooja Sharma", phone: "+91 98765 11111", email: "pooja@example.com", stateCode: "08" },
    { name: "Ananya Verma", phone: "+91 98220 22222", email: "ananya@example.com", stateCode: "08" },
    { name: "Deepika Mehta", phone: "+91 98111 33333", email: "deepika@example.com", stateCode: "08" },
    { name: "Kavita Rao", phone: "+91 98770 44444", email: "kavita@example.com", stateCode: "08" },
  ];

  for (const cust of demoCustomers) {
    const found = await prisma.customer.findFirst({
      where: { businessId: business.id, name: cust.name },
    });
    if (!found) {
      await prisma.customer.create({
        data: {
          businessId: business.id,
          ...cust,
        },
      });
    }
  }

  console.log("\n✨ Database seeding completed successfully with Women's Fashion dummy catalogue!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
