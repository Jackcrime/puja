"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfMonth, getDaysInMonth, getDay,
  isSameDay, isToday, addMonths, subMonths, setMonth, setYear, getMonth, getYear,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getEventsForMonth, type LiturgicalEvent } from "@/lib/utils/liturgicalCalendar";

type View = "day" | "month" | "year";

const DAYS_SHORT  = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS_FULL = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

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
  const [view,          setView]         = useState<View>("day");
  const [cursor,        setCursor]        = useState(() => startOfMonth(selected));
  const [hoveredEvent,  setHoveredEvent]  = useState<{ events: LiturgicalEvent[]; day: number } | null>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  const cursorYear  = getYear(cursor);
  const cursorMonth = getMonth(cursor);
  const years       = getYearRange(cursorYear);

  // Pre-compute events for the whole month (cheap, no re-fetch)
  const monthEvents = getEventsForMonth(cursorYear, cursorMonth);

  useEffect(() => {
    if (view === "year" && yearScrollRef.current) {
      const activeEl = yearScrollRef.current.querySelector("[data-active='true']") as HTMLElement;
      activeEl?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [view]);

  // ── Day grid helpers ──────────────────────────────────────────────────────
  const firstDayOfWeek = getDay(cursor);
  const daysInMonth    = getDaysInMonth(cursor);
  const totalCells     = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  function handleDayClick(dayNum: number) {
    const picked = new Date(cursorYear, cursorMonth, dayNum);
    onSelect(picked);
  }

  function handlePrevMonth() { setCursor((c) => subMonths(c, 1)); setHoveredEvent(null); }
  function handleNextMonth() { setCursor((c) => addMonths(c, 1)); setHoveredEvent(null); }

  function handleMonthSelect(monthIdx: number) {
    setCursor((c) => startOfMonth(setMonth(c, monthIdx)));
    setView("day");
  }

  function handleYearSelect(year: number) {
    setCursor((c) => startOfMonth(setYear(c, year)));
    setView("month");
  }

  const brand      = "var(--brand)";
  const brandMuted = "var(--brand-muted)";

  return (
    <div className="w-full select-none relative" style={{ fontFamily: "inherit" }}>

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

        <div className="flex items-center gap-1.5 mx-auto">
          <button
            onClick={() => setView(view === "month" ? "day" : "month")}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold transition-colors hover:bg-muted"
            style={{ color: view === "month" ? brand : "var(--foreground)" }}
          >
            {MONTHS_FULL[cursorMonth]}
          </button>
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

          {/* Event tooltip — rendered OUTSIDE the grid to avoid clip */}
          <div className="relative">
            {hoveredEvent && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full z-50 pointer-events-none mb-1"
                style={{ marginTop: "-4px" }}
              >
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white whitespace-nowrap shadow-lg"
                  style={{ backgroundColor: hoveredEvent.events[0].color }}
                >
                  <span>{hoveredEvent.events[0].emoji}</span>
                  <span>{hoveredEvent.events[0].name}</span>
                </div>
              </div>
            )}

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: totalCells }, (_, i) => {
                const dayNum   = i - firstDayOfWeek + 1;
                const isValid  = dayNum >= 1 && dayNum <= daysInMonth;
                const thisDate = isValid ? new Date(cursorYear, cursorMonth, dayNum) : null;
                const isSel    = thisDate ? isSameDay(thisDate, selected) : false;
                const isTdy    = thisDate ? isToday(thisDate) : false;
                const isSun    = i % 7 === 0;
                const events   = isValid ? (monthEvents.get(dayNum) ?? []) : [];
                const hasEvent = events.length > 0;

                return (
                  <button
                    key={i}
                    disabled={!isValid}
                    onClick={() => isValid && handleDayClick(dayNum)}
                    onMouseEnter={() => {
                      if (hasEvent) setHoveredEvent({ events, day: dayNum });
                    }}
                    onMouseLeave={() => setHoveredEvent(null)}
                    className="relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-sm font-medium transition-all disabled:pointer-events-none"
                    style={
                      isSel
                        ? { backgroundColor: brand, color: "#fff", fontWeight: 700 }
                        : isTdy
                        ? { backgroundColor: brandMuted, color: brand, fontWeight: 700 }
                        : {}
                    }
                    onMouseOver={(e) => {
                      if (!isSel && isValid) (e.currentTarget as HTMLElement).style.backgroundColor = "var(--muted)";
                    }}
                    onMouseOut={(e) => {
                      if (!isSel && isValid) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = isTdy ? brandMuted : "";
                      }
                    }}
                  >
                    {isValid && (
                      <span style={{ color: isSel ? "#fff" : isSun && !isTdy ? brand : undefined }}>
                        {dayNum}
                      </span>
                    )}

                    {/* Dot indicators */}
                    {isValid && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {isTdy && !isSel && (
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: brand }} />
                        )}
                        {hasEvent && (
                          <span
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: isSel ? "rgba(255,255,255,0.8)" : events[0].color }}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brand }} />
              <span className="text-[10px] text-muted-foreground font-medium">Hari Raya Kristen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground font-medium">Kalender GKPB</span>
            </div>
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