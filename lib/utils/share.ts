/**
 * lib/utils/share.ts
 * Multi-platform share utilities — WhatsApp, Telegram, X, Facebook, Line, Copy, Web Share API
 */

const APP_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://puja-mu.vercel.app";
const APP_NAME = "Puji dan Janji · GKPB";

// ─── Payload ─────────────────────────────────────────────────────────────────

export interface SharePayload {
  /** Teks berformat (WA/Telegram markdown) */
  richText:  string;
  /** Teks polos tanpa markup */
  plainText: string;
  /** Versi singkat ≤ 220 char — untuk Twitter/X */
  shortText: string;
  /** URL yang dibagikan */
  url:       string;
  /** Judul untuk native share */
  title:     string;
}

// ─── Builder ─────────────────────────────────────────────────────────────────

export function buildVersePayload({
  reference,
  text,
  label,
}: {
  reference: string;
  text:      string;
  label?:    string;
}): SharePayload {
  const rich = [
    label ? `📖 *${label}*\n` : "",
    `_"${text}"_`,
    "",
    `— *${reference}*`,
    "",
    `Dibagikan dari *${APP_NAME}*`,
    APP_URL,
  ].filter(Boolean).join("\n");

  const plain = [
    label ? `📖 ${label}\n` : "",
    `"${text}"`,
    "",
    `— ${reference}`,
    "",
    `Dari ${APP_NAME} · ${APP_URL}`,
  ].filter(Boolean).join("\n");

  const shortText = `"${text.slice(0, 160)}${text.length > 160 ? "…" : ""}" — ${reference}`;

  return { richText: rich, plainText: plain, shortText, url: APP_URL, title: reference };
}

export function buildDevotionalPayload({
  title,
  body,
  date,
}: {
  title: string;
  body:  string;
  date:  string;
}): SharePayload {
  const url     = `${APP_URL}/janjihidup`;
  const preview = body.split("\n\n")[0].slice(0, 200).trimEnd();
  const ellipsis = body.length > 200 ? "..." : "";

  const rich = [
    `📖 *Janji Hidup · ${APP_NAME}*`,
    `_${date}_`,
    ``,
    `*${title}*`,
    ``,
    `${preview}${ellipsis}`,
    ``,
    `Baca selengkapnya: ${url}`,
  ].join("\n");

  const plain = [
    `📖 Janji Hidup · ${APP_NAME}`,
    date,
    ``,
    title,
    ``,
    `${preview}${ellipsis}`,
    ``,
    `Baca: ${url}`,
  ].join("\n");

  const shortText = `${title} — Janji Hidup ${APP_NAME} ${url}`;

  return { richText: rich, plainText: plain, shortText, url, title };
}

export function buildPrayerPayload({
  topik,
  detail,
  hari,
}: {
  topik:   string;
  detail?: string;
  hari:    string;
}): SharePayload {
  const lines = [
    `🙏 *Pokok Doa ${hari}*`,
    `*${APP_NAME}*`,
    ``,
    `*${topik}*`,
  ];
  if (detail) lines.push(``, detail);
  lines.push(``, APP_URL);

  const plain = lines.map(l => l.replace(/\*/g, "")).join("\n");
  const shortText = `🙏 Pokok Doa ${hari}: ${topik} — ${APP_NAME}`;

  return {
    richText:  lines.join("\n"),
    plainText: plain,
    shortText,
    url:   APP_URL,
    title: `Pokok Doa ${hari}`,
  };
}

// ─── Platform openers ────────────────────────────────────────────────────────

function open(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function shareToWhatsApp(p: SharePayload) {
  open(`https://wa.me/?text=${encodeURIComponent(p.richText)}`);
}

export function shareToTelegram(p: SharePayload) {
  open(
    `https://t.me/share/url?url=${encodeURIComponent(p.url)}&text=${encodeURIComponent(
      `${p.title}\n\n${p.plainText.slice(0, 400)}`
    )}`
  );
}

export function shareToTwitter(p: SharePayload) {
  open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(p.shortText)}`);
}

export function shareToFacebook(p: SharePayload) {
  open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(p.url)}`);
}

export function shareToLine(p: SharePayload) {
  open(
    `https://line.me/R/msg/text?${encodeURIComponent(`${p.title}\n\n${p.plainText.slice(0, 300)}\n${p.url}`)}`
  );
}

export async function copyText(p: SharePayload): Promise<void> {
  await navigator.clipboard.writeText(p.plainText);
}

export async function copyLink(p: SharePayload): Promise<void> {
  await navigator.clipboard.writeText(p.url);
}

export async function nativeShare(p: SharePayload): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title: p.title, text: p.plainText, url: p.url });
    return true;
  } catch {
    return false;
  }
}

// ─── Legacy compat (masih dipakai komponen lama) ────────────────────────────

/** @deprecated gunakan buildVersePayload + shareToWhatsApp */
export function shareVerseToWhatsApp(args: { reference: string; text: string; label?: string }) {
  shareToWhatsApp(buildVersePayload(args));
}

/** @deprecated gunakan buildDevotionalPayload + shareToWhatsApp */
export function shareDevotionalToWhatsApp(args: { title: string; bodyPreview: string; date: string }) {
  shareToWhatsApp(buildDevotionalPayload({ title: args.title, body: args.bodyPreview, date: args.date }));
}

/** @deprecated */
export function sharePrayerToWhatsApp(args: { topik: string; detail?: string; hari: string }) {
  shareToWhatsApp(buildPrayerPayload(args));
}