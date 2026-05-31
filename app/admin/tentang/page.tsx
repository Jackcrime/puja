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
  Plus, Trash2, Save, GripVertical, X,
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

// ─── Platform SVG Icons ───────────────────────────────────────────────────────
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const WebsiteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const LinkFallbackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
);

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Instagram:     InstagramIcon,
  YouTube:       YouTubeIcon,
  Facebook:      FacebookIcon,
  "X (Twitter)": XTwitterIcon,
  TikTok:        TikTokIcon,
  WhatsApp:      WhatsAppIcon,
  Telegram:      TelegramIcon,
  Website:       WebsiteIcon,
  Lainnya:       LinkFallbackIcon,
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
            const PlatIcon = PLATFORM_ICONS[s.platform] ?? LinkFallbackIcon;
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