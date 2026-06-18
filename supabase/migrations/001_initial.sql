-- ─────────────────────────────────────────────────────────────────────────────
-- Opusmed PPP — Migration inicial
-- Execute no Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ─── Tabela: profiles ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  nome       text not null,
  role       text not null default 'tecnico' check (role in ('admin', 'tecnico')),
  created_at timestamptz not null default now()
);

-- Auto-criar profile quando usuário se registra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'tecnico')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Tabela: empresas ─────────────────────────────────────────────────────────
create table if not exists public.empresas (
  id             uuid primary key default uuid_generate_v4(),
  razao_social   text not null,
  cnpj           text not null unique,
  email_contato  text not null,
  nome_contato   text not null,
  token_link     text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Atualiza updated_at automaticamente
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists empresas_updated_at on public.empresas;
create trigger empresas_updated_at
  before update on public.empresas
  for each row execute procedure public.update_updated_at();

-- ─── Tabela: solicitacoes_ppp ─────────────────────────────────────────────────
create table if not exists public.solicitacoes_ppp (
  id              uuid primary key default uuid_generate_v4(),
  empresa_id      uuid not null references public.empresas(id) on delete cascade,
  status          text not null default 'pendente'
                    check (status in ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  responsavel_id  uuid references public.profiles(id) on delete set null,
  dados_ppp       jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists solicitacoes_updated_at on public.solicitacoes_ppp;
create trigger solicitacoes_updated_at
  before update on public.solicitacoes_ppp
  for each row execute procedure public.update_updated_at();

-- ─── Tabela: arquivos_ppp ─────────────────────────────────────────────────────
create table if not exists public.arquivos_ppp (
  id              uuid primary key default uuid_generate_v4(),
  solicitacao_id  uuid not null references public.solicitacoes_ppp(id) on delete cascade,
  tipo            text not null check (tipo in ('pgr', 'ltcat', 'ficha_epi', 'outro')),
  nome_original   text not null,
  storage_path    text not null,
  tamanho         bigint not null default 0,
  mime_type       text not null default 'application/octet-stream',
  uploaded_at     timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- profiles: usuário autenticado vê todos, edita só o próprio
alter table public.profiles enable row level security;

create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- empresas: apenas autenticados
alter table public.empresas enable row level security;

create policy "empresas_select" on public.empresas
  for select using (auth.role() = 'authenticated');

create policy "empresas_insert" on public.empresas
  for insert with check (auth.role() = 'authenticated');

create policy "empresas_update" on public.empresas
  for update using (auth.role() = 'authenticated');

create policy "empresas_delete" on public.empresas
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- solicitacoes_ppp: autenticados veem tudo, anônimos podem inserir (formulário público)
alter table public.solicitacoes_ppp enable row level security;

create policy "solicitacoes_select_auth" on public.solicitacoes_ppp
  for select using (auth.role() = 'authenticated');

create policy "solicitacoes_insert_anon" on public.solicitacoes_ppp
  for insert with check (true); -- controlado pela API com service role

create policy "solicitacoes_update_auth" on public.solicitacoes_ppp
  for update using (auth.role() = 'authenticated');

-- arquivos_ppp: mesmo padrão
alter table public.arquivos_ppp enable row level security;

create policy "arquivos_select_auth" on public.arquivos_ppp
  for select using (auth.role() = 'authenticated');

create policy "arquivos_insert_anon" on public.arquivos_ppp
  for insert with check (true);

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ppp-arquivos',
  'ppp-arquivos',
  false,
  52428800, -- 50 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- Política de upload anônimo no bucket (formulário público)
create policy "ppp_arquivos_upload_anon" on storage.objects
  for insert with check (bucket_id = 'ppp-arquivos');

-- Política de leitura para autenticados
create policy "ppp_arquivos_read_auth" on storage.objects
  for select using (
    bucket_id = 'ppp-arquivos' and auth.role() = 'authenticated'
  );

-- ─── Índices ──────────────────────────────────────────────────────────────────
create index if not exists idx_solicitacoes_empresa   on public.solicitacoes_ppp(empresa_id);
create index if not exists idx_solicitacoes_status    on public.solicitacoes_ppp(status);
create index if not exists idx_solicitacoes_resp      on public.solicitacoes_ppp(responsavel_id);
create index if not exists idx_solicitacoes_created   on public.solicitacoes_ppp(created_at desc);
create index if not exists idx_arquivos_solicitacao   on public.arquivos_ppp(solicitacao_id);
create index if not exists idx_empresas_cnpj          on public.empresas(cnpj);
create index if not exists idx_empresas_token         on public.empresas(token_link);

-- ─── Seed: Usuário admin inicial ──────────────────────────────────────────────
-- ATENÇÃO: Crie o usuário pelo painel Supabase Auth > Users > Invite user
-- e depois atualize o role para 'admin':
-- update public.profiles set role = 'admin', nome = 'Nathália Dias'
-- where email = 'seguranca@opus.med.br';
