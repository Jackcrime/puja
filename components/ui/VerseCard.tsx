"use client";

import React, { useState } from "react";
import { Bookmark, Copy, Check } from "lucide-react";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { useI18n } from "@/lib/hooks/useI18n";

interface VerseCardProps {
  reference: string;
  text: string;
  label?: string;
  date?: string;
  id?: string;
  accentColor?: "brand" | "gold";
}

export function VerseCard({ reference, text, label, date, id, accentColor = "gold" }: VerseCardProps) {
  const [copied, setCopied] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { t } = useI18n();
  const bookmarkId = id || reference;
  const bookmarked = isBookmarked(bookmarkId);

  const copy = () => {
    navigator.clipboard?.writeText(`${reference}\n"${text}"`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accent = accentColor === "brand" ? "var(--brand)" : "var(--gold)";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="h-0.5 w-full" style={{ backgroundColor: accent }} />
      <div className="p-5">
        {label && <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--gold)" }}>{label}</p>}
        <p className="font-serif font-semibold text-lg mb-3" style={{ color: "var(--brand)" }}>{reference}</p>
        <p className="text-foreground leading-relaxed italic">&ldquo;{text}&rdquo;</p>
        {date && <p className="text-xs text-muted-foreground mt-3">{date}</p>}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted">
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("common.copied") : t("common.copy")}
          </button>
          <button onClick={() => toggleBookmark(bookmarkId)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted"
            style={bookmarked ? { color: "var(--brand)" } : {}}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
            {bookmarked ? t("common.saved") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
