// ─── Dates ────────────────────────────────────────────────────────────────────
// TODAY dan TODAY_SHORT sudah tidak dipakai — gunakan format(new Date(), ...) langsung

// ─── Daily verses — rotated by day of year ────────────────────────────────────
export const DAILY_VERSES = [
  { reference: "2 Korintus 5:17", text: "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang." },
  { reference: "Roma 8:28", text: "Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia." },
  { reference: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
  { reference: "Yohanes 3:16", text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal." },
  { reference: "Mazmur 23:1", text: "TUHAN adalah gembalaku, takkan kekurangan aku." },
  { reference: "Yeremia 29:11", text: "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera." },
  { reference: "Yosua 1:9", text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau ke mana pun engkau pergi." },
];

export function getDailyVerse() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

// ─── Verse highlights ─────────────────────────────────────────────────────────
export const VERSE_HIGHLIGHTS = [
  { reference: "Amsal 31:8", text: "Bukalah mulutmu untuk orang yang bisu, untuk hak semua orang yang merana." },
  { reference: "Markus 2:4", text: "Mereka tidak dapat membawanya kepada-Nya karena orang banyak itu, lalu mereka membuka atap yang di atas-Nya." },
];

// ─── Perikop (pericope headings) ──────────────────────────────────────────────
export const PERIKOP = [
  { book: "Amsal", chapter: 31, verses: "1–9", heading: "Nasihat seorang ibu untuk anaknya" },
  { book: "Markus", chapter: 2, verses: "1–12", heading: "Yesus menyembuhkan seorang lumpuh" },
  { book: "Yohanes", chapter: 8, verses: "31–36", heading: "Kebenaran yang memerdekakan" },
  { book: "Efesus", chapter: 6, verses: "1–4", heading: "Nasihat kepada anak-anak dan orang tua" },
  { book: "Mazmur", chapter: 46, verses: "1–11", heading: "Allah, tempat perlindungan kita" },
];

// ─── Bible readings ────────────────────────────────────────────────────────────
export const BIBLE_READINGS = [
  {
    reference: "Yohanes 8:31–36",
    title: "Kebenaran yang Memerdekakan",
    verses: [
      { number: "8:31", text: "Maka kata-Nya kepada orang-orang Yahudi yang percaya kepada-Nya: \"Jikalau kamu tetap dalam firman-Ku, kamu benar-benar adalah murid-Ku\"" },
      { number: "8:32", text: "dan kamu akan mengetahui kebenaran, dan kebenaran itu akan memerdekakan kamu." },
      { number: "8:33", text: "Jawab mereka: \"Kami adalah keturunan Abraham dan tidak pernah menjadi hamba siapapun.\"" },
      { number: "8:34", text: "Kata Yesus: \"Setiap orang yang berbuat dosa, adalah hamba dosa.\"" },
      { number: "8:35", text: "Dan hamba tidak tetap tinggal dalam rumah, tetapi anak tetap tinggal dalam rumah." },
      { number: "8:36", text: "Jadi apabila Anak itu memerdekakan kamu, kamupun benar-benar merdeka." },
    ],
  },
  {
    reference: "Efesus 6:1–4",
    title: "Taat dan Kasih",
    verses: [
      { number: "6:1", text: "Hai anak-anak, taatilah orang tuamu di dalam Tuhan, karena haruslah demikian." },
      { number: "6:2", text: "Hormatilah ayahmu dan ibumu — ini adalah suatu perintah yang penting." },
      { number: "6:3", text: "Supaya kamu berbahagia dan panjang umurmu di bumi." },
      { number: "6:4", text: "Dan kamu, bapa-bapa, janganlah bangkitkan amarah di dalam hati anak-anakmu." },
    ],
  },
  {
    reference: "Mazmur 46:1–3",
    title: "Tuhan, Benteng yang Teguh",
    verses: [
      { number: "46:1", text: "Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti." },
      { number: "46:2", text: "Sebab itu kita tidak akan takut, sekalipun bumi berubah, sekalipun gunung-gunung goncang di dalam laut." },
      { number: "46:3", text: "Sekalipun ribut dan bergelora airnya, sekalipun gunung-gunung goyang oleh geloranya." },
    ],
  },
];

// ─── Authors ──────────────────────────────────────────────────────────────────
// titles  : array gelar, bisa multiple (Pendeta, Emeritus, Bishop, dll)
// serviceHistory : riwayat pelayanan per lokasi { ministryId, from, until }
export const AUTHORS: Record<string, {
  name:           string;
  titles:         string[];
  photoUrl?:      string;
  serviceHistory: { ministryId: string; from: string; until: string }[];
}> = {
  IWM:    { name: "I Wayan Mariasa",                           titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2010", until: "Sekarang" }] },
  KDPA:   { name: "Kadek Dwi Prayoga Aditya",                  titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2015", until: "Sekarang" }] },
  ISUN:   { name: "Dewi Sundari",                              titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2012", until: "Sekarang" }] },
  VMYB:   { name: "Viyata Margareta Yuliana Bolla, S.Si. Teol", titles: ["Pendeta"],         serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2014", until: "Sekarang" }] },
  MFGA:   { name: "Made Fennoni Gressia Asrining, S.Si. Teol", titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2016", until: "Sekarang" }] },
  IMAAP:  { name: "I Made Andika Adi Putra",                   titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2013", until: "Sekarang" }] },
  VIJE:   { name: "Julius Jefry Lumansik",                     titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2011", until: "Sekarang" }] },
  ATAANO: { name: "Martha Yunita Ano",                         titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2018", until: "Sekarang" }] },
  KAJ:    { name: "Komang Agus Juliawan",                      titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2017", until: "Sekarang" }] },
  KY:     { name: "Karenda Yucha, S.Si., Teol",                titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2019", until: "Sekarang" }] },
  HW:     { name: "Hety Widowaty Soewondo",                    titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2009", until: "Sekarang" }] },
  PJD:    { name: "Paulina Jasri Danggo",                      titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2020", until: "Sekarang" }] },
  WAW:    { name: "Wayan Agus Wiratama",                       titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2016", until: "Sekarang" }] },
  KS:     { name: "Kadek Suriani",                             titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2021", until: "Sekarang" }] },
  JoJo:   { name: "Jonnie Josua",                              titles: ["Vikaris"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2022", until: "Sekarang" }] },
  PAP:    { name: "Penta Astari Prasetya",                     titles: [],                   serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2023", until: "Sekarang" }] },
  PSA:    { name: "Putu Surya Adinata",                        titles: ["Vikaris"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2022", until: "Sekarang" }] },
  NJL:    { name: "Nafthalia Julita Leander",                  titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2018", until: "Sekarang" }] },
  CWP:    { name: "Christiana Welda Putranti",                 titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2015", until: "Sekarang" }] },
  IPEUS:  { name: "I Putu Elika Uria Setiawan",                titles: ["Vikaris"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2023", until: "Sekarang" }] },
  KBWU:   { name: "Kadek Bagus Wisesa Uryana",                 titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2020", until: "Sekarang" }] },
  IRHB:   { name: "Izak Rio Hernemus Bainuan",                 titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2017", until: "Sekarang" }] },
  TW:     { name: "Trifena Wati",                              titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2019", until: "Sekarang" }] },
  PR:     { name: "Putu Recita",                               titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2021", until: "Sekarang" }] },
  DS:     { name: "Debora Seilatu",                            titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2018", until: "Sekarang" }] },
  SH:     { name: "Somenifati Hia",                            titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2016", until: "Sekarang" }] },
  FPP:    { name: "Fajar Pratama Putra",                       titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2020", until: "Sekarang" }] },
  A3P:    { name: "Anak Agung Ayu Perani",                     titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2014", until: "Sekarang" }] },
  DEAP:   { name: "Dewa Gede Adi Pranata",                     titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2022", until: "Sekarang" }] },
  MHS:    { name: "Merry Handayani Sayuna",                    titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2019", until: "Sekarang" }] },
  FAO:    { name: "Finsensius Apola Oematan",                  titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2021", until: "Sekarang" }] },
  YDS:    { name: "Yosef Destian Setiawan",                    titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2023", until: "Sekarang" }] },
  JVS:    { name: "Gd Jesico Valerius Sasmita",                titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2022", until: "Sekarang" }] },
  AS:     { name: "Nyoman Ayu Suryantininghati",               titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2018", until: "Sekarang" }] },
  GAKLIE: { name: "Gusti Ayu Ketut Lintang Indah Esterlita",   titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2020", until: "Sekarang" }] },
  AEPTB:  { name: "Anggrayni Eka Putri Tresna Bunga",          titles: ["Pendeta"],          serviceHistory: [{ ministryId: "sinode-gkpb",            from: "2021", until: "Sekarang" }] },
};

// Daftar gelar yang tersedia di GKPB
export const TITLE_OPTIONS = [
  { value: "Pdt.",        label: "Pendeta (Pdt.)"                    },
  { value: "Pdt. Em.",    label: "Pendeta Emeritus (Pdt. Em.)"       },
  { value: "Biskop",      label: "Biskop"                            },
  { value: "Vikaris",     label: "Vikaris"                           },
  { value: "Ev.",         label: "Evangelis (Ev.)"                   },
  { value: "Pnt.",        label: "Penatua (Pnt.)"                    },
  { value: "Diaken",      label: "Diaken"                            },
  { value: "S.Si. Teol",  label: "S.Si. Teol"                        },
  { value: "M.Th.",       label: "M.Th."                             },
  { value: "D.Th.",       label: "D.Th."                             },
];

// ─── Devotional ───────────────────────────────────────────────────────────────
export const DEVOTIONAL = {
  title: "Prinsip Dan Praktik",
  authorCode: "IWM",
  audioUrl: "",  // diisi admin via UploadThing
  body: `Menjadi Kristen bukan hanya soal status, atau sekadar rutinitas rohani yang dilakukan. Menjadi Kristen berarti kita hidup sesuai dengan prinsip Tuhan dan mengimplementasikannya dalam praktik sehari-hari.

Bacaan pertama merupakan nasihat seorang ibu kepada Raja Lemuel (Amsal 31:1). Umat Allah dipanggil untuk menjadi pembela keadilan bagi mereka yang tidak mampu membela diri. Diam terhadap ketidakadilan bukanlah sikap yang benar sebagai anak Tuhan.

Banyak orang Kristen memahami prinsip kasih dan keadilan, namun gagal mempraktikkannya. Iman tanpa perbuatan adalah mati. Maka panggilan kita hari ini adalah menerjemahkan iman menjadi tindakan nyata: membela yang lemah, berpihak kepada yang tertindas, dan menjadi suara bagi mereka yang tidak didengar.

Praktik iman yang sejati lahir dari hati yang sungguh-sungguh mengenal Tuhan. Marilah kita memohon kepada-Nya agar diberi hikmat dan keberanian untuk hidup sesuai prinsip-Nya setiap hari.`,
  prayer: "Tuhan berilah kami hati untuk dapat hidup sebagai anak-anak Tuhan yang mampu mempraktikan kasih bagi sesama. Amin",
};

export const PRAYER_TOPIC = {
  title: "Sesama kita",
  text: "Tetangga, teman sekerja, partner dalam perdagangan. Penghiburan, nasehat dan bantuan untuk para pengungsi, penganggur; orang-orang yang sakit, lemah, buta, bisu atau cacat. Para janda dan duda, orang-orang yang kerasukan, yang ada dalam godaan, para tahanan, para korban penindasan dan kekuasaan.",
};

// ─── Special verses ───────────────────────────────────────────────────────────
export const SPECIAL_VERSES = [
  { label: "AYAT MINGGU", reference: "2 Korintus 5:17", text: "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang.", date: "Minggu, 3 Mei 2026" },
  { label: "AYAT BULAN MEI", reference: "Roma 8:28", text: "Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia." },
  { label: "AYAT TAHUN 2026", reference: "Wahyu 21:5", text: "Lihatlah, Aku menjadikan segala sesuatu baru!" },
];

// ─── Ayat Emas — by category ──────────────────────────────────────────────────
export const AYAT_CATEGORIES = [
  {
    category: "Iman & Pengharapan",
    verses: [
      { label: "IMAN", reference: "Ibrani 11:1", text: "Iman adalah dasar dari segala sesuatu yang kita harapkan dan bukti dari segala sesuatu yang tidak kita lihat." },
      { label: "PENGHARAPAN", reference: "Roma 15:13", text: "Semoga Allah, sumber pengharapan, memenuhi kamu dengan segala sukacita dan damai sejahtera dalam iman kamu." },
      { label: "KEPERCAYAAN", reference: "Amsal 3:5–6", text: "Percayalah kepada TUHAN dengan segenap hatimu dan janganlah bersandar kepada pengertianmu sendiri." },
    ],
  },
  {
    category: "Kasih & Pelayanan",
    verses: [
      { label: "KASIH ALLAH", reference: "Yohanes 3:16", text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal." },
      { label: "KASIH SESAMA", reference: "1 Korintus 13:4", text: "Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong." },
      { label: "PELAYANAN", reference: "Matius 20:28", text: "Sama seperti Anak Manusia datang bukan untuk dilayani, melainkan untuk melayani." },
    ],
  },
  {
    category: "Kekuatan & Keberanian",
    verses: [
      { label: "KEKUATAN", reference: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
      { label: "KEBERANIAN", reference: "Yosua 1:9", text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau." },
    ],
  },
  {
    category: "Damai & Istirahat",
    verses: [
      { label: "DAMAI", reference: "Yohanes 14:27", text: "Damai sejahtera Kutinggalkan bagimu. Damai sejahtera-Ku Kuberikan kepadamu, dan apa yang Kuberikan tidak seperti yang diberikan oleh dunia kepadamu." },
      { label: "ISTIRAHAT", reference: "Matius 11:28", text: "Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu." },
    ],
  },
  {
    category: "Keadilan & Kebijaksanaan",
    verses: [
      { label: "KEADILAN", reference: "Amsal 31:8", text: "Bukalah mulutmu untuk orang yang bisu, untuk hak semua orang yang merana." },
      { label: "HIKMAT", reference: "Yakobus 1:5", text: "Tetapi apabila di antara kamu ada yang kekurangan hikmat, hendaklah ia memintakannya kepada Allah." },
    ],
  },
];

// ─── Pustaka books ────────────────────────────────────────────────────────────
export const PUSTAKA_BOOKS = [
  { id: 1, title: "Kebijakan Perlindungan Sesama", year: 2026, category: "BUKU", description: "Panduan dan kebijakan perlindungan sesama dalam konteks pelayanan gereja.", pages: 48, previewText: "Dokumen ini memuat kebijakan resmi GKPB dalam hal perlindungan sesama jemaat, dengan prinsip dasar keadilan, kasih, dan martabat manusia. Panduan ini ditujukan bagi seluruh pelayan dan jemaat GKPB." },
  { id: 2, title: "Tata Gereja GKPB 2022", year: 2022, category: "BUKU", description: "Dokumen resmi tata gereja Sinode GKPB edisi terbaru.", pages: 124, previewText: "Tata Gereja GKPB merupakan landasan hukum dan panduan tata kelola bagi seluruh jemaat dan pelayan GKPB. Edisi 2022 memuat pembaruan terkait struktur sinode dan pelayanan wilayah." },
  { id: 3, title: "Panduan Liturgi Tahunan 2026", year: 2026, category: "MATERI", description: "Panduan liturgi dan kalender gerejawi GKPB untuk tahun 2026.", pages: 36, previewText: "Panduan ini memuat susunan liturgi ibadah Minggu dan ibadah khusus sepanjang tahun 2026, mengikuti kalender gerejawi ekumenis yang disesuaikan dengan konteks lokal GKPB." },
  { id: 4, title: "Katekisasi Remaja", year: 2024, category: "MATERI", description: "Materi pembinaan iman bagi remaja Gereja GKPB.", pages: 80, previewText: "Materi katekisasi ini dirancang untuk membangun fondasi iman remaja GKPB melalui pendekatan yang relevan, interaktif, dan berakar pada tradisi gereja reformed." },
  { id: 5, title: "Buku Nyanyian Gereja (BNG)", year: 2023, category: "BUKU", description: "Kumpulan nyanyian pujian yang digunakan dalam ibadah GKPB.", pages: 312, previewText: "Buku Nyanyian Gereja (BNG) GKPB memuat koleksi lengkap nyanyian pujian ekumenis dan nyanyian kontekstual berbahasa Bali yang digunakan dalam berbagai ibadah jemaat." },
  { id: 6, title: "Renungan HUT GKPB ke-90", year: 2026, category: "MATERI", description: "Kumpulan renungan istimewa dalam rangka HUT GKPB ke-90.", pages: 24, previewText: "Dalam rangka merayakan HUT GKPB ke-90, buku renungan ini menghimpun refleksi perjalanan iman gereja dengan tema 'Menjadi Gereja Pembawa Keadilan'." },
  { id: 7, title: "Panduan Persembahan dan Keuangan Jemaat", year: 2025, category: "PANDUAN", description: "Tata kelola keuangan dan persembahan jemaat GKPB.", pages: 32, previewText: "Panduan ini menetapkan prinsip dan prosedur pengelolaan keuangan jemaat secara transparan dan akuntabel, sesuai dengan nilai-nilai integritas Kristiani." },
  { id: 8, title: "Program Pembinaan Keluarga Kristen", year: 2025, category: "MATERI", description: "Materi pembinaan kehidupan keluarga berdasarkan nilai-nilai kristiani.", pages: 64, previewText: "Program ini menyediakan panduan pembinaan keluarga Kristiani bagi pasangan muda, orang tua, dan keluarga GKPB yang ingin membangun rumah tangga berlandaskan iman." },
  { id: 9, title: "Panduan Pelayanan Diakonia", year: 2025, category: "PANDUAN", description: "Panduan pelayanan kasih dan diakonia bagi jemaat GKPB.", pages: 44, previewText: "Panduan diakonia ini memuat prinsip dan praktik pelayanan kasih kepada mereka yang membutuhkan, sebagai wujud nyata iman yang hidup dalam tindakan." },
  { id: 10, title: "Materi Pemuda GKPB 2026", year: 2026, category: "MATERI", description: "Modul pembinaan dan kegiatan pemuda GKPB tahun 2026.", pages: 56, previewText: "Modul ini dirancang untuk mengaktifkan pemuda GKPB dalam kegiatan pelayanan, persekutuan, dan pengembangan diri berbasis nilai-nilai iman Kristiani." },
  { id: 11, title: "Tata Ibadah Hari Raya Gerejawi", year: 2024, category: "BUKU", description: "Susunan tata ibadah untuk hari-hari raya gerejawi khusus.", pages: 88, previewText: "Buku ini memuat tata ibadah resmi untuk Advent, Natal, Paskah, Pentakosta, dan hari-hari raya gerejawi lainnya dalam kalender liturgi GKPB." },
  { id: 12, title: "Kebijakan Lingkungan Hidup GKPB", year: 2025, category: "PANDUAN", description: "Komitmen dan kebijakan GKPB dalam pelestarian lingkungan hidup.", pages: 28, previewText: "Sebagai gereja yang bertanggung jawab, GKPB menyatakan komitmennya terhadap pelestarian ciptaan Tuhan melalui kebijakan lingkungan yang konkret dan terukur." },
];

export const CATEGORIES = ["Semua", "BUKU", "MATERI", "PANDUAN"];
export const PUSTAKA_PER_PAGE = 6;

// ─── Announcement ─────────────────────────────────────────────────────────────
export const ANNOUNCEMENT = {
  text: "HUT GKPB ke-90 — Tema: Menjadi Gereja Pembawa Keadilan",
  link: "/tentang",
};

// ─── Publication info ─────────────────────────────────────────────────────────
export const PUBLICATION_INFO = {
  pujidanjanji: { edition: "296", year: "2026", color: "Biru" },
  janjihidup: {
    period: "April – Juni 2026",
    pic: "Departemen Persekutuan dan Pembinaan (DEPTUBIN) — Gereja Kristen Protestan di Bali (GKPB)",
    team: "Tim Penyusun DEPTUBIN GKPB",
    editor: "Wigiyanto",
    audio: "LKSA Widhya Asih Singaraja",
    madeBy: "TIM IT Kantor Sinode GKPB",
  },
  contact: {
    address: "Jl. Raya Kapal No 20, Kapal – Mengwi – Mangupura – Bali",
    phone: "(0361) 4422726 / 4425117",
    email: "sinode.gkpb@gmail.com",
    website: "www.balichurchsynod.org",
  },
};

export const GKPB_INFO = {
  visi: "Menjadi Gereja yang membawa damai sejahtera Allah kepada seluruh ciptaan, berakar pada firman Tuhan, dan bertumbuh dalam kasih yang nyata di tengah masyarakat Bali dan Indonesia.",
  misi: [
    "Membangun persekutuan jemaat yang hidup, hangat, dan saling melayani.",
    "Memberitakan Injil Yesus Kristus kepada seluruh lapisan masyarakat.",
    "Menegakkan keadilan dan membela hak-hak mereka yang lemah dan terpinggirkan.",
    "Memelihara keutuhan ciptaan dan turut bertanggung jawab atas kelestarian lingkungan.",
    "Mengembangkan pelayan-pelayan gereja yang kompeten, berkarakter, dan berhati hamba.",
  ],
  theme2026: "Menjadi Gereja Pembawa Keadilan",
  subtheme2026: "Diubahkan Kristus Untuk Bertindak Adil",
};
// ─── Mazmur Minggu ─────────────────────────────────────────────────────────────
export const MAZMUR_MINGGU = {
  reference: "Mazmur 98:1–9",
  title: "Nyanyian Syukur atas Keselamatan",
  verses: [
    { number: "98:1", text: "Nyanyikanlah nyanyian baru bagi TUHAN, sebab Ia telah melakukan perbuatan-perbuatan yang ajaib; keselamatan telah dikerjakan oleh tangan kanan-Nya, oleh lengan-Nya yang kudus." },
    { number: "98:2", text: "TUHAN telah memperkenalkan keselamatan yang dari pada-Nya, keadilan-Nya telah dinyatakan-Nya di depan mata bangsa-bangsa." },
    { number: "98:3", text: "Ia mengingat kasih setia-Nya dan kesetiaan-Nya kepada kaum Israel; segala ujung bumi telah melihat keselamatan yang dari Allah kita." },
    { number: "98:4", text: "Bersorak-sorailah bagi TUHAN, hai seluruh bumi, bergembiralah, bersorak-sorailah dan bermazmurlah!" },
  ],
};

// ─── Bahan Khotbah ─────────────────────────────────────────────────────────────
export const BAHAN_KHOTBAH = {
  reference: "Lukas 24:36–49",
  title: "Kristus Bangkit Hadir di Tengah Kita",
  thema: "Kehadiran Kristus yang Bangkit",
  pendahuluan: "Setelah kebangkitan-Nya, Yesus tidak meninggalkan para murid begitu saja. Ia hadir di tengah-tengah mereka dengan damai sejahtera.",
  poinUtama: [
    { judul: "Damai yang melampaui ketakutan", isi: "Yesus mengucapkan 'Damai sejahtera bagi kamu' saat para murid ketakutan dan ragu." },
    { judul: "Bukti nyata kebangkitan", isi: "Yesus menunjukkan tangan dan kaki-Nya — kehadiran yang konkret, bukan hantu." },
    { judul: "Mandat kesaksian", isi: "Mereka diutus untuk memberitakan pertobatan dan pengampunan dosa kepada segala bangsa." },
  ],
  penutup: "Seperti para murid, kita pun dipanggil untuk menjadi saksi kebangkitan Kristus dalam keseharian hidup kita.",
};

// ─── Pokok Doa Harian ─────────────────────────────────────────────────────────
export const POKOK_DOA_HARIAN: { hari: string; topik: string; detail: string }[] = [
  { hari: "Minggu",  topik: "Jemaat-jemaat GKPB",       detail: "Doakan persekutuan dan pertumbuhan rohani seluruh jemaat GKPB di Bali dan sekitarnya." },
  { hari: "Senin",   topik: "Para pelayan gereja",        detail: "Doakan para pendeta, vikaris, dan majelis yang setia melayani di tengah tantangan." },
  { hari: "Selasa",  topik: "Keluarga-keluarga Kristen",  detail: "Doakan keluarga-keluarga yang membangun rumah tangga di atas dasar iman." },
  { hari: "Rabu",    topik: "Pendidikan dan generasi muda", detail: "Doakan sekolah-sekolah Kristen, mahasiswa teologi, dan pemuda GKPB." },
  { hari: "Kamis",   topik: "Misi dan penginjilan",       detail: "Doakan pelayanan misi di daerah-daerah yang belum terjangkau Injil." },
  { hari: "Jumat",   topik: "Mereka yang menderita",      detail: "Doakan yang sakit, berduka, dan tertindas — agar merasakan kasih dan penghiburan Tuhan." },
  { hari: "Sabtu",   topik: "Lingkungan dan ciptaan",     detail: "Doakan tanggung jawab gereja dalam menjaga kelestarian alam ciptaan Tuhan." },
];

// ─── Ayat Nats ────────────────────────────────────────────────────────────────
export const AYAT_NATS = {
  reference: "Lukas 24:48",
  text: "Dan kamu adalah saksi dari semuanya ini.",
};
