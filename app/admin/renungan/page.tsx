"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard }  from "@/components/admin/AdminGuard";
import {
  RenunganSection,
  MazmurMingguSection,
  BahanKhotbahSection,
  PokokDoaSection,
} from "@/components/admin/renungan";
import { BookOpen, BookMarked, FlameKindling, HandHeart } from "lucide-react";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  {
    id:          "renungan" as const,
    label:       "Renungan Harian",
    icon:        BookOpen,
    description: "Edit konten renungan harian, penulis, dan audio.",
  },
  {
    id:          "mazmur" as const,
    label:       "Mazmur Minggu",
    icon:        BookMarked,
    description: "Pilih Mazmur Minggu menggunakan pemilih ayat Alkitab.",
  },
  {
    id:          "khotbah" as const,
    label:       "Bahan Khotbah",
    icon:        FlameKindling,
    description: "Susun bahan khotbah mingguan — referensi, tema, poin, dan penutup.",
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
  const [activeTab, setActiveTab] = useState<TabId>("renungan");

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

        {/* Tab panels */}
        {activeTab === "renungan" && <RenunganSection />}
        {activeTab === "mazmur"   && <MazmurMingguSection />}
        {activeTab === "khotbah"  && <BahanKhotbahSection />}
        {activeTab === "pokdoa"   && <PokokDoaSection />}

      </AdminLayout>
    </AdminGuard>
  );
}