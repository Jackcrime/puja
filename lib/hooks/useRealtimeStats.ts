"use client";

/**
 * useRealtimeStats
 * Subscribe ke semua dokumen Firestore yang dipantau RenunganStatsPanel
 * menggunakan onSnapshot — otomatis update tanpa perlu refresh.
 */

import { useEffect, useState, useRef } from "react";
import { subscribeDoc } from "@/lib/firestore";
import {
  DEVOTIONAL, VERSE_HIGHLIGHTS, BIBLE_READINGS,
} from "@/lib/mockData";
import { MAZMUR_MINGGU, POKOK_DOA_HARIAN } from "@/lib/mockData";
import type {
  Devotional,
  MazmurMinggu,
  BahanKhotbah,
  PokokDoa,
  AyatKhusus,
  AuthorsMap,
  BibleReading,
} from "@/lib/hooks/useFirestoreData";

// Compute Minggu key (same logic as useFirestoreData)
function getSundayKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DEFAULT_AYAT_KHUSUS: AyatKhusus = { minggu: undefined, bulan: {}, harian: {} };
const EMPTY_AUTHORS: AuthorsMap = {};
const EMPTY_BAHAN: BahanKhotbah = { bookSlug: "", bookName: "", chapter: 1, verseFrom: 1, verseTo: 1, reference: "" };

export interface RealtimeStatsData {
  devotional:    Devotional;
  mazmur:        MazmurMinggu;
  khotbah:       BahanKhotbah;
  pokdoa:        PokokDoa[];
  khusus:        AyatKhusus;
  authors:       AuthorsMap;
  bibleReadings: BibleReading[];
  loading:       boolean;
  lastUpdated:   Date | null;
}

export function useRealtimeStats(selectedDate?: Date): RealtimeStatsData {
  const sundayKey = getSundayKey(selectedDate ?? new Date());

  const [devotional,    setDevotional]    = useState<Devotional>(DEVOTIONAL as Devotional);
  const [mazmur,        setMazmur]        = useState<MazmurMinggu>(MAZMUR_MINGGU);
  const [khotbah,       setKhotbah]       = useState<BahanKhotbah>(EMPTY_BAHAN);
  const [pokdoa,        setPokdoa]        = useState<PokokDoa[]>(POKOK_DOA_HARIAN);
  const [khusus,        setKhusus]        = useState<AyatKhusus>(DEFAULT_AYAT_KHUSUS);
  const [authors,       setAuthors]       = useState<AuthorsMap>(EMPTY_AUTHORS);
  const [bibleReadings, setBibleReadings] = useState<BibleReading[]>(BIBLE_READINGS);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);

  // Track which docs have loaded for the initial loading state
  const loaded = useRef({ dev: false, maz: false, kot: false, pok: false, khu: false, aut: false, br: false });
  const [loading, setLoading] = useState(true);

  const markLoaded = (key: keyof typeof loaded.current) => {
    loaded.current[key] = true;
    if (Object.values(loaded.current).every(Boolean)) {
      setLoading(false);
    }
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // 1. Renungan harian
    unsubs.push(subscribeDoc<Devotional>(
      "devotional", "current", DEVOTIONAL as Devotional,
      (d) => { setDevotional(d); markLoaded("dev"); }
    ));

    // 2. Mazmur Minggu — subscribe ke key minggu ini, fallback ke "current"
    // Gunakan ref agar flag shared antar dua callback (tidak ada closure stale)
    const mazmurWeekLoadedRef = { current: false };
    const EMPTY_MAZMUR: MazmurMinggu = { reference: "", title: "", verses: [] };
    unsubs.push(subscribeDoc<MazmurMinggu>(
      "mazmur_minggu", sundayKey, null as any,
      (d) => {
        mazmurWeekLoadedRef.current = true;
        setMazmur(d ?? EMPTY_MAZMUR);
        markLoaded("maz");
      }
    ));
    unsubs.push(subscribeDoc<MazmurMinggu>(
      "mazmur_minggu", "current", MAZMUR_MINGGU,
      (d) => {
        if (!mazmurWeekLoadedRef.current) setMazmur(d);
        markLoaded("maz");
      }
    ));

    // 3. Bahan Khotbah — sama seperti mazmur
    const khotbahWeekLoadedRef = { current: false };
    unsubs.push(subscribeDoc<BahanKhotbah>(
      "bahan_khotbah", sundayKey, null as any,
      (d) => {
        khotbahWeekLoadedRef.current = true;
        setKhotbah(d ?? EMPTY_BAHAN);
        markLoaded("kot");
      }
    ));
    unsubs.push(subscribeDoc<BahanKhotbah>(
      "bahan_khotbah", "current", EMPTY_BAHAN,
      (d) => {
        if (!khotbahWeekLoadedRef.current) setKhotbah(d);
        markLoaded("kot");
      }
    ));

    // 4. Pokok Doa Harian
    unsubs.push(subscribeDoc<{ items: PokokDoa[] }>(
      "pokok_doa_harian", "current", { items: POKOK_DOA_HARIAN },
      (d) => { setPokdoa(d.items ?? POKOK_DOA_HARIAN); markLoaded("pok"); }
    ));

    // 5. Ayat Khusus
    unsubs.push(subscribeDoc<AyatKhusus>(
      "ayat_khusus", "current", DEFAULT_AYAT_KHUSUS,
      (d) => { setKhusus(d ?? DEFAULT_AYAT_KHUSUS); markLoaded("khu"); }
    ));

    // 6. Authors
    unsubs.push(subscribeDoc<AuthorsMap>(
      "authors", "current", EMPTY_AUTHORS,
      (d) => { setAuthors(d ?? EMPTY_AUTHORS); markLoaded("aut"); }
    ));

    // 7. Bible Readings
    unsubs.push(subscribeDoc<{ items: BibleReading[] }>(
      "bible_readings", "current", { items: BIBLE_READINGS },
      (d) => { setBibleReadings(d?.items ?? BIBLE_READINGS); markLoaded("br"); }
    ));

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sundayKey]);

  return { devotional, mazmur, khotbah, pokdoa, khusus, authors, bibleReadings, loading, lastUpdated };
}