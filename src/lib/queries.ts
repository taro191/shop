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

export async function getReportRows(storeId: string, period: ReportPeriod) {
  const now = new Date();

  if (period === "daily") {
    const start = startOfDay(addDays(now, -6));
    const end = endOfDay(now);
    const txns = await prisma.incomeTransaction.findMany({
      where: { storeId, soldAt: { gte: start, lte: end } },
      select: { amount: true, soldAt: true },
    });
    const buckets = new Map<string, { sales: number; bills: number }>();
    for (let i = 0; i < 7; i++) buckets.set(dateKey(addDays(start, i)), { sales: 0, bills: 0 });
    for (const t of txns) {
      const key = dateKey(t.soldAt);
      const b = buckets.get(key);
      if (b) {
        b.sales += t.amount;
        b.bills += 1;
      }
    }
    return Array.from(buckets.entries()).map(([key, v]) => ({
      label: new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(parseDateKey(key)),
      sales: v.sales,
      bills: v.bills,
    }));
  }

  if (period === "monthly") {
    const year = now.getFullYear();
    const start = new Date(year, 0, 1);
    const end = endOfDay(now);
    const txns = await prisma.incomeTransaction.findMany({
      where: { storeId, soldAt: { gte: start, lte: end } },
      select: { amount: true, soldAt: true },
    });
    const months = now.getMonth() + 1;
    const rows = Array.from({ length: months }, (_, i) => ({ label: monthLabel.format(new Date(year, i, 1)), sales: 0, bills: 0 }));
    for (const t of txns) {
      const idx = t.soldAt.getMonth();
      rows[idx].sales += t.amount;
      rows[idx].bills += 1;
    }
    return rows;
  }

  // quarterly
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const end = endOfDay(now);
  const txns = await prisma.incomeTransaction.findMany({
    where: { storeId, soldAt: { gte: start, lte: end } },
    select: { amount: true, soldAt: true },
  });
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const rows = Array.from({ length: currentQuarter + 1 }, (_, i) => ({ label: `ไตรมาส ${i + 1}`, sales: 0, bills: 0 }));
  for (const t of txns) {
    const q = Math.floor(t.soldAt.getMonth() / 3);
    rows[q].sales += t.amount;
    rows[q].bills += 1;
  }
  return rows;
}
