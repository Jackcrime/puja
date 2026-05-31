"use client";

import React, { useState } from "react";
import { Copy, Check, BookOpen, Share2 } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";
import { parseReference } from "@/lib/bible-books";
import { PerikopModal } from "@/components/ui/PerikopModal";
import { shareVerseToWhatsApp } from "@/lib/utils/share";

interface VerseCardProps {
  reference:    string;
  text:         string;
  label?:       string;
  bookTitle?:   string;
  date?:        string;
  id?:          string;
  accentColor?: "brand" | "gold";
  showPerikop?: boolean;
  noPerikop?:   boolean;
}

export function VerseCard({
  reference,
  text,
  label,
  bookTitle,
  date,
  accentColor = "gold",
  showPerikop = false,
  noPerikop   = false,
}: VerseCardProps) {
  const [copied,      setCopied]      = useState(false);
  const [perikopOpen, setPerikopOpen] = useState(false);
  const { t } = useI18n();

  const accent        = accentColor === "brand" ? "var(--brand)" : "var(--gold)";
  const canShowPerikop = showPerikop && !noPerikop;
  const parsed        = canShowPerikop ? parseReference(reference) : null;

  const copy = () => {
    navigator.clipboard?.writeText(`${reference}\n"${text}"`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWA = () => {
    shareVerseToWhatsApp({ reference, text, label });
  };

  return (
    <div className="border rounded-xl overflow-hidden flex flex-col bg-card" style={{ borderColor: "var(--border)" }}>
      {/* Accent stripe */}
      <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: accent }} />

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {label && (
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            {label}
          </p>
        )}
        {bookTitle && (
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            {bookTitle}
          </p>
        )}
        <p className="text-foreground leading-relaxed italic flex-1">&ldquo;{text}&rdquo;</p>
        <p className="font-serif font-semibold text-base" style={{ color: "var(--brand)" }}>{reference}</p>
        {date && <p className="text-xs text-muted-foreground -mt-1">{date}</p>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          {/* Copy */}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied
              ? <><Check className="h-3.5 w-3.5 text-green-600" /> {t("common.copied")}</>
              : <><Copy className="h-3.5 w-3.5" /> {t("common.copy")}</>}
          </button>

          {/* Share WhatsApp */}
          <button
            onClick={shareWA}
            title="Bagikan ke WhatsApp"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            WA
          </button>
        </div>

        {parsed && (
          <button
            onClick={() => setPerikopOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-muted"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Perikop (TB)
          </button>
        )}
      </div>

      {parsed && (
        <PerikopModal
          open={perikopOpen}
          onOpenChange={setPerikopOpen}
          bookSlug={parsed.book.slug}
          bookName={parsed.book.name}
          chapter={parsed.chapter}
          verseFrom={parsed.verseFrom}
          verseTo={parsed.verseTo}
        />
      )}
    </div>
  );
}
