"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAnnouncement } from "@/lib/hooks/useFirestoreData";
import { getLiturgicalEvents, getLiturgicalSeason, getEventsForMonth } from "@/lib/utils/liturgicalCalendar";
import {
  Megaphone, Save, Check, Loader2, CalendarDays, ChevronLeft, ChevronRight,
  Sparkles, RefreshCw, Star, Flame, BookOpen, Bell,
} from "lucide-react";
import { showToast } from "@/lib/utils/toast";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Lucide icon berdasarkan emoji
function EventIcon({ emoji, color }: { emoji: string; color: string }) {
  const cls = "h-3.5 w-3.5 shrink-0";
  const style = { color };
  if (emoji === "🔥") return <Flame className={cls} style={style} />;
  if (emoji === "⭐" || emoji === "🔺") return <Star className={cls} style={style} />;
  if (emoji === "📖") return <BookOpen className={cls} style={style} />;
  return <Bell className={cls} style={style} />;
}

// Color accent untuk event
const SEASON_ACCENT: Record<string, { bg: string; border: string; text: string }> = {
  "#7c3aed": { bg: "#f5f3ff", border: "#c4b5fd", text: "#5b21b6" },
  "#16a34a": { bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
  "#dc2626": { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c" },
  "#d97706": { bg: "#fffbeb", border: "#fcd34d", text: "#b45309" },
  "#f59e0b": { bg: "#fffbeb", border: "#fcd34d", text: "#b45309" },
  "#6b7280": { bg: "#f9fafb", border: "#d1d5db", text: "#374151" },
  "#1f2937": { bg: "#f3f4f6", border: "#9ca3af", text: "#111827" },
  "#374151": { bg: "#f3f4f6", border: "#9ca3af", text: "#111827" },
};
function getAccent(color: string) {
  return SEASON_ACCENT[color] ?? { bg: "var(--brand-muted)", border: "var(--brand-border)", text: "var(--brand)" };
}

// ─── Liturgical Calendar Panel ─────────────────────────────────────────────────
interface CalendarPanelProps { onSelectGreeting?: (text: string) => void; }

function LiturgicalCalendarPanel({ onSelectGreeting }: CalendarPanelProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthEvents    = getEventsForMonth(year, month);
  const selectedEvents = getLiturgicalEvents(selected);
  const selectedSeason = getLiturgicalSeason(selected);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: selectedSeason.color }} />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: "var(--gold)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            Referensi Hari Raya Liturgi
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <p className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
            {format(viewDate, "MMMM yyyy", { locale: localeId })}
          </p>
          <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div>
          <div className="grid grid-cols-7 mb-1">
            {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const cellDate = new Date(year, month, day);
              const hasEvent = monthEvents.has(day);
              const isToday  = isSameDay(cellDate, new Date());
              const isSel    = isSameDay(cellDate, selected);
              const evColor  = hasEvent ? monthEvents.get(day)![0].color : undefined;
              const accent   = evColor ? getAccent(evColor) : null;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(cellDate)}
                  className={`relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-xs font-medium transition-all ${
                    isSel ? "text-white shadow-sm" : "hover:bg-muted"
                  }`}
                  style={
                    isSel
                      ? { backgroundColor: evColor ?? "var(--brand)" }
                      : hasEvent && accent
                      ? { backgroundColor: accent.bg }
                      : undefined
                  }
                >
                  <span style={!isSel && hasEvent && evColor ? { color: evColor, fontWeight: 700 } : undefined}>
                    {day}
                  </span>
                  {hasEvent && !isSel && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ backgroundColor: evColor }} />
                  )}
                  {isToday && !isSel && (
                    <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{selectedSeason.emoji}</span>
            <p className="text-xs text-muted-foreground">
              {format(selected, "d MMMM yyyy", { locale: localeId })} —{" "}
              <span className="font-semibold" style={{ color: selectedSeason.color }}>{selectedSeason.name}</span>
            </p>
          </div>
          {selectedEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => {
                const accent = getAccent(ev.color);
                const tanggal = format(selected, "d MMMM yyyy", { locale: localeId });
                return (
                  <div
                    key={i}
                    className="rounded-xl px-3 py-2.5 border text-xs space-y-1.5"
                    style={{ backgroundColor: accent.bg, borderColor: accent.border }}
                  >
                    <div className="flex items-center gap-1.5">
                      <EventIcon emoji={ev.emoji} color={ev.color} />
                      <p className="font-bold" style={{ color: accent.text }}>{ev.name}</p>
                    </div>
                    <p className="leading-relaxed" style={{ color: accent.text, opacity: 0.85 }}>{ev.greeting}</p>
                    {onSelectGreeting && (
                      <button
                        onClick={() => onSelectGreeting(`${tanggal} — ${ev.name}: ${ev.greeting}`)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-1 rounded-lg transition-colors text-white"
                        style={{ backgroundColor: ev.color }}
                      >
                        <Sparkles className="h-3 w-3" /> Gunakan sebagai pengumuman
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Tidak ada hari raya liturgi pada tanggal ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminPengumuman() {
  const { data, loading, update } = useAnnouncement();
  const [text,        setText]        = useState("");
  const [link,        setLink]        = useState("");
  const [saved,       setSaved]       = useState(false);
  const [saving,      setSaving]      = useState(false);
  // Inisialisasi form hanya sekali saat data pertama kali dimuat
  const [initialized, setInitialized] = useState(false);

  React.useEffect(() => {
    if (!loading && !initialized) {
      setText(data.text);
      setLink(data.link);
      setInitialized(true);
    }
  }, [loading, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAutoGreeting = (greeting: string) => {
    setText(greeting);
    showToast.success("Teks pengumuman diisi dari hari raya liturgi!");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Kirim HANYA text dan link yang baru — yang lama otomatis digantikan sepenuhnya
      await update({ text, link });
      showToast.success("Pengumuman berhasil disimpan. Pengumuman lama sudah digantikan.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      showToast.error("Gagal menyimpan pengumuman. Coba lagi.");
    }
    setSaving(false);
  };

  return (
    <AdminGuard>
      <AdminLayout title="Pengumuman">
        <div className="max-w-2xl space-y-6">
          {loading ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
            </div>
          ) : (
            <>
              {/* ── Form Banner ─────────────────────────────────────────── */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="h-4 w-4" style={{ color: "var(--gold)" }} />
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Banner Pengumuman</p>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">Live Firestore</span>
                  </div>

                  {/* Pengumuman aktif di Firestore */}
                  {data.text && (
                    <div className="rounded-xl px-3 py-2.5 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-amber-700 dark:text-amber-400">
                        Pengumuman Aktif Sekarang
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{data.text}</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
                        ↓ Isi form di bawah dan klik Simpan untuk menggantikan pengumuman ini sepenuhnya.
                      </p>
                    </div>
                  )}

                  {/* Live preview */}
                  <div className="rounded-xl px-4 py-2.5 text-white text-sm flex items-center gap-2" style={{ backgroundColor: "var(--brand)" }}>
                    <Megaphone className="h-3.5 w-3.5 opacity-80 shrink-0" />
                    <span className="truncate">{text || "Teks pengumuman..."}</span>
                  </div>

                  {/* Form — single unified form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                        Teks Pengumuman *
                        <span className="ml-1 font-normal text-muted-foreground normal-case tracking-normal">
                          — tanggal + ucapan bisa digabung langsung
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="mis. 25 Desember 2025 — Selamat Natal! Kiranya damai Kristus menyertai kita semua."
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Klik tombol <span className="font-semibold">Gunakan sebagai pengumuman</span> di kalender di bawah untuk auto-isi dari hari raya liturgi.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                        Link Tujuan <span className="font-normal text-muted-foreground normal-case tracking-normal">(opsional)</span>
                      </label>
                      <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/tentang"
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
                    >
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                        : saved ? <><Check className="h-4 w-4" /> Tersimpan!</>
                        : <><Save className="h-4 w-4" /> Simpan ke Firestore</>}
                    </button>
                    <button
                      onClick={() => { setText(""); setLink(""); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" /> Reset Form
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Kalender Liturgi ───────────────────────────────────── */}
              <LiturgicalCalendarPanel onSelectGreeting={handleAutoGreeting} />
            </>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
