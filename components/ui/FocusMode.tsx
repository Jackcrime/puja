"use client";

import React from "react";
import { Minimize2 } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";
import { useAuthors } from "@/lib/hooks/useFirestoreData";

interface FocusModeProps {
  title: string;
  authorCode: string;
  body: string;
  prayer: string;
  onExit: () => void;
}

export function FocusMode({ title, authorCode, body, prayer, onExit }: FocusModeProps) {
  const { t } = useI18n();
  const { data: authors } = useAuthors();
  const author = authors[authorCode as keyof typeof authors];

  return (
    <div className="focus-mode-overlay">
      <div className="max-w-xl mx-auto">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-10">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>
            {t("janjihidup.focus")}
          </span>
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <Minimize2 className="h-4 w-4" />
            {t("janjihidup.exitFocus")}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Title */}
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl leading-tight" style={{ color: "var(--brand)" }}>
              {title}
            </h1>
            {author && (
              <p className="mt-2 text-sm text-muted-foreground">
                {author.title ? `${author.title} ` : ""}{author.name}
                {author.ministry ? ` · ${author.ministry}` : ""}
              </p>
            )}
          </div>

          {/* Body paragraphs */}
          <div className="space-y-6">
            {body.split("\n\n").map((para, i) => (
              <p key={i} className="text-foreground leading-loose text-lg">
                {para}
              </p>
            ))}
          </div>

          {/* Prayer */}
          <div className="border-t border-border pt-8">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>
              {t("janjihidup.prayer")}
            </p>
            <p className="font-serif text-xl italic leading-relaxed" style={{ color: "var(--brand)" }}>
              &ldquo;{prayer}&rdquo;
            </p>
          </div>

          {/* Exit footer */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={onExit}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted"
            >
              {t("janjihidup.exitFocus")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
