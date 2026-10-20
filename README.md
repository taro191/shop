# ร้านชำครบวงจร

ระบบจัดการร้านขายของชำแบบ SaaS หลายผู้เช่า (multi-tenant) สำหรับเจ้าของร้านและพนักงาน ใช้ได้ทั้งบนเดสก์ท็อปและมือถือ

**ฟีเจอร์หลัก**

- **หน้าขาย (POS)** — เลือกสินค้า/สแกนบาร์โค้ด ตัดสต็อกแบบ atomic รับเงินสดหรือ QR พร้อมเพย์ (สร้าง QR ตามยอดจริง)
  พิมพ์ใบเสร็จ และออกใบกำกับภาษีสำหรับร้านที่จด VAT
- **คลังสินค้ากลาง** — ฐานข้อมูลสินค้าร้านขายของชำกว่า 2,750 รายการ (รวมยาสามัญประจำบ้านและอาหารสัตว์) (ส่วนใหญ่มีบาร์โค้ดจริง) ที่ทุกร้านใช้ร่วมกัน
  เลือกสินค้าแล้วใส่ราคาทุน/ราคาขาย/จำนวน เพื่อเพิ่มเข้าคลังสินค้าของร้านได้ทันที
- **สินค้าและสต็อก** — คลังสินค้า, ตรวจนับสต็อก, ตัดสต็อกของเสีย/หมดอายุ, ติดตามวันหมดอายุ, พิมพ์ฉลากบาร์โค้ด
- **ซื้อสินค้า** — เทียบราคาซัพพลายเออร์, ใบสั่งซื้อ (PO) และบิลซื้อสินค้า พร้อมรับสินค้าเข้าสต็อก
- **ลูกค้า** — สมาชิกและแต้มสะสม
- **การเงิน** — รายรับรายวัน, บัญชีรายรับ-รายจ่ายทั่วไป (ค่าน้ำไฟ ค่าเช่า ค่าแรง ฯลฯ), รายงานสรุปต้นทุน/กำไร
- **จัดการร้าน** — สิทธิ์เจ้าของ/พนักงาน, หลายสาขา, audit log, แพ็กเกจการใช้งาน, แจ้งเตือนสินค้าใกล้หมดผ่าน Webhook
- **มือถือ** — มือถือจะเข้าหน้าหลัก (`/home`) แทนแดชบอร์ด มีปุ่มใหญ่ไปขายหน้าร้าน, เช็คสต๊อก (`/stock`),
  รับสินค้า (`/receive` — สแกนของเข้าสต๊อก บันทึกเป็นบิลซื้อให้อัตโนมัติ), รายรับ-รายจ่าย และ Admin (เจ้าของร้านเท่านั้น)
  พร้อมใช้งานแบบ PWA (ติดตั้งลงหน้าจอได้ มีหน้าแสดงเมื่อออฟไลน์)

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 + MariaDB/MySQL (`@prisma/adapter-mariadb`)

## เริ่มต้นใช้งาน

1. ติดตั้ง dependencies:

   ```bash
   npm install
   ```

2. ตั้งค่าฐานข้อมูล — สร้างฐานข้อมูล MariaDB (หรือ MySQL) แบบ `utf8mb4` แล้วสร้างไฟล์ `.env`
   ชี้ `DATABASE_URL` ไปที่ฐานนั้น เช่น MariaDB ใน WAMP (พอร์ต 3307):

   ```sql
   CREATE DATABASE shop_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

   ```bash
   # .env
   DATABASE_URL="mysql://root@127.0.0.1:3307/shop_dev"
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

## Deploy บน Plesk (Node.js / Passenger)

1. Git: ดึง repo ลงโฟลเดอร์ของโดเมน (เช่น `/shop`)
2. Node.js: Application Root = โฟลเดอร์ repo, Document Root = `<repo>/public`,
   Application Startup File = `server.js`, Application Mode = `production`
3. Custom environment variables: `DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DBNAME"` และ `SESSION_SECRET` ค่าใหม่
   (ไม่ต้องมีไฟล์ `.env` บนเซิร์ฟเวอร์)
4. ใน "Run Node.js commands" (ต้องติดตั้ง devDependencies ด้วยเพราะใช้ตอน build — ขั้นนี้ไม่ต้องใช้ env vars):

   ```bash
   npm install --include=dev
   npm run build
   ```

5. กด Restart App — `server.js` จะรัน `prisma migrate deploy` ให้เองตอนเริ่มแอป (ปิดได้ด้วย `SKIP_MIGRATE=1`)
   ทุกครั้งที่ deploy โค้ดใหม่ให้ทำข้อ 4–5 ซ้ำ

## คลังสินค้ากลาง (shared catalog)

ตาราง `CatalogProduct` ไม่ผูกกับร้านใด ข้อมูลมาจาก 3 แหล่ง:

- **Open Food Facts** (สัญญาอนุญาต [ODbL](https://opendatacommons.org/licenses/odbl/1-0/)) — สินค้าที่ขายในไทย
  คัดเฉพาะบาร์โค้ด 885 (ลงทะเบียนในไทย) และตัดแบรนด์ของร้านสะดวกซื้อ/ห้าง อาหารพร้อมทาน ของสด และอาหารเสริมออก
  ข้อมูลนี้ผู้ใช้ทั่วโลกร่วมกันบันทึก ชื่อหรือขนาดอาจคลาดเคลื่อนได้ และหน้า `/catalog` แสดงที่มาของข้อมูลไว้แล้ว
  (ODbL กำหนดให้ระบุที่มา และถ้าเผยแพร่ฐานข้อมูลที่ดัดแปลงต่อ ต้องใช้สัญญาอนุญาตเดียวกัน)
- **Open Pet Food Facts** (ODbL เช่นกัน) — อาหารสัตว์บาร์โค้ดไทย เก็บใน `scripts/catalog/petfood.json`
  โดยเขียนชื่อเป็นภาษาไทยใหม่ด้วยมือ (ข้อมูลต้นทางเป็นภาษาอังกฤษและขนาดไม่น่าเชื่อถือ)
- **`scripts/catalog/curated.json`** — สินค้าพื้นฐานไม่มีบาร์โค้ด (ข้าวสาร ไข่ น้ำแข็ง น้ำตาล ฯลฯ)
  ของใช้ในบ้าน/ของใช้ส่วนตัว อาหารสัตว์ทั่วไป และหมวด **ยาและเวชภัณฑ์** ซึ่ง Open Food Facts แทบไม่มีข้อมูล
  หมวดยาใส่เฉพาะ**ยาสามัญประจำบ้าน**และอุปกรณ์ปฐมพยาบาล ซึ่งร้านค้าทั่วไปขายได้โดยไม่ต้องมีใบอนุญาตขายยา
  ห้ามเพิ่มยาอันตราย/ยาควบคุมพิเศษ (เช่น ยาปฏิชีวนะ) ลงคลังกลาง

**ค้นบาร์โค้ดจากอินเทอร์เน็ต** — ถ้าค้น/สแกนบาร์โค้ดแล้วไม่พบทั้งในร้านและคลังกลาง ระบบจะถาม Open Food Facts,
Open Pet Food Facts, Open Beauty Facts และ Open Products Facts (`src/lib/online-product-lookup.ts`) ถ้าพบจะบันทึกเข้าคลังกลาง
ให้ร้านอื่นเจอทันทีครั้งหน้า (บาร์โค้ดที่ไม่พบจะไม่ถามซ้ำ 6 ชั่วโมง) กฎตั้งชื่อ/จัดหมวดใช้ร่วมกับสคริปต์ build
ที่ `src/lib/catalog-rules.ts` (สคริปต์ import ไฟล์ `.ts` นี้ตรงๆ ด้วย type stripping ของ Node 22.18+)

ข้อมูลถูกใส่ผ่าน migration (`prisma/migrations/*_shared_catalog`) จึงขึ้นเซิร์ฟเวอร์พร้อม `prisma migrate deploy`
วิธีอัปเดตข้อมูล:

```bash
# 1. ดาวน์โหลดหน้า JSON จาก search.openfoodfacts.org ลงโฟลเดอร์ เช่น /tmp/off (ไฟล์ off_1.json, off_2.json, ...)
#    https://search.openfoodfacts.org/search?q=countries_tags:%22en:thailand%22&page_size=100&page=N
#      &fields=code,product_name,product_name_th,product_name_en,brands,quantity,categories_tags,unique_scans_n
# 2. สร้าง prisma/catalog/catalog.json ใหม่
node scripts/catalog/build-catalog.mjs /tmp/off
# 3. สร้าง migration ว่าง แล้วเติมคำสั่ง upsert ลงไป
npx prisma migrate dev --create-only --name refresh_catalog
#    (--diff ใส่เฉพาะแถวที่เพิ่ม/เปลี่ยนจากเวอร์ชันก่อน)
git show HEAD:prisma/catalog/catalog.json > /tmp/old.json
node scripts/catalog/catalog-to-sql.mjs --diff /tmp/old.json >> prisma/migrations/<โฟลเดอร์ใหม่>/migration.sql
npx prisma migrate dev
```

## โครงสร้างโปรเจกต์

- `src/app/page.tsx` — หน้า Landing + ฟอร์มสมัครสมาชิก (สร้างร้านใหม่)
- `src/app/login/page.tsx` — เข้าสู่ระบบ
- `src/app/(protected)/` — หน้าจอหลังเข้าสู่ระบบ — responsive: sidebar บนเดสก์ท็อป, bottom nav บนมือถือ
  ในโค้ดชุดเดียวกัน
  - ขายและการเงิน: `sell`, `income`, `cashflow`, `reports`, `dashboard`
  - มือถือ: `home` (หน้าหลัก), `stock` (เช็คสต๊อก), `receive` (รับสินค้า)
  - สินค้าและสต็อก: `inventory`, `catalog` (คลังสินค้ากลาง), `stock-take`, `write-off`, `labels`, `search`
  - ซื้อสินค้าและลูกค้า: `suppliers`, `bills` (บิลซื้อ/ใบสั่งซื้อ), `customers`
  - จัดการร้าน (เฉพาะเจ้าของ): `settings`, `staff`, `branches`, `billing`, `audit-log`
  - `more` — เมนูรวมบนมือถือ
- `src/proxy.ts` — ตรวจ session และพามือถือ (เช็กจาก User-Agent) ไปหน้า `/home` (`/dashboard?full=1` เปิดแดชบอร์ดเต็มบนมือถือ)
- `src/lib/` — Prisma client, session/auth, query helpers, QR พร้อมเพย์ (`promptpay.ts`), แพ็กเกจ (`plan.ts`), audit log
- `public/sw.js`, `public/manifest.webmanifest` — service worker และ manifest สำหรับ PWA/ออฟไลน์
- `prisma/schema.prisma` — โมเดลข้อมูล (multi-tenant ด้วย `storeId` ทุกตาราง)
- `grocery-saas/` — มอคอัพดีไซน์ต้นฉบับ (Claude Design canvas) ไว้อ้างอิง ไม่ใช่ส่วนหนึ่งของแอประบบจริง

## หมายเหตุสำคัญ

- **ฐานข้อมูลต้องใช้ engine InnoDB** (ต้องมี transaction และ foreign key) MariaDB ใน WAMP ตั้งค่าเริ่มต้นเป็น MyISAM
  ให้ตั้ง `default_storage_engine=InnoDB` ใน `my.ini` ก่อนรัน migration ส่วน hosting ทั่วไป (เช่น Plesk) ใช้ InnoDB อยู่แล้ว
- **การค้นหาไม่สนตัวพิมพ์เล็ก/ใหญ่** อาศัย collation ของฐานข้อมูล (`utf8mb4_unicode_ci` หรือ `utf8mb4_general_ci`)
  ห้ามสร้างฐานข้อมูลด้วย collation แบบ `_bin` / `_cs`

- **การสแกนบาร์โค้ด** ใช้ `BarcodeDetector` API ของเบราว์เซอร์ถ้ามี (Chrome บน Android) ถ้าไม่มี (เช่น Safari บน iPhone)
  จะโหลดแพ็กเกจ `barcode-detector` (ZXing แบบ WebAssembly ตัวอ่านจะดาวน์โหลดจาก CDN ตอนเปิดกล้องครั้งแรก) แทน
  กล้องใช้ได้เฉพาะบน HTTPS หรือ localhost และมีช่องกรอกเลขบาร์โค้ดด้วยตนเองเป็นทางเลือกสำรองเสมอ
- **ต้นทุน/กำไรในหน้ารายงาน** คำนวณจากต้นทุนจริงของสินค้าที่ขายผ่านหน้าขาย (POS) ส่วนยอดขายที่บันทึกเป็นยอดรวม
  โดยไม่มีรายการสินค้า (เช่น บันทึกในหน้ารายรับรายวัน) จะใช้**ค่าประมาณการ**จากอัตรากำไรเฉลี่ยของสินค้าในคลัง
  หน้ารายงานจะแสดงว่ากี่เปอร์เซ็นต์ของยอดขายคำนวณจากข้อมูลจริง
- **QR พร้อมเพย์** สร้างตามมาตรฐาน EMVCo (QR แบบคงที่ ไม่ต้องสมัคร payment gateway แคชเชียร์ยืนยันการรับเงินเอง)
  ตั้งค่าเลขพร้อมเพย์ได้ที่หน้าตั้งค่าร้าน — ยังไม่ได้ทดสอบสแกนด้วยแอปธนาคารจริง ควรทดสอบก่อนใช้งานจริง
- **แจ้งเตือนสินค้าใกล้หมด** ส่งเป็น HTTP POST ไปยัง Webhook URL ที่ตั้งไว้ในหน้าตั้งค่าร้าน
- ยังไม่มีระบบเรียกเก็บเงิน/ชำระค่าสมาชิกจริง — หน้าแพ็กเกจกำหนดเพดานจำนวนพนักงาน/สาขา แต่การเปลี่ยนแพ็กเกจ
  ไม่มีการชำระเงิน ทุกการสมัครเริ่มที่แผนทดลองใช้
