"use client";

import React, { useState, useMemo } from "react";
import { AdminLayout }    from "@/components/admin/AdminLayout";
import { AdminGuard }     from "@/components/admin/AdminGuard";
import { ConfirmDialog }  from "@/components/admin/ConfirmDialog";
import { FileUploader }   from "@/components/admin/FileUploader";
import {
  useDevotional, useAuthors, useBahanKhotbah, usePokokDoaHarian,
  type BahanKhotbah, type PokokDoa,
} from "@/lib/hooks/useFirestoreData";
import { deleteUploadThingFile } from "@/lib/uploadthing-client";
import { showToast } from "@/lib/utils/toast";
import {
  Save, Check, Eye, EyeOff, Loader2, Music2, X,
  BookOpen, FlameKindling, HandHeart,
  Plus, Trash2, GripVertical,
} from "lucide-react";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
      {children}
    </label>
  );
}

const INPUT_CLS = "w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1 resize-none";

function SaveButton({ saving, saved, onClick, label = "Simpan" }: {
  saving: boolean; saved: boolean; onClick: () => void; label?: string;
}) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
      style={{ backgroundColor: saved ? "#16a34a" : "var(--brand)" }}
    >
      {saving  ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
       : saved  ? <><Check className="h-4 w-4" /> Tersimpan!</>
       :          <><Save className="h-4 w-4" /> {label}</>}
    </button>
  );
}

// ─── Tab 1: Renungan Harian ────────────────────────────────────────────────────

function RenunganSection() {
  const { data, loading, update }             = useDevotional();
  const { data: authorsDict, loading: authLoading } = useAuthors();

  const [form,    setForm]    = useState<typeof data | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [preview, setPreview] = useState(false);

  const current = form ?? data;

  const authorOptions = useMemo(() => {
    if (authLoading) return [];
    return Object.entries(authorsDict as Record<string, any>).map(([code, a]) => ({
      value: code,
      label: `${a.title ? a.title + " " : ""}${a.name} (${code})`,
    }));
  }, [authorsDict, authLoading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await update(current);
      showToast.success("Renungan harian berhasil disimpan.");
    } catch {
      showToast.error("Gagal menyimpan renungan. Coba lagi.");
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...(f ?? data), [key]: value }));

  if (loading) return <div className="flex items-center gap-3 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" /> Memuat...</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-0.5 w-full" style={{ backgroundColor: "var(--brand)" }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Edit Renungan</p>
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">Live Firestore</span>
          </div>

          {/* Judul */}
          <div><FieldLabel>Judul Renungan</FieldLabel>
            <input type="text" value={String((current as any).title ?? "")} onChange={(e) => set("title", e.target.value)} className={INPUT_CLS} />
          </div>

          {/* Penulis */}
          <div>
            <FieldLabel>Penulis</FieldLabel>
            {authLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...</div>
            ) : (
              <select value={String((current as any).authorCode ?? "")} onChange={(e) => set("authorCode", e.target.value)} className={INPUT_CLS}>
                <option value="">— Pilih penulis —</option>
                {authorOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            )}
            <p className="text-xs text-muted-foreground mt-1">Tambah penulis baru di <a href="/admin/penulis" className="underline" style={{ color: "var(--brand)" }}>halaman Penulis</a>.</p>
          </div>

          {/* Audio */}
          <div>
            <FieldLabel>Audio Renungan</FieldLabel>
            {(current as any).audioUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <Music2 className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
                <div className="flex-1 min-w-0">
                  <audio controls src={(current as any).audioUrl} className="w-full h-8" />
                  <p className="text-xs text-muted-foreground mt-1 truncate">{(current as any).audioUrl}</p>
                </div>
                <button onClick={async () => { const url = (current as any).audioUrl; set("audioUrl", ""); if (url) await deleteUploadThingFile(url).catch(() => {}); }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <FileUploader endpoint="audioUploader" label="" accept="audio/mpeg,audio/wav,audio/ogg" currentUrl="" onUploadComplete={(res) => set("audioUrl", res.url)} />
            )}
            <p className="text-xs text-muted-foreground mt-1">MP3/WAV, maks 64 MB.</p>
          </div>

          {/* Isi */}
          <div><FieldLabel>Isi Renungan (paragraf dipisah baris kosong)</FieldLabel>
            <textarea rows={12} value={String((current as any).body ?? "")} onChange={(e) => set("body", e.target.value)} className={INPUT_CLS} />
          </div>

          {/* Doa */}
          <div><FieldLabel>Doa Penutup</FieldLabel>
            <textarea rows={3} value={String((current as any).prayer ?? "")} onChange={(e) => set("prayer", e.target.value)} className={INPUT_CLS} />
          </div>

          <div className="flex gap-2 pt-1">
            <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Simpan ke Firestore" />
            <button onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors">
              {preview ? <><EyeOff className="h-4 w-4" /> Tutup Pratinjau</> : <><Eye className="h-4 w-4" /> Pratinjau</>}
            </button>
          </div>
        </div>
      </div>

      {preview && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} />
          <div className="p-6">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>PRATINJAU</p>
            <h2 className="font-serif font-bold text-2xl mb-5" style={{ color: "var(--brand)" }}>{(current as any).title}</h2>
            <div className="space-y-4">
              {String((current as any).body ?? "").split("\n\n").map((para, i) => (
                <p key={i} className="text-foreground leading-relaxed">{para}</p>
              ))}
            </div>
            {(current as any).authorCode && (
              <p className="text-right text-sm text-muted-foreground italic mt-4">
                {(() => { const a = (authorsDict as any)[(current as any).authorCode]; return a ? `${a.title ? a.title + " " : ""}${a.name}` : `(${(current as any).authorCode})`; })()}
              </p>
            )}
            {(current as any).prayer && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>DOA</p>
                <p className="font-serif italic" style={{ color: "var(--brand)" }}>&ldquo;{(current as any).prayer}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Bahan Khotbah ─────────────────────────────────────────────────────

function BahanKhotbahSection() {
  const { data, loading, save } = useBahanKhotbah();

  const [form,   setForm]   = useState<BahanKhotbah | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const current: BahanKhotbah = form ?? data;
  const set = (key: keyof BahanKhotbah, value: any) =>
    setForm((f) => ({ ...(f ?? data), [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(current);
      showToast.success("Bahan Khotbah berhasil disimpan.");
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addPoin = () => set("poinUtama", [...current.poinUtama, { judul: "", isi: "" }]);
  const removePoin = (i: number) => set("poinUtama", current.poinUtama.filter((_, idx) => idx !== i));
  const updatePoin = (i: number, key: "judul" | "isi", val: string) =>
    set("poinUtama", current.poinUtama.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

  if (loading) return <div className="flex items-center gap-3 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" /> Memuat...</div>;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Meta */}
      <SectionCard title="Informasi Khotbah" icon={BookOpen}>
        <div><FieldLabel>Referensi Alkitab</FieldLabel>
          <input value={current.reference} onChange={(e) => set("reference", e.target.value)} className={INPUT_CLS} placeholder="mis. Lukas 24:36–49" />
        </div>
        <div><FieldLabel>Judul Khotbah</FieldLabel>
          <input value={current.title} onChange={(e) => set("title", e.target.value)} className={INPUT_CLS} />
        </div>
        <div><FieldLabel>Thema / Tema Sentral</FieldLabel>
          <input value={current.thema} onChange={(e) => set("thema", e.target.value)} className={INPUT_CLS} />
        </div>
      </SectionCard>

      {/* Pendahuluan */}
      <SectionCard title="Pendahuluan" icon={BookOpen}>
        <textarea rows={4} value={current.pendahuluan} onChange={(e) => set("pendahuluan", e.target.value)} className={INPUT_CLS} />
      </SectionCard>

      {/* Poin Utama */}
      <SectionCard title="Poin-Poin Utama" icon={FlameKindling}>
        <div className="space-y-3">
          {current.poinUtama.map((poin, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                    Poin {i + 1}
                  </span>
                </div>
                <button onClick={() => setDeleteTarget(i)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div><FieldLabel>Judul Poin</FieldLabel>
                <input value={poin.judul} onChange={(e) => updatePoin(i, "judul", e.target.value)} className={INPUT_CLS} />
              </div>
              <div><FieldLabel>Isi / Penjelasan</FieldLabel>
                <textarea rows={3} value={poin.isi} onChange={(e) => updatePoin(i, "isi", e.target.value)} className={INPUT_CLS} />
              </div>
            </div>
          ))}

          <button onClick={addPoin}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border hover:bg-muted transition-colors w-full justify-center"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
            <Plus className="h-3.5 w-3.5" /> Tambah Poin
          </button>
        </div>
      </SectionCard>

      {/* Penutup */}
      <SectionCard title="Penutup / Kesimpulan" icon={BookOpen}>
        <textarea rows={4} value={current.penutup} onChange={(e) => set("penutup", e.target.value)} className={INPUT_CLS} />
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Simpan Bahan Khotbah" />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Hapus Poin?"
        description={`Hapus Poin ${(deleteTarget ?? 0) + 1}: "${current.poinUtama[deleteTarget ?? 0]?.judul || "—"}"?`}
        onConfirm={() => { removePoin(deleteTarget!); setDeleteTarget(null); }}
      />
    </div>
  );
}

// ─── Tab 3: Pokok Doa Harian ──────────────────────────────────────────────────

const HARI_OPTIONS = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function PokokDoaSection() {
  const { data, loading, save } = usePokokDoaHarian();

  const [items,  setItems]  = useState<PokokDoa[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const current: PokokDoa[] = items ?? data;

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(current);
      showToast.success("Pokok Doa Harian berhasil disimpan.");
    } catch { showToast.error("Gagal menyimpan."); }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateItem = (i: number, key: keyof PokokDoa, val: string) =>
    setItems((prev) => (prev ?? data).map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const addItem = () =>
    setItems((prev) => [...(prev ?? data), { hari: "Minggu", topik: "", detail: "" }]);

  const removeItem = (i: number) =>
    setItems((prev) => (prev ?? data).filter((_, idx) => idx !== i));

  if (loading) return <div className="flex items-center gap-3 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" /> Memuat...</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <SectionCard title="Pokok Doa Harian" icon={HandHeart}>
        <p className="text-xs text-muted-foreground">Doa harian per hari dalam seminggu yang ditampilkan kepada jemaat.</p>
        <div className="space-y-3">
          {current.map((item, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-white" style={{ backgroundColor: "var(--brand)" }}>
                    {item.hari}
                  </span>
                </div>
                <button onClick={() => setDeleteTarget(i)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Hari</FieldLabel>
                  <select value={item.hari} onChange={(e) => updateItem(i, "hari", e.target.value)} className={INPUT_CLS}>
                    {HARI_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Topik Doa</FieldLabel>
                  <input value={item.topik} onChange={(e) => updateItem(i, "topik", e.target.value)} className={INPUT_CLS} />
                </div>
              </div>

              <div><FieldLabel>Detail / Panduan Doa</FieldLabel>
                <textarea rows={3} value={item.detail} onChange={(e) => updateItem(i, "detail", e.target.value)} className={INPUT_CLS} />
              </div>
            </div>
          ))}

          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border hover:bg-muted transition-colors w-full justify-center"
            style={{ color: "var(--brand)", borderColor: "var(--brand-border)" }}>
            <Plus className="h-3.5 w-3.5" /> Tambah Pokok Doa
          </button>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SaveButton saving={saving} saved={saved} onClick={handleSave} label="Simpan Pokok Doa" />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Hapus Pokok Doa?"
        description={`Hapus pokok doa "${current[deleteTarget ?? 0]?.topik || "—"}"?`}
        onConfirm={() => { removeItem(deleteTarget!); setDeleteTarget(null); }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "renungan"  as const, label: "Renungan Harian", icon: BookOpen },
  { id: "khotbah"   as const, label: "Bahan Khotbah",   icon: FlameKindling },
  { id: "pokdoa"    as const, label: "Pokok Doa",        icon: HandHeart },
] as const;

type TabId = typeof TABS[number]["id"];

export default function AdminRenungan() {
  const [activeTab, setActiveTab] = useState<TabId>("renungan");
  const TabIcon = TABS.find((t) => t.id === activeTab)!.icon;

  return (
    <AdminGuard>
      <AdminLayout title="Renungan">
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
            {activeTab === "renungan" && "Edit konten renungan harian, penulis, dan audio."}
            {activeTab === "khotbah"  && "Susun bahan khotbah mingguan — referensi, tema, poin, dan penutup."}
            {activeTab === "pokdoa"   && "Kelola pokok doa harian per hari dalam seminggu."}
          </p>
        </div>

        {activeTab === "renungan" && <RenunganSection />}
        {activeTab === "khotbah"  && <BahanKhotbahSection />}
        {activeTab === "pokdoa"   && <PokokDoaSection />}
      </AdminLayout>
    </AdminGuard>
  );
}