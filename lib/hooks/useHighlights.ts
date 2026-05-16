// "use client";

// import { useState, useEffect, useCallback } from "react";

// // ─── Types ────────────────────────────────────────────────────────────────────
// export type HighlightColor = "yellow" | "green" | "blue" | "pink";

// export interface Highlight {
//   id:        string;
//   reference: string;
//   text:      string;
//   label?:    string;
//   color:     HighlightColor;
//   savedAt:   string;
// }

// export const HIGHLIGHT_COLORS: Record<HighlightColor, { bg: string; border: string; label: string }> = {
//   yellow: { bg: "#fef9c3", border: "#eab308", label: "Kuning" },
//   green:  { bg: "#dcfce7", border: "#16a34a", label: "Hijau"  },
//   blue:   { bg: "#dbeafe", border: "#2563eb", label: "Biru"   },
//   pink:   { bg: "#fce7f3", border: "#db2777", label: "Merah muda" },
// };

// const STORAGE_KEY = "gkpb_highlights";

// // ─── Hook ─────────────────────────────────────────────────────────────────────
// export function useHighlights() {
//   const [data, setData] = useState<Record<string, Highlight>>({});

//   // Load dari localStorage
//   useEffect(() => {
//     try {
//       const raw = localStorage.getItem(STORAGE_KEY);
//       if (raw) setData(JSON.parse(raw));
//     } catch {}
//   }, []);

//   const persist = (next: Record<string, Highlight>) => {
//     setData(next);
//     try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
//   };

//   /** Tambah/ubah warna highlight */
//   const setHighlight = useCallback((
//     verse: { reference: string; text: string; label?: string },
//     color: HighlightColor = "yellow"
//   ) => {
//     const id = verse.reference.replace(/\s/g, "-").toLowerCase();
//     setData((prev) => {
//       const next = {
//         ...prev,
//         [id]: { id, ...verse, color, savedAt: new Date().toISOString() },
//       };
//       try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
//       return next;
//     });
//   }, []);

//   /** Hapus highlight */
//   const removeHighlight = useCallback((reference: string) => {
//     const id = reference.replace(/\s/g, "-").toLowerCase();
//     setData((prev) => {
//       const next = { ...prev };
//       delete next[id];
//       try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
//       return next;
//     });
//   }, []);

//   /** Cek apakah sudah di-highlight */
//   const getHighlight = useCallback((reference: string): Highlight | null => {
//     const id = reference.replace(/\s/g, "-").toLowerCase();
//     return data[id] ?? null;
//   }, [data]);

//   /** Export semua highlight ke clipboard */
//   const copyAll = useCallback(async (): Promise<void> => {
//     const list = Object.values(data).sort(
//       (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
//     );
//     if (list.length === 0) return;

//     const lines = [
//       "📖 Catatan Ayat — Puji dan Janji GKPB",
//       "",
//       ...list.flatMap((h) => {
//         const dot = h.color === "yellow" ? "🟡"
//                   : h.color === "green"  ? "🟢"
//                   : h.color === "blue"   ? "🔵"
//                   :                        "🩷";
//         return [`${dot} ${h.reference}`, `"${h.text}"`, ""];
//       }),
//     ];

//     try {
//       await navigator.clipboard.writeText(lines.join("\n"));
//     } catch {
//       // Fallback untuk browser yang tidak support clipboard API
//       const el = document.createElement("textarea");
//       el.value = lines.join("\n");
//       document.body.appendChild(el);
//       el.select();
//       document.execCommand("copy");
//       document.body.removeChild(el);
//     }
//   }, [data]);

//   const highlightList = Object.values(data).sort(
//     (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
//   );

//   return { highlightList, setHighlight, removeHighlight, getHighlight, copyAll };
// }