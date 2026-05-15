"use client";

// ─── Firestore Data Hooks ─────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { readDoc, readCollection, writeDoc, addItem, updateItem, deleteItem } from "@/lib/firestore";
import {
  DEVOTIONAL, PERIKOP, VERSE_HIGHLIGHTS, SPECIAL_VERSES,
  PRAYER_TOPIC, ANNOUNCEMENT, AYAT_CATEGORIES,
  PUSTAKA_BOOKS, BIBLE_READINGS, getDailyVerse,
} from "@/lib/mockData";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Devotional   = typeof DEVOTIONAL & { audioUrl?: string };
export type PrayerTopic  = typeof PRAYER_TOPIC;
export type Announcement = typeof ANNOUNCEMENT;

export interface Ministry {
  id:       string;
  name:     string;
  category: string;
}

export interface ServiceEntry {
  ministryId: string;
  from:       string;
  until:      string;
}

export interface Author {
  code:           string;
  name:           string;
  titles:         string[];   // bisa multiple: ["Pendeta", "Pdt. Em."]
  photoUrl:       string;
  serviceHistory: ServiceEntry[];
  // legacy compat
  title?:         string;
  ministries?:    string[];
  ministry?:      string;
  servedFrom?:    string;
  servedUntil?:   string;
}

// ─── 1. Devotional ────────────────────────────────────────────────────────────
export function useDevotional() {
  const [data, setData]       = useState<Devotional>(DEVOTIONAL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<Devotional>("devotional", "current", DEVOTIONAL)
      .then(setData).finally(() => setLoading(false));
  }, []);

  const update = useCallback(async (changes: Partial<Devotional>) => {
    const updated = { ...data, ...changes };
    await writeDoc("devotional", "current", updated);
    setData(updated);
  }, [data]);

  return { data, loading, update };
}

// ─── 2. Perikop ───────────────────────────────────────────────────────────────
export function usePerikop() {
  const [data, setData]       = useState(PERIKOP);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: typeof PERIKOP }>("perikop", "current", { items: PERIKOP })
      .then((d) => setData(d.items ?? PERIKOP)).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (items: typeof PERIKOP) => {
    await writeDoc("perikop", "current", { items });
    setData(items);
  }, []);

  return { data, loading, save };
}

// ─── 3. Verse Highlights ──────────────────────────────────────────────────────
export function useVerseHighlights() {
  const [data, setData]       = useState(VERSE_HIGHLIGHTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: typeof VERSE_HIGHLIGHTS }>(
      "verse_highlights", "current", { items: VERSE_HIGHLIGHTS }
    ).then((d) => setData(d.items ?? VERSE_HIGHLIGHTS)).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ─── 4. Special Verses ────────────────────────────────────────────────────────
export function useSpecialVerses() {
  const [data, setData]       = useState(SPECIAL_VERSES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: typeof SPECIAL_VERSES }>(
      "special_verses", "current", { items: SPECIAL_VERSES }
    ).then((d) => setData(d.items ?? SPECIAL_VERSES)).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ─── 5. Prayer Topic ──────────────────────────────────────────────────────────
export function usePrayerTopic() {
  const [data, setData]       = useState<PrayerTopic>(PRAYER_TOPIC);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<PrayerTopic>("prayer_topic", "current", PRAYER_TOPIC)
      .then(setData).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ─── 6. Announcement ─────────────────────────────────────────────────────────
export function useAnnouncement() {
  const [data, setData]       = useState<Announcement>(ANNOUNCEMENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<Announcement>("announcement", "current", ANNOUNCEMENT)
      .then(setData).finally(() => setLoading(false));
  }, []);

  const update = useCallback(async (changes: Partial<Announcement>) => {
    const updated = { ...data, ...changes };
    await writeDoc("announcement", "current", updated);
    setData(updated);
  }, [data]);

  return { data, loading, update };
}

// ─── 7. Authors ───────────────────────────────────────────────────────────────
export type AuthorsMap = Record<string, {
  name:           string;
  titles:         string[];
  photoUrl?:      string;
  serviceHistory: ServiceEntry[];
  // legacy compat
  title?:         string;
  ministry?:      string;
  ministries?:    string[];
  servedFrom?:    string;
  servedUntil?:   string;
}>;

const EMPTY_AUTHORS: AuthorsMap = {};

export function useAuthors() {
  const [data, setData]       = useState<AuthorsMap>(EMPTY_AUTHORS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<AuthorsMap>("authors", "current", EMPTY_AUTHORS)
      .then(setData).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (authors: AuthorsMap) => {
    await writeDoc("authors", "current", authors);
    setData(authors);
  }, []);

  return { data, loading, save };
}

// ─── 8. Ayat Categories ───────────────────────────────────────────────────────
export function useAyatCategories() {
  const [data, setData]       = useState(AYAT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: typeof AYAT_CATEGORIES }>(
      "ayat_categories", "current", { items: AYAT_CATEGORIES }
    ).then((d) => setData(d.items ?? AYAT_CATEGORIES)).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (items: typeof AYAT_CATEGORIES) => {
    await writeDoc("ayat_categories", "current", { items });
    setData(items);
  }, []);

  return { data, loading, save };
}

// ─── 9. Pustaka Books ─────────────────────────────────────────────────────────
export interface PustakaBook {
  id: string; title: string; year: number; category: string;
  description: string; pages: number; previewText: string;
  fileUrl?: string; fileStoragePath?: string; audioUrl?: string;
}

export function usePustakaBooks() {
  const [data, setData]       = useState<PustakaBook[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const books = await readCollection<PustakaBook>(
      "pustaka_books",
      PUSTAKA_BOOKS.map((b) => ({ ...b, id: String(b.id), fileUrl: "", fileStoragePath: "", audioUrl: "" }))
    );
    setData(books);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add    = useCallback(async (book: Omit<PustakaBook, "id">) => { const id = await addItem("pustaka_books", book); await load(); return id; }, [load]);
  const update = useCallback(async (id: string, changes: Partial<PustakaBook>) => { await updateItem("pustaka_books", id, changes); await load(); }, [load]);
  const remove = useCallback(async (id: string) => { await deleteItem("pustaka_books", id); await load(); }, [load]);

  return { data, loading, add, update, remove, reload: load };
}

// ─── 10. Ministries ───────────────────────────────────────────────────────────
// Fallback minimal — seed lengkap via: node scripts/seed-ministries.mjs
const DEFAULT_MINISTRIES: Ministry[] = [
  { id: "sinode-gkpb",          name: "Badan Sinode GKPB",               category: "Badan Sinode"  },
  { id: "jemaat-kristus-kasih", name: "Jemaat Kristus Kasih – Denpasar", category: "Kota Denpasar" },
  { id: "jemaat-sabda-bayu",    name: "Jemaat Sabda Bayu – Singaraja",   category: "Buleleng"      },
  { id: "jemaat-mandira-santi", name: "Jemaat Mandira Santi – Negara",   category: "Jembrana"      },
  { id: "jemaat-tresna-asih",   name: "Jemaat Tresna Asih – Klungkung",  category: "Bali Timur"    },
];

export function useMinistries() {
  const [data, setData]       = useState<Ministry[]>(DEFAULT_MINISTRIES);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const items = await readCollection<Ministry>("ministries", DEFAULT_MINISTRIES);
    setData(items);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add    = useCallback(async (m: Omit<Ministry, "id">) => { await addItem("ministries", m); await load(); }, [load]);
  const update = useCallback(async (id: string, changes: Partial<Ministry>) => { await updateItem("ministries", id, changes); await load(); }, [load]);
  const remove = useCallback(async (id: string) => { await deleteItem("ministries", id); await load(); }, [load]);

  return { data, loading, add, update, remove, reload: load };
}

// ─── 11. Daily verse (dari Firestore ayat_khusus.harian date-linked, fallback getDailyVerse) ─
export function useDailyVerse(dateKey?: string) {
  const [data, setData] = useState(() => getDailyVerse());

  useEffect(() => {
    readDoc<AyatKhusus>("ayat_khusus", "current", DEFAULT_AYAT_KHUSUS).then((ak) => {
      const harian = ak.harian;
      if (!harian) return;
      // Pakai tanggal yang diberikan, atau hari ini
      const today = dateKey ?? new Date().toISOString().split("T")[0];
      const verse = harian[today];
      if (verse) setData(verse);
    });
  }, [dateKey]);

  return { data };
}

// ─── 12. Bible Readings ───────────────────────────────────────────────────────
export interface BibleReading {
  reference: string;
  title:     string;
  verses:    { number: string; text: string }[];
}

export function useBibleReadings() {
  const [data, setData]       = useState<BibleReading[]>(BIBLE_READINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: BibleReading[] }>(
      "bible_readings", "current", { items: BIBLE_READINGS }
    ).then((d) => setData(d.items ?? BIBLE_READINGS))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (items: BibleReading[]) => {
    await writeDoc("bible_readings", "current", { items });
    setData(items);
  }, []);

  return { data, loading, save };
}

// ─── 13. Ayat Khusus (Tahun + 12 Bulan + Minggu) ─────────────────────────────
export interface AyatKhususBulan { reference: string; text: string; }
export interface AyatKhususHarian { reference: string; text: string; }
export interface AyatKhusus {
  tahun?:     { year: number; reference: string; text: string };
  minggu?:    { reference: string; text: string; date?: string }; // single (legacy)
  mingguan?:  Record<string, { reference: string; text: string }>; // key: "YYYY-MM-DD" (Minggu)
  bulan?:     Record<string, AyatKhususBulan>;       // key: "1"–"12"
  harian?:    Record<string, AyatKhususHarian>;       // key: "YYYY-MM-DD" — date-linked
}

const DEFAULT_AYAT_KHUSUS: AyatKhusus = {
  tahun:  { year: 2026, reference: "Wahyu 21:5", text: "Lihatlah, Aku menjadikan segala sesuatu baru!" },
  minggu: { reference: "2 Korintus 5:17", text: "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang.", date: "" },
  harian: {
    "2026-05-12": { reference: "Filipi 4:13",   text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
    "2026-05-13": { reference: "Yohanes 3:16",  text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal." },
    "2026-05-14": { reference: "Mazmur 23:1",   text: "TUHAN adalah gembalaku, takkan kekurangan aku." },
    "2026-05-15": { reference: "Yeremia 29:11", text: "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera." },
    "2026-05-16": { reference: "Yosua 1:9",     text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau ke mana pun engkau pergi." },
  },
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

export function useAyatKhusus() {
  const [data, setData]       = useState<AyatKhusus>(DEFAULT_AYAT_KHUSUS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<AyatKhusus>("ayat_khusus", "current", DEFAULT_AYAT_KHUSUS)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: AyatKhusus) => {
    await writeDoc("ayat_khusus", "current", next);
    setData(next);
  }, []);

  return { data, loading, save };
}
// ─── 14. Mazmur Minggu ────────────────────────────────────────────────────────
import { MAZMUR_MINGGU, BAHAN_KHOTBAH, POKOK_DOA_HARIAN, AYAT_NATS } from "@/lib/mockData";

export interface MazmurMinggu {
  reference: string;
  title:     string;
  verses:    { number: string; text: string }[];
}

export function useMazmurMinggu() {
  const [data, setData]       = useState<MazmurMinggu>(MAZMUR_MINGGU);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    readDoc<MazmurMinggu>("mazmur_minggu", "current", MAZMUR_MINGGU)
      .then(setData).finally(() => setLoading(false));
  }, []);
  const save = useCallback(async (next: MazmurMinggu) => {
    await writeDoc("mazmur_minggu", "current", next);
    setData(next);
  }, []);
  return { data, loading, save };
}

// ─── 15. Bahan Khotbah ────────────────────────────────────────────────────────
export interface BahanKhotbah {
  reference:    string;
  title:        string;
  thema:        string;
  pendahuluan:  string;
  poinUtama:    { judul: string; isi: string }[];
  penutup:      string;
}

export function useBahanKhotbah() {
  const [data, setData]       = useState<BahanKhotbah>(BAHAN_KHOTBAH);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    readDoc<BahanKhotbah>("bahan_khotbah", "current", BAHAN_KHOTBAH)
      .then(setData).finally(() => setLoading(false));
  }, []);
  const save = useCallback(async (next: BahanKhotbah) => {
    await writeDoc("bahan_khotbah", "current", next);
    setData(next);
  }, []);
  return { data, loading, save };
}

// ─── 16. Pokok Doa Harian ─────────────────────────────────────────────────────
export interface PokokDoa {
  hari:   string;
  topik:  string;
  detail: string;
}

export function usePokokDoaHarian() {
  const [data, setData]       = useState<PokokDoa[]>(POKOK_DOA_HARIAN);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    readDoc<{ items: PokokDoa[] }>("pokok_doa_harian", "current", { items: POKOK_DOA_HARIAN })
      .then((d) => setData(d.items ?? POKOK_DOA_HARIAN))
      .finally(() => setLoading(false));
  }, []);
  const save = useCallback(async (items: PokokDoa[]) => {
    await writeDoc("pokok_doa_harian", "current", { items });
    setData(items);
  }, []);
  return { data, loading, save };
}

// ─── 17. Ayat Nats ────────────────────────────────────────────────────────────
export interface AyatNatsItem {
  id:        string;
  reference: string;
  text:      string;
}
export interface AyatNats { items: AyatNatsItem[]; }

const DEFAULT_AYAT_NATS: AyatNats = {
  items: Array.isArray((AYAT_NATS as any).items)
    ? (AYAT_NATS as any).items
    : [{ id: "1", reference: (AYAT_NATS as any).reference ?? "", text: (AYAT_NATS as any).text ?? "" }],
};

export function useAyatNats() {
  const [data, setData]       = useState<AyatNats>(DEFAULT_AYAT_NATS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    readDoc<AyatNats>("ayat_nats", "current", DEFAULT_AYAT_NATS)
      .then((d) => {
        // Backward-compat: old shape was { reference, text }
        if (!d.items) {
          const old = d as any;
          setData({ items: [{ id: "1", reference: old.reference ?? "", text: old.text ?? "" }] });
        } else {
          setData(d);
        }
      })
      .finally(() => setLoading(false));
  }, []);
  const save = useCallback(async (next: AyatNats) => {
    await writeDoc("ayat_nats", "current", next);
    setData(next);
  }, []);
  return { data, loading, save };
}