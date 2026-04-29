-- ============================================================
-- 0004: Admin panel için list_cards RPC
-- ============================================================
-- /panel sayfası için staff PIN doğrulamalı SECURITY DEFINER RPC.
-- Anon key'den çağrılabilir, RLS bypass eder. Tüm cards + son geçiş özetini döner.
-- ============================================================

create or replace function public.list_cards(p_staff_code text)
returns table (
    short_code        text,
    name              text,
    email             text,
    committee         text,
    revoked_at        timestamptz,
    last_redeemed_at  timestamptz,
    redemption_count  bigint
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
        (select count(*)::bigint    from redemptions r where r.card_id = c.id) as redemption_count
    from cards c
    where c.name is not null
    order by c.short_code;
end; $$;

grant execute on function public.list_cards(text) to anon, authenticated;
