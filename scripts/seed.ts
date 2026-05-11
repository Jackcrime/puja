// ─── Firestore Seed Script ────────────────────────────────────────────────────
// Jalankan sekali untuk upload data awal dari mockData ke Firestore.
//
// CARA PAKAI:
//   1. Pastikan .env.local sudah diisi dengan Firebase config
//   2. npx tsx scripts/seed.ts
//
// Script ini aman dijalankan berulang — pakai setDoc (overwrite bukan duplicate).

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";
import {
  DEVOTIONAL, PERIKOP, VERSE_HIGHLIGHTS, SPECIAL_VERSES,
  PRAYER_TOPIC, ANNOUNCEMENT, AUTHORS, AYAT_CATEGORIES, PUSTAKA_BOOKS,
} from "../lib/mockData";

const app = initializeApp({
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);

// Helper — log progress
const log = (label: string) => console.log(`  ✓ ${label}`);

async function seed() {
  console.log("\n🌱 Memulai seed data ke Firestore...\n");

  // ─── 1. Devotional ────────────────────────────────────────────────────────
  await setDoc(doc(db, "devotional", "current"), DEVOTIONAL);
  log("devotional/current");

  // ─── 2. Perikop ───────────────────────────────────────────────────────────
  await setDoc(doc(db, "perikop", "current"), { items: PERIKOP });
  log("perikop/current");

  // ─── 3. Verse Highlights ──────────────────────────────────────────────────
  await setDoc(doc(db, "verse_highlights", "current"), { items: VERSE_HIGHLIGHTS });
  log("verse_highlights/current");

  // ─── 4. Special Verses ────────────────────────────────────────────────────
  await setDoc(doc(db, "special_verses", "current"), { items: SPECIAL_VERSES });
  log("special_verses/current");

  // ─── 5. Prayer Topic ──────────────────────────────────────────────────────
  await setDoc(doc(db, "prayer_topic", "current"), PRAYER_TOPIC);
  log("prayer_topic/current");

  // ─── 6. Announcement ─────────────────────────────────────────────────────
  await setDoc(doc(db, "announcement", "current"), ANNOUNCEMENT);
  log("announcement/current");

  // ─── 7. Authors ───────────────────────────────────────────────────────────
  await setDoc(doc(db, "authors", "current"), AUTHORS);
  log("authors/current");

  // ─── 8. Ayat Categories ───────────────────────────────────────────────────
  await setDoc(doc(db, "ayat_categories", "current"), { items: AYAT_CATEGORIES });
  log("ayat_categories/current");

  // ─── 9. Pustaka Books — pakai batch (collection, bukan single doc) ─────────
  const batch = writeBatch(db);
  PUSTAKA_BOOKS.forEach((book) => {
    const ref = doc(collection(db, "pustaka_books"), String(book.id));
    batch.set(ref, {
      ...book,
      id:               String(book.id),
      fileUrl:          "",
      fileStoragePath:  "",
      audioUrl:         "",
    });
  });
  await batch.commit();
  log(`pustaka_books (${PUSTAKA_BOOKS.length} dokumen)`);

  console.log("\n✅ Seed selesai! Semua data sudah masuk ke Firestore.\n");
  console.log("Langkah selanjutnya:");
  console.log("  1. Buka Firebase Console → Firestore → pastikan data ada");
  console.log("  2. Terapkan firestore.rules ke Firebase Console");
  console.log("  3. Terapkan storage.rules ke Firebase Console");
  console.log("  4. Upload PDF di admin panel atau langsung di Storage Console\n");
  process.exit(0);
}

seed().catch((e) => {
  console.error("\n❌ Seed gagal:", e.message);
  process.exit(1);
});
