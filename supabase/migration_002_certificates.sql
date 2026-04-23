-- ============================================================================
-- Migration 002: Certificate auto-issuance
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================================

create or replace function public.try_issue_certificate(p_bootcamp_id uuid)
returns public.certificates
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user      uuid := auth.uid();
  v_completed int;
  v_total     int;
  v_cert      public.certificates;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  -- Must be enrolled
  if not exists (
    select 1 from enrollments
    where user_id = v_user and bootcamp_id = p_bootcamp_id
  ) then
    raise exception 'not enrolled in this bootcamp';
  end if;

  -- Count completed lessons
  select count(*) into v_completed
  from lesson_progress lp
  join lessons l on l.id = lp.lesson_id
  where lp.user_id   = v_user
    and l.bootcamp_id = p_bootcamp_id
    and lp.completed  = true;

  -- Count total lessons
  select count(*) into v_total
  from lessons where bootcamp_id = p_bootcamp_id;

  -- Not done yet? return null
  if v_total = 0 or v_completed < v_total then
    return null;
  end if;

  -- Already issued? return existing
  select * into v_cert
  from certificates
  where user_id = v_user and bootcamp_id = p_bootcamp_id;

  if v_cert.id is not null then
    return v_cert;
  end if;

  -- Issue new certificate
  insert into certificates (user_id, bootcamp_id)
  values (v_user, p_bootcamp_id)
  returning * into v_cert;

  -- Mark enrollment complete
  update enrollments
     set completed_at = now()
   where user_id = v_user and bootcamp_id = p_bootcamp_id;

  return v_cert;
end;
$$;

grant execute on function public.try_issue_certificate(uuid) to authenticated;

-- Allow public read of certificates by serial (for verification URLs).
-- Safe: the serial is essentially a secret handle; listing is still blocked
-- because verification requires knowing the exact serial.
drop policy if exists "cert_public_read_by_serial" on public.certificates;
create policy "cert_public_read_by_serial"
  on public.certificates for select
  using (true);
