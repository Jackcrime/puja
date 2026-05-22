"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Devotional, AyatKhusus } from "@/lib/hooks/useFirestoreData";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IncompleteItem {
  id:       string;
  label:    string;
  detail?:  string;
  href:     string;
}

interface CollapseSectionProps {
  title:     string;
  accent:    string;
  items:     IncompleteItem[];
  loading:   boolean;
  editHref:  string;
  delay?:    number;
}

// ─── Month names ──────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

// ─── Collapsible Section ─────────────────────────────────────────────────────
function CollapseSection({ title, accent, items, loading, editHref, delay = 0 }: CollapseSectionProps) {
  const [open, setOpen] = useState(true);
  const allDone = items.length === 0;

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden"
      style={{ animation: `fadeUp 0.5s ease ${delay}ms both` }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Dot indicator */}
        <div
          className="w-2 h-2 rounded-full shrink-0 transition-colors"
          style={{ backgroundColor: allDone ? "#22c55e" : accent }}
        />
        <span className="flex-1 text-sm font-semibold">{title}</span>
        {/* Badge */}
        {loading ? (
          <span className="w-12 h-5 rounded-full bg-muted animate-pulse" />
        ) : allDone ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Lengkap
          </span>
        ) : (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: accent, backgroundColor: `${accent}14` }}
          >
            {items.length} belum diisi
          </span>
        )}
        <ChevronDown
          className="h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-border">
          {loading ? (
            <div className="px-5 py-4 flex flex-col gap-2">
              {[1,2,3].map((i) => (
                <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${60 + i*10}%` }} />
              ))}
            </div>
          ) : allDone ? (
            <div className="px-5 py-4 flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Semua konten sudah terisi dengan baik!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <AlertCircle
                    className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-60"
                    style={{ color: accent }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-tight">{item.label}</p>
                    {item.detail && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: accent }}
                  >
                    Isi →
                  </span>
                </Link>
              ))}
              {/* Footer link */}
              <div className="px-5 py-3">
                <Link
                  href={editHref}
                  className="text-[11px] font-semibold transition-colors hover:opacity-80"
                  style={{ color: accent }}
                >
                  Buka halaman edit →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props {
  devotional:  Devotional;
  ayatKhusus:  AyatKhusus;
  lDevotional: boolean;
  lKhusus:     boolean;
}

export function DashboardIncompleteContent({ devotional, ayatKhusus, lDevotional, lKhusus }: Props) {
  // ── Renungan incomplete ──────────────────────────────────────────────────
  const renunganItems: IncompleteItem[] = [];
  if (!devotional.title)      renunganItems.push({ id:"title",      label:"Judul renungan",    detail:"Field 'Judul' masih kosong.",           href:"/admin/renungan" });
  if (!devotional.authorCode) renunganItems.push({ id:"author",     label:"Penulis renungan",  detail:"Pilih penulis/pendeta untuk renungan.",  href:"/admin/renungan" });
  if (!devotional.body)       renunganItems.push({ id:"body",       label:"Isi / teks renungan",detail:"Konten utama renungan belum diisi.",    href:"/admin/renungan" });
  if (!devotional.prayer)     renunganItems.push({ id:"prayer",     label:"Doa penutup",       detail:"Field 'Doa' masih kosong.",              href:"/admin/renungan" });
  if (!devotional.audioUrl)   renunganItems.push({ id:"audio",      label:"Audio MP3",         detail:"Opsional, tapi belum diupload.",         href:"/admin/renungan" });

  // ── Ayat Khusus incomplete ───────────────────────────────────────────────
  const ayatItems: IncompleteItem[] = [];

  if (!ayatKhusus.tahun?.reference) {
    ayatItems.push({ id:"tahun", label:"Ayat Tahun", detail:"Ayat tahunan belum diisi.", href:"/admin/ayat?tab=dwmy" });
  }

  for (let m = 1; m <= 12; m++) {
    if (!ayatKhusus.bulan?.[String(m)]?.reference) {
      ayatItems.push({
        id:     `bulan-${m}`,
        label:  `Ayat Bulan ${MONTHS[m-1]}`,
        detail: `Ayat khusus bulan ke-${m} belum diisi.`,
        href:   "/admin/ayat?tab=dwmy",
      });
    }
  }

  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  const sundayKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  if (!ayatKhusus.mingguan?.[sundayKey]?.reference) {
    ayatItems.push({
      id:     "minggu",
      label:  "Ayat Minggu Ini",
      detail: `Belum ada ayat untuk minggu ${sundayKey}.`,
      href:   "/admin/ayat?tab=dwmy",
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Status Konten Hari Ini
      </p>
      <CollapseSection
        title="Renungan Harian"
        accent="var(--brand)"
        items={renunganItems}
        loading={lDevotional}
        editHref="/admin/renungan"
        delay={380}
      />
      <CollapseSection
        title="Ayat Khusus"
        accent="var(--gold)"
        items={ayatItems}
        loading={lKhusus}
        editHref="/admin/ayat?tab=dwmy"
        delay={430}
      />
    </div>
  );
}