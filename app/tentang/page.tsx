"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Heart, BookOpen, Shield, Globe, Mail, Phone, MapPin,
  Users, ChevronDown, ChevronUp, Headphones, Cpu, Edit3,
  Instagram, Youtube, Facebook, Link as LinkIcon,
} from "lucide-react";
import { useTentangInfoPublic } from "@/lib/hooks/useTentangInfo";
import { usePatchNotesPublic } from "@/lib/hooks/usePatchNotes";
import { useAuthors } from "@/lib/hooks/useFirestoreData";
import { useI18n } from "@/lib/hooks/useI18n";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Instagram, YouTube: Youtube, Facebook,
};

export default function Tentang() {
  const { t } = useI18n();
  const { data: info }    = useTentangInfoPublic();
  const { data: patches } = usePatchNotesPublic();
  const { data: AUTHORS } = useAuthors();

  const latestVersion  = patches[0]?.version ?? info.appVersion;
  const authorEntries  = Object.entries(AUTHORS);
  const [authorsExpanded, setAuthorsExpanded] = useState(false);
  const visibleAuthors = authorsExpanded ? authorEntries : authorEntries.slice(0, 8);

  const featureList: string[] = (t("tentang.featureList") as unknown as string[]) ?? [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-6 space-y-4">

        {/* Logo / Hero */}
        <div className="flex flex-col items-center text-center bg-card border border-border rounded-xl p-6">
          <div className="w-20 h-20 rounded-full bg-white border flex items-center justify-center mb-5">
            <Image src="/gkpb-logo.png" alt="Logo GKPB" width={70} height={70} className="object-contain" />
          </div>
          <h1 className="font-serif font-bold text-2xl mb-1" style={{ color: "var(--brand)" }}>{info.appName}</h1>
          <p className="text-sm text-muted-foreground mb-1">{t("tentang.digitalVersion")}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t("tentang.version")} {latestVersion} · {info.appYear}
          </div>
          {info.theme && (
            <div className="mt-4 pt-4 border-t border-border w-full">
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--gold)" }}>{t("tentang.gkpbTheme")}</p>
              <p className="font-serif font-semibold" style={{ color: "var(--brand)" }}>&ldquo;{info.theme}&rdquo;</p>
              {info.subtheme && <p className="text-xs text-muted-foreground mt-1 italic">{info.subtheme}</p>}
            </div>
          )}
        </div>

        {/* Publication Info */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="h-0.5" style={{ backgroundColor: "var(--brand)" }} />
          <div className="p-5">
            <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--gold)" }}>{t("tentang.publication")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: "var(--brand-muted)" }}>
                <p className="font-serif font-bold mb-3" style={{ color: "var(--brand)" }}>Puji dan Janji</p>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      [t("tentang.edition"), info.pjEdition],
                      [t("tentang.year"),    info.pjYear],
                      [t("tentang.color"),   info.pjColor],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td className="text-muted-foreground pr-3 py-0.5 w-20">{k}</td>
                        <td className="font-semibold">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: "var(--gold-muted)" }}>
                <p className="font-serif font-bold mb-3" style={{ color: "var(--brand)" }}>Janji Hidup</p>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      [t("tentang.period"), info.jhPeriod],
                      [t("tentang.editor"), info.jhEditor],
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

            <div className="mt-4 space-y-2">
              {[
                { icon: Edit3,      label: t("tentang.pic"),    value: info.jhPic },
                { icon: Headphones, label: t("tentang.audio"),  value: info.jhAudio },
                { icon: Cpu,        label: t("tentang.madeBy"), value: info.jhMadeBy },
              ].map(({ icon: Icon, label, value }) => (
                <div key={String(label)} className="flex items-start gap-3 text-sm">
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
                  <div className="relative w-8 h-8 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>
                    {author.photoUrl
                      ? <Image src={author.photoUrl} alt={author.name} fill sizes="48px" className="object-cover" />
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
              {authorsExpanded
                ? <><ChevronUp className="h-4 w-4" /> {t("tentang.showLess")}</>
                : <><ChevronDown className="h-4 w-4" /> {t("tentang.showAll").replace("{count}", String(authorEntries.length))}</>
              }
            </button>
          )}
        </div>

        {/* Visi Misi */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("tentang.visi")}</p>
          </div>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--brand)" }}>{t("tentang.visiLabel")}</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{info.visi}</p>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "var(--brand)" }}>{t("tentang.misiLabel")}</p>
          <div className="space-y-2">
            {info.misi.map((m, i) => (
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
            {Array.isArray(featureList) && featureList.map((f: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--gold)" }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Media Sosial */}
        {info.socials && info.socials.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4" style={{ color: "var(--gold)" }} />
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Media Sosial</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {info.socials.map((s, i) => {
                const Icon = PLATFORM_ICONS[s.platform] ?? LinkIcon;
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>{s.platform}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.handle}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>{t("tentang.privacy")}</p>
          </div>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>{t("tentang.privacyDesc").split(t("tentang.privacyNoData"))[0]}<strong className="font-semibold text-foreground">{t("tentang.privacyNoData")}</strong>{t("tentang.privacyDesc").split(t("tentang.privacyNoData"))[1] ?? ""}</p>
            <p>{t("tentang.privacyDesc2")}</p>
            <p>{t("tentang.privacyDesc3")}</p>
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
              { icon: MapPin, label: info.address },
              { icon: Phone,  label: info.phone,   href: `tel:${info.phone.replace(/\s/g,"")}` },
              { icon: Mail,   label: info.email,   href: `mailto:${info.email}` },
              { icon: Globe,  label: info.website, href: `https://${info.website}` },
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
          <p>{t("tentang.managedBy")}</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} {t("tentang.copyright")}</p>
          <a href="https://pujidanjanji.balichurchsynod.org/kebijakan-privasi" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline hover:text-foreground">{t("tentang.privacyPolicy")}</a>
        </div>

      </div>
    </AppLayout>
  );
}