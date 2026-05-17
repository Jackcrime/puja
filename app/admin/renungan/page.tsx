"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard }  from "@/components/admin/AdminGuard";
import {
  RenunganSection,
  MazmurKhotbahSection,
  PokokDoaSection,
  BacaanAlkitabSection,
  RenunganStatsPanel,
} from "@/components/admin/renungan";
import { BookOpen, BookMarked, HandHeart, ScrollText } from "lucide-react";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    id:          "renungan" as const,
    label:       "Renungan Harian",
    icon:        BookOpen,
    description: "Edit konten renungan harian, penulis, dan audio.",
  },
  {
    id:          "bacaan" as const,
    label:       "Bacaan Alkitab",
    icon:        ScrollText,
    description: "Kelola daftar bacaan Alkitab harian beserta cross-reference perikop terkait.",
  },
  {
    id:          "mazmur-khotbah" as const,
    label:       "Mazmur & Khotbah",
    icon:        BookMarked,
    description: "Pilih Mazmur Minggu dan Bahan Khotbah untuk minggu yang dipilih.",
  },
  {
    id:          "pokdoa" as const,
    label:       "Pokok Doa",
    icon:        HandHeart,
    description: "Kelola pokok doa harian per hari dalam seminggu.",
  },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRenungan() {
  const [activeTab,    setActiveTab]    = useState<TabId>("renungan");
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

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <TabIcon className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
            {activeTabDef.description}
          </p>
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-6 items-start">
          {/* ── Left: Tab content ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {activeTab === "renungan" && <RenunganSection />}
            {activeTab === "bacaan"   && <BacaanAlkitabSection />}
            {activeTab === "mazmur-khotbah" && <MazmurKhotbahSection onDateChange={setSelectedDate} />}
            {activeTab === "pokdoa"   && <PokokDoaSection />}
          </div>

          {/* ── Right: Stats panel ────────────────────────────────────────── */}
          <div className="w-64 shrink-0 hidden lg:block sticky top-6">
            <RenunganStatsPanel selectedDate={selectedDate} />
          </div>
        </div>

      </AdminLayout>
    </AdminGuard>
  );
}