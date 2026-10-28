import logging
from datetime import date, timedelta
from typing import Any, Dict, List

from app.modules.dashboard.repositories import DashboardRepository
from app.modules.diario.services import situacao_do_diario
from app.modules.financeiro.services import FinanceiroService
from app.modules.medicao.repositories import MedicaoRepository
from app.modules.medicao.services import calcular_curva
from core.tempo import hoje

logger = logging.getLogger("projeto_orcamento")

OBRAS_ENCERRADAS = ("CONCLUIDO", "CONCLUIDA")
JANELA_DIARIO_DIAS = 60
SEMANAS = 4
MAX_SERIES = 4
MAX_RISCOS = 8
MAX_FEED = 6
# Atraso a partir do qual o risco deixa de ser moderado e passa a crítico.
ATRASO_CRITICO_PONTOS = 15.0
ORCAMENTO_QUASE_ESGOTADO_PCT = 90.0
ORDEM_SEVERIDADE = {"critical": 0, "moderate": 1, "info": 2}


def _pct(valor: float) -> str:
    return f"{valor:.1f}".replace(".", ",")


def _datas_semana(data_hoje: date) -> List[date]:
    return [data_hoje - timedelta(days=7 * i) for i in range(SEMANAS - 1, -1, -1)]


class DashboardService:
    def __init__(
        self,
        repository: DashboardRepository,
        medicoes: MedicaoRepository,
        financeiro: FinanceiroService,
    ):
        self.repository = repository
        self.medicoes = medicoes
        self.financeiro = financeiro

    def _sincronizar_status(self, obra: Dict[str, Any], curva: Dict[str, Any]) -> None:
        """Mantém obras.status coerente com a Curva S ao abrir o painel; falhar aqui não pode derrubá-lo."""
        novo = "ATRASADO" if curva["situacao"] == "ATRASADA" else "EM_ANDAMENTO"
        if novo == obra.get("status"):
            return
        try:
            self.repository.atualizar_status_obra(obra["id"], novo)
        except Exception as e:
            logger.error(f"Falha ao sincronizar status da obra {obra['id']}: {e}")

    @staticmethod
    def _riscos_da_obra(
        nome: str,
        obra: Dict[str, Any],
        curva: Dict[str, Any],
        financeiro: Dict[str, Any],
        insumos_criticos: int,
        situacao_diario: str,
    ) -> List[Dict[str, str]]:
        href_obra = f"/obras/{obra.get('orcamento_id') or obra['id']}"
        riscos: List[Dict[str, str]] = []

        if curva["situacao"] == "ATRASADA":
            desvio = curva["desvio"]
            riscos.append(
                {
                    "tipo": "ATRASO",
                    "severidade": "critical" if desvio <= -ATRASO_CRITICO_PONTOS else "moderate",
                    "titulo": f"Atraso no cronograma: {nome}",
                    "descricao": (
                        f"Realizado {_pct(curva['realizado_hoje'])}% contra {_pct(curva['planejado_hoje'])}% "
                        f"planejado ({_pct(desvio)} p.p.)."
                    ),
                    "href": href_obra,
                }
            )

        orcado = financeiro["total_orcado"]
        if orcado > 0:
            utilizacao = 100.0 * financeiro["total_realizado"] / orcado
            if utilizacao > 100.0:
                riscos.append(
                    {
                        "tipo": "ORCAMENTO",
                        "severidade": "critical",
                        "titulo": f"Estouro de orçamento: {nome}",
                        "descricao": f"Os gastos estão {_pct(utilizacao - 100.0)}% acima do orçado.",
                        "href": f"/financeiro/{obra.get('orcamento_id') or obra['id']}",
                    }
                )
            elif utilizacao >= ORCAMENTO_QUASE_ESGOTADO_PCT:
                riscos.append(
                    {
                        "tipo": "ORCAMENTO",
                        "severidade": "moderate",
                        "titulo": f"Orçamento quase esgotado: {nome}",
                        "descricao": f"{_pct(utilizacao)}% da verba já foi utilizada.",
                        "href": f"/financeiro/{obra.get('orcamento_id') or obra['id']}",
                    }
                )

        if insumos_criticos > 0:
            riscos.append(
                {
                    "tipo": "ESTOQUE",
                    "severidade": "moderate",
                    "titulo": f"Estoque crítico: {nome}",
                    "descricao": f"{insumos_criticos} insumo(s) no mínimo ou abaixo dele.",
                    "href": f"{href_obra}/almoxarifado",
                }
            )

        if situacao_diario == "ALERTA":
            riscos.append(
                {
                    "tipo": "DIARIO",
                    "severidade": "moderate",
                    "titulo": f"Diário sem registro: {nome}",
                    "descricao": "Há dois dias ou mais sem diário de obra.",
                    "href": f"/diario/{obra['id']}",
                }
            )
        return riscos

    def _varrer(self, user_id: str, data_hoje: date, datas_semana: List[date], sincronizar: bool) -> Dict[str, Any]:
        """Percorre as obras ativas do usuário e reúne riscos, totais, séries e feed.

        Só `obter` passa `sincronizar=True`: apenas o painel regrava o status das obras.
        """
        obras = [o for o in self.repository.obras_do_usuario(user_id) if o.get("status") not in OBRAS_ENCERRADAS]
        if not obras:
            return {
                "obras": [],
                "progressos": [],
                "orcado_total": 0.0,
                "realizado_total": 0.0,
                "riscos": [],
                "series": [],
                "feed": [],
            }

        obra_ids = [o["id"] for o in obras]
        nomes_orcamento = self.repository.nomes_de_orcamentos(
            [o["orcamento_id"] for o in obras if o.get("orcamento_id")]
        )
        criticos = self.repository.insumos_criticos_por_obra(obra_ids)
        diarios_por_obra: Dict[str, List[Dict[str, Any]]] = {}
        for d in self.repository.diarios_recentes(obra_ids, data_hoje - timedelta(days=JANELA_DIARIO_DIAS)):
            diarios_por_obra.setdefault(d["obra_id"], []).append(d)

        progressos: List[int] = []
        orcado_total = 0.0
        realizado_total = 0.0
        riscos: List[Dict[str, Any]] = []
        series: List[Dict[str, Any]] = []
        nomes: Dict[str, str] = {}

        for obra in obras:
            nome = nomes_orcamento.get(obra.get("orcamento_id")) or obra.get("escopo") or obra.get("cliente") or "Obra"
            nomes[obra["id"]] = nome

            orcamento_id = obra.get("orcamento_id")
            etapas = self.medicoes.etapas(orcamento_id) if orcamento_id else []
            pesos = self.medicoes.pesos_por_etapa(orcamento_id) if orcamento_id else {}
            medicoes = self.medicoes.listar(obra["id"])

            progressos.append(round(sum(int(e.get("progresso") or 0) for e in etapas) / len(etapas)) if etapas else 0)

            curva = calcular_curva(etapas, pesos, medicoes, data_hoje)
            if sincronizar:
                self._sincronizar_status(obra, curva)

            financeiro = self.financeiro.obter_consolidado_financeiro(obra["id"])
            orcado_total += financeiro["total_orcado"]
            realizado_total += financeiro["total_realizado"]

            inicio = obra.get("data_inicio_real")
            situacao_diario, _ = situacao_do_diario(
                diarios_por_obra.get(obra["id"], []),
                date.fromisoformat(str(inicio)[:10]) if inicio else None,
                data_hoje,
            )
            riscos.extend(
                {"obra_id": obra["id"], **risco}
                for risco in self._riscos_da_obra(
                    nome, obra, curva, financeiro, criticos.get(obra["id"], 0), situacao_diario
                )
            )

            if curva["situacao"] != "SEM_CRONOGRAMA" and len(series) < MAX_SERIES:
                series.append(
                    {
                        "obra_id": obra["id"],
                        "nome": nome,
                        "valores": [
                            calcular_curva(etapas, pesos, medicoes, d, data_legado=data_hoje)["realizado_hoje"]
                            for d in datas_semana
                        ],
                    }
                )

        riscos.sort(key=lambda r: ORDEM_SEVERIDADE[r["severidade"]])

        recentes = sorted(
            (d for lista in diarios_por_obra.values() for d in lista),
            key=lambda d: (d["data"], d.get("updated_at") or ""),
            reverse=True,
        )[:MAX_FEED]
        feed = [
            {
                "titulo": d["titulo"],
                "obra_nome": nomes[d["obra_id"]],
                "data": d["data"],
                "status": d["status"],
                "atualizado_em": d.get("updated_at"),
                "href": f"/diario/{d['obra_id']}",
            }
            for d in recentes
        ]

        return {
            "obras": obras,
            "progressos": progressos,
            "orcado_total": orcado_total,
            "realizado_total": realizado_total,
            "riscos": riscos,
            "series": series,
            "feed": feed,
        }

    def listar_riscos(self, user_id: str) -> List[Dict[str, Any]]:
        """Lista completa dos riscos ativos, ordenada por severidade, com `obra_id` de origem.

        Não corta em MAX_RISCOS e não regrava o status das obras (isso só acontece em `obter`).
        """
        data_hoje = hoje()
        return self._varrer(user_id, data_hoje, _datas_semana(data_hoje), sincronizar=False)["riscos"]

    def obter(self, user_id: str) -> Dict[str, Any]:
        data_hoje = hoje()
        datas_semana = _datas_semana(data_hoje)
        semanas = [d.strftime("%d/%m") for d in datas_semana]

        varredura = self._varrer(user_id, data_hoje, datas_semana, sincronizar=True)
        obras = varredura["obras"]
        if not obras:
            return {
                "obras_ativas": 0,
                "progresso_medio": 0,
                "orcamento_total": 0.0,
                "gasto_realizado": 0.0,
                "disponivel": 0.0,
                "utilizacao_orcamento": 0.0,
                "alertas_criticos": 0,
                "riscos": [],
                "semanas": semanas,
                "series": [],
                "feed": [],
            }

        orcado_total = varredura["orcado_total"]
        realizado_total = varredura["realizado_total"]
        progressos = varredura["progressos"]
        riscos = varredura["riscos"]

        return {
            "obras_ativas": len(obras),
            "progresso_medio": round(sum(progressos) / len(progressos)),
            "orcamento_total": round(orcado_total, 2),
            "gasto_realizado": round(realizado_total, 2),
            "disponivel": round(max(orcado_total - realizado_total, 0.0), 2),
            "utilizacao_orcamento": round(100.0 * realizado_total / orcado_total, 1) if orcado_total > 0 else 0.0,
            "alertas_criticos": sum(1 for r in riscos if r["severidade"] == "critical"),
            "riscos": [{k: v for k, v in r.items() if k != "obra_id"} for r in riscos[:MAX_RISCOS]],
            "semanas": semanas,
            "series": varredura["series"],
            "feed": varredura["feed"],
        }
