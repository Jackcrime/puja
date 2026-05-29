# Panduan Migrasi: Firebase + UploadThing → Supabase

## Overview perubahan

| Komponen | Sebelum | Sesudah |
|---|---|---|
| Database | Firestore (NoSQL, document) | Supabase PostgreSQL (relasional) |
| Auth | Firebase Authentication | Supabase Auth |
| File Storage | Firebase Storage + UploadThing | Supabase Storage |
| Realtime | Firestore `onSnapshot` | Supabase `postgres_changes` |
| API Routes | UploadThing route | Tidak perlu — upload dari client langsung |

---

## Langkah 1: Install / Uninstall dependencies

```bash
# Install Supabase
npm install @supabase/supabase-js @supabase/ssr

# Hapus yang tidak dipakai
npm uninstall firebase firebase-admin uploadthing @uploadthing/react @uploadthing/next
```

---

## Langkah 2: Jalankan SQL schema di Supabase

1. Buka Supabase Dashboard → **SQL Editor**
2. Copy-paste isi file `supabase/schema.sql`
3. Jalankan (**Run**)

> Schema ini membuat semua tabel, trigger `updated_at`, RLS policies,
> realtime subscriptions, dan fungsi RPC `increment_page_visit`.

---

## Langkah 3: Buat Storage Buckets

Di Supabase Dashboard → **Storage** → **New Bucket**, buat 3 bucket:

| Bucket | Public | Maks ukuran |
|---|---|---|
| `pustaka` | ✅ Ya | 50 MB |
| `audio` | ✅ Ya | 100 MB |
| `images` | ✅ Ya | 5 MB |

Untuk setiap bucket, tambahkan **Storage Policy**:
- **SELECT**: Allow for all (public read)
- **INSERT / UPDATE / DELETE**: Allow for `authenticated` role only

---

## Langkah 4: Buat admin user di Supabase Auth

1. Supabase Dashboard → **Authentication** → **Users** → **Add User**
2. Masukkan email dan password admin
3. Klik **Create User**

> Tidak perlu env `NEXT_PUBLIC_ADMIN_EMAIL` lagi — auth ditangani Supabase.

---

## Langkah 5: Update `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
BIBLE_API_KEY=your_key
```

Hapus semua env Firebase dan UploadThing.

---

## Langkah 6: Copy file-file baru ke proyek

Salin semua file dari folder `migration/` ini ke root proyek:

```
migration/
├── supabase/schema.sql               → supabase/schema.sql
├── lib/
│   ├── supabase.ts                   → lib/supabase.ts          (BARU)
│   ├── supabase-server.ts            → lib/supabase-server.ts   (BARU)
│   ├── supabase-db.ts                → lib/supabase-db.ts       (BARU)
│   ├── storage.ts                    → lib/storage.ts           (GANTI)
│   ├── file-utils.ts                 → lib/file-utils.ts        (GANTI)
│   ├── admin/auth.ts                 → lib/admin/auth.ts        (GANTI)
│   └── hooks/
│       ├── useSupabaseData.ts        → lib/hooks/useSupabaseData.ts  (BARU, ganti useFirestoreData.ts)
│       ├── usePatchNotes.ts          → lib/hooks/usePatchNotes.ts    (GANTI)
│       ├── useTentangInfo.ts         → lib/hooks/useTentangInfo.ts   (GANTI)
│       ├── useVisitStats.ts          → lib/hooks/useVisitStats.ts    (GANTI)
│       ├── useAdminDashboardStats.ts → lib/hooks/useAdminDashboardStats.ts (GANTI)
│       └── useRealtimeStats.ts       → lib/hooks/useRealtimeStats.ts (GANTI)
├── components/admin/
│   ├── FileUploader.tsx              → components/admin/FileUploader.tsx   (GANTI)
│   └── AdminGuard.tsx               → components/admin/AdminGuard.tsx      (GANTI)
└── app/
    └── admin-login-page.tsx          → app/admin/login/page.tsx  (GANTI isi filenya)
```

---

## Langkah 7: Update semua import

### Ganti import hooks

```ts
// SEBELUM
import { useDevotional, useAuthors, ... } from "@/lib/hooks/useFirestoreData";

// SESUDAH
import { useDevotional, useAuthors, ... } from "@/lib/hooks/useSupabaseData";
```

### Ganti import auth

```ts
// SEBELUM
import { signIn, signOut, onAuthChanged } from "@/lib/firebase";

// SESUDAH
import { login, logout, onAuthChange } from "@/lib/admin/auth";
```

### Ganti import storage

```ts
// SEBELUM
import { useUploadThing } from "@/lib/uploadthing-client";

// SESUDAH — tidak perlu import, pakai <FileUploader /> langsung
```

---

## Langkah 8: Hapus file yang sudah tidak dipakai

```bash
rm lib/firebase.ts
rm lib/firebase-admin.ts
rm lib/firestore.ts
rm lib/uploadthing.ts
rm lib/uploadthing-client.ts
rm app/api/uploadthing/route.ts
rm app/api/uploadthing/delete/route.ts
rm lib/hooks/useFirestoreData.ts
```

---

## Langkah 9: Update RenunganBacaanSection (audio upload)

File `components/admin/renungan/RenunganBacaanSection.tsx` menggunakan `useUploadThing`.
Ganti semua referensi tersebut dengan komponen `<FileUploader folder="audio" ... />`.

Contoh sebelum:
```tsx
const { startUpload } = useUploadThing("audioUploader");
```

Contoh sesudah:
```tsx
<FileUploader
  folder="audio"
  currentUrl={audioUrl}
  onUploadDone={(url, path) => handleAudioUploaded(url)}
/>
```

---

## Langkah 10: Cek `useBookmarks` dan `useHighlights`

Dua hook ini menggunakan `localStorage` (bukan Firestore), jadi **tidak perlu diubah**.

---

## Perbedaan penting: cara update data nested

### Mazmur Minggu

Sebelumnya satu dokumen Firestore. Sekarang dipecah ke 3 tabel:
- `mazmur_minggu` — header (reference, title, visible)
- `mazmur_minggu_verses` — ayat-ayat
- `mazmur_visible_days` — hari tampil

Hook `useMazmurMinggu` sudah menangani ini — API-nya tetap sama.

### Authors

Sebelumnya satu map Firestore. Sekarang 3 tabel:
- `authors` — data dasar
- `author_titles` — gelar
- `author_service_history` — riwayat pelayanan

Hook `useAuthors` mengembalikan `AuthorsMap` yang sama persis seperti sebelumnya.

---

## Perbedaan penting: upload file

### Sebelumnya (UploadThing)
```
Browser → UploadThing API → Callback → simpan URL ke Firestore
```

### Sekarang (Supabase Storage)
```
Browser → Supabase Storage (direct, pakai session token) → callback → simpan URL ke Supabase DB
```

Tidak ada API route perantara untuk upload. Cukup gunakan komponen `<FileUploader />`.

---

## Troubleshooting umum

**Error: "new row violates row-level security policy"**
→ Pastikan user sudah login (`supabase.auth.getSession()` mengembalikan session valid)

**Upload gagal dengan 403**
→ Cek storage bucket policy: pastikan `INSERT` untuk `authenticated` sudah dibuat

**Realtime tidak bekerja**
→ Pastikan tabel sudah ditambahkan ke `supabase_realtime` publication (sudah ada di schema.sql)
→ Di Supabase Dashboard → Database → Replication → pilih tabel-tabel yang dibutuhkan

**`increment_page_visit` RPC error**
→ Pastikan fungsi RPC sudah dibuat dari schema.sql dan policy `anon_insert_page_visits` aktif

---

## Checklist akhir

- [done] `npm install @supabase/supabase-js @supabase/ssr`
- [done] `npm uninstall firebase firebase-admin uploadthing @uploadthing/react @uploadthing/next`
- [done] Schema SQL dijalankan di Supabase
- [done] 3 storage bucket dibuat dengan policy yang benar
- [done] Admin user dibuat di Supabase Auth
- [done] `.env.local` diupdate
- [ ] Semua file migration dicopy ke proyek
- [ ] Semua import diupdate
- [ ] File lama dihapus
- [ ] `RenunganBacaanSection` diupdate ke `<FileUploader />`
- [ ] Build berhasil (`npm run build`)
- [ ] Login admin berfungsi
- [ ] Upload file berfungsi
- [ ] Realtime dashboard berfungsi
