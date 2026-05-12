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
export type Devotional   = typeof DEVOTIONAL;
export type PrayerTopic  = typeof PRAYER_TOPIC;
export type Announcement = typeof ANNOUNCEMENT;

export interface Ministry {
  id:       string;
  name:     string;
  category: string;
}

export interface Author {
  code:        string;
  name:        string;
  title:       string;
  ministries:  string[];
  servedFrom:  string;
  servedUntil: string;
  photoUrl:    string;
  ministry?:   string; // legacy field
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
  name:         string;
  title:        string;
  ministry:     string;
  ministries?:  string[];
  servedFrom?:  string;
  servedUntil?: string;
  photoUrl?:    string;
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

// ─── 11. Daily verse ──────────────────────────────────────────────────────────
export function useDailyVerse() {
  const [data] = useState(() => getDailyVerse());
  return { data };
}

// ─── 12. Bible Readings ───────────────────────────────────────────────────────
export function useBibleReadings() {
  return { data: BIBLE_READINGS, loading: false };
}

// ─── 13. Ayat Khusus (Tahun + 12 Bulan + Minggu) ─────────────────────────────
export interface AyatKhususBulan { reference: string; text: string; }
export interface AyatKhusus {
  tahun?:  { year: number; reference: string; text: string };
  minggu?: { reference: string; text: string; date?: string };
  bulan?:  Record<string, AyatKhususBulan>; // key: "1"–"12"
}

const DEFAULT_AYAT_KHUSUS: AyatKhusus = {
  tahun:  { year: 2026, reference: "Wahyu 21:5", text: "Lihatlah, Aku menjadikan segala sesuatu baru!" },
  minggu: { reference: "2 Korintus 5:17", text: "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang.", date: "" },
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