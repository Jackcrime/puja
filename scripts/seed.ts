// ─── Firestore Seed Script (v2 — struktur baru) ───────────────────────────────
// Perubahan dari v1:
//  • Perikop sekarang disematkan di bible_readings sebagai perikopRefs
//  • Halaman admin sudah di-merge jadi satu (/admin/ayat dengan 3 tab)
//  • DWMY tetap di ayat_khusus, tapi sekarang dipilih via Bible API selector
//
// CARA PAKAI:
//   npx tsx scripts/seed.ts
//
// Aman dijalankan berulang — setDoc = overwrite.

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";
import {
  DEVOTIONAL, VERSE_HIGHLIGHTS, SPECIAL_VERSES,
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

const db  = getFirestore(app);
const log = (label: string) => console.log(`  ✓ ${label}`);

// ─── Bible Readings dengan perikopRefs ───────────────────────────────────────
const BIBLE_READINGS_WITH_PERIKOP = [
  {
    reference: "Yohanes 8:31–36",
    title:     "Kebenaran yang Memerdekakan",
    verses: [
      { number: "8:31", text: "Maka kata-Nya kepada orang-orang Yahudi yang percaya kepada-Nya: \"Jikalau kamu tetap dalam firman-Ku, kamu benar-benar adalah murid-Ku\"" },
      { number: "8:32", text: "dan kamu akan mengetahui kebenaran, dan kebenaran itu akan memerdekakan kamu." },
      { number: "8:36", text: "Jadi apabila Anak itu memerdekakan kamu, kamupun benar-benar merdeka." },
    ],
    perikopRefs: [
      { id: "pr-1", bookSlug: "galatia", bookName: "Galatia", chapter: 5, verseFrom: 1, verseTo: 1, heading: "Kemerdekaan dalam Kristus" },
      { id: "pr-2", bookSlug: "roma",    bookName: "Roma",    chapter: 6, verseFrom: 17, verseTo: 18, heading: "Bebas dari dosa, hamba kebenaran" },
    ],
  },
  {
    reference: "Mazmur 46:1–11",
    title:     "Allah Tempat Perlindungan Kita",
    verses: [
      { number: "46:1",  text: "Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti." },
      { number: "46:10", text: "Diamlah dan ketahuilah, bahwa Akulah Allah!" },
    ],
    perikopRefs: [
      { id: "pr-3", bookSlug: "mazmur", bookName: "Mazmur", chapter: 91, verseFrom: 1, verseTo: 2, heading: "Di bawah perlindungan Yang Mahatinggi" },
    ],
  },
];

// ─── Ayat Khusus (DWMY) ───────────────────────────────────────────────────────
const AYAT_KHUSUS = {
  tahun:  { year: 2026, reference: "Wahyu 21:5",       text: "Lihatlah, Aku menjadikan segala sesuatu baru!" },
  minggu: { reference: "2 Korintus 5:17",               text: "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru.", date: "" },
  harian: [
    { reference: "Filipi 4:13",   text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
    { reference: "Yohanes 3:16",  text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal." },
    { reference: "Mazmur 23:1",   text: "TUHAN adalah gembalaku, takkan kekurangan aku." },
    { reference: "Yeremia 29:11", text: "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera." },
    { reference: "Yosua 1:9",     text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau ke mana pun engkau pergi." },
  ],
  bulan: {
    "1":  { reference: "Ulangan 6:5",     text: "Kasihilah TUHAN, Allahmu, dengan segenap hatimu dan dengan segenap jiwamu dan dengan segenap kekuatanmu." },
    "2":  { reference: "Ulangan 26:11",   text: "Haruslah engkau bersukaria karena segala yang baik yang diberikan TUHAN, Allahmu, kepadamu dan kepada seisi rumahmu." },
    "3":  { reference: "Yohanes 11:35",   text: "Maka menangislah Yesus." },
    "4":  { reference: "Yohanes 20:29",   text: "Berbahagialah mereka yang tidak melihat, namun percaya." },
    "5":  { reference: "Ibrani 6:19",     text: "Pengharapan itu adalah sauh yang kuat dan aman bagi jiwa kita." },
    "6":  { reference: "Ibrani 13:3",     text: "Ingatlah akan orang-orang hukuman, karena kamu sendiri juga adalah orang-orang hukuman." },
    "7":  { reference: "Amos 5:24",       text: "Biarlah keadilan bergulung-gulung seperti air dan kebenaran seperti sungai yang selalu mengalir." },
    "8":  { reference: "Yohanes 10:10b",  text: "Aku datang, supaya mereka mempunyai hidup, dan mempunyainya dalam segala kelimpahan." },
    "9":  { reference: "Pengkhotbah 4:6", text: "Segenggam ketenangan lebih baik dari pada dua genggam jerih payah dan usaha menjaring angin." },
    "10": { reference: "Galatia 5:1",     text: "Kristus telah memerdekakan kita. Karena itu berdirilah teguh dan jangan mau lagi dikenakan kuk perhambaan." },
    "11": { reference: "Yesaya 2:4",      text: "Bangsa tidak akan lagi mengangkat pedang terhadap bangsa, dan mereka tidak akan lagi belajar perang." },
    "12": { reference: "Yesaya 11:7",     text: "Lembu dan beruang akan sama-sama makan rumput dan anaknya akan sama-sama berbaring, sedang singa akan makan jerami seperti lembu." },
  },
};

async function seed() {
  console.log("\n🌱 Memulai seed data ke Firestore (v2)...\n");

  await setDoc(doc(db, "devotional",        "current"), DEVOTIONAL);                                        log("devotional/current");
  await setDoc(doc(db, "ayat_khusus",       "current"), AYAT_KHUSUS);                                      log("ayat_khusus/current (DWMY)");
  await setDoc(doc(db, "ayat_categories",   "current"), { items: AYAT_CATEGORIES });                       log("ayat_categories/current");
  await setDoc(doc(db, "bible_readings",    "current"), { items: BIBLE_READINGS_WITH_PERIKOP });            log(`bible_readings/current (${BIBLE_READINGS_WITH_PERIKOP.length} bacaan + perikopRefs)`);
  await setDoc(doc(db, "verse_highlights",  "current"), { items: VERSE_HIGHLIGHTS });                      log("verse_highlights/current");
  await setDoc(doc(db, "special_verses",    "current"), { items: SPECIAL_VERSES });                        log("special_verses/current");
  await setDoc(doc(db, "prayer_topic",      "current"), PRAYER_TOPIC);                                     log("prayer_topic/current");
  await setDoc(doc(db, "announcement",      "current"), ANNOUNCEMENT);                                     log("announcement/current");
  await setDoc(doc(db, "authors",           "current"), AUTHORS);                                           log("authors/current");

  const batch = writeBatch(db);
  PUSTAKA_BOOKS.forEach((book) => {
    batch.set(doc(collection(db, "pustaka_books"), String(book.id)), {
      ...book, id: String(book.id), fileUrl: "", fileStoragePath: "", audioUrl: "",
    });
  });
  await batch.commit();
  log(`pustaka_books (${PUSTAKA_BOOKS.length} dokumen)`);

  console.log("\n✅ Seed v2 selesai!");
  console.log("\nStruktur baru:");
  console.log("  • /admin/ayat     → 3 tab: Ayat Kategori | DWMY | Bacaan & Perikop");
  console.log("  • perikopRefs kini inline per bacaan (bukan halaman terpisah)");
  console.log("  • DWMY dipilih via Bible API selector (bukan input manual)");
  console.log("  • Halaman lama /admin/ayat-khusus, /admin/perikop, /admin/bacaan = deleted\n");
  process.exit(0);
}

seed().catch((e) => { console.error("\n❌ Seed gagal:", e.message); process.exit(1); });