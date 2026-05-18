"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard }  from "@/components/admin/AdminGuard";
import {
  RenunganBacaanSection,
  MazmurKhotbahSection,
  PokokDoaSection,
  RenunganStatsPanel,
} from "@/components/admin/renungan";
import { BookOpen, BookMarked, HandHeart } from "lucide-react";

const TABS = [
  {
    id:          "renungan-bacaan" as const,
    label:       "Renungan & Bacaan",
    icon:        BookOpen,
    description: "Edit renungan harian, audio, penulis, dan bacaan Alkitab — per tanggal.",
  },
  {
    id:          "mazmur-khotbah" as const,
    label:       "Mazmur & Khotbah",
    icon:        BookMarked,
    description: "Pilih Mazmur Minggu dan Bahan Khotbah. Atur hari tampil termasuk hari raya Kristen.",
  },
  {
    id:          "pokdoa" as const,
    label:       "Pokok Doa",
    icon:        HandHeart,
    description: "Kelola pokok doa harian per hari dalam seminggu.",
  },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminRenungan() {
  const [activeTab,    setActiveTab]    = useState<TabId>("renungan-bacaan");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const activeTabDef = TABS.find((t) => t.id === activeTab)!;
  const TabIcon      = activeTabDef.icon;

  return (
    <AdminGuard>
      <AdminLayout title="Renungan">

        {/* Tab bar */}
        <div className="mb-6">
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit flex-wrap">
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

          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <TabIcon className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            {activeTabDef.description}
          </p>
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {activeTab === "renungan-bacaan" && <RenunganBacaanSection />}
            {activeTab === "mazmur-khotbah"  && <MazmurKhotbahSection onDateChange={setSelectedDate} />}
            {activeTab === "pokdoa"          && <PokokDoaSection />}
          </div>

          <div className="w-64 shrink-0 hidden lg:block sticky top-6">
            <RenunganStatsPanel selectedDate={selectedDate} />
          </div>
        </div>

      </AdminLayout>
    </AdminGuard>
  );
}
