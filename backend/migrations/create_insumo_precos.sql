create table if not exists public.insumo_precos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  codigo_insumo text not null,
  mes_referencia text not null,
  tipo_composicao text not null,
  fonte text not null default 'SINAPI',
  classificacao text,
  origem_preco text,
  ac numeric, al numeric, ap numeric, am numeric, ba numeric, ce numeric, df numeric,
  es numeric, go numeric, ma numeric, mt numeric, ms numeric, mg numeric, pa numeric,
  pb numeric, pr numeric, pe numeric, pi numeric, rj numeric, rn numeric, rs numeric,
  ro numeric, rr numeric, sc numeric, sp numeric, se numeric, "to" numeric,
  constraint uq_insumo_precos_codigo_mes_tipo unique (codigo_insumo, mes_referencia, tipo_composicao, fonte)
);
create index if not exists idx_insumo_precos_codigo on public.insumo_precos (codigo_insumo, fonte);
alter table public.insumo_precos enable row level security;
