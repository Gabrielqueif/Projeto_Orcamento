import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, Optional

from app.modules.base_propria.services import BasePropriaService
from app.modules.composicao.repositories import ItemRepository
from app.modules.etapa.repositories import EtapaRepository
from app.modules.orcamento.bdi import BDIConfig, calcular_bdi_tcu, determinar_tipo_bdi_item
from app.modules.orcamento.repositories import InsumoRepository, OrcamentoItemRepository, OrcamentoRepository
from app.modules.orcamento.schemas import OrcamentoCreate, OrcamentoItemCreate, OrcamentoItemUpdate, OrcamentoUpdate
from core.exceptions import NaoEncontradoError

logger = logging.getLogger("projeto_orcamento")

FONTE_PROPRIA = "PROPRIA"
TIPOS_INSUMO_PROPRIO = {"MATERIAL", "MAO_DE_OBRA", "EQUIPAMENTO", "SERVICO"}


def anexar_nome_base_propria(itens: list, base_propria_service: Optional[BasePropriaService], user_id: Optional[str]):
    """Preenche `base_propria_nome` nos itens PROPRIA (exibição, PDF e Excel). Não altera itens de outras fontes."""
    propria = [i for i in itens if isinstance(i, dict) and i.get("fonte") == FONTE_PROPRIA]
    if not propria:
        return itens
    nomes: Dict[str, Optional[str]] = {}
    for item in propria:
        base_id = item.get("base_propria_id")
        if base_id and base_id not in nomes:
            base = base_propria_service.repo.buscar_base(base_id, user_id) if base_propria_service else None
            nomes[base_id] = base["nome"] if base else None
        item["base_propria_nome"] = nomes.get(base_id) or "Base própria"
    return itens


class OrcamentoService:
    def __init__(
        self,
        repository: OrcamentoRepository,
        etapa_repository: Optional[EtapaRepository] = None,
        orcamento_item_repository: Optional[OrcamentoItemRepository] = None,
        supabase_client: Optional[Any] = None,
    ):
        self.repository = repository
        self.etapa_repository = etapa_repository
        self.orcamento_item_repository = orcamento_item_repository
        self.item_repository = orcamento_item_repository
        self.supabase = supabase_client

    def criar_orcamento(self, orcamento: OrcamentoCreate, user_id: Optional[str] = None):
        tipo_bdi = orcamento.tipo_bdi or "ANALITICO"
        bdi_config = orcamento.bdi_config or BDIConfig()

        if tipo_bdi == "ANALITICO":
            bdi_calculado = calcular_bdi_tcu(bdi_config)
        else:
            bdi_calculado = orcamento.bdi or 0.0

        dados = {
            "nome": orcamento.nome,
            "cliente": orcamento.cliente,
            "data": orcamento.data.isoformat() if hasattr(orcamento.data, "isoformat") else str(orcamento.data),
            "base_referencia": orcamento.base_referencia,
            "tipo_composicao": orcamento.tipo_composicao,
            "estado": orcamento.estado.lower(),
            "fonte": orcamento.fonte or "SINAPI",
            "bdi": bdi_calculado,
            "tipo_bdi": tipo_bdi,
            "bdi_config": bdi_config.model_dump(),
            "responsavel_tecnico": orcamento.responsavel_tecnico,
            "numero_conselho": orcamento.numero_conselho,
            "margem_valor": orcamento.margem_valor or 0.0,
            "status": orcamento.status or "em_elaboracao",
            "valor_total": 0.0,
            "variaveis_globais": orcamento.variaveis_globais or [],
            "locais": orcamento.locais or [],
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        return self.repository.criar(dados)

    def listar_orcamentos(
        self,
        nome: Optional[str] = None,
        status: Optional[str] = None,
        cliente: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        return self.repository.listar(nome, status, cliente, user_id=user_id)

    def buscar_orcamento(self, orcamento_id: str):
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")
        return orcamento

    def atualizar_orcamento(self, orcamento_id: str, orcamento_update: OrcamentoUpdate):
        existente = self.repository.buscar_por_id(orcamento_id)
        if not existente:
            raise NaoEncontradoError("Orçamento não encontrado")

        dados_atualizacao = {}
        dados_atualizacao["updated_at"] = datetime.now().isoformat()
        bdi_alterado = False

        if orcamento_update.nome is not None:
            dados_atualizacao["nome"] = orcamento_update.nome
        if orcamento_update.cliente is not None:
            dados_atualizacao["cliente"] = orcamento_update.cliente
        if orcamento_update.data is not None:
            dados_atualizacao["data"] = (
                orcamento_update.data.isoformat()
                if hasattr(orcamento_update.data, "isoformat")
                else str(orcamento_update.data)
            )
        if orcamento_update.base_referencia is not None:
            dados_atualizacao["base_referencia"] = orcamento_update.base_referencia
        if orcamento_update.tipo_composicao is not None:
            dados_atualizacao["tipo_composicao"] = orcamento_update.tipo_composicao
        if orcamento_update.estado is not None:
            dados_atualizacao["estado"] = orcamento_update.estado.lower()
        if orcamento_update.fonte is not None:
            dados_atualizacao["fonte"] = orcamento_update.fonte
        if orcamento_update.tipo_bdi is not None:
            dados_atualizacao["tipo_bdi"] = orcamento_update.tipo_bdi
            bdi_alterado = True
        if orcamento_update.bdi_config is not None:
            bdi_config = orcamento_update.bdi_config
            dados_atualizacao["bdi_config"] = bdi_config.model_dump()
            bdi_alterado = True
        if orcamento_update.bdi is not None:
            dados_atualizacao["bdi"] = orcamento_update.bdi
            bdi_alterado = True
        if orcamento_update.responsavel_tecnico is not None:
            dados_atualizacao["responsavel_tecnico"] = orcamento_update.responsavel_tecnico
        if orcamento_update.numero_conselho is not None:
            dados_atualizacao["numero_conselho"] = orcamento_update.numero_conselho
        if orcamento_update.margem_valor is not None:
            dados_atualizacao["margem_valor"] = orcamento_update.margem_valor
        if orcamento_update.status is not None:
            dados_atualizacao["status"] = orcamento_update.status
        if orcamento_update.valor_total is not None:
            dados_atualizacao["valor_total"] = orcamento_update.valor_total
        if orcamento_update.variaveis_globais is not None:
            dados_atualizacao["variaveis_globais"] = orcamento_update.variaveis_globais
        if orcamento_update.locais is not None:
            dados_atualizacao["locais"] = orcamento_update.locais

        # Recalcula BDI analítico quando bdi_config é enviado
        tipo_bdi_efetivo = dados_atualizacao.get("tipo_bdi") or existente.get("tipo_bdi", "ANALITICO")
        if bdi_alterado and tipo_bdi_efetivo == "ANALITICO" and orcamento_update.bdi_config is not None:
            dados_atualizacao["bdi"] = calcular_bdi_tcu(orcamento_update.bdi_config)

        resultado = self.repository.atualizar(orcamento_id, dados_atualizacao)

        # Recalcula preços com BDI de todos os itens quando a taxa muda
        if bdi_alterado and self.orcamento_item_repository:
            self._recalcular_bdi_itens(orcamento_id)

        return resultado

    def _recalcular_bdi_itens(self, orcamento_id: str):
        """Recalcula preços com BDI de todos os itens do orçamento em lote."""
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento or not self.orcamento_item_repository:
            return

        bdi_padrao = float(orcamento.get("bdi") or 0.0)
        bdi_config_raw = orcamento.get("bdi_config")
        bdi_diferenciado = (
            float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0
        )

        itens = self.orcamento_item_repository.listar_por_orcamento(orcamento_id)
        valor_total_geral = 0.0

        for item in itens:
            tipo_item = item.get("tipo_bdi_item", "PADRAO")
            taxa_bdi = bdi_diferenciado if tipo_item == "DIFERENCIADO" else bdi_padrao
            preco_unitario = float(item.get("preco_unitario") or 0.0)
            quantidade = float(item.get("quantidade") or 0.0)

            preco_unitario_bdi = round(preco_unitario * (1 + taxa_bdi / 100), 2)
            preco_total_bdi = round(quantidade * preco_unitario_bdi, 2)

            self.orcamento_item_repository.atualizar(
                item["id"],
                {
                    "bdi_aplicado": taxa_bdi,
                    "preco_unitario_bdi": preco_unitario_bdi,
                    "preco_total_bdi": preco_total_bdi,
                },
            )

            valor_total_geral += preco_total_bdi

        self.repository.atualizar(
            orcamento_id, {"valor_total": round(valor_total_geral, 2), "updated_at": datetime.now().isoformat()}
        )

    def deletar_orcamento(self, orcamento_id: str):
        existente = self.repository.buscar_por_id(orcamento_id)
        if not existente:
            raise NaoEncontradoError("Orçamento não encontrado")
        return self.repository.deletar(orcamento_id)

    def obter_estatisticas(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        orcamentos = self.repository.listar(user_id=user_id)
        if not orcamentos:
            return {
                "total_orcamentos": 0,
                "valor_total": 0.0,
                "taxa_aprovacao": 0.0,
                "ticket_medio": 0.0,
                "tempo_resposta_medio": 0.0,
            }

        total_orcamentos = len(orcamentos)
        valor_total = sum(float(o.get("valor_total") or 0.0) for o in orcamentos)
        aprovados = sum(1 for o in orcamentos if o.get("status", "").lower() in ["aprovado", "concluido"])

        taxa_aprovacao = (aprovados / total_orcamentos) * 100.0 if total_orcamentos > 0 else 0.0
        ticket_medio = valor_total / total_orcamentos if total_orcamentos > 0 else 0.0

        times = []
        for o in orcamentos:
            created = o.get("created_at")
            updated = o.get("updated_at")
            if created and updated and o.get("status", "").lower() in ["aprovado", "concluido"]:
                try:
                    t_created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    t_updated = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    diff_days = (t_updated - t_created).total_seconds() / 86400.0
                    times.append(diff_days)
                except Exception:
                    pass

        tempo_resposta_medio = sum(times) / len(times) if times else 1.4

        return {
            "total_orcamentos": total_orcamentos,
            "valor_total": round(valor_total, 2),
            "taxa_aprovacao": round(taxa_aprovacao, 1),
            "ticket_medio": round(ticket_medio, 2),
            "tempo_resposta_medio": round(tempo_resposta_medio, 1),
        }

    def obter_curva_abc(self, orcamento_id: str) -> Dict[str, Any]:
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")

        if not self.orcamento_item_repository or not self.supabase:
            raise ValueError("Dependências de Curva ABC não injetadas no serviço")

        itens = self.orcamento_item_repository.listar_por_orcamento(orcamento_id)
        if not itens:
            return {"valor_total": 0.0, "insumos": [], "resumo_classes": {"A": 0.0, "B": 0.0, "C": 0.0}}

        item_ids = [item["id"] for item in itens]
        resultado_insumos = (
            self.supabase.table("orcamento_item_insumo").select("*").in_("orcamento_item_id", item_ids).execute()
        )
        insumos = resultado_insumos.data or []

        grouped_insumos = {}
        for insumo in insumos:
            codigo = insumo.get("codigo_insumo")
            if not codigo:
                continue

            qtd = float(insumo.get("quantidade_unitaria") or 0.0)
            total = float(insumo.get("total") or 0.0)
            desc = insumo.get("descricao") or ""
            unid = insumo.get("unidade") or ""

            if codigo not in grouped_insumos:
                grouped_insumos[codigo] = {
                    "codigo_insumo": codigo,
                    "descricao": desc,
                    "unidade": unid,
                    "quantidade": 0.0,
                    "total": 0.0,
                }
            grouped_insumos[codigo]["quantidade"] += qtd
            grouped_insumos[codigo]["total"] += total

        custo_total_acumulado = sum(ins["total"] for ins in grouped_insumos.values())
        if custo_total_acumulado == 0:
            return {"valor_total": 0.0, "insumos": [], "resumo_classes": {"A": 0.0, "B": 0.0, "C": 0.0}}

        insumos_calculados = sorted(grouped_insumos.values(), key=lambda x: x["total"], reverse=True)

        acumulado_pct = 0.0
        resumo_classes = {"A": 0.0, "B": 0.0, "C": 0.0}

        for ins in insumos_calculados:
            porcentagem = (ins["total"] / custo_total_acumulado) * 100.0
            acumulado_pct += porcentagem
            ins["porcentagem"] = round(porcentagem, 2)
            ins["acumulado"] = round(acumulado_pct, 2)

            if acumulado_pct <= 80.0001:
                ins["classe"] = "A"
                resumo_classes["A"] += ins["total"]
            elif acumulado_pct <= 95.0001:
                ins["classe"] = "B"
                resumo_classes["B"] += ins["total"]
            else:
                ins["classe"] = "C"
                resumo_classes["C"] += ins["total"]

            ins["total"] = round(ins["total"], 2)
            ins["quantidade"] = round(ins["quantidade"], 4)

        return {
            "valor_total": round(custo_total_acumulado, 2),
            "insumos": insumos_calculados,
            "resumo_classes": {k: round(v, 2) for k, v in resumo_classes.items()},
        }

    def obter_cronograma(self, orcamento_id: str) -> Dict[str, Any]:
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")

        if not self.etapa_repository or not self.orcamento_item_repository:
            raise ValueError("Dependências de Cronograma não injetadas no serviço")

        etapas = self.etapa_repository.listar_por_orcamento(orcamento_id)
        itens = self.orcamento_item_repository.listar_por_orcamento(orcamento_id)

        if not etapas or not itens:
            return {"valor_total": 0.0, "mensal": []}

        etapa_custo_acumulado = {}
        for item in itens:
            etapa_id = item.get("etapa_id")
            if not etapa_id:
                continue
            etapa_custo_acumulado[etapa_id] = etapa_custo_acumulado.get(etapa_id, 0.0) + float(
                item.get("preco_total") or 0.0
            )

        def parse_date(val):
            if not val:
                return None
            if isinstance(val, date):
                return val
            if isinstance(val, datetime):
                return val.date()
            try:
                return datetime.fromisoformat(val.replace("Z", "+00:00")).date()
            except Exception:
                return None

        orcamento_date = parse_date(orcamento.get("data")) or date.today()

        desembolsos_mensais = {}
        etapas_ativas_no_mes = {}

        for etapa in etapas:
            etapa_id = etapa["id"]
            custo_etapa = etapa_custo_acumulado.get(etapa_id, 0.0)
            if custo_etapa <= 0:
                continue

            data_inicio = parse_date(etapa.get("data_inicio"))
            data_fim = parse_date(etapa.get("data_fim"))

            if not data_inicio or not data_fim:
                ordem = etapa.get("ordem") or 0
                data_inicio = orcamento_date + timedelta(days=ordem * 30)
                data_fim = data_inicio + timedelta(days=29)

            months_spanned = []
            curr = date(data_inicio.year, data_inicio.month, 1)
            end_month = date(data_fim.year, data_fim.month, 1)

            while curr <= end_month:
                months_spanned.append(f"{curr.year}-{curr.month:02d}")
                if curr.month == 12:
                    curr = date(curr.year + 1, 1, 1)
                else:
                    curr = date(curr.year, curr.month + 1, 1)

            if not months_spanned:
                months_spanned = [f"{data_inicio.year}-{data_inicio.month:02d}"]

            cost_per_month = custo_etapa / len(months_spanned)
            for m in months_spanned:
                desembolsos_mensais[m] = desembolsos_mensais.get(m, 0.0) + cost_per_month
                if m not in etapas_ativas_no_mes:
                    etapas_ativas_no_mes[m] = set()
                etapas_ativas_no_mes[m].add(etapa.get("nome"))

        if not desembolsos_mensais:
            return {"valor_total": 0.0, "mensal": []}

        sorted_months = sorted(desembolsos_mensais.keys())
        total_desembolso = sum(desembolsos_mensais.values())

        MESES_PT = {
            "01": "Jan",
            "02": "Fev",
            "03": "Mar",
            "04": "Abr",
            "05": "Mai",
            "06": "Jun",
            "07": "Jul",
            "08": "Ago",
            "09": "Set",
            "10": "Out",
            "11": "Nov",
            "12": "Dez",
        }

        mensal_res = []
        acumulado_acum = 0.0

        for m in sorted_months:
            val = desembolsos_mensais[m]
            pct = (val / total_desembolso) * 100.0 if total_desembolso > 0 else 0.0
            acumulado_acum += pct

            y, month_num = m.split("-")
            mes_display = f"{MESES_PT[month_num]}/{y}"

            servicos_ativos = ", ".join(sorted(list(etapas_ativas_no_mes[m])))

            mensal_res.append(
                {
                    "mes": mes_display,
                    "servicos": servicos_ativos,
                    "valor": round(val, 2),
                    "acumulado_pct": round(acumulado_acum, 1),
                }
            )

        return {"valor_total": round(total_desembolso, 2), "mensal": mensal_res}


class OrcamentoItemService:
    def __init__(
        self,
        repository: OrcamentoItemRepository,
        orcamento_repository: OrcamentoRepository,
        item_repository: ItemRepository,
        insumo_repository: Optional[InsumoRepository] = None,
        base_propria_service: Optional[BasePropriaService] = None,
    ):
        self.repository = repository
        self.orcamento_repository = orcamento_repository
        self.item_repository = item_repository
        self.insumo_repository = insumo_repository
        self.base_propria_service = base_propria_service

    def _buscar_preco_composicao(
        self, codigo_composicao: str, estado: str, mes_referencia: str, tipo_composicao: str, fonte: str = "SINAPI"
    ) -> Optional[float]:
        return self.item_repository.buscar_preco(codigo_composicao, estado, mes_referencia, tipo_composicao, fonte)

    def _atualizar_valor_total_orcamento(self, orcamento_id: str):
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            return 0.0

        bdi_padrao = float(orcamento.get("bdi") or 0.0)
        bdi_config_raw = orcamento.get("bdi_config")
        bdi_diferenciado = (
            float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0
        )

        itens = self.repository.listar_por_orcamento(orcamento_id)
        valor_total_geral = 0.0

        if itens and isinstance(itens, list) and len(itens) > 0 and isinstance(itens[0], dict):
            for item in itens:
                tipo_item = item.get("tipo_bdi_item", "PADRAO")
                taxa_bdi = bdi_diferenciado if tipo_item == "DIFERENCIADO" else bdi_padrao
                preco_unitario = float(item.get("preco_unitario") or 0.0)
                quantidade = float(item.get("quantidade") or 0.0)

                preco_unitario_bdi = round(preco_unitario * (1 + taxa_bdi / 100), 2)
                preco_total_bdi = round(quantidade * preco_unitario_bdi, 2)

                if "id" in item:
                    self.repository.atualizar(
                        item["id"],
                        {
                            "bdi_aplicado": taxa_bdi,
                            "preco_unitario_bdi": preco_unitario_bdi,
                            "preco_total_bdi": preco_total_bdi,
                        },
                    )

                valor_total_geral += preco_total_bdi
        else:
            total_direto = self.repository.calcular_total_itens(orcamento_id)
            valor_total_geral = float(total_direto or 0.0) * (1 + bdi_padrao / 100)

        self.orcamento_repository.atualizar(
            orcamento_id, {"valor_total": round(valor_total_geral, 2), "updated_at": datetime.now().isoformat()}
        )
        return round(valor_total_geral, 2)

    def adicionar_item(self, orcamento_id: str, item: OrcamentoItemCreate):
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")

        estado_para_buscar = item.estado or orcamento.get("estado")
        if not estado_para_buscar:
            raise ValueError("Estado não definido no orçamento")

        fonte = item.fonte or orcamento.get("fonte", "SINAPI")
        composicao = {"descricao": item.descricao, "unidade": item.unidade}
        calculo_propria = None

        if fonte == FONTE_PROPRIA:
            composicao, calculo_propria = self._resolver_composicao_propria(orcamento, item, estado_para_buscar)
        elif item.codigo_composicao != "MANUAL":
            comps = self.item_repository.buscar_por_codigo(item.codigo_composicao, fonte=fonte)
            if not comps:
                raise NaoEncontradoError(f"Composição {item.codigo_composicao} não encontrada na base {fonte}")
            composicao = comps[0]

        preco_unitario = item.preco_unitario

        if preco_unitario is None and calculo_propria is not None:
            preco_unitario = calculo_propria["preco_total"]

        if preco_unitario is None:
            preco_unitario = self._buscar_preco_composicao(
                item.codigo_composicao,
                estado_para_buscar,
                orcamento.get("base_referencia"),
                orcamento.get("tipo_composicao"),
                fonte=fonte,
            )

        if preco_unitario is None and item.codigo_composicao != "MANUAL":
            raise NaoEncontradoError(f"Preço não encontrado para a composição {item.codigo_composicao}")

        if preco_unitario is None:
            preco_unitario = 0.0

        if item.quantidade <= 0:
            raise ValueError("Quantidade deve ser maior que zero")

        preco_total = item.quantidade * preco_unitario

        descricao = item.descricao or composicao.get("descricao", "")
        unidade = item.unidade or composicao.get("unidade", "")

        tipo_bdi_item = item.tipo_bdi_item or determinar_tipo_bdi_item(item.codigo_composicao, descricao)
        bdi_padrao = float(orcamento.get("bdi") or 0.0)
        bdi_config_raw = orcamento.get("bdi_config")
        bdi_diferenciado = (
            float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0
        )

        if item.bdi_aplicado is not None:
            bdi_aplicado = float(item.bdi_aplicado)
        else:
            bdi_aplicado = bdi_diferenciado if tipo_bdi_item == "DIFERENCIADO" else bdi_padrao

        preco_unitario_bdi = round(preco_unitario * (1 + bdi_aplicado / 100), 2)
        preco_total_bdi = round(item.quantidade * preco_unitario_bdi, 2)

        dados_item = {
            "orcamento_id": orcamento_id,
            "codigo_composicao": item.codigo_composicao,
            "descricao": descricao,
            "quantidade": item.quantidade,
            "unidade": unidade,
            "preco_unitario": preco_unitario,
            "preco_total": preco_total,
            "tipo_bdi_item": tipo_bdi_item,
            "bdi_aplicado": bdi_aplicado,
            "preco_unitario_bdi": preco_unitario_bdi,
            "preco_total_bdi": preco_total_bdi,
            "estado": estado_para_buscar.lower(),
            "fonte": fonte,
            "etapa_id": item.etapa_id,
            "memoria_calculo": item.memoria_calculo,
            "variaveis": item.variaveis,
            "created_at": datetime.now().isoformat(),
        }
        if calculo_propria is not None:
            # A coluna só existe depois da migration da Fase 5; itens de outras fontes não a enviam.
            dados_item["base_propria_id"] = item.base_propria_id

        novo_item = self.repository.criar(dados_item)
        if not novo_item:
            raise Exception("Erro ao adicionar item")

        self._atualizar_valor_total_orcamento(orcamento_id)

        if self.insumo_repository and isinstance(novo_item, dict):
            if calculo_propria is not None:
                self._gravar_insumos_propria(novo_item, calculo_propria, item.quantidade)
            else:
                self._explodir_insumos(novo_item, orcamento, fonte, estado_para_buscar)

        return novo_item

    def listar_itens(self, orcamento_id: str):
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")

        itens = self.repository.listar_por_orcamento(orcamento_id)
        return anexar_nome_base_propria(itens, self.base_propria_service, orcamento.get("user_id"))

    def atualizar_item(self, orcamento_id: str, item_id: str, item_update: OrcamentoItemUpdate):
        item_atual = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item_atual:
            raise NaoEncontradoError("Item não encontrado")

        self._validar_atualizacao_item_propria(item_atual, item_update)

        dados_atualizacao = {}
        codigo_composicao = item_update.codigo_composicao or item_atual.get("codigo_composicao")
        estado = item_update.estado or item_atual.get("estado")
        quantidade = item_update.quantidade if item_update.quantidade is not None else item_atual.get("quantidade", 1.0)

        muda_referencia = (
            item_update.codigo_composicao is not None or item_update.estado is not None or item_update.fonte is not None
        )
        if muda_referencia and item_atual.get("fonte") != FONTE_PROPRIA:
            orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
            fonte = item_update.fonte or item_atual.get("fonte") or orcamento.get("fonte", "SINAPI")
            preco_unitario = self._buscar_preco_composicao(
                codigo_composicao,
                estado,
                orcamento.get("base_referencia"),
                orcamento.get("tipo_composicao"),
                fonte=fonte,
            )
            if preco_unitario is None:
                raise NaoEncontradoError(f"Preço não encontrado para a composição {codigo_composicao} na base {fonte}")

            dados_atualizacao["preco_unitario"] = preco_unitario
            dados_atualizacao["codigo_composicao"] = codigo_composicao
            dados_atualizacao["estado"] = estado.lower()
            if item_update.fonte is not None:
                dados_atualizacao["fonte"] = item_update.fonte
        else:
            preco_unitario = float(item_atual.get("preco_unitario") or 0.0)

        if item_update.quantidade is not None:
            if quantidade <= 0:
                raise ValueError("Quantidade deve ser maior que zero")
            dados_atualizacao["quantidade"] = quantidade
            dados_atualizacao["preco_total"] = quantidade * (preco_unitario or item_atual.get("preco_unitario", 0))

        if item_update.descricao is not None:
            dados_atualizacao["descricao"] = item_update.descricao
        if item_update.unidade is not None:
            dados_atualizacao["unidade"] = item_update.unidade
        if item_update.etapa_id is not None:
            dados_atualizacao["etapa_id"] = item_update.etapa_id
        if item_update.memoria_calculo is not None:
            dados_atualizacao["memoria_calculo"] = item_update.memoria_calculo
        if item_update.variaveis is not None:
            dados_atualizacao["variaveis"] = item_update.variaveis

        # Atualização de parâmetros BDI do item
        if item_update.tipo_bdi_item is not None:
            dados_atualizacao["tipo_bdi_item"] = item_update.tipo_bdi_item
        if item_update.bdi_aplicado is not None:
            dados_atualizacao["bdi_aplicado"] = item_update.bdi_aplicado

        # Recálculo de preços com BDI do item
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        tipo_bdi_item = dados_atualizacao.get("tipo_bdi_item") or item_atual.get("tipo_bdi_item", "PADRAO")
        bdi_padrao = float(orcamento.get("bdi") or 0.0) if orcamento else 0.0
        bdi_config_raw = orcamento.get("bdi_config") if orcamento else {}
        bdi_diferenciado = (
            float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0
        )

        if "bdi_aplicado" in dados_atualizacao:
            taxa_bdi = float(dados_atualizacao["bdi_aplicado"])
        elif "tipo_bdi_item" in dados_atualizacao:
            taxa_bdi = bdi_diferenciado if tipo_bdi_item == "DIFERENCIADO" else bdi_padrao
            dados_atualizacao["bdi_aplicado"] = taxa_bdi
        else:
            taxa_bdi = float(
                item_atual.get("bdi_aplicado") or (bdi_diferenciado if tipo_bdi_item == "DIFERENCIADO" else bdi_padrao)
            )

        preco_unit_efetivo = dados_atualizacao.get("preco_unitario") or preco_unitario
        qtd_efetiva = dados_atualizacao.get("quantidade") or float(item_atual.get("quantidade") or 1.0)

        dados_atualizacao["preco_unitario_bdi"] = round(preco_unit_efetivo * (1 + taxa_bdi / 100), 2)
        dados_atualizacao["preco_total_bdi"] = round(qtd_efetiva * dados_atualizacao["preco_unitario_bdi"], 2)

        if not dados_atualizacao:
            return item_atual

        item_atualizado = self.repository.atualizar(item_id, dados_atualizacao)
        self._atualizar_valor_total_orcamento(orcamento_id)

        return item_atualizado

    # --- Base própria (fonte = PROPRIA) --------------------------------------

    def _exigir_base_propria_service(self) -> BasePropriaService:
        if not self.base_propria_service:
            raise ValueError("Base própria não disponível neste contexto")
        return self.base_propria_service

    @staticmethod
    def _parametros_preco(orcamento: dict, estado: Optional[str]) -> Dict[str, Any]:
        return {
            "uf": (estado or orcamento.get("estado") or "").upper(),
            "mes": orcamento.get("base_referencia") or "",
            "tipo": orcamento.get("tipo_composicao") or None,
        }

    @staticmethod
    def _exigir_precos_completos(calculo: Dict[str, Any], codigo: str) -> None:
        ausentes = [f"{i['ref_fonte']}/{i['ref_codigo']}" for i in calculo["itens"] if not i["encontrado"]]
        if ausentes:
            raise ValueError(
                f"A composição própria {codigo} tem itens sem preço para este orçamento: {', '.join(ausentes)}"
            )

    def _resolver_composicao_propria(self, orcamento: dict, item: OrcamentoItemCreate, estado: str):
        """Valida a base (dona = dono do orçamento) e calcula a composição própria com UF/mês/tipo do orçamento."""
        if item.codigo_composicao == "MANUAL" or not item.base_propria_id:
            raise ValueError("Item de base própria exige base_propria_id e o código da composição")
        servico = self._exigir_base_propria_service()
        base = servico.repo.buscar_base(item.base_propria_id, orcamento.get("user_id"))
        if not base:
            raise NaoEncontradoError("Base própria não encontrada")
        composicao = servico.repo.buscar_composicao_por_codigo(base["id"], item.codigo_composicao)
        if not composicao:
            raise NaoEncontradoError(f"Composição {item.codigo_composicao} não encontrada na base própria")
        calculo = servico.calcular_preco(base["id"], composicao["id"], **self._parametros_preco(orcamento, estado))
        if item.preco_unitario is None:
            self._exigir_precos_completos(calculo, composicao["codigo"])
        return composicao, calculo

    def _validar_atualizacao_item_propria(self, item_atual: dict, item_update: OrcamentoItemUpdate) -> None:
        if item_atual.get("fonte") != FONTE_PROPRIA:
            if item_update.fonte == FONTE_PROPRIA:
                raise ValueError("Para usar a base própria, adicione um novo item informando a base")
            return
        for campo in ("codigo_composicao", "estado", "fonte"):
            novo = getattr(item_update, campo)
            if novo is not None and str(novo).lower() != str(item_atual.get(campo) or "").lower():
                raise ValueError(
                    "Item de base própria não muda de composição, estado ou fonte; "
                    "remova e adicione de novo ou use a atualização de preços da base própria"
                )

    @staticmethod
    def _linhas_insumo_propria(item_id: str, calculo: Dict[str, Any], quantidade_pai: float) -> list:
        linhas = []
        for linha in calculo["itens"]:
            coef = float(linha["coeficiente"] or 0)
            if coef <= 0:
                continue
            preco = linha["preco_unitario"]
            qtd_total = round(coef * quantidade_pai, 6)
            tipo = linha.get("tipo_insumo")
            if tipo not in TIPOS_INSUMO_PROPRIO:
                tipo = "SERVICO" if linha["ref_tipo"] == "COMPOSICAO" else "MATERIAL"
            linhas.append(
                {
                    "orcamento_item_id": item_id,
                    "codigo_insumo": linha["ref_codigo"],
                    "descricao": linha["descricao"] or f"{linha['ref_fonte']} {linha['ref_codigo']}",
                    "unidade": linha["unidade"] or "-",
                    "quantidade_unitaria": qtd_total,
                    "preco_unitario_base": preco,
                    "total": round(qtd_total * preco, 2) if preco else None,
                    "tipo_item": tipo,
                }
            )
        return linhas

    def _gravar_insumos_propria(self, item: dict, calculo: Dict[str, Any], quantidade_pai: float) -> None:
        """Analítico do item próprio: mesma forma da explosão SINAPI, para Curva ABC, cronograma e exportações."""
        try:
            item_id = item.get("id")
            self.insumo_repository.deletar_por_item(item_id)
            batch = self._linhas_insumo_propria(item_id, calculo, quantidade_pai)
            if batch:
                self.insumo_repository.criar_batch(batch)
        except Exception as e:
            logger.warning(f"Falha ao gravar insumos da composição própria: {e}")

    def atualizar_precos_propria(self, orcamento_id: str, aplicar: bool = False) -> Dict[str, Any]:
        """
        Compara o preço congelado dos itens PROPRIA com o preço atual da base. Com `aplicar`, grava os novos
        preços e recalcula BDI/total do orçamento. Itens com preço incompleto ou insumos editados à mão
        ficam de fora para não sobrescrever nem subestimar o custo.
        """
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")
        servico = self._exigir_base_propria_service()
        dono = orcamento.get("user_id")

        itens = [i for i in self.repository.listar_por_orcamento(orcamento_id) if i.get("fonte") == FONTE_PROPRIA]
        por_base: Dict[str, list] = {}
        resultado: Dict[str, Any] = {"itens": [], "ignorados": []}
        for item in itens:
            if item.get("base_propria_id"):
                por_base.setdefault(item["base_propria_id"], []).append(item)
            else:
                self._ignorar(resultado, item, "Item sem vínculo com a base (base removida)")

        for base_id, itens_base in por_base.items():
            if not servico.repo.buscar_base(base_id, dono):
                for item in itens_base:
                    self._ignorar(resultado, item, "Base própria não encontrada")
                continue
            estados = dict.fromkeys((i.get("estado") or orcamento.get("estado")) for i in itens_base)
            for estado in estados:
                grupo = [i for i in itens_base if (i.get("estado") or orcamento.get("estado")) == estado]
                calculos = servico.calcular_precos_por_codigo(
                    base_id, [i["codigo_composicao"] for i in grupo], **self._parametros_preco(orcamento, estado)
                )
                for item in grupo:
                    self._avaliar_item_propria(resultado, item, calculos.get(item["codigo_composicao"]), aplicar)

        alterados = [i for i in resultado["itens"] if i["alterado"]]
        if aplicar and alterados:
            self._atualizar_valor_total_orcamento(orcamento_id)
        return {
            "aplicado": bool(aplicar),
            "total_itens": len(itens),
            "itens_alterados": len(alterados),
            "diferenca_custo_direto": round(sum(i["diferenca_total"] for i in alterados), 2),
            "itens": [{k: v for k, v in i.items() if k != "diferenca_total"} for i in resultado["itens"]],
            "ignorados": resultado["ignorados"],
        }

    @staticmethod
    def _ignorar(resultado: Dict[str, Any], item: dict, motivo: str) -> None:
        resultado["ignorados"].append(
            {"item_id": str(item["id"]), "codigo_composicao": item.get("codigo_composicao", ""), "motivo": motivo}
        )

    def _avaliar_item_propria(self, resultado: Dict[str, Any], item: dict, calculo: Optional[dict], aplicar: bool):
        if calculo is None:
            return self._ignorar(resultado, item, "Composição não existe mais na base própria")
        if any(not linha["encontrado"] for linha in calculo["itens"]):
            return self._ignorar(resultado, item, "Composição com itens sem preço para este orçamento")
        if self.insumo_repository and any(
            i.get("preco_unitario_custom") is not None for i in self.insumo_repository.listar_por_item(item["id"])
        ):
            return self._ignorar(resultado, item, "Item com insumos editados manualmente")

        preco_atual = float(item.get("preco_unitario") or 0.0)
        preco_novo = calculo["preco_total"]
        diferenca = round(preco_novo - preco_atual, 2)
        alterado = diferenca != 0
        quantidade = float(item.get("quantidade") or 0.0)

        if aplicar and alterado:
            self.repository.atualizar(
                item["id"], {"preco_unitario": preco_novo, "preco_total": round(quantidade * preco_novo, 2)}
            )
            if self.insumo_repository:
                self._gravar_insumos_propria(item, calculo, quantidade)

        resultado["itens"].append(
            {
                "item_id": str(item["id"]),
                "codigo_composicao": item["codigo_composicao"],
                "descricao": item.get("descricao") or "",
                "base_propria_id": str(item["base_propria_id"]),
                "preco_atual": preco_atual,
                "preco_novo": preco_novo,
                "diferenca": diferenca,
                "variacao_percentual": round(diferenca / preco_atual * 100, 2) if preco_atual else None,
                "alterado": alterado,
                "aplicado": bool(aplicar and alterado),
                "diferenca_total": diferenca * quantidade,
            }
        )

    def buscar_composicoes_proprias(self, orcamento_id: str, termo: str, limite: int = 20) -> list:
        """Autocomplete: composições das bases do dono do orçamento, já precificadas com UF/mês/tipo do orçamento."""
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")
        servico = self._exigir_base_propria_service()
        resultados: list = []
        for base in servico.listar_bases(orcamento.get("user_id")):
            if len(resultados) >= limite:
                break
            composicoes = servico.listar_composicoes(base["id"], termo, limite - len(resultados), 0)
            if not composicoes:
                continue
            precos = servico.calcular_precos_por_codigo(
                base["id"], [c["codigo"] for c in composicoes], **self._parametros_preco(orcamento, None)
            )
            for comp in composicoes:
                calculo = precos.get(comp["codigo"])
                resultados.append(
                    {
                        "base_propria_id": base["id"],
                        "base_propria_nome": base["nome"],
                        "codigo": comp["codigo"],
                        "descricao": comp["descricao"],
                        "unidade": comp["unidade"],
                        "grupo": comp.get("grupo"),
                        "preco_unitario": calculo["preco_total"] if calculo else None,
                    }
                )
        return resultados

    def listar_insumos(self, orcamento_id: str, item_id: str):
        item = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item:
            raise NaoEncontradoError("Item não encontrado")
        if not self.insumo_repository:
            return []
        return self.insumo_repository.listar_por_item(item_id)

    def atualizar_insumo(self, orcamento_id: str, item_id: str, insumo_id: str, dados: dict):
        if not self.insumo_repository:
            raise ValueError("Repositório de insumos não disponível")

        item_pai = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item_pai:
            raise NaoEncontradoError("Item não encontrado")

        insumo_atual = self.insumo_repository.buscar_por_id(insumo_id)
        if not insumo_atual or str(insumo_atual.get("orcamento_item_id")) != str(item_id):
            raise NaoEncontradoError("Insumo não encontrado")

        qtd = dados.get("quantidade_unitaria", insumo_atual.get("quantidade_unitaria", 0))
        preco_custom = dados.get("preco_unitario_custom")

        preco_efetivo = preco_custom if preco_custom is not None else insumo_atual.get("preco_unitario_base", 0)

        novo_total_insumo = round(float(qtd) * float(preco_efetivo), 2)

        upd_data = {"quantidade_unitaria": qtd, "preco_unitario_custom": preco_custom, "total": novo_total_insumo}

        insumo_upd = self.insumo_repository.atualizar(insumo_id, upd_data)

        insumos = self.insumo_repository.listar_por_item(item_id)
        soma_totais = sum(float(i.get("total") or 0) for i in insumos)

        qtd_pai = float(item_pai.get("quantidade") or 1)

        novo_preco_total_pai = round(soma_totais, 2)
        novo_preco_unitario_pai = round(soma_totais / qtd_pai, 2) if qtd_pai > 0 else 0

        self.repository.atualizar(
            item_id, {"preco_unitario": novo_preco_unitario_pai, "preco_total": novo_preco_total_pai}
        )

        self._atualizar_valor_total_orcamento(orcamento_id)

        return insumo_upd

    def _explodir_insumos(
        self,
        item: dict,
        orcamento: dict,
        fonte: str,
        estado: str,
    ) -> None:
        try:
            codigo = item.get("codigo_composicao")
            mes = orcamento.get("base_referencia")
            tipo_composicao = orcamento.get("tipo_composicao", "Sem Desoneração")
            quantidade_pai = float(item.get("quantidade", 1))
            item_id = item.get("id")

            filhos = self.item_repository.buscar_filhos_composicao(codigo, mes, fonte)
            if not filhos:
                return

            self.insumo_repository.deletar_por_item(item_id)

            batch = []
            for filho in filhos:
                cod_filho = filho.get("codigo_filho")
                coef = float(filho.get("quantidade_coeficiente") or 0)
                if coef <= 0:
                    continue

                preco_base = self.item_repository.buscar_preco(cod_filho, estado, mes, tipo_composicao, fonte)

                qtd_total = round(coef * quantidade_pai, 6)
                total = round(qtd_total * preco_base, 2) if preco_base else None

                batch.append(
                    {
                        "orcamento_item_id": item_id,
                        "codigo_insumo": cod_filho,
                        "descricao": filho.get("descricao_filho", ""),
                        "unidade": filho.get("unidade_filho", "-"),
                        "quantidade_unitaria": qtd_total,
                        "preco_unitario_base": preco_base,
                        "total": total,
                        "tipo_item": "MATERIAL",
                    }
                )

            if batch:
                self.insumo_repository.criar_batch(batch)
        except Exception as e:
            import logging

            logging.getLogger(__name__).warning(f"Falha ao explodir insumos: {e}")

    def remover_item(self, orcamento_id: str, item_id: str):
        item_existente = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item_existente:
            raise NaoEncontradoError("Item não encontrado")

        self.repository.deletar(item_id)
        self._atualizar_valor_total_orcamento(orcamento_id)
        return {"message": "Item removido com sucesso", "id": item_id}
