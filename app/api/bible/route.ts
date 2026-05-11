// ─── Next.js API Route — Proxy ke LAI Bible API ───────────────────────────────
// GET /api/bible?book=1samuel&chapter=2&from=1&to=36
//
// Menyembunyikan LAI_BIBLE_API_KEY dari client.
// Tambahkan ke .env.local:
//   LAI_BIBLE_API_KEY=your_key_here
//   LAI_BIBLE_API_URL=https://bible-api.alkitab.or.id/bible-api/api/v1

import { NextRequest, NextResponse } from "next/server";

const LAI_URL = process.env.LAI_BIBLE_API_URL ??
                "https://bible-api.alkitab.or.id/bible-api/api/v1";
const LAI_KEY = process.env.LAI_BIBLE_API_KEY ?? "";

export interface BibleVerse {
  verse:   number;
  text:    string;
}

export interface BiblePassageResponse {
  book:      string;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
  verses:    BibleVerse[];
  headings:  { beforeVerse: number; text: string }[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const book    = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  const from    = searchParams.get("from");
  const to      = searchParams.get("to");

  if (!book || !chapter || !from || !to) {
    return NextResponse.json(
      { error: "Parameter book, chapter, from, to wajib diisi." },
      { status: 400 }
    );
  }

  if (!LAI_KEY) {
    return NextResponse.json(
      { error: "LAI_BIBLE_API_KEY belum di-set di .env.local" },
      { status: 503 }
    );
  }

  const verseRange = from === to ? from : `${from}-${to}`;
  const endpoint   = `${LAI_URL}/bible/tb/${book}/${chapter}/${verseRange}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${LAI_KEY}`,
        Accept:        "application/json",
      },
      // Cache 24 jam — teks Alkitab tidak berubah
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[bible-proxy] LAI API error:", res.status, text);
      return NextResponse.json(
        { error: `LAI API error: ${res.status}` },
        { status: res.status }
      );
    }

    const raw = await res.json();

    // ── Normalize respons LAI ke format standar ─────────────────────────────
    // TODO: sesuaikan setelah dapat akses API dan melihat struktur respons asli.
    // Struktur yang mungkin dari LAI:
    //   raw.data.verses[] | raw.verses[] | raw.verse (single) | raw.passage[]
    const normalized: BiblePassageResponse = normalizeResponse(raw, book, Number(chapter), Number(from), Number(to));

    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch (e) {
    console.error("[bible-proxy] fetch error:", e);
    return NextResponse.json({ error: "Gagal menghubungi LAI Bible API." }, { status: 500 });
  }
}

// ─── Normalizer — sesuaikan dengan respons aktual LAI setelah testing ─────────
function normalizeResponse(
  raw: any,
  book: string,
  chapter: number,
  verseFrom: number,
  verseTo: number
): BiblePassageResponse {
  let verses: BibleVerse[]    = [];
  let headings: { beforeVerse: number; text: string }[] = [];

  // Coba berbagai kemungkinan struktur respons
  const rawVerses: any[] =
    raw?.data?.verses ??
    raw?.data?.passage ??
    raw?.verses ??
    raw?.passage ??
    (Array.isArray(raw?.verse) ? raw.verse : null) ??
    [];

  if (rawVerses.length > 0) {
    // Format array: [{ verse: 1, text: "..." }, ...]
    for (const v of rawVerses) {
      if (v.type === "title" || v.type === "heading") {
        headings.push({ beforeVerse: v.verse ?? verses.length + 1, text: v.content ?? v.text ?? "" });
        continue;
      }
      if (v.type === "text" || v.type === "content" || v.text || v.content) {
        verses.push({
          verse: Number(v.verse ?? v.verse_number ?? v.number),
          text:  String(v.text ?? v.content ?? ""),
        });
      }
    }
  } else if (raw?.verse?.text) {
    // Format single verse
    verses = [{ verse: verseFrom, text: raw.verse.text }];
  } else if (typeof raw?.text === "string") {
    verses = [{ verse: verseFrom, text: raw.text }];
  }

  return { book, chapter, verseFrom, verseTo, verses, headings };
}