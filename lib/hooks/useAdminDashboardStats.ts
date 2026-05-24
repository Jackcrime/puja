"use client";

/**
 * useAdminRealtimeStats
 * ─────────────────────
 * Hook KHUSUS admin dashboard.
 * Semua data di-subscribe lewat onSnapshot agar dashboard
 * auto-update begitu admin menyimpan konten di halaman lain.
 *
 * Public pages TIDAK menggunakan hook ini —
 * mereka tetap pakai readDoc/readCollection (sekali baca).
 */

import { useState, useEffect } from "react";
import {
  doc, collection, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Devotional }   from "./useFirestoreData";
import type { AyatKhusus }   from "./useFirestoreData";
import type { Ministry }     from "./useFirestoreData";
import type { PustakaBook }  from "./useFirestoreData";
import type { AyatCategory } from "./useFirestoreData";
import type { BibleReading } from "./useFirestoreData";

// ─── Types ───────────────────────────────────────────────────────────────────
type AuthorsMap = Record<string, unknown>;

export interface AdminDashboardStats {
  // counts
  totalAyat:       number;
  totalAuthors:    number;
  totalPustaka:    number;
  totalMinistries: number;
  totalReadings:   number;

  // full data (for kelengkapan charts)
  devotional:  Devotional;
  ayatKhusus:  AyatKhusus;

  // loading flags
  loading: {
    ayat:       boolean;
    authors:    boolean;
    pustaka:    boolean;
    ministries: boolean;
    readings:   boolean;
    devotional: boolean;
    khusus:     boolean;
  };
}

const EMPTY_DEVOTIONAL: Devotional = {
  title: "", authorCode: "", audioUrl: "", body: "", prayer: "",
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAdminDashboardStats(): AdminDashboardStats {
  // ── counts state ──────────────────────────────────────────────────────────
  const [totalAyat,       setTotalAyat]       = useState(0);
  const [totalAuthors,    setTotalAuthors]     = useState(0);
  const [totalPustaka,    setTotalPustaka]     = useState(0);
  const [totalMinistries, setTotalMinistries]  = useState(0);
  const [totalReadings,   setTotalReadings]    = useState(0);

  // ── content state (for kelengkapan) ───────────────────────────────────────
  const [devotional,  setDevotional]  = useState<Devotional>(EMPTY_DEVOTIONAL);
  const [ayatKhusus,  setAyatKhusus]  = useState<AyatKhusus>({});

  // ── loading flags ─────────────────────────────────────────────────────────
  const [lAyat,       setLAyat]       = useState(true);
  const [lAuthors,    setLAuthors]    = useState(true);
  const [lPustaka,    setLPustaka]    = useState(true);
  const [lMinistries, setLMinistries] = useState(true);
  const [lReadings,   setLReadings]   = useState(true);
  const [lDevotional, setLDevotional] = useState(true);
  const [lKhusus,     setLKhusus]     = useState(true);

  useEffect(() => {
    const dateKey = todayKey();
    const unsubs: (() => void)[] = [];

    // 1. ayat_categories → totalAyat
    unsubs.push(
      onSnapshot(
        doc(db, "ayat_categories", "current"),
        (snap) => {
          const items: AyatCategory[] = snap.exists()
            ? (snap.data() as { items: AyatCategory[] }).items ?? []
            : [];
          setTotalAyat(items.reduce((s, c) => s + (c.verses?.length ?? 0), 0));
          setLAyat(false);
        },
        () => setLAyat(false)
      )
    );

    // 2. authors → totalAuthors
    unsubs.push(
      onSnapshot(
        doc(db, "authors", "current"),
        (snap) => {
          const map: AuthorsMap = snap.exists() ? (snap.data() as AuthorsMap) : {};
          // exclude meta fields (updatedAt, etc.)
          const count = Object.keys(map).filter(
            (k) => k !== "updatedAt" && k !== "createdAt"
          ).length;
          setTotalAuthors(count);
          setLAuthors(false);
        },
        () => setLAuthors(false)
      )
    );

    // 3. pustaka_books (collection) → totalPustaka
    unsubs.push(
      onSnapshot(
        collection(db, "pustaka_books"),
        (snap) => {
          setTotalPustaka(snap.size);
          setLPustaka(false);
        },
        () => setLPustaka(false)
      )
    );

    // 4. ministries (collection) → totalMinistries
    unsubs.push(
      onSnapshot(
        collection(db, "ministries"),
        (snap) => {
          setTotalMinistries(snap.size);
          setLMinistries(false);
        },
        () => setLMinistries(false)
      )
    );

    // 5. bible_readings for today → totalReadings
    unsubs.push(
      onSnapshot(
        doc(db, "bible_readings", dateKey),
        (snap) => {
          const items: BibleReading[] = snap.exists()
            ? (snap.data() as { items: BibleReading[] }).items ?? []
            : [];
          setTotalReadings(items.length);
          setLReadings(false);
        },
        () => setLReadings(false)
      )
    );

    // 6. devotional for today → kelengkapan
    unsubs.push(
      onSnapshot(
        doc(db, "devotional", dateKey),
        (snap) => {
          if (snap.exists()) {
            setDevotional(snap.data() as Devotional);
          } else {
            // fallback ke "current" (one-time)
            onSnapshot(
              doc(db, "devotional", "current"),
              (s) => {
                setDevotional(s.exists() ? (s.data() as Devotional) : EMPTY_DEVOTIONAL);
                setLDevotional(false);
              },
              () => setLDevotional(false)
            );
            return;
          }
          setLDevotional(false);
        },
        () => setLDevotional(false)
      )
    );

    // 7. ayat_khusus → kelengkapan ayat
    unsubs.push(
      onSnapshot(
        doc(db, "ayat_khusus", "current"),
        (snap) => {
          setAyatKhusus(snap.exists() ? (snap.data() as AyatKhusus) : {});
          setLKhusus(false);
        },
        () => setLKhusus(false)
      )
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  return {
    totalAyat,
    totalAuthors,
    totalPustaka,
    totalMinistries,
    totalReadings,
    devotional,
    ayatKhusus,
    loading: {
      ayat:       lAyat,
      authors:    lAuthors,
      pustaka:    lPustaka,
      ministries: lMinistries,
      readings:   lReadings,
      devotional: lDevotional,
      khusus:     lKhusus,
    },
  };
}