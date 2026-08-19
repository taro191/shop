# ร้านชำครบวงจร

ระบบจัดการร้านขายของชำแบบ SaaS หลายผู้เช่า (multi-tenant) — สต๊อกสินค้า, เทียบราคาซัพพลายเออร์,
รายรับรายวัน, บิลซื้อสินค้า, รายงานสรุป และหน้าค้นหาราคาสินค้าสำหรับมือถือ (พิมพ์ค้นหา หรือสแกนบาร์โค้ดจากกล้อง)

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 + PostgreSQL

## เริ่มต้นใช้งาน

1. ติดตั้ง dependencies:

   ```bash
   npm install
   ```

2. ตั้งค่าฐานข้อมูล — สร้างไฟล์ `.env` (ดูตัวอย่างค่าที่ต้องมีด้านล่าง) แล้วชี้ `DATABASE_URL`
   ไปยัง Postgres ของคุณ วิธีที่เร็วที่สุดสำหรับ local dev คือให้ Prisma รันเซิร์ฟเวอร์ Postgres ให้เอง:

   ```bash
   npx prisma dev
   ```

   คำสั่งนี้จะพิมพ์ connection string ออกมา (เช่น `postgres://postgres:postgres@localhost:PORT/DBNAME`)
   ให้คัดลอกไปใส่ใน `.env`. หรือจะใช้ Postgres ของคุณเอง / บริการฟรีอย่าง
   [Neon](https://neon.tech) หรือ [Supabase](https://supabase.com) ก็ได้เช่นกัน

   ```bash
   # .env
   DATABASE_URL="postgres://postgres:postgres@localhost:PORT/DBNAME?sslmode=disable"
   SESSION_SECRET="สุ่มด้วย: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
   ```

3. รัน migration และข้อมูลตัวอย่าง:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

   บัญชีทดลอง: เบอร์ `0812345678` / รหัสผ่าน `password123`

4. รันเซิร์ฟเวอร์:

   ```bash
   npm run dev
   ```

   เปิด [http://localhost:3000](http://localhost:3000)

## โครงสร้างโปรเจกต์

- `src/app/page.tsx` — หน้า Landing + ฟอร์มสมัครสมาชิก (สร้างร้านใหม่)
- `src/app/login/page.tsx` — เข้าสู่ระบบ
- `src/app/(protected)/` — หน้าจอหลังเข้าสู่ระบบ (แดชบอร์ด, คลังสินค้า, เทียบราคาซัพพลายเออร์,
  รายรับรายวัน, บิลซื้อสินค้า, รายงานสรุป, ค้นหาราคา, เมนู) — responsive: sidebar บนเดสก์ท็อป,
  bottom nav บนมือถือ ในโค้ดชุดเดียวกัน
- `src/lib/` — Prisma client, session/auth, query helpers
- `prisma/schema.prisma` — โมเดลข้อมูล (multi-tenant ด้วย `storeId` ทุกตาราง)
- `grocery-saas/` — มอคอัพดีไซน์ต้นฉบับ (Claude Design canvas) ไว้อ้างอิง ไม่ใช่ส่วนหนึ่งของแอประบบจริง

## หมายเหตุสำคัญ

- **การสแกนบาร์โค้ด** ใช้ `BarcodeDetector` API ของเบราว์เซอร์ (รองรับ Chrome/Edge บนมือถือและเดสก์ท็อป
  ยังไม่รองรับ Safari/iOS) มีช่องกรอกเลขบาร์โค้ดด้วยตนเองเป็นทางเลือกสำรองเสมอ
- **ต้นทุน/กำไรในหน้ารายงาน** เป็น**ค่าประมาณการ** คำนวณจากอัตรากำไรเฉลี่ยของสินค้าในคลัง เนื่องจากระบบยังไม่ได้
  ผูกรายการสินค้าที่ขายแต่ละชิ้นเข้ากับยอดขายแต่ละรายการ (ยังไม่มีหน้าขายแบบ POS ที่เลือกสินค้าทีละชิ้น)
- ยังไม่มีระบบเรียกเก็บเงิน/ชำระค่าสมาชิกจริง (หน้าแพ็กเกจราคาเป็นข้อมูลนำเสนอ ทุกการสมัครเริ่มที่แผนทดลองใช้)
