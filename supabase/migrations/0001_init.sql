-- MFL FBÇ '26 — yaka kartı QR yemek doğrulama sistemi
-- Etkinlik: 9-10 Mayıs 2026
-- Plan: docs/superpowers/specs uyumlu, plan dosyası: ya-kanka-olay-ne-luminous-wirth.md

------------------------------------------------------------
-- ENUM
------------------------------------------------------------
do $$ begin
    create type meal_type as enum ('kahvalti', 'ogle');
exception when duplicate_object then null;
end $$;

------------------------------------------------------------
-- TABLES
------------------------------------------------------------
create table if not exists public.cards (
    id          uuid primary key default gen_random_uuid(),
    short_code  text unique not null,
    issued_at   timestamptz not null default now(),
    revoked_at  timestamptz,
    note        text
);

create table if not exists public.redemptions (
    id           bigserial primary key,
    card_id      uuid not null references public.cards(id) on delete restrict,
    meal_type    meal_type not null,
    event_day    date not null,
    redeemed_at  timestamptz not null default now(),
    staff_code   text not null,
    user_agent   text,
    constraint redemptions_unique_use unique (card_id, meal_type, event_day)
);

create index if not exists redemptions_card_idx on public.redemptions (card_id);
create index if not exists redemptions_day_idx  on public.redemptions (event_day, meal_type);

create table if not exists public.staff_codes (
    code        text primary key,
    label       text not null,
    active      boolean not null default true,
    created_at  timestamptz not null default now()
);

------------------------------------------------------------
-- RLS — kapalı: anon hiçbir tabloya doğrudan erişemez.
-- Tek erişim yolu SECURITY DEFINER RPC'ler.
------------------------------------------------------------
alter table public.cards         enable row level security;
alter table public.redemptions   enable row level security;
alter table public.staff_codes   enable row level security;

------------------------------------------------------------
-- event_day_of: 23:00 TRT cutoff'lu gün hesabı
-- 22:59 → bugün, 23:00+ → ertesi gün
------------------------------------------------------------
create or replace function public.event_day_of(p_ts timestamptz)
returns date
language sql
immutable
as $$
    select ((p_ts at time zone 'Europe/Istanbul') + interval '1 hour')::date;
$$;

------------------------------------------------------------
-- redeem_meal: ana RPC
-- Atomik: unique constraint sayesinde double-scan race'i DB seviyesinde önler.
------------------------------------------------------------
create or replace function public.redeem_meal(
    p_card_id     uuid,
    p_meal        meal_type,
    p_staff_code  text,
    p_user_agent  text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_today        date;
    v_card         record;
    v_existing     timestamptz;
    v_short_code   text;
begin
    -- 1) staff kodu doğrula
    if not exists (select 1 from staff_codes where code = p_staff_code and active) then
        return jsonb_build_object('status', 'invalid_staff');
    end if;

    -- 2) kart var mı, iptal mi?
    select id, short_code, revoked_at into v_card from cards where id = p_card_id;
    if not found then
        return jsonb_build_object('status', 'unknown_card');
    end if;
    if v_card.revoked_at is not null then
        return jsonb_build_object(
            'status', 'revoked',
            'short_code', v_card.short_code
        );
    end if;

    -- 3) bugün hangi etkinlik günü?
    v_today := public.event_day_of(now());
    if v_today not in (date '2026-05-09', date '2026-05-10') then
        return jsonb_build_object(
            'status', 'out_of_window',
            'computed_day', v_today,
            'short_code', v_card.short_code
        );
    end if;

    -- 4) atomik insert; çakışırsa unique_violation yakala
    begin
        insert into redemptions (card_id, meal_type, event_day, staff_code, user_agent)
        values (p_card_id, p_meal, v_today, p_staff_code, p_user_agent);
    exception when unique_violation then
        select redeemed_at into v_existing
          from redemptions
         where card_id = p_card_id
           and meal_type = p_meal
           and event_day = v_today;
        return jsonb_build_object(
            'status', 'already_used',
            'first_redeemed_at', v_existing,
            'event_day', v_today,
            'short_code', v_card.short_code,
            'meal', p_meal
        );
    end;

    return jsonb_build_object(
        'status', 'ok',
        'event_day', v_today,
        'meal', p_meal,
        'redeemed_at', now(),
        'short_code', v_card.short_code
    );
end;
$$;

------------------------------------------------------------
-- lookup_short_code: manuel girişte "042" → uuid çevirisi.
-- Sadece staff kodu geçerliyse iş yapar.
------------------------------------------------------------
create or replace function public.lookup_short_code(
    p_short_code  text,
    p_staff_code  text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_card record;
begin
    if not exists (select 1 from staff_codes where code = p_staff_code and active) then
        return jsonb_build_object('status', 'invalid_staff');
    end if;

    select id, short_code, revoked_at into v_card
      from cards
     where short_code = upper(trim(p_short_code))
        or short_code = lpad(trim(p_short_code), 3, '0');

    if not found then
        return jsonb_build_object('status', 'unknown_card');
    end if;

    return jsonb_build_object(
        'status', 'ok',
        'card_id', v_card.id,
        'short_code', v_card.short_code,
        'revoked', v_card.revoked_at is not null
    );
end;
$$;

------------------------------------------------------------
-- today_event_day: scanner ekranı tepe çubuğuna "Bugün: 9 Mayıs 2026" basmak için
------------------------------------------------------------
create or replace function public.today_event_day()
returns date
language sql
stable
as $$
    select public.event_day_of(now());
$$;

------------------------------------------------------------
-- Yetkilendirme: anon ve authenticated bu RPC'leri çağırabilir.
-- Tablo seviyesinde herhangi bir GRANT yok → RLS pasif olsa bile veri sızmaz.
------------------------------------------------------------
grant execute on function public.redeem_meal(uuid, meal_type, text, text) to anon, authenticated;
grant execute on function public.lookup_short_code(text, text)            to anon, authenticated;
grant execute on function public.today_event_day()                        to anon, authenticated;
grant execute on function public.event_day_of(timestamptz)                to anon, authenticated;

------------------------------------------------------------
-- Seed staff kodları — etkinlikteki masa sayısına göre güncellenebilir.
-- Üretim öncesi gerçek kodlar (rastgele) ile değiştirilmesi tavsiye edilir.
------------------------------------------------------------
insert into public.staff_codes (code, label) values
    ('MFL-KAH-1', 'Kahvaltı masası 1'),
    ('MFL-KAH-2', 'Kahvaltı masası 2'),
    ('MFL-OGL-1', 'Öğle masası 1'),
    ('MFL-OGL-2', 'Öğle masası 2')
on conflict (code) do nothing;
