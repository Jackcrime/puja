"use client";

import React from "react";
import { Heart } from "lucide-react";
import { usePokokDoaHarian } from "@/lib/hooks/useFirestoreData";
import { SectionDivider } from "@/components/shared/SectionDivider";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Props {
  selectedDate?: Date;
}

export function PokokDoaSection({ selectedDate }: Props) {
  const { data, loading } = usePokokDoaHarian();

  if (loading) return null;
  if (!data || data.length === 0) return null;

  // Hari ini dalam bahasa Indonesia
  const hariIni = selectedDate
    ? format(selectedDate, "EEEE", { locale: localeId })
    : format(new Date(), "EEEE", { locale: localeId });

  // Sesuaikan kapital
  const hariIniCapital = hariIni.charAt(0).toUpperCase() + hariIni.slice(1);
  const todayEntry = data.find((d) => d.hari === hariIniCapital);

  return (
    <section className="mb-8">
      <SectionDivider label="Pokok Doa Harian" />
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
      </div>
    </div>
    </section>
  );
}
