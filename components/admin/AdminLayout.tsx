"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Star, Users, ScrollText,
  Library, Megaphone, LogOut,
  Menu, ChevronRight, Shield, Church,
  Sun, Moon, Bell, BellRing, X, ClipboardList, Info, Home, 
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { logout } from "@/lib/admin/auth";
import { NotificationSettings } from "@/components/ui/NotificationSettings";
import { loadSettings, initNotifications } from "@/lib/notifications";

// ─── Nav config ───────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: React.ElementType };

type NavGroup =
  | { type: "static"; items: NavItem[] }
  | { type: "collapsible"; label: string; icon: React.ElementType; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    type: "static",
    items: [
      { href: "/admin/dashboard", label: "Dashboard",       icon: LayoutDashboard },
    ],
  },
  {
    type: "collapsible",
    label: "Content",
    icon: Home,
    items: [
      { href: "/admin/ayat",      label: "Ayat",            icon: Star            },
      { href: "/admin/renungan",  label: "Renungan",        icon: ScrollText      },
      { href: "/admin/pustaka",   label: "Pustaka Digital", icon: Library         },
    ],
  },
  {
    type: "collapsible",
    label: "Publikasi",
    icon: Megaphone,
    items: [
      { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone    },
      { href: "/admin/patchnote",  label: "Patch Note", icon: ClipboardList },
    ],
  },
  {
    type: "collapsible",
    label: "Pelayanan",
    icon: Church,
    items: [
      { href: "/admin/penulis",    label: "Penulis",        icon: Users  },
      { href: "/admin/ministries", label: "Unit Pelayanan", icon: Church },
      { href: "/admin/tentang",    label: "Tentang",        icon: Info   },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(href: string, pathname: string) {
  return href === "/admin/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
}

function groupHasActive(items: NavItem[], pathname: string) {
  return items.some((item) => isActive(item.href, pathname));
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavLink({ href, label, icon: Icon, pathname, onClose }: NavItem & { pathname: string; onClose: () => void }) {
  const active = isActive(href, pathname);
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
      style={active
        ? { backgroundColor: "var(--brand)", color: "white" }
        : { color: "hsl(var(--muted-foreground))" }
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
    </Link>
  );
}

// ─── CollapsibleGroup ─────────────────────────────────────────────────────────

function CollapsibleGroup({
  label, icon: Icon, items, pathname, onClose,
}: { label: string; icon: React.ElementType; items: NavItem[]; pathname: string; onClose: () => void }) {
  const hasActive = groupHasActive(items, pathname);
  const [open, setOpen] = useState(hasActive);

  // Auto-expand kalau ada active item (misal navigasi langsung via URL)
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={hasActive
          ? { color: "var(--brand)" }
          : { color: "hsl(var(--muted-foreground))" }
        }
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="ml-3 mt-0.5 pl-3 border-l border-border space-y-0.5">
          {items.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

interface SidebarContentProps {
  pathname: string;
  onClose:  () => void;
  onLogout: () => void;
}

function SidebarContent({ pathname, onClose, onLogout }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-sm" style={{ color: "var(--brand)" }}>Admin Panel</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">GKPB Sinode</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {NAV_GROUPS.map((group, gi) => {
          if (group.type === "static") {
            return (
              <div key={gi} className="space-y-0.5 pb-2">
                {group.items.map((item) => (
                  <NavLink key={item.href} {...item} pathname={pathname} onClose={onClose} />
                ))}
              </div>
            );
          }
          return (
            <CollapsibleGroup
              key={gi}
              label={group.label}
              icon={group.icon}
              items={group.items}
              pathname={pathname}
              onClose={onClose}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Ke Aplikasi
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────

interface AdminLayoutProps {
  children: React.ReactNode;
  title:    string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, setTheme } = useTheme();

  const [open,         setOpen]         = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [now,          setNow]          = useState<Date | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initNotifications();
    setNotifEnabled(loadSettings().enabled);
  }, []);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleLogout = () => { logout(); router.push("/admin/login"); };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    toast.success(`Mode ${next === "dark" ? "Gelap" : "Terang"} diaktifkan`);
  };

  React.useEffect(() => {
    (window as any).showAdminToast = (message: string, type: "success" | "error" | "info" = "success") => {
      if (type === "success") toast.success(message);
      else if (type === "error") toast.error(message);
      else toast.info(message);
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-card border-r border-border flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent pathname={pathname} onClose={() => setOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col md:hidden">
            <SidebarContent pathname={pathname} onClose={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </>
      )}

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif font-bold text-lg" style={{ color: "var(--brand)" }}>{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Clock */}
            <div className="hidden md:flex flex-col items-end justify-center mr-2 border-r border-border pr-4">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground opacity-80">
                {now
                  ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
                  : "Memuat..."}
              </p>
              <p className="text-xs font-bold tracking-[0.1em] text-foreground">
                {now
                  ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\./g, ":")
                  : "--:--:--"}
              </p>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                title="Pengaturan Notifikasi"
              >
                {notifEnabled
                  ? <BellRing className="h-5 w-5" style={{ color: "var(--brand)" }} />
                  : <Bell className="h-5 w-5" />}
                {notifEnabled && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--brand)" }}
                  />
                )}
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
                  style={{ animation: "fadeUp 0.15s ease both" }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" style={{ color: "var(--brand)" }} />
                      <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Notifikasi</p>
                    </div>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <NotificationSettings onSettingsChange={(enabled) => setNotifEnabled(enabled)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}