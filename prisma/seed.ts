import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.store.findFirst({ where: { name: "ร้านสมชายพาณิชย์" } });
  if (existing) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const store = await prisma.store.create({
    data: {
      name: "ร้านสมชายพาณิชย์",
      plan: "standard",
      users: {
        create: {
          name: "คุณสมชาย ใจดี",
          phone: "0812345678",
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  const [supA, supB, supC] = await Promise.all([
    prisma.supplier.create({ data: { storeId: store.id, name: "สมบูรณ์การค้า", phone: "021234567" } }),
    prisma.supplier.create({ data: { storeId: store.id, name: "ทองดีพาณิชย์", phone: "022345678" } }),
    prisma.supplier.create({ data: { storeId: store.id, name: "แม่ประนอมโฮลเซล", phone: "023456789" } }),
  ]);

  const productDefs = [
    { name: "น้ำปลาตราปลาหมึก 700ml", category: "เครื่องปรุง", unit: "ขวด", barcode: "8850001234017", costPrice: 32, sellPrice: 45, quantity: 3, prices: [32, 34, 30.5] },
    { name: "ข้าวสารหอมมะลิ 5kg", category: "อาหารแห้ง", unit: "ถุง", barcode: "8850009876543", costPrice: 175, sellPrice: 210, quantity: 2, prices: [175, 179, 172] },
    { name: "ไข่ไก่เบอร์ 0", category: "อาหารแห้ง", unit: "แผง", barcode: "8850004455667", costPrice: 95, sellPrice: 115, quantity: 4, prices: [96, 95, 98] },
    { name: "น้ำมันพืชตราองุ่น 1L", category: "เครื่องปรุง", unit: "ขวด", barcode: "8850002233445", costPrice: 47, sellPrice: 62, quantity: 5, prices: [47, 45.5, 48] },
    { name: "น้ำอัดลมโคล่า 325ml", category: "เครื่องดื่ม", unit: "กระป๋อง", barcode: "8850007788990", costPrice: 9, sellPrice: 15, quantity: 48, prices: [9, 9.5, 9.2] },
    { name: "มาม่าต้มยำกุ้ง", category: "อาหารแห้ง", unit: "ซอง", barcode: "8850001112223", costPrice: 5, sellPrice: 7, quantity: 120, prices: [5, 5.2, 4.9] },
    { name: "ผงซักฟอกไบรท์ 1kg", category: "ของใช้ในบ้าน", unit: "ถุง", barcode: "8850003344556", costPrice: 38, sellPrice: 52, quantity: 18, prices: [38, 39.5, 37] },
    { name: "สบู่ก้อนลักส์", category: "ของใช้ในบ้าน", unit: "ก้อน", barcode: "8850005566778", costPrice: 12, sellPrice: 18, quantity: 30, prices: [12, 12.5, 11.8] },
    { name: "ขนมปังกรอบเวเฟอร์", category: "ขนม", unit: "ห่อ", barcode: "8850006677889", costPrice: 6, sellPrice: 10, quantity: 0, prices: [6, 6.3, 5.9] },
    { name: "นมถั่วเหลืองแลคตาซอย", category: "เครื่องดื่ม", unit: "กล่อง", barcode: "8850008899001", costPrice: 11, sellPrice: 16, quantity: 22, prices: [11, 11.4, 10.8] },
  ];

  const suppliers = [supA, supB, supC];
  const products = [];
  for (const [i, p] of productDefs.entries()) {
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        barcode: p.barcode,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        quantity: p.quantity,
        preferredSupplierId: suppliers[i % suppliers.length].id,
        supplierPrices: {
          create: [
            { supplierId: supA.id, price: p.prices[0] },
            { supplierId: supB.id, price: p.prices[1] },
            { supplierId: supC.id, price: p.prices[2] },
          ],
        },
      },
    });
    products.push(product);
  }

  const today = new Date();
  const txns: { items: string; method: "CASH" | "TRANSFER"; amount: number; soldAt: Date }[] = [
    { items: "มาม่าต้มยำกุ้ง x3, น้ำอัดลม x2", method: "CASH", amount: 85, soldAt: hoursAgo(today, 2) },
    { items: "ผงซักฟอก 1kg, สบู่ก้อน x2", method: "TRANSFER", amount: 142, soldAt: hoursAgo(today, 3) },
    { items: "ข้าวสารหอมมะลิ 5kg", method: "CASH", amount: 210, soldAt: hoursAgo(today, 4) },
    { items: "ไข่ไก่เบอร์ 0 x2 แผง", method: "TRANSFER", amount: 230, soldAt: hoursAgo(today, 5) },
    { items: "น้ำปลา, น้ำมันพืช, ซอสปรุงรส", method: "CASH", amount: 138, soldAt: hoursAgo(today, 7) },
    { items: "นมถั่วเหลือง x6", method: "TRANSFER", amount: 96, soldAt: hoursAgo(today, 8) },
  ];
  await prisma.incomeTransaction.createMany({
    data: txns.map((t) => ({ storeId: store.id, items: t.items, method: t.method, amount: t.amount, soldAt: t.soldAt })),
  });

  const bill1 = await prisma.purchaseBill.create({
    data: {
      storeId: store.id,
      billNo: "INV-1038",
      supplierId: supA.id,
      amount: 4820,
      status: "PAID",
      billDate: daysAgo(today, 1),
      lineItems: {
        create: [
          { productId: products[1].id, name: products[1].name, qtyLabel: "10 ถุง", unitPrice: 175, subtotal: 1750 },
          { productId: products[3].id, name: products[3].name, qtyLabel: "20 ขวด", unitPrice: 47, subtotal: 940 },
          { productId: products[0].id, name: products[0].name, qtyLabel: "30 ขวด", unitPrice: 32, subtotal: 960 },
        ],
      },
    },
  });

  const bill2 = await prisma.purchaseBill.create({
    data: {
      storeId: store.id,
      billNo: "INV-1041",
      supplierId: supB.id,
      amount: 3150,
      status: "PENDING",
      billDate: daysAgo(today, 2),
      lineItems: {
        create: [
          { productId: products[5].id, name: products[5].name, qtyLabel: "5 ลัง", unitPrice: 150, subtotal: 750 },
          { productId: products[6].id, name: products[6].name, qtyLabel: "30 ถุง", unitPrice: 39.5, subtotal: 1185 },
        ],
      },
    },
  });

  await prisma.purchaseBill.createMany({
    data: [
      { storeId: store.id, billNo: "INV-1044", supplierId: supC.id, amount: 2680, status: "OVERDUE", billDate: daysAgo(today, 4) },
      { storeId: store.id, billNo: "INV-1046", supplierId: supA.id, amount: 5920, status: "PAID", billDate: daysAgo(today, 5) },
      { storeId: store.id, billNo: "INV-1049", supplierId: supB.id, amount: 1980, status: "PENDING", billDate: daysAgo(today, 7) },
    ],
  });

  console.log("Seeded store:", store.name, "with", products.length, "products,", txns.length, "transactions, bills", bill1.billNo, bill2.billNo, "+3 more.");
  console.log("Login with phone 0812345678 / password password123");
}

function hoursAgo(base: Date, h: number) {
  return new Date(base.getTime() - h * 60 * 60 * 1000);
}
function daysAgo(base: Date, d: number) {
  return new Date(base.getTime() - d * 24 * 60 * 60 * 1000);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
