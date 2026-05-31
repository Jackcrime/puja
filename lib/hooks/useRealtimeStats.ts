"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { dateKey } from "./useVisitStats";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RealtimeStats {
  todayCount: number;
  loading:    boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useRealtimeStats(): RealtimeStats {
  const [todayCount, setTodayCount] = useState(0);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const today = dateKey();
    let cancelled = false;

    async function fetchToday() {
      const { data } = await supabase
        .from("page_visits")
        .select("count")
        .eq("date_key", today)
        .maybeSingle();
      if (!cancelled) {
        setTodayCount(data?.count ?? 0);
        setLoading(false);
      }
    }

    fetchToday();

    const channel = supabase
      .channel(`page_visits:today:${today}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "page_visits",
          filter: `date_key=eq.${today}`,
        },
        (payload: any) => {
          if (cancelled) return;
          // DELETE → row hilang, reset ke 0
          if (payload.eventType === "DELETE") {
            setTodayCount(0);
            return;
          }
          const row = payload.new as any;
          // UPDATE/INSERT — pakai nilai dari payload, fallback re-fetch
          if (row?.count !== undefined) {
            setTodayCount(row.count);
          } else {
            fetchToday();
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { todayCount, loading };
}