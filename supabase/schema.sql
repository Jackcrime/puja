-- ═══════════════════════════════════════════════════════════════════════════
-- PUJI & JANJI — Supabase Schema
-- Migrasi dari Firestore + UploadThing → pure Supabase
-- Semua nested data dipecah ke tabel terpisah (TANPA JSONB)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Helper: auto-update updated_at ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Macro: pasang trigger updated_at ke tabel ───────────────────────────────
-- (panggil manual setelah tiap CREATE TABLE yang punya kolom updated_at)


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. DEVOTIONAL
-- date_key: "YYYY-MM-DD" untuk tanggal spesifik, "current" untuk default
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists devotional (
  id          uuid primary key default gen_random_uuid(),
  date_key    text unique not null,          -- "current" | "YYYY-MM-DD"
  title       text not null default '',
  author_code text not null default '',
  audio_url   text not null default '',
  body        text not null default '',
  prayer      text not null default '',
  updated_at  timestamptz not null default now()
);
create trigger trg_devotional_updated_at
  before update on devotional
  for each row execute function set_updated_at();

-- Seed row "current" agar tidak null saat pertama kali dibaca
insert into devotional (date_key) values ('current') on conflict do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. PERIKOP
-- Semua item adalah satu set global (tidak per tanggal)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists perikop_items (
  id         uuid primary key default gen_random_uuid(),
  sort_order int  not null default 0,
  book       text not null default '',
  chapter    int  not null default 1,
  verses     text not null default '',
  heading    text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_perikop_updated_at
  before update on perikop_items
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. VERSE HIGHLIGHTS (AyatHighlights)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists verse_highlights (
  id         uuid primary key default gen_random_uuid(),
  sort_order int  not null default 0,
  reference  text not null default '',
  text       text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_verse_highlights_updated_at
  before update on verse_highlights
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. SPECIAL VERSES
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists special_verses (
  id         uuid primary key default gen_random_uuid(),
  sort_order int  not null default 0,
  label      text not null default '',
  reference  text not null default '',
  text       text not null default '',
  date       text not null default '',       -- opsional, "YYYY-MM-DD"
  updated_at timestamptz not null default now()
);
create trigger trg_special_verses_updated_at
  before update on special_verses
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. ANNOUNCEMENT
-- Single-row config — id selalu 'current'
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists announcement (
  id         text primary key default 'current',
  text       text not null default '',
  link       text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_announcement_updated_at
  before update on announcement
  for each row execute function set_updated_at();

insert into announcement (id) values ('current') on conflict do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. PRAYER TOPIC
-- Single-row config
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists prayer_topic (
  id         text primary key default 'current',
  title      text not null default '',
  text       text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_prayer_topic_updated_at
  before update on prayer_topic
  for each row execute function set_updated_at();

insert into prayer_topic (id) values ('current') on conflict do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. AUTHORS + TITLES + SERVICE HISTORY
-- Normalisasi dari Firestore "authors/current" (object map) → 3 tabel
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists authors (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,           -- "pdtXxx", kunci map lama
  name       text not null default '',
  photo_url  text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_authors_updated_at
  before update on authors
  for each row execute function set_updated_at();

create table if not exists author_titles (
  id          uuid primary key default gen_random_uuid(),
  author_code text not null references authors(code) on delete cascade,
  title       text not null default '',
  sort_order  int  not null default 0
);
create index on author_titles(author_code);

create table if not exists author_service_history (
  id          uuid primary key default gen_random_uuid(),
  author_code text not null references authors(code) on delete cascade,
  ministry_id text not null default '',      -- references ministries.id (text slug)
  from_date   text not null default '',      -- "YYYY" atau "YYYY-MM-DD"
  until_date  text not null default ''       -- "YYYY" atau "sekarang" atau "YYYY-MM-DD"
);
create index on author_service_history(author_code);


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. MINISTRIES
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists ministries (
  id         text primary key,              -- slug: "sinode-gkpb", dll
  name       text not null default '',
  category   text not null default '',
  created_at timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. AYAT CATEGORIES + VERSES
-- Normalisasi dari "ayat_categories/current" → { items: [{category, verses}] }
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists ayat_categories (
  id            uuid primary key default gen_random_uuid(),
  category_name text not null default '',
  sort_order    int  not null default 0,
  updated_at    timestamptz not null default now()
);
create trigger trg_ayat_categories_updated_at
  before update on ayat_categories
  for each row execute function set_updated_at();

create table if not exists ayat_category_verses (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references ayat_categories(id) on delete cascade,
  label       text not null default '',
  reference   text not null default '',
  text        text not null default '',
  sort_order  int  not null default 0
);
create index on ayat_category_verses(category_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. PUSTAKA BOOKS
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists pustaka_books (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null default '',
  year               int  not null default 2024,
  category           text not null default '',
  description        text not null default '',
  pages              int  not null default 0,
  preview_text       text not null default '',
  file_url           text not null default '',
  file_storage_path  text not null default '',
  audio_url          text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_pustaka_updated_at
  before update on pustaka_books
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 11. AYAT KHUSUS
-- Di Firestore: satu doc "ayat_khusus/current" dengan banyak nested key
-- Di sini: dipecah ke 4 tabel
-- ═══════════════════════════════════════════════════════════════════════════

-- 11a. Ayat Tahun (single row)
create table if not exists ayat_khusus_tahun (
  id         text primary key default 'current',
  year       int  not null default 0,
  reference  text not null default '',
  text       text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_ayat_tahun_updated_at
  before update on ayat_khusus_tahun
  for each row execute function set_updated_at();
insert into ayat_khusus_tahun (id) values ('current') on conflict do nothing;

-- 11b. Ayat Bulan (12 rows, key = 1..12)
create table if not exists ayat_khusus_bulan (
  id         uuid primary key default gen_random_uuid(),
  month      int  unique not null check (month between 1 and 12),
  reference  text not null default '',
  text       text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_ayat_bulan_updated_at
  before update on ayat_khusus_bulan
  for each row execute function set_updated_at();

-- 11c. Ayat Harian (per tanggal YYYY-MM-DD)
create table if not exists ayat_khusus_harian (
  id         uuid primary key default gen_random_uuid(),
  date_key   text unique not null,           -- "YYYY-MM-DD"
  reference  text not null default '',
  text       text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_ayat_harian_updated_at
  before update on ayat_khusus_harian
  for each row execute function set_updated_at();

-- 11d. Ayat Mingguan (per Minggu, key = tanggal Minggu YYYY-MM-DD)
create table if not exists ayat_khusus_mingguan (
  id         uuid primary key default gen_random_uuid(),
  date_key   text unique not null,           -- "YYYY-MM-DD" (hari Minggu)
  reference  text not null default '',
  text       text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_ayat_mingguan_updated_at
  before update on ayat_khusus_mingguan
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 12. MAZMUR MINGGU + VERSES + VISIBLE DAYS
-- date_key: "current" atau Sunday "YYYY-MM-DD"
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists mazmur_minggu (
  id         uuid primary key default gen_random_uuid(),
  date_key   text unique not null,
  reference  text not null default '',
  title      text not null default '',
  visible    boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger trg_mazmur_updated_at
  before update on mazmur_minggu
  for each row execute function set_updated_at();

insert into mazmur_minggu (date_key) values ('current') on conflict do nothing;

create table if not exists mazmur_minggu_verses (
  id         uuid primary key default gen_random_uuid(),
  mazmur_id  uuid not null references mazmur_minggu(id) on delete cascade,
  number     text not null default '',
  text       text not null default '',
  sort_order int  not null default 0
);
create index on mazmur_minggu_verses(mazmur_id);

-- visibleDays: 0=Min, 1=Sen, ..., 6=Sab
create table if not exists mazmur_visible_days (
  id         uuid primary key default gen_random_uuid(),
  mazmur_id  uuid not null references mazmur_minggu(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6)
);
create unique index on mazmur_visible_days(mazmur_id, day_of_week);


-- ═══════════════════════════════════════════════════════════════════════════
-- 13. BAHAN KHOTBAH + VISIBLE DAYS
-- date_key: "current" atau Sunday "YYYY-MM-DD"
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists bahan_khotbah (
  id            uuid primary key default gen_random_uuid(),
  date_key      text unique not null,
  book_slug     text not null default '',
  book_name     text not null default '',
  chapter       int  not null default 1,
  verse_from    int  not null default 1,
  verse_to      int  not null default 1,
  reference     text not null default '',
  visible       boolean not null default true,
  visible_from  text not null default '',    -- legacy "YYYY-MM-DD"
  visible_until text not null default '',    -- legacy "YYYY-MM-DD"
  updated_at    timestamptz not null default now()
);
create trigger trg_khotbah_updated_at
  before update on bahan_khotbah
  for each row execute function set_updated_at();

insert into bahan_khotbah (date_key) values ('current') on conflict do nothing;

create table if not exists khotbah_visible_days (
  id          uuid primary key default gen_random_uuid(),
  khotbah_id  uuid not null references bahan_khotbah(id) on delete cascade,
  day_of_week int  not null check (day_of_week between 0 and 6)
);
create unique index on khotbah_visible_days(khotbah_id, day_of_week);


-- ═══════════════════════════════════════════════════════════════════════════
-- 14. POKOK DOA HARIAN
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists pokok_doa_harian (
  id         uuid primary key default gen_random_uuid(),
  sort_order int  not null default 0,
  hari       text not null default '',
  topik      text not null default '',
  detail     text not null default '',
  updated_at timestamptz not null default now()
);
create trigger trg_pokdoa_updated_at
  before update on pokok_doa_harian
  for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 15. AYAT NATS (pool) + DAILY SCHEDULE
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists ayat_nats (
  id          text primary key,             -- user-defined id ("1","2",...)
  reference   text not null default '',
  text        text not null default '',
  book_slug   text not null default '',
  book_name   text not null default '',
  chapter     int  not null default 0,
  verse_from  int  not null default 0,
  verse_to    int  not null default 0,
  sort_order  int  not null default 0,
  updated_at  timestamptz not null default now()
);
create trigger trg_ayat_nats_updated_at
  before update on ayat_nats
  for each row execute function set_updated_at();

-- schedule: tiap baris = satu item untuk satu tanggal
create table if not exists ayat_nats_schedule (
  id           uuid primary key default gen_random_uuid(),
  date_key     text not null,               -- "YYYY-MM-DD"
  ayat_nats_id text not null references ayat_nats(id) on delete cascade,
  sort_order   int  not null default 0,
  unique(date_key, ayat_nats_id)
);
create index on ayat_nats_schedule(date_key);


-- ═══════════════════════════════════════════════════════════════════════════
-- 16. BIBLE READINGS + VERSES + CROSS REFS
-- date_key: "current" atau "YYYY-MM-DD"
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists bible_readings (
  id         uuid primary key default gen_random_uuid(),
  date_key   text not null,                 -- satu date_key bisa punya banyak readings
  sort_order int  not null default 0,
  reference  text not null default '',
  title      text not null default '',
  updated_at timestamptz not null default now()
);
create index on bible_readings(date_key);
create trigger trg_bible_readings_updated_at
  before update on bible_readings
  for each row execute function set_updated_at();

create table if not exists bible_reading_verses (
  id         uuid primary key default gen_random_uuid(),
  reading_id uuid not null references bible_readings(id) on delete cascade,
  number     text not null default '',
  text       text not null default '',
  sort_order int  not null default 0
);
create index on bible_reading_verses(reading_id);

create table if not exists bible_reading_cross_refs (
  id         uuid primary key default gen_random_uuid(),
  reading_id uuid not null references bible_readings(id) on delete cascade,
  reference  text not null default '',
  note       text not null default '',
  sort_order int  not null default 0
);
create index on bible_reading_cross_refs(reading_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 17. PATCH NOTES + ITEMS
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists patch_notes (
  id         uuid primary key default gen_random_uuid(),
  version    text not null default '',
  title      text not null default '',
  date       text not null default '',       -- "YYYY-MM-DD"
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_patch_notes_updated_at
  before update on patch_notes
  for each row execute function set_updated_at();

create table if not exists patch_note_items (
  id            uuid primary key default gen_random_uuid(),
  patch_note_id uuid not null references patch_notes(id) on delete cascade,
  type          text not null default 'new'  -- "new"|"fix"|"improve"|"remove"
                  check (type in ('new','fix','improve','remove')),
  description   text not null default '',
  sort_order    int  not null default 0
);
create index on patch_note_items(patch_note_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- 18. TENTANG INFO + MISI + SOCIALS
-- Single-row config, nested data di tabel terpisah
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists tentang_info (
  id           text primary key default 'current',
  app_name     text not null default 'Puji dan Janji',
  app_version  text not null default '1.0',
  app_year     text not null default '2026',
  theme        text not null default '',
  subtheme     text not null default '',
  pj_edition   text not null default '',
  pj_year      text not null default '',
  pj_color     text not null default '',
  jh_period    text not null default '',
  jh_editor    text not null default '',
  jh_pic       text not null default '',
  jh_audio     text not null default '',
  jh_made_by   text not null default '',
  address      text not null default '',
  phone        text not null default '',
  email        text not null default '',
  website      text not null default '',
  visi         text not null default '',
  updated_at   timestamptz not null default now()
);
create trigger trg_tentang_updated_at
  before update on tentang_info
  for each row execute function set_updated_at();

insert into tentang_info (id) values ('current') on conflict do nothing;

create table if not exists tentang_misi (
  id         uuid primary key default gen_random_uuid(),
  sort_order int  not null default 0,
  text       text not null default ''
);

create table if not exists tentang_socials (
  id         uuid primary key default gen_random_uuid(),
  sort_order int  not null default 0,
  platform   text not null default '',
  url        text not null default '',
  handle     text not null default ''
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 19. PAGE VISITS
-- Equivalent Firestore: page_visits/{YYYY-MM-DD} → { count, hours: {HH: n} }
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists page_visits (
  id         uuid primary key default gen_random_uuid(),
  date_key   text unique not null,           -- "YYYY-MM-DD"
  count      int  not null default 0,
  updated_at timestamptz not null default now()
);
create trigger trg_page_visits_updated_at
  before update on page_visits
  for each row execute function set_updated_at();

create table if not exists page_visit_hours (
  id       uuid primary key default gen_random_uuid(),
  visit_id uuid not null references page_visits(id) on delete cascade,
  hour     text not null check (hour ~ '^[0-2][0-9]$'),  -- "00"–"23"
  count    int  not null default 0,
  unique(visit_id, hour)
);
create index on page_visit_hours(visit_id);

-- Fungsi atomic increment kunjungan (dipanggil dari client via RPC)
create or replace function increment_page_visit(p_date_key text, p_hour text)
returns void language plpgsql security definer as $$
declare
  v_id uuid;
begin
  -- Upsert page_visits
  insert into page_visits(date_key, count)
    values (p_date_key, 1)
    on conflict (date_key)
    do update set count = page_visits.count + 1, updated_at = now()
    returning id into v_id;

  -- Kalau row baru, ambil id yang baru dibuat
  if v_id is null then
    select id into v_id from page_visits where date_key = p_date_key;
  end if;

  -- Upsert jam
  insert into page_visit_hours(visit_id, hour, count)
    values (v_id, p_hour, 1)
    on conflict (visit_id, hour)
    do update set count = page_visit_hours.count + 1;
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Public: hanya SELECT
-- Admin (authenticated): SELECT + INSERT + UPDATE + DELETE
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  tbl text;
  tables text[] := array[
    'devotional','perikop_items','verse_highlights','special_verses',
    'announcement','prayer_topic',
    'authors','author_titles','author_service_history',
    'ministries',
    'ayat_categories','ayat_category_verses',
    'pustaka_books',
    'ayat_khusus_tahun','ayat_khusus_bulan','ayat_khusus_harian','ayat_khusus_mingguan',
    'mazmur_minggu','mazmur_minggu_verses','mazmur_visible_days',
    'bahan_khotbah','khotbah_visible_days',
    'pokok_doa_harian',
    'ayat_nats','ayat_nats_schedule',
    'bible_readings','bible_reading_verses','bible_reading_cross_refs',
    'patch_notes','patch_note_items',
    'tentang_info','tentang_misi','tentang_socials',
    'page_visits','page_visit_hours'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table %I enable row level security', tbl);

    -- Public read
    execute format('
      create policy "public_read_%s" on %I
        for select using (true)
    ', tbl, tbl);

    -- Authenticated write (admin)
    execute format('
      create policy "auth_write_%s" on %I
        for all
        using (auth.role() = ''authenticated'')
        with check (auth.role() = ''authenticated'')
    ', tbl, tbl);
  end loop;
end;
$$;

-- Khusus page_visits: anon juga boleh INSERT via RPC increment_page_visit
-- (RPC sudah pakai security definer, jadi aman)
create policy "anon_insert_page_visits" on page_visits
  for insert with check (true);
create policy "anon_insert_page_visit_hours" on page_visit_hours
  for insert with check (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE STORAGE BUCKETS
-- Buat via Dashboard atau jalankan SQL ini sekali
-- ═══════════════════════════════════════════════════════════════════════════

-- Catatan: bucket harus dibuat via Dashboard atau Storage API.
-- Buat 3 bucket dengan setting PUBLIC:
--   - pustaka   (PDF, maks 50MB)
--   - audio     (MP3/WAV/WebM, maks 100MB)
--   - images    (JPG/PNG/WebP, maks 5MB)
--
-- Storage Policy (tambahkan via Dashboard):
--   SELECT: allow for all (public read)
--   INSERT/UPDATE/DELETE: allow for authenticated role only

-- ═══════════════════════════════════════════════════════════════════════════
-- REALTIME
-- Enable realtime untuk tabel yang butuh live update (admin dashboard)
-- Jalankan di Supabase Dashboard → Database → Replication
-- Atau via SQL:
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabel yang perlu realtime (admin dashboard + public yang realtime):
alter publication supabase_realtime add table devotional;
alter publication supabase_realtime add table announcement;
alter publication supabase_realtime add table ayat_categories;
alter publication supabase_realtime add table ayat_category_verses;
alter publication supabase_realtime add table authors;
alter publication supabase_realtime add table mazmur_minggu;
alter publication supabase_realtime add table mazmur_minggu_verses;
alter publication supabase_realtime add table bahan_khotbah;
alter publication supabase_realtime add table bible_readings;
alter publication supabase_realtime add table bible_reading_verses;
alter publication supabase_realtime add table patch_notes;
alter publication supabase_realtime add table patch_note_items;
alter publication supabase_realtime add table page_visits;
alter publication supabase_realtime add table page_visit_hours;
alter publication supabase_realtime add table tentang_info;
alter publication supabase_realtime add table pustaka_books;
alter publication supabase_realtime add table ministries;
alter publication supabase_realtime add table ayat_nats;
alter publication supabase_realtime add table pokok_doa_harian;
