"use client";

// ─── Firestore Data Hooks ─────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { readDoc, readCollection, writeDoc, addItem, updateItem, deleteItem, clearDoc, subscribeDoc } from "@/lib/firestore";
import { toast } from "sonner";
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
    try {
      await writeDoc("devotional", "current", updated);
      setData(updated);
    } catch (e) {
      console.error("[useDevotional] update error:", e);
      toast.error("Gagal menyimpan renungan. Coba lagi.");
    }
  }, [data]);

  const clear = useCallback(async () => {
    const empty = { ...DEVOTIONAL, audioUrl: "" } as Devotional;
    try {
      await clearDoc("devotional", "current", empty);
      setData(empty);
    } catch (e) {
      console.error("[useDevotional] clear error:", e);
      toast.error("Gagal mereset renungan. Coba lagi.");
    }
  }, []);

  return { data, loading, update, clear };
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
    try {
      await writeDoc("perikop", "current", { items });
      setData(items);
    } catch (e) {
      console.error("[usePerikop] save error:", e);
      toast.error("Gagal menyimpan perikop. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ─── 3. Verse Highlights ──────────────────────────────────────────────────────
export interface VerseHighlightItem {
  reference: string;
  text:      string;
}

export function useVerseHighlights() {
  const [data, setData]       = useState(VERSE_HIGHLIGHTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: typeof VERSE_HIGHLIGHTS }>(
      "verse_highlights", "current", { items: VERSE_HIGHLIGHTS }
    ).then((d) => setData(d.items ?? VERSE_HIGHLIGHTS)).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (items: typeof VERSE_HIGHLIGHTS) => {
    try {
      await writeDoc("verse_highlights", "current", { items });
      setData(items);
    } catch (e) {
      console.error("[useVerseHighlights] save error:", e);
      toast.error("Gagal menyimpan highlight. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
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
    // Gunakan subscribeDoc agar realtime — perubahan dari admin langsung terlihat
    const unsub = subscribeDoc<Announcement>(
      "announcement", "current", ANNOUNCEMENT,
      (d) => { setData(d ?? ANNOUNCEMENT); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const update = useCallback(async (changes: Partial<Announcement>) => {
    // Gunakan setDoc dengan data baru saja (bukan merge dengan stale data)
    // Ini memastikan yang lama selalu terhapus dan digantikan yang baru
    const fresh: Announcement = {
      text: changes.text ?? "",
      link: changes.link ?? "",
    };
    try {
      await writeDoc("announcement", "current", fresh);
      setData(fresh);
    } catch (e) {
      console.error("[useAnnouncement] update error:", e);
      toast.error("Gagal menyimpan pengumuman. Coba lagi.");
    }
  }, []);

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
    try {
      await writeDoc("authors", "current", authors);
      setData(authors);
    } catch (e) {
      console.error("[useAuthors] save error:", e);
      toast.error("Gagal menyimpan data penulis. Coba lagi.");
    }
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
    try {
      await writeDoc("ayat_categories", "current", { items });
      setData(items);
    } catch (e) {
      console.error("[useAyatCategories] save error:", e);
      toast.error("Gagal menyimpan kategori ayat. Coba lagi.");
    }
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

  const add    = useCallback(async (book: Omit<PustakaBook, "id">) => {
    try { const id = await addItem("pustaka_books", book); await load(); return id; }
    catch (e) { console.error("[usePustakaBooks] add error:", e); toast.error("Gagal menambah buku. Coba lagi."); return ""; }
  }, [load]);
  const update = useCallback(async (id: string, changes: Partial<PustakaBook>) => {
    try { await updateItem("pustaka_books", id, changes); await load(); }
    catch (e) { console.error("[usePustakaBooks] update error:", e); toast.error("Gagal memperbarui buku. Coba lagi."); }
  }, [load]);
  const remove = useCallback(async (id: string) => {
    try { await deleteItem("pustaka_books", id); await load(); }
    catch (e) { console.error("[usePustakaBooks] remove error:", e); toast.error("Gagal menghapus buku. Coba lagi."); }
  }, [load]);

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

  const add    = useCallback(async (m: Omit<Ministry, "id">) => {
    try { await addItem("ministries", m); await load(); }
    catch (e) { console.error("[useMinistries] add error:", e); toast.error("Gagal menambah pelayanan. Coba lagi."); }
  }, [load]);
  const update = useCallback(async (id: string, changes: Partial<Ministry>) => {
    try { await updateItem("ministries", id, changes); await load(); }
    catch (e) { console.error("[useMinistries] update error:", e); toast.error("Gagal memperbarui pelayanan. Coba lagi."); }
  }, [load]);
  const remove = useCallback(async (id: string) => {
    try { await deleteItem("ministries", id); await load(); }
    catch (e) { console.error("[useMinistries] remove error:", e); toast.error("Gagal menghapus pelayanan. Coba lagi."); }
  }, [load]);

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
  reference:  string;
  title:      string;
  verses:     { number: string; text: string }[];
  crossRefs?: { reference: string; note?: string }[];
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
    try {
      await writeDoc("bible_readings", "current", { items });
      setData(items);
    } catch (e) {
      console.error("[useBibleReadings] save error:", e);
      toast.error("Gagal menyimpan bacaan Alkitab. Coba lagi.");
    }
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
    try {
      await writeDoc("ayat_khusus", "current", next);
      setData(next);
    } catch (e) {
      console.error("[useAyatKhusus] save error:", e);
      toast.error("Gagal menyimpan ayat khusus. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}
// ─── 14. Mazmur Minggu ────────────────────────────────────────────────────────
import { MAZMUR_MINGGU, BAHAN_KHOTBAH, POKOK_DOA_HARIAN, AYAT_NATS } from "@/lib/mockData";

export interface MazmurMinggu {
  reference: string;
  title:     string;
  verses:    { number: string; text: string }[];
  /** Jika false, section ini disembunyikan di halaman Puji & Janji. Default: true */
  visible?:  boolean;
}

// Dapatkan key Minggu dari tanggal (format: yyyy-MM-dd hari Minggu di minggu itu)
function getSundayKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Min
  d.setDate(d.getDate() - day); // mundur ke Minggu
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useMazmurMinggu(date?: Date) {
  const [data, setData]       = useState<MazmurMinggu>(MAZMUR_MINGGU);
  const [loading, setLoading] = useState(true);
  const dateKey = getSundayKey(date ?? new Date());

  useEffect(() => {
    setLoading(true);
    // useRef agar flag shared antar dua callback (tidak ada closure stale)
    const weekLoadedRef = { current: false };
    const unsubWeek = subscribeDoc<MazmurMinggu>(
      "mazmur_minggu", dateKey, null as any,
      (d) => {
        weekLoadedRef.current = true;
        if (d && d.reference) {
          setData(d);
        } else {
          setData({ reference: "", title: "", verses: [], visible: true });
        }
        setLoading(false);
      }
    );
    const unsubCurrent = subscribeDoc<MazmurMinggu>(
      "mazmur_minggu", "current", MAZMUR_MINGGU,
      (d) => {
        if (!weekLoadedRef.current) {
          setData(d ?? MAZMUR_MINGGU);
          setLoading(false);
        }
      }
    );
    return () => { unsubWeek(); unsubCurrent(); };
  }, [dateKey]);

  const save = useCallback(async (next: MazmurMinggu, targetDate?: Date) => {
    const key = getSundayKey(targetDate ?? date ?? new Date());
    try {
      await writeDoc("mazmur_minggu", key, next);
      await writeDoc("mazmur_minggu", "current", next);
      setData(next);
    } catch (e) {
      console.error("[useMazmurMinggu] save error:", e);
      toast.error("Gagal menyimpan Mazmur Minggu. Coba lagi.");
    }
  }, [date]);

  const clear = useCallback(async (targetDate?: Date) => {
    const key = getSundayKey(targetDate ?? date ?? new Date());
    const empty: MazmurMinggu = { reference: "", title: "", verses: [] };
    try {
      await clearDoc("mazmur_minggu", key, empty as any);
      await clearDoc("mazmur_minggu", "current", empty as any);
      setData(MAZMUR_MINGGU);
    } catch (e) {
      console.error("[useMazmurMinggu] clear error:", e);
      toast.error("Gagal mereset Mazmur Minggu. Coba lagi.");
    }
  }, [date]);

  return { data, loading, save, clear, dateKey };
}

// ─── 15. Bahan Khotbah ────────────────────────────────────────────────────────
export interface BahanKhotbah {
  bookSlug:  string;
  bookName:  string;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
  /** Human-readable reference label, e.g. "Lukas 24:36-49" */
  reference: string;
  /** Jika false, section ini disembunyikan di halaman Puji & Janji. Default: true */
  visible?:  boolean;
  /** Tanggal mulai tampil (yyyy-MM-dd), jika tidak diset = tampil selalu */
  visibleFrom?:  string;
  /** Tanggal akhir tampil (yyyy-MM-dd), jika tidak diset = tampil sampai kapanpun */
  visibleUntil?: string;
}

const EMPTY_BAHAN_KHOTBAH: BahanKhotbah = {
  bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1, reference: "",
};

export function useBahanKhotbah(date?: Date) {
  const [data, setData]       = useState<BahanKhotbah>(EMPTY_BAHAN_KHOTBAH);
  const [loading, setLoading] = useState(true);
  const dateKey = getSundayKey(date ?? new Date());

  useEffect(() => {
    setLoading(true);
    // useRef agar flag shared antar dua callback (tidak ada closure stale)
    const weekLoadedRef = { current: false };
    const unsubWeek = subscribeDoc<BahanKhotbah>(
      "bahan_khotbah", dateKey, null as any,
      (d) => {
        weekLoadedRef.current = true;
        if (d && d.bookSlug) {
          setData(d);
        } else {
          setData(EMPTY_BAHAN_KHOTBAH);
        }
        setLoading(false);
      }
    );
    const unsubCurrent = subscribeDoc<BahanKhotbah>(
      "bahan_khotbah", "current", EMPTY_BAHAN_KHOTBAH,
      (d) => {
        if (!weekLoadedRef.current) {
          setData(d ?? EMPTY_BAHAN_KHOTBAH);
          setLoading(false);
        }
      }
    );
    return () => { unsubWeek(); unsubCurrent(); };
  }, [dateKey]);

  const save = useCallback(async (next: BahanKhotbah, targetDate?: Date) => {
    const key = getSundayKey(targetDate ?? date ?? new Date());
    try {
      await writeDoc("bahan_khotbah", key, next);
      await writeDoc("bahan_khotbah", "current", next);
      setData(next);
    } catch (e) {
      console.error("[useBahanKhotbah] save error:", e);
      toast.error("Gagal menyimpan Bahan Khotbah. Coba lagi.");
    }
  }, [date]);

  const clear = useCallback(async (targetDate?: Date) => {
    const key = getSundayKey(targetDate ?? date ?? new Date());
    try {
      await clearDoc("bahan_khotbah", key, EMPTY_BAHAN_KHOTBAH);
      await clearDoc("bahan_khotbah", "current", EMPTY_BAHAN_KHOTBAH);
      setData(EMPTY_BAHAN_KHOTBAH);
    } catch (e) {
      console.error("[useBahanKhotbah] clear error:", e);
      toast.error("Gagal mereset Bahan Khotbah. Coba lagi.");
    }
  }, [date]);

  return { data, loading, save, clear, dateKey };
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
    try {
      await writeDoc("pokok_doa_harian", "current", { items });
      setData(items);
    } catch (e) {
      console.error("[usePokokDoaHarian] save error:", e);
      toast.error("Gagal menyimpan pokok doa. Coba lagi.");
    }
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
    try {
      await writeDoc("ayat_nats", "current", next);
      setData(next);
    } catch (e) {
      console.error("[useAyatNats] save error:", e);
      toast.error("Gagal menyimpan ayat nats. Coba lagi.");
    }
  }, []);
  return { data, loading, save };
}