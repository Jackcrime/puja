"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAnnouncement } from "@/lib/hooks/useFirestoreData";
import { getLiturgicalEvents, getLiturgicalSeason, getEventsForMonth } from "@/lib/utils/liturgicalCalendar";
import { Megaphone, Save, Check, Loader2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { showToast } from "@/lib/utils/toast";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";

function LiturgicalCalendarPanel() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthEvents = getEventsForMonth(year, month);
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
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--gold)" }} />
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
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const cellDate = new Date(year, month, day);
              const hasEvent = monthEvents.has(day);
              const isToday  = isSameDay(cellDate, new Date());
              const isSel    = isSameDay(cellDate, selected);
              const evColor  = hasEvent ? monthEvents.get(day)![0].color : undefined;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(cellDate)}
                  className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-colors ${isSel ? "text-white" : isToday ? "font-bold" : "hover:bg-muted"}`}
                  style={isSel ? { backgroundColor: evColor ?? "var(--brand)" } : undefined}
                >
                  <span style={!isSel && hasEvent ? { color: evColor } : undefined}>{day}</span>
                  {hasEvent && !isSel && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: evColor }} />
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
              {selectedEvents.map((ev, i) => (
                <div key={i} className="rounded-lg px-3 py-2.5 text-white text-xs" style={{ backgroundColor: ev.color }}>
                  <p className="font-bold mb-0.5">{ev.emoji} {ev.name}</p>
                  <p className="opacity-90 leading-relaxed">{ev.greeting}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Tidak ada hari raya liturgi pada tanggal ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPengumuman() {
  const { data, loading, update } = useAnnouncement();
  const [text, setText]     = useState("");
  const [link, setLink]     = useState("");
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!loading) { setText(data.text); setLink(data.link); }
  }, [loading, data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({ text, link });
      showToast.success("Pengumuman berhasil disimpan.");
    } catch {
      showToast.error("Gagal menyimpan pengumuman. Coba lagi.");
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
              {/* Form banner */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="h-4 w-4" style={{ color: "var(--gold)" }} />
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Banner Pengumuman</p>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">Live Firestore</span>
                  </div>

                  <div className="rounded-xl px-4 py-2.5 text-white text-sm flex items-center gap-2" style={{ backgroundColor: "var(--brand)" }}>
                    <Megaphone className="h-3.5 w-3.5 opacity-80 shrink-0" />
                    <span className="truncate">{text || "Teks pengumuman..."}</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Teks Pengumuman *</label>
                      <input type="text" value={text} onChange={(e) => setText(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Link Tujuan</label>
                      <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/tentang"
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
                      />
                    </div>
                  </div>

                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
                  >
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                      : saved ? <><Check className="h-4 w-4" /> Tersimpan ke Firestore!</>
                      : <><Save className="h-4 w-4" /> Simpan ke Firestore</>}
                  </button>
                </div>
              </div>

              {/* Kalender liturgi referensi */}
              <LiturgicalCalendarPanel />
            </>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}