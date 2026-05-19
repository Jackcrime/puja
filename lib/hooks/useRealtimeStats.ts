"use client";

/**
 * useRealtimeStats
 * Subscribe ke semua dokumen Firestore yang dipantau RenunganStatsPanel
 * menggunakan onSnapshot — otomatis update tanpa perlu refresh.
 */

import { useEffect, useState, useRef } from "react";
import { subscribeDoc } from "@/lib/firestore";
import type {
  Devotional,
  MazmurMinggu,
  BahanKhotbah,
  PokokDoa,
  AyatKhusus,
  AuthorsMap,
  BibleReading,
} from "@/lib/hooks/useFirestoreData";
import { EMPTY_DEVOTIONAL } from "@/lib/hooks/useFirestoreData";

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

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function useRealtimeStats(selectedDate?: Date): RealtimeStatsData {
  const sundayKey = getSundayKey(selectedDate ?? new Date());
  const dateKey   = getDateKey(selectedDate ?? new Date());

  const EMPTY_MAZMUR: MazmurMinggu = { reference: "", title: "", verses: [], visible: true };

  const [devotional,    setDevotional]    = useState<Devotional>(EMPTY_DEVOTIONAL);
  const [mazmur,        setMazmur]        = useState<MazmurMinggu>(EMPTY_MAZMUR);
  const [khotbah,       setKhotbah]       = useState<BahanKhotbah>(EMPTY_BAHAN);
  const [pokdoa,        setPokdoa]        = useState<PokokDoa[]>([]);
  const [khusus,        setKhusus]        = useState<AyatKhusus>({});
  const [authors,       setAuthors]       = useState<AuthorsMap>(EMPTY_AUTHORS);
  const [bibleReadings, setBibleReadings] = useState<BibleReading[]>([]);
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

    // 1. Renungan harian — subscribe ke dateKey, fallback ke "current"
    const devLoadedRef = { current: false };
    unsubs.push(subscribeDoc<Devotional>(
      "devotional", dateKey, null as any,
      (d) => { devLoadedRef.current = true; setDevotional(d ?? EMPTY_DEVOTIONAL); markLoaded("dev"); }
    ));
    unsubs.push(subscribeDoc<Devotional>(
      "devotional", "current", EMPTY_DEVOTIONAL,
      (d) => { if (!devLoadedRef.current) setDevotional(d ?? EMPTY_DEVOTIONAL); markLoaded("dev"); }
    ));

    // 2. Mazmur Minggu
    const mazmurWeekLoadedRef = { current: false };
    unsubs.push(subscribeDoc<MazmurMinggu>(
      "mazmur_minggu", sundayKey, null as any,
      (d) => { mazmurWeekLoadedRef.current = true; setMazmur(d ?? EMPTY_MAZMUR); markLoaded("maz"); }
    ));
    unsubs.push(subscribeDoc<MazmurMinggu>(
      "mazmur_minggu", "current", EMPTY_MAZMUR,
      (d) => { if (!mazmurWeekLoadedRef.current) setMazmur(d ?? EMPTY_MAZMUR); markLoaded("maz"); }
    ));

    // 3. Bahan Khotbah
    const khotbahWeekLoadedRef = { current: false };
    unsubs.push(subscribeDoc<BahanKhotbah>(
      "bahan_khotbah", sundayKey, null as any,
      (d) => { khotbahWeekLoadedRef.current = true; setKhotbah(d ?? EMPTY_BAHAN); markLoaded("kot"); }
    ));
    unsubs.push(subscribeDoc<BahanKhotbah>(
      "bahan_khotbah", "current", EMPTY_BAHAN,
      (d) => { if (!khotbahWeekLoadedRef.current) setKhotbah(d ?? EMPTY_BAHAN); markLoaded("kot"); }
    ));

    // 4. Pokok Doa Harian
    unsubs.push(subscribeDoc<{ items: PokokDoa[] }>(
      "pokok_doa_harian", "current", { items: [] },
      (d) => { setPokdoa(d?.items ?? []); markLoaded("pok"); }
    ));

    // 5. Ayat Khusus
    unsubs.push(subscribeDoc<AyatKhusus>(
      "ayat_khusus", "current", {},
      (d) => { setKhusus(d ?? {}); markLoaded("khu"); }
    ));

    // 6. Authors
    unsubs.push(subscribeDoc<AuthorsMap>(
      "authors", "current", EMPTY_AUTHORS,
      (d) => { setAuthors(d ?? EMPTY_AUTHORS); markLoaded("aut"); }
    ));

    // 7. Bible Readings — subscribe ke dateKey, fallback ke "current"
    const brLoadedRef = { current: false };
    unsubs.push(subscribeDoc<{ items: BibleReading[] }>(
      "bible_readings", dateKey, null as any,
      (d) => { brLoadedRef.current = true; setBibleReadings(d?.items ?? []); markLoaded("br"); }
    ));
    unsubs.push(subscribeDoc<{ items: BibleReading[] }>(
      "bible_readings", "current", { items: [] },
      (d) => { if (!brLoadedRef.current) setBibleReadings(d?.items ?? []); markLoaded("br"); }
    ));

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sundayKey, dateKey]);

  return { devotional, mazmur, khotbah, pokdoa, khusus, authors, bibleReadings, loading, lastUpdated };
}