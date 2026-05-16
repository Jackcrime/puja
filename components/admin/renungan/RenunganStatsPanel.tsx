"use client";

import React, { useState } from "react";
import {
  useDevotional,
  useMazmurMinggu,
  useBahanKhotbah,
  usePokokDoaHarian,
  useAuthors,
  useAyatKhusus,
} from "@/lib/hooks/useFirestoreData";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  Music,
  BookMarked,
  HandHeart,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface StatRow {
  label:   string;
  filled:  boolean;
  detail?: string;
}

interface StatGroup {
  id:    string;
  title: string;
  icon:  React.ElementType;
  rows:  StatRow[];
}

function CollapsibleStatBlock({ group }: { group: StatGroup }) {
  const [open, setOpen] = useState(false);
  const Icon   = group.icon;
  const filled = group.rows.filter((r) => r.filled).length;
  const total  = group.rows.length;
  const allOk  = filled === total;
  const someOk = filled > 0 && !allOk;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--brand)" }}>
            {group.title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {group.rows.map((r, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: r.filled ? "#22c55e" : "#f87171" }}
              />
            ))}
          </div>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
            style={{
              backgroundColor: allOk ? "#dcfce7" : someOk ? "#fef9c3" : "#fee2e2",
              color:           allOk ? "#16a34a" : someOk ? "#854d0e" : "#dc2626",
            }}
          >
            {filled}/{total}
          </span>
          {open
            ? <ChevronUp   className="h-3 w-3 text-muted-foreground ml-0.5" />
            : <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {group.rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 gap-2">
              <span className="text-[11px] text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-1 min-w-0">
                {row.filled
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  : <XCircle      className="h-3.5 w-3.5 text-red-400 shrink-0"   />}
                {row.detail && (
                  <span
                    className="text-[10px] truncate max-w-[90px]"
                    style={{ color: row.filled ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                  >
                    {row.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RenunganStatsPanel() {
  const { data: dev,     loading: devLoad  } = useDevotional();
  const { data: mazmur,  loading: mazLoad  } = useMazmurMinggu();
  const { data: khotbah, loading: kotLoad  } = useBahanKhotbah();
  const { data: pokdoa,  loading: pokLoad  } = usePokokDoaHarian();
  const { data: authors, loading: authLoad } = useAuthors();
  const { data: khusus,  loading: khusLoad } = useAyatKhusus();

  const loading = devLoad || mazLoad || kotLoad || pokLoad || authLoad || khusLoad;

  const authorName = (() => {
    if (!dev.authorCode || authLoad) return undefined;
    const a = (authors as any)[dev.authorCode];
    return a ? `${a.title ? a.title + " " : ""}${a.name}` : dev.authorCode;
  })();

  const renunganGroup: StatGroup = {
    id: "renungan", title: "Renungan Harian", icon: BookOpen,
    rows: [
      { label: "Judul",       filled: !!dev.title?.trim(),      detail: dev.title?.slice(0, 18) },
      { label: "Penulis",     filled: !!dev.authorCode?.trim(), detail: authorName },
      { label: "Isi",         filled: !!dev.body?.trim(),       detail: dev.body?.trim() ? `${dev.body.split(" ").length} kata` : undefined },
      { label: "Doa Penutup", filled: !!dev.prayer?.trim(),     detail: dev.prayer?.trim() ? `${dev.prayer.split(" ").length} kata` : undefined },
      { label: "Audio",       filled: !!dev.audioUrl?.trim(),   detail: dev.audioUrl?.trim() ? "Terupload" : undefined },
    ],
  };

  const mazmurGroup: StatGroup = {
    id: "mazmur", title: "Mazmur Minggu", icon: Music,
    rows: [
      { label: "Referensi", filled: !!mazmur.reference?.trim(), detail: mazmur.reference },
      { label: "Judul",     filled: !!mazmur.title?.trim(),     detail: mazmur.title?.slice(0, 20) },
      { label: "Ayat-ayat", filled: (mazmur.verses?.length ?? 0) > 0, detail: mazmur.verses?.length ? `${mazmur.verses.length} ayat` : undefined },
    ],
  };

  const poinOk = (khotbah.poinUtama?.length ?? 0) > 0 &&
    khotbah.poinUtama?.every((p) => p.judul?.trim() && p.isi?.trim());

  const khotbahGroup: StatGroup = {
    id: "khotbah", title: "Bahan Khotbah", icon: BookMarked,
    rows: [
      { label: "Referensi",   filled: !!khotbah.reference?.trim(),    detail: khotbah.reference },
      { label: "Tema",        filled: !!khotbah.thema?.trim(),         detail: khotbah.thema?.slice(0, 20) },
      { label: "Pendahuluan", filled: !!khotbah.pendahuluan?.trim() },
      { label: "Poin Utama",  filled: !!poinOk, detail: poinOk ? `${khotbah.poinUtama.length} poin` : undefined },
      { label: "Penutup",     filled: !!khotbah.penutup?.trim() },
    ],
  };

  const HARI = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const pokdoaGroup: StatGroup = {
    id: "pokdoa", title: "Pokok Doa", icon: HandHeart,
    rows: HARI.map((hari) => {
      const entry = pokdoa.find((d) => d.hari === hari);
      return { label: hari, filled: !!(entry?.topik?.trim()), detail: entry?.topik?.slice(0, 16) };
    }),
  };

  const todayKey   = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "d MMM", { locale: localeId });
  const khususGroup: StatGroup = {
    id: "khusus", title: "Ayat Khusus", icon: Star,
    rows: [
      { label: "Ayat Minggu",               filled: !!(khusus?.minggu?.reference?.trim()),             detail: khusus?.minggu?.reference },
      { label: `Hari ini (${todayLabel})`,  filled: !!(khusus?.harian?.[todayKey]?.reference?.trim()), detail: khusus?.harian?.[todayKey]?.reference },
    ],
  };

  const allGroups = [renunganGroup, mazmurGroup, khotbahGroup, pokdoaGroup, khususGroup];
  const totalRows = allGroups.reduce((s, g) => s + g.rows.length, 0);
  const totalFill = allGroups.reduce((s, g) => s + g.rows.filter((r) => r.filled).length, 0);
  const pct       = Math.round((totalFill / totalRows) * 100);
  const now       = format(new Date(), "HH:mm", { locale: localeId });

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>
          Statistik Konten
        </p>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[10px] text-muted-foreground">Live · {now}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground">Kelengkapan keseluruhan</span>
          <span className="text-xs font-bold" style={{ color: pct === 100 ? "#16a34a" : "var(--brand)" }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#16a34a" : "var(--brand)" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {totalFill}/{totalRows} field terisi · klik grup untuk detail
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-muted-foreground text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...
        </div>
      ) : (
        allGroups.map((group) => (
          <CollapsibleStatBlock key={group.id} group={group} />
        ))
      )}
    </div>
  );
}
