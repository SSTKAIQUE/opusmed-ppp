-- ─────────────────────────────────────────────────────────────────────────────
-- Opusmed PPP — Migration 002: endurecimento de segurança / LGPD
-- Execute no Supabase SQL Editor (depois da 001). É idempotente.
--
-- ANTES: no painel Supabase, Authentication > Providers > Email, desative
-- "Allow new users to sign up" (usuários só por convite).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ─── 1. Funções auxiliares de papel ──────────────────────────────────────────
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'tecnico')
  )
$$;

-- ─── 2. Trigger de novo usuário: ignora role vindo do metadata ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    'tecnico'  -- promoção a admin só manualmente (update em profiles)
  );
  return new;
end;
$$;

create or replace function public.update_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 3. Remove policies anônimas (a API usa service role e ignora RLS) ───────
drop policy if exists "solicitacoes_insert_anon" on public.solicitacoes_ppp;
drop policy if exists "arquivos_insert_anon"     on public.arquivos_ppp;
drop policy if exists "ppp_arquivos_upload_anon" on storage.objects;

-- ─── 4. Policies por papel (apenas equipe lê/edita) ──────────────────────────
drop policy if exists "profiles_select"          on public.profiles;
drop policy if exists "profiles_update_own"      on public.profiles;
drop policy if exists "empresas_select"          on public.empresas;
drop policy if exists "empresas_insert"          on public.empresas;
drop policy if exists "empresas_update"          on public.empresas;
drop policy if exists "solicitacoes_select_auth" on public.solicitacoes_ppp;
drop policy if exists "solicitacoes_update_auth" on public.solicitacoes_ppp;
drop policy if exists "arquivos_select_auth"     on public.arquivos_ppp;
drop policy if exists "ppp_arquivos_read_auth"   on storage.objects;

create policy "profiles_select" on public.profiles
  for select using (public.is_staff());

-- Usuário só altera o próprio registro e NÃO pode mudar o próprio role
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = public.current_role_name());

create policy "empresas_select" on public.empresas
  for select using (public.is_staff());
create policy "empresas_insert" on public.empresas
  for insert with check (public.is_staff());
create policy "empresas_update" on public.empresas
  for update using (public.is_staff());

create policy "solicitacoes_select_auth" on public.solicitacoes_ppp
  for select using (public.is_staff());
create policy "solicitacoes_update_auth" on public.solicitacoes_ppp
  for update using (public.is_staff());

create policy "arquivos_select_auth" on public.arquivos_ppp
  for select using (public.is_staff());

create policy "ppp_arquivos_read_auth" on storage.objects
  for select using (bucket_id = 'ppp-arquivos' and public.is_staff());

-- ─── 5. Bucket: limite de 10 MB por arquivo ──────────────────────────────────
update storage.buckets
   set file_size_limit = 10485760
 where id = 'ppp-arquivos';

-- ─── 6. Token do link: revogação e rotação ───────────────────────────────────
alter table public.empresas add column if not exists revogado_em timestamptz;

create or replace function public.regenerar_token_empresa(p_empresa_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare novo text;
begin
  if not public.is_staff() then
    raise exception 'acesso negado';
  end if;
  novo := encode(gen_random_bytes(32), 'hex');
  update public.empresas
     set token_link = novo, revogado_em = null
   where id = p_empresa_id;
  return novo;
end;
$$;
revoke all on function public.regenerar_token_empresa(uuid) from public, anon;
grant execute on function public.regenerar_token_empresa(uuid) to authenticated;

-- ─── 7. Auditoria de acessos (LGPD) ──────────────────────────────────────────
create table if not exists public.auditoria_acessos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  acao        text not null,
  recurso     text not null,
  recurso_id  uuid,
  created_at  timestamptz not null default now()
);
create index if not exists idx_auditoria_created on public.auditoria_acessos(created_at desc);
create index if not exists idx_auditoria_recurso on public.auditoria_acessos(recurso, recurso_id);

alter table public.auditoria_acessos enable row level security;
drop policy if exists "auditoria_select_admin" on public.auditoria_acessos;
create policy "auditoria_select_admin" on public.auditoria_acessos
  for select using (public.current_role_name() = 'admin');
-- Sem policy de insert/update/delete: só a API (service role) grava.
