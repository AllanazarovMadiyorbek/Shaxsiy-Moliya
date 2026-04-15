# Shaxsiy Moliya Loyihasini Vercel va Renderga Joylash Yo'riqnomasi (Roadmap)

Ushbu loyiha ikkita asosiy qismdan iborat:
- **Frontend** (Vite + React)
- **Backend** (Node.js + Express + PostgreSQL)

Eng yaxshi va bepul (yoki arzon) yechim: **Frontendni Vercelga, Backendni esa Renderga** joylashdir. Chunki Vercel statik fayllar (React/Vite) uchun juda tez ishlaydi, Render esa Node.js API va ma'lumotlar bazasi uchun qulay.

---

## 🏗 bosqich: Tayyorgarlik va Ma'lumotlar Bazasi (Database)

Backend ishlashi uchun birinchi navbatda bulutda ishlaydigan (cloud) PostgreSQL bazasi kerak bo'ladi. Loyihada ko'rib turganimdek, **Neon DB** yoki **Render PostgreSQL** mos keladi.

1. **Neon.tech yoki Render orqali yangi PostgreSQL bazasi yarating.**
2. Yangi yaratilgan bazaning ulanish havolasini (Connection string) nusxalab oling.
   - *Farmat taxminan shunday bo'ladi:* `postgresql://username:password@host/database_name?sslmode=require`
3. Loyihani GitHub ga push qiling. (Agar hali qilinmagan bo'lsa)

---

## 🚀 2-bosqich: Backendni Renderga Joylash (Render.com)

Backend (Node.js API) doimo ishlab turishi va ma'lumotlar bilan ishlashi kerak. Render buning uchun ajoyib bepul tarif taqdim etadi.

1. **Render.com ga kiring va GitHub orqali ro'yxatdan o'ting.**
2. "New+" tugmasini bosib, **Web Service** ni tanlang.
3. GitHub dagi ushbu loyihangizni (repository) tanlang.
4. Loyihangiz papkada joylashgani sababli, **Root Directory** bo'limida `backend` deb yozing.
5. Sozlamalarni quyidagicha kiriting:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` yoki `node server.js`
6. **Environment Variables (Atrof-muhit o'zgaruvchilari)** bo'limiga kiring va quyidagilarni qo'shing (`backend/env.example` ga asoslanib):
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (1-bosqichda nusxalab olingan baza URL si)
   - `JWT_SECRET` = (xavfsiz ixtiyoriy sirli so'z, masalan: `uzun-sirli-kalit-12345`)
   - `FRONTEND_URL` = (hozircha bo'sh qoldiring, Vercel linkini olgach qo'shasiz)
7. **Create Web Service** tugmasini bosing va deploy tugashini kuting.
8. So'ng, Render sizga API URL beradi (masalan: `https://aurora-backend.onrender.com`). Buni nusxalab oling!

> **Eslatma:** Ma'lumotlar bazasi jadvallarini yaratish uchun migratsiyalarni ishga tushirishingiz kerak bo'ladi. Render Terminal orqali yoki o'z kompyuteringizda production DB si bilan `npm run migrate` buyrug'ini bering.

---

## 🌐 3-bosqich: Frontendni Vercelga Joylash (Vercel.com)

Vite va React ilovalari uchun Vercel eng oson va tezkor platforma hisoblanadi.

1. **Vercel.com ga kiring va ro'yxatdan o'ting (GitHub bilan).**
2. "Add New..." -> **Project** ni tanlang.
3. Loyihangizning GitHub reposini tanlang.
4. **Root Directory** bo'limida Edit tugmasini bosib, `frontend` papkasini tanlang.
5. Framework Preset avtomatik **Vite** ga o'tishi kerak. Agar o'tmasa, ro'yxatdan Vite ni tanlang.
6. **Environment Variables** bo'limini oching va quyidagini qo'shing (`frontend/env.example` ga asosan):
   - `VITE_API_URL` = `(Render bergan URL)/api` (masalan: `https://aurora-backend.onrender.com/api`)
7. **Deploy** tugmasini bosing! Vaqt o'tmay loyihangiz internetda paydo bo'ladi.
8. Vercel sizga frontend ulanishini (masalan: `https://shaxsiy-moliya.vercel.app`) taqdim etadi. Buni nusxalab oling.

---

## 🔗 4-bosqich: Ikkalasini Bog'lash (CORS)

Endi Frontend ishlab turibdi, Backend ham ishlab turibdi. Lekin backend xavfsizlik sabab boshqa joydan kelgan so'rovlarni qabul qilmasligi mumkin (CORS xatosi). 

1. Qayta **Render.com** ga, Backend xizburningizga (Web Service) kiring.
2. **Environment Variables** bo'limini oching.
3. `FRONTEND_URL` o'zgaruvchisini Vercel taqdim etgan URL ga o'zgartiring (masalan: `https://shaxsiy-moliya.vercel.app`).
4. O'zgarishlarni saqlang va Backendni qayta ishga tushiring (Manual Deploy xizmati).

> **OAuth Eslatmasi:** Agar Google OAuth ishlatmoqchi bo'lsangiz, Renderdagi Environment Variables ro'yxatiga `GOOGLE_CLIENT_ID` va `GOOGLE_CLIENT_SECRET` ham qo'shishingiz kerak va Google Cloud Consolda Callback URL ni Renderdagi URL ga moslab yangilashingiz zarur.

---

## Xulosa

Shu ketma-ketlikda qilsangiz, loyihangiz to'liq Production muhitda ishlaydi:
- Mijozlar brauzeri => **Vercel (Frontend)** => **Render (Backend API)** => **PostgreSQL (Database)**.

Agar biron joyda xato yoki qiyinchilik bo'lsa, xabarni (logni) yuboring, yordam beraman!
