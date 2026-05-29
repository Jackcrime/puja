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

    // Baca awal
    async function fetchToday() {
      const { data } = await supabase
        .from("page_visits")
        .select("count")
        .eq("date_key", today)
        .maybeSingle();
      setTodayCount(data?.count ?? 0);
      setLoading(false);
    }

    fetchToday();

    // Realtime subscribe — update langsung saat row berubah
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
        (payload) => {
          const row = payload.new as any;
          if (row?.count !== undefined) setTodayCount(row.count);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { todayCount, loading };
}
