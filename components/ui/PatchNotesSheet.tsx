"use client";

import React, { useState } from "react";
import { usePatchNotesPublic, PATCH_TYPE_LABEL, PATCH_TYPE_COLOR, type PatchNoteType } from "@/lib/hooks/usePatchNotes";
import { ClipboardList, X, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── Type Pill ────────────────────────────────────────────────────────────────

function TypePill({ type }: { type: PatchNoteType }) {
  const color = PATCH_TYPE_COLOR[type];
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0"
      style={{ color, borderColor: `${color}50`, backgroundColor: `${color}12` }}
    >
      {PATCH_TYPE_LABEL[type]}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PatchNotesSheet() {
  const { data, loading } = usePatchNotesPublic();
  const [open, setOpen]   = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const latest = data[0] ?? null;

  return (
    <>
      {/* Trigger button */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4" style={{ color: "var(--gold)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            Pembaruan Aplikasi
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Catatan Rilis</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading
                ? "Memuat…"
                : latest
                ? `Versi terbaru: v${latest.version}`
                : "Belum ada rilis."
              }
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            disabled={loading || data.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-40"
            style={{
              backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
              color: "var(--brand)",
            }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Lihat
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-card rounded-t-3xl max-h-[85dvh] flex flex-col shadow-2xl">

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 pb-3 pt-1 border-b border-border shrink-0">
              <ClipboardList className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
              <p className="font-bold flex-1 text-base">Catatan Rilis</p>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted/50"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {data.map((note, idx) => {
                const isExpanded = expandedId === note.id;
                const isLatest   = idx === 0;
                return (
                  <div key={note.id} className="border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : note.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                    >
                      {/* Version */}
                      <div
                        className="text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--brand) 12%, transparent)",
                          color: "var(--brand)",
                        }}
                      >
                        v{note.version}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{note.title}</p>
                          {isLatest && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                              Terbaru
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {note.date
                            ? format(new Date(note.date), "d MMMM yyyy", { locale: localeId })
                            : "—"
                          }
                        </p>
                      </div>

                      <ChevronDown
                        className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-4 py-3 space-y-2">
                        {note.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <TypePill type={item.type} />
                            <p className="text-[13px] text-muted-foreground leading-snug pt-0.5">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom safe area — tambah ruang untuk BottomNav di mobile */}
            <div
              className="shrink-0 md:hidden"
              style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
            />
          </div>
        </div>
      )}
    </>
  );
}