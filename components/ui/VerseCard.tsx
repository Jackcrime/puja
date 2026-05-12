"use client";

import React, { useState } from "react";
import { Copy, Check, Highlighter, X } from "lucide-react";
import { useHighlights, HIGHLIGHT_COLORS, type HighlightColor } from "@/lib/hooks/useHighlights";
import { useI18n } from "@/lib/hooks/useI18n";

interface VerseCardProps {
  reference:    string;
  text:         string;
  label?:       string;
  date?:        string;
  id?:          string;
  accentColor?: "brand" | "gold";
  highlightable?: boolean;
}

export function VerseCard({
  reference, text, label, date, accentColor = "gold", highlightable = true,
}: VerseCardProps) {
  const [copied,      setCopied]      = useState(false);
  const [colorPicker, setColorPicker] = useState(false);
  const { setHighlight, removeHighlight, getHighlight } = useHighlights();
  const { t } = useI18n();

  const highlight    = getHighlight(reference);
  const isHighlighted = !!highlight;
  const accent       = accentColor === "brand" ? "var(--brand)" : "var(--gold)";

  const copy = () => {
    navigator.clipboard?.writeText(`${reference}\n"${text}"`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHighlight = (color: HighlightColor) => {
    setHighlight({ reference, text, label }, color);
    setColorPicker(false);
  };

  return (
    <div
      className="border rounded-xl overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isHighlighted ? HIGHLIGHT_COLORS[highlight.color].bg   : "var(--card)",
        borderColor:     isHighlighted ? HIGHLIGHT_COLORS[highlight.color].border : "var(--border)",
      }}
    >
      <div className="h-0.5 w-full transition-colors duration-300"
        style={{ backgroundColor: isHighlighted ? HIGHLIGHT_COLORS[highlight.color].border : accent }} />

      <div className="p-5">
        {label && (
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--gold)" }}>
            {label}
          </p>
        )}
        <p className="font-serif font-semibold text-lg mb-3" style={{ color: "var(--brand)" }}>{reference}</p>
        <p className="text-foreground leading-relaxed italic">&ldquo;{text}&rdquo;</p>
        {date && <p className="text-xs text-muted-foreground mt-3">{date}</p>}

        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/50 flex-wrap">
          {/* Copy */}
          <button onClick={copy}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-black/5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("common.copied") : t("common.copy")}
          </button>

          {/* Highlight */}
          {highlightable && (
            <div className="relative">
              {!colorPicker ? (
                <button onClick={() => setColorPicker(true)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors px-2.5 py-1.5 rounded-md hover:bg-black/5"
                  style={isHighlighted ? { color: HIGHLIGHT_COLORS[highlight.color].border } : { color: "var(--muted-foreground)" }}>
                  <Highlighter className="h-3.5 w-3.5" />
                  {isHighlighted ? HIGHLIGHT_COLORS[highlight.color].label : "Sorot"}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-black/5">
                  {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
                    <button key={color} onClick={() => handleHighlight(color)}
                      title={HIGHLIGHT_COLORS[color].label}
                      className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: HIGHLIGHT_COLORS[color].bg,
                        borderColor:     HIGHLIGHT_COLORS[color].border,
                        outline: highlight?.color === color ? `2px solid ${HIGHLIGHT_COLORS[color].border}` : "none",
                        outlineOffset: "2px",
                      }} />
                  ))}
                  {isHighlighted && (
                    <button onClick={(e) => { e.stopPropagation(); removeHighlight(reference); setColorPicker(false); }}
                      className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-red-100 transition-colors" title="Hapus sorotan">
                      <X className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  )}
                  <button onClick={() => setColorPicker(false)} className="text-xs text-muted-foreground ml-0.5">✕</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}