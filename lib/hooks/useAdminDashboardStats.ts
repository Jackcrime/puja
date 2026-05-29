"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const dk = todayKey();

    // Fetch sekali
    async function fetchAll() {
      // 1. Ayat categories — total verses
      supabase.from("ayat_category_verses").select("id", { count: "exact", head: true })
        .then(({ count }) => { setTotalAyat(count ?? 0); setLAyat(false); });

      // 2. Authors count
      supabase.from("authors").select("id", { count: "exact", head: true })
        .then(({ count }) => { setTotalAuthors(count ?? 0); setLAuthors(false); });

      // 3. Pustaka count
      supabase.from("pustaka_books").select("id", { count: "exact", head: true })
        .then(({ count }) => { setTotalPustaka(count ?? 0); setLPustaka(false); });

      // 4. Ministries count
      supabase.from("ministries").select("id", { count: "exact", head: true })
        .then(({ count }) => { setTotalMinistries(count ?? 0); setLMinistries(false); });

      // 5. Bible readings today
      supabase.from("bible_readings").select("id", { count: "exact", head: true }).eq("date_key", dk)
        .then(({ count }) => { setTotalReadings(count ?? 0); setLReadings(false); });

      // 6. Devotional today
      const { data: dev } = await supabase
        .from("devotional")
        .select("title, author_code, audio_url, body, prayer")
        .eq("date_key", dk)
        .maybeSingle();
      if (dev?.title) {
        setDevotional({ title: dev.title, authorCode: dev.author_code, audioUrl: dev.audio_url, body: dev.body, prayer: dev.prayer });
      } else {
        const { data: cur } = await supabase
          .from("devotional")
          .select("title, author_code, audio_url, body, prayer")
          .eq("date_key", "current")
          .maybeSingle();
        setDevotional(cur
          ? { title: cur.title, authorCode: cur.author_code, audioUrl: cur.audio_url, body: cur.body, prayer: cur.prayer }
          : EMPTY_DEVOTIONAL
        );
      }
      setLDevotional(false);

      // 7. Ayat khusus tahun
      const { data: tahun } = await supabase.from("ayat_khusus_tahun").select("*").eq("id", "current").maybeSingle();
      setAyatKhusus(tahun?.year ? { tahun: { year: tahun.year, reference: tahun.reference, text: tahun.text } } : {});
      setLKhusus(false);
    }

    fetchAll();

    // Realtime subscriptions
    const channel = supabase
      .channel("admin_dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "ayat_category_verses" }, () => {
        supabase.from("ayat_category_verses").select("id", { count: "exact", head: true })
          .then(({ count }) => setTotalAyat(count ?? 0));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "authors" }, () => {
        supabase.from("authors").select("id", { count: "exact", head: true })
          .then(({ count }) => setTotalAuthors(count ?? 0));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pustaka_books" }, () => {
        supabase.from("pustaka_books").select("id", { count: "exact", head: true })
          .then(({ count }) => setTotalPustaka(count ?? 0));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ministries" }, () => {
        supabase.from("ministries").select("id", { count: "exact", head: true })
          .then(({ count }) => setTotalMinistries(count ?? 0));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "devotional" }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
