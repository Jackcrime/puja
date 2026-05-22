"use client";

import React, { useState } from "react";
import { AdminLayout }               from "@/components/admin/AdminLayout";
import { AdminGuard }                from "@/components/admin/AdminGuard";
import { AyatKategoriTab }           from "@/components/admin/ayat/AyatKategoriTab";
import { AyatHarianMingguanTab }     from "@/components/admin/ayat/AyatHarianMingguanTab";
import { AyatBulanTahunTab }         from "@/components/admin/ayat/AyatBulanTahunTab";
import { AyatStatsPanel }            from "@/components/admin/ayat/AyatStatsPanel";
import { Star, CalendarDays, Calendar } from "lucide-react";

const TABS = [
  { id: "kategori"   as const, label: "Kategori",           icon: Star,         desc: "Kelola ayat kategori & Ayat Nats yang tampil di halaman renungan." },
  { id: "harian"     as const, label: "Harian & Mingguan",  icon: CalendarDays, desc: "Ayat per tanggal (harian) dan per Minggu — termasuk Mazmur Minggu." },
  { id: "bulantahun" as const, label: "Bulan & Tahun",      icon: Calendar,     desc: "Ayat 12 bulan & ayat tahun — pilih dari Alkitab atau import JSON." },
];

type TabId = typeof TABS[number]["id"];

export default function AdminAyatPage() {
  const [activeTab, setActiveTab] = useState<TabId>("kategori");

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const TabIcon    = currentTab.icon;

  return (
    <AdminGuard>
      <AdminLayout title="Ayat">
        {/* ── Tab bar + Statistik trigger ─────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab buttons */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border flex-wrap">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = id === activeTab;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={
                      active
                        ? { backgroundColor: "var(--brand)", color: "white" }
                        : { color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ── Statistik dropdown — mengisi ruang kosong di sebelah kanan tab ── */}
            <div className="ml-auto">
              <AyatStatsPanel />
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <TabIcon className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            {currentTab.desc}
          </p>
        </div>

        {activeTab === "kategori"   && <AyatKategoriTab />}
        {activeTab === "harian"     && <AyatHarianMingguanTab />}
        {activeTab === "bulantahun" && <AyatBulanTahunTab />}
      </AdminLayout>
    </AdminGuard>
  );
}