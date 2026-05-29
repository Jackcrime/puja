"use client";

// ─── Supabase Data Hooks ──────────────────────────────────────────────────────
// Menggantikan lib/hooks/useFirestoreData.ts
// Semua data di-fetch dari Supabase tables (tanpa JSONB)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { readRow, writeRow, readCollection, insertRow, updateRow, deleteRow, replaceAllRows, subscribeRow } from "@/lib/supabase-db";
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
  titles:         string[];
  photoUrl:       string;
  serviceHistory: ServiceEntry[];
  // legacy compat
  title?:         string;
  ministries?:    string[];
  ministry?:      string;
  servedFrom?:    string;
  servedUntil?:   string;
}

export type AuthorsMap = Record<string, Omit<Author, "code">>;

// ─── Helper: format date key ──────────────────────────────────────────────────
export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getSundayKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return formatDateKey(d);
}

// ─── Row adapter: Supabase snake_case → camelCase ────────────────────────────
function rowToDevotional(row: any): Devotional {
  return {
    title:      row?.title      ?? "",
    authorCode: row?.author_code ?? "",
    audioUrl:   row?.audio_url  ?? "",
    body:       row?.body       ?? "",
    prayer:     row?.prayer     ?? "",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. DEVOTIONAL
// ═══════════════════════════════════════════════════════════════════════════
export const EMPTY_DEVOTIONAL: Devotional = {
  title: "", authorCode: "", audioUrl: "", body: "", prayer: "",
};

export function useDevotional(date?: Date, { noFallback = false }: { noFallback?: boolean } = {}) {
  const [data,    setData]    = useState<Devotional>(EMPTY_DEVOTIONAL);
  const [exists,  setExists]  = useState(false);
  const [loading, setLoading] = useState(true);
  const dateKey = date ? formatDateKey(date) : null;

  useEffect(() => {
    setLoading(true);
    setData(EMPTY_DEVOTIONAL);
    setExists(false);
    let cancelled = false;

    (async () => {
      try {
        if (dateKey) {
          const { data: row } = await supabase
            .from("devotional")
            .select("*")
            .eq("date_key", dateKey)
            .maybeSingle();

          if (cancelled) return;

          if (row?.title || row?.body) {
            setData(rowToDevotional(row));
            setExists(true);
          } else if (!noFallback) {
            const { data: cur } = await supabase
              .from("devotional")
              .select("*")
              .eq("date_key", "current")
              .maybeSingle();
            if (!cancelled) setData(rowToDevotional(cur));
          }
        } else {
          const { data: cur } = await supabase
            .from("devotional")
            .select("*")
            .eq("date_key", "current")
            .maybeSingle();
          if (!cancelled) { setData(rowToDevotional(cur)); setExists(true); }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [dateKey, noFallback]);

  const update = useCallback(async (changes: Partial<Devotional>) => {
    const updated = { ...data, ...changes };
    try {
      const payload = {
        title:       updated.title,
        author_code: updated.authorCode,
        audio_url:   updated.audioUrl ?? "",
        body:        updated.body,
        prayer:      updated.prayer,
      };
      const key = dateKey ?? "current";
      await supabase.from("devotional").upsert({ date_key: key, ...payload }, { onConflict: "date_key" });
      setData(updated);
      setExists(true);
    } catch (e) {
      console.error("[useDevotional] update error:", e);
      toast.error("Gagal menyimpan renungan. Coba lagi.");
    }
  }, [data, dateKey]);

  const clear = useCallback(async () => {
    try {
      const key = dateKey ?? "current";
      await supabase.from("devotional").upsert(
        { date_key: key, title: "", author_code: "", audio_url: "", body: "", prayer: "" },
        { onConflict: "date_key" }
      );
      setData(EMPTY_DEVOTIONAL);
      setExists(false);
    } catch (e) {
      console.error("[useDevotional] clear error:", e);
      toast.error("Gagal mereset renungan. Coba lagi.");
    }
  }, [dateKey]);

  return { data, exists, loading, update, clear };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. PERIKOP
// ═══════════════════════════════════════════════════════════════════════════
export interface PerikopItem { book: string; chapter: number; verses: string; heading: string; }

export function usePerikop() {
  const [data, setData]       = useState<PerikopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: rows } = await supabase
      .from("perikop_items")
      .select("*")
      .order("sort_order", { ascending: true });
    setData((rows ?? []).map((r: any) => ({
      book:    r.book,
      chapter: r.chapter,
      verses:  r.verses,
      heading: r.heading,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (items: PerikopItem[]) => {
    try {
      await supabase.from("perikop_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (items.length > 0) {
        await supabase.from("perikop_items").insert(
          items.map((item, i) => ({ ...item, sort_order: i }))
        );
      }
      setData(items);
    } catch (e) {
      console.error("[usePerikop] save error:", e);
      toast.error("Gagal menyimpan perikop. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. VERSE HIGHLIGHTS
// ═══════════════════════════════════════════════════════════════════════════
export interface VerseHighlightItem { reference: string; text: string; }

export function useVerseHighlights() {
  const [data, setData]       = useState<VerseHighlightItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: rows } = await supabase
      .from("verse_highlights")
      .select("*")
      .order("sort_order", { ascending: true });
    setData((rows ?? []).map((r: any) => ({ reference: r.reference, text: r.text })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (items: VerseHighlightItem[]) => {
    try {
      await supabase.from("verse_highlights").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (items.length > 0) {
        await supabase.from("verse_highlights").insert(
          items.map((item, i) => ({ ...item, sort_order: i }))
        );
      }
      setData(items);
    } catch (e) {
      console.error("[useVerseHighlights] save error:", e);
      toast.error("Gagal menyimpan highlight. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SPECIAL VERSES
// ═══════════════════════════════════════════════════════════════════════════
export interface SpecialVerse { label: string; reference: string; text: string; date?: string; }

export function useSpecialVerses() {
  const [data, setData]       = useState<SpecialVerse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("special_verses")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data: rows }) => {
        setData((rows ?? []).map((r: any) => ({
          label:     r.label,
          reference: r.reference,
          text:      r.text,
          date:      r.date || undefined,
        })));
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. ANNOUNCEMENT (realtime)
// ═══════════════════════════════════════════════════════════════════════════
const EMPTY_ANNOUNCEMENT: Announcement = { text: "", link: "" };

export function useAnnouncement() {
  const [data, setData]       = useState<Announcement>(EMPTY_ANNOUNCEMENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeRow<any>(
      "announcement", "current", null,
      (row) => {
        setData({ text: row?.text ?? "", link: row?.link ?? "" });
        setLoading(false);
      },
      "id"
    );
    return unsub;
  }, []);

  const update = useCallback(async (changes: Partial<Announcement>) => {
    const fresh = { text: changes.text ?? "", link: changes.link ?? "" };
    try {
      await supabase.from("announcement").upsert({ id: "current", ...fresh }, { onConflict: "id" });
      setData(fresh);
    } catch (e) {
      console.error("[useAnnouncement] update error:", e);
      toast.error("Gagal menyimpan pengumuman. Coba lagi.");
    }
  }, []);

  return { data, loading, update };
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. PRAYER TOPIC
// ═══════════════════════════════════════════════════════════════════════════
const EMPTY_PRAYER_TOPIC: PrayerTopic = { title: "", text: "" };

export function usePrayerTopic() {
  const [data, setData]       = useState<PrayerTopic>(EMPTY_PRAYER_TOPIC);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("prayer_topic")
      .select("*")
      .eq("id", "current")
      .maybeSingle()
      .then(({ data: row }) => {
        setData({ title: row?.title ?? "", text: row?.text ?? "" });
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. AUTHORS
// Normalisasi: authors + author_titles + author_service_history
// Hook mengembalikan AuthorsMap (sama seperti sebelumnya) untuk compat
// ═══════════════════════════════════════════════════════════════════════════
const EMPTY_AUTHORS: AuthorsMap = {};

export function useAuthors() {
  const [data, setData]       = useState<AuthorsMap>(EMPTY_AUTHORS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: authors }, { data: titles }, { data: history }] = await Promise.all([
      supabase.from("authors").select("*"),
      supabase.from("author_titles").select("*").order("sort_order"),
      supabase.from("author_service_history").select("*"),
    ]);

    const map: AuthorsMap = {};
    for (const a of (authors ?? [])) {
      map[a.code] = {
        name:           a.name,
        photoUrl:       a.photo_url,
        titles:         (titles ?? []).filter((t: any) => t.author_code === a.code).map((t: any) => t.title),
        serviceHistory: (history ?? []).filter((h: any) => h.author_code === a.code).map((h: any) => ({
          ministryId: h.ministry_id,
          from:       h.from_date,
          until:      h.until_date,
        })),
      };
    }
    setData(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (authors: AuthorsMap) => {
    try {
      // Hapus semua data lama dulu
      await supabase.from("author_service_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("author_titles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("authors").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert baru
      for (const [code, author] of Object.entries(authors)) {
        const { data: inserted } = await supabase
          .from("authors")
          .insert({ code, name: author.name, photo_url: author.photoUrl ?? "" })
          .select("id")
          .single();

        if (author.titles?.length) {
          await supabase.from("author_titles").insert(
            author.titles.map((title, i) => ({ author_code: code, title, sort_order: i }))
          );
        }

        if (author.serviceHistory?.length) {
          await supabase.from("author_service_history").insert(
            author.serviceHistory.map((h) => ({
              author_code: code,
              ministry_id: h.ministryId,
              from_date:   h.from,
              until_date:  h.until,
            }))
          );
        }
      }

      setData(authors);
    } catch (e) {
      console.error("[useAuthors] save error:", e);
      toast.error("Gagal menyimpan data penulis. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. AYAT CATEGORIES
// Normalisasi: ayat_categories + ayat_category_verses
// ═══════════════════════════════════════════════════════════════════════════
export interface AyatCategoryVerse { label: string; reference: string; text: string; }
export interface AyatCategory { category: string; verses: AyatCategoryVerse[]; }

export function useAyatCategories() {
  const [data, setData]       = useState<AyatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: cats }, { data: verses }] = await Promise.all([
      supabase.from("ayat_categories").select("*").order("sort_order"),
      supabase.from("ayat_category_verses").select("*").order("sort_order"),
    ]);

    setData((cats ?? []).map((c: any) => ({
      category: c.category_name,
      verses:   (verses ?? [])
        .filter((v: any) => v.category_id === c.id)
        .map((v: any) => ({ label: v.label, reference: v.reference, text: v.text })),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (items: AyatCategory[]) => {
    try {
      await supabase.from("ayat_category_verses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("ayat_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      for (let i = 0; i < items.length; i++) {
        const cat = items[i];
        const { data: inserted } = await supabase
          .from("ayat_categories")
          .insert({ category_name: cat.category, sort_order: i })
          .select("id")
          .single();

        if (cat.verses?.length && inserted) {
          await supabase.from("ayat_category_verses").insert(
            cat.verses.map((v, j) => ({
              category_id: inserted.id,
              label:       v.label,
              reference:   v.reference,
              text:        v.text,
              sort_order:  j,
            }))
          );
        }
      }

      setData(items);
    } catch (e) {
      console.error("[useAyatCategories] save error:", e);
      toast.error("Gagal menyimpan kategori ayat. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. PUSTAKA BOOKS
// ═══════════════════════════════════════════════════════════════════════════
export interface PustakaBook {
  id: string; title: string; year: number; category: string;
  description: string; pages: number; previewText: string;
  fileUrl?: string; fileStoragePath?: string; audioUrl?: string;
}

function rowToPustakaBook(r: any): PustakaBook {
  return {
    id:              r.id,
    title:           r.title,
    year:            r.year,
    category:        r.category,
    description:     r.description,
    pages:           r.pages,
    previewText:     r.preview_text,
    fileUrl:         r.file_url || undefined,
    fileStoragePath: r.file_storage_path || undefined,
    audioUrl:        r.audio_url || undefined,
  };
}

export function usePustakaBooks() {
  const [data, setData]       = useState<PustakaBook[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("pustaka_books").select("*").order("created_at");
    setData((rows ?? []).map(rowToPustakaBook));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (book: Omit<PustakaBook, "id">) => {
    try {
      const { data: row } = await supabase
        .from("pustaka_books")
        .insert({
          title:             book.title,
          year:              book.year,
          category:          book.category,
          description:       book.description,
          pages:             book.pages,
          preview_text:      book.previewText,
          file_url:          book.fileUrl          ?? "",
          file_storage_path: book.fileStoragePath  ?? "",
          audio_url:         book.audioUrl         ?? "",
        })
        .select("id")
        .single();
      await load();
      return row?.id ?? "";
    } catch (e) {
      console.error("[usePustakaBooks] add error:", e);
      toast.error("Gagal menambah buku. Coba lagi.");
      return "";
    }
  }, [load]);

  const update = useCallback(async (id: string, changes: Partial<PustakaBook>) => {
    try {
      const payload: any = {};
      if (changes.title           !== undefined) payload.title             = changes.title;
      if (changes.year            !== undefined) payload.year              = changes.year;
      if (changes.category        !== undefined) payload.category          = changes.category;
      if (changes.description     !== undefined) payload.description       = changes.description;
      if (changes.pages           !== undefined) payload.pages             = changes.pages;
      if (changes.previewText     !== undefined) payload.preview_text      = changes.previewText;
      if (changes.fileUrl         !== undefined) payload.file_url          = changes.fileUrl;
      if (changes.fileStoragePath !== undefined) payload.file_storage_path = changes.fileStoragePath;
      if (changes.audioUrl        !== undefined) payload.audio_url         = changes.audioUrl;
      await supabase.from("pustaka_books").update(payload).eq("id", id);
      await load();
    } catch (e) {
      console.error("[usePustakaBooks] update error:", e);
      toast.error("Gagal memperbarui buku. Coba lagi.");
    }
  }, [load]);

  const remove = useCallback(async (id: string) => {
    try {
      await supabase.from("pustaka_books").delete().eq("id", id);
      await load();
    } catch (e) {
      console.error("[usePustakaBooks] remove error:", e);
      toast.error("Gagal menghapus buku. Coba lagi.");
    }
  }, [load]);

  return { data, loading, add, update, remove, reload: load };
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. MINISTRIES
// ═══════════════════════════════════════════════════════════════════════════
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
    const { data: rows } = await supabase.from("ministries").select("*").order("category");
    setData(rows && rows.length > 0 ? rows : DEFAULT_MINISTRIES);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (m: Omit<Ministry, "id">) => {
    try {
      const id = m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await supabase.from("ministries").insert({ id, ...m });
      await load();
    } catch (e) {
      console.error("[useMinistries] add error:", e);
      toast.error("Gagal menambah pelayanan. Coba lagi.");
    }
  }, [load]);

  const update = useCallback(async (id: string, changes: Partial<Ministry>) => {
    try {
      await supabase.from("ministries").update(changes).eq("id", id);
      await load();
    } catch (e) {
      console.error("[useMinistries] update error:", e);
      toast.error("Gagal memperbarui pelayanan. Coba lagi.");
    }
  }, [load]);

  const remove = useCallback(async (id: string) => {
    try {
      await supabase.from("ministries").delete().eq("id", id);
      await load();
    } catch (e) {
      console.error("[useMinistries] remove error:", e);
      toast.error("Gagal menghapus pelayanan. Coba lagi.");
    }
  }, [load]);

  return { data, loading, add, update, remove, reload: load };
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. AYAT KHUSUS
// 4 tabel terpisah: tahun, bulan, harian, mingguan
// ═══════════════════════════════════════════════════════════════════════════
export interface AyatKhususBulan    { reference: string; text: string; }
export interface AyatKhususHarian   { reference: string; text: string; }
export interface AyatKhusus {
  tahun?:    { year: number; reference: string; text: string };
  minggu?:   { reference: string; text: string; date?: string };  // legacy
  mingguan?: Record<string, { reference: string; text: string }>; // key: "YYYY-MM-DD"
  bulan?:    Record<string, AyatKhususBulan>;                      // key: "1"–"12"
  harian?:   Record<string, AyatKhususHarian>;                     // key: "YYYY-MM-DD"
}

export function useAyatKhusus() {
  const [data, setData]       = useState<AyatKhusus>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { data: tahun },
      { data: bulanRows },
      { data: harianRows },
      { data: mingguanRows },
    ] = await Promise.all([
      supabase.from("ayat_khusus_tahun").select("*").eq("id", "current").maybeSingle(),
      supabase.from("ayat_khusus_bulan").select("*").order("month"),
      supabase.from("ayat_khusus_harian").select("*").order("date_key"),
      supabase.from("ayat_khusus_mingguan").select("*").order("date_key"),
    ]);

    const bulan: Record<string, AyatKhususBulan> = {};
    for (const row of (bulanRows ?? [])) {
      bulan[String(row.month)] = { reference: row.reference, text: row.text };
    }

    const harian: Record<string, AyatKhususHarian> = {};
    for (const row of (harianRows ?? [])) {
      harian[row.date_key] = { reference: row.reference, text: row.text };
    }

    const mingguan: Record<string, { reference: string; text: string }> = {};
    for (const row of (mingguanRows ?? [])) {
      mingguan[row.date_key] = { reference: row.reference, text: row.text };
    }

    setData({
      tahun:    tahun?.year ? { year: tahun.year, reference: tahun.reference, text: tahun.text } : undefined,
      bulan:    Object.keys(bulan).length > 0 ? bulan : undefined,
      harian:   Object.keys(harian).length > 0 ? harian : undefined,
      mingguan: Object.keys(mingguan).length > 0 ? mingguan : undefined,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (next: AyatKhusus) => {
    try {
      // Tahun
      if (next.tahun) {
        await supabase.from("ayat_khusus_tahun").upsert(
          { id: "current", year: next.tahun.year, reference: next.tahun.reference, text: next.tahun.text },
          { onConflict: "id" }
        );
      }

      // Bulan (upsert per bulan)
      if (next.bulan) {
        for (const [monthStr, val] of Object.entries(next.bulan)) {
          await supabase.from("ayat_khusus_bulan").upsert(
            { month: Number(monthStr), reference: val.reference, text: val.text },
            { onConflict: "month" }
          );
        }
      }

      // Harian (upsert per tanggal)
      if (next.harian) {
        for (const [dateKey, val] of Object.entries(next.harian)) {
          await supabase.from("ayat_khusus_harian").upsert(
            { date_key: dateKey, reference: val.reference, text: val.text },
            { onConflict: "date_key" }
          );
        }
      }

      // Mingguan (upsert per minggu)
      if (next.mingguan) {
        for (const [dateKey, val] of Object.entries(next.mingguan)) {
          await supabase.from("ayat_khusus_mingguan").upsert(
            { date_key: dateKey, reference: val.reference, text: val.text },
            { onConflict: "date_key" }
          );
        }
      }

      setData(next);
    } catch (e) {
      console.error("[useAyatKhusus] save error:", e);
      toast.error("Gagal menyimpan ayat khusus. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ─── Daily verse dari ayat_khusus_harian ─────────────────────────────────────
export function useDailyVerse(dateKey?: string) {
  const [data, setData] = useState<{ reference: string; text: string }>({ reference: "", text: "" });

  useEffect(() => {
    const today = dateKey ?? new Date().toISOString().split("T")[0];
    supabase
      .from("ayat_khusus_harian")
      .select("reference, text")
      .eq("date_key", today)
      .maybeSingle()
      .then(({ data: row }) => {
        if (row) setData({ reference: row.reference, text: row.text });
      });
  }, [dateKey]);

  return { data };
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. MAZMUR MINGGU
// ═══════════════════════════════════════════════════════════════════════════
export interface MazmurMinggu {
  reference:    string;
  title:        string;
  verses:       { number: string; text: string }[];
  visible?:     boolean;
  visibleDays?: number[];
}

const EMPTY_MAZMUR: MazmurMinggu = { reference: "", title: "", verses: [], visible: true };

async function loadMazmurByKey(dateKey: string): Promise<MazmurMinggu | null> {
  const { data: row } = await supabase
    .from("mazmur_minggu")
    .select("id, reference, title, visible")
    .eq("date_key", dateKey)
    .maybeSingle();

  if (!row?.reference) return null;

  const [{ data: verses }, { data: days }] = await Promise.all([
    supabase.from("mazmur_minggu_verses").select("number, text, sort_order").eq("mazmur_id", row.id).order("sort_order"),
    supabase.from("mazmur_visible_days").select("day_of_week").eq("mazmur_id", row.id),
  ]);

  return {
    reference:    row.reference,
    title:        row.title,
    visible:      row.visible,
    verses:       (verses ?? []).map((v: any) => ({ number: v.number, text: v.text })),
    visibleDays:  days && days.length > 0 ? (days as any[]).map((d) => d.day_of_week) : undefined,
  };
}

async function saveMazmurByKey(dateKey: string, next: MazmurMinggu): Promise<void> {
  const { data: upserted } = await supabase
    .from("mazmur_minggu")
    .upsert({ date_key: dateKey, reference: next.reference, title: next.title, visible: next.visible ?? true }, { onConflict: "date_key" })
    .select("id")
    .single();

  const id = upserted?.id;
  if (!id) throw new Error("Gagal upsert mazmur_minggu");

  await supabase.from("mazmur_minggu_verses").delete().eq("mazmur_id", id);
  await supabase.from("mazmur_visible_days").delete().eq("mazmur_id", id);

  if (next.verses?.length) {
    await supabase.from("mazmur_minggu_verses").insert(
      next.verses.map((v, i) => ({ mazmur_id: id, number: v.number, text: v.text, sort_order: i }))
    );
  }
  if (next.visibleDays?.length) {
    await supabase.from("mazmur_visible_days").insert(
      next.visibleDays.map((d) => ({ mazmur_id: id, day_of_week: d }))
    );
  }
}

export function useMazmurMinggu(date?: Date) {
  const [data, setData]       = useState<MazmurMinggu>(EMPTY_MAZMUR);
  const [loading, setLoading] = useState(true);
  const dateKey = getSundayKey(date ?? new Date());

  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const byWeek = await loadMazmurByKey(dateKey);
        if (cancelled) return;
        if (byWeek) {
          setData(byWeek);
        } else {
          const current = await loadMazmurByKey("current");
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
      await saveMazmurByKey(key, next);
      await saveMazmurByKey("current", next);
      setData(next);
    } catch (e) {
      console.error("[useMazmurMinggu] save error:", e);
      toast.error("Gagal menyimpan Mazmur Minggu. Coba lagi.");
    }
  }, [date]);

  const clear = useCallback(async (targetDate?: Date) => {
    const key = getSundayKey(targetDate ?? date ?? new Date());
    try {
      await supabase.from("mazmur_minggu").upsert(
        { date_key: key, reference: "", title: "", visible: true },
        { onConflict: "date_key" }
      );
      await supabase.from("mazmur_minggu").upsert(
        { date_key: "current", reference: "", title: "", visible: true },
        { onConflict: "date_key" }
      );
      setData(EMPTY_MAZMUR);
    } catch (e) {
      console.error("[useMazmurMinggu] clear error:", e);
      toast.error("Gagal mereset Mazmur Minggu. Coba lagi.");
    }
  }, [date]);

  return { data, loading, save, clear, dateKey };
}

// ═══════════════════════════════════════════════════════════════════════════
// 13. BAHAN KHOTBAH
// ═══════════════════════════════════════════════════════════════════════════
export interface BahanKhotbah {
  bookSlug:  string; bookName: string; chapter: number;
  verseFrom: number; verseTo: number;  reference: string;
  visible?:  boolean; visibleDays?: number[];
  visibleFrom?: string; visibleUntil?: string;
}

const EMPTY_BAHAN_KHOTBAH: BahanKhotbah = {
  bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1, reference: "",
};

async function loadKhotbahByKey(dateKey: string): Promise<BahanKhotbah | null> {
  const { data: row } = await supabase
    .from("bahan_khotbah")
    .select("id, book_slug, book_name, chapter, verse_from, verse_to, reference, visible, visible_from, visible_until")
    .eq("date_key", dateKey)
    .maybeSingle();

  if (!row?.book_slug) return null;

  const { data: days } = await supabase
    .from("khotbah_visible_days")
    .select("day_of_week")
    .eq("khotbah_id", row.id);

  return {
    bookSlug:     row.book_slug,
    bookName:     row.book_name,
    chapter:      row.chapter,
    verseFrom:    row.verse_from,
    verseTo:      row.verse_to,
    reference:    row.reference,
    visible:      row.visible,
    visibleFrom:  row.visible_from || undefined,
    visibleUntil: row.visible_until || undefined,
    visibleDays:  days && days.length > 0 ? (days as any[]).map((d) => d.day_of_week) : undefined,
  };
}

async function saveKhotbahByKey(dateKey: string, next: BahanKhotbah): Promise<void> {
  const { data: upserted } = await supabase
    .from("bahan_khotbah")
    .upsert({
      date_key:      dateKey,
      book_slug:     next.bookSlug,
      book_name:     next.bookName,
      chapter:       next.chapter,
      verse_from:    next.verseFrom,
      verse_to:      next.verseTo,
      reference:     next.reference,
      visible:       next.visible ?? true,
      visible_from:  next.visibleFrom  ?? "",
      visible_until: next.visibleUntil ?? "",
    }, { onConflict: "date_key" })
    .select("id")
    .single();

  const id = upserted?.id;
  if (!id) throw new Error("Gagal upsert bahan_khotbah");

  await supabase.from("khotbah_visible_days").delete().eq("khotbah_id", id);
  if (next.visibleDays?.length) {
    await supabase.from("khotbah_visible_days").insert(
      next.visibleDays.map((d) => ({ khotbah_id: id, day_of_week: d }))
    );
  }
}

export function useBahanKhotbah(date?: Date) {
  const [data, setData]       = useState<BahanKhotbah>(EMPTY_BAHAN_KHOTBAH);
  const [loading, setLoading] = useState(true);
  const dateKey = getSundayKey(date ?? new Date());

  useEffect(() => {
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const byWeek = await loadKhotbahByKey(dateKey);
        if (cancelled) return;
        if (byWeek) {
          setData(byWeek);
        } else {
          const current = await loadKhotbahByKey("current");
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
      await saveKhotbahByKey(key, next);
      await saveKhotbahByKey("current", next);
      setData(next);
    } catch (e) {
      console.error("[useBahanKhotbah] save error:", e);
      toast.error("Gagal menyimpan Bahan Khotbah. Coba lagi.");
    }
  }, [date]);

  const clear = useCallback(async (targetDate?: Date) => {
    const key = getSundayKey(targetDate ?? date ?? new Date());
    try {
      for (const k of [key, "current"]) {
        await supabase.from("bahan_khotbah").upsert(
          { date_key: k, book_slug: "", book_name: "", chapter: 1, verse_from: 1, verse_to: 1, reference: "" },
          { onConflict: "date_key" }
        );
      }
      setData(EMPTY_BAHAN_KHOTBAH);
    } catch (e) {
      console.error("[useBahanKhotbah] clear error:", e);
      toast.error("Gagal mereset Bahan Khotbah. Coba lagi.");
    }
  }, [date]);

  return { data, loading, save, clear, dateKey };
}

// ═══════════════════════════════════════════════════════════════════════════
// 14. POKOK DOA HARIAN
// ═══════════════════════════════════════════════════════════════════════════
export interface PokokDoa { hari: string; topik: string; detail: string; }

export function usePokokDoaHarian() {
  const [data, setData]       = useState<PokokDoa[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: rows } = await supabase
      .from("pokok_doa_harian")
      .select("*")
      .order("sort_order");
    setData((rows ?? []).map((r: any) => ({ hari: r.hari, topik: r.topik, detail: r.detail })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (items: PokokDoa[]) => {
    try {
      await supabase.from("pokok_doa_harian").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (items.length > 0) {
        await supabase.from("pokok_doa_harian").insert(
          items.map((item, i) => ({ ...item, sort_order: i }))
        );
      }
      setData(items);
    } catch (e) {
      console.error("[usePokokDoaHarian] save error:", e);
      toast.error("Gagal menyimpan pokok doa. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ═══════════════════════════════════════════════════════════════════════════
// 15 & 16. AYAT NATS + DAILY SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════
export interface AyatNatsItem {
  id: string; reference: string; text: string;
  bookSlug?: string; bookName?: string;
  chapter?: number; verseFrom?: number; verseTo?: number;
}
export interface AyatNats          { items: AyatNatsItem[]; }
export interface AyatNatsDailySchedule { schedule: Record<string, string[]>; }

const DEFAULT_AYAT_NATS: AyatNats = { items: [] };
const DEFAULT_SCHEDULE: AyatNatsDailySchedule = { schedule: {} };

function rowToAyatNats(r: any): AyatNatsItem {
  return {
    id:        r.id,
    reference: r.reference,
    text:      r.text,
    bookSlug:  r.book_slug  || undefined,
    bookName:  r.book_name  || undefined,
    chapter:   r.chapter    || undefined,
    verseFrom: r.verse_from || undefined,
    verseTo:   r.verse_to   || undefined,
  };
}

export function useAyatNats() {
  const [data, setData]       = useState<AyatNats>(DEFAULT_AYAT_NATS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: rows } = await supabase.from("ayat_nats").select("*").order("sort_order");
    setData({ items: (rows ?? []).map(rowToAyatNats) });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (next: AyatNats) => {
    try {
      await supabase.from("ayat_nats").delete().neq("id", "SENTINEL");
      if (next.items.length > 0) {
        await supabase.from("ayat_nats").insert(
          next.items.map((item, i) => ({
            id:         item.id,
            reference:  item.reference,
            text:       item.text,
            book_slug:  item.bookSlug  ?? "",
            book_name:  item.bookName  ?? "",
            chapter:    item.chapter   ?? 0,
            verse_from: item.verseFrom ?? 0,
            verse_to:   item.verseTo   ?? 0,
            sort_order: i,
          }))
        );
      }
      setData(next);
    } catch (e) {
      console.error("[useAyatNats] save error:", e);
      toast.error("Gagal menyimpan ayat nats. Coba lagi.");
    }
  }, []);

  return { data, loading, save };
}

// ─── Ayat Nats Harian ────────────────────────────────────────────────────────
function autoPickItem(items: AyatNatsItem[], date: Date): AyatNatsItem[] {
  if (items.length === 0) return [];
  const epoch     = new Date(2025, 0, 1).getTime();
  const daysSince = Math.floor((date.getTime() - epoch) / 86400000);
  const idx       = ((daysSince % items.length) + items.length) % items.length;
  return [items[idx]];
}

export function useAyatNatsHarian(date?: Date) {
  const targetDate = date ?? new Date();
  const dateKey    = formatDateKey(targetDate);

  const [pool,    setPool]    = useState<AyatNats>(DEFAULT_AYAT_NATS);
  const [schedule, setSchedule] = useState<AyatNatsDailySchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("ayat_nats").select("*").order("sort_order"),
      supabase.from("ayat_nats_schedule").select("ayat_nats_id, sort_order").eq("date_key", dateKey).order("sort_order"),
    ]).then(([{ data: nats }, { data: sched }]) => {
      const items = (nats ?? []).map(rowToAyatNats);
      setPool({ items });

      const schedMap: Record<string, string[]> = {};
      if (sched && sched.length > 0) {
        schedMap[dateKey] = (sched as any[]).map((s) => s.ayat_nats_id);
      }
      setSchedule({ schedule: schedMap });
      setLoading(false);
    });
  }, [dateKey]);

  const items = (() => {
    const allItems = pool.items ?? [];
    if (allItems.length === 0) return [];
    const scheduledIds = schedule.schedule?.[dateKey];
    if (scheduledIds && scheduledIds.length > 0) {
      const found = scheduledIds.map((id) => allItems.find((i) => i.id === id)).filter(Boolean) as AyatNatsItem[];
      if (found.length > 0) return found;
    }
    return autoPickItem(allItems, targetDate);
  })();

  return { items, pool, schedule, loading };
}

export function useAyatNatsSchedule() {
  const [data,    setData]    = useState<AyatNatsDailySchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ayat_nats_schedule")
      .select("date_key, ayat_nats_id, sort_order")
      .order("sort_order")
      .then(({ data: rows }) => {
        const schedule: Record<string, string[]> = {};
        for (const row of (rows ?? [])) {
          if (!schedule[row.date_key]) schedule[row.date_key] = [];
          schedule[row.date_key].push(row.ayat_nats_id);
        }
        setData({ schedule });
        setLoading(false);
      });
  }, []);

  const save = useCallback(async (next: AyatNatsDailySchedule) => {
    try {
      await supabase.from("ayat_nats_schedule").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const rows: any[] = [];
      for (const [dateKey, ids] of Object.entries(next.schedule)) {
        ids.forEach((id, i) => rows.push({ date_key: dateKey, ayat_nats_id: id, sort_order: i }));
      }
      if (rows.length > 0) await supabase.from("ayat_nats_schedule").insert(rows);
      setData(next);
    } catch (e) {
      console.error("[useAyatNatsSchedule] save error:", e);
      toast.error("Gagal menyimpan jadwal harian. Coba lagi.");
    }
  }, []);

  const toggleItemForDate = useCallback(async (dateKey: string, itemId: string | null) => {
    setData((prev) => {
      const next = { schedule: { ...(prev.schedule ?? {}) } };
      if (itemId === null) {
        delete next.schedule[dateKey];
      } else {
        const current = next.schedule[dateKey] ?? [];
        if (current.includes(itemId)) {
          const updated = current.filter((id) => id !== itemId);
          if (updated.length === 0) delete next.schedule[dateKey];
          else next.schedule[dateKey] = updated;
        } else {
          next.schedule[dateKey] = [...current, itemId];
        }
      }
      // Persist async
      (async () => {
        await supabase.from("ayat_nats_schedule").delete().eq("date_key", dateKey);
        const ids = next.schedule[dateKey] ?? [];
        if (ids.length > 0) {
          await supabase.from("ayat_nats_schedule").insert(
            ids.map((id, i) => ({ date_key: dateKey, ayat_nats_id: id, sort_order: i }))
          );
        }
      })().catch(console.error);
      return next;
    });
  }, []);

  return { data, loading, save, toggleItemForDate };
}

// ═══════════════════════════════════════════════════════════════════════════
// 17. BIBLE READINGS
// ═══════════════════════════════════════════════════════════════════════════
export interface BibleReading {
  reference:  string; title: string;
  verses?:    { number: string; text: string }[];
  crossRefs?: { reference: string; note?: string }[];
}

async function loadBibleReadingsByKey(dateKey: string): Promise<BibleReading[]> {
  const { data: readings } = await supabase
    .from("bible_readings")
    .select("id, reference, title, sort_order")
    .eq("date_key", dateKey)
    .order("sort_order");

  if (!readings || readings.length === 0) return [];

  const ids = readings.map((r: any) => r.id);
  const [{ data: verses }, { data: crossRefs }] = await Promise.all([
    supabase.from("bible_reading_verses").select("*").in("reading_id", ids).order("sort_order"),
    supabase.from("bible_reading_cross_refs").select("*").in("reading_id", ids).order("sort_order"),
  ]);

  return readings.map((r: any) => ({
    reference: r.reference,
    title:     r.title,
    verses:    (verses ?? []).filter((v: any) => v.reading_id === r.id)
                            .map((v: any) => ({ number: v.number, text: v.text })),
    crossRefs: (crossRefs ?? []).filter((c: any) => c.reading_id === r.id)
                               .map((c: any) => ({ reference: c.reference, note: c.note || undefined })),
  }));
}

async function saveBibleReadingsByKey(dateKey: string, items: BibleReading[]): Promise<void> {
  // Hapus readings lama untuk date_key ini
  const { data: old } = await supabase.from("bible_readings").select("id").eq("date_key", dateKey);
  if (old && old.length > 0) {
    const ids = (old as any[]).map((r) => r.id);
    await supabase.from("bible_reading_verses").delete().in("reading_id", ids);
    await supabase.from("bible_reading_cross_refs").delete().in("reading_id", ids);
    await supabase.from("bible_readings").delete().eq("date_key", dateKey);
  }

  if (items.length === 0) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { data: inserted } = await supabase
      .from("bible_readings")
      .insert({ date_key: dateKey, reference: item.reference, title: item.title, sort_order: i })
      .select("id")
      .single();

    if (!inserted?.id) continue;
    const rid = inserted.id;

    if (item.verses?.length) {
      await supabase.from("bible_reading_verses").insert(
        item.verses.map((v, j) => ({ reading_id: rid, number: v.number, text: v.text, sort_order: j }))
      );
    }
    if (item.crossRefs?.length) {
      await supabase.from("bible_reading_cross_refs").insert(
        item.crossRefs.map((c, j) => ({ reading_id: rid, reference: c.reference, note: c.note ?? "", sort_order: j }))
      );
    }
  }
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
          const byDate = await loadBibleReadingsByKey(dateKey);
          if (cancelled) return;
          if (byDate.length > 0) {
            setData(byDate);
          } else {
            const current = await loadBibleReadingsByKey("current");
            if (!cancelled) setData(current);
          }
        } else {
          const current = await loadBibleReadingsByKey("current");
          if (!cancelled) setData(current);
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
        await saveBibleReadingsByKey(dateKey, items);
        await saveBibleReadingsByKey("current", items);
      } else {
        await saveBibleReadingsByKey("current", items);
      }
      setData(items);
    } catch (e) {
      console.error("[useBibleReadings] save error:", e);
      toast.error("Gagal menyimpan bacaan Alkitab. Coba lagi.");
    }
  }, [dateKey]);

  return { data, loading, save };
}
