"use client";

/**
 * DashboardIncompleteContent — Revamped
 * ──────────────────────────────────────
 * Menampilkan status konten LENGKAP mencerminkan semua tab dari:
 *   - /admin/renungan  (Renungan, Bacaan, Mazmur, Khotbah, Pokok Doa)
 *   - /admin/ayat      (Nats, Harian, Mingguan, Bulan, Tahun)
 *
 * Semua data via onSnapshot (realtime) — self-contained, tidak butuh props.
 */

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { AyatNats, BahanKhotbah, MazmurMinggu, PokokDoa, Devotional, AuthorsMap } from "@/lib/hooks/useSupabaseData";
import { EMPTY_DEVOTIONAL } from "@/lib/hooks/useSupabaseData";
import {
  CheckCircle2, XCircle, ChevronDown, RefreshCw,
  BookOpen, BookMarked, HandHeart, Star, CalendarDays,
  Calendar, Music, Flame,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldRow {
  label:   string;
  filled:  boolean;
  detail?: string;
}

interface ContentSection {
  id:       string;
  title:    string;
  icon:     React.ElementType;
  color:    string;
  href:     string;
  rows:     FieldRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const HARI         = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function sundayKey(d = new Date()) {
  const s = new Date(d); s.setDate(s.getDate() - s.getDay());
  return todayKey(s);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniDot({ filled }: { filled: boolean }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
      style={{ backgroundColor: filled ? "#22c55e" : "#fca5a5" }}
    />
  );
}

function ProgressBar({ rows, color }: { rows: FieldRow[]; color: string }) {
  const filled = rows.filter((r) => r.filled).length;
  const pct    = rows.length === 0 ? 0 : (filled / rows.length) * 100;
  return (
    <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function SectionCard({ section, defaultOpen = false }: { section: ContentSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon    = section.icon;
  const filled  = section.rows.filter((r) => r.filled).length;
  const total   = section.rows.length;
  const allDone = filled === total && total > 0;
  const pct     = total === 0 ? 0 : Math.round((filled / total) * 100);

  const pillColor = allDone
    ? { bg: "#dcfce7", fg: "#16a34a" }
    : pct >= 60
    ? { bg: "#fef9c3", fg: "#854d0e" }
    : { bg: "#fee2e2", fg: "#dc2626" };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${section.color}18` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: section.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: section.color }}>
              {section.title}
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: pillColor.bg, color: pillColor.fg }}
            >
              {filled}/{total}
            </span>
          </div>
          <ProgressBar rows={section.rows} color={section.color} />
        </div>

        {/* Dot strip */}
        <div className="flex gap-0.5 items-center shrink-0">
          {section.rows.map((r, i) => <MiniDot key={i} filled={r.filled} />)}
        </div>

        <ChevronDown
          className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Rows */}
      {open && (
        <div className="border-t border-border divide-y divide-border/60">
          {section.rows.map((row, i) => (
            <Link
              key={i}
              href={section.href}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-muted/20 transition-colors group"
            >
              {row.filled
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                : <XCircle      className="h-3.5 w-3.5 text-red-400 shrink-0 opacity-70" />
              }
              <span className="text-[11px] text-muted-foreground flex-1 leading-tight">{row.label}</span>
              {row.detail && (
                <span
                  className="text-[10px] font-medium truncate max-w-[100px]"
                  style={{ color: row.filled ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                >
                  {row.detail}
                </span>
              )}
              <span
                className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                style={{ color: section.color }}
              >
                Edit →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live dot ─────────────────────────────────────────────────────────────────

function LiveDot({ lastUpdated }: { lastUpdated: Date | null }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!lastUpdated) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1200);
    return () => clearTimeout(t);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-1.5">
      {flash && (
        <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium animate-pulse">
          <RefreshCw className="h-2.5 w-2.5" /> diperbarui
        </span>
      )}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-[10px] text-muted-foreground">
        LIVE · {lastUpdated ? format(lastUpdated, "HH:mm:ss", { locale: localeId }) : "—"}
      </span>
    </div>
  );
}

// ─── Global progress bar ──────────────────────────────────────────────────────

function GlobalProgress({ sections }: { sections: ContentSection[] }) {
  const total  = sections.reduce((s, sec) => s + sec.rows.length, 0);
  const filled = sections.reduce((s, sec) => s + sec.rows.filter((r) => r.filled).length, 0);
  const pct    = total === 0 ? 0 : Math.round((filled / total) * 100);
  const color  = pct === 100 ? "#16a34a" : pct >= 60 ? "var(--brand)" : "#dc2626";

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[10px] text-muted-foreground mb-0.5">Kelengkapan konten hari ini</p>
          <p className="text-2xl font-black leading-none tabular-nums" style={{ color }}>{pct}%</p>
        </div>
        <p className="text-[10px] text-muted-foreground text-right">
          {filled}/{total} field<br />terisi
        </p>
      </div>
      {/* Segmented bar */}
      <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
        {sections.map((sec) => {
          const f = sec.rows.filter((r) => r.filled).length;
          const t = sec.rows.length;
          return (
            <div
              key={sec.id}
              className="rounded-full overflow-hidden bg-muted/50"
              style={{ flex: t }}
            >
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${t === 0 ? 0 : (f / t) * 100}%`, backgroundColor: sec.color }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
        {sections.map((sec) => (
          <div key={sec.id} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sec.color }} />
            <span className="text-[9px] text-muted-foreground">{sec.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comprehensive Supabase data hook for dashboard content ──────────────────
function useDashboardContent() {
  const [devotional,    setDevotional]    = useState<Devotional>(EMPTY_DEVOTIONAL);
  const [mazmur,        setMazmur]        = useState<MazmurMinggu>({ reference: "", title: "", verses: [], visible: true });
  const [khotbah,       setKhotbah]       = useState<BahanKhotbah>({ bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1, reference: "" });
  const [pokdoa,        setPokdoa]        = useState<PokokDoa[]>([]);
  const [authors,       setAuthors]       = useState<AuthorsMap>({});
  const [bibleReadings, setBibleReadings] = useState<{ reference: string; title: string }[]>([]);
  const [nats,          setNats]          = useState<AyatNats>({ items: [] });
  const [khusus,        setKhusus]        = useState<any>({});
  const [loading,       setLoading]       = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);

  const loadedRef = useRef({ dev: false, maz: false, kht: false, pkd: false, aut: false, brd: false, nat: false, khu: false });
  const totalKeys = Object.keys(loadedRef.current).length;

  const bump = (key: keyof typeof loadedRef.current) => {
    loadedRef.current[key] = true;
    if (Object.values(loadedRef.current).every(Boolean)) setLoading(false);
    setLastUpdated(new Date());
  };

  const today  = todayKey();
  const thisWk = sundayKey();

  useEffect(() => {
    // 1. Devotional today
    async function loadDevotional() {
      const { data: row } = await supabase.from("devotional").select("*").eq("date_key", today).maybeSingle();
      if (row?.title || row?.body) {
        setDevotional({ title: row.title, authorCode: row.author_code, audioUrl: row.audio_url, body: row.body, prayer: row.prayer });
      } else {
        const { data: cur } = await supabase.from("devotional").select("*").eq("date_key", "current").maybeSingle();
        if (cur) setDevotional({ title: cur.title, authorCode: cur.author_code, audioUrl: cur.audio_url, body: cur.body, prayer: cur.prayer });
      }
      bump("dev");
    }

    // 2. Mazmur minggu
    async function loadMazmur() {
      const { data: row } = await supabase.from("mazmur_minggu").select("id, reference, title, visible").eq("date_key", thisWk).maybeSingle();
      if (row?.reference) {
        const { data: verses } = await supabase.from("mazmur_minggu_verses").select("number, text, sort_order").eq("mazmur_id", row.id).order("sort_order");
        setMazmur({ reference: row.reference, title: row.title, verses: (verses ?? []).map((v: any) => ({ number: v.number, text: v.text })), visible: row.visible });
      } else {
        const { data: cur } = await supabase.from("mazmur_minggu").select("id, reference, title, visible").eq("date_key", "current").maybeSingle();
        if (cur?.reference) {
          const { data: verses } = await supabase.from("mazmur_minggu_verses").select("number, text, sort_order").eq("mazmur_id", cur.id).order("sort_order");
          setMazmur({ reference: cur.reference, title: cur.title, verses: (verses ?? []).map((v: any) => ({ number: v.number, text: v.text })), visible: cur.visible });
        }
      }
      bump("maz");
    }

    // 3. Bahan khotbah
    async function loadKhotbah() {
      const { data: row } = await supabase.from("bahan_khotbah").select("*").eq("date_key", thisWk).maybeSingle();
      if (row?.book_slug) {
        setKhotbah({ bookSlug: row.book_slug, bookName: row.book_name, chapter: row.chapter, verseFrom: row.verse_from, verseTo: row.verse_to, reference: row.reference, visible: row.visible });
      } else {
        const { data: cur } = await supabase.from("bahan_khotbah").select("*").eq("date_key", "current").maybeSingle();
        if (cur?.book_slug) setKhotbah({ bookSlug: cur.book_slug, bookName: cur.book_name, chapter: cur.chapter, verseFrom: cur.verse_from, verseTo: cur.verse_to, reference: cur.reference, visible: cur.visible });
      }
      bump("kht");
    }

    // 4. Pokok doa harian
    async function loadPokdoa() {
      const { data: rows } = await supabase.from("pokok_doa_harian").select("*").order("sort_order");
      setPokdoa((rows ?? []).map((r: any) => ({ hari: r.hari, topik: r.topik, detail: r.detail })));
      bump("pkd");
    }

    // 5. Authors map
    async function loadAuthors() {
      const [{ data: authRows }, { data: titlesRows }] = await Promise.all([
        supabase.from("authors").select("*"),
        supabase.from("author_titles").select("*").order("sort_order"),
      ]);
      const map: AuthorsMap = {};
      for (const a of (authRows ?? [])) {
        map[a.code] = {
          name:           a.name,
          photoUrl:       a.photo_url,
          titles:         (titlesRows ?? []).filter((t: any) => t.author_code === a.code).map((t: any) => t.title),
          serviceHistory: [],
        };
      }
      setAuthors(map);
      bump("aut");
    }

    // 6. Bible readings today
    async function loadBibleReadings() {
      const { data: readings } = await supabase.from("bible_readings").select("id, reference, title, sort_order").eq("date_key", today).order("sort_order");
      if (readings && readings.length > 0) {
        setBibleReadings(readings.map((r: any) => ({ reference: r.reference, title: r.title })));
      } else {
        const { data: cur } = await supabase.from("bible_readings").select("id, reference, title, sort_order").eq("date_key", "current").order("sort_order");
        setBibleReadings((cur ?? []).map((r: any) => ({ reference: r.reference, title: r.title })));
      }
      bump("brd");
    }

    // 7. Ayat nats pool
    async function loadNats() {
      const { data: rows } = await supabase.from("ayat_nats").select("id, reference, text").order("sort_order");
      setNats({ items: (rows ?? []).map((r: any) => ({ id: r.id, reference: r.reference, text: r.text })) });
      bump("nat");
    }

    // 8. Ayat khusus (harian + mingguan + bulan + tahun)
    async function loadKhusus() {
      const [
        { data: tahun },
        { data: bulanRows },
        { data: harianRow },
        { data: mingguanRow },
      ] = await Promise.all([
        supabase.from("ayat_khusus_tahun").select("*").eq("id", "current").maybeSingle(),
        supabase.from("ayat_khusus_bulan").select("*"),
        supabase.from("ayat_khusus_harian").select("*").eq("date_key", today).maybeSingle(),
        supabase.from("ayat_khusus_mingguan").select("*").eq("date_key", thisWk).maybeSingle(),
      ]);

      const bulan: Record<string, any> = {};
      for (const row of (bulanRows ?? [])) bulan[String(row.month)] = { reference: row.reference, text: row.text };

      setKhusus({
        tahun:    tahun?.year ? { year: tahun.year, reference: tahun.reference, text: tahun.text } : undefined,
        bulan:    Object.keys(bulan).length > 0 ? bulan : undefined,
        harian:   harianRow  ? { [today]:  { reference: harianRow.reference,   text: harianRow.text   } } : undefined,
        mingguan: mingguanRow ? { [thisWk]: { reference: mingguanRow.reference, text: mingguanRow.text } } : undefined,
      });
      bump("khu");
    }

    loadDevotional();
    loadMazmur();
    loadKhotbah();
    loadPokdoa();
    loadAuthors();
    loadBibleReadings();
    loadNats();
    loadKhusus();

    // ── Realtime subscriptions ───────────────────────────────────────────────
    const channel = supabase
      .channel("dashboard_content")
      .on("postgres_changes", { event: "*", schema: "public", table: "devotional" },     loadDevotional)
      .on("postgres_changes", { event: "*", schema: "public", table: "mazmur_minggu" },  loadMazmur)
      .on("postgres_changes", { event: "*", schema: "public", table: "mazmur_minggu_verses" }, loadMazmur)
      .on("postgres_changes", { event: "*", schema: "public", table: "bahan_khotbah" },  loadKhotbah)
      .on("postgres_changes", { event: "*", schema: "public", table: "pokok_doa_harian" }, loadPokdoa)
      .on("postgres_changes", { event: "*", schema: "public", table: "bible_readings" }, loadBibleReadings)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_nats" },      loadNats)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_tahun" },    loadKhusus)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_bulan" },    loadKhusus)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_harian" },   loadKhusus)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_mingguan" }, loadKhusus)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { devotional, mazmur, khotbah, pokdoa, authors, bibleReadings, nats, khusus, loading, lastUpdated };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DashboardIncompleteContent() {
  // ── All data via Supabase realtime ────────────────────────────────────────
  const {
    devotional: dev, mazmur, khotbah, pokdoa,
    authors, bibleReadings, nats, khusus,
    loading, lastUpdated,
  } = useDashboardContent();

  // ── Derived keys ─────────────────────────────────────────────────────────
  const today   = todayKey();
  const thisWk  = sundayKey();
  const thisM   = String(new Date().getMonth() + 1);

  // ── Author name ───────────────────────────────────────────────────────────
  const authorName = (() => {
    if (!dev.authorCode) return undefined;
    const a = (authors as any)[dev.authorCode];
    return a ? `${a.title ? a.title + " " : ""}${a.name}` : dev.authorCode;
  })();

  // ── Section: Renungan Harian ──────────────────────────────────────────────
  const renunganSection: ContentSection = {
    id: "renungan", title: "Renungan Harian", icon: BookOpen,
    color: "var(--brand)", href: "/admin/renungan",
    rows: [
      { label: "Judul",       filled: !!dev.title?.trim(),      detail: dev.title?.slice(0, 24) },
      { label: "Penulis",     filled: !!dev.authorCode?.trim(), detail: authorName },
      { label: "Isi Renungan",filled: !!dev.body?.trim(),       detail: dev.body ? `${dev.body.split(" ").filter(Boolean).length} kata` : undefined },
      { label: "Doa Penutup", filled: !!dev.prayer?.trim(),     detail: dev.prayer ? `${dev.prayer.split(" ").filter(Boolean).length} kata` : undefined },
      { label: "Audio MP3",   filled: !!dev.audioUrl?.trim(),   detail: dev.audioUrl ? "Terupload" : undefined },
    ],
  };

  // ── Section: Bacaan Alkitab ───────────────────────────────────────────────
  const bacaanSection: ContentSection = {
    id: "bacaan", title: "Bacaan Alkitab", icon: BookOpen,
    color: "#16a34a", href: "/admin/renungan",
    rows: bibleReadings.length > 0
      ? bibleReadings.map((r, i) => ({
          label:  `Bacaan ${i + 1}`,
          filled: !!r.reference?.trim(),
          detail: r.reference?.slice(0, 20),
        }))
      : [{ label: "Belum ada bacaan ditambahkan", filled: false }],
  };

  // ── Section: Mazmur & Khotbah ─────────────────────────────────────────────
  const trackedSunday = format(
    (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d; })(),
    "d MMM", { locale: localeId }
  );
  const mazmurSection: ContentSection = {
    id: "mazmur-khotbah", title: `Mazmur & Khotbah (${trackedSunday})`, icon: BookMarked,
    color: "#7c3aed", href: "/admin/renungan",
    rows: [
      { label: "Mazmur — Referensi", filled: !!mazmur.reference?.trim(),       detail: mazmur.reference },
      { label: "Mazmur — Ayat",      filled: (mazmur.verses?.length ?? 0) > 0, detail: mazmur.verses?.length ? `${mazmur.verses.length} ayat` : undefined },
      { label: "Khotbah — Perikop",  filled: !!(khotbah.bookSlug?.trim() || khotbah.reference?.trim()), detail: khotbah.reference || undefined },
    ],
  };

  // ── Section: Pokok Doa ────────────────────────────────────────────────────
  const pokdoaSection: ContentSection = {
    id: "pokdoa", title: "Pokok Doa", icon: HandHeart,
    color: "#0891b2", href: "/admin/renungan",
    rows: HARI.map((hari) => {
      const entry = pokdoa.find((d: any) => d.hari === hari);
      return { label: hari, filled: !!entry?.topik?.trim(), detail: entry?.topik?.slice(0, 18) };
    }),
  };

  // ── Section: Ayat Nats ────────────────────────────────────────────────────
  const natsSection: ContentSection = {
    id: "ayat-nats", title: "Ayat Nats", icon: Star,
    color: "var(--gold)", href: "/admin/ayat?tab=kategori",
    rows: nats.items.length > 0
      ? nats.items.slice(0, 6).map((item, i) => ({
          label:  `Nats ${i + 1}`,
          filled: !!item.reference?.trim() && !!item.text?.trim(),
          detail: item.reference?.slice(0, 20),
        }))
      : [{ label: "Belum ada ayat nats ditambahkan", filled: false }],
  };

  // ── Section: Ayat Jadwal (Harian + Mingguan + Bulan + Tahun) ─────────────
  // khusus comes from useDashboardContent hook above

  const ayatJadwalSection: ContentSection = {
    id: "ayat-jadwal", title: "Ayat Jadwal", icon: CalendarDays,
    color: "#e07b3a", href: "/admin/ayat?tab=harian",
    rows: [
      {
        label:  `Ayat Hari Ini (${format(new Date(), "d MMM", { locale: localeId })})`,
        filled: !!khusus.harian?.[today]?.reference,
        detail: khusus.harian?.[today]?.reference,
      },
      {
        label:  `Ayat Minggu Ini (${trackedSunday})`,
        filled: !!khusus.mingguan?.[thisWk]?.reference,
        detail: khusus.mingguan?.[thisWk]?.reference,
      },
    ],
  };

  const ayatBulanTahunSection: ContentSection = {
    id: "ayat-bulantahun", title: "Ayat Bulan & Tahun", icon: Calendar,
    color: "#4f9e8f", href: "/admin/ayat?tab=bulantahun",
    rows: [
      {
        label:  `Bulan ${MONTHS_SHORT[new Date().getMonth()]}`,
        filled: !!khusus.bulan?.[thisM]?.reference,
        detail: khusus.bulan?.[thisM]?.reference,
      },
      {
        label:  `Ayat Tahun ${new Date().getFullYear()}`,
        filled: !!khusus.tahun?.reference,
        detail: khusus.tahun?.reference,
      },
    ],
  };

  // ── All sections ──────────────────────────────────────────────────────────
  const renunganSections = [renunganSection, bacaanSection, mazmurSection, pokdoaSection];
  const ayatSections     = [natsSection, ayatJadwalSection, ayatBulanTahunSection];
  const allSections      = [...renunganSections, ...ayatSections];

  return (
    <div className="flex flex-col gap-3" style={{ animation: "fadeUp 0.5s ease 380ms both" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Status Konten Hari Ini
        </p>
        <LiveDot lastUpdated={lastUpdated} />
      </div>

      {/* Global progress */}
      <GlobalProgress sections={allSections} />

      {/* ── Renungan group ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-1">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--brand)" }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--brand)" }}>
          Renungan
        </p>
        <Link
          href="/admin/renungan"
          className="ml-auto text-[10px] font-semibold hover:opacity-70 transition-opacity"
          style={{ color: "var(--brand)" }}
        >
          Buka halaman →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {renunganSections.map((s, i) => (
          <SectionCard key={s.id} section={s} defaultOpen={i === 0} />
        ))}
      </div>

      {/* ── Ayat group ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--gold)" }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--gold)" }}>
          Ayat
        </p>
        <Link
          href="/admin/ayat"
          className="ml-auto text-[10px] font-semibold hover:opacity-70 transition-opacity"
          style={{ color: "var(--gold)" }}
        >
          Buka halaman →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {ayatSections.map((s) => (
          <SectionCard key={s.id} section={s} />
        ))}
      </div>

    </div>
  );
}