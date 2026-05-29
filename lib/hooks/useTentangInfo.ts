"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SocialLink {
  platform: string;
  url:      string;
  handle:   string;
}

export interface TentangInfo {
  appName: string; appVersion: string; appYear: string;
  theme: string;   subtheme: string;
  pjEdition: string; pjYear: string; pjColor: string;
  jhPeriod: string;  jhEditor: string; jhPic: string; jhAudio: string; jhMadeBy: string;
  address: string;   phone: string;   email: string;  website: string;
  visi: string;
  misi:    string[];
  socials: SocialLink[];
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

// ─── Load helper ─────────────────────────────────────────────────────────────
async function loadTentang(): Promise<TentangInfo> {
  const [{ data: info }, { data: misiRows }, { data: socialRows }] = await Promise.all([
    supabase.from("tentang_info").select("*").eq("id", "current").maybeSingle(),
    supabase.from("tentang_misi").select("*").order("sort_order"),
    supabase.from("tentang_socials").select("*").order("sort_order"),
  ]);

  if (!info) return DEFAULT_TENTANG;

  return {
    appName:    info.app_name    ?? DEFAULT_TENTANG.appName,
    appVersion: info.app_version ?? DEFAULT_TENTANG.appVersion,
    appYear:    info.app_year    ?? DEFAULT_TENTANG.appYear,
    theme:      info.theme       ?? DEFAULT_TENTANG.theme,
    subtheme:   info.subtheme    ?? DEFAULT_TENTANG.subtheme,
    pjEdition:  info.pj_edition  ?? DEFAULT_TENTANG.pjEdition,
    pjYear:     info.pj_year     ?? DEFAULT_TENTANG.pjYear,
    pjColor:    info.pj_color    ?? DEFAULT_TENTANG.pjColor,
    jhPeriod:   info.jh_period   ?? DEFAULT_TENTANG.jhPeriod,
    jhEditor:   info.jh_editor   ?? DEFAULT_TENTANG.jhEditor,
    jhPic:      info.jh_pic      ?? DEFAULT_TENTANG.jhPic,
    jhAudio:    info.jh_audio    ?? DEFAULT_TENTANG.jhAudio,
    jhMadeBy:   info.jh_made_by  ?? DEFAULT_TENTANG.jhMadeBy,
    address:    info.address     ?? DEFAULT_TENTANG.address,
    phone:      info.phone       ?? DEFAULT_TENTANG.phone,
    email:      info.email       ?? DEFAULT_TENTANG.email,
    website:    info.website     ?? DEFAULT_TENTANG.website,
    visi:       info.visi        ?? DEFAULT_TENTANG.visi,
    misi:    (misiRows   ?? []).map((r: any) => r.text),
    socials: (socialRows ?? []).map((r: any) => ({ platform: r.platform, url: r.url, handle: r.handle })),
  };
}

// ─── Save helper ─────────────────────────────────────────────────────────────
async function saveTentang(info: TentangInfo): Promise<void> {
  await supabase.from("tentang_info").upsert({
    id:          "current",
    app_name:    info.appName,
    app_version: info.appVersion,
    app_year:    info.appYear,
    theme:       info.theme,
    subtheme:    info.subtheme,
    pj_edition:  info.pjEdition,
    pj_year:     info.pjYear,
    pj_color:    info.pjColor,
    jh_period:   info.jhPeriod,
    jh_editor:   info.jhEditor,
    jh_pic:      info.jhPic,
    jh_audio:    info.jhAudio,
    jh_made_by:  info.jhMadeBy,
    address:     info.address,
    phone:       info.phone,
    email:       info.email,
    website:     info.website,
    visi:        info.visi,
  }, { onConflict: "id" });

  // Replace misi
  await supabase.from("tentang_misi").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (info.misi?.length) {
    await supabase.from("tentang_misi").insert(
      info.misi.map((text, i) => ({ text, sort_order: i }))
    );
  }

  // Replace socials
  await supabase.from("tentang_socials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (info.socials?.length) {
    await supabase.from("tentang_socials").insert(
      info.socials.map((s, i) => ({ platform: s.platform, url: s.url, handle: s.handle, sort_order: i }))
    );
  }
}

// ─── Admin hook (realtime) ────────────────────────────────────────────────────
export function useTentangInfoAdmin() {
  const [data,    setData]    = useState<TentangInfo>(DEFAULT_TENTANG);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const info = await loadTentang();
    setData(info);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("tentang:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "tentang_info" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tentang_misi" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "tentang_socials" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const save = useCallback(async (info: TentangInfo) => {
    try {
      await saveTentang(info);
      setData(info);
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
    loadTentang().then(setData).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
