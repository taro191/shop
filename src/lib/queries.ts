import "server-only";
import { prisma } from "@/lib/db";
import { addDays, startOfDay, endOfDay, dateKey, parseDateKey, shortThaiWeekday } from "@/lib/date";

export async function getDashboardStats(storeId: string) {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [todayTx, lowStockCount, pendingBills] = await Promise.all([
    prisma.incomeTransaction.findMany({
      where: { storeId, soldAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.product.count({ where: { storeId, quantity: { lte: 8 } } }),
    prisma.purchaseBill.findMany({
      where: { storeId, status: { in: ["PENDING", "OVERDUE"] } },
    }),
  ]);

  const todayTotal = todayTx.reduce((s, t) => s + t.amount, 0);
  const pendingTotal = pendingBills.reduce((s, b) => s + b.amount, 0);

  return {
    todayTotal,
    todayCount: todayTx.length,
    lowStockCount,
    pendingBillsCount: pendingBills.length,
    pendingBillsTotal: pendingTotal,
  };
}

export async function getLowStockProducts(storeId: string, limit = 4) {
  return prisma.product.findMany({
    where: { storeId, quantity: { lte: 8 } },
    orderBy: { quantity: "asc" },
    take: limit,
  });
}

export async function getExpiringProducts(storeId: string, limit = 4) {
  return prisma.product.findMany({
    where: { storeId, expiresAt: { not: null, lte: addDays(new Date(), 14) } },
    orderBy: { expiresAt: "asc" },
    take: limit,
  });
}

export async function getRecentTransactions(storeId: string, limit = 5) {
  return prisma.incomeTransaction.findMany({
    where: { storeId },
    orderBy: { soldAt: "desc" },
    take: limit,
  });
}

export async function getWeeklySales(storeId: string) {
  const today = endOfDay(new Date());
  const start = startOfDay(addDays(today, -6));

  const txns = await prisma.incomeTransaction.findMany({
    where: { storeId, soldAt: { gte: start, lte: today } },
    select: { amount: true, soldAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    buckets.set(dateKey(day), 0);
  }
  for (const t of txns) {
    const key = dateKey(t.soldAt);
    buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    label: shortThaiWeekday(parseDateKey(key)),
    value,
  }));
}

/** Average gross-margin ratio across the store's current catalog, used to estimate
 * cost/profit per report period since individual sale line items aren't tracked yet. */
export async function getAverageMarginRatio(storeId: string) {
  const products = await prisma.product.findMany({ where: { storeId }, select: { costPrice: true, sellPrice: true } });
  const withSell = products.filter((p) => p.sellPrice > 0);
  if (withSell.length === 0) return 0.25;
  const ratios = withSell.map((p) => (p.sellPrice - p.costPrice) / p.sellPrice);
  return ratios.reduce((s, r) => s + r, 0) / ratios.length;
}

const monthLabel = new Intl.DateTimeFormat("th-TH", { month: "short" });

export type ReportPeriod = "daily" | "monthly" | "quarterly";

type ReportBucket = { sales: number; bills: number; realCost: number; salesWithRealCost: number };
function emptyBucket(): ReportBucket {
  return { sales: 0, bills: 0, realCost: 0, salesWithRealCost: 0 };
}

/** Sales rows per period, with real COGS from POS checkouts (SaleLineItem.unitCost)
 * where available, and the portion still missing it (older/manual quick-sale entries
 * with no line items) — the caller blends that remainder with the estimated margin
 * ratio from getAverageMarginRatio. */
export async function getReportRows(storeId: string, period: ReportPeriod) {
  const now = new Date();

  const applyTxn = (bucket: ReportBucket, t: { amount: number; lineItems: { unitCost: number; quantity: number }[] }) => {
    bucket.sales += t.amount;
    bucket.bills += 1;
    if (t.lineItems.length > 0) {
      bucket.salesWithRealCost += t.amount;
      bucket.realCost += t.lineItems.reduce((s, li) => s + li.unitCost * li.quantity, 0);
    }
  };

  const select = { amount: true, soldAt: true, lineItems: { select: { unitCost: true, quantity: true } } } as const;

  if (period === "daily") {
    const start = startOfDay(addDays(now, -6));
    const end = endOfDay(now);
    const txns = await prisma.incomeTransaction.findMany({ where: { storeId, soldAt: { gte: start, lte: end } }, select });
    const buckets = new Map<string, ReportBucket>();
    for (let i = 0; i < 7; i++) buckets.set(dateKey(addDays(start, i)), emptyBucket());
    for (const t of txns) {
      const b = buckets.get(dateKey(t.soldAt));
      if (b) applyTxn(b, t);
    }
    return Array.from(buckets.entries()).map(([key, v]) => ({
      label: new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(parseDateKey(key)),
      ...v,
    }));
  }

  if (period === "monthly") {
    const year = now.getFullYear();
    const start = new Date(year, 0, 1);
    const end = endOfDay(now);
    const txns = await prisma.incomeTransaction.findMany({ where: { storeId, soldAt: { gte: start, lte: end } }, select });
    const months = now.getMonth() + 1;
    const rows = Array.from({ length: months }, (_, i) => ({ label: monthLabel.format(new Date(year, i, 1)), ...emptyBucket() }));
    for (const t of txns) applyTxn(rows[t.soldAt.getMonth()], t);
    return rows;
  }

  // quarterly
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = endOfDay(now);
  const txns = await prisma.incomeTransaction.findMany({ where: { storeId, soldAt: { gte: start, lte: end } }, select });
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const rows = Array.from({ length: currentQuarter + 1 }, (_, i) => ({ label: `ไตรมาส ${i + 1}`, ...emptyBucket() }));
  for (const t of txns) applyTxn(rows[Math.floor(t.soldAt.getMonth() / 3)], t);
  return rows;
}
