"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, getDaysInMonth, getDay,
  isSameDay, isToday, addMonths, subMonths, setMonth, setYear, getMonth, getYear,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getEventsForMonth } from "@/lib/utils/liturgicalCalendar";

type View = "day" | "month" | "year";

const DAYS_SHORT  = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS_FULL = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

// Generate year range: 10 years before/after selected
function getYearRange(centerYear: number) {
  const start = centerYear - 12;
  const end   = centerYear + 12;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

interface Props {
  selected: Date;
  onSelect: (d: Date) => void;
}

export function DatePickerCalendar({ selected, onSelect }: Props) {
  const [view,   setView]   = useState<View>("day");
  const [cursor, setCursor] = useState(() => startOfMonth(selected));
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const [hoveredEvents, setHoveredEvents] = useState<{ day: number; names: string[] } | null>(null);

  const cursorYear  = getYear(cursor);
  const cursorMonth = getMonth(cursor);
  const years = getYearRange(cursorYear);

  // Hitung hari raya di bulan yang sedang ditampilkan
  const eventMap = useMemo(
    () => getEventsForMonth(cursorYear, cursorMonth),
    [cursorYear, cursorMonth]
  );

  // Scroll active year into view when year panel opens
  useEffect(() => {
    if (view === "year" && yearScrollRef.current) {
      const activeEl = yearScrollRef.current.querySelector("[data-active='true']") as HTMLElement;
      activeEl?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [view]);

  // ── Day grid helpers ──────────────────────────────────────────────────────
  const firstDayOfWeek = getDay(cursor);           // 0=Sun
  const daysInMonth    = getDaysInMonth(cursor);
  const totalCells     = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  function handleDayClick(dayNum: number) {
    const picked = new Date(cursorYear, cursorMonth, dayNum);
    onSelect(picked);
  }

  function handlePrevMonth() { setCursor((c) => subMonths(c, 1)); }
  function handleNextMonth() { setCursor((c) => addMonths(c, 1)); }

  function handleMonthSelect(monthIdx: number) {
    setCursor((c) => startOfMonth(setMonth(c, monthIdx)));
    setView("day");
  }

  function handleYearSelect(year: number) {
    setCursor((c) => startOfMonth(setYear(c, year)));
    setView("month");
  }

  // ── Shared token ─────────────────────────────────────────────────────────
  const brand      = "var(--brand)";
  const brandMuted = "var(--brand-muted)";
  const gold       = "var(--gold)";

  return (
    <div className="w-full select-none" style={{ fontFamily: "inherit" }}>

      {/* ── Navigation header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 mb-4">
        {view === "day" && (
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <div className={`flex items-center gap-1.5 ${view === "day" ? "mx-auto" : "mx-auto"}`}>
          {/* Month button */}
          <button
            onClick={() => setView(view === "month" ? "day" : "month")}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold transition-colors hover:bg-muted"
            style={{ color: view === "month" ? brand : "var(--foreground)" }}
          >
            {MONTHS_FULL[cursorMonth]}
          </button>

          {/* Year button */}
          <button
            onClick={() => setView(view === "year" ? "day" : "year")}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold transition-colors hover:bg-muted"
            style={{ color: view === "year" ? brand : "var(--foreground)" }}
          >
            {cursorYear}
          </button>
        </div>

        {view === "day" && (
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Day view ──────────────────────────────────────────────────────── */}
      {view === "day" && (
        <>
           {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS_SHORT.map((d, i) => (
                <div
                    key={d}
                    className="text-center text-[10px] font-bold uppercase tracking-wider py-1"
                    style={{ color: i === 0 ? brand : "var(--muted-foreground)" }}
                >
                    {d}
                </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: totalCells }, (_, i) => {
                    const dayNum = i - firstDayOfWeek + 1;
                    const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                    const thisDate = isValid ? new Date(cursorYear, cursorMonth, dayNum) : null;
                    const isSel = thisDate ? isSameDay(thisDate, selected) : false;
                    const isTdy = thisDate ? isToday(thisDate) : false;
                    const isSun = i % 7 === 0;

                    const dayEvents = isValid ? (eventMap.get(dayNum) ?? []) : [];
                    const hasGlobal = dayEvents.some(e => e.category === "global" || !e.category);
                    const hasGKPB = dayEvents.some(e => e.category === "gkpb");

                    return (
                    <div key={i} className="relative flex flex-col items-center group">
                        <button
                        disabled={!isValid}
                        onClick={() => isValid && handleDayClick(dayNum)}
                        onMouseEnter={() => {
                            if (isValid && dayEvents.length > 0) {
                            setHoveredEvents({
                                day: dayNum,
                                names: dayEvents.map(e => `${e.emoji} ${e.name}`),
                            });
                            }
                        }}
                        onMouseLeave={() => setHoveredEvents(null)}
                        className={`
                            relative h-9 w-full rounded-lg text-sm font-medium 
                            flex items-center justify-center disabled:pointer-events-none
                            transition-all border border-transparent
                            ${isSel 
                            ? "bg-[var(--brand)] text-white font-bold shadow-md" 
                            : isTdy 
                            ? "bg-[var(--brand-muted)] text-[var(--brand)] font-bold" 
                            : "hover:bg-[#2a2a2a] dark:hover:bg-[#363636] hover:border-zinc-600"
                            }
                        `}
                        >
                        {isValid && (
                            <span className={isSun && !isTdy && !isSel ? "text-[var(--brand)]" : ""}>
                            {dayNum}
                            </span>
                        )}

                        {/* Today dot */}
                        {isTdy && !isSel && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--brand)]" />
                        )}

                        {/* Event dots */}
                        {isValid && dayEvents.length > 0 && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {hasGlobal && <span className="w-1 h-1 rounded-full bg-violet-500" />}
                            {hasGKPB && <span className="w-1 h-1 rounded-full bg-teal-600" />}
                            </span>
                        )}
                        </button>

                        {/* Tooltip */}
                        {hoveredEvents?.day === dayNum && dayEvents.length > 0 && (
                        <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 
                                        w-max max-w-[200px] rounded-lg px-3 py-2 text-[11px] 
                                        leading-tight shadow-xl border text-left pointer-events-none">
                            {hoveredEvents.names.map((n, idx) => (
                            <div key={idx} className="py-0.5">{n}</div>
                            ))}
                        </div>
                        )}
                    </div>
                    );
                })}
            </div>
        </>
      )}

      {/* ── Month view ────────────────────────────────────────────────────── */}
      {view === "month" && (
        <div className="grid grid-cols-3 gap-2 py-1">
          {MONTHS_FULL.map((name, idx) => {
            const isActive  = idx === cursorMonth;
            const isSelMon  = idx === getMonth(selected) && cursorYear === getYear(selected);
            return (
              <button
                key={name}
                onClick={() => handleMonthSelect(idx)}
                className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={
                  isActive
                    ? { backgroundColor: brand, color: "#fff" }
                    : isSelMon
                    ? { backgroundColor: brandMuted, color: brand }
                    : { color: "var(--foreground)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--muted)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor = isSelMon ? brandMuted : "";
                }}
              >
                {MONTHS_SHORT[idx]}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Year view ─────────────────────────────────────────────────────── */}
      {view === "year" && (
        <div
          ref={yearScrollRef}
          className="max-h-52 overflow-y-auto grid grid-cols-4 gap-1.5 py-1 pr-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {years.map((yr) => {
            const isActive = yr === cursorYear;
            const isSel    = yr === getYear(selected);
            return (
              <button
                key={yr}
                data-active={isActive ? "true" : undefined}
                onClick={() => handleYearSelect(yr)}
                className="py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  isActive
                    ? { backgroundColor: brand, color: "#fff" }
                    : isSel
                    ? { backgroundColor: brandMuted, color: brand }
                    : { color: "var(--foreground)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--muted)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.backgroundColor = isSel ? brandMuted : "";
                }}
              >
                {yr}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Legend hari raya ──────────────────────────────────────────────── */}
      {view === "day" && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7c3aed" }} />
            <span className="text-[10px] font-semibold" style={{ color: "var(--muted-foreground)" }}>
              Hari Raya Kristen
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0f766e" }} />
            <span className="text-[10px] font-semibold" style={{ color: "var(--muted-foreground)" }}>
              Kalender GKPB
            </span>
          </div>
        </div>
      )}

      {/* ── Footer: back hint on month/year view ──────────────────────────── */}
      {view !== "day" && (
        <div className="mt-3 pt-3 border-t border-border flex justify-center">
          <button
            onClick={() => setView("day")}
            className="text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--muted-foreground)" }}
          >
            ← Kembali ke kalender
          </button>
        </div>
      )}
    </div>
  );
}