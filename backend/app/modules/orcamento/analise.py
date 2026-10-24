from datetime import date, datetime, timedelta
from typing import Any, Dict

from app.modules.etapa.repositories import EtapaRepository
from app.modules.orcamento.repositories import InsumoRepository, OrcamentoItemRepository, OrcamentoRepository
from core.exceptions import NaoEncontradoError


class CurvaAbcService:
    def __init__(
        self,
        repository: OrcamentoRepository,
        item_repository: OrcamentoItemRepository,
        insumo_repository: InsumoRepository,
    ):
        self.repository = repository
        self.item_repository = item_repository
        self.insumo_repository = insumo_repository

    def obter_curva_abc(self, orcamento_id: str) -> Dict[str, Any]:
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")

        itens = self.item_repository.listar_por_orcamento(orcamento_id)
        if not itens:
            return {"valor_total": 0.0, "insumos": [], "resumo_classes": {"A": 0.0, "B": 0.0, "C": 0.0}}

        item_ids = [item["id"] for item in itens]
        insumos = self.insumo_repository.listar_por_itens(item_ids)

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


class CronogramaService:
    def __init__(
        self,
        repository: OrcamentoRepository,
        etapa_repository: EtapaRepository,
        item_repository: OrcamentoItemRepository,
    ):
        self.repository = repository
        self.etapa_repository = etapa_repository
        self.item_repository = item_repository

    def obter_cronograma(self, orcamento_id: str) -> Dict[str, Any]:
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise NaoEncontradoError("Orçamento não encontrado")

        etapas = self.etapa_repository.listar_por_orcamento(orcamento_id)
        itens = self.item_repository.listar_por_orcamento(orcamento_id)

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
