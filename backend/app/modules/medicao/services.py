import logging
from datetime import date, timedelta
from typing import Any, Dict, Iterable, List, Optional, Tuple

from app.modules.medicao.repositories import MedicaoRepository
from app.modules.medicao.schemas import AvancoEtapa, MedicaoCreate
from core.exceptions import NaoEncontradoError
from core.tempo import hoje

logger = logging.getLogger("projeto_orcamento")

# Diferença (em pontos percentuais) entre realizado e planejado tolerada antes de
# chamar a obra de atrasada ou adiantada.
TOLERANCIA_PONTOS = 5.0
PASSO_DIAS_CURVA = 7


def _como_data(valor: Any) -> Optional[date]:
    if valor is None:
        return None
    if isinstance(valor, date):
        return valor
    return date.fromisoformat(str(valor)[:10])


def progresso_planejado(inicio: date, fim: date, dia: date) -> float:
    """Avanço linear esperado de uma etapa (0 a 100); o último dia da etapa conta como concluído."""
    if dia < inicio:
        return 0.0
    if dia >= fim:
        return 100.0
    return 100.0 * ((dia - inicio).days + 1) / ((fim - inicio).days + 1)


def _progresso_em(medicoes: List[Tuple[date, int]], dia: date) -> int:
    """Última medição da etapa até `dia` (lista ordenada por data); 0 se ainda não houve."""
    atual = 0
    for data, progresso in medicoes:
        if data > dia:
            break
        atual = progresso
    return atual


def calcular_curva(
    etapas: List[Dict[str, Any]],
    pesos: Dict[str, float],
    medicoes: Iterable[Dict[str, Any]],
    data_hoje: date,
) -> Dict[str, Any]:
    """
    Curva S planejado x realizado, ponderada pelo custo orçado de cada etapa.

    Só entram etapas com cronograma e que carregam custo (ou são folhas): etapas-pai
    sem itens próprios são só agrupadores e dobrariam a contagem das filhas. Sem custo
    em nenhuma delas, as etapas valem o mesmo. Etapas sem datas ficam de fora e são
    contadas em `etapas_sem_cronograma`.
    """
    pais = {e["parent_id"] for e in etapas if e.get("parent_id")}
    agendadas: List[Dict[str, Any]] = []
    sem_cronograma = 0
    for etapa in etapas:
        if not (pesos.get(etapa["id"], 0.0) > 0 or etapa["id"] not in pais):
            continue
        if etapa.get("data_inicio") and etapa.get("data_fim"):
            agendadas.append(etapa)
        else:
            sem_cronograma += 1

    if not agendadas:
        return {
            "inicio": None,
            "fim": None,
            "hoje": data_hoje,
            "planejado_hoje": None,
            "realizado_hoje": None,
            "desvio": None,
            "situacao": "SEM_CRONOGRAMA",
            "etapas_sem_cronograma": sem_cronograma,
            "pontos": [],
        }

    por_etapa: Dict[str, List[Tuple[date, int]]] = {}
    for m in medicoes:
        por_etapa.setdefault(m["etapa_id"], []).append((_como_data(m["data"]), int(m["progresso"])))
    for lista in por_etapa.values():
        lista.sort(key=lambda par: par[0])

    # Obras que já tinham progresso antes das medições existirem: o valor atual da
    # etapa vale como uma medição de hoje, para não zerar o realizado.
    for etapa in agendadas:
        if etapa["id"] not in por_etapa and (etapa.get("progresso") or 0) > 0:
            por_etapa[etapa["id"]] = [(data_hoje, int(etapa["progresso"]))]

    pesos_efetivos = {e["id"]: pesos.get(e["id"], 0.0) for e in agendadas}
    if sum(pesos_efetivos.values()) <= 0:
        pesos_efetivos = {e["id"]: 1.0 for e in agendadas}
    total = sum(pesos_efetivos.values())

    datas = [(_como_data(e["data_inicio"]), _como_data(e["data_fim"])) for e in agendadas]
    inicio = min(d[0] for d in datas)
    fim = max(d[1] for d in datas)

    def planejado(dia: date) -> float:
        soma = 0.0
        for etapa, (ini, fi) in zip(agendadas, datas, strict=True):
            soma += pesos_efetivos[etapa["id"]] * progresso_planejado(ini, fi, dia)
        return soma / total

    def realizado(dia: date) -> float:
        soma = 0.0
        for etapa in agendadas:
            soma += pesos_efetivos[etapa["id"]] * _progresso_em(por_etapa.get(etapa["id"], []), dia)
        return soma / total

    dias = {inicio, fim}
    cursor = inicio
    while cursor < fim:
        dias.add(cursor)
        cursor += timedelta(days=PASSO_DIAS_CURVA)
    if data_hoje >= inicio:
        dias.add(data_hoje)

    pontos = [
        {
            "data": dia,
            "planejado": round(planejado(dia), 1),
            "realizado": round(realizado(dia), 1) if dia <= data_hoje else None,
        }
        for dia in sorted(dias)
    ]

    planejado_hoje = round(planejado(data_hoje), 1)
    realizado_hoje = round(realizado(data_hoje), 1)
    desvio = round(realizado_hoje - planejado_hoje, 1)
    if data_hoje < inicio:
        situacao = "NO_PRAZO"
    elif desvio < -TOLERANCIA_PONTOS:
        situacao = "ATRASADA"
    elif desvio > TOLERANCIA_PONTOS:
        situacao = "ADIANTADA"
    else:
        situacao = "NO_PRAZO"

    return {
        "inicio": inicio,
        "fim": fim,
        "hoje": data_hoje,
        "planejado_hoje": planejado_hoje,
        "realizado_hoje": realizado_hoje,
        "desvio": desvio,
        "situacao": situacao,
        "etapas_sem_cronograma": sem_cronograma,
        "pontos": pontos,
    }


class MedicaoService:
    def __init__(self, repository: MedicaoRepository):
        self.repository = repository

    # --- Helpers -------------------------------------------------------------

    def _obra(self, obra_id: str) -> Dict[str, Any]:
        real = self.repository.resolver_obra(obra_id)
        obra = self.repository.buscar_obra(real) if real else None
        if not obra:
            raise NaoEncontradoError("Obra não encontrada")
        return obra

    def _etapas_da_obra(self, obra: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        if not obra.get("orcamento_id"):
            return {}
        return {e["id"]: e for e in self.repository.etapas(obra["orcamento_id"])}

    def _curva(self, obra: Dict[str, Any]) -> Dict[str, Any]:
        orcamento_id = obra.get("orcamento_id")
        if not orcamento_id:
            return calcular_curva([], {}, [], hoje())
        return calcular_curva(
            self.repository.etapas(orcamento_id),
            self.repository.pesos_por_etapa(orcamento_id),
            self.repository.listar(obra["id"]),
            hoje(),
        )

    def _espelhar_progresso(self, obra: Dict[str, Any], etapa_id: str) -> None:
        """orcamento_etapas.progresso passa a refletir a medição mais recente da etapa."""
        ultima = self.repository.ultima_da_etapa(etapa_id)
        progresso = int(ultima["progresso"]) if ultima else 0
        self.repository.atualizar_progresso_etapa(etapa_id, obra["orcamento_id"], progresso)

    def _sincronizar_status(self, obra: Dict[str, Any], curva: Optional[Dict[str, Any]] = None) -> None:
        """Mantém obras.status em EM_ANDAMENTO/ATRASADO conforme a Curva S; obra concluída não muda."""
        if obra.get("status") == "CONCLUIDO":
            return
        situacao = (curva or self._curva(obra))["situacao"]
        novo = "ATRASADO" if situacao == "ATRASADA" else "EM_ANDAMENTO"
        if novo != obra.get("status"):
            self.repository.atualizar_status_obra(obra["id"], novo)
            obra["status"] = novo

    def _gravar(
        self,
        obra: Dict[str, Any],
        etapas: Dict[str, Dict[str, Any]],
        etapa_id: str,
        data: date,
        progresso: int,
        observacao: Optional[str],
        origem: str,
        diario_id: Optional[str],
    ) -> Dict[str, Any]:
        if etapa_id not in etapas:
            raise NaoEncontradoError("Etapa não encontrada nesta obra")
        if data > hoje():
            raise ValueError("A data da medição não pode ser futura")
        dados: Dict[str, Any] = {"progresso": progresso, "origem": origem, "diario_id": diario_id}
        if observacao is not None:
            dados["observacao"] = observacao
        existente = self.repository.buscar_por_etapa_data(etapa_id, data.isoformat())
        if existente:
            return self.repository.atualizar(existente["id"], obra["id"], dados)
        return self.repository.inserir({**dados, "obra_id": obra["id"], "etapa_id": etapa_id, "data": data.isoformat()})

    # --- API pública ---------------------------------------------------------

    def registrar(self, obra_id: str, schema: MedicaoCreate) -> Dict[str, Any]:
        obra = self._obra(obra_id)
        etapas = self._etapas_da_obra(obra)
        medicao = self._gravar(
            obra, etapas, schema.etapa_id, schema.data, schema.progresso, schema.observacao, "MANUAL", None
        )
        self._espelhar_progresso(obra, schema.etapa_id)
        self._sincronizar_status(obra)
        return {**medicao, "etapa_nome": etapas[schema.etapa_id]["nome"]}

    def registrar_por_orcamento(self, orcamento_id: str, etapa_id: str, progresso: int) -> None:
        """
        Usado pela atualização rápida de progresso da etapa: grava a medição de hoje se o
        orçamento já virou obra. Falhas aqui não podem desfazer o progresso já salvo.
        """
        try:
            obra = self.repository.buscar_obra_por_orcamento(orcamento_id)
            if not obra:
                return
            etapas = self._etapas_da_obra(obra)
            self._gravar(obra, etapas, etapa_id, hoje(), progresso, None, "MANUAL", None)
            self._espelhar_progresso(obra, etapa_id)
            self._sincronizar_status(obra)
        except Exception as e:
            logger.error(f"Falha ao registrar medição da etapa {etapa_id}: {e}")

    def substituir_do_diario(
        self, obra_id: str, diario_id: str, data: date, avancos: List[AvancoEtapa]
    ) -> Dict[str, int]:
        """
        Troca as medições vindas de um diário pelas informadas agora (lista vazia = só remove).
        Devolve {etapa_id: progresso} do que ficou registrado.
        """
        obra = self._obra(obra_id)
        etapas = self._etapas_da_obra(obra)
        for avanco in avancos:
            if avanco.etapa_id not in etapas:
                raise NaoEncontradoError("Etapa não encontrada nesta obra")
        afetadas = set(self.repository.deletar_do_diario(diario_id, obra["id"]))
        for avanco in avancos:
            self._gravar(obra, etapas, avanco.etapa_id, data, avanco.progresso, None, "DIARIO", diario_id)
            afetadas.add(avanco.etapa_id)
        for etapa_id in afetadas:
            self._espelhar_progresso(obra, etapa_id)
        if afetadas:
            self._sincronizar_status(obra)
        return {a.etapa_id: a.progresso for a in avancos}

    def listar(self, obra_id: str, etapa_id: Optional[str] = None) -> List[Dict[str, Any]]:
        obra = self._obra(obra_id)
        nomes = {i: e["nome"] for i, e in self._etapas_da_obra(obra).items()}
        return [{**m, "etapa_nome": nomes.get(m["etapa_id"])} for m in self.repository.listar(obra["id"], etapa_id)]

    def remover(self, obra_id: str, medicao_id: str) -> None:
        obra = self._obra(obra_id)
        medicao = self.repository.buscar(medicao_id, obra["id"])
        if not medicao:
            raise NaoEncontradoError("Medição não encontrada")
        self.repository.deletar(medicao_id, obra["id"])
        self._espelhar_progresso(obra, medicao["etapa_id"])
        self._sincronizar_status(obra)

    def curva_s(self, obra_id: str) -> Dict[str, Any]:
        obra = self._obra(obra_id)
        curva = self._curva(obra)
        self._sincronizar_status(obra, curva)
        return curva
