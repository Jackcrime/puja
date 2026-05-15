import React from "react";

interface Props {
  label: string;
  color?: "gold" | "brand";
}

export function SectionDivider({ label, color = "gold" }: Props) {
  const c = color === "brand" ? "var(--brand)" : "var(--gold)";
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
      <p className="text-xs font-bold tracking-widest uppercase px-3" style={{ color: c }}>{label}</p>
      <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
    </div>
  );
}
