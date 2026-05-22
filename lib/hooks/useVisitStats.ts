"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DailyVisit {
  date:  string;                      // "YYYY-MM-DD"
  count: number;                      // unique sessions that day
  hours: Record<string, number>;      // "00"–"23" → count
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Last N days as "YYYY-MM-DD" strings, newest last */
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
  const [data, setData]       = useState<DailyVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const keys   = lastNDays(days);
    const result: Record<string, DailyVisit> = {};
    // Pre-fill dengan 0 biar hari tanpa data tetap muncul di chart
    keys.forEach((k) => { result[k] = { date: k, count: 0, hours: {} }; });

    let resolved = 0;
    const unsubs = keys.map((k) => {
      const ref = doc(db, "page_visits", k);
      return onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const d = snap.data() as { count: number; hours: Record<string, number> };
            result[k] = { date: k, count: d.count ?? 0, hours: d.hours ?? {} };
          }
          resolved++;
          if (resolved >= keys.length) setLoading(false);
          // trigger re-render dengan shallow copy array
          setData(keys.map((key) => ({ ...result[key] })));
        },
        (err) => {
          console.error("[useVisitStats]", err);
          resolved++;
          if (resolved >= keys.length) setLoading(false);
        }
      );
    });

    return () => unsubs.forEach((u) => u());
  }, [days]);

  return { data, loading };
}

// ─── trackPageVisit — dipanggil dari public layout ────────────────────────────
// Cukup taruh 1x di public layout, otomatis detect semua halaman publik.
// Session key per hari → 1 user 1 kunjungan per hari, anti ghost visit.
export async function trackPageVisit(): Promise<void> {
  try {
    const today    = dateKey();
    const sesKey   = `pj-visited-${today}`;

    // Sudah dikunjungi hari ini di sesi ini → skip
    if (typeof window !== "undefined" && sessionStorage.getItem(sesKey)) return;

    const hour = String(new Date().getHours()).padStart(2, "0");
    const ref  = doc(db, "page_visits", today);

    await runTransaction(db, async (tx) => {
      const snap    = await tx.get(ref);
      const current = snap.exists()
        ? (snap.data() as { count: number; hours: Record<string, number> })
        : { count: 0, hours: {} };

      tx.set(ref, {
        count: (current.count ?? 0) + 1,
        hours: {
          ...current.hours,
          [hour]: ((current.hours ?? {})[hour] ?? 0) + 1,
        },
      });
    });

    if (typeof window !== "undefined") sessionStorage.setItem(sesKey, "1");
  } catch (e) {
    console.warn("[trackPageVisit]", e);
  }
}