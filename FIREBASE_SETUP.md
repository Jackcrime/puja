# Firebase Setup Guide — GKPB Puji dan Janji

## Langkah 1 — Buat project Firebase

1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Klik **Add project** → beri nama (contoh: `gkpb-puji-dan-janji`)
3. Google Analytics boleh dimatikan untuk proyek ini

---

## Langkah 2 — Aktifkan layanan yang dibutuhkan

### Firestore Database
- Sidebar → **Build → Firestore Database**
- Klik **Create database**
- Pilih mode **Production** (kita pakai rules sendiri)
- Pilih region: **asia-southeast1** (Singapore, terdekat dari Bali)

### Firebase Authentication
- Sidebar → **Build → Authentication**
- Klik **Get started**
- Tab **Sign-in method** → aktifkan **Email/Password**
- Tab **Users** → klik **Add user**
  - Email: `admin@gkpb.or.id` (atau email yang kamu mau)
  - Password: buat password yang kuat
  - **Catat email & password ini** — dipakai untuk login di `/admin`

### Firebase Storage
- Sidebar → **Build → Storage**
- Klik **Get started**
- Pilih mode **Production**
- Pilih region yang sama dengan Firestore: **asia-southeast1**

---

## Langkah 3 — Ambil konfigurasi Firebase

1. Sidebar → **Project Settings** (ikon gear)
2. Tab **General** → scroll ke bawah ke **Your apps**
3. Klik ikon **Web** (`</>`)
4. Register app dengan nama (contoh: `gkpb-web`)
5. **Jangan centang** Firebase Hosting
6. Klik **Register app**
7. Copy `firebaseConfig` yang muncul

---

## Langkah 4 — Isi file .env.local

```bash
# Copy file contoh
cp .env.local.example .env.local
```

Isi `.env.local` dengan nilai dari firebaseConfig:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gkpb-puji-dan-janji.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gkpb-puji-dan-janji
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gkpb-puji-dan-janji.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

NEXT_PUBLIC_ADMIN_EMAIL=admin@gkpb.or.id
```

---

## Langkah 5 — Terapkan Security Rules

### Firestore Rules
1. Firebase Console → **Firestore Database → Rules**
2. Hapus semua isi yang ada
3. Copy isi file `firestore.rules` dari project ini
4. Paste → klik **Publish**

### Storage Rules
1. Firebase Console → **Storage → Rules**
2. Hapus semua isi yang ada
3. Copy isi file `storage.rules` dari project ini
4. Paste → klik **Publish**

---

## Langkah 6 — Upload data awal (seed)

```bash
# Install tsx kalau belum ada
npm install -D tsx

# Jalankan seed
npx tsx scripts/seed.ts
```

Output yang benar:
```
🌱 Memulai seed data ke Firestore...

  ✓ devotional/current
  ✓ perikop/current
  ✓ verse_highlights/current
  ✓ special_verses/current
  ✓ prayer_topic/current
  ✓ announcement/current
  ✓ authors/current
  ✓ ayat_categories/current
  ✓ pustaka_books (12 dokumen)

✅ Seed selesai!
```

Cek di Firestore Console — semua collection harus sudah ada.

---

## Langkah 7 — Upload PDF ke Storage

### Cara 1 — Lewat Admin Panel (direkomendasikan)
1. Login di `/admin`
2. Menu **Pustaka Digital**
3. Klik **Edit** pada dokumen yang mau diisi PDF
4. Klik **Upload PDF** → pilih file
5. Tunggu upload selesai → **Simpan ke Firestore**

### Cara 2 — Langsung di Firebase Console
1. Firebase Console → **Storage → Files**
2. Klik tombol **Upload files**
3. Upload ke folder:
   - `pustaka/` → PDF dokumen gereja
   - `audio/` → Audio renungan (.mp3)
   - `images/` → Gambar/thumbnail

---

## Langkah 8 — Jalankan aplikasi

```bash
npm run dev
```

Akses:
- Aplikasi publik: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`
- Login dengan email & password yang dibuat di Firebase Auth

---

## Struktur Firestore

```
firestore/
├── devotional/
│   └── current          ← { title, authorCode, body, prayer }
├── perikop/
│   └── current          ← { items: [...] }
├── verse_highlights/
│   └── current          ← { items: [...] }
├── special_verses/
│   └── current          ← { items: [...] }
├── prayer_topic/
│   └── current          ← { title, text }
├── announcement/
│   └── current          ← { text, link }
├── authors/
│   └── current          ← { IWM: {...}, KDPA: {...}, ... }
├── ayat_categories/
│   └── current          ← { items: [...] }
└── pustaka_books/
    ├── 1                ← { title, category, year, pages, fileUrl, ... }
    ├── 2
    └── ...
```

## Struktur Firebase Storage

```
storage/
├── pustaka/             ← PDF dokumen (tata gereja, panduan, dll)
├── audio/               ← Audio renungan harian (.mp3)
└── images/              ← Gambar & thumbnail
```

---

## FAQ

**Q: Kenapa pakai Firebase Auth bukan password di env?**
A: Firebase Auth jauh lebih aman. Password bisa direset dari Console, session expired otomatis, dan tidak ada password yang hardcoded di kode.

**Q: Apakah data jemaat bisa melihat data admin?**
A: Tidak. Firestore rules memblokir semua write dari user yang tidak login. Jemaat hanya bisa baca.

**Q: Bagaimana kalau offline?**
A: App akan fallback ke data mockData (data default). Service worker juga cache halaman yang sudah pernah dibuka.

**Q: Biaya Firebase?**
A: Untuk skala gereja, Firebase Spark (gratis) sudah cukup:
- Firestore: 1 GB storage, 50K read/hari, 20K write/hari
- Storage: 5 GB storage, 1 GB download/hari
- Auth: unlimited users
