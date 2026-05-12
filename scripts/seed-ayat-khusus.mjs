/**
 * seed-ayat-khusus.mjs
 * Seed ayat tahun, minggu, dan 12 ayat bulanan ke Firestore.
 * Jalankan: node scripts/seed-ayat-khusus.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, "../.env.local");

try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
  console.log("✓ .env.local loaded");
} catch { console.error("✗ .env.local tidak ditemukan"); process.exit(1); }

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!rawKey) { console.error("✗ FIREBASE_SERVICE_ACCOUNT_KEY belum di-set"); process.exit(1); }

let sa;
try {
  sa = JSON.parse(rawKey);
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
} catch { console.error("✗ JSON tidak valid"); process.exit(1); }

const app = getApps().find(a => a.name === "seed") ?? initializeApp({ credential: cert(sa) }, "seed");
const db  = getFirestore(app);

const data = {
  tahun: {
    year:      2026,
    reference: "Wahyu 21:5",
    text:      "Lihatlah, Aku menjadikan segala sesuatu baru!",
  },
  minggu: {
    reference: "2 Korintus 5:17",
    text:      "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang.",
    date:      "",  // ← isi tanggal minggu ini, contoh: "Minggu, 11 Mei 2026"
  },
  bulan: {
    "1":  { reference: "Ulangan 6:5",       text: "Kasihilah TUHAN, Allahmu, dengan segenap hatimu dan dengan segenap jiwamu dan dengan segenap kekuatanmu." },
    "2":  { reference: "Ulangan 26:11",     text: "Haruslah engkau bersukaria karena segala yang baik yang diberikan TUHAN, Allahmu, kepadamu dan kepada seisi rumahmu." },
    "3":  { reference: "Yohanes 11:35",     text: "Maka menangislah Yesus." },
    "4":  { reference: "Yohanes 20:29",     text: "Berbahagialah mereka yang tidak melihat, namun percaya." },
    "5":  { reference: "Ibrani 6:19",       text: "Pengharapan itu adalah sauh yang kuat dan aman bagi jiwa kita." },
    "6":  { reference: "Ibrani 13:3",       text: "Ingatlah akan orang-orang hukuman, karena kamu sendiri juga adalah orang-orang hukuman." },
    "7":  { reference: "Amos 5:24",         text: "Biarlah keadilan bergulung-gulung seperti air dan kebenaran seperti sungai yang selalu mengalir." },
    "8":  { reference: "Yohanes 10:10b",    text: "Aku datang, supaya mereka mempunyai hidup, dan mempunyainya dalam segala kelimpahan." },
    "9":  { reference: "Pengkhotbah 4:6",   text: "Segenggam ketenangan lebih baik dari pada dua genggam jerih payah dan usaha menjaring angin." },
    "10": { reference: "Galatia 5:1",       text: "Kristus telah memerdekakan kita. Karena itu berdirilah teguh dan jangan mau lagi dikenakan kuk perhambaan." },
    "11": { reference: "Yesaya 2:4",        text: "Bangsa tidak akan lagi mengangkat pedang terhadap bangsa, dan mereka tidak akan lagi belajar perang." },
    "12": { reference: "Yesaya 11:7",       text: "Lembu dan beruang akan sama-sama makan rumput dan anaknya akan sama-sama berbaring, sedang singa akan makan jerami seperti lembu." },
  },
};

async function seed() {
  await db.collection("ayat_khusus").doc("current").set(data);
  console.log("✅ ayat_khusus/current berhasil di-seed!");
  console.log("   Ayat Tahun :", data.tahun.reference);
  console.log("   Ayat Minggu:", data.minggu.reference);
  console.log("   12 bulan   : Januari – Desember ✓");
  console.log("\n💡 Edit field `date` di minggu: untuk isi tanggal minggu ini.");
  process.exit(0);
}

seed().catch(e => { console.error("✗ Gagal:", e.message); process.exit(1); });
