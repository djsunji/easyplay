-- easyplay: Tabelle für die Fragen
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und ausführen.

create table if not exists public.fragen (
  id          bigint generated always as identity primary key,
  thema       text not null,                         -- z. B. "steuern", "kt_ZH", "pol_welt"
  stufe       smallint not null check (stufe between 1 and 3),  -- 1 Entdecker, 2 Könner, 3 Profis
  frage       text not null,
  antworten   jsonb not null,                        -- ["richtig", "falsch", "falsch", "falsch"] – die erste ist richtig
  erklaerung  text,
  merksatz    text,
  quelle      text,                                  -- Wikipedia-Stichwort
  bild        text,                                  -- z. B. "e:🚒", "w:ZH", "f:DE", "a:fuchs"
  status      text not null default 'ok' check (status in ('ok','neu','gesperrt')),
  erstellt    timestamptz not null default now()
);

create index if not exists fragen_thema_stufe on public.fragen (thema, stufe) where status = 'ok';

-- Sicherheit: Alle dürfen freigegebene Fragen LESEN, niemand darf über die Website schreiben.
-- Neue Fragen fügst du im Dashboard (Table Editor) oder später über eine geschützte Admin-Funktion ein.
alter table public.fragen enable row level security;

drop policy if exists "Freigegebene Fragen sind lesbar" on public.fragen;
create policy "Freigegebene Fragen sind lesbar"
  on public.fragen for select
  to anon, authenticated
  using (status = 'ok');
