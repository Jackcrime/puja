"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpenText, ScrollText, Star, Settings } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const tabs = [
    { href: "/",              label: "Beranda",    icon: Home },
    { href: "/pujidanjanji",  label: "Bacaan",     icon: BookOpenText },
    { href: "/janjihidup",    label: t("nav.janjihidup"), icon: ScrollText },
    { href: "/ayat",          label: "Ayat",       icon: Star },
    { href: "/pengaturan",    label: "Pengaturan", icon: Settings },
  ];

  // Jangan tampilkan di halaman admin
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border no-print"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
              style={isActive ? { color: "var(--brand)" } : { color: "hsl(var(--muted-foreground))" }}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
              <span className="text-[10px] font-semibold leading-tight text-center">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
