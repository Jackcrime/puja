// ─── Next.js API Route — Proxy Bible API ──────────────────────────────────────
// GET /api/bible?book=yohanes&chapter=3&from=16&to=17          (Indonesia, default)
// GET /api/bible?book=yohanes&chapter=3&from=16&to=17&lang=en  (English KJV)
//
// Strategi (urutan prioritas):
//   Indonesia: 1. LAI Bible API (jika key di-set)  2. AYT SABDA (fallback)
//   English:   bolls.life KJV (gratis, no key)
//
// .env.local (semua opsional):
//   LAI_BIBLE_API_KEY=your_key_here
//   LAI_BIBLE_API_URL=https://bible-api.alkitab.or.id/bible-api/api/v1
//   NEXT_PUBLIC_SITE_URL=gkpb.or.id
//   EN_BIBLE_VERSION=KJV   (bisa KJV | WEB | ASV | YLT)

import { NextRequest, NextResponse } from "next/server";
import { BIBLE_BOOKS } from "@/lib/bible-books";

// ── Konstanta ──────────────────────────────────────────────────────────────────
const LAI_URL    = process.env.LAI_BIBLE_API_URL ?? "https://bible-api.alkitab.or.id/bible-api/api/v1";
const LAI_KEY    = process.env.LAI_BIBLE_API_KEY ?? "";
const AYT_URL    = "https://api.ayt.co/v1";
const AYT_SRC    = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "gkpb.or.id";
const BOLLS_URL  = "https://bolls.life/get-passage";
const EN_VERSION = process.env.EN_BIBLE_VERSION ?? "KJV";

// ── Tipe publik ────────────────────────────────────────────────────────────────
export interface BibleVerse {
  verse: number;
  text:  string;
}

export interface BiblePassageResponse {
  book:      string;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
  verses:    BibleVerse[];
  headings:  { beforeVerse: number; text: string }[];
  source:    "LAI" | "AYT" | "KJV" | "WEB" | "ASV" | string;
  lang:      "id" | "en";
}

// ── Handler utama ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const book    = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  const from    = searchParams.get("from");
  const to      = searchParams.get("to");
  const lang    = (searchParams.get("lang") ?? "id") as "id" | "en";

  if (!book || !chapter || !from || !to) {
    return NextResponse.json(
      { error: "Parameter book, chapter, from, to wajib diisi." },
      { status: 400 }
    );
  }

  const chapterNum = Number(chapter);
  const verseFrom  = Number(from);
  const verseTo    = Number(to);

  // Validasi: harus integer positif, dan from <= to
  if (
    !Number.isInteger(chapterNum) || chapterNum < 1 ||
    !Number.isInteger(verseFrom)  || verseFrom < 1  ||
    !Number.isInteger(verseTo)    || verseTo < 1    ||
    verseFrom > verseTo
  ) {
    return NextResponse.json(
      { error: "Parameter chapter, from, to harus angka bulat positif, dan from ≤ to." },
      { status: 400 }
    );
  }

  const bookIndex = BIBLE_BOOKS.findIndex(b => b.slug === book);
  if (bookIndex === -1) {
    return NextResponse.json({ error: `Kitab tidak dikenal: ${book}` }, { status: 400 });
  }
  const bookMeta = BIBLE_BOOKS[bookIndex];
  const bookNum  = bookIndex + 1; // bolls.life pakai nomor 1–66

  const cacheHeaders = { "Cache-Control": "public, max-age=86400, s-maxage=86400" };

  // ── English: bolls.life ────────────────────────────────────────────────────
  if (lang === "en") {
    try {
      const result = await fetchFromBolls(bookNum, bookMeta.name, chapterNum, verseFrom, verseTo);
      return NextResponse.json(result, { headers: cacheHeaders });
    } catch (e) {
      console.error("[bible-proxy] bolls.life gagal:", e);
      return NextResponse.json({ error: "Gagal mengambil teks Alkitab (EN)." }, { status: 500 });
    }
  }

  // ── Indonesia: LAI → AYT ───────────────────────────────────────────────────
  if (LAI_KEY) {
    try {
      const result = await fetchFromLAI(book, chapterNum, verseFrom, verseTo, bookMeta.name);
      return NextResponse.json(result, { headers: cacheHeaders });
    } catch (e) {
      console.warn("[bible-proxy] LAI gagal, fallback ke AYT:", e);
    }
  }

  try {
    const result = await fetchFromAYT(bookMeta.abbr, chapterNum, verseFrom, verseTo, bookMeta.name);
    return NextResponse.json(result, { headers: cacheHeaders });
  } catch (e) {
    console.error("[bible-proxy] AYT juga gagal:", e);
    return NextResponse.json({ error: "Gagal mengambil teks Alkitab." }, { status: 500 });
  }
}

// ── Fetcher: bolls.life (English) ─────────────────────────────────────────────
// GET https://bolls.life/get-passage/KJV/{bookNum}/{chapter}/{from}/{to}/
// Response: [{ pk, verse, text }, ...]
async function fetchFromBolls(
  bookNum: number, bookName: string, chapter: number, verseFrom: number, verseTo: number
): Promise<BiblePassageResponse> {
  const url = `${BOLLS_URL}/${EN_VERSION}/${bookNum}/${chapter}/${verseFrom}/${verseTo}/`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`bolls.life ${res.status}`);

  const raw: { pk: number; verse: number; text: string }[] = await res.json();

  const verses: BibleVerse[] = raw.map(v => ({
    verse: v.verse,
    // bolls.life kadang include HTML tags di beberapa versi — strip jika ada
    text:  v.text.replace(/<[^>]+>/g, "").trim(),
  }));

  return { book: bookName, chapter, verseFrom, verseTo, verses, headings: [], source: EN_VERSION, lang: "en" };
}

// ── Fetcher: LAI (Indonesia, TB resmi) ────────────────────────────────────────
async function fetchFromLAI(
  slug: string, chapter: number, verseFrom: number, verseTo: number, bookName: string
): Promise<BiblePassageResponse> {
  const verseRange = verseFrom === verseTo ? String(verseFrom) : `${verseFrom}-${verseTo}`;
  const url = `${LAI_URL}/bible/tb/${slug}/${chapter}/${verseRange}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${LAI_KEY}`, Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`LAI ${res.status}`);

  const raw = await res.json();
  return normalizeLAI(raw, bookName, chapter, verseFrom, verseTo);
}

// ── Fetcher: AYT SABDA (Indonesia, fallback) ──────────────────────────────────
async function fetchFromAYT(
  abbr: string, chapter: number, verseFrom: number, verseTo: number, bookName: string
): Promise<BiblePassageResponse> {
  const passageStr = verseFrom === verseTo
    ? `${abbr} ${chapter}:${verseFrom}`
    : `${abbr} ${chapter}:${verseFrom}-${verseTo}`;

  const url = `${AYT_URL}/passage.php?passage=${encodeURIComponent(passageStr)}&source=${AYT_SRC}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`AYT ${res.status}`);

  const raw = await res.json();
  return normalizeAYT(raw, bookName, chapter, verseFrom, verseTo);
}

// ── Normalizer: LAI ────────────────────────────────────────────────────────────
function normalizeLAI(
  raw: any, book: string, chapter: number, verseFrom: number, verseTo: number
): BiblePassageResponse {
  const verses:   BibleVerse[]                             = [];
  const headings: { beforeVerse: number; text: string }[] = [];

  const rawVerses: any[] =
    raw?.data?.verses ?? raw?.data?.passage ?? raw?.verses ?? raw?.passage ??
    (Array.isArray(raw?.verse) ? raw.verse : null) ?? [];

  for (const v of rawVerses) {
    if (v.type === "title" || v.type === "heading") {
      headings.push({ beforeVerse: v.verse ?? verses.length + 1, text: v.content ?? v.text ?? "" });
      continue;
    }
    if (v.text || v.content) {
      verses.push({ verse: Number(v.verse ?? v.verse_number ?? v.number), text: String(v.text ?? v.content) });
    }
  }
  if (verses.length === 0 && raw?.verse?.text) {
    verses.push({ verse: verseFrom, text: raw.verse.text });
  }

  return { book, chapter, verseFrom, verseTo, verses, headings, source: "LAI", lang: "id" };
}

// ── Normalizer: AYT ───────────────────────────────────────────────────────────
function normalizeAYT(
  raw: any, book: string, chapter: number, verseFrom: number, verseTo: number
): BiblePassageResponse {
  const verses:   BibleVerse[]                             = [];
  const headings: { beforeVerse: number; text: string }[] = [];

  const refs: any[] = Array.isArray(raw) ? raw : [];

  for (const ref of refs) {
    const bookData = ref?.res ? (Object.values(ref.res)[0] as any) : null;
    if (!bookData?.data) continue;

    const chapData = Object.values(bookData.data)[0] as any;
    if (!chapData) continue;

    for (const entry of Object.values(chapData) as any[]) {
      const verseNum = Number(entry.verse);
      if (verseNum < verseFrom || verseNum > verseTo) continue;

      if (entry.title && !headings.find(h => h.beforeVerse === verseNum)) {
        headings.push({ beforeVerse: verseNum, text: entry.title });
      }
      if (!verses.find(v => v.verse === verseNum)) {
        verses.push({ verse: verseNum, text: String(entry.text ?? "") });
      }
    }
  }

  verses.sort((a, b) => a.verse - b.verse);
  return { book, chapter, verseFrom, verseTo, verses, headings, source: "AYT", lang: "id" };
}