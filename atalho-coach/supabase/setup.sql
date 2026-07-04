-- Fórum do Atalho Coach — cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- Cria a tabela de sugestões e a função de voto atômico.

create table if not exists sugestoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 3 and 120),
  descricao text not null default '' check (char_length(descricao) <= 500),
  idioma text not null default 'pt',
  votos integer not null default 1,
  status text not null default 'aberta', -- 'aberta' | 'criada'
  created_at timestamptz not null default now()
);

-- Só o backend (service key) acessa; nenhum acesso público direto.
alter table sugestoes enable row level security;

create or replace function votar(sugestao_id uuid)
returns void
language sql
security definer
as $$
  update sugestoes set votos = votos + 1 where id = sugestao_id and status = 'aberta';
$$;
