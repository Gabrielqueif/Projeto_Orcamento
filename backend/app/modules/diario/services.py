import logging
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

from app.modules.diario.repositories import DiarioRepository
from app.modules.diario.schemas import DiarioCreate, DiarioUpdate
from core.exceptions import NaoEncontradoError

logger = logging.getLogger("projeto_orcamento")

# O Brasil não tem horário de verão desde 2019, então um deslocamento fixo basta
# para decidir o que é "hoje" sem depender do banco de fusos do sistema.
FUSO_BRASIL = timezone(timedelta(hours=-3))

MAX_FOTOS_POR_DIARIO = 10
JANELA_RESUMO_DIAS = 60
DIAS_TAXA = 7

CAMPOS_OBRIGATORIOS = ("data", "titulo", "atividades", "clima", "equipe_presente")

TRANSICOES_STATUS = {
    "RASCUNHO": {"ENVIADO"},
    "ENVIADO": {"APROVADO", "RASCUNHO"},
    "APROVADO": {"ENVIADO"},
}


def hoje() -> date:
    return datetime.now(FUSO_BRASIL).date()


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


class DiarioService:
    def __init__(self, repository: DiarioRepository):
        self.repository = repository

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
        return [
            {**d, "tem_ocorrencia": bool((d.get("ocorrencias") or "").strip()), "fotos": por_diario.get(d["id"], [])}
            for d in diarios
        ]

    def _info_obra(self, obra: Dict[str, Any], ultima_atualizacao: Optional[str]) -> Dict[str, Any]:
        orcamento_id = obra.get("orcamento_id")
        nomes = self.repository.nomes_de_orcamentos([orcamento_id] if orcamento_id else [])
        membro_id = obra.get("engenheiro_responsavel_id")
        membros = self.repository.nomes_de_membros([membro_id] if membro_id else [])
        progressos = self.repository.progressos_das_etapas(orcamento_id) if orcamento_id else []
        return {
            "obra_id": obra["id"],
            "nome": nomes.get(orcamento_id) or obra.get("escopo") or obra.get("cliente") or "Obra",
            "local": formatar_endereco(obra.get("endereco")),
            "responsavel": membros.get(membro_id),
            "data_inicio": obra.get("data_inicio_real"),
            "prazo_dias": obra.get("prazo_estimado_dias"),
            "progresso": round(sum(progressos) / len(progressos)) if progressos else 0,
            "ultima_atualizacao": ultima_atualizacao,
        }

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
        criado = self.repository.criar(real, _serializar(schema.model_dump()))
        return self._com_fotos([criado])[0]

    def atualizar(self, obra_id: str, diario_id: str, schema: DiarioUpdate) -> Dict[str, Any]:
        real = self._obra(obra_id)
        atual = self._diario(real, diario_id)
        self._exigir_editavel(atual)

        dados = schema.model_dump(exclude_unset=True)
        for campo in CAMPOS_OBRIGATORIOS:
            if campo in dados and dados[campo] is None:
                raise ValueError(f"O campo '{campo}' não pode ser vazio")
        if not dados:
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
        if not self.repository.deletar(diario_id, real):
            raise NaoEncontradoError("Diário não encontrado")
        self.repository.remover_arquivos(caminhos)

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
