"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { VerseCard } from "@/components/ui/VerseCard";
import type { AyatKhusus } from "@/lib/hooks/useFirestoreData";

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

interface Props {
  khusus: AyatKhusus;
}

export function AyatTuntunanSection({ khusus }: Props) {
  const [bulanOpen, setBulanOpen] = useState(false);
  const currentMonth = new Date().getMonth() + 1;
  const ayatBulanIni = khusus.bulan?.[String(currentMonth)];

  return (
    <section className="mb-10">
      <div className="flex flex-col gap-4">
        {/* Ayat Tahun */}
        {khusus.tahun && (
          <VerseCard
            reference={khusus.tahun.reference}
            text={khusus.tahun.text}
            label={`AYAT TAHUN ${khusus.tahun.year}`}
            bookTitle={khusus.tahun.reference.split(" ").slice(0, -1).join(" ")}
            accentColor="brand"
            showPerikop
            noPerikop
          />
        )}

        {/* Ayat Bulan + Minggu berdampingan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ayatBulanIni && (
            <VerseCard
              reference={ayatBulanIni.reference}
              text={ayatBulanIni.text}
              label={`AYAT BULAN ${BULAN[currentMonth - 1].toUpperCase()}`}
              bookTitle={ayatBulanIni.reference.split(" ").slice(0, -1).join(" ")}
              accentColor="gold"
              showPerikop
              noPerikop
            />
          )}
          {khusus.minggu && (
            <VerseCard
              reference={khusus.minggu.reference}
              text={khusus.minggu.text}
              label="AYAT MINGGU"
              bookTitle={khusus.minggu.reference.split(" ").slice(0, -1).join(" ")}
              date={khusus.minggu.date}
              accentColor="brand"
              showPerikop
              noPerikop
            />
          )}
        </div>

        {/* Accordion: Semua Ayat Bulanan */}
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setBulanOpen(!bulanOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                Daftar Ayat Bulanan {khusus.tahun?.year}
              </span>
            </div>
            {bulanOpen
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {bulanOpen && (
            <div className="border-t border-border divide-y divide-border">
              {BULAN.map((nama, i) => {
                const b = khusus.bulan?.[String(i + 1)];
                const isThisMonth = i + 1 === currentMonth;
                return (
                  <div
                    key={i}
                    className="px-4 py-3 flex gap-3"
                    style={isThisMonth ? { backgroundColor: "var(--brand-muted)" } : {}}
                  >
                    <div className="w-24 shrink-0">
                      <span
                        className="text-xs font-bold"
                        style={{ color: isThisMonth ? "var(--brand)" : "var(--muted-foreground)" }}
                      >
                        {nama}
                        {isThisMonth && (
                          <span className="ml-1 text-[9px] px-1 rounded" style={{ color: "var(--brand)", backgroundColor: "var(--brand-muted)" }}>
                            Ini
                          </span>
                        )}
                      </span>
                    </div>
                    {b ? (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "var(--brand)" }}>{b.reference}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.text}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
