"use client";

// ─── Firestore Data Hooks ─────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { readDoc, readCollection, writeDoc, addItem, updateItem, deleteItem, clearDoc, subscribeDoc } from "@/lib/firestore";
import { toast } from "sonner";
// ─── Types ────────────────────────────────────────────────────────────────────
export type Devotional   = { title: string; authorCode: string; audioUrl?: string; body: string; prayer: string; };
export type PrayerTopic  = { title: string; text: string; };
export type Announcement = { text: string; link: string; };

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

// ─── Helper: format date key ──────────────────────────────────────────────────
export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ─── 1. Devotional ────────────────────────────────────────────────────────────
export const EMPTY_DEVOTIONAL: Devotional = {
  title:      "",
  authorCode: "",
  audioUrl:   "",
  body:       "",
  prayer:     "",
};

export function useDevotional(date?: Date) {
  const [data, setData]       = useState<Devotional>(EMPTY_DEVOTIONAL);
  const [loading, setLoading] = useState(true);
  const dateKey = date ? formatDateKey(date) : null;

  useEffect(() => {
    setLoading(true);
    setData(EMPTY_DEVOTIONAL);
    let cancelled = false;

    (async () => {
      try {
        if (dateKey) {
          // Coba ambil konten spesifik tanggal dulu
          const byDate = await readDoc<Devotional>("devotional", dateKey, EMPTY_DEVOTIONAL);
          if (cancelled) return;
          if (byDate.title || byDate.body) {
            setData(byDate);
          } else {
            // Fallback ke "current" jika tidak ada konten khusus tanggal ini
            const current = await readDoc<Devotional>("devotional", "current", EMPTY_DEVOTIONAL);
            if (!cancelled) setData(current ?? EMPTY_DEVOTIONAL);
          }
        } else {
          const current = await readDoc<Devotional>("devotional", "current", EMPTY_DEVOTIONAL);
          if (!cancelled) setData(current ?? EMPTY_DEVOTIONAL);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Cleanup: batalkan state update jika komponen unmount sebelum fetch selesai
    return () => { cancelled = true; };
  }, [dateKey]);

  const update = useCallback(async (changes: Partial<Devotional>) => {
    const updated = { ...data, ...changes };
    try {
      if (dateKey) {
        await writeDoc("devotional", dateKey, updated);
        await writeDoc("devotional", "current", updated);
      } else {
        await writeDoc("devotional", "current", updated);
      }
      setData(updated);
    } catch (e) {
      console.error("[useDevotional] update error:", e);
      toast.error("Gagal menyimpan renungan. Coba lagi.");
    }
  }, [data, dateKey]);

  const clear = useCallback(async () => {
    try {
      if (dateKey) await clearDoc("devotional", dateKey, EMPTY_DEVOTIONAL);
      await clearDoc("devotional", "current", EMPTY_DEVOTIONAL);
      setData(EMPTY_DEVOTIONAL);
    } catch (e) {
      console.error("[useDevotional] clear error:", e);
      toast.error("Gagal mereset renungan. Coba lagi.");
    }
  }, [dateKey]);

  return { data, loading, update, clear };
}

// ─── 2. Perikop ───────────────────────────────────────────────────────────────
export interface PerikopItem { book: string; chapter: number; verses: string; heading: string; }
export interface SpecialVerse { label: string; reference: string; text: string; date?: string; }
export interface AyatCategoryVerse { label: string; reference: string; text: string; }
export interface AyatCategory { category: string; verses: AyatCategoryVerse[]; }

export function usePerikop() {
  const [data, setData]       = useState<PerikopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: PerikopItem[] }>("perikop", "current", { items: [] })
      .then((d) => setData(d.items ?? [])).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (items: PerikopItem[]) => {
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
  const [data, setData]       = useState<VerseHighlightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: VerseHighlightItem[] }>(
      "verse_highlights", "current", { items: [] }
    ).then((d) => setData(d.items ?? [])).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (items: VerseHighlightItem[]) => {
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
  const [data, setData]       = useState<SpecialVerse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: SpecialVerse[] }>(
      "special_verses", "current", { items: [] }
    ).then((d) => setData(d.items ?? [])).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ─── 5. Prayer Topic ──────────────────────────────────────────────────────────
const EMPTY_PRAYER_TOPIC: PrayerTopic = { title: "", text: "" };

export function usePrayerTopic() {
  const [data, setData]       = useState<PrayerTopic>(EMPTY_PRAYER_TOPIC);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<PrayerTopic>("prayer_topic", "current", EMPTY_PRAYER_TOPIC)
      .then((d) => setData(d ?? EMPTY_PRAYER_TOPIC)).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

// ─── 6. Announcement ─────────────────────────────────────────────────────────
const EMPTY_ANNOUNCEMENT: Announcement = { text: "", link: "" };

export function useAnnouncement() {
  const [data, setData]       = useState<Announcement>(EMPTY_ANNOUNCEMENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeDoc<Announcement>(
      "announcement", "current", EMPTY_ANNOUNCEMENT,
      (d) => { setData(d ?? EMPTY_ANNOUNCEMENT); setLoading(false); }
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
  const [data, setData]       = useState<AyatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<{ items: AyatCategory[] }>(
      "ayat_categories", "current", { items: [] }
    ).then((d) => setData(d.items ?? [])).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (items: AyatCategory[]) => {
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
    const books = await readCollection<PustakaBook>("pustaka_books", []);
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

// ─── 11. Daily verse ──────────────────────────────────────────────────────────
export function useDailyVerse(dateKey?: string) {
  const [data, setData] = useState<{ reference: string; text: string }>({ reference: "", text: "" });

  useEffect(() => {
    let cancelled = false;
    readDoc<AyatKhusus>("ayat_khusus", "current", DEFAULT_AYAT_KHUSUS)
      .then((ak) => {
        if (cancelled) return;
        const harian = ak?.harian;
        if (!harian) return;
        const today = dateKey ?? new Date().toISOString().split("T")[0];
        const verse = harian[today];
        if (verse) setData(verse);
      });
    return () => { cancelled = true; };
  }, [dateKey]);

  return { data };
}

// ─── 12. Bible Readings ───────────────────────────────────────────────────────
export interface BibleReading {
  reference:  string;
  title:      string;
  verses?:    { number: string; text: string }[];
  crossRefs?: { reference: string; note?: string }[];
}

export function useBibleReadings(date?: Date) {
  const [data, setData]       = useState<BibleReading[]>([]);
  const [loading, setLoading] = useState(true);
  const dateKey = date ? formatDateKey(date) : null;

  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        if (dateKey) {
          const byDate = await readDoc<{ items: BibleReading[] }>("bible_readings", dateKey, { items: [] });
          if (cancelled) return;
          if (byDate.items && byDate.items.length > 0) {
            setData(byDate.items);
          } else {
            const current = await readDoc<{ items: BibleReading[] }>("bible_readings", "current", { items: [] });
            if (!cancelled) setData(current.items ?? []);
          }
        } else {
          const current = await readDoc<{ items: BibleReading[] }>("bible_readings", "current", { items: [] });
          if (!cancelled) setData(current.items ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [dateKey]);

  const save = useCallback(async (items: BibleReading[]) => {
    try {
      if (dateKey) {
        await writeDoc("bible_readings", dateKey, { items });
        await writeDoc("bible_readings", "current", { items });
      } else {
        await writeDoc("bible_readings", "current", { items });
      }
      setData(items);
    } catch (e) {
      console.error("[useBibleReadings] save error:", e);
      toast.error("Gagal menyimpan bacaan Alkitab. Coba lagi.");
    }
  }, [dateKey]);

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

const DEFAULT_AYAT_KHUSUS: AyatKhusus = {};

export function useAyatKhusus() {
  const [data, setData]       = useState<AyatKhusus>(DEFAULT_AYAT_KHUSUS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    readDoc<AyatKhusus>("ayat_khusus", "current", DEFAULT_AYAT_KHUSUS)
      .then((d) => { if (!cancelled) setData(d ?? DEFAULT_AYAT_KHUSUS); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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

export interface MazmurMinggu {
  reference:    string;
  title:        string;
  verses:       { number: string; text: string }[];
  /** Jika false, section ini disembunyikan di halaman Puji & Janji. Default: true */
  visible?:     boolean;
  /** Hari-hari dalam seminggu konten ini tampil (0=Min,1=Sen,...,6=Sab). Default: [0]=Minggu */
  visibleDays?: number[];
}

// Dapatkan key Minggu dari tanggal (format: yyyy-MM-dd hari Minggu di minggu itu)
function getSundayKey(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Min
  d.setDate(d.getDate() - day); // mundur ke Minggu
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY_MAZMUR: MazmurMinggu = { reference: "", title: "", verses: [], visible: true };

export function useMazmurMinggu(date?: Date) {
  const [data, setData]       = useState<MazmurMinggu>(EMPTY_MAZMUR);
  const [loading, setLoading] = useState(true);
  const dateKey = getSundayKey(date ?? new Date());

  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const byWeek = await readDoc<MazmurMinggu>("mazmur_minggu", dateKey, EMPTY_MAZMUR);
        if (cancelled) return;
        if (byWeek.reference) {
          setData(byWeek);
        } else {
          const current = await readDoc<MazmurMinggu>("mazmur_minggu", "current", EMPTY_MAZMUR);
          if (!cancelled) setData(current ?? EMPTY_MAZMUR);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
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
    try {
      await clearDoc("mazmur_minggu", key, EMPTY_MAZMUR as any);
      await clearDoc("mazmur_minggu", "current", EMPTY_MAZMUR as any);
      setData(EMPTY_MAZMUR);
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
  /** Hari-hari dalam seminggu konten ini tampil (0=Min,1=Sen,...,6=Sab). Default: [0]=Minggu */
  visibleDays?: number[];
  /** Legacy: Tanggal mulai tampil (yyyy-MM-dd) */
  visibleFrom?:  string;
  /** Legacy: Tanggal akhir tampil (yyyy-MM-dd) */
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
    let cancelled = false;

    (async () => {
      try {
        const byWeek = await readDoc<BahanKhotbah>("bahan_khotbah", dateKey, EMPTY_BAHAN_KHOTBAH);
        if (cancelled) return;
        if (byWeek.bookSlug) {
          setData(byWeek);
        } else {
          const current = await readDoc<BahanKhotbah>("bahan_khotbah", "current", EMPTY_BAHAN_KHOTBAH);
          if (!cancelled) setData(current ?? EMPTY_BAHAN_KHOTBAH);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
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
  const [data, setData]       = useState<PokokDoa[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    readDoc<{ items: PokokDoa[] }>("pokok_doa_harian", "current", { items: [] })
      .then((d) => setData(d.items ?? []))
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
  // Optional verse location for perikop modal
  bookSlug?:  string;
  bookName?:  string;
  chapter?:   number;
  verseFrom?: number;
  verseTo?:   number;
}
export interface AyatNats { items: AyatNatsItem[]; }

const DEFAULT_AYAT_NATS: AyatNats = { items: [] };

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