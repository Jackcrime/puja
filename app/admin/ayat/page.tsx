"use client";

import React, { useState } from "react";
import { AdminLayout }     from "@/components/admin/AdminLayout";
import { AdminGuard }      from "@/components/admin/AdminGuard";
import { AyatKategoriTab } from "@/components/admin/ayat/AyatKategoriTab";
import { AyatDWMYTab }     from "@/components/admin/ayat/AyatDWMYTab";
import { BacaanTab }       from "@/components/admin/ayat/BacaanTab";
import { Star, CalendarDays, BookOpen } from "lucide-react";

const TABS = [
  {
    id:    "kategori" as const,
    label: "Ayat Kategori",
    icon:  Star,
    desc:  "Kelola ayat berdasarkan kategori (Tuntunan, Iman, Kasih, dll.)",
  },
  {
    id:    "dwmy" as const,
    label: "DWMY",
    icon:  CalendarDays,
    desc:  "Ayat Day / Week / Month / Year — pilih langsung dari Alkitab",
  },
  {
    id:    "bacaan" as const,
    label: "Bacaan & Perikop",
    icon:  BookOpen,
    desc:  "Kelola bacaan Alkitab beserta perikop terkait (cross-reference)",
  },
];

type TabId = "kategori" | "dwmy" | "bacaan";

export default function AdminAyatPage() {
  const [activeTab, setActiveTab] = useState<TabId>("kategori");

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const TabIcon    = currentTab.icon;

  return (
    <AdminGuard>
      <AdminLayout title="Ayat">
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
            {currentTab.desc}
          </p>
        </div>

        {activeTab === "kategori" && <AyatKategoriTab />}
        {activeTab === "dwmy"     && <AyatDWMYTab />}
        {activeTab === "bacaan"   && <BacaanTab />}
      </AdminLayout>
    </AdminGuard>
  );
}