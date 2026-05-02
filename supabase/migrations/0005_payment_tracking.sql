-- ============================================================
-- 0005: Ödeme tracking
-- ============================================================
-- cards tablosuna paid_at + payment_note ekle.
-- list_cards bu alanları döndürür.
-- mark_paid / mark_unpaid RPC'leri admin paneliden tetiklenir.
-- ============================================================

alter table public.cards add column if not exists paid_at      timestamptz;
alter table public.cards add column if not exists payment_note text;

-- list_cards: paid_at ve payment_note kolonları eklendi
create or replace function public.list_cards(p_staff_code text)
returns table (
    short_code        text,
    name              text,
    email             text,
    committee         text,
    revoked_at        timestamptz,
    last_redeemed_at  timestamptz,
    redemption_count  bigint,
    paid_at           timestamptz,
    payment_note      text
)
language plpgsql security definer set search_path = public as $$
begin
    if p_staff_code is null or
       not exists (select 1 from staff_codes where code = p_staff_code and active) then
        raise exception 'invalid_staff' using errcode = '42501';
    end if;

    return query
    select
        c.short_code,
        c.name,
        c.email,
        c.committee,
        c.revoked_at,
        (select max(r.redeemed_at)  from redemptions r where r.card_id = c.id) as last_redeemed_at,
        (select count(*)::bigint    from redemptions r where r.card_id = c.id) as redemption_count,
        c.paid_at,
        c.payment_note
    from cards c
    where c.name is not null
    order by c.short_code;
end; $$;

grant execute on function public.list_cards(text) to anon, authenticated;

-- mark_paid: bir kartı ödenmiş olarak işaretle
create or replace function public.mark_paid(
    p_short_code text,
    p_staff_code text,
    p_note       text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_short text;
    v_paid  timestamptz;
begin
    if p_staff_code is null or
       not exists (select 1 from staff_codes where code = p_staff_code and active) then
        return jsonb_build_object('status', 'invalid_staff');
    end if;

    update cards
       set paid_at = now(), payment_note = p_note
     where short_code = upper(trim(p_short_code))
        or short_code = lpad(trim(p_short_code), 3, '0')
    returning short_code, paid_at into v_short, v_paid;

    if not found then
        return jsonb_build_object('status', 'unknown_card');
    end if;

    return jsonb_build_object('status', 'ok', 'short_code', v_short, 'paid_at', v_paid);
end; $$;

grant execute on function public.mark_paid(text, text, text) to anon, authenticated;

-- mark_unpaid: ödendi işaretini kaldır (yanlışlıkla işaretlendiyse)
create or replace function public.mark_unpaid(
    p_short_code text,
    p_staff_code text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_short text;
begin
    if p_staff_code is null or
       not exists (select 1 from staff_codes where code = p_staff_code and active) then
        return jsonb_build_object('status', 'invalid_staff');
    end if;

    update cards
       set paid_at = null, payment_note = null
     where short_code = upper(trim(p_short_code))
        or short_code = lpad(trim(p_short_code), 3, '0')
    returning short_code into v_short;

    if not found then
        return jsonb_build_object('status', 'unknown_card');
    end if;

    return jsonb_build_object('status', 'ok', 'short_code', v_short);
end; $$;

grant execute on function public.mark_unpaid(text, text) to anon, authenticated;
