"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Heart, BookOpen, Shield, Globe, Mail, Phone, MapPin, ChevronRight, Users, ChevronDown, ChevronUp, Headphones, Cpu, Edit3 } from "lucide-react";
import { PUBLICATION_INFO, GKPB_INFO } from "@/lib/mockData";
import { useAuthors } from "@/lib/hooks/useFirestoreData";
import { useI18n } from "@/lib/hooks/useI18n";

export default function Tentang() {
  const { t } = useI18n();
  const { data: AUTHORS } = useAuthors();
  const authorEntries = Object.entries(AUTHORS);
  const [authorsExpanded, setAuthorsExpanded] = useState(false);
  const visibleAuthors = authorsExpanded ? authorEntries : authorEntries.slice(0, 8);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6 space-y-4">

        {/* Logo / Hero */}
        <div className="flex flex-col items-center text-center bg-card border border-border rounded-xl p-6">
          <div className="w-20 h-20 rounded-full bg-white border flex items-center justify-center mb-5">
            <Image src="/gkpb-logo.png" alt="Logo GKPB" width={70} height={70} className="object-contain" />
          </div>
          <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: "var(--brand)" }}>Puji dan Janji</h1>
          <p className="text-sm text-muted-foreground mb-1">Versi Digital — Sinode GKPB</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Versi Beta 1.2 · 2026
          </div>
          <div className="mt-4 pt-4 border-t border-border w-full">
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>Tema GKPB 2026</p>
            <p className="font-serif font-semibold" style={{ color: "var(--brand)" }}>&ldquo;{GKPB_INFO.theme2026}&rdquo;</p>
            <p className="text-xs text-muted-foreground mt-1 italic">{GKPB_INFO.subtheme2026}</p>
          </div>
        </div>

        {/* Publication Info */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="h-0.5" style={{ backgroundColor: "var(--brand)" }} />
          <div className="p-5">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("tentang.publication")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Puji & Janji */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "var(--brand-muted)" }}>
                <p className="font-serif font-bold mb-3" style={{ color: "var(--brand)" }}>Puji dan Janji</p>
                <table className="w-full text-sm">
                  <tbody className="space-y-1">
                    {[
                      [t("tentang.edition"), PUBLICATION_INFO.pujidanjanji.edition],
                      [t("tentang.year"), PUBLICATION_INFO.pujidanjanji.year],
                      [t("tentang.color"), PUBLICATION_INFO.pujidanjanji.color],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td className="text-muted-foreground pr-3 py-0.5 w-20">{k}</td>
                        <td className="font-semibold">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Janji Hidup */}
              <div className="rounded-xl p-4" style={{ backgroundColor: "var(--gold-muted)" }}>
                <p className="font-serif font-bold mb-3" style={{ color: "var(--brand)" }}>Janji Hidup</p>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      [t("tentang.period"), PUBLICATION_INFO.janjihidup.period],
                      [t("tentang.editor"), PUBLICATION_INFO.janjihidup.editor],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td className="text-muted-foreground pr-3 py-0.5 align-top w-20">{k}</td>
                        <td className="font-semibold leading-snug">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credits */}
            <div className="mt-4 space-y-2">
              {[
                { icon: Edit3, label: t("tentang.pic"), value: PUBLICATION_INFO.janjihidup.pic },
                { icon: Headphones, label: t("tentang.audio"), value: PUBLICATION_INFO.janjihidup.audio },
                { icon: Cpu, label: t("tentang.madeBy"), value: PUBLICATION_INFO.janjihidup.madeBy },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 text-sm">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
                  <div>
                    <span className="text-muted-foreground">{label}: </span>
                    <span className="font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Authors */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("tentang.authors")}</p>
          </div>
          <div className="divide-y divide-border">
            {visibleAuthors.map(([code, author]) => (
              <div key={code} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>
                    {author.photoUrl
                      ? <img src={author.photoUrl} alt={author.name} className="w-full h-full object-cover" />
                      : code.charAt(0)
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug text-foreground truncate">
                      {author.title ? `${author.title}. ${author.name}` : author.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{author.ministry}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "var(--brand-muted)", color: "var(--brand)" }}>
                  {code}
                </span>
              </div>
            ))}
          </div>
          {authorEntries.length > 8 && (
            <button
              onClick={() => setAuthorsExpanded(!authorsExpanded)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors"
              style={{ color: "var(--brand)" }}
            >
              {authorsExpanded ? (
                <><ChevronUp className="h-4 w-4" /> Tampilkan lebih sedikit</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> Lihat semua {authorEntries.length} penulis</>
              )}
            </button>
          )}
        </div>

        {/* Visi Misi */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("tentang.visi")}</p>
          </div>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--brand)" }}>VISI</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{GKPB_INFO.visi}</p>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--brand)" }}>MISI</p>
          <div className="space-y-2">
            {GKPB_INFO.misi.map((m, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5" style={{ backgroundColor: "var(--brand)" }}>{i + 1}</div>
                <p className="text-muted-foreground leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("tentang.features")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Bacaan Alkitab harian terpandu",
              "Renungan Janji Hidup setiap hari",
              "Perikop — judul bagian Alkitab",
              "Profil penulis renungan",
              "Audio renungan harian",
              "Mode fokus untuk membaca",
              "Simpan & salin ayat favorit",
              "Ayat Emas per kategori",
              "Pustaka Digital 12+ dokumen",
              "Pratinjau dokumen sebelum unduh",
              "Pengaturan ukuran teks",
              "Dark mode & light mode",
              "Tersedia dalam ID & EN",
              "Bisa diinstal (PWA)",
              "Bekerja tanpa internet",
              "Cetak & bagikan renungan",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--gold)" }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("tentang.privacy")}</p>
          </div>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>Aplikasi ini <strong className="font-semibold text-foreground">tidak mengumpulkan data pribadi</strong> apapun. Tidak ada akun, tidak ada pelacakan, tidak ada iklan.</p>
            <p>Preferensi seperti ukuran teks, bahasa, dan simpanan ayat hanya tersimpan di perangkat Anda sendiri dan tidak dikirim ke server manapun.</p>
            <p>Seluruh konten dapat diakses tanpa koneksi internet setelah diinstal sebagai aplikasi (PWA).</p>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("tentang.contact")}</p>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { icon: MapPin, label: PUBLICATION_INFO.contact.address },
              { icon: Phone, label: PUBLICATION_INFO.contact.phone, href: `tel:${PUBLICATION_INFO.contact.phone.replace(/\s/g,"")}` },
              { icon: Mail, label: PUBLICATION_INFO.contact.email, href: `mailto:${PUBLICATION_INFO.contact.email}` },
              { icon: Globe, label: PUBLICATION_INFO.contact.website, href: `https://${PUBLICATION_INFO.contact.website}` },
            ].map(({ icon: Icon, label, href }) => (
              href ? (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>{label}</span>
                </a>
              ) : (
                <div key={label} className="flex items-start gap-3 text-muted-foreground">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>{label}</span>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground py-2">
          <p>Dikelola oleh TIM IT Kantor Sinode GKPB</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} Sinode Gereja Kristen Protestan di Bali</p>
          <a href="https://pujidanjanji.balichurchsynod.org/kebijakan-privasi" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline hover:text-foreground">Kebijakan Privasi</a>
        </div>
      </div>
    </AppLayout>
  );
}