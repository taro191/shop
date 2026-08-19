export function planLabel(plan: string) {
  switch (plan) {
    case "trial":
      return "ทดลองใช้งาน";
    case "starter":
      return "แผน เริ่มต้น · ใช้งานอยู่";
    case "standard":
      return "แผน Standard · ใช้งานอยู่";
    case "premium":
      return "แผน โปร · ใช้งานอยู่";
    default:
      return plan;
  }
}

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export function formatBaht(amount: number) {
  return thb.format(Math.round(amount));
}

const thaiDate = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
export function formatThaiDate(date: Date) {
  return thaiDate.format(date);
}

const thaiTime = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" });
export function formatThaiTime(date: Date) {
  return thaiTime.format(date);
}
