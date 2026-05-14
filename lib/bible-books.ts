// ─── Daftar Kitab Alkitab (PL + PB) ──────────────────────────────────────────
// `slug` = nama yang dipakai di URL LAI Bible API
// Format: GET /bible/tb/{slug}/{chapter}/{verse-range}

export interface BibleBook {
  slug:      string;   // untuk LAI API: "kejadian", "1samuel", "wahyu"
  name:      string;   // tampilan: "Kejadian", "1 Samuel", "Wahyu"
  abbr:      string;   // singkatan: "Kej", "1Sam", "Why"
  testament: "PL" | "PB";
  chapters:  number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // ── Perjanjian Lama ────────────────────────────────────────────────────────
  { slug: "kejadian",       name: "Kejadian",         abbr: "Kej",  testament: "PL", chapters: 50  },
  { slug: "keluaran",       name: "Keluaran",          abbr: "Kel",  testament: "PL", chapters: 40  },
  { slug: "imamat",         name: "Imamat",            abbr: "Im",   testament: "PL", chapters: 27  },
  { slug: "bilangan",       name: "Bilangan",          abbr: "Bil",  testament: "PL", chapters: 36  },
  { slug: "ulangan",        name: "Ulangan",           abbr: "Ul",   testament: "PL", chapters: 34  },
  { slug: "yosua",          name: "Yosua",             abbr: "Yos",  testament: "PL", chapters: 24  },
  { slug: "hakimhakim",     name: "Hakim-hakim",       abbr: "Hak",  testament: "PL", chapters: 21  },
  { slug: "rut",            name: "Rut",               abbr: "Rut",  testament: "PL", chapters: 4   },
  { slug: "1samuel",        name: "1 Samuel",          abbr: "1Sam", testament: "PL", chapters: 31  },
  { slug: "2samuel",        name: "2 Samuel",          abbr: "2Sam", testament: "PL", chapters: 24  },
  { slug: "1raja",          name: "1 Raja-raja",       abbr: "1Raj", testament: "PL", chapters: 22  },
  { slug: "2raja",          name: "2 Raja-raja",       abbr: "2Raj", testament: "PL", chapters: 25  },
  { slug: "1tawarikh",      name: "1 Tawarikh",        abbr: "1Taw", testament: "PL", chapters: 29  },
  { slug: "2tawarikh",      name: "2 Tawarikh",        abbr: "2Taw", testament: "PL", chapters: 36  },
  { slug: "ezra",           name: "Ezra",              abbr: "Ezr",  testament: "PL", chapters: 10  },
  { slug: "nehemia",        name: "Nehemia",           abbr: "Neh",  testament: "PL", chapters: 13  },
  { slug: "ester",          name: "Ester",             abbr: "Est",  testament: "PL", chapters: 10  },
  { slug: "ayub",           name: "Ayub",              abbr: "Ayb",  testament: "PL", chapters: 42  },
  { slug: "mazmur",         name: "Mazmur",            abbr: "Mzm",  testament: "PL", chapters: 150 },
  { slug: "amsal",          name: "Amsal",             abbr: "Ams",  testament: "PL", chapters: 31  },
  { slug: "pengkhotbah",    name: "Pengkhotbah",       abbr: "Pkh",  testament: "PL", chapters: 12  },
  { slug: "kidungagung",    name: "Kidung Agung",      abbr: "Kid",  testament: "PL", chapters: 8   },
  { slug: "yesaya",         name: "Yesaya",            abbr: "Yes",  testament: "PL", chapters: 66  },
  { slug: "yeremia",        name: "Yeremia",           abbr: "Yer",  testament: "PL", chapters: 52  },
  { slug: "ratapan",        name: "Ratapan",           abbr: "Rat",  testament: "PL", chapters: 5   },
  { slug: "yehezkiel",      name: "Yehezkiel",         abbr: "Yeh",  testament: "PL", chapters: 48  },
  { slug: "daniel",         name: "Daniel",            abbr: "Dan",  testament: "PL", chapters: 12  },
  { slug: "hosea",          name: "Hosea",             abbr: "Hos",  testament: "PL", chapters: 14  },
  { slug: "yoel",           name: "Yoel",              abbr: "Yoel", testament: "PL", chapters: 3   },
  { slug: "amos",           name: "Amos",              abbr: "Am",   testament: "PL", chapters: 9   },
  { slug: "obaja",          name: "Obaja",             abbr: "Ob",   testament: "PL", chapters: 1   },
  { slug: "yunus",          name: "Yunus",             abbr: "Yun",  testament: "PL", chapters: 4   },
  { slug: "mikha",          name: "Mikha",             abbr: "Mi",   testament: "PL", chapters: 7   },
  { slug: "nahum",          name: "Nahum",             abbr: "Nah",  testament: "PL", chapters: 3   },
  { slug: "habakuk",        name: "Habakuk",           abbr: "Hab",  testament: "PL", chapters: 3   },
  { slug: "zefanya",        name: "Zefanya",           abbr: "Zef",  testament: "PL", chapters: 3   },
  { slug: "hagai",          name: "Hagai",             abbr: "Hag",  testament: "PL", chapters: 2   },
  { slug: "zakharia",       name: "Zakharia",          abbr: "Za",   testament: "PL", chapters: 14  },
  { slug: "maleakhi",       name: "Maleakhi",          abbr: "Mal",  testament: "PL", chapters: 4   },

  // ── Perjanjian Baru ────────────────────────────────────────────────────────
  { slug: "matius",         name: "Matius",            abbr: "Mat",  testament: "PB", chapters: 28  },
  { slug: "markus",         name: "Markus",            abbr: "Mrk",  testament: "PB", chapters: 16  },
  { slug: "lukas",          name: "Lukas",             abbr: "Luk",  testament: "PB", chapters: 24  },
  { slug: "yohanes",        name: "Yohanes",           abbr: "Yoh",  testament: "PB", chapters: 21  },
  { slug: "kisahpararasul", name: "Kisah Para Rasul",  abbr: "Kis",  testament: "PB", chapters: 28  },
  { slug: "roma",           name: "Roma",              abbr: "Rm",   testament: "PB", chapters: 16  },
  { slug: "1korintus",      name: "1 Korintus",        abbr: "1Kor", testament: "PB", chapters: 16  },
  { slug: "2korintus",      name: "2 Korintus",        abbr: "2Kor", testament: "PB", chapters: 13  },
  { slug: "galatia",        name: "Galatia",           abbr: "Gal",  testament: "PB", chapters: 6   },
  { slug: "efesus",         name: "Efesus",            abbr: "Ef",   testament: "PB", chapters: 6   },
  { slug: "filipi",         name: "Filipi",            abbr: "Flp",  testament: "PB", chapters: 4   },
  { slug: "kolose",         name: "Kolose",            abbr: "Kol",  testament: "PB", chapters: 4   },
  { slug: "1tesalonika",    name: "1 Tesalonika",      abbr: "1Tes", testament: "PB", chapters: 5   },
  { slug: "2tesalonika",    name: "2 Tesalonika",      abbr: "2Tes", testament: "PB", chapters: 3   },
  { slug: "1timotius",      name: "1 Timotius",        abbr: "1Tim", testament: "PB", chapters: 6   },
  { slug: "2timotius",      name: "2 Timotius",        abbr: "2Tim", testament: "PB", chapters: 4   },
  { slug: "titus",          name: "Titus",             abbr: "Tit",  testament: "PB", chapters: 3   },
  { slug: "filemon",        name: "Filemon",           abbr: "Flm",  testament: "PB", chapters: 1   },
  { slug: "ibrani",         name: "Ibrani",            abbr: "Ibr",  testament: "PB", chapters: 13  },
  { slug: "yakobus",        name: "Yakobus",           abbr: "Yak",  testament: "PB", chapters: 5   },
  { slug: "1petrus",        name: "1 Petrus",          abbr: "1Ptr", testament: "PB", chapters: 5   },
  { slug: "2petrus",        name: "2 Petrus",          abbr: "2Ptr", testament: "PB", chapters: 3   },
  { slug: "1yohanes",       name: "1 Yohanes",         abbr: "1Yoh", testament: "PB", chapters: 5   },
  { slug: "2yohanes",       name: "2 Yohanes",         abbr: "2Yoh", testament: "PB", chapters: 1   },
  { slug: "3yohanes",       name: "3 Yohanes",         abbr: "3Yoh", testament: "PB", chapters: 1   },
  { slug: "yudas",          name: "Yudas",             abbr: "Yud",  testament: "PB", chapters: 1   },
  { slug: "wahyu",          name: "Wahyu",             abbr: "Why",  testament: "PB", chapters: 22  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export function findBook(nameOrSlug: string): BibleBook | undefined {
  const q = nameOrSlug.toLowerCase().replace(/\s/g, "");
  return BIBLE_BOOKS.find(
    (b) =>
      b.slug === q ||
      b.name.toLowerCase().replace(/\s/g, "") === q ||
      b.abbr.toLowerCase() === q
  );
}

/** Format referensi untuk display: "1 Samuel 2:1-36" */
export function formatRef(bookName: string, chapter: number, verseFrom: number, verseTo: number): string {
  if (verseFrom === verseTo) return `${bookName} ${chapter}:${verseFrom}`;
  return `${bookName} ${chapter}:${verseFrom}–${verseTo}`;
}
/**
 * Parse referensi ayat → book + chapter + verse
 * Handles: "Ayub 12: 10", "1 Samuel 3:1-5", "Lukas 23: 46", "Yohanes 3: 16"
 */
export interface ParsedRef {
  book:      BibleBook;
  chapter:   number;
  verseFrom: number;
  verseTo:   number;
}

export function parseReference(ref: string): ParsedRef | null {
  // Regex: {bookName} {chapter}:{verseFrom}[-{verseTo}]
  // bookName bisa "Ayub", "1 Samuel", "2 Raja-raja", dll.
  const m = ref.trim().match(/^(.+?)\s+(\d+)\s*[:：]\s*(\d+)(?:\s*[-–—]\s*(\d+))?/);
  if (!m) return null;
  const book = findBook(m[1].trim());
  if (!book) return null;
  return {
    book,
    chapter:   parseInt(m[2]),
    verseFrom: parseInt(m[3]),
    verseTo:   m[4] ? parseInt(m[4]) : parseInt(m[3]),
  };
}
