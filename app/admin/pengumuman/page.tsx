"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAnnouncement } from "@/lib/hooks/useFirestoreData";
import { Megaphone, Save, Check, Loader2 } from "lucide-react";

export default function AdminPengumuman() {
  const { data, loading, update } = useAnnouncement();
  const [text, setText]   = useState("");
  const [link, setLink]   = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync local state when Firestore data loads
  React.useEffect(() => {
    if (!loading) { setText(data.text); setLink(data.link); }
  }, [loading, data]);

  const handleSave = async () => {
    setSaving(true);
    await update({ text, link });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminGuard>
      <AdminLayout title="Pengumuman">
        <div className="max-w-xl">
          {loading ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="h-4 w-4" style={{ color: "var(--gold)" }} />
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Banner Pengumuman</p>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">Live Firestore</span>
                </div>

                {/* Preview */}
                <div className="rounded-xl px-4 py-2.5 text-white text-sm flex items-center gap-2" style={{ backgroundColor: "var(--brand)" }}>
                  <Megaphone className="h-3.5 w-3.5 opacity-80 shrink-0" />
                  <span className="truncate">{text || "Teks pengumuman..."}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Teks Pengumuman *</label>
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>Link Tujuan</label>
                    <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/tentang"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
                    />
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                    : saved ? <><Check className="h-4 w-4" /> Tersimpan ke Firestore!</>
                    : <><Save className="h-4 w-4" /> Simpan ke Firestore</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
