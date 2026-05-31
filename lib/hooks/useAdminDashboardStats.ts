"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Devotional, AyatKhusus } from "./useSupabaseData";
import { EMPTY_DEVOTIONAL } from "./useSupabaseData";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AdminDashboardStats {
  totalAyat:       number;
  totalAuthors:    number;
  totalPustaka:    number;
  totalMinistries: number;
  totalReadings:   number;
  devotional:      Devotional;
  ayatKhusus:      AyatKhusus;
  loading: {
    ayat: boolean; authors: boolean; pustaka: boolean;
    ministries: boolean; readings: boolean;
    devotional: boolean; khusus: boolean;
  };
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAdminDashboardStats(): AdminDashboardStats {
  const [totalAyat,       setTotalAyat]       = useState(0);
  const [totalAuthors,    setTotalAuthors]     = useState(0);
  const [totalPustaka,    setTotalPustaka]     = useState(0);
  const [totalMinistries, setTotalMinistries]  = useState(0);
  const [totalReadings,   setTotalReadings]    = useState(0);
  const [devotional,      setDevotional]       = useState<Devotional>(EMPTY_DEVOTIONAL);
  const [ayatKhusus,      setAyatKhusus]       = useState<AyatKhusus>({});

  const [lAyat,       setLAyat]       = useState(true);
  const [lAuthors,    setLAuthors]    = useState(true);
  const [lPustaka,    setLPustaka]    = useState(true);
  const [lMinistries, setLMinistries] = useState(true);
  const [lReadings,   setLReadings]   = useState(true);
  const [lDevotional, setLDevotional] = useState(true);
  const [lKhusus,     setLKhusus]     = useState(true);

  // Ref untuk track apakah komponen masih mounted
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const dk = todayKey();

    // ── Fetch counts (tidak perlu async waterfall) ────────────────────────────
    function fetchCounts() {
      supabase.from("ayat_category_verses").select("id", { count: "exact", head: true })
        .then((r: any) => { if (!cancelledRef.current) { setTotalAyat(r.count ?? 0); setLAyat(false); } });

      supabase.from("authors").select("id", { count: "exact", head: true })
        .then((r: any) => { if (!cancelledRef.current) { setTotalAuthors(r.count ?? 0); setLAuthors(false); } });

      supabase.from("pustaka_books").select("id", { count: "exact", head: true })
        .then((r: any) => { if (!cancelledRef.current) { setTotalPustaka(r.count ?? 0); setLPustaka(false); } });

      supabase.from("ministries").select("id", { count: "exact", head: true })
        .then((r: any) => { if (!cancelledRef.current) { setTotalMinistries(r.count ?? 0); setLMinistries(false); } });

      supabase.from("bible_readings").select("id", { count: "exact", head: true }).eq("date_key", dk)
        .then((r: any) => { if (!cancelledRef.current) { setTotalReadings(r.count ?? 0); setLReadings(false); } });
    }

    // ── Fetch devotional + ayat khusus ────────────────────────────────────────
    async function fetchDevotional() {
      const { data: dev } = await supabase
        .from("devotional")
        .select("title, author_code, audio_url, body, prayer")
        .eq("date_key", dk)
        .maybeSingle();

      if (cancelledRef.current) return;

      if (dev?.title || dev?.body) {
        setDevotional({ title: dev.title, authorCode: dev.author_code, audioUrl: dev.audio_url, body: dev.body, prayer: dev.prayer });
      } else {
        const { data: cur } = await supabase
          .from("devotional")
          .select("title, author_code, audio_url, body, prayer")
          .eq("date_key", "current")
          .maybeSingle();
        if (!cancelledRef.current) {
          setDevotional(cur
            ? { title: cur.title, authorCode: cur.author_code, audioUrl: cur.audio_url, body: cur.body, prayer: cur.prayer }
            : EMPTY_DEVOTIONAL
          );
        }
      }
      if (!cancelledRef.current) setLDevotional(false);
    }

    async function fetchAyatKhusus() {
      const { data: tahun } = await supabase.from("ayat_khusus_tahun").select("*").eq("id", "current").maybeSingle();
      if (!cancelledRef.current) {
        setAyatKhusus(tahun?.year ? { tahun: { year: tahun.year, reference: tahun.reference, text: tahun.text } } : {});
        setLKhusus(false);
      }
    }

    fetchCounts();
    fetchDevotional();
    fetchAyatKhusus();

    // ── Realtime subscriptions ────────────────────────────────────────────────
    const channel = supabase
      .channel("admin_dashboard")
      // Count tables — re-fetch saat ada perubahan apapun (INSERT/UPDATE/DELETE)
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_category_verses" }, () => {
        if (!cancelledRef.current)
          supabase.from("ayat_category_verses").select("id", { count: "exact", head: true })
            .then((r: any) => { if (!cancelledRef.current) setTotalAyat(r.count ?? 0); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "authors" }, () => {
        if (!cancelledRef.current)
          supabase.from("authors").select("id", { count: "exact", head: true })
            .then((r: any) => { if (!cancelledRef.current) setTotalAuthors(r.count ?? 0); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pustaka_books" }, () => {
        if (!cancelledRef.current)
          supabase.from("pustaka_books").select("id", { count: "exact", head: true })
            .then((r: any) => { if (!cancelledRef.current) setTotalPustaka(r.count ?? 0); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ministries" }, () => {
        if (!cancelledRef.current)
          supabase.from("ministries").select("id", { count: "exact", head: true })
            .then((r: any) => { if (!cancelledRef.current) setTotalMinistries(r.count ?? 0); });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bible_readings" }, () => {
        if (!cancelledRef.current)
          supabase.from("bible_readings").select("id", { count: "exact", head: true }).eq("date_key", dk)
            .then((r: any) => { if (!cancelledRef.current) setTotalReadings(r.count ?? 0); });
      })
      // Devotional — re-fetch saat ada perubahan
      .on("postgres_changes", { event: "*", schema: "public", table: "devotional" }, (payload: any) => {
        if (cancelledRef.current) return;
        // DELETE → reset ke empty
        if (payload.eventType === "DELETE") {
          setDevotional(EMPTY_DEVOTIONAL);
          return;
        }
        fetchDevotional();
      })
      // Ayat khusus tahun
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_khusus_tahun" }, (payload: any) => {
        if (cancelledRef.current) return;
        if (payload.eventType === "DELETE") {
          setAyatKhusus({});
          return;
        }
        fetchAyatKhusus();
      })
      .subscribe();

    return () => {
      cancelledRef.current = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    totalAyat, totalAuthors, totalPustaka, totalMinistries, totalReadings,
    devotional, ayatKhusus,
    loading: {
      ayat: lAyat, authors: lAuthors, pustaka: lPustaka,
      ministries: lMinistries, readings: lReadings,
      devotional: lDevotional, khusus: lKhusus,
    },
  };
}