create or replace view public.insumo_busca
with (security_invoker = on) as
select distinct on (ci.codigo_filho, ci.fonte, ci.mes_referencia)
  ci.codigo_filho as codigo_insumo,
  ci.descricao_filho as descricao,
  ci.unidade_filho as unidade,
  ci.fonte,
  ci.mes_referencia
from public.composicao_itens ci
where ci.descricao_filho is not null
  and not exists (
    select 1 from public.composicao c
    where c.codigo_composicao = ci.codigo_filho
      and c.fonte = ci.fonte
      and c.mes_referencia = ci.mes_referencia
  )
order by ci.codigo_filho, ci.fonte, ci.mes_referencia, ci.created_at desc;
