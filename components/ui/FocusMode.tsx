"use client";

import React from "react";
import { X, Minimize2 } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";

interface FocusModeProps {
  title: string;
  authorCode: string;
  body: string;
  prayer: string;
  onExit: () => void;
}

export function FocusMode({ title, body, prayer, onExit }: FocusModeProps) {
  const { t } = useI18n();

  return (
    <div className="focus-mode-overlay">
      {/* Exit button */}
      <div className="max-w-xl mx-auto">
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
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl leading-tight mb-2" style={{ color: "var(--brand)" }}>
              {title}
            </h1>
          </div>

          <div className="space-y-6">
            {body.split("\n\n").map((para, i) => (
              <p key={i} className="text-foreground leading-loose text-lg">
                {para}
              </p>
            ))}
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>
              {t("janjihidup.prayer")}
            </p>
            <p className="font-serif text-xl italic leading-relaxed" style={{ color: "var(--brand)" }}>
              &ldquo;{prayer}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
