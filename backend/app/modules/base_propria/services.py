import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple

from app.modules.base_propria.planilha import (
    ABA_INSUMOS,
    MAX_ARQUIVO_BYTES,
    BasePropriaExcelParser,
    gerar_modelo_xlsx,
)
from app.modules.base_propria.repositories import BasePropriaRepository
from app.modules.base_propria.schemas import (
    BaseCreate,
    BaseUpdate,
    ComposicaoCreate,
    ComposicaoUpdate,
    InsumoCreate,
    InsumoUpdate,
    ItemCreate,
    ItemUpdate,
)
from core.exceptions import ConflitoError, NaoEncontradoError

logger = logging.getLogger("projeto_orcamento")

MAX_PROFUNDIDADE = 10
TIPO_PADRAO = "Sem Desoneração"
DOIS_CENTAVOS = Decimal("0.01")
QUATRO_CASAS = Decimal("0.0001")


def _dec(valor: Any) -> Decimal:
    return Decimal(str(valor))


# --- Grafo de dependências entre composições próprias -------------------------


def alcanca(grafo: Dict[str, List[str]], origem: str, destino: str) -> bool:
    """Há caminho de `origem` até `destino`? (busca iterativa, sem recursão)"""
    visitados: Set[str] = set()
    pendentes = [origem]
    while pendentes:
        atual = pendentes.pop()
        if atual == destino:
            return True
        if atual in visitados:
            continue
        visitados.add(atual)
        pendentes.extend(grafo.get(atual, []))
    return False


def encontrar_ciclo(grafo: Dict[str, List[str]]) -> Optional[List[str]]:
    """Primeiro ciclo encontrado (lista de códigos, repetindo o primeiro no fim) ou None."""
    estado: Dict[str, int] = {}  # 1 = em visita, 2 = concluído
    for raiz in list(grafo):
        if estado.get(raiz):
            continue
        pilha: List[Tuple[str, int]] = [(raiz, 0)]
        caminho: List[str] = []
        while pilha:
            no, indice = pilha.pop()
            if indice == 0:
                estado[no] = 1
                caminho.append(no)
            filhos = grafo.get(no, [])
            if indice < len(filhos):
                pilha.append((no, indice + 1))
                filho = filhos[indice]
                if estado.get(filho) == 1:
                    return caminho[caminho.index(filho) :] + [filho]
                if not estado.get(filho):
                    pilha.append((filho, 0))
            else:
                estado[no] = 2
                caminho.pop()
    return None


def _grafo(composicoes: List[Dict[str, Any]], itens: List[Dict[str, Any]], ignorar_item: Optional[str] = None):
    codigo_por_id = {c["id"]: c["codigo"] for c in composicoes}
    grafo: Dict[str, List[str]] = {c["codigo"]: [] for c in composicoes}
    for item in itens:
        if item["id"] == ignorar_item:
            continue
        if (
            item["ref_fonte"] == "PROPRIA"
            and item["ref_tipo"] == "COMPOSICAO"
            and item["composicao_id"] in codigo_por_id
        ):
            grafo[codigo_por_id[item["composicao_id"]]].append(item["ref_codigo"])
    return grafo


# --- Cálculo de preço ----------------------------------------------------------


class _CalculoPreco:
    """Contexto de um cálculo: carrega a base uma vez e guarda em cache o que já foi resolvido."""

    def __init__(self, service: "BasePropriaService", base_id: str, uf: str, mes: str, tipo: str):
        repo = service.repo
        self.service = service
        self.uf, self.mes, self.tipo = uf, mes, tipo
        composicoes = repo.todas_composicoes(base_id)
        self.composicoes = {c["codigo"]: c for c in composicoes}
        self.insumos = {i["codigo"]: i for i in repo.todos_insumos(base_id)}
        self.itens_por_composicao: Dict[str, List[Dict[str, Any]]] = {c["id"]: [] for c in composicoes}
        for item in repo.itens_da_base([c["id"] for c in composicoes]):
            self.itens_por_composicao.setdefault(item["composicao_id"], []).append(item)
        self.precos_proprios: Dict[str, Decimal] = {}
        self.precos_oficiais: Dict[Tuple[str, str, str], Optional[float]] = {}
        self.sem_preco: Set[Tuple[str, str, str]] = set()

    def preco_composicao_propria(self, codigo: str, pilha: Tuple[str, ...] = ()) -> Decimal:
        if codigo in self.precos_proprios:
            return self.precos_proprios[codigo]
        if codigo in pilha:
            ciclo = " -> ".join(list(pilha[pilha.index(codigo) :]) + [codigo])
            raise ValueError(f"Referência circular entre composições: {ciclo}")
        if len(pilha) >= MAX_PROFUNDIDADE:
            raise ValueError(f"Composições aninhadas além do limite de {MAX_PROFUNDIDADE} níveis")
        composicao = self.composicoes.get(codigo)
        if composicao is None:
            self.sem_preco.add(("PROPRIA", "COMPOSICAO", codigo))
            return Decimal(0)
        total = Decimal(0)
        for item in self.itens_por_composicao.get(composicao["id"], []):
            preco, _ = self.preco_referencia(item, pilha + (codigo,))
            total += _dec(item["coeficiente"]) * (preco or Decimal(0))
        self.precos_proprios[codigo] = total
        return total

    def preco_referencia(
        self, item: Dict[str, Any], pilha: Tuple[str, ...] = ()
    ) -> Tuple[Optional[Decimal], Optional[Dict[str, Any]]]:
        """(preço unitário ou None se não encontrado, registro da base própria quando houver)."""
        fonte, tipo, codigo = item["ref_fonte"], item["ref_tipo"], item["ref_codigo"]
        if fonte == "PROPRIA":
            if tipo == "INSUMO":
                insumo = self.insumos.get(codigo)
                if insumo is None:
                    self.sem_preco.add((fonte, tipo, codigo))
                    return None, None
                return _dec(insumo["preco"]), insumo
            registro = self.composicoes.get(codigo)
            if registro is None:
                self.sem_preco.add((fonte, tipo, codigo))
                return None, None
            return self.preco_composicao_propria(codigo, pilha), registro

        chave = (fonte, tipo, codigo)
        if chave not in self.precos_oficiais:
            self.precos_oficiais[chave] = self.service.buscar_preco_oficial(
                fonte, tipo, codigo, self.uf, self.mes, self.tipo
            )
        preco = self.precos_oficiais[chave]
        if preco is None:
            self.sem_preco.add(chave)
            return None, None
        return _dec(preco), None


class BasePropriaService:
    def __init__(self, repository: BasePropriaRepository, item_repository):
        self.repo = repository
        self.item_repo = item_repository

    # --- Bases ---------------------------------------------------------------

    def listar_bases(self, user_id: str) -> List[Dict[str, Any]]:
        return self.repo.listar_bases(user_id)

    def obter_base(self, base_id: str, user_id: str) -> Dict[str, Any]:
        base = self.repo.buscar_base(base_id, user_id)
        if not base:
            raise NaoEncontradoError("Base não encontrada")
        return base

    def criar_base(self, user_id: str, dados: BaseCreate) -> Dict[str, Any]:
        registro = dados.model_dump(mode="json")
        registro["user_id"] = user_id
        return self.repo.criar_base(registro)

    def atualizar_base(self, base_id: str, user_id: str, dados: BaseUpdate) -> Dict[str, Any]:
        campos = dados.model_dump(mode="json", exclude_unset=True)
        if not campos:
            return self.obter_base(base_id, user_id)
        if "nome" in campos and not (campos["nome"] or "").strip():
            raise ValueError("O nome da base não pode ser vazio")
        base = self.repo.atualizar_base(base_id, user_id, campos)
        if not base:
            raise NaoEncontradoError("Base não encontrada")
        return base

    def deletar_base(self, base_id: str, user_id: str) -> None:
        self.obter_base(base_id, user_id)
        self.repo.deletar_base(base_id, user_id)

    def duplicar_base(self, base_id: str, user_id: str, nome: Optional[str]) -> Dict[str, Any]:
        origem = self.obter_base(base_id, user_id)
        nova = self.repo.criar_base(
            {
                "user_id": user_id,
                "nome": nome or f"{origem['nome']} (cópia)"[:150],
                "descricao": origem.get("descricao"),
                "uf": origem.get("uf"),
                "data_referencia": origem.get("data_referencia"),
            }
        )
        try:
            self._copiar_conteudo(base_id, nova["id"])
        except Exception:
            # sem transação no cliente: remove a cópia parcial (as filhas saem em cascata)
            self.repo.deletar_base(nova["id"], user_id)
            raise
        return nova

    def _copiar_conteudo(self, origem_id: str, destino_id: str) -> None:
        insumos = [
            {**{k: v for k, v in i.items() if k not in ("id", "base_id")}, "base_id": destino_id}
            for i in self.repo.todos_insumos(origem_id)
        ]
        self.repo.upsert_insumos(insumos)

        composicoes = self.repo.todas_composicoes(origem_id)
        novas = self.repo.upsert_composicoes(
            [{**{k: v for k, v in c.items() if k not in ("id", "base_id")}, "base_id": destino_id} for c in composicoes]
        )
        novo_id = {c["codigo"]: c["id"] for c in novas}
        codigo_antigo = {c["id"]: c["codigo"] for c in composicoes}
        itens = [
            {
                "composicao_id": novo_id[codigo_antigo[i["composicao_id"]]],
                "ref_fonte": i["ref_fonte"],
                "ref_tipo": i["ref_tipo"],
                "ref_codigo": i["ref_codigo"],
                "coeficiente": i["coeficiente"],
            }
            for i in self.repo.itens_da_base([c["id"] for c in composicoes])
        ]
        self.repo.criar_itens(itens)

    # --- Insumos -------------------------------------------------------------

    def listar_insumos(self, base_id: str, busca: Optional[str], limite: int, offset: int) -> List[Dict[str, Any]]:
        return self.repo.listar_insumos(base_id, busca, limite, offset)

    def obter_insumo(self, base_id: str, insumo_id: str) -> Dict[str, Any]:
        insumo = self.repo.buscar_insumo(base_id, insumo_id)
        if not insumo:
            raise NaoEncontradoError("Insumo não encontrado")
        return insumo

    def criar_insumo(self, base_id: str, dados: InsumoCreate) -> Dict[str, Any]:
        if self.repo.buscar_insumo_por_codigo(base_id, dados.codigo):
            raise ConflitoError(f"Já existe um insumo com o código '{dados.codigo}' nesta base")
        return self.repo.criar_insumo({**dados.model_dump(), "base_id": base_id})

    def atualizar_insumo(self, base_id: str, insumo_id: str, dados: InsumoUpdate) -> Dict[str, Any]:
        campos = dados.model_dump(exclude_unset=True, exclude_none=True)
        if not campos:
            return self.obter_insumo(base_id, insumo_id)
        insumo = self.repo.atualizar_insumo(base_id, insumo_id, campos)
        if not insumo:
            raise NaoEncontradoError("Insumo não encontrado")
        return insumo

    def deletar_insumo(self, base_id: str, insumo_id: str) -> None:
        insumo = self.obter_insumo(base_id, insumo_id)
        if self._referencias_proprias(base_id, "INSUMO", insumo["codigo"]):
            raise ConflitoError("O insumo é usado por composições desta base; remova-o delas antes de excluir")
        self.repo.deletar_insumo(base_id, insumo_id)

    def _referencias_proprias(self, base_id: str, ref_tipo: str, codigo: str) -> bool:
        composicoes = self.repo.todas_composicoes(base_id)
        itens = self.repo.itens_da_base([c["id"] for c in composicoes])
        return any(
            i["ref_fonte"] == "PROPRIA" and i["ref_tipo"] == ref_tipo and i["ref_codigo"] == codigo for i in itens
        )

    # --- Composições ---------------------------------------------------------

    def listar_composicoes(self, base_id: str, busca: Optional[str], limite: int, offset: int) -> List[Dict[str, Any]]:
        return self.repo.listar_composicoes(base_id, busca, limite, offset)

    def obter_composicao(self, base_id: str, composicao_id: str) -> Dict[str, Any]:
        composicao = self.repo.buscar_composicao(base_id, composicao_id)
        if not composicao:
            raise NaoEncontradoError("Composição não encontrada")
        return composicao

    def obter_composicao_detalhada(self, base_id: str, composicao_id: str) -> Dict[str, Any]:
        composicao = self.obter_composicao(base_id, composicao_id)
        return {**composicao, "itens": self.repo.listar_itens(composicao_id)}

    def criar_composicao(self, base_id: str, dados: ComposicaoCreate) -> Dict[str, Any]:
        if self.repo.buscar_composicao_por_codigo(base_id, dados.codigo):
            raise ConflitoError(f"Já existe uma composição com o código '{dados.codigo}' nesta base")
        for item in dados.itens:
            self._validar_referencia(base_id, None, item.ref_fonte, item.ref_tipo, item.ref_codigo)
        composicao = self.repo.criar_composicao(
            {**dados.model_dump(exclude={"itens"}), "base_id": base_id},
        )
        itens = self.repo.criar_itens(
            [{**item.model_dump(), "composicao_id": composicao["id"]} for item in dados.itens]
        )
        return {**composicao, "itens": itens}

    def atualizar_composicao(self, base_id: str, composicao_id: str, dados: ComposicaoUpdate) -> Dict[str, Any]:
        campos = dados.model_dump(exclude_unset=True, exclude_none=True)
        if not campos:
            return self.obter_composicao(base_id, composicao_id)
        composicao = self.repo.atualizar_composicao(base_id, composicao_id, campos)
        if not composicao:
            raise NaoEncontradoError("Composição não encontrada")
        return composicao

    def deletar_composicao(self, base_id: str, composicao_id: str) -> None:
        composicao = self.obter_composicao(base_id, composicao_id)
        if self._referencias_proprias(base_id, "COMPOSICAO", composicao["codigo"]):
            raise ConflitoError("A composição é usada por outras composições desta base; remova-a delas antes")
        self.repo.deletar_composicao(base_id, composicao_id)

    # --- Itens ---------------------------------------------------------------

    def adicionar_item(self, base_id: str, composicao_id: str, dados: ItemCreate) -> Dict[str, Any]:
        composicao = self.obter_composicao(base_id, composicao_id)
        self._validar_referencia(base_id, composicao, dados.ref_fonte, dados.ref_tipo, dados.ref_codigo)
        return self.repo.criar_itens([{**dados.model_dump(), "composicao_id": composicao_id}])[0]

    def atualizar_item(self, base_id: str, composicao_id: str, item_id: str, dados: ItemUpdate) -> Dict[str, Any]:
        composicao = self.obter_composicao(base_id, composicao_id)
        atual = self.repo.buscar_item(composicao_id, item_id)
        if not atual:
            raise NaoEncontradoError("Item não encontrado")
        campos = dados.model_dump(exclude_unset=True, exclude_none=True)
        if not campos:
            return atual
        final = {**atual, **campos}
        self._validar_referencia(
            base_id, composicao, final["ref_fonte"], final["ref_tipo"], final["ref_codigo"], ignorar_item=item_id
        )
        item = self.repo.atualizar_item(composicao_id, item_id, campos)
        if not item:
            raise NaoEncontradoError("Item não encontrado")
        return item

    def remover_item(self, base_id: str, composicao_id: str, item_id: str) -> None:
        self.obter_composicao(base_id, composicao_id)
        if not self.repo.buscar_item(composicao_id, item_id):
            raise NaoEncontradoError("Item não encontrado")
        self.repo.deletar_item(composicao_id, item_id)

    def _validar_referencia(
        self,
        base_id: str,
        composicao: Optional[Dict[str, Any]],
        ref_fonte: str,
        ref_tipo: str,
        ref_codigo: str,
        ignorar_item: Optional[str] = None,
    ) -> None:
        """Referências próprias precisam existir na base e não podem fechar um ciclo. As oficiais não são validadas aqui."""
        if ref_fonte != "PROPRIA":
            return
        if ref_tipo == "INSUMO":
            if not self.repo.buscar_insumo_por_codigo(base_id, ref_codigo):
                raise ValueError(f"Insumo próprio '{ref_codigo}' não existe nesta base")
            return
        alvo = self.repo.buscar_composicao_por_codigo(base_id, ref_codigo)
        if not alvo:
            raise ValueError(f"Composição própria '{ref_codigo}' não existe nesta base")
        if composicao is None:
            return
        if alvo["id"] == composicao["id"]:
            raise ValueError("Uma composição não pode conter a si mesma")
        composicoes = self.repo.todas_composicoes(base_id)
        itens = self.repo.itens_da_base([c["id"] for c in composicoes])
        grafo = _grafo(composicoes, itens, ignorar_item)
        if alcanca(grafo, alvo["codigo"], composicao["codigo"]):
            raise ValueError(
                f"Referência circular: '{ref_codigo}' já depende de '{composicao['codigo']}', "
                "então não pode ser usada nela"
            )

    # --- Preço ---------------------------------------------------------------

    def buscar_preco_oficial(
        self, fonte: str, ref_tipo: str, codigo: str, uf: str, mes: str, tipo: str
    ) -> Optional[float]:
        if ref_tipo == "COMPOSICAO":
            return self.item_repo.buscar_preco(codigo, uf, mes, tipo, fonte)
        return self.repo.buscar_preco_insumo_oficial(codigo, uf, mes, tipo, fonte)

    def calcular_preco(
        self, base_id: str, composicao_id: str, uf: str, mes: str, tipo: Optional[str] = None
    ) -> Dict[str, Any]:
        composicao = self.obter_composicao(base_id, composicao_id)
        uf = uf.upper()
        tipo = tipo or TIPO_PADRAO
        calculo = _CalculoPreco(self, base_id, uf, mes, tipo)

        itens = []
        total = Decimal(0)
        for item in calculo.itens_por_composicao.get(composicao["id"], []):
            preco, registro = calculo.preco_referencia(item, (composicao["codigo"],))
            coeficiente = _dec(item["coeficiente"])
            subtotal = coeficiente * (preco or Decimal(0))
            total += subtotal
            itens.append(
                {
                    "ref_fonte": item["ref_fonte"],
                    "ref_tipo": item["ref_tipo"],
                    "ref_codigo": item["ref_codigo"],
                    "descricao": registro["descricao"] if registro else None,
                    "unidade": registro["unidade"] if registro else None,
                    "coeficiente": float(coeficiente),
                    "preco_unitario": float(preco.quantize(QUATRO_CASAS)) if preco is not None else None,
                    "subtotal": float(subtotal.quantize(QUATRO_CASAS)),
                    "encontrado": preco is not None,
                }
            )
        return {
            "composicao_id": composicao["id"],
            "codigo": composicao["codigo"],
            "uf": uf,
            "mes": mes,
            "tipo": tipo,
            "preco_total": float(total.quantize(DOIS_CENTAVOS)),
            "itens": itens,
            "itens_sem_preco": len(calculo.sem_preco),
        }

    # --- Importação ----------------------------------------------------------

    def modelo_importacao(self) -> bytes:
        return gerar_modelo_xlsx()

    def importar(self, base_id: str, conteudo: bytes) -> Dict[str, int]:
        if len(conteudo) > MAX_ARQUIVO_BYTES:
            raise ValueError(f"Arquivo maior que {MAX_ARQUIVO_BYTES // (1024 * 1024)}MB")
        if not conteudo.startswith(b"PK"):
            raise ValueError("Envie uma planilha .xlsx válida")
        try:
            parser = BasePropriaExcelParser(conteudo)
        except Exception as e:
            logger.warning(f"[base_propria] Planilha ilegível: {e}")
            raise ValueError("Não foi possível ler a planilha .xlsx")

        abas = parser.identificar_abas_dados()
        if not abas:
            raise ValueError("A planilha precisa ter as abas 'Insumos' e/ou 'Composições'")

        insumos: List[Dict[str, Any]] = []
        composicoes: List[Dict[str, Any]] = []
        itens: List[Dict[str, Any]] = []
        for aba in abas:
            principais, secundarios = parser.extrair_registros_aba(aba)
            if aba.strip().lower() == ABA_INSUMOS.lower():
                insumos = principais
            else:
                composicoes, itens = principais, secundarios

        erros = list(parser.erros)
        erros += self._validar_importacao(base_id, insumos, composicoes, itens)
        if erros:
            resto = f" (+{len(erros) - 20} erros)" if len(erros) > 20 else ""
            raise ValueError("Importação rejeitada, nada foi gravado: " + "; ".join(erros[:20]) + resto)

        self.repo.upsert_insumos([{**i, "base_id": base_id} for i in insumos])
        salvas = self.repo.upsert_composicoes([{**c, "base_id": base_id} for c in composicoes])
        id_por_codigo = {c["codigo"]: c["id"] for c in salvas}
        self.repo.deletar_itens_das_composicoes(list(id_por_codigo.values()))
        self.repo.criar_itens(
            [
                {
                    "composicao_id": id_por_codigo[i["composicao_codigo"]],
                    "ref_fonte": i["ref_fonte"],
                    "ref_tipo": i["ref_tipo"],
                    "ref_codigo": i["ref_codigo"],
                    "coeficiente": i["coeficiente"],
                }
                for i in itens
            ]
        )
        return {
            "insumos_importados": len(insumos),
            "composicoes_importadas": len(composicoes),
            "itens_importados": len(itens),
        }

    def _validar_importacao(
        self,
        base_id: str,
        insumos: List[Dict[str, Any]],
        composicoes: List[Dict[str, Any]],
        itens: List[Dict[str, Any]],
    ) -> List[str]:
        existentes = self.repo.todas_composicoes(base_id)
        codigos_insumo = {i["codigo"] for i in self.repo.todos_insumos(base_id)} | {i["codigo"] for i in insumos}
        codigos_composicao = {c["codigo"] for c in existentes} | {c["codigo"] for c in composicoes}

        erros = []
        for item in itens:
            if item["ref_fonte"] != "PROPRIA":
                continue
            conhecidos = codigos_insumo if item["ref_tipo"] == "INSUMO" else codigos_composicao
            if item["ref_codigo"] not in conhecidos:
                erros.append(
                    f"composição '{item['composicao_codigo']}' usa {item['ref_tipo'].lower()} próprio "
                    f"'{item['ref_codigo']}' que não existe"
                )

        # Composições do arquivo substituem os itens que já tinham; as demais mantêm os atuais.
        substituidas = {c["codigo"] for c in composicoes}
        antigos = [
            i
            for i in self.repo.itens_da_base([c["id"] for c in existentes])
            if next((c["codigo"] for c in existentes if c["id"] == i["composicao_id"]), None) not in substituidas
        ]
        grafo = _grafo(existentes, antigos)
        for item in itens:
            if item["ref_fonte"] == "PROPRIA" and item["ref_tipo"] == "COMPOSICAO":
                grafo.setdefault(item["composicao_codigo"], []).append(item["ref_codigo"])
        ciclo = encontrar_ciclo(grafo)
        if ciclo:
            erros.append("referência circular entre composições: " + " -> ".join(ciclo))
        return erros
