"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Church } from "lucide-react";
import { useAuthors, useMinistries } from "@/lib/hooks/useFirestoreData";
import { useI18n } from "@/lib/hooks/useI18n";

interface AuthorModalProps {
  code:         string;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthorModal({ code, open, onOpenChange }: AuthorModalProps) {
  const { t } = useI18n();
  const { data: AUTHORS }    = useAuthors();
  const { data: ministries } = useMinistries();
  const author = AUTHORS[code];

  // ── Gelar: support titles[] (baru) dan title (legacy) ────────────────────
  const titleDisplay = useMemo(() => {
    if (!author) return "";
    if (Array.isArray(author.titles) && author.titles.length > 0)
      return author.titles.join(", ");
    return (author as any).title ?? "";
  }, [author]);

  // ── Riwayat pelayanan: support serviceHistory[] (baru) dan ministries/ministry (legacy) ─
  const serviceRows = useMemo(() => {
    if (!author) return [];

    // Format baru: serviceHistory[{ ministryId, from, until }]
    const sh = author.serviceHistory;
    if (Array.isArray(sh) && sh.length > 0 && sh.some((s) => s.ministryId)) {
      return sh.map((s) => ({
        name:  ministries.find((m) => m.id === s.ministryId)?.name ?? s.ministryId,
        from:  s.from  || "",
        until: s.until || "Sekarang",
      }));
    }

    // Legacy: ministries[] (array of IDs atau names)
    const legacyIds: string[] = (author as any).ministries ?? [];
    if (legacyIds.length > 0) {
      return legacyIds.map((id) => ({
        name:  ministries.find((m) => m.id === id)?.name ?? id,
        from:  (author as any).servedFrom  ?? "",
        until: (author as any).servedUntil ?? "Sekarang",
      }));
    }

    // Legacy: ministry (string tunggal)
    const legacyStr = (author as any).ministry ?? "";
    if (legacyStr) {
      return [{ name: legacyStr, from: (author as any).servedFrom ?? "", until: (author as any).servedUntil ?? "Sekarang" }];
    }

    return [];
  }, [author, ministries]);

  if (!author) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>
            {t("janjihidup.author")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">

          {/* ── Avatar + nama ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-serif font-bold text-xl"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {author.photoUrl ? (
                <img
                  src={author.photoUrl}
                  alt={author.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // fallback ke inisial kalau gambar gagal load
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.parentElement as HTMLElement).innerText = code.charAt(0);
                  }}
                />
              ) : (
                code.charAt(0)
              )}
            </div>
            <div>
              <p
                className="text-xs font-bold tracking-widest uppercase mb-1"
                style={{ color: "var(--gold)" }}
              >
                Inisial: {code}
              </p>
              {titleDisplay && (
                <p className="text-xs text-muted-foreground">{titleDisplay}</p>
              )}
              <p className="font-serif font-bold text-base mt-0.5" style={{ color: "var(--brand)" }}>
                {titleDisplay ? `${titleDisplay} ${author.name}` : author.name}
              </p>
            </div>
          </div>

          {/* ── Riwayat pelayanan ────────────────────────────────────────────── */}
          <div
            className="rounded-xl border border-border overflow-hidden"
            style={{ backgroundColor: "var(--brand-muted)" }}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <Church className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
              <p
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "var(--brand)" }}
              >
                {t("janjihidup.ministry")}
              </p>
            </div>

            <div className="px-4 py-3 flex flex-col gap-3">
              {serviceRows.length > 0 ? (
                serviceRows.map((row, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex items-start gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: "var(--gold)" }}
                      />
                      <span className="text-sm font-medium" style={{ color: "var(--brand)" }}>
                        {row.name}
                      </span>
                    </div>
                    {(row.from || row.until) && (
                      <p className="text-xs text-muted-foreground pl-3.5">
                        {row.from ? `${row.from} – ${row.until}` : row.until}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}