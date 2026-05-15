"use client";

import React, { useState } from "react";
import { AdminLayout }        from "@/components/admin/AdminLayout";
import { AdminGuard }         from "@/components/admin/AdminGuard";
import { AyatKategoriTab }    from "@/components/admin/ayat/AyatKategoriTab";
import { AyatHarianTab }      from "@/components/admin/ayat/AyatHarianTab";
import { AyatMingguanTab }    from "@/components/admin/ayat/AyatMingguanTab";
import { AyatBulanTahunTab }  from "@/components/admin/ayat/AyatBulanTahunTab";
import { BacaanTab }          from "@/components/admin/ayat/BacaanTab";
import { Star, CalendarDays, Sun, Calendar, BookOpen, Save, Loader2, Check } from "lucide-react";
import { useAyatNats } from "@/lib/hooks/useFirestoreData";
import { showToast } from "@/lib/utils/toast";

const TABS = [
  { id: "kategori"   as const, label: "Kategori",    icon: Star,        desc: "Kelola ayat berdasarkan kategori (Tuntunan, Iman, Kasih, dll.)" },
  { id: "harian"     as const, label: "Harian",      icon: CalendarDays,desc: "Ayat per tanggal — siapkan hari ini & tanggal mendatang, import JSON." },
  { id: "mingguan"   as const, label: "Mingguan",    icon: Sun,         desc: "Ayat per minggu (per tanggal Minggu) — kelola & import JSON." },
  { id: "bulantahun" as const, label: "Bulan & Tahun", icon: Calendar,  desc: "Ayat 12 bulan & ayat tahun — pilih dari Alkitab atau import JSON." },
  { id: "bacaan"     as const, label: "Bacaan",      icon: BookOpen,    desc: "Kelola bacaan Alkitab beserta perikop terkait (cross-reference)." },
];

type TabId = typeof TABS[number]["id"];

// ─── Ayat Nats Card (persisten di atas semua tab) ─────────────────────────────

function AyatNatsCard() {
  const { data, loading, save } = useAyatNats();
  const [form,   setForm]   = useState<{ reference: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const current = form ?? data;

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(current);
      showToast.success("Ayat Nats berhasil disimpan.");
    } catch { showToast.error("Gagal menyimpan Ayat Nats."); }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4" style={{ color: "var(--gold, #b8860b)" }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold, #b8860b)" }}>Ayat Nats</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">Tampil di semua halaman</span>
        </div>
        {!loading && (
          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
          >
            {saving  ? <><Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...</>
             : saved  ? <><Check className="h-3 w-3" /> Tersimpan ✓</>
             :          <><Save className="h-3 w-3" /> Simpan</>}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-5 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 px-5 py-3">
          <input
            value={current.reference}
            onChange={(e) => setForm((f) => ({ ...(f ?? data), reference: e.target.value }))}
            placeholder="mis. Lukas 24:48"
            className="w-full sm:w-44 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none shrink-0"
          />
          <input
            value={current.text}
            onChange={(e) => setForm((f) => ({ ...(f ?? data), text: e.target.value }))}
            placeholder="Teks ayat nats..."
            className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}



export default function AdminAyatPage() {
  const [activeTab, setActiveTab] = useState<TabId>("kategori");

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const TabIcon    = currentTab.icon;

  return (
    <AdminGuard>
      <AdminLayout title="Ayat">
        <AyatNatsCard />
        <div className="mb-6">
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === activeTab;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={active
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

        {activeTab === "kategori"   && <AyatKategoriTab />}
        {activeTab === "harian"     && <AyatHarianTab />}
        {activeTab === "mingguan"   && <AyatMingguanTab />}
        {activeTab === "bulantahun" && <AyatBulanTahunTab />}
        {activeTab === "bacaan"     && <BacaanTab />}
      </AdminLayout>
    </AdminGuard>
  );
}