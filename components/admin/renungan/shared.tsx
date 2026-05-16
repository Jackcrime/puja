"use client";

import React from "react";
import { Save, Check, Loader2 } from "lucide-react";

export const INPUT_CLS =
  "w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none";

export function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-2 px-5 py-3 border-b border-border"
        style={{ backgroundColor: "var(--brand-muted)" }}
      >
        <Icon className="h-4 w-4" style={{ color: "var(--brand)" }} />
        <p
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--brand)" }}
        >
          {title}
        </p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="text-xs font-bold uppercase tracking-wider block mb-1.5"
      style={{ color: "var(--gold)" }}
    >
      {children}
    </label>
  );
}

export function SaveButton({
  saving,
  saved,
  onClick,
  label = "Simpan",
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
      style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
    >
      {saving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
        </>
      ) : saved ? (
        <>
          <Check className="h-4 w-4" /> Tersimpan!
        </>
      ) : (
        <>
          <Save className="h-4 w-4" /> {label}
        </>
      )}
    </button>
  );
}