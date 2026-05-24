"use client";

import React, { useRef, useEffect, useState } from "react";
import { Star, Users, Library, BookOpen, Church } from "lucide-react";

interface StatCardProps {
  label:  string;
  value:  number | "…";
  icon:   React.ElementType;
  accent: string;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, accent, delay = 0 }: StatCardProps) {
  const prevRef  = useRef<number | "…">(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    // Flash animation when value changes (and it's a real number change)
    if (prevRef.current !== value && value !== "…" && prevRef.current !== "…") {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-5 overflow-hidden group hover:border-opacity-70 transition-all duration-200"
      style={{
        animation: `fadeUp 0.5s ease ${delay}ms both`,
        outline: flash ? `2px solid ${accent}` : "2px solid transparent",
        outlineOffset: "0px",
        transition: "outline 0.15s ease",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top right, ${accent}08 0%, transparent 70%)` }}
      />
      {/* Flash overlay */}
      {flash && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ backgroundColor: `${accent}10`, transition: "opacity 0.7s ease" }}
        />
      )}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}14` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: accent, opacity: flash ? 1 : 0.4, transition: "opacity 0.3s" }} />
      </div>
      <p
        className="text-3xl font-bold leading-none mb-1.5 tabular-nums"
        style={{ color: accent, fontFamily: "var(--font-serif)" }}
      >
        {value === "…" ? (
          <span className="inline-block w-10 h-7 bg-muted rounded animate-pulse align-middle" />
        ) : value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

interface Props {
  totalAyat:       number | "…";
  totalAuthors:    number | "…";
  totalPustaka:    number | "…";
  totalReadings:   number | "…";
  totalMinistries: number | "…";
}

export function DashboardStats({ totalAyat, totalAuthors, totalPustaka, totalReadings, totalMinistries }: Props) {
  const stats = [
    { label: "Ayat Kategori",   value: totalAyat,        icon: Star,    accent: "var(--gold)"  },
    { label: "Penulis",         value: totalAuthors,     icon: Users,   accent: "var(--brand)" },
    { label: "Pustaka Digital", value: totalPustaka,     icon: Library, accent: "var(--gold)"  },
    { label: "Bacaan",          value: totalReadings,    icon: BookOpen,accent: "var(--brand)" },
    { label: "Unit Pelayanan",  value: totalMinistries,  icon: Church,  accent: "var(--gold)"  },
  ];

  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3 flex items-center gap-2">
        Ringkasan Konten
        <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "var(--brand)", opacity: 0.7 }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: "var(--brand)" }} />
          LIVE
        </span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={i * 55} />
        ))}
      </div>
    </>
  );
}