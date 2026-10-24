import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from app.modules.diario.repositories import DiarioRepository
from app.modules.diario.schemas import DiarioCreate, DiarioUpdate, ServicoInput
from app.modules.medicao.schemas import AvancoEtapa
from app.modules.medicao.services import MedicaoService
from core.exceptions import NaoEncontradoError
from core.tempo import hoje

logger = logging.getLogger("projeto_orcamento")

MAX_FOTOS_POR_DIARIO = 10
JANELA_RESUMO_DIAS = 60
DIAS_TAXA = 7

CAMPOS_OBRIGATORIOS = ("data", "titulo", "atividades", "clima", "equipe_presente")

TRANSICOES_STATUS = {
    "RASCUNHO": {"ENVIADO"},
    "ENVIADO": {"APROVADO", "RASCUNHO"},
    "APROVADO": {"ENVIADO"},
}


def detectar_imagem(conteudo: bytes) -> Optional[Tuple[str, str]]:
    """
    Identifica a imagem pelos primeiros bytes, não pelo content-type nem pelo nome,
    que o cliente controla. Devolve (content_type, extensão) ou None.
    """
    if conteudo.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", "jpg"
    if conteudo.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", "png"
    if conteudo[:4] == b"RIFF" and conteudo[8:12] == b"WEBP":
        return "image/webp", "webp"
    return None


def formatar_endereco(endereco: Any) -> Optional[str]:
    if not endereco:
        return None
    if isinstance(endereco, str):
        return endereco
    if isinstance(endereco, dict):
        partes = [endereco.get(k) for k in ("logradouro", "bairro", "cidade", "estado", "uf")]
        texto = ", ".join(str(p) for p in partes if p)
        return texto or None
    return None


def _serializar(dados: Dict[str, Any]) -> Dict[str, Any]:
    saida = {}
    for chave, valor in dados.items():
        if isinstance(valor, date):
            valor = valor.isoformat()
        elif isinstance(valor, Decimal):
            valor = float(valor)
        saida[chave] = valor
    return saida


def calcular_avancos(itens: List[Dict[str, Any]], linhas: List[Dict[str, Any]]) -> Dict[str, Dict[str, int]]:
    """
    {diario_id: {etapa_id: % acumulado}} das etapas que receberam serviço em cada diário.
    O % da etapa é a média dos serviços (executado/orçado, no máximo 100%) ponderada pelo preço.
    """
    por_item = {i["id"]: i for i in itens}
    itens_da_etapa: Dict[str, List[Dict[str, Any]]] = {}
    for item in itens:
        if item.get("etapa_id"):
            itens_da_etapa.setdefault(item["etapa_id"], []).append(item)

    def progresso(etapa_id: str, feito: Dict[str, float]) -> int:
        grupo = itens_da_etapa[etapa_id]
        pesos = [float(i.get("preco_total") or 0) for i in grupo]
        if sum(pesos) <= 0:
            pesos = [1.0] * len(grupo)
        total = sum(
            peso * min(feito.get(i["id"], 0.0) / float(i["quantidade"]), 1.0) if float(i["quantidade"]) > 0 else 0.0
            for peso, i in zip(pesos, grupo, strict=True)
        )
        return round(100 * total / sum(pesos))

    por_diario: Dict[str, List[Dict[str, Any]]] = {}
    for linha in linhas:
        por_diario.setdefault(linha["diario_id"], []).append(linha)
    cronologia = sorted(por_diario, key=lambda d: (str(por_diario[d][0]["data"]), d))

    feito: Dict[str, float] = {}
    saida: Dict[str, Dict[str, int]] = {}
    for diario_id in cronologia:
        etapas_tocadas = set()
        for linha in por_diario[diario_id]:
            item = por_item.get(linha["item_id"])
            if item and item.get("etapa_id"):
                feito[item["id"]] = feito.get(item["id"], 0.0) + float(linha["quantidade"])
                etapas_tocadas.add(item["etapa_id"])
        saida[diario_id] = {etapa_id: progresso(etapa_id, feito) for etapa_id in etapas_tocadas}
    return saida


class DiarioService:
    def __init__(self, repository: DiarioRepository, medicoes: Optional[MedicaoService] = None):
        self.repository = repository
        self.medicoes = medicoes

    # --- Helpers -------------------------------------------------------------

    def _obra(self, obra_id: str) -> str:
        real = self.repository.resolver_obra(obra_id)
        if not real:
            raise NaoEncontradoError("Obra não encontrada")
        return real

    def _diario(self, obra_id: str, diario_id: str) -> Dict[str, Any]:
        diario = self.repository.buscar(diario_id, obra_id)
        if not diario:
            raise NaoEncontradoError("Diário não encontrado")
        return diario

    @staticmethod
    def _exigir_editavel(diario: Dict[str, Any]) -> None:
        if diario["status"] == "APROVADO":
            raise ValueError("Diário aprovado não pode ser alterado. Reabra o registro para editar.")

    @staticmethod
    def _validar_data(data: date) -> None:
        if data > hoje():
            raise ValueError("A data do diário não pode ser futura")

    def _com_fotos(self, diarios: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        fotos = self.repository.listar_fotos([d["id"] for d in diarios])
        urls = self.repository.assinar_urls([f["caminho"] for f in fotos])
        por_diario: Dict[str, List[Dict[str, Any]]] = {}
        for f in fotos:
            por_diario.setdefault(f["diario_id"], []).append(
                {
                    "id": f["id"],
                    "diario_id": f["diario_id"],
                    "legenda": f.get("legenda"),
                    "url": urls.get(f["caminho"]),
                    "created_at": f.get("created_at"),
                }
            )
        linhas = self.repository.servicos_dos_diarios([d["id"] for d in diarios])
        itens = {i["id"]: i for i in self.repository.itens_por_ids(list({l["item_id"] for l in linhas}))}
        servicos: Dict[str, List[Dict[str, Any]]] = {}
        for linha in linhas:
            item = itens.get(linha["item_id"])
            if not item:
                continue
            quantidade = float(linha["quantidade"])
            servicos.setdefault(linha["diario_id"], []).append(
                {
                    "item_id": item["id"],
                    "codigo": item.get("codigo_composicao"),
                    "descricao": item["descricao"],
                    "unidade": item["unidade"],
                    "quantidade": quantidade,
                    "percentual": round(100 * quantidade / float(item["quantidade"]), 1) if float(item["quantidade"]) else 0,
                }
            )
        return [
            {
                **d,
                "tem_ocorrencia": bool((d.get("ocorrencias") or "").strip()),
                "fotos": por_diario.get(d["id"], []),
                "servicos": servicos.get(d["id"], []),
            }
            for d in diarios
        ]

    def _info_obra(self, obra: Dict[str, Any], ultima_atualizacao: Optional[str]) -> Dict[str, Any]:
        orcamento_id = obra.get("orcamento_id")
        nomes = self.repository.nomes_de_orcamentos([orcamento_id] if orcamento_id else [])
        membro_id = obra.get("engenheiro_responsavel_id")
        membros = self.repository.nomes_de_membros([membro_id] if membro_id else [])
        etapas = self.repository.etapas_do_orcamento(orcamento_id) if orcamento_id else []
        progressos = [int(e.get("progresso") or 0) for e in etapas]
        itens = self.repository.itens_do_orcamento(orcamento_id) if orcamento_id else []
        feito: Dict[str, float] = {}
        for linha in self.repository.servicos_da_obra(obra["id"]) if itens else []:
            feito[linha["item_id"]] = feito.get(linha["item_id"], 0.0) + linha["quantidade"]
        ordem = {e["id"]: n for n, e in enumerate(etapas)}
        nomes_etapa = {e["id"]: e["nome"] for e in etapas}
        itens.sort(key=lambda i: (ordem.get(i.get("etapa_id"), len(ordem)), i.get("codigo_composicao") or ""))
        return {
            "obra_id": obra["id"],
            "nome": nomes.get(orcamento_id) or obra.get("escopo") or obra.get("cliente") or "Obra",
            "local": formatar_endereco(obra.get("endereco")),
            "responsavel": membros.get(membro_id),
            "data_inicio": obra.get("data_inicio_real"),
            "prazo_dias": obra.get("prazo_estimado_dias"),
            "progresso": round(sum(progressos) / len(progressos)) if progressos else 0,
            "servicos": [
                {
                    "id": i["id"],
                    "codigo": i.get("codigo_composicao"),
                    "descricao": i["descricao"],
                    "unidade": i["unidade"],
                    "quantidade": float(i["quantidade"]),
                    "executado": feito.get(i["id"], 0.0),
                    "etapa_nome": nomes_etapa.get(i.get("etapa_id")),
                }
                for i in itens
            ],
            "ultima_atualizacao": ultima_atualizacao,
        }

    def _validar_servicos(self, obra: Dict[str, Any], diario_id: str, servicos: List[ServicoInput]) -> None:
        ids = [s.item_id for s in servicos]
        if len(set(ids)) != len(ids):
            raise ValueError("Há serviço repetido no diário")
        itens = {i["id"]: i for i in self.repository.itens_por_ids(ids)}
        em_outros: Dict[str, float] = {}
        for linha in self.repository.servicos_da_obra(obra["id"]):
            if linha["diario_id"] != diario_id:
                em_outros[linha["item_id"]] = em_outros.get(linha["item_id"], 0.0) + linha["quantidade"]
        for servico in servicos:
            item = itens.get(servico.item_id)
            if not item or item["orcamento_id"] != obra.get("orcamento_id"):
                raise NaoEncontradoError("Serviço não encontrado nesta obra")
            # Outros diários já consumiram parte do orçado; este só pode lançar o que sobra.
            restante = float(item["quantidade"]) - em_outros.get(servico.item_id, 0.0)
            if servico.quantidade > restante + 1e-6:
                raise ValueError(f"A quantidade de '{item['descricao']}' passa do que falta do orçado ({max(restante, 0):g})")

    def _sincronizar_medicoes(
        self, real: str, orcamento_id: Optional[str], desde: date, diario_id: Optional[str], data_diario: Optional[date]
    ) -> None:
        """
        Reescreve o avanço das etapas a partir dos serviços dos diários. O % é acumulado, então
        os diários de data igual ou posterior à alterada também são refeitos.
        """
        if not self.medicoes or not orcamento_id:
            return
        linhas = self.repository.servicos_da_obra(real)
        avancos = calcular_avancos(self.repository.itens_do_orcamento(orcamento_id), linhas)
        datas = {linha["diario_id"]: _como_data(linha["data"]) for linha in linhas}
        if diario_id:
            avancos.setdefault(diario_id, {})
            datas.setdefault(diario_id, data_diario)
        for d_id, por_etapa in avancos.items():
            if d_id == diario_id or datas[d_id] >= desde:
                lista = [AvancoEtapa(etapa_id=e, progresso=p) for e, p in por_etapa.items()]
                self.medicoes.substituir_do_diario(real, d_id, datas[d_id], lista)

    def _gravar_servicos(
        self, real: str, diario_id: str, data: date, desde: date, servicos: List[ServicoInput]
    ) -> None:
        obra = self.repository.buscar_obra(real)
        self._validar_servicos(obra, diario_id, servicos)
        self.repository.substituir_servicos(diario_id, [s.model_dump() for s in servicos])
        self._sincronizar_medicoes(real, obra.get("orcamento_id"), desde, diario_id, data)

    # --- Diários -------------------------------------------------------------

    def listar(self, obra_id: str, limite: int) -> Dict[str, Any]:
        real = self._obra(obra_id)
        obra = self.repository.buscar_obra(real)
        diarios = self.repository.listar(real, limite)
        ultima = max((d["updated_at"] for d in diarios if d.get("updated_at")), default=None)
        return {"obra": self._info_obra(obra, ultima), "registros": self._com_fotos(diarios)}

    def obter(self, obra_id: str, diario_id: str) -> Dict[str, Any]:
        real = self._obra(obra_id)
        return self._com_fotos([self._diario(real, diario_id)])[0]

    def criar(self, obra_id: str, schema: DiarioCreate) -> Dict[str, Any]:
        real = self._obra(obra_id)
        self._validar_data(schema.data)
        if self.repository.buscar_por_data(real, schema.data.isoformat()):
            raise ValueError("Já existe um diário para essa data nesta obra")
        criado = self.repository.criar(real, _serializar(schema.model_dump(exclude={"servicos"})))
        if schema.servicos:
            try:
                self._gravar_servicos(real, criado["id"], schema.data, schema.data, schema.servicos)
            except Exception:
                # Sem os serviços o registro ficaria incompleto: desfaz a criação.
                self.repository.deletar(criado["id"], real)
                raise
        return self._com_fotos([criado])[0]

    def atualizar(self, obra_id: str, diario_id: str, schema: DiarioUpdate) -> Dict[str, Any]:
        real = self._obra(obra_id)
        atual = self._diario(real, diario_id)
        self._exigir_editavel(atual)

        dados = schema.model_dump(exclude_unset=True, exclude={"servicos"})
        for campo in CAMPOS_OBRIGATORIOS:
            if campo in dados and dados[campo] is None:
                raise ValueError(f"O campo '{campo}' não pode ser vazio")
        if not dados and schema.servicos is None:
            return self._com_fotos([atual])[0]

        nova_data = dados.get("data")
        if nova_data is not None:
            self._validar_data(nova_data)
            conflito = self.repository.buscar_por_data(real, nova_data.isoformat())
            if conflito and conflito["id"] != diario_id:
                raise ValueError("Já existe um diário para essa data nesta obra")

        dados["updated_at"] = datetime.now(timezone.utc).isoformat()
        atualizado = self.repository.atualizar(diario_id, real, _serializar(dados))
        if not atualizado:
            raise NaoEncontradoError("Diário não encontrado")
        if schema.servicos is not None:
            nova = _como_data(atualizado["data"])
            self._gravar_servicos(real, diario_id, nova, min(nova, _como_data(atual["data"])), schema.servicos)
        return self._com_fotos([atualizado])[0]

    def alterar_status(self, obra_id: str, diario_id: str, novo_status: str) -> Dict[str, Any]:
        real = self._obra(obra_id)
        atual = self._diario(real, diario_id)
        if novo_status not in TRANSICOES_STATUS[atual["status"]]:
            raise ValueError(f"Não é possível mudar o diário de {atual['status']} para {novo_status}")
        atualizado = self.repository.atualizar(
            diario_id, real, {"status": novo_status, "updated_at": datetime.now(timezone.utc).isoformat()}
        )
        if not atualizado:
            raise NaoEncontradoError("Diário não encontrado")
        return self._com_fotos([atualizado])[0]

    def deletar(self, obra_id: str, diario_id: str) -> None:
        real = self._obra(obra_id)
        atual = self._diario(real, diario_id)
        self._exigir_editavel(atual)
        caminhos = [f["caminho"] for f in self.repository.listar_fotos([diario_id])]
        if self.medicoes:
            # As medições citam o diário; sem ele perderiam a origem, então saem junto.
            self.medicoes.substituir_do_diario(real, diario_id, _como_data(atual["data"]), [])
        if not self.repository.deletar(diario_id, real):
            raise NaoEncontradoError("Diário não encontrado")
        self.repository.remover_arquivos(caminhos)
        # Os diários seguintes acumulavam sobre os serviços deste.
        self._sincronizar_medicoes(
            real, self.repository.buscar_obra(real).get("orcamento_id"), _como_data(atual["data"]), None, None
        )

    # --- Fotos ---------------------------------------------------------------

    def adicionar_foto(self, obra_id: str, diario_id: str, conteudo: bytes, legenda: Optional[str]) -> Dict[str, Any]:
        real = self._obra(obra_id)
        atual = self._diario(real, diario_id)
        self._exigir_editavel(atual)

        imagem = detectar_imagem(conteudo)
        if not imagem:
            raise ValueError("Formato de imagem não suportado. Envie JPG, PNG ou WEBP.")
        if len(self.repository.listar_fotos([diario_id])) >= MAX_FOTOS_POR_DIARIO:
            raise ValueError(f"Limite de {MAX_FOTOS_POR_DIARIO} fotos por diário atingido")

        content_type, extensao = imagem
        caminho = f"{real}/{diario_id}/{uuid.uuid4().hex}.{extensao}"
        self.repository.enviar_arquivo(caminho, conteudo, content_type)
        try:
            foto = self.repository.criar_foto(diario_id, caminho, (legenda or "").strip()[:255] or None)
        except Exception:
            self.repository.remover_arquivos([caminho])
            raise
        url = self.repository.assinar_urls([caminho]).get(caminho)
        return {
            "id": foto["id"],
            "diario_id": diario_id,
            "legenda": foto.get("legenda"),
            "url": url,
            "created_at": foto.get("created_at"),
        }

    def remover_foto(self, obra_id: str, diario_id: str, foto_id: str) -> None:
        real = self._obra(obra_id)
        atual = self._diario(real, diario_id)
        self._exigir_editavel(atual)
        foto = self.repository.buscar_foto(foto_id, diario_id)
        if not foto:
            raise NaoEncontradoError("Foto não encontrada")
        self.repository.deletar_foto(foto_id, diario_id)
        self.repository.remover_arquivos([foto["caminho"]])

    # --- Visão geral ---------------------------------------------------------

    def resumo(self, user_id: str) -> Dict[str, Any]:
        data_hoje = hoje()
        obras = [
            o
            for o in self.repository.listar_obras_do_usuario(user_id)
            if o.get("status") not in ("CONCLUIDO", "CONCLUIDA")
        ]
        diarios = self.repository.diarios_recentes(
            [o["id"] for o in obras], data_hoje - timedelta(days=JANELA_RESUMO_DIAS)
        )
        por_obra: Dict[str, List[Dict[str, Any]]] = {}
        for d in diarios:
            por_obra.setdefault(d["obra_id"], []).append(d)

        orcamento_ids = [o["orcamento_id"] for o in obras if o.get("orcamento_id")]
        membro_ids = [o["engenheiro_responsavel_id"] for o in obras if o.get("engenheiro_responsavel_id")]
        nomes = self.repository.nomes_de_orcamentos(orcamento_ids)
        membros = self.repository.nomes_de_membros(membro_ids)

        itens = []
        esperados = 0
        registrados = 0
        for obra in obras:
            registros = por_obra.get(obra["id"], [])
            inicio = _como_data(obra.get("data_inicio_real"))
            situacao, ultimo = self._situacao(registros, inicio, data_hoje)
            itens.append(
                {
                    "obra_id": obra["id"],
                    "orcamento_id": obra.get("orcamento_id"),
                    "nome": nomes.get(obra.get("orcamento_id")) or obra.get("escopo") or obra.get("cliente") or "Obra",
                    "local": formatar_endereco(obra.get("endereco")),
                    "responsavel": membros.get(obra.get("engenheiro_responsavel_id")),
                    "situacao": situacao,
                    "ultimo_registro": ultimo["data"] if ultimo else None,
                    "ultimo_clima": ultimo["clima"] if ultimo else None,
                }
            )
            if inicio and inicio <= data_hoje:
                dias_ativos = min(DIAS_TAXA, (data_hoje - inicio).days + 1)
                limite = data_hoje - timedelta(days=dias_ativos - 1)
                esperados += dias_ativos
                registrados += sum(1 for r in registros if _como_data(r["data"]) >= limite)

        itens.sort(key=lambda i: ({"ALERTA": 0, "PENDENTE": 1, "RASCUNHO": 2, "ENVIADO": 3}[i["situacao"]], i["nome"]))
        return {
            "total_obras": len(itens),
            "enviados_hoje": sum(1 for i in itens if i["situacao"] == "ENVIADO"),
            "alertas": sum(1 for i in itens if i["situacao"] == "ALERTA"),
            "taxa_preenchimento_7d": min(100, round(100 * registrados / esperados)) if esperados else 0,
            "obras": itens,
        }

    @staticmethod
    def _situacao(
        registros: List[Dict[str, Any]], inicio: Optional[date], data_hoje: date
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        return situacao_do_diario(registros, inicio, data_hoje)


def situacao_do_diario(
    registros: List[Dict[str, Any]], inicio: Optional[date], data_hoje: date
) -> Tuple[str, Optional[Dict[str, Any]]]:
    """
    ENVIADO: há diário de hoje já enviado; RASCUNHO: há de hoje, mas não enviado;
    PENDENTE: ainda dentro do prazo normal de preenchimento; ALERTA: 2+ dias sem registro.
    """
    ultimo = registros[0] if registros else None
    if ultimo and _como_data(ultimo["data"]) == data_hoje:
        return ("RASCUNHO" if ultimo["status"] == "RASCUNHO" else "ENVIADO"), ultimo
    if inicio and inicio > data_hoje:
        return "PENDENTE", ultimo
    referencia = _como_data(ultimo["data"]) if ultimo else inicio
    if referencia is None or (data_hoje - referencia).days >= 2:
        return "ALERTA", ultimo
    return "PENDENTE", ultimo


def _como_data(valor: Any) -> Optional[date]:
    if valor is None:
        return None
    if isinstance(valor, date):
        return valor
    return date.fromisoformat(str(valor)[:10])
