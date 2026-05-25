"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import {
  useTentangInfoAdmin,
  DEFAULT_TENTANG,
  type TentangInfo,
  type SocialLink,
} from "@/lib/hooks/useTentangInfo";
import {
  Info, Heart, BookOpen, Globe, Phone, Mail, MapPin,
  Plus, Trash2, Save, GripVertical, X, Instagram,
  Youtube, Facebook, Link as LinkIcon,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ElementType> = {
  hero:       Info,
  tema:       BookOpen,
  publikasi:  BookOpen,
  kontak:     Globe,
  visimisi:   Heart,
  socials:    Globe,
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Instagram: Instagram,
  YouTube:   Youtube,
  Facebook:  Facebook,
};

function SectionHeader({ icon: Icon, label, color = "var(--brand)" }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
    </div>
  );
}

function Field({
  label, value, onChange, multiline = false, placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  const cls = "w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand transition-all";
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} rows={3}
          className={`${cls} resize-none leading-relaxed`}
        />
      ) : (
        <input
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

// ─── Misi Editor ──────────────────────────────────────────────────────────────

function MisiEditor({ misi, onChange }: { misi: string[]; onChange: (m: string[]) => void }) {
  const set   = (i: number, v: string) => { const a = [...misi]; a[i] = v; onChange(a); };
  const add   = () => onChange([...misi, ""]);
  const remove = (i: number) => onChange(misi.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Poin Misi
        </label>
        <button
          onClick={add}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{ color: "var(--brand)", backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)" }}
        >
          <Plus className="h-3 w-3" /> Tambah
        </button>
      </div>
      <div className="space-y-2">
        {misi.map((m, i) => (
          <div key={i} className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-2.5 shrink-0" />
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-2 shrink-0"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {i + 1}
            </div>
            <textarea
              value={m}
              onChange={(e) => set(i, e.target.value)}
              rows={2}
              className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {misi.length > 1 && (
              <button onClick={() => remove(i)} className="p-1.5 mt-1.5 rounded-lg text-red-400 hover:bg-red-50 shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Socials Editor ───────────────────────────────────────────────────────────

const PLATFORM_OPTIONS = ["Instagram", "YouTube", "Facebook", "X (Twitter)", "TikTok", "WhatsApp", "Telegram", "Website", "Lainnya"];

function SocialsEditor({ socials, onChange }: { socials: SocialLink[]; onChange: (s: SocialLink[]) => void }) {
  const set    = (i: number, key: keyof SocialLink, v: string) => {
    const a = [...socials]; a[i] = { ...a[i], [key]: v }; onChange(a);
  };
  const add    = () => onChange([...socials, { platform: "Instagram", url: "", handle: "" }]);
  const remove = (i: number) => onChange(socials.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Media Sosial
        </label>
        <button
          onClick={add}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{ color: "var(--brand)", backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)" }}
        >
          <Plus className="h-3 w-3" /> Tambah
        </button>
      </div>

      {socials.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-xl">
          Belum ada medsos. Klik Tambah untuk menambahkan.
        </p>
      ) : (
        <div className="space-y-3">
          {socials.map((s, i) => {
            const PlatIcon = PLATFORM_ICONS[s.platform] ?? LinkIcon;
            return (
              <div key={i} className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatIcon className="h-3.5 w-3.5" style={{ color: "var(--brand)" }} />
                    <select
                      value={s.platform}
                      onChange={(e) => set(i, "platform", e.target.value)}
                      className="bg-transparent text-sm font-semibold focus:outline-none"
                      style={{ color: "var(--brand)" }}
                    >
                      {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <button onClick={() => remove(i)} className="p-1 rounded-lg text-red-400 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={s.handle} onChange={(e) => set(i, "handle", e.target.value)}
                    placeholder="@handle / nama"
                    className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                  <input
                    value={s.url} onChange={(e) => set(i, "url", e.target.value)}
                    placeholder="https://..."
                    className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <SectionHeader icon={icon} label={title} color="var(--gold)" />
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminTentang() {
  const { data, loading, save } = useTentangInfoAdmin();
  const [form,   setForm]   = useState<TentangInfo>(DEFAULT_TENTANG);
  const [saving, setSaving] = useState(false);
  const [dirty,  setDirty]  = useState(false);

  // Sync form saat data dari Firestore masuk
  useEffect(() => {
    if (!loading) { setForm(data); setDirty(false); }
  }, [data, loading]);

  const set = (key: keyof TentangInfo, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await save(form);
    setSaving(false);
    setDirty(false);
  };

  return (
    <AdminGuard>
      <AdminLayout title="Tentang">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Info className="h-4 w-4" style={{ color: "var(--gold)" }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--gold)" }}>Kelola</p>
              </div>
              <h1 className="text-xl font-bold font-serif" style={{ color: "var(--brand)" }}>Tentang Aplikasi</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{ backgroundColor: "var(--brand)" }}
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>

          {dirty && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 font-medium">
              Ada perubahan yang belum disimpan.
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <div key={i} className="h-40 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Hero */}
              <SectionCard title="Info Aplikasi" icon={Info}>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Nama Aplikasi" value={form.appName}    onChange={(v) => set("appName", v)} />
                  <Field label="Versi"          value={form.appVersion} onChange={(v) => set("appVersion", v)} placeholder="1.2.0" />
                  <Field label="Tahun"          value={form.appYear}    onChange={(v) => set("appYear", v)} placeholder="2026" />
                </div>
              </SectionCard>

              {/* Tema GKPB */}
              <SectionCard title="Tema GKPB" icon={BookOpen}>
                <Field label="Tema Tahun"    value={form.theme}    onChange={(v) => set("theme", v)} />
                <Field label="Sub-tema"      value={form.subtheme} onChange={(v) => set("subtheme", v)} />
              </SectionCard>

              {/* Publikasi */}
              <SectionCard title="Info Publikasi" icon={BookOpen}>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--brand)" }}>Puji dan Janji</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Edisi"  value={form.pjEdition} onChange={(v) => set("pjEdition", v)} />
                  <Field label="Tahun"  value={form.pjYear}    onChange={(v) => set("pjYear", v)} />
                  <Field label="Warna"  value={form.pjColor}   onChange={(v) => set("pjColor", v)} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider mt-2" style={{ color: "var(--brand)" }}>Janji Hidup</p>
                <Field label="Periode"  value={form.jhPeriod}  onChange={(v) => set("jhPeriod", v)} />
                <Field label="Editor"   value={form.jhEditor}  onChange={(v) => set("jhEditor", v)} />
                <Field label="Penanggung Jawab" value={form.jhPic} onChange={(v) => set("jhPic", v)} multiline />
                <Field label="Audio"    value={form.jhAudio}   onChange={(v) => set("jhAudio", v)} />
                <Field label="Dibuat Oleh" value={form.jhMadeBy} onChange={(v) => set("jhMadeBy", v)} />
              </SectionCard>

              {/* Kontak */}
              <SectionCard title="Kontak" icon={Globe}>
                <Field label="Alamat" value={form.address} onChange={(v) => set("address", v)} multiline />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Telepon" value={form.phone}   onChange={(v) => set("phone", v)} />
                  <Field label="Email"   value={form.email}   onChange={(v) => set("email", v)} />
                </div>
                <Field label="Website" value={form.website} onChange={(v) => set("website", v)} />
              </SectionCard>

              {/* Visi Misi */}
              <SectionCard title="Visi & Misi" icon={Heart}>
                <Field label="Visi" value={form.visi} onChange={(v) => set("visi", v)} multiline />
                <MisiEditor misi={form.misi} onChange={(m) => set("misi", m)} />
              </SectionCard>

              {/* Medsos */}
              <SectionCard title="Media Sosial" icon={Globe}>
                <SocialsEditor socials={form.socials ?? []} onChange={(s) => set("socials", s)} />
              </SectionCard>
            </>
          )}

        </div>
      </AdminLayout>
    </AdminGuard>
  );
}