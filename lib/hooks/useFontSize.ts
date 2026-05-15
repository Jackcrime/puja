"use client";

import { useState, useEffect } from "react";

type FontSize = "sm" | "md" | "lg" | "xl" | "xxl";

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<FontSize>("md");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gkpb_font_size") as FontSize;
      if (saved && ["sm","md","lg","xl", "xxl"].includes(saved)) {
        setFontSizeState(saved);
        document.documentElement.setAttribute("data-font-size", saved);
      }
    } catch {}
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    try {
      localStorage.setItem("gkpb_font_size", size);
    } catch {}
    document.documentElement.setAttribute("data-font-size", size);
  };

  return { fontSize, setFontSize };
}
