/**
 * Shared helpers for admin/ayat components.
 * Single source of truth — import from here instead of duplicating.
 */

import { formatRef } from "@/lib/bible-books";
import type { VerseSelection } from "../../components/admin/ayat/BibleVerseSelector";

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

// ─── Verse helpers ────────────────────────────────────────────────────────────

/** Build a human-readable reference string from a VerseSelection. */
export function selToRef(sel: VerseSelection): string {
  if (!sel.bookSlug) return "";
  return formatRef(sel.bookName, sel.chapter, sel.verseFrom, sel.verseTo);
}

/** Fetch and join verse texts from the Bible API for a given selection. */
export async function fetchVerseText(sel: VerseSelection): Promise<string> {
  if (!sel.bookSlug) return "";
  try {
    const res  = await fetch(
      `/api/bible?book=${sel.bookSlug}&chapter=${sel.chapter}&from=${sel.verseFrom}&to=${sel.verseTo}`
    );
    const json = await res.json();
    if (!res.ok || json.error) return "";
    return (json.verses as { verse: number; text: string }[])
      .map((v) => v.text)
      .join(" ");
  } catch {
    return "";
  }
}

// ─── Export helper ────────────────────────────────────────────────────────────

/** Trigger a JSON file download in the browser. */
export function exportJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}