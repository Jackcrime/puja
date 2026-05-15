"use client";

import React from "react";
import { Heart } from "lucide-react";
import { usePokokDoaHarian } from "@/lib/hooks/useFirestoreData";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Props {
  selectedDate?: Date;
}

const HARI_ORDER = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

export function PokokDoaSection({ selectedDate }: Props) {
  const { data, loading } = usePokokDoaHarian();

  if (loading) return null;

  // Hari ini dalam bahasa Indonesia
  const hariIni = selectedDate
    ? format(selectedDate, "EEEE", { locale: localeId })
    : format(new Date(), "EEEE", { locale: localeId });

  // Sesuaikan kapital
  const hariIniCapital = hariIni.charAt(0).toUpperCase() + hariIni.slice(1);
  const todayEntry = data.find((d) => d.hari === hariIniCapital);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            Pokok Doa Harian
          </p>
        </div>

        {/* Today highlight */}
        {todayEntry && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: "var(--brand-muted)" }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: "var(--brand)" }}
              >
                Hari ini — {todayEntry.hari}
              </span>
            </div>
            <p className="font-serif font-bold text-sm mb-1" style={{ color: "var(--brand)" }}>
              {todayEntry.topik}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{todayEntry.detail}</p>
          </div>
        )}

        {/* Weekly grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HARI_ORDER.map((hari) => {
            const entry    = data.find((d) => d.hari === hari);
            const isToday  = hari === hariIniCapital;
            if (!entry) return null;
            return (
              <div
                key={hari}
                className="flex gap-3 px-3 py-2.5 rounded-lg border transition-colors"
                style={{
                  borderColor: isToday ? "var(--brand)" : "var(--border)",
                  backgroundColor: isToday ? "var(--brand-muted)" : "transparent",
                }}
              >
                <p
                  className="text-xs font-bold w-14 shrink-0 pt-0.5"
                  style={{ color: isToday ? "var(--brand)" : "var(--muted-foreground)" }}
                >
                  {hari}
                </p>
                <p
                  className="text-xs font-medium leading-snug"
                  style={{ color: isToday ? "var(--brand)" : "var(--foreground)" }}
                >
                  {entry.topik}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
