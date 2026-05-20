/**
 * Kalender Liturgi Gereja Protestan
 * Menghitung hari raya dan musim liturgi berdasarkan tanggal.
 */

export interface LiturgicalEvent {
  name: string;
  emoji: string;
  greeting: string;
  color: string;         // warna background light mode
  darkColor?: string;    // warna background dark mode (opsional, fallback ke color)
  season?: string;
  description?: string;
  /** "global" = hari raya Kristen ekumenis, "gkpb" = spesifik GKPB */
  category?: "global" | "gkpb";
}

// ─── Hitung Paskah (Algoritma Meeus/Jones/Butcher) ─────────────────────────
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

/**
 * Nth weekday of a month: getNthWeekdayOfMonth(2025, 9, 0, 1) = Minggu pertama Oktober 2025
 * weekday: 0=Min, 1=Sen, ..., 6=Sab
 * n: 1=pertama, 2=kedua, dst.
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const diff  = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + diff + (n - 1) * 7);
}

/** Weekday terakhir di bulan tertentu */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0); // hari terakhir bulan
  const diff = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - diff);
}

// ─── Hitung Advent (Minggu 4 minggu sebelum Natal) ─────────────────────────
function adventStart(year: number): Date {
  const christmas = new Date(year, 11, 25); // 25 Des
  const dayOfWeek = christmas.getDay(); // 0=Min
  // Minggu pertama Advent = Minggu terdekat sebelum atau pada 3 Des
  // = Minggu ke-4 sebelum Natal
  const daysToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
  const fourthSundayBefore = addDays(christmas, -(daysToSunday + 21));
  return fourthSundayBefore;
}

// ─── Cek apakah tanggal ada di musim tertentu ──────────────────────────────
function inRange(d: Date, start: Date, endInclusive: Date): boolean {
  const t     = d.getTime();
  const s     = new Date(start); s.setHours(0,0,0,0);
  const e     = new Date(endInclusive); e.setHours(23,59,59,999);
  return t >= s.getTime() && t <= e.getTime();
}

// ─── API Utama ─────────────────────────────────────────────────────────────
export function getLiturgicalEvents(date: Date): LiturgicalEvent[] {
  const year   = date.getFullYear();
  const events: LiturgicalEvent[] = [];

  const easter       = easterDate(year);
  const palmSunday   = addDays(easter, -7);
  const ashWednesday = addDays(easter, -46);
  const holyThursday = addDays(easter, -3);
  const goodFriday   = addDays(easter, -2);
  const holySaturday = addDays(easter, -1);
  const ascension    = addDays(easter, 39);
  const pentecost    = addDays(easter, 49);
  const trinitySun   = addDays(pentecost, 7);

  const advent       = adventStart(year);
  const christmas    = new Date(year, 11, 25);
  const christmas2   = new Date(year, 11, 26);
  const newYear      = new Date(year, 0, 1);
  const epiphany     = new Date(year, 0, 6);
  const reformation  = new Date(year, 9, 31); // 31 Okt

  // ── 4 Minggu Adven ──────────────────────────────────────────────────────
  const advent2 = addDays(advent, 7);
  const advent3 = addDays(advent, 14);
  const advent4 = addDays(advent, 21);

  // ── Minggu Kristus Raja (Minggu terakhir sebelum Adven) ─────────────────
  const christTheKing = addDays(advent, -7);

  // ── Minggu Komuni Sedunia (Minggu pertama Oktober) ──────────────────────
  const worldCommunion = getNthWeekdayOfMonth(year, 9, 0, 1);

  // ── Hari Semua Orang Kudus & Hari Doa Sedunia ───────────────────────────
  const allSaints   = new Date(year, 10, 1);    // 1 Nov
  const watchNight  = new Date(year, 11, 31);   // 31 Des — Ibadah Tutup Tahun

  // ── GKPB — Hari Ulang Tahun (berdiri 11 Agustus 1931) ──────────────────
  const hutGKPB     = new Date(year, 7, 11);    // 11 Agustus

  // ── GKPB — Minggu Doa & Puasa (Minggu pertama Februari) ─────────────────
  const doaPuasaGKPB = getNthWeekdayOfMonth(year, 1, 0, 1);

  // ── GKPB — Hari Zending / Misi Sedunia (Minggu terakhir Oktober) ─────────
  const hariMisiGKPB = getLastWeekdayOfMonth(year, 9, 0);

  // ── GKPB — Minggu Pemuda (Minggu ke-3 September) ─────────────────────────
  const hariPemudaGKPB = getNthWeekdayOfMonth(year, 8, 0, 3);

  // ── GKPB — Hari Wanita Gereja (Minggu pertama Maret) ─────────────────────
  const hariWanitaGKPB = getNthWeekdayOfMonth(year, 2, 0, 1);

  // ═══════════════════════════════════════════════════════════════════════════
  // Hari Raya Global Kristen
  // ═══════════════════════════════════════════════════════════════════════════

  if (sameDay(date, newYear))
    events.push({ name: "Tahun Baru", emoji: "🎊", greeting: "Selamat Tahun Baru! Kiranya tahun yang baru ini penuh berkat Tuhan.", color: "#7c3aed", category: "global" });

  if (sameDay(date, epiphany))
    events.push({ name: "Epifani / Hari Natal Raja-Raja", emoji: "⭐", greeting: "Selamat merayakan Epifani — nyatanya Kristus bagi segala bangsa!", color: "#d97706", season: "Natal", category: "global" });

  if (sameDay(date, ashWednesday))
    events.push({ name: "Rabu Abu", emoji: "✝️", greeting: "Selamat memasuki masa Pra-Paskah. Mari berdoa dan bertobat.", color: "#6b7280", season: "Pra-Paskah", category: "global" });

  if (sameDay(date, palmSunday))
    events.push({ name: "Minggu Palma", emoji: "🌿", greeting: "Hosana! Selamat merayakan Minggu Palma.", color: "#16a34a", season: "Pekan Suci", category: "global" });

  if (sameDay(date, holyThursday))
    events.push({ name: "Kamis Putih", emoji: "🍞", greeting: "Selamat merenungkan Perjamuan Kudus terakhir Tuhan Yesus.", color: "#7c3aed", season: "Pekan Suci", category: "global" });

  if (sameDay(date, goodFriday))
    events.push({ name: "Jumat Agung", emoji: "✝️", greeting: "Selamat merenungkan pengorbanan Kristus di kayu salib.", color: "#1f2937", season: "Pekan Suci", category: "global" });

  if (sameDay(date, holySaturday))
    events.push({ name: "Sabtu Sunyi", emoji: "🕯️", greeting: "Menanti dalam doa dan pengharapan kebangkitan.", color: "#374151", season: "Pekan Suci", category: "global" });

  if (sameDay(date, easter))
    events.push({ name: "Hari Paskah", emoji: "🌅", greeting: "Kristus Telah Bangkit! Haleluya! Selamat Paskah.", color: "#f59e0b", darkColor: "#b45309", season: "Paskah", category: "global" });

  if (sameDay(date, addDays(easter, 1)))
    events.push({ name: "Senin Paskah", emoji: "🌅", greeting: "Kristus Telah Bangkit! Selamat Paskah.", color: "#f59e0b", darkColor: "#b45309", season: "Paskah", category: "global" });

  if (sameDay(date, ascension))
    events.push({ name: "Kenaikan Tuhan Yesus Kristus", emoji: "☁️", greeting: "Selamat merayakan Kenaikan Tuhan Yesus ke surga!", color: "#7c3aed", season: "Paskah", category: "global" });

  if (sameDay(date, pentecost))
    events.push({ name: "Hari Pentakosta", emoji: "🔥", greeting: "Selamat Pentakosta! Roh Kudus dicurahkan atas kita.", color: "#dc2626", season: "Pentakosta", category: "global" });

  if (sameDay(date, addDays(pentecost, 1)))
    events.push({ name: "Senin Pentakosta", emoji: "🔥", greeting: "Selamat Pentakosta! Roh Kudus menyertai kita.", color: "#dc2626", season: "Pentakosta", category: "global" });

  if (sameDay(date, trinitySun))
    events.push({ name: "Hari Trinitas", emoji: "🔺", greeting: "Selamat merayakan Hari Tritunggal Mahakudus.", color: "#7c3aed", category: "global" });

  if (sameDay(date, worldCommunion))
    events.push({ name: "Minggu Komuni Sedunia", emoji: "🍷", greeting: "Selamat merayakan Perjamuan Kudus bersama seluruh Tubuh Kristus di dunia.", color: "#7c3aed", category: "global" });

  if (sameDay(date, allSaints))
    events.push({ name: "Hari Semua Orang Kudus", emoji: "👑", greeting: "Mengenang para saksi iman yang telah mendahului kita.", color: "#7c3aed", category: "global" });

  if (sameDay(date, reformation))
    events.push({ name: "Hari Reformasi", emoji: "📖", greeting: "Selamat Hari Reformasi! Sola Gratia, Sola Fide, Sola Scriptura.", color: "#dc2626", category: "global" });

  if (sameDay(date, christTheKing))
    events.push({ name: "Minggu Kristus Raja", emoji: "👑", greeting: "Kristus adalah Raja atas segala raja dan Tuhan atas segala tuhan.", color: "#7c3aed", category: "global" });

  if (sameDay(date, advent))
    events.push({ name: "Adven I — Minggu Pertama Adven", emoji: "🕯️", greeting: "Selamat memasuki Masa Adven. Mari menyambut kedatangan Sang Terang!", color: "#7c3aed", season: "Adven", category: "global" });

  if (sameDay(date, advent2))
    events.push({ name: "Adven II — Minggu Kedua Adven", emoji: "🕯️", greeting: "Damai Kristus datang membawa pengharapan bagi dunia.", color: "#7c3aed", season: "Adven", category: "global" });

  if (sameDay(date, advent3))
    events.push({ name: "Adven III — Minggu Ketiga Adven (Gaudete)", emoji: "🌸", greeting: "Bersukacitalah! Tuhan sudah dekat.", color: "#db2777", season: "Adven", category: "global" });

  if (sameDay(date, advent4))
    events.push({ name: "Adven IV — Minggu Keempat Adven", emoji: "🕯️", greeting: "Kasih Allah nyata dalam kehadiran Imanuel, Allah beserta kita.", color: "#7c3aed", season: "Adven", category: "global" });

  if (sameDay(date, christmas))
    events.push({ name: "Hari Natal", emoji: "🎄", greeting: "Selamat Natal! Firman itu telah menjadi manusia dan diam di antara kita.", color: "#16a34a", season: "Natal", category: "global" });

  if (sameDay(date, christmas2))
    events.push({ name: "Natal Kedua", emoji: "🎄", greeting: "Selamat Natal! Kiranya damai Kristus menyertai kita semua.", color: "#16a34a", season: "Natal", category: "global" });

  if (sameDay(date, watchNight))
    events.push({ name: "Ibadah Tutup Tahun", emoji: "🙏", greeting: "Syukur kepada Tuhan atas segala pemeliharaan-Nya sepanjang tahun ini.", color: "#6b7280", category: "global" });

  // ═══════════════════════════════════════════════════════════════════════════
  // Hari Raya GKPB (Gereja Kristen Protestan di Bali)
  // ═══════════════════════════════════════════════════════════════════════════

  if (sameDay(date, hutGKPB))
    events.push({
      name: `HUT GKPB ke-${year - 1931}`,
      emoji: "⛪",
      greeting: `Selamat Hari Ulang Tahun GKPB ke-${year - 1931}! Kiranya GKPB terus setia memberitakan Injil di tanah Bali dan dunia.`,
      color: "#0f766e",   // teal — warna identitas GKPB
      category: "gkpb",
    });

  if (sameDay(date, doaPuasaGKPB))
    events.push({ name: "Minggu Doa & Puasa GKPB", emoji: "🙏", greeting: "Selamat berdoa dan berpuasa bersama seluruh keluarga GKPB.", color: "#0f766e", category: "gkpb" });

  if (sameDay(date, hariMisiGKPB))
    events.push({ name: "Hari Zending & Misi GKPB", emoji: "🌏", greeting: "Selamat Hari Misi! Mari ikut serta dalam mandat Amanat Agung Tuhan Yesus.", color: "#0f766e", category: "gkpb" });

  if (sameDay(date, hariPemudaGKPB))
    events.push({ name: "Hari Pemuda GKPB", emoji: "✨", greeting: "Selamat Hari Pemuda GKPB! Jadilah terang dan garam di tengah dunia.", color: "#0369a1", category: "gkpb" });

  if (sameDay(date, hariWanitaGKPB))
    events.push({ name: "Hari Wanita Gereja GKPB", emoji: "🌸", greeting: "Selamat Hari Wanita Gereja! Kiranya kasih Tuhan memampukan setiap wanita menjadi berkat.", color: "#be185d", category: "gkpb" });

  return events;
}

// ─── Musim Liturgi Saat Ini ────────────────────────────────────────────────
export interface LiturgicalSeason {
  name: string;
  color: string;
  emoji: string;
}

export function getLiturgicalSeason(date: Date): LiturgicalSeason {
  const year   = date.getFullYear();
  const easter = easterDate(year);
  const advent = adventStart(year);

  const ashWednesday = addDays(easter, -46);
  const pentecost    = addDays(easter, 49);
  const christmasEnd = new Date(year + 1, 0, 5); // 5 Jan tahun depan (sebelum Epifani)
  const christmasStart = new Date(year, 11, 25);
  const epiphany     = new Date(year, 0, 6);

  // Natal (25 Des - 5 Jan)
  if (inRange(date, christmasStart, christmasEnd))
    return { name: "Masa Natal", color: "#16a34a", emoji: "🎄" };

  // Epifani (6 Jan - sebelum Rabu Abu)
  if (inRange(date, epiphany, addDays(ashWednesday, -1)))
    return { name: "Masa Epifani", color: "#d97706", emoji: "⭐" };

  // Pra-Paskah / Puasa (Rabu Abu - Sabtu sebelum Paskah)
  if (inRange(date, ashWednesday, addDays(easter, -1)))
    return { name: "Masa Pra-Paskah", color: "#6b7280", emoji: "✝️" };

  // Paskah (Paskah - Pentakosta)
  if (inRange(date, easter, addDays(pentecost, -1)))
    return { name: "Masa Paskah", color: "#f59e0b", emoji: "🌅" };

  // Pentakosta sampai Advent
  if (inRange(date, pentecost, addDays(advent, -1)))
    return { name: "Masa Pentakosta", color: "#16a34a", emoji: "🔥" };

  // Advent
  if (inRange(date, advent, new Date(year, 11, 24)))
    return { name: "Masa Adven", color: "#7c3aed", emoji: "🕯️" };

  return { name: "Masa Biasa", color: "#16a34a", emoji: "📖" };
}

// ─── Daftar Hari Raya Bulan Tertentu (untuk kalender) ─────────────────────
export function getEventsForMonth(year: number, month: number): Map<number, LiturgicalEvent[]> {
  const map = new Map<number, LiturgicalEvent[]>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const events = getLiturgicalEvents(new Date(year, month, d));
    if (events.length > 0) map.set(d, events);
  }
  return map;
}   