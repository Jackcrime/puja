"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Star, Users, ScrollText,
  Library, BookOpen, Megaphone, LogOut,
  Menu, ChevronRight, Shield, Church,
} from "lucide-react";
import { logout } from "@/lib/admin/auth";

const NAV_GROUPS = [
  {
    label: "Konten",
    items: [
      { href: "/admin/dashboard",   label: "Dashboard",       icon: LayoutDashboard },
      { href: "/admin/ayat",        label: "Ayat Emas",       icon: Star            },
      { href: "/admin/renungan",    label: "Renungan",        icon: ScrollText      },
      { href: "/admin/pengumuman",  label: "Pengumuman",      icon: Megaphone       },
      { href: "/admin/pustaka",     label: "Pustaka Digital", icon: Library         },
      { href: "/admin/perikop",     label: "Perikop",         icon: BookOpen        },
    ],
  },
  {
    label: "Pelayanan",
    items: [
      { href: "/admin/penulis",     label: "Penulis",         icon: Users           },
      { href: "/admin/ministries",  label: "Unit Pelayanan",  icon: Church          },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title:    string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const pathname     = usePathname();
  const router       = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); router.push("/admin/login"); };

  const SidebarContent = () => (
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
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}
                    onClick={() => setOpen(false)}
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
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-1">
          <ChevronRight className="h-4 w-4 rotate-180" /> Ke Aplikasi
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-card border-r border-border flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 flex flex-col md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif font-bold text-lg" style={{ color: "var(--brand)" }}>{title}</h1>
          </div>
          <button onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}