import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";
import {
  ShopIcon,
  InventoryIcon,
  CompareIcon,
  IncomeIcon,
  BillsIcon,
  ReportsIcon,
  DashboardIcon,
} from "@/components/icons";

const FEATURES = [
  { icon: InventoryIcon, title: "จัดการสต๊อกสินค้า", desc: "บันทึกสินค้าคงคลัง แจ้งเตือนสินค้าใกล้หมด และอัปเดตยอดคงเหลือแบบเรียลไทม์" },
  { icon: CompareIcon, title: "เทียบราคาซัพพลายเออร์", desc: "เปรียบเทียบราคาสินค้าจากร้านส่งหลายเจ้า หาต้นทุนที่ถูกที่สุดได้ในคลิกเดียว" },
  { icon: IncomeIcon, title: "รายรับรายวัน", desc: "บันทึกยอดขายและช่องทางการชำระเงิน สรุปกำไรขาดทุนได้ทันทีทุกวัน" },
  { icon: BillsIcon, title: "เก็บบิลซื้อสินค้า", desc: "บันทึกบิลซื้อจากซัพพลายเออร์ ติดตามสถานะการชำระเงินไม่ให้ตกหล่น" },
  { icon: ReportsIcon, title: "รายงานสรุปซื้อขาย", desc: "ดูสรุปยอดขาย ต้นทุน และกำไร แบบรายวัน รายเดือน และรายไตรมาส" },
  { icon: DashboardIcon, title: "ใช้งานได้ทุกที่", desc: "หน้าค้นหาราคาและบันทึกยอดขายออกแบบมาสำหรับมือถือ ใช้งานสะดวกหน้าร้าน" },
];

const PLANS = [
  { name: "เริ่มต้น", price: 299, desc: "ร้านค้าขนาดเล็ก 1 สาขา", featured: false,
    features: ["จัดการสต๊อกสินค้าไม่จำกัด", "บันทึกรายรับรายวัน", "รายงานสรุปรายวัน/เดือน", "ผู้ใช้งาน 1 คน"] },
  { name: "มาตรฐาน", price: 599, desc: "ร้านชำที่กำลังเติบโต", featured: true,
    features: ["ทุกอย่างในแพ็กเกจเริ่มต้น", "เทียบราคาซัพพลายเออร์", "รายงานสรุปรายไตรมาส", "ผู้ใช้งานสูงสุด 3 คน"] },
  { name: "โปร", price: 1290, desc: "เชนร้านค้าหลายสาขา", featured: false,
    features: ["ทุกอย่างในแพ็กเกจมาตรฐาน", "จัดการได้หลายสาขา", "ผู้ใช้งานไม่จำกัด", "ทีมช่วยเหลือด่วนเป็นพิเศษ"] },
];

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Nav */}
      <div className="border-b border-border">
        <div className="mx-auto flex h-[76px] max-w-[1160px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent">
              <ShopIcon className="h-5 w-5" stroke="#1F3A28" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">
              ร้านชำ<span className="text-accent-dark">ครบวงจร</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 sm:flex">
            <a href="#features" className="text-sm text-foreground/70 hover:text-brand">ฟีเจอร์</a>
            <a href="#pricing" className="text-sm text-foreground/70 hover:text-brand">แพ็กเกจราคา</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-foreground/80">เข้าสู่ระบบ</Link>
            <a href="#signup" className="rounded-[9px] bg-accent px-5 py-2.5 text-[13.5px] font-bold text-[#1F3A28]">
              สมัครใช้งานฟรี
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-brand-light to-white">
        <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-6 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-light px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="text-[12.5px] font-semibold text-brand">สำหรับร้านชำและร้านค้าปลีกทุกขนาด</span>
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              จัดการร้านชำ
              <br />
              ให้ง่ายขึ้น <span className="text-brand">ในระบบเดียว</span>
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-foreground/60">
              คุมสต๊อกสินค้า เทียบราคาซัพพลายเออร์ บันทึกรายรับรายวัน เก็บบิลซื้อ
              และออกรายงานสรุป ครบในที่เดียว ใช้งานง่าย เหมาะกับร้านชำไทยโดยเฉพาะ
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a href="#signup" className="rounded-[10px] bg-accent px-6 py-3.5 text-[14.5px] font-bold text-[#1F3A28]">
                เริ่มใช้งานฟรี 14 วัน
              </a>
              <a href="#features" className="rounded-[10px] border border-border px-6 py-3.5 text-[14.5px] font-semibold text-foreground/80">
                ดูฟีเจอร์ทั้งหมด
              </a>
            </div>
            <p className="mt-5 text-[12.5px] text-muted">ไม่ต้องผูกบัตรเครดิต · ยกเลิกได้ทุกเมื่อ</p>
          </div>

          <div className="rounded-[18px] border border-border bg-white p-6 shadow-[0_24px_50px_rgba(20,50,30,0.12)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-foreground">ยอดขายวันนี้</span>
              <span className="rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">+12.4%</span>
            </div>
            <div className="mb-5 font-display text-3xl font-bold text-foreground">฿ 8,420</div>
            <div className="mb-5 flex h-[90px] items-end gap-2.5">
              {[40, 65, 52, 80, 95].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-[5px] rounded-b-[3px] ${i >= 3 ? "bg-brand" : "bg-brand-light"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1 rounded-[10px] bg-background p-3">
                <div className="text-[11px] text-muted">สินค้าใกล้หมด</div>
                <div className="mt-1 text-base font-bold text-accent-dark">7 รายการ</div>
              </div>
              <div className="flex-1 rounded-[10px] bg-background p-3">
                <div className="text-[11px] text-muted">บิลค้างชำระ</div>
                <div className="mt-1 text-base font-bold text-danger">฿12,300</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-brand-dark py-11">
        <div className="mx-auto grid max-w-[1160px] grid-cols-2 gap-6 px-6 text-center sm:grid-cols-4">
          {[
            ["500+", "ร้านค้าที่ใช้งานจริง"],
            ["฿120 ล้าน+", "ยอดขายที่บันทึกผ่านระบบ"],
            ["2 ล้าน+", "รายการบิลที่จัดการ"],
            ["4.8/5", "คะแนนความพึงพอใจ"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-[28px] font-bold text-white">{n}</div>
              <div className="mt-1 text-[12.5px] text-white/65">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="mx-auto mb-12 max-w-[560px] text-center">
            <div className="mb-2.5 text-[13px] font-bold tracking-wide text-accent-dark">ฟีเจอร์หลัก</div>
            <h2 className="font-display text-[30px] font-bold text-foreground">ทุกอย่างที่ร้านชำต้องใช้ ในที่เดียว</h2>
            <p className="mt-3 text-[14.5px] text-muted">ออกแบบมาสำหรับร้านชำไทยโดยเฉพาะ ใช้งานง่าย ไม่ต้องมีความรู้ด้านบัญชี</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border p-6 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light">
                  <f.icon className="h-[22px] w-[22px] text-brand" />
                </div>
                <div className="mb-2 font-display text-base font-semibold text-foreground">{f.title}</div>
                <div className="text-[13.5px] leading-relaxed text-muted">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="bg-[oklch(0.98_0.006_90)] py-20 sm:py-24">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="mx-auto mb-10 max-w-[560px] text-center">
            <div className="mb-2.5 text-[13px] font-bold tracking-wide text-accent-dark">แพ็กเกจราคา</div>
            <h2 className="font-display text-[30px] font-bold text-foreground">เลือกแพ็กเกจที่เหมาะกับร้านคุณ</h2>
            <p className="mt-3 text-[14.5px] text-muted">ทดลองใช้ฟรี 14 วันทุกแพ็กเกจ ไม่มีค่าใช้จ่ายผูกมัด</p>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl p-7 ${
                  plan.featured ? "relative border-2 border-accent bg-brand-dark" : "border border-border bg-white"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-[#1F3A28]">
                    แนะนำมากที่สุด
                  </div>
                )}
                <div className={`font-display text-[17px] font-semibold ${plan.featured ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </div>
                <div className={`mt-1.5 text-[12.5px] ${plan.featured ? "text-white/65" : "text-muted"}`}>{plan.desc}</div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className={`font-display text-[32px] font-bold ${plan.featured ? "text-white" : "text-foreground"}`}>
                    ฿{plan.price}
                  </span>
                  <span className={`text-[13px] ${plan.featured ? "text-white/65" : "text-muted"}`}>/เดือน</span>
                </div>
                <a
                  href="#signup"
                  className={`mt-6 rounded-[9px] py-3 text-center text-[13.5px] font-bold ${
                    plan.featured ? "bg-accent text-[#1F3A28]" : "border border-border text-foreground/80"
                  }`}
                >
                  เริ่มทดลองใช้
                </a>
                <div className="mt-6 flex flex-col gap-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className={`flex gap-2 text-[13px] ${plan.featured ? "text-white/85" : "text-foreground/75"}`}>
                      <span className={plan.featured ? "text-accent" : "text-brand"}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            ทุกแพ็กเกจเริ่มต้นด้วยการทดลองใช้งานฟรี — ระบบเรียกเก็บเงินยังอยู่ระหว่างการพัฒนา
          </p>
        </div>
      </div>

      {/* Signup */}
      <div id="signup" className="py-20 sm:py-24">
        <div className="mx-auto max-w-[480px] px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display text-[28px] font-bold text-foreground">สมัครใช้งานฟรี 14 วัน</h2>
            <p className="mt-2.5 text-sm text-muted">กรอกข้อมูลร้านของคุณ เริ่มใช้งานได้ทันทีภายในไม่กี่นาที</p>
          </div>
          <SignupForm />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-brand-dark py-10">
        <div className="mx-auto max-w-[1160px] px-6">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-white/10 pb-7">
            <div className="max-w-[280px]">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent">
                  <ShopIcon className="h-[18px] w-[18px]" stroke="#1F3A28" />
                </div>
                <span className="font-display text-base font-semibold text-white">ร้านชำครบวงจร</span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/65">
                ระบบจัดการร้านชำสำหรับร้านค้าไทย ครบทุกฟังก์ชันที่ร้านต้องใช้
              </p>
            </div>
            <div className="flex gap-14">
              <div>
                <div className="mb-3.5 text-[13px] font-semibold text-white">ผลิตภัณฑ์</div>
                <div className="flex flex-col gap-2.5 text-[13px] text-white/65">
                  <a href="#features">ฟีเจอร์</a>
                  <a href="#pricing">แพ็กเกจราคา</a>
                </div>
              </div>
              <div>
                <div className="mb-3.5 text-[13px] font-semibold text-white">ติดต่อเรา</div>
                <div className="flex flex-col gap-2.5 text-[13px] text-white/65">
                  <span>line: @groceryapp</span>
                  <span>02-123-4567</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-5 text-xs text-white/50">© 2569 ร้านชำครบวงจร สงวนลิขสิทธิ์</div>
        </div>
      </div>
    </div>
  );
}
