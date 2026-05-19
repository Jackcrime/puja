// ─── Firestore Seed Script (v2 — struktur baru) ───────────────────────────────
// Perubahan dari v1:
//  • Perikop sekarang disematkan di bible_readings sebagai perikopRefs
//  • Halaman admin sudah di-merge jadi satu (/admin/ayat dengan 3 tab)
//  • DWMY tetap di ayat_khusus, tapi sekarang dipilih via Bible API selector
//
// CARA PAKAI:
//   npx tsx scripts/seed.ts
//
// Aman dijalankan berulang — setDoc = overwrite.

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";
// ─── Data seed — inline agar seed.ts tidak bergantung pada app runtime ────────

const DEVOTIONAL = {
  title:      "Prinsip Dan Praktik",
  authorCode: "IWM",
  audioUrl:   "",
  body: `Menjadi Kristen bukan hanya soal status, atau sekadar rutinitas rohani yang dilakukan. Menjadi Kristen berarti kita hidup sesuai dengan prinsip Tuhan dan mengimplementasikannya dalam praktik sehari-hari.

Bacaan pertama merupakan nasihat seorang ibu kepada Raja Lemuel (Amsal 31:1). Umat Allah dipanggil untuk menjadi pembela keadilan bagi mereka yang tidak mampu membela diri. Diam terhadap ketidakadilan bukanlah sikap yang benar sebagai anak Tuhan.

Banyak orang Kristen memahami prinsip kasih dan keadilan, namun gagal mempraktikkannya. Iman tanpa perbuatan adalah mati. Maka panggilan kita hari ini adalah menerjemahkan iman menjadi tindakan nyata: membela yang lemah, berpihak kepada yang tertindas, dan menjadi suara bagi mereka yang tidak didengar.

Praktik iman yang sejati lahir dari hati yang sungguh-sungguh mengenal Tuhan. Marilah kita memohon kepada-Nya agar diberi hikmat dan keberanian untuk hidup sesuai prinsip-Nya setiap hari.`,
  prayer: "Tuhan berilah kami hati untuk dapat hidup sebagai anak-anak Tuhan yang mampu mempraktikan kasih bagi sesama. Amin",
};

const VERSE_HIGHLIGHTS = [
  { reference: "Amsal 31:8",  text: "Bukalah mulutmu untuk orang yang bisu, untuk hak semua orang yang merana." },
  { reference: "Markus 2:4",  text: "Mereka tidak dapat membawanya kepada-Nya karena orang banyak itu, lalu mereka membuka atap yang di atas-Nya." },
];

const SPECIAL_VERSES = [
  { label: "AYAT MINGGU",     reference: "2 Korintus 5:17", text: "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru: yang lama sudah berlalu, sesungguhnya yang baru sudah datang.", date: "Minggu, 3 Mei 2026" },
  { label: "AYAT BULAN MEI",  reference: "Roma 8:28",        text: "Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia." },
  { label: "AYAT TAHUN 2026", reference: "Wahyu 21:5",       text: "Lihatlah, Aku menjadikan segala sesuatu baru!" },
];

const PRAYER_TOPIC = {
  title: "Sesama kita",
  text:  "Tetangga, teman sekerja, partner dalam perdagangan. Penghiburan, nasehat dan bantuan untuk para pengungsi, penganggur; orang-orang yang sakit, lemah, buta, bisu atau cacat. Para janda dan duda, orang-orang yang kerasukan, yang ada dalam godaan, para tahanan, para korban penindasan dan kekuasaan.",
};

const ANNOUNCEMENT = {
  text: "HUT GKPB ke-90 — Tema: Menjadi Gereja Pembawa Keadilan",
  link: "/tentang",
};

const AYAT_CATEGORIES = [
  {
    category: "Iman & Pengharapan",
    verses: [
      { label: "IMAN",        reference: "Ibrani 11:1",  text: "Iman adalah dasar dari segala sesuatu yang kita harapkan dan bukti dari segala sesuatu yang tidak kita lihat." },
      { label: "PENGHARAPAN", reference: "Roma 15:13",   text: "Semoga Allah, sumber pengharapan, memenuhi kamu dengan segala sukacita dan damai sejahtera dalam iman kamu." },
      { label: "KEPERCAYAAN", reference: "Amsal 3:5–6",  text: "Percayalah kepada TUHAN dengan segenap hatimu dan janganlah bersandar kepada pengertianmu sendiri." },
    ],
  },
  {
    category: "Kasih & Pelayanan",
    verses: [
      { label: "KASIH ALLAH",  reference: "Yohanes 3:16",      text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal." },
      { label: "KASIH SESAMA", reference: "1 Korintus 13:4",   text: "Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong." },
      { label: "PELAYANAN",    reference: "Matius 20:28",       text: "Sama seperti Anak Manusia datang bukan untuk dilayani, melainkan untuk melayani." },
    ],
  },
  {
    category: "Kekuatan & Keberanian",
    verses: [
      { label: "KEKUATAN",    reference: "Filipi 4:13", text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
      { label: "KEBERANIAN",  reference: "Yosua 1:9",   text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau." },
    ],
  },
  {
    category: "Damai & Istirahat",
    verses: [
      { label: "DAMAI",      reference: "Yohanes 14:27", text: "Damai sejahtera Kutinggalkan bagimu. Damai sejahtera-Ku Kuberikan kepadamu, dan apa yang Kuberikan tidak seperti yang diberikan oleh dunia kepadamu." },
      { label: "ISTIRAHAT",  reference: "Matius 11:28",  text: "Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu." },
    ],
  },
  {
    category: "Keadilan & Kebijaksanaan",
    verses: [
      { label: "KEADILAN", reference: "Amsal 31:8",   text: "Bukalah mulutmu untuk orang yang bisu, untuk hak semua orang yang merana." },
      { label: "HIKMAT",   reference: "Yakobus 1:5",  text: "Tetapi apabila di antara kamu ada yang kekurangan hikmat, hendaklah ia memintakannya kepada Allah." },
    ],
  },
];

const AUTHORS: Record<string, { name: string; titles: string[]; photoUrl?: string; serviceHistory: { ministryId: string; from: string; until: string }[] }> = {
  IWM:    { name: "I Wayan Mariasa",                            titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2010", until: "Sekarang" }] },
  KDPA:   { name: "Kadek Dwi Prayoga Aditya",                   titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2015", until: "Sekarang" }] },
  ISUN:   { name: "Dewi Sundari",                               titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2012", until: "Sekarang" }] },
  VMYB:   { name: "Viyata Margareta Yuliana Bolla, S.Si. Teol", titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2014", until: "Sekarang" }] },
  MFGA:   { name: "Made Fennoni Gressia Asrining, S.Si. Teol",  titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2016", until: "Sekarang" }] },
  IMAAP:  { name: "I Made Andika Adi Putra",                    titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2013", until: "Sekarang" }] },
  VIJE:   { name: "Julius Jefry Lumansik",                      titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2011", until: "Sekarang" }] },
  ATAANO: { name: "Martha Yunita Ano",                          titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2018", until: "Sekarang" }] },
  KAJ:    { name: "Komang Agus Juliawan",                       titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2017", until: "Sekarang" }] },
  KY:     { name: "Karenda Yucha, S.Si., Teol",                 titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2019", until: "Sekarang" }] },
  HW:     { name: "Hety Widowaty Soewondo",                     titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2009", until: "Sekarang" }] },
  PJD:    { name: "Paulina Jasri Danggo",                       titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2020", until: "Sekarang" }] },
  WAW:    { name: "Wayan Agus Wiratama",                        titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2016", until: "Sekarang" }] },
  KS:     { name: "Kadek Suriani",                              titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2021", until: "Sekarang" }] },
  JoJo:   { name: "Jonnie Josua",                               titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2022", until: "Sekarang" }] },
  PAP:    { name: "Penta Astari Prasetya",                      titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2023", until: "Sekarang" }] },
  PSA:    { name: "Putu Surya Adinata",                         titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2022", until: "Sekarang" }] },
  NJL:    { name: "Nafthalia Julita Leander",                   titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2018", until: "Sekarang" }] },
  CWP:    { name: "Christiana Welda Putranti",                  titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2015", until: "Sekarang" }] },
  IPEUS:  { name: "I Putu Elika Uria Setiawan",                 titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2023", until: "Sekarang" }] },
  KBWU:   { name: "Kadek Bagus Wisesa Uryana",                  titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2020", until: "Sekarang" }] },
  IRHB:   { name: "Izak Rio Hernemus Bainuan",                  titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2017", until: "Sekarang" }] },
  TW:     { name: "Trifena Wati",                               titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2019", until: "Sekarang" }] },
  PR:     { name: "Putu Recita",                                titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2021", until: "Sekarang" }] },
  DS:     { name: "Debora Seilatu",                             titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2018", until: "Sekarang" }] },
  SH:     { name: "Somenifati Hia",                             titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2016", until: "Sekarang" }] },
  FPP:    { name: "Fajar Pratama Putra",                        titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2020", until: "Sekarang" }] },
  A3P:    { name: "Anak Agung Ayu Perani",                      titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2014", until: "Sekarang" }] },
  DEAP:   { name: "Dewa Gede Adi Pranata",                      titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2022", until: "Sekarang" }] },
  MHS:    { name: "Merry Handayani Sayuna",                     titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2019", until: "Sekarang" }] },
  FAO:    { name: "Finsensius Apola Oematan",                   titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2021", until: "Sekarang" }] },
  YDS:    { name: "Yosef Destian Setiawan",                     titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2023", until: "Sekarang" }] },
  JVS:    { name: "Gd Jesico Valerius Sasmita",                 titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2022", until: "Sekarang" }] },
  AS:     { name: "Nyoman Ayu Suryantininghati",                titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2018", until: "Sekarang" }] },
  GAKLIE: { name: "Gusti Ayu Ketut Lintang Indah Esterlita",    titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2020", until: "Sekarang" }] },
  AEPTB:  { name: "Anggrayni Eka Putri Tresna Bunga",           titles: [],  serviceHistory: [{ ministryId: "sinode-gkpb", from: "2021", until: "Sekarang" }] },
};

const PUSTAKA_BOOKS = [
  { id: 1,  title: "Kebijakan Perlindungan Sesama",           year: 2026, category: "BUKU",    description: "Panduan dan kebijakan perlindungan sesama dalam konteks pelayanan gereja.",                   pages: 48,  previewText: "Dokumen ini memuat kebijakan resmi GKPB dalam hal perlindungan sesama jemaat, dengan prinsip dasar keadilan, kasih, dan martabat manusia." },
  { id: 2,  title: "Tata Gereja GKPB 2022",                   year: 2022, category: "BUKU",    description: "Dokumen resmi tata gereja Sinode GKPB edisi terbaru.",                                       pages: 124, previewText: "Tata Gereja GKPB merupakan landasan hukum dan panduan tata kelola bagi seluruh jemaat dan pelayan GKPB." },
  { id: 3,  title: "Panduan Liturgi Tahunan 2026",             year: 2026, category: "MATERI",  description: "Panduan liturgi dan kalender gerejawi GKPB untuk tahun 2026.",                                pages: 36,  previewText: "Panduan ini memuat susunan liturgi ibadah Minggu dan ibadah khusus sepanjang tahun 2026." },
  { id: 4,  title: "Katekisasi Remaja",                        year: 2024, category: "MATERI",  description: "Materi pembinaan iman bagi remaja Gereja GKPB.",                                             pages: 80,  previewText: "Materi katekisasi ini dirancang untuk membangun fondasi iman remaja GKPB melalui pendekatan yang relevan dan interaktif." },
  { id: 5,  title: "Buku Nyanyian Gereja (BNG)",               year: 2023, category: "BUKU",    description: "Kumpulan nyanyian pujian yang digunakan dalam ibadah GKPB.",                                 pages: 312, previewText: "Buku Nyanyian Gereja (BNG) GKPB memuat koleksi lengkap nyanyian pujian ekumenis dan kontekstual berbahasa Bali." },
  { id: 6,  title: "Renungan HUT GKPB ke-90",                  year: 2026, category: "MATERI",  description: "Kumpulan renungan istimewa dalam rangka HUT GKPB ke-90.",                                    pages: 24,  previewText: "Dalam rangka merayakan HUT GKPB ke-90, buku renungan ini menghimpun refleksi perjalanan iman gereja." },
  { id: 7,  title: "Panduan Persembahan dan Keuangan Jemaat",  year: 2025, category: "PANDUAN", description: "Tata kelola keuangan dan persembahan jemaat GKPB.",                                          pages: 32,  previewText: "Panduan ini menetapkan prinsip dan prosedur pengelolaan keuangan jemaat secara transparan dan akuntabel." },
  { id: 8,  title: "Program Pembinaan Keluarga Kristen",       year: 2025, category: "MATERI",  description: "Materi pembinaan kehidupan keluarga berdasarkan nilai-nilai kristiani.",                     pages: 64,  previewText: "Program ini menyediakan panduan pembinaan keluarga Kristiani bagi pasangan muda dan orang tua." },
  { id: 9,  title: "Panduan Pelayanan Diakonia",               year: 2025, category: "PANDUAN", description: "Panduan pelayanan kasih dan diakonia bagi jemaat GKPB.",                                     pages: 44,  previewText: "Panduan diakonia ini memuat prinsip dan praktik pelayanan kasih kepada mereka yang membutuhkan." },
  { id: 10, title: "Materi Pemuda GKPB 2026",                  year: 2026, category: "MATERI",  description: "Modul pembinaan dan kegiatan pemuda GKPB tahun 2026.",                                       pages: 56,  previewText: "Modul ini dirancang untuk mengaktifkan pemuda GKPB dalam kegiatan pelayanan, persekutuan, dan pengembangan diri." },
  { id: 11, title: "Tata Ibadah Hari Raya Gerejawi",           year: 2024, category: "BUKU",    description: "Susunan tata ibadah untuk hari-hari raya gerejawi khusus.",                                  pages: 88,  previewText: "Buku ini memuat tata ibadah resmi untuk Advent, Natal, Paskah, Pentakosta, dan hari-hari raya gerejawi lainnya." },
  { id: 12, title: "Kebijakan Lingkungan Hidup GKPB",          year: 2025, category: "PANDUAN", description: "Komitmen dan kebijakan GKPB dalam pelestarian lingkungan hidup.",                            pages: 28,  previewText: "GKPB menyatakan komitmennya terhadap pelestarian ciptaan Tuhan melalui kebijakan lingkungan yang konkret." },
];

const app = initializeApp({
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const db  = getFirestore(app);
const log = (label: string) => console.log(`  ✓ ${label}`);

// ─── Bible Readings dengan perikopRefs ───────────────────────────────────────
const BIBLE_READINGS_WITH_PERIKOP = [
  {
    reference: "Yohanes 8:31–36",
    title:     "Kebenaran yang Memerdekakan",
    verses: [
      { number: "8:31", text: "Maka kata-Nya kepada orang-orang Yahudi yang percaya kepada-Nya: \"Jikalau kamu tetap dalam firman-Ku, kamu benar-benar adalah murid-Ku\"" },
      { number: "8:32", text: "dan kamu akan mengetahui kebenaran, dan kebenaran itu akan memerdekakan kamu." },
      { number: "8:36", text: "Jadi apabila Anak itu memerdekakan kamu, kamupun benar-benar merdeka." },
    ],
    perikopRefs: [
      { id: "pr-1", bookSlug: "galatia", bookName: "Galatia", chapter: 5, verseFrom: 1, verseTo: 1, heading: "Kemerdekaan dalam Kristus" },
      { id: "pr-2", bookSlug: "roma",    bookName: "Roma",    chapter: 6, verseFrom: 17, verseTo: 18, heading: "Bebas dari dosa, hamba kebenaran" },
    ],
  },
  {
    reference: "Mazmur 46:1–11",
    title:     "Allah Tempat Perlindungan Kita",
    verses: [
      { number: "46:1",  text: "Allah itu bagi kita tempat perlindungan dan kekuatan, sebagai penolong dalam kesesakan sangat terbukti." },
      { number: "46:10", text: "Diamlah dan ketahuilah, bahwa Akulah Allah!" },
    ],
    perikopRefs: [
      { id: "pr-3", bookSlug: "mazmur", bookName: "Mazmur", chapter: 91, verseFrom: 1, verseTo: 2, heading: "Di bawah perlindungan Yang Mahatinggi" },
    ],
  },
];

// ─── Ayat Khusus (DWMY) ───────────────────────────────────────────────────────
const AYAT_KHUSUS = {
  tahun:  { year: 2026, reference: "Wahyu 21:5",       text: "Lihatlah, Aku menjadikan segala sesuatu baru!" },
  minggu: { reference: "2 Korintus 5:17",               text: "Siapa yang ada di dalam Kristus, ia adalah ciptaan baru.", date: "" },
  harian: [
    { reference: "Filipi 4:13",   text: "Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku." },
    { reference: "Yohanes 3:16",  text: "Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal." },
    { reference: "Mazmur 23:1",   text: "TUHAN adalah gembalaku, takkan kekurangan aku." },
    { reference: "Yeremia 29:11", text: "Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu, demikianlah firman TUHAN, yaitu rancangan damai sejahtera." },
    { reference: "Yosua 1:9",     text: "Kuatkan dan teguhkanlah hatimu, janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau ke mana pun engkau pergi." },
  ],
  bulan: {
    "1":  { reference: "Ulangan 6:5",     text: "Kasihilah TUHAN, Allahmu, dengan segenap hatimu dan dengan segenap jiwamu dan dengan segenap kekuatanmu." },
    "2":  { reference: "Ulangan 26:11",   text: "Haruslah engkau bersukaria karena segala yang baik yang diberikan TUHAN, Allahmu, kepadamu dan kepada seisi rumahmu." },
    "3":  { reference: "Yohanes 11:35",   text: "Maka menangislah Yesus." },
    "4":  { reference: "Yohanes 20:29",   text: "Berbahagialah mereka yang tidak melihat, namun percaya." },
    "5":  { reference: "Ibrani 6:19",     text: "Pengharapan itu adalah sauh yang kuat dan aman bagi jiwa kita." },
    "6":  { reference: "Ibrani 13:3",     text: "Ingatlah akan orang-orang hukuman, karena kamu sendiri juga adalah orang-orang hukuman." },
    "7":  { reference: "Amos 5:24",       text: "Biarlah keadilan bergulung-gulung seperti air dan kebenaran seperti sungai yang selalu mengalir." },
    "8":  { reference: "Yohanes 10:10b",  text: "Aku datang, supaya mereka mempunyai hidup, dan mempunyainya dalam segala kelimpahan." },
    "9":  { reference: "Pengkhotbah 4:6", text: "Segenggam ketenangan lebih baik dari pada dua genggam jerih payah dan usaha menjaring angin." },
    "10": { reference: "Galatia 5:1",     text: "Kristus telah memerdekakan kita. Karena itu berdirilah teguh dan jangan mau lagi dikenakan kuk perhambaan." },
    "11": { reference: "Yesaya 2:4",      text: "Bangsa tidak akan lagi mengangkat pedang terhadap bangsa, dan mereka tidak akan lagi belajar perang." },
    "12": { reference: "Yesaya 11:7",     text: "Lembu dan beruang akan sama-sama makan rumput dan anaknya akan sama-sama berbaring, sedang singa akan makan jerami seperti lembu." },
  },
};

async function seed() {
  console.log("\n🌱 Memulai seed data ke Firestore (v2)...\n");

  await setDoc(doc(db, "devotional",        "current"), DEVOTIONAL);                                        log("devotional/current");
  await setDoc(doc(db, "ayat_khusus",       "current"), AYAT_KHUSUS);                                      log("ayat_khusus/current (DWMY)");
  await setDoc(doc(db, "ayat_categories",   "current"), { items: AYAT_CATEGORIES });                       log("ayat_categories/current");
  await setDoc(doc(db, "bible_readings",    "current"), { items: BIBLE_READINGS_WITH_PERIKOP });            log(`bible_readings/current (${BIBLE_READINGS_WITH_PERIKOP.length} bacaan + perikopRefs)`);
  await setDoc(doc(db, "verse_highlights",  "current"), { items: VERSE_HIGHLIGHTS });                      log("verse_highlights/current");
  await setDoc(doc(db, "special_verses",    "current"), { items: SPECIAL_VERSES });                        log("special_verses/current");
  await setDoc(doc(db, "prayer_topic",      "current"), PRAYER_TOPIC);                                     log("prayer_topic/current");
  await setDoc(doc(db, "announcement",      "current"), ANNOUNCEMENT);                                     log("announcement/current");
  await setDoc(doc(db, "authors",           "current"), AUTHORS);                                           log("authors/current");

  const batch = writeBatch(db);
  PUSTAKA_BOOKS.forEach((book) => {
    batch.set(doc(collection(db, "pustaka_books"), String(book.id)), {
      ...book, id: String(book.id), fileUrl: "", fileStoragePath: "", audioUrl: "",
    });
  });
  await batch.commit();
  log(`pustaka_books (${PUSTAKA_BOOKS.length} dokumen)`);

  console.log("\n✅ Seed v2 selesai!");
  console.log("\nStruktur baru:");
  console.log("  • /admin/ayat     → 3 tab: Ayat Kategori | DWMY | Bacaan & Perikop");
  console.log("  • perikopRefs kini inline per bacaan (bukan halaman terpisah)");
  console.log("  • DWMY dipilih via Bible API selector (bukan input manual)");
  console.log("  • Halaman lama /admin/ayat-khusus, /admin/perikop, /admin/bacaan = deleted\n");
  process.exit(0);
}

seed().catch((e) => { console.error("\n❌ Seed gagal:", e.message); process.exit(1); });