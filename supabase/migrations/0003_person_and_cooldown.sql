-- ============================================================
-- 0003: Kişiye özel kart + 2 saatlik cooldown sistemi
-- ============================================================
-- DEĞİŞİKLİKLER:
-- 1. cards tablosuna name/email/committee kolonları
-- 2. redemptions UNIQUE constraint kaldırılır (artık aynı kart günde >1 geçebilir)
-- 3. redeem_meal RPC: 2h cooldown logic + name/committee response'a eklenir
-- 4. m=br|lu parametresi server tarafında yoksayılır (eski QR'lar uyumlu kalsın)
-- ============================================================

alter table public.cards
    add column if not exists name      text,
    add column if not exists email     text,
    add column if not exists committee text;

create index if not exists cards_committee_idx on public.cards (committee);

-- 2h cooldown için her kartın son geçişini hızlı bulalım
create index if not exists redemptions_card_recent_idx
    on public.redemptions (card_id, redeemed_at desc);

-- Eski "günde 1 kez per öğün" UNIQUE constraint'i kaldır.
-- Artık 2h cooldown logic RPC içinde validation yapıyor.
alter table public.redemptions
    drop constraint if exists redemptions_unique_use;

-- meal_type ve event_day kolonları kalır (audit log için), nullable değil ama
-- yeni mantıkta meal_type her zaman 'kahvalti' (legacy enum), event_day server hesabı.

create or replace function public.redeem_meal(
    p_card_id     uuid,
    p_meal        meal_type default 'kahvalti',  -- ignored, legacy compat
    p_staff_code  text default null,
    p_user_agent  text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_today        date;
    v_card         record;
    v_last_at      timestamptz;
    v_cooldown_end timestamptz;
begin
    if p_staff_code is null or
       not exists (select 1 from staff_codes where code = p_staff_code and active) then
        return jsonb_build_object('status', 'invalid_staff');
    end if;

    select id, short_code, revoked_at, name, committee
        into v_card from cards where id = p_card_id;
    if not found then
        return jsonb_build_object('status', 'unknown_card');
    end if;
    if v_card.revoked_at is not null then
        return jsonb_build_object('status', 'revoked',
                                  'short_code', v_card.short_code,
                                  'name',       v_card.name,
                                  'committee',  v_card.committee);
    end if;

    v_today := public.event_day_of(now());
    if v_today not in (date '2026-05-09', date '2026-05-10') then
        return jsonb_build_object('status', 'out_of_window',
                                  'computed_day', v_today,
                                  'short_code',   v_card.short_code,
                                  'name',         v_card.name,
                                  'committee',    v_card.committee);
    end if;

    -- 2h cooldown: son geçişin üstünden 2 saat geçmediyse blokla.
    select redeemed_at into v_last_at
      from redemptions
     where card_id = p_card_id
     order by redeemed_at desc
     limit 1;

    if v_last_at is not null and now() - v_last_at < interval '2 hours' then
        v_cooldown_end := v_last_at + interval '2 hours';
        return jsonb_build_object('status',         'cooldown',
                                  'last_at',        v_last_at,
                                  'available_at',   v_cooldown_end,
                                  'remaining_secs', extract(epoch from (v_cooldown_end - now()))::int,
                                  'short_code',     v_card.short_code,
                                  'name',           v_card.name,
                                  'committee',      v_card.committee);
    end if;

    insert into redemptions (card_id, meal_type, event_day, staff_code, user_agent)
    values (p_card_id, 'kahvalti', v_today, p_staff_code, p_user_agent);

    return jsonb_build_object('status',      'ok',
                              'event_day',   v_today,
                              'redeemed_at', now(),
                              'short_code',  v_card.short_code,
                              'name',        v_card.name,
                              'committee',   v_card.committee);
end; $$;

grant execute on function public.redeem_meal(uuid, meal_type, text, text) to anon, authenticated;
