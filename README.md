# Fairy & Fome — Work Manager

ระบบจัดการงานสำหรับแฟรี่ (ผู้จัดการ) และโฟม (ครีเอเตอร์) — บรีฟ/ไทม์ไลน์งาน, Storyline, Details of Work, ใบเสนอราคา/ใบแจ้งหนี้/ใบเสร็จ, ปฏิทิน + sync กับ iPhone, เช็คอิน/เช็คเอาท์

Next.js 16 (App Router) + TypeScript + Tailwind v4 + Prisma 7 (Postgres) + Supabase Storage. ออกแบบเป็น PWA ใช้งานหลักบน iPhone, ติดตั้งขึ้นหน้าจอโฮมได้เหมือนแอปจริง

## ต้องมีก่อนเริ่ม (Prerequisites)

- **Node.js 22+** — โปรเจกต์ pin ไว้ที่ Node 22 (ดู `.nvmrc`) เพราะ `prisma dev` (local Postgres) ต้องการ Node 22 ขึ้นไป ใช้ `nvm use` เพื่อสลับเวอร์ชันอัตโนมัติถ้ามี nvm อยู่แล้ว
- npm (มากับ Node)

## เริ่ม dev ในเครื่อง (Local development)

```bash
nvm use               # หรือให้แน่ใจว่าใช้ Node 22+
npm install
npx prisma dev --detach --name forfairyandfome   # local Postgres ของ Prisma เอง ไม่ต้องลง Docker
npx prisma db push    # sync schema เข้า DB
npx prisma generate   # generate Prisma Client
npx tsx prisma/seed.ts # สร้าง user เริ่มต้น (ดู PIN ด้านล่าง)
npm run dev
```

เปิด http://localhost:3000

**PIN เริ่มต้น** (ตั้งจาก `prisma/seed.ts`, เปลี่ยนได้ทีหลังใน Settings ในแอป — หน้าเปลี่ยน PIN ยังไม่ทำ ตอนนี้เปลี่ยนได้โดยรัน seed ใหม่หรือแก้ผ่าน Prisma Studio):
- **Fairy**: PIN `1414`
- **Fome**: PIN `2828`

> `npx prisma dev` รันเป็น background process แยกจาก `npm run dev` — เปิดครั้งเดียวค้างไว้ได้ ใช้ `npx prisma dev ls` ดูสถานะ, `npx prisma dev stop forfairyandfome` เพื่อปิด

## Environment variables

ดู `.env` ที่มีอยู่แล้วสำหรับ local dev (local Postgres + dev-only auth secret) ตัวแปรทั้งหมด:

| ตัวแปร | จำเป็นไหม | คำอธิบาย |
|---|---|---|
| `DATABASE_URL` | ใช่ | Postgres connection string |
| `AUTH_SECRET` | ใช่ | secret สำหรับ sign session cookie (สุ่มค่าใหม่สำหรับ production ด้วย `openssl rand -base64 32`) |
| `TZ` | ใช่ | ตั้งเป็น `Asia/Bangkok` เสมอ — วันที่ทั้งแอป (วันที่งาน, ปฏิทิน, เอกสาร) อิงเวลาไทยล้วน ไม่มี per-user timezone |
| `SUPABASE_URL` | production เท่านั้น | ใช้เก็บไฟล์/รูปที่อัปโหลด ถ้าไม่ตั้งจะ fallback เป็นเก็บไฟล์ในเครื่อง (`.data/uploads`, ใช้ได้แค่ dev) |
| `SUPABASE_SERVICE_ROLE_KEY` | production เท่านั้น | คู่กับ `SUPABASE_URL` |

## Deploy จริง (Production setup)

แอปนี้ยังไม่ได้ deploy — ต้องสร้างบัญชี Supabase และ Vercel เอง (เป็นขั้นตอนที่ทำแทนไม่ได้)

### 1. สร้าง Supabase project

1. ไปที่ https://supabase.com → New Project
2. รอ project สร้างเสร็จ → เข้า Project Settings → Database → คัดลอก **Connection string** (เลือกแบบ "URI", ใช้ตัว Session pooler หรือ Direct connection ก็ได้) → นี่คือค่า `DATABASE_URL` สำหรับ production
3. เข้า Project Settings → API → คัดลอก **Project URL** (= `SUPABASE_URL`) และ **service_role key** (= `SUPABASE_SERVICE_ROLE_KEY`, เก็บเป็นความลับ ห้าม expose ฝั่ง client)
4. เข้า Storage → New bucket → ตั้งชื่อ `attachments` → **Public bucket** (ต้องเปิด public ให้ดูรูป/ไฟล์แนบผ่านลิงก์ตรงได้)
5. รัน migration เข้า production DB: ตั้ง `DATABASE_URL` ชั่วคราวเป็นของ Supabase แล้วรัน `npx prisma migrate dev --name init` (ครั้งแรกที่ตั้งค่ากับ DB ว่าง) เพื่อสร้าง migration history ที่ใช้ deploy ซ้ำได้ปลอดภัยด้วย `npx prisma migrate deploy`

### 2. Deploy บน Vercel

1. Push โค้ดขึ้น GitHub
2. ไปที่ https://vercel.com/new → import repo นี้
3. ใส่ Environment Variables ตามตารางด้านบน (ค่า production ทั้งหมด รวม `TZ=Asia/Bangkok`)
4. Deploy

### 3. หลัง deploy — seed user จริง

รันจากเครื่อง โดยตั้ง `DATABASE_URL` ชี้ไปที่ Supabase ก่อน:

```bash
DATABASE_URL="<supabase-connection-string>" npx tsx prisma/seed.ts
```

แนะนำให้เปลี่ยน PIN ใน `prisma/seed.ts` ก่อนรัน (ค่า default `1414` / `2828` ไม่ควรใช้จริง)

### 4. Sync ปฏิทินกับ iPhone

เข้า **Settings** ในแอป → คัดลอกลิงก์ปฏิทิน → บน iPhone: Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar → วางลิงก์ เป็น one-way sync (แอป → iPhone), iOS จะ refresh เป็นระยะ ไม่ real-time

## สถาปัตยกรรมคร่าว ๆ

- `src/app/(app)/` — ทุกหน้าที่ต้อง login (bottom nav: วันนี้ / งานทั้งหมด / ปฏิทิน / เอกสาร)
- `src/app/login/` — หน้า PIN pad, อยู่นอก auth guard
- `src/proxy.ts` — Next 16's middleware (เช็ค session cookie แบบ optimistic, ไม่ query DB)
- `src/lib/auth.ts` — session/DB user helpers (data access layer)
- `src/lib/storage.ts` — upload abstraction, สลับ local disk ↔ Supabase Storage อัตโนมัติตาม env
- `src/lib/pdf/` — PDF generation (@react-pdf/renderer), ฟอนต์ Sarabun (ไทย+อังกฤษในไฟล์เดียว, static weight — ฟอนต์แบบ variable ทำให้ layout รวนกับ react-pdf)
- `prisma/schema.prisma` — data model ทั้งหมด

## ข้อจำกัดที่รู้อยู่แล้ว (Known limitations)

- PDF ที่ export: ข้อความไทยแสดงผลถูกต้อง 100% แต่ถ้า copy ข้อความออกจากไฟล์ PDF โดยตรง ลำดับตัวอักษรอาจสลับ (ข้อจำกัดของ react-pdf กับสคริปต์ไทยที่ซับซ้อน — ไม่กระทบการดู/พิมพ์/ส่งไฟล์)
- Calendar sync กับ iPhone เป็น one-way (แอป → iPhone) เท่านั้น ไม่มี two-way sync
- ยังไม่มีหน้าเปลี่ยน PIN ในแอป (เปลี่ยนได้ผ่าน seed script หรือแก้ตรงใน DB)
