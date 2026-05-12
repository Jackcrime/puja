"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout }   from "@/components/admin/AdminLayout";
import { AdminGuard }    from "@/components/admin/AdminGuard";
import { useAyatKhusus, type AyatKhusus, type AyatKhususHarian } from "@/lib/hooks/useFirestoreData";
import { Loader2, Save, Calendar, Star, Sun, Shuffle, Plus, X, Pencil, Check } from "lucide-react";

const BULAN_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1" />
  );
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={3}
      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none" />
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border" style={{ backgroundColor: "var(--brand-muted)" }}>
        <Icon className="h-4 w-4" style={{ color: "var(--brand)" }} />
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--brand)" }}>{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Ayat Harian Row ─────────────────────────────────────────────────────────
function HarianRow({
  item, index, onEdit, onRemove,
}: {
  item: AyatKhususHarian; index: number;
  onEdit: (i: number, val: AyatKhususHarian) => void;
  onRemove: (i: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(item);

  const save = () => { onEdit(index, draft); setEditing(false); };

  if (editing) {
    return (
      <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/30">
        <input type="text" value={draft.reference}
          onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
          placeholder="Filipi 4:13"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        <textarea value={draft.text} rows={2}
          onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
          placeholder="Teks ayat..."
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
        <div className="flex gap-2">
          <button onClick={save}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--brand)" }}>
            <Check className="h-3.5 w-3.5" /> Simpan
          </button>
          <button onClick={() => { setDraft(item); setEditing(false); }}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 border border-border rounded-xl px-4 py-3 bg-card">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{item.reference}</p>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.text}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onRemove(index)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminAyatKhusus() {
  const { data, loading, save } = useAyatKhusus();
  const [form, setForm]   = useState<AyatKhusus>(data);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [newHarian, setNewHarian] = useState<AyatKhususHarian>({ reference: "", text: "" });
  const [showAddHarian, setShowAddHarian] = useState(false);

  useEffect(() => { if (!loading) setForm(data); }, [loading, data]);

  const setTahun  = (key: string, val: string | number) =>
    setForm((f) => ({ ...f, tahun: { ...f.tahun!, [key]: val } as any }));

  const setMinggu = (key: string, val: string) =>
    setForm((f) => ({ ...f, minggu: { ...f.minggu!, [key]: val } }));

  const setBulan = (month: string, key: "reference" | "text", val: string) =>
    setForm((f) => ({
      ...f,
      bulan: { ...f.bulan, [month]: { ...(f.bulan?.[month] ?? { reference: "", text: "" }), [key]: val } },
    }));

  // Harian helpers
  const harianList = form.harian ?? [];

  const addHarian = () => {
    if (!newHarian.reference.trim()) return;
    setForm((f) => ({ ...f, harian: [...(f.harian ?? []), newHarian] }));
    setNewHarian({ reference: "", text: "" });
    setShowAddHarian(false);
  };

  const editHarian = (i: number, val: AyatKhususHarian) =>
    setForm((f) => ({ ...f, harian: (f.harian ?? []).map((h, idx) => idx === i ? val : h) }));

  const removeHarian = (i: number) =>
    setForm((f) => ({ ...f, harian: (f.harian ?? []).filter((_, idx) => idx !== i) }));

  // Preview ayat harian hari ini
  const todayHarian = harianList.length > 0
    ? harianList[Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000) % harianList.length]
    : null;

  const handleSave = async () => {
    setSaving(true);
    await save(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const SaveBtn = () => (
    <button onClick={handleSave} disabled={saving}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
      style={{ backgroundColor: "var(--brand)" }}>
      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
        : saved ? <><Save className="h-4 w-4" /> Tersimpan ✓</>
        : <><Save className="h-4 w-4" /> Simpan Semua</>}
    </button>
  );

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout title="Ayat Khusus">
          <div className="flex items-center gap-3 text-muted-foreground py-10">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat dari Firestore...
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout title="Ayat Khusus">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">Kelola ayat tahun, minggu, harian, dan 12 bulan.</p>
          <SaveBtn />
        </div>

        <div className="space-y-5">
          {/* Ayat Tahun */}
          <SectionCard icon={Star} title="Ayat Tahun">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Tahun">
                <input type="number" value={form.tahun?.year ?? new Date().getFullYear()}
                  onChange={(e) => setTahun("year", Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none" />
              </Field>
              <div className="col-span-2">
                <Field label="Referensi">
                  <Input value={form.tahun?.reference ?? ""} onChange={(v) => setTahun("reference", v)} placeholder="Wahyu 21:5" />
                </Field>
              </div>
            </div>
            <Field label="Teks Ayat">
              <Textarea value={form.tahun?.text ?? ""} onChange={(v) => setTahun("text", v)} placeholder="Lihatlah, Aku menjadikan segala sesuatu baru!" />
            </Field>
          </SectionCard>

          {/* Ayat Minggu */}
          <SectionCard icon={Sun} title="Ayat Minggu Ini">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Referensi">
                <Input value={form.minggu?.reference ?? ""} onChange={(v) => setMinggu("reference", v)} placeholder="2 Korintus 5:17" />
              </Field>
              <Field label="Tanggal (opsional)">
                <input type="date" value={form.minggu?.date ?? ""}
                  onChange={(e) => setMinggu("date", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none" />
              </Field>
            </div>
            <Field label="Teks Ayat">
              <Textarea value={form.minggu?.text ?? ""} onChange={(v) => setMinggu("text", v)} placeholder="Siapa yang ada di dalam Kristus, ia adalah ciptaan baru..." />
            </Field>
          </SectionCard>

          {/* Ayat Harian */}
          <SectionCard icon={Shuffle} title={`Ayat Harian — Pool (${harianList.length} ayat)`}>
            {/* Preview hari ini */}
            {todayHarian && (
              <div className="px-4 py-3 rounded-xl border border-border bg-muted/30">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--gold)" }}>Tampil Hari Ini</p>
                <p className="text-xs font-bold mb-0.5" style={{ color: "var(--brand)" }}>{todayHarian.reference}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{todayHarian.text}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Ayat dipilih otomatis berdasarkan hari dalam setahun. Semakin banyak pool, semakin bervariasi.
            </p>

            {/* List */}
            <div className="space-y-2">
              {harianList.map((item, i) => (
                <HarianRow key={i} item={item} index={i} onEdit={editHarian} onRemove={removeHarian} />
              ))}
            </div>

            {/* Add new */}
            {showAddHarian ? (
              <div className="border border-border rounded-xl p-3 space-y-2 bg-muted/20">
                <input type="text" value={newHarian.reference}
                  onChange={(e) => setNewHarian((d) => ({ ...d, reference: e.target.value }))}
                  placeholder="Filipi 4:13"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                <textarea value={newHarian.text} rows={2}
                  onChange={(e) => setNewHarian((d) => ({ ...d, text: e.target.value }))}
                  placeholder="Teks ayat..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <button onClick={addHarian} disabled={!newHarian.reference.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--brand)" }}>
                    <Plus className="h-3.5 w-3.5" /> Tambah
                  </button>
                  <button onClick={() => { setShowAddHarian(false); setNewHarian({ reference: "", text: "" }); }}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddHarian(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border hover:bg-muted transition-colors w-full justify-center"
                style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
                <Plus className="h-3.5 w-3.5" /> Tambah Ayat ke Pool
              </button>
            )}
          </SectionCard>

          {/* Ayat 12 Bulan */}
          <SectionCard icon={Calendar} title="Ayat 12 Bulan">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BULAN_NAMES.map((name, idx) => {
                const key   = String(idx + 1);
                const entry = form.bulan?.[key] ?? { reference: "", text: "" };
                return (
                  <div key={key} className="border border-border rounded-xl p-4 space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>{name}</p>
                    <Input value={entry.reference} onChange={(v) => setBulan(key, "reference", v)} placeholder="Yohanes 3:16" />
                    <Textarea value={entry.text} onChange={(v) => setBulan(key, "text", v)} placeholder="Teks ayat..." />
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 flex justify-end">
          <SaveBtn />
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}