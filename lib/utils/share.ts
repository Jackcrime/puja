/**
 * Utilitas sharing konten ke WhatsApp
 * WhatsApp mendukung: *bold*, _italic_, ~strikethrough~
 */

const APP_URL = "https://pu-ja.vercel.app";

/** Buka WA dengan teks yang sudah diformat */
function openWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
}

/** Share satu ayat ke WhatsApp */
export function shareVerseToWhatsApp({
  reference,
  text,
  label,
}: {
  reference: string;
  text: string;
  label?: string;
}) {
  const lines: string[] = [];

  if (label) {
    lines.push(`📖 *${label}*`);
    lines.push("");
  }

  lines.push(`_"${text}"_`);
  lines.push("");
  lines.push(`— *${reference}*`);
  lines.push("");
  lines.push(`Dibagikan dari *Puji dan Janji · GKPB*`);
  lines.push(APP_URL);

  openWhatsApp(lines.join("\n"));
}

/** Share renungan harian (Janji Hidup) ke WhatsApp */
export function shareDevotionalToWhatsApp({
  title,
  bodyPreview,
  date,
}: {
  title: string;
  bodyPreview: string;
  date: string;
}) {
  // Ambil kalimat pertama yang cukup (max ~200 char)
  const preview = bodyPreview.split("\n\n")[0].slice(0, 200).trimEnd();
  const ellipsis = bodyPreview.length > 200 ? "..." : "";

  const lines: string[] = [
    `📖 *Janji Hidup · Puji dan Janji GKPB*`,
    `_${date}_`,
    ``,
    `*${title}*`,
    ``,
    `${preview}${ellipsis}`,
    ``,
    `Baca selengkapnya:`,
    `${APP_URL}/janjihidup`,
  ];

  openWhatsApp(lines.join("\n"));
}

/** Share pokok doa ke WhatsApp */
export function sharePrayerToWhatsApp({
  topik,
  detail,
  hari,
}: {
  topik: string;
  detail?: string;
  hari: string;
}) {
  const lines: string[] = [
    `🙏 *Pokok Doa ${hari}*`,
    `*Puji dan Janji · GKPB*`,
    ``,
    `*${topik}*`,
  ];

  if (detail) {
    lines.push(``, detail);
  }

  lines.push(``, APP_URL);

  openWhatsApp(lines.join("\n"));
}
