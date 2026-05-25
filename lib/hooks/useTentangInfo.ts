"use client";

/**
 * useTentangInfo
 * ──────────────
 * Admin  → onSnapshot (realtime)
 * Publik → readDoc   (sekali baca)
 *
 * Semua data halaman Tentang disimpan di Firestore doc:
 *   tentang_info / current
 */

import { useState, useEffect, useCallback } from "react";
import { readDoc, writeDoc, subscribeDoc } from "@/lib/firestore";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialLink {
  platform: string;   // "Instagram" | "YouTube" | "Facebook" | custom
  url:      string;
  handle:   string;   // "@gkpb_official"
}

export interface TentangInfo {
  // Hero
  appName:     string;
  appVersion:  string;
  appYear:     string;

  // Tema GKPB
  theme:       string;
  subtheme:    string;

  // Publikasi Puji & Janji
  pjEdition:   string;
  pjYear:      string;
  pjColor:     string;

  // Publikasi Janji Hidup
  jhPeriod:    string;
  jhEditor:    string;
  jhPic:       string;
  jhAudio:     string;
  jhMadeBy:    string;

  // Kontak
  address:     string;
  phone:       string;
  email:       string;
  website:     string;

  // Visi & Misi
  visi:        string;
  misi:        string[];   // array per poin

  // Medsos
  socials:     SocialLink[];
}

export const DEFAULT_TENTANG: TentangInfo = {
  appName:    "Puji dan Janji",
  appVersion: "0.8 Beta",
  appYear:    "2026",

  theme:      "Menjadi Gereja Pembawa Keadilan",
  subtheme:   "Diubahkan Kristus Untuk Bertindak Adil",

  pjEdition:  "296",
  pjYear:     "2026",
  pjColor:    "Biru",

  jhPeriod:   "April – Juni 2026",
  jhEditor:   "Wigiyanto",
  jhPic:      "Departemen Persekutuan dan Pembinaan (DEPTUBIN) — Gereja Kristen Protestan di Bali (GKPB)",
  jhAudio:    "LKSA Widhya Asih Singaraja",
  jhMadeBy:   "TIM IT Kantor Sinode GKPB",

  address:    "Jl. Raya Kapal No 20, Kapal – Mengwi – Mangupura – Bali",
  phone:      "(0361) 4422726 / 4425117",
  email:      "sinode.gkpb@gmail.com",
  website:    "www.balichurchsynod.org",

  visi:       "Menjadi Gereja yang membawa damai sejahtera Allah kepada seluruh ciptaan, berakar pada firman Tuhan, dan bertumbuh dalam kasih yang nyata di tengah masyarakat Bali dan Indonesia.",
  misi: [
    "Membangun persekutuan jemaat yang hidup, hangat, dan saling melayani.",
    "Memberitakan Injil Yesus Kristus kepada seluruh lapisan masyarakat.",
    "Menegakkan keadilan dan membela hak-hak mereka yang lemah dan terpinggirkan.",
    "Memelihara keutuhan ciptaan dan turut bertanggung jawab atas kelestarian lingkungan.",
    "Mengembangkan pelayan-pelayan gereja yang kompeten, berkarakter, dan berhati hamba.",
  ],
  socials: [],
};

// ─── Admin hook (realtime) ────────────────────────────────────────────────────

export function useTentangInfoAdmin() {
  const [data,    setData]    = useState<TentangInfo>(DEFAULT_TENTANG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeDoc<TentangInfo>(
      "tentang_info", "current", DEFAULT_TENTANG,
      (d) => { setData(d ?? DEFAULT_TENTANG); setLoading(false); }
    );
  }, []);

  const save = useCallback(async (info: TentangInfo) => {
    try {
      await writeDoc("tentang_info", "current", info);
      toast.success("Info tentang berhasil disimpan.");
    } catch {
      toast.error("Gagal menyimpan.");
    }
  }, []);

  return { data, loading, save };
}

// ─── Public hook (read-once) ──────────────────────────────────────────────────

export function useTentangInfoPublic() {
  const [data,    setData]    = useState<TentangInfo>(DEFAULT_TENTANG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readDoc<TentangInfo>("tentang_info", "current", DEFAULT_TENTANG)
      .then((d) => setData(d ?? DEFAULT_TENTANG))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}