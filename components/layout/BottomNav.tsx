"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpenText, ScrollText, Star, Library, Menu, Info, Settings } from "lucide-react";
import { useI18n } from "@/lib/hooks/useI18n";

// Import Sheet components kamu
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";   // sesuaikan path kalau berbeda

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const mainTabs = [
    { href: "/",             label: t("nav.beranda"),      icon: Home },
    { href: "/pujidanjanji", label: t("nav.bacaan"),       icon: BookOpenText },
    { href: "/janjihidup",   label: t("nav.janjihidup"),   icon: ScrollText },
    { href: "/ayat",         label: t("nav.ayat"),         icon: Star },
  ];
  
  const moreItems = [
    { href: "/pustaka-digital", label: t("nav.pustaka"),    icon: Library },
    { href: "/tentang",         label: t("nav.tentang"),    icon: Info },
    { href: "/pengaturan",      label: t("nav.pengaturan"), icon: Settings },
  ];

  const isMainActive = (href: string) => pathname === href;
  const isMoreActive = moreItems.some((item) => pathname === item.href);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border no-print"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16">
        {/* 5 Tab Utama */}
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isMainActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 
                transition-all duration-300
                ${isActive ? "text-[var(--brand)] -translate-y-1" : "text-muted-foreground"}
              `}
            >
              <Icon 
                className={`h-5 w-5 transition-all ${isActive ? "stroke-[2.8] scale-110" : "stroke-[1.6]"}`} 
              />
              <span className="text-[10px] font-semibold leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 
                transition-all duration-300
                ${isMoreActive ? "text-[var(--brand)] -translate-y-1" : "text-muted-foreground"}
              `}
            >
              <Menu className={`h-5 w-5 transition-all ${isMoreActive ? "stroke-[2.8] scale-110" : "stroke-[1.6]"}`} />
              <span className="text-[10px] font-semibold leading-none">{t("nav.lainnya")}</span>
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] pb-8">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl">{t("nav.menuLainnya")}</SheetTitle>
            </SheetHeader>

            <div className="grid gap-3 px-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-medium
                        transition-all active:scale-[0.985]
                        ${isActive 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-muted"
                        }
                      `}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{item.label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}