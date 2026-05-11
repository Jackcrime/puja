"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, Megaphone } from "lucide-react";
import { ANNOUNCEMENT } from "@/lib/mockData";

export function Banner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("gkpb_banner_v2");
      if (!dismissed) setIsVisible(true);
    } catch {}
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    try { localStorage.setItem("gkpb_banner_v2", "1"); } catch {}
  };

  if (!isVisible) return null;

  return (
    <div className="w-full text-white text-sm" style={{ backgroundColor: "var(--brand)" }}>
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <Link href={ANNOUNCEMENT.link} className="font-medium truncate hover:underline">
            {ANNOUNCEMENT.text}
          </Link>
        </div>
        <button onClick={dismiss} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-0.5" aria-label="Tutup">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
