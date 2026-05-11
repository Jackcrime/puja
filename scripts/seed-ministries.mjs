/**
 * seed-ministries.mjs
 * Override collection `ministries` di Firestore dengan data lengkap GKPB.
 *
 * Cara pakai:
 *   node scripts/seed-ministries.mjs
 *
 * Pastikan .env.local ada dan berisi FIREBASE_SERVICE_ACCOUNT_KEY.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local manual (tanpa dotenv dependency) ─────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, "../.env.local");

try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = val;
  }
  console.log("✓ .env.local loaded");
} catch {
  console.error("✗ .env.local tidak ditemukan di root project.");
  process.exit(1);
}

// ── Firebase Admin ────────────────────────────────────────────────────────────
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore }                  from "firebase-admin/firestore";

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!rawKey) {
  console.error("✗ FIREBASE_SERVICE_ACCOUNT_KEY tidak di-set di .env.local");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(rawKey);
  if (serviceAccount.private_key)
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
} catch {
  console.error("✗ FIREBASE_SERVICE_ACCOUNT_KEY bukan JSON valid.");
  process.exit(1);
}

const app = getApps().find(a => a.name === "seed") ??
            initializeApp({ credential: cert(serviceAccount) }, "seed");
const db  = getFirestore(app);

// ── Data lengkap GKPB ─────────────────────────────────────────────────────────
// Sumber: balichurchsynod.org (diakses Mei 2026)
// category = wilayah → dipakai sebagai group di multi-select penulis
const MINISTRIES = [

  // ── BADAN SINODE ──────────────────────────────────────────────────────────
  { id: "sinode-gkpb",             name: "Badan Sinode GKPB",                   category: "Badan Sinode"   },

  // ── KOTA DENPASAR & BADUNG SELATAN ────────────────────────────────────────
  { id: "jemaat-kristus-kasih",    name: "Jemaat Kristus Kasih – Denpasar",      category: "Kota Denpasar"  },
  { id: "jemaat-widhi-satya",      name: "Jemaat Widhi Satya – Sesetan",         category: "Kota Denpasar"  },
  { id: "jemaat-getsemani",        name: "Jemaat Getsemani – Denpasar",          category: "Kota Denpasar"  },
  { id: "jemaat-dhyana-pura",      name: "Jemaat Dhyana Pura – Seminyak",        category: "Kota Denpasar"  },
  { id: "jemaat-philadelphia",     name: "Jemaat Philadelphia – Legian",         category: "Kota Denpasar"  },
  { id: "jemaat-bukit-doa",        name: "Jemaat Bukit Doa – Nusa Dua",          category: "Kota Denpasar"  },
  { id: "bpi-surya-buana",         name: "BPI Surya Buana – Padang Sambian",     category: "Kota Denpasar"  },
  { id: "bpi-kepaon",              name: "BPI Kepaon – Pemogan",                 category: "Kota Denpasar"  },
  { id: "bpi-penatih",             name: "BPI Penatih – Kesiman",                category: "Kota Denpasar"  },

  // ── BADUNG UTARA (Mengwi & Kuta Utara) ───────────────────────────────────
  { id: "jemaat-abianbase",        name: "Jemaat Galang Ning Hyang – Abianbase", category: "Badung Utara"   },
  { id: "jemaat-ulun-uma",         name: "Jemaat Uwit Galang – Gulingan",        category: "Badung Utara"   },
  { id: "jemaat-carangsari",       name: "Jemaat Sinar Urip – Carangsari",       category: "Badung Utara"   },
  { id: "jemaat-gabriel-pegending",name: "Jemaat Gabriel – Pegending",           category: "Badung Utara"   },
  { id: "jemaat-galang-bhuana",    name: "Jemaat Galang Bhuana – Dalung",        category: "Badung Utara"   },
  { id: "jemaat-betlehem-untal",   name: "Jemaat Betlehem – Untal-Untal",        category: "Badung Utara"   },
  { id: "jemaat-sading",           name: "Jemaat Sading – Mengwi",               category: "Badung Utara"   },
  { id: "jemaat-lukluk",           name: "Jemaat Lukluk – Mengwi",               category: "Badung Utara"   },

  // ── BADUNG SELATAN (Kuta Utara bagian selatan & Tabanan perbatasan) ───────
  { id: "jemaat-efrata-buduk",     name: "Jemaat Efrata – Buduk",                category: "Badung Selatan" },
  { id: "jemaat-toya-urip",        name: "Jemaat Toya Urip – Kaba-Kaba",         category: "Badung Selatan" },
  { id: "jemaat-marga-pakerti",    name: "Jemaat Marga Pakerti – Padang Tawang", category: "Badung Selatan" },
  { id: "jemaat-canggu-permai",    name: "Jemaat Canggu Permai – Tibubeneng",    category: "Badung Selatan" },
  { id: "jemaat-tirta-amerta",     name: "Jemaat Tirta Amerta – Plambingan",     category: "Badung Selatan" },
  { id: "jemaat-tirta-empul",      name: "Jemaat Tirta Empul – Kerobokan",       category: "Badung Selatan" },
  { id: "jemaat-hosana-kwanji",    name: "Jemaat Hosana – Kwanji",               category: "Badung Selatan" },
  { id: "jemaat-yudea-padangluwih",name: "Jemaat Yudea – Padang Luwih",          category: "Badung Selatan" },

  // ── BALI TIMUR (Karangasem & Klungkung) ──────────────────────────────────
  { id: "jemaat-philia-amlapura",  name: "Jemaat Philia – Amlapura",             category: "Bali Timur"     },
  { id: "jemaat-sabda-urip-sega",  name: "Jemaat Sabda Urip – Sega",             category: "Bali Timur"     },
  { id: "jemaat-tresna-asih",      name: "Jemaat Tresna Asih – Klungkung",       category: "Bali Timur"     },
  { id: "bpi-batu-karang",         name: "BPI Batu Karang – Lembongan",           category: "Bali Timur"     },

  // ── BALI TIMUR LAUT (Bangli & Gianyar) ───────────────────────────────────
  { id: "jemaat-marga-rahayu",     name: "Jemaat Marga Rahayu – Bangli",         category: "Bali Timur Laut"},
  { id: "jemaat-giri-sweca",       name: "Jemaat Giri Sweca – Katung",           category: "Bali Timur Laut"},
  { id: "jemaat-mrikije-bukitsari",name: "Jemaat Mrikije – Bukitsari",           category: "Bali Timur Laut"},
  { id: "jemaat-margi-rahayu",     name: "Jemaat Margi Rahayu – Gianyar",        category: "Bali Timur Laut"},
  { id: "bpi-batu-bulan",          name: "BPI Batu Bulan – Sukawati",            category: "Bali Timur Laut"},
  { id: "bpi-payangan-ubud",       name: "BPI Payangan – Ubud",                  category: "Bali Timur Laut"},

  // ── BULELENG ─────────────────────────────────────────────────────────────
  { id: "jemaat-sabda-bayu",       name: "Jemaat Sabda Bayu – Singaraja",        category: "Buleleng"       },
  { id: "jemaat-gunung-muria",     name: "Jemaat Gunung Muria – Gitgit",         category: "Buleleng"       },
  { id: "jemaat-sambangan",        name: "Jemaat Sambangan – Sukasada",           category: "Buleleng"       },
  { id: "jemaat-pancasari",        name: "Jemaat Pancasari – Sukasada",           category: "Buleleng"       },
  { id: "jemaat-galanging-jagad",  name: "Jemaat Galanging Jagad – Galungan",    category: "Buleleng"       },
  { id: "jemaat-imanuel-sangsit",  name: "Jemaat Imanuel – Sangsit",             category: "Buleleng"       },
  { id: "jemaat-pancaran-kasih",   name: "Jemaat Pancaran Kasih – Bungkulan",    category: "Buleleng"       },
  { id: "jemaat-seririt",          name: "Jemaat Seririt – Tangguwisia",          category: "Buleleng"       },
  { id: "jemaat-tigawasa",         name: "Jemaat Tigawasa – Banjar",              category: "Buleleng"       },
  { id: "jemaat-air-hidup",        name: "Jemaat Air Hidup – Banyupoh",           category: "Buleleng"       },
  { id: "jemaat-patas",            name: "Jemaat Patas Tinga-Tinga – Gerokgak",  category: "Buleleng"       },
  { id: "jemaat-sumberkima",       name: "Jemaat Sumberkima – Gerokgak",          category: "Buleleng"       },
  { id: "bpi-bon-tiying",          name: "BPI Bon Tiying – Buleleng",             category: "Buleleng"       },
  { id: "bpi-bulian",              name: "BPI Bulian – Kubutambahan",             category: "Buleleng"       },
  { id: "bpi-kedis",               name: "BPI Kedis – Banjar",                    category: "Buleleng"       },

  // ── JEMBRANA ─────────────────────────────────────────────────────────────
  { id: "jemaat-gilimanuk",        name: "Jemaat Gilimanuk – Melaya",            category: "Jembrana"       },
  { id: "jemaat-sion-melaya",      name: "Jemaat Sion – Melaya",                 category: "Jembrana"       },
  { id: "jemaat-pangkung-tanah",   name: "Jemaat Pangkung Tanah – Melaya",       category: "Jembrana"       },
  { id: "jemaat-imanuel-ambiarsari",name:"Jemaat Imanuel – Ambiarsari",          category: "Jembrana"       },
  { id: "jemaat-pniel-blimbingsari",name:"Jemaat Pniel – Blimbingsari",          category: "Jembrana"       },
  { id: "jemaat-mandira-santi",    name: "Jemaat Mandira Santi – Negara",        category: "Jembrana"       },
  { id: "jemaat-mandira-asih",     name: "Jemaat Mandira Asih – Tegal Badeng",   category: "Jembrana"       },
  { id: "jemaat-pengambengan",     name: "Jemaat Pengambengan – Negara",         category: "Jembrana"       },
  { id: "bpi-candikusuma",         name: "BPI Candikusuma – Melaya",              category: "Jembrana"       },
  { id: "bpi-sarikuning",          name: "BPI Sarikuning – Negara",               category: "Jembrana"       },
  { id: "bpi-tegalcangkring",      name: "BPI Tegalcangkring – Negara",           category: "Jembrana"       },

  // ── TABANAN ───────────────────────────────────────────────────────────────
  { id: "jemaat-bait-laihai-roi",  name: "Jemaat Bait Laihai Roi – Penataran",   category: "Tabanan"        },
  { id: "jemaat-pajahan",          name: "Jemaat Pajahan – Pupuan",               category: "Tabanan"        },
  { id: "jemaat-sabda-jati",       name: "Jemaat Sabda Jati – Selabih",           category: "Tabanan"        },
  { id: "jemaat-belatungan",       name: "Jemaat Belatungan – Pupuan",            category: "Tabanan"        },
  { id: "jemaat-lalanglinggah",    name: "Jemaat Lalanglinggah – Selemadeg",      category: "Tabanan"        },
  { id: "jemaat-kediri-tabanan",   name: "Jemaat Kediri – Tabanan",               category: "Tabanan"        },
  { id: "jemaat-mangesta",         name: "Jemaat Mangesta – Penebel",             category: "Tabanan"        },
  { id: "jemaat-sanggulan",        name: "Jemaat Sanggulan – Tabanan",            category: "Tabanan"        },
  { id: "jemaat-bongan",           name: "Jemaat Bongan – Tabanan",               category: "Tabanan"        },
  { id: "jemaat-sudimara",         name: "Jemaat Sudimara – Tabanan",             category: "Tabanan"        },
  { id: "jemaat-tibubiu",          name: "Jemaat Tibubiu – Kerambitan",           category: "Tabanan"        },
  { id: "jemaat-antap",            name: "Jemaat Antap – Selemadeg",              category: "Tabanan"        },

  // ── KATEGORIAL ───────────────────────────────────────────────────────────
  { id: "kat-kristiyasa",          name: "PP Kristiyasa (Pemuda)",                category: "Kategorial"     },
  { id: "kat-dian-kristawati",     name: "PW Dian Kristawati (Ibu)",              category: "Kategorial"     },
  { id: "kat-kristya-winangun",    name: "PB Kristya Winangun (Bapak)",           category: "Kategorial"     },
  { id: "kat-kristya-jati",        name: "PKJ Kristya Jati (Lansia)",             category: "Kategorial"     },
  { id: "kat-duta-kristama",       name: "PGSMR Duta Kristama (Sekolah Minggu)",  category: "Kategorial"     },
];

// ── Seed ke Firestore ─────────────────────────────────────────────────────────
async function seed() {
  const col = db.collection("ministries");

  // 1. Hapus semua dokumen lama
  console.log("⏳ Menghapus data lama...");
  const existing = await col.get();
  const deleteBatch = db.batch();
  existing.docs.forEach((d) => deleteBatch.delete(d.ref));
  await deleteBatch.commit();
  console.log(`✓ ${existing.size} dokumen lama dihapus`);

  // 2. Tulis semua data baru (batched writes, maks 500/batch)
  console.log(`⏳ Menulis ${MINISTRIES.length} unit pelayanan...`);
  const CHUNK = 400;
  for (let i = 0; i < MINISTRIES.length; i += CHUNK) {
    const batch = db.batch();
    MINISTRIES.slice(i, i + CHUNK).forEach((m) => {
      const ref = col.doc(m.id);
      batch.set(ref, { name: m.name, category: m.category });
    });
    await batch.commit();
  }

  // 3. Ringkasan per kategori
  const summary = MINISTRIES.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] ?? 0) + 1;
    return acc;
  }, {});

  console.log("\n✅ Seed selesai!\n");
  console.log("Ringkasan:");
  Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => {
    console.log(`  ${n.toString().padStart(2)}  ${cat}`);
  });
  console.log(`  ──`);
  console.log(`  ${MINISTRIES.length}  Total`);
}

seed().catch((e) => { console.error("✗ Seed gagal:", e.message); process.exit(1); });