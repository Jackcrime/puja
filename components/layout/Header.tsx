"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sun, Moon, Type, ChevronDown, BookOpenText, ScrollText, Star, Info, Settings, Library } from "lucide-react";
import { useTheme } from "next-themes";
import { useFontSize } from "@/lib/hooks/useFontSize";
import { useI18n } from "@/lib/hooks/useI18n";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { lang, setLang, t } = useI18n();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);

  const navLinks = [
    { href: "/pujidanjanji", label: t("nav.pujidanjanji"), icon: BookOpenText },
    { href: "/janjihidup", label: t("nav.janjihidup"), icon: ScrollText },
    { href: "/pustaka-digital", label: t("nav.pustaka"), icon: Library },
    { href: "/ayat", label: t("nav.ayat"), icon: Star },
    { href: "/tentang", label: t("nav.tentang"), icon: Info },
    { href: "/pengaturan", label: "Pengaturan", icon: Settings },
  ];

  const fontSizes = [
    { value: "sm", label: "Kecil", cls: "text-xs" },
    { value: "md", label: "Normal", cls: "text-sm" },
    { value: "lg", label: "Besar", cls: "text-base" },
    { value: "xl", label: "Sangat Besar", cls: "text-lg" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-5xl mx-auto px-4 flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-border flex items-center justify-center">
              <Image src="/gkpb-logo.png" alt="GKPB" width={26} height={26} className="object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif font-semibold text-base text-foreground">Puji dan Janji</span>
              <span className="hidden sm:block text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>GKPB Sinode</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  pathname === link.href ? "font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                style={pathname === link.href ? { color: "var(--brand)", backgroundColor: "var(--brand-muted)" } : {}}
              >
                {/* Tablet: icon only */}
                {link.icon && (
                  <link.icon className={`h-4 w-4 ${
                    fontSize === "lg" || fontSize === "xl" ? "block" : "lg:hidden"
                  }`} />
                )}

                {/* Desktop: text only */}
                <span className={`${
                  fontSize === "lg" || fontSize === "xl" ? "hidden" : "hidden lg:inline"
                }`}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-0.5">
            {/* Language toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden hidden sm:flex">
              {(["id","en"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className="px-2.5 py-1 text-xs font-bold transition-colors"
                  style={lang === l
                    ? { backgroundColor: "var(--brand)", color: "white" }
                    : { color: "hsl(var(--muted-foreground))" }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Font Size */}
            <div className="relative hidden sm:block ml-1">
              <button onClick={() => setFontOpen(!fontOpen)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
                aria-label="Ukuran font"
              >
                <Type className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </button>
              {fontOpen && (
                <div className="absolute right-0 top-10 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[170px] z-50">
                  {fontSizes.map((f) => (
                    <button key={f.value} onClick={() => { setFontSize(f.value as any); setFontOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors ${fontSize === f.value ? "font-semibold" : ""}`}
                      style={fontSize === f.value ? { color: "var(--brand)" } : {}}
                    >
                      <span className={`font-serif font-bold ${f.cls}`}>A</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative ml-0.5"
              aria-label="Ganti tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all" />
              <Moon className="absolute inset-2 h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
            </button>

            {/* Mobile Menu */}
            {/* <button className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button> */}
          </div>
        </div>

        {/* Mobile Dropdown */}
        {/* {mobileOpen && (
          <div className="md:hidden border-t bg-card">
            <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href ? "font-semibold" : "text-muted-foreground"
                  }`}
                  style={pathname === link.href ? { color: "var(--brand)", backgroundColor: "var(--brand-muted)" } : {}}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-3 mt-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground px-3 mb-2 font-semibold uppercase tracking-wider">Bahasa</p>
                  <div className="flex gap-2 px-3">
                    {(["id","en"] as const).map((l) => (
                      <button key={l} onClick={() => setLang(l)}
                        className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors border"
                        style={lang === l ? { backgroundColor: "var(--brand)", color: "white", borderColor: "var(--brand)" } : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                      >
                        {l === "id" ? "Indonesia" : "English"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground px-3 mb-2 font-semibold uppercase tracking-wider">Ukuran Teks</p>
                  <div className="flex gap-2 px-3">
                    {fontSizes.map((f) => (
                      <button key={f.value} onClick={() => setFontSize(f.value as any)}
                        className="flex-1 py-2 rounded-lg border text-xs font-semibold transition-colors"
                        style={fontSize === f.value ? { color: "var(--brand)", borderColor: "var(--brand)", backgroundColor: "var(--brand-muted)" } : { borderColor: "hsl(var(--border))" }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )} */}
      </header>
      {fontOpen && <div className="fixed inset-0 z-40" onClick={() => setFontOpen(false)} />}
    </>
  );
}
