/**
 * Kalender Liturgi Gereja Protestan
 * Menghitung hari raya dan musim liturgi berdasarkan tanggal.
 */

export interface LiturgicalEvent {
  name: string;
  emoji: string;
  greeting: string;       // ucapan selamat
  color: string;          // warna liturgi (hex/var)
  season?: string;        // musim liturgi
  description?: string;
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

  // Hari-hari spesifik
  if (sameDay(date, newYear))
    events.push({ name: "Tahun Baru", emoji: "🎊", greeting: "Selamat Tahun Baru! Kiranya tahun yang baru ini penuh berkat Tuhan.", color: "#7c3aed" });

  if (sameDay(date, epiphany))
    events.push({ name: "Epifani / Hari Natal Raja-Raja", emoji: "⭐", greeting: "Selamat merayakan Epifani — nyatanya Kristus bagi segala bangsa!", color: "#d97706", season: "Natal" });

  if (sameDay(date, ashWednesday))
    events.push({ name: "Rabu Abu", emoji: "✝️", greeting: "Selamat memasuki masa Pra-Paskah. Mari berdoa dan bertobat.", color: "#6b7280", season: "Pra-Paskah" });

  if (sameDay(date, palmSunday))
    events.push({ name: "Minggu Palma", emoji: "🌿", greeting: "Hosana! Selamat merayakan Minggu Palma.", color: "#16a34a", season: "Pekan Suci" });

  if (sameDay(date, holyThursday))
    events.push({ name: "Kamis Putih", emoji: "🍞", greeting: "Selamat merenungkan Perjamuan Kudus terakhir Tuhan Yesus.", color: "#7c3aed", season: "Pekan Suci" });

  if (sameDay(date, goodFriday))
    events.push({ name: "Jumat Agung", emoji: "✝️", greeting: "Selamat merenungkan pengorbanan Kristus di kayu salib.", color: "#1f2937", season: "Pekan Suci" });

  if (sameDay(date, holySaturday))
    events.push({ name: "Sabtu Sunyi", emoji: "🕯️", greeting: "Menanti dalam doa dan pengharapan kebangkitan.", color: "#374151", season: "Pekan Suci" });

  if (sameDay(date, easter))
    events.push({ name: "Hari Paskah", emoji: "🌅", greeting: "Kristus Telah Bangkit! Haleluya! Selamat Paskah.", color: "#fff7ed", season: "Paskah" });

  if (sameDay(date, addDays(easter, 1)))
    events.push({ name: "Senin Paskah", emoji: "🌅", greeting: "Kristus Telah Bangkit! Selamat Paskah.", color: "#fff7ed", season: "Paskah" });

  if (sameDay(date, ascension))
    events.push({ name: "Kenaikan Tuhan Yesus Kristus", emoji: "☁️", greeting: "Selamat merayakan Kenaikan Tuhan Yesus ke surga!", color: "#7c3aed", season: "Paskah" });

  if (sameDay(date, pentecost))
    events.push({ name: "Hari Pentakosta", emoji: "🔥", greeting: "Selamat Pentakosta! Roh Kudus dicurahkan atas kita.", color: "#dc2626", season: "Pentakosta" });

  if (sameDay(date, addDays(pentecost, 1)))
    events.push({ name: "Senin Pentakosta", emoji: "🔥", greeting: "Selamat Pentakosta! Roh Kudus menyertai kita.", color: "#dc2626", season: "Pentakosta" });

  if (sameDay(date, trinitySun))
    events.push({ name: "Hari Trinitas", emoji: "🔺", greeting: "Selamat merayakan Hari Tritunggal Mahakudus.", color: "#7c3aed" });

  if (sameDay(date, reformation))
    events.push({ name: "Hari Reformasi", emoji: "📖", greeting: "Selamat Hari Reformasi! Sola Gratia, Sola Fide, Sola Scriptura.", color: "#dc2626" });

  if (sameDay(date, christmas))
    events.push({ name: "Hari Natal", emoji: "🎄", greeting: "Selamat Natal! Firman itu telah menjadi manusia dan diam di antara kita.", color: "#16a34a", season: "Natal" });

  if (sameDay(date, christmas2))
    events.push({ name: "Natal Kedua", emoji: "🎄", greeting: "Selamat Natal! Kiranya damai Kristus menyertai kita semua.", color: "#16a34a", season: "Natal" });

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