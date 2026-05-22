// components/VisitTracker.tsx
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageVisit } from "@/lib/hooks/useVisitStats";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    trackPageVisit();
  }, [pathname]);

  return null;
}