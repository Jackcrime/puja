"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DailyVisit {
  date:  string;
  count: number;
  hours: Record<string, number>;  // "00"–"23" → count
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return dateKey(d);
  });
}

export function shortDay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" });
}

export function peakHour(hours: Record<string, number>): string | null {
  const entries = Object.entries(hours);
  if (entries.length === 0) return null;
  const peak = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  return `${peak[0]}:00`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVisitStats(days = 7) {
  const [data,    setData]    = useState<DailyVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const keys = lastNDays(days);
    const result: Record<string, DailyVisit> = {};
    keys.forEach((k) => { result[k] = { date: k, count: 0, hours: {} }; });

    // Baca data awal
    async function fetchAll() {
      const { data: visits } = await supabase
        .from("page_visits")
        .select("id, date_key, count")
        .in("date_key", keys);

      if (!visits || visits.length === 0) {
        setData(keys.map((k) => result[k]));
        setLoading(false);
        return;
      }

      const ids = visits.map((v: any) => v.id);
      const { data: hours } = await supabase
        .from("page_visit_hours")
        .select("visit_id, hour, count")
        .in("visit_id", ids);

      for (const v of visits) {
        const h: Record<string, number> = {};
        (hours ?? []).filter((hr: any) => hr.visit_id === v.id).forEach((hr: any) => {
          h[hr.hour] = hr.count;
        });
        result[v.date_key] = { date: v.date_key, count: v.count, hours: h };
      }

      setData(keys.map((k) => ({ ...result[k] })));
      setLoading(false);
    }

    fetchAll();

    // Realtime: subscribe ke page_visits
    const channel = supabase
      .channel("page_visits:recent")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "page_visits" },
        () => { fetchAll(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [days]);

  return { data, loading };
}

// ─── trackPageVisit — dipanggil dari public layout ────────────────────────────
// Pakai RPC Postgres untuk atomic increment (aman dari race condition)
export async function trackPageVisit(): Promise<void> {
  try {
    const today  = dateKey();
    const sesKey = `pj-visited-${today}`;

    if (typeof window !== "undefined" && sessionStorage.getItem(sesKey)) return;

    const hour = String(new Date().getHours()).padStart(2, "0");

    await supabase.rpc("increment_page_visit", {
      p_date_key: today,
      p_hour:     hour,
    });

    if (typeof window !== "undefined") sessionStorage.setItem(sesKey, "1");
  } catch (e) {
    console.warn("[trackPageVisit]", e);
  }
}
