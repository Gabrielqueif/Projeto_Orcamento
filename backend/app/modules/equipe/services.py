import logging
import random
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from app.modules.equipe.repositories import CargoRepository, EquipeRepository, MembroEquipeRepository
from app.modules.equipe.schemas import (
    CargoCreate,
    CargoUpdate,
    EquipeCreate,
    EquipeUpdate,
    MembroEquipeCreate,
    MembroEquipeUpdate,
)
from core.exceptions import ConflitoError, NaoEncontradoError

logger = logging.getLogger("projeto_orcamento")


class EquipeService:
    def __init__(self, repository: EquipeRepository):
        self.repository = repository

    def criar_equipe(self, equipe: EquipeCreate, user_id: str):
        dados = {
            "nome": equipe.nome,
            "descricao": equipe.descricao,
        }
        return self.repository.criar(dados, user_id)

    def listar_equipes(self, user_id: str, nome: Optional[str] = None):
        return self.repository.listar(user_id, nome)

    def buscar_equipe(self, equipe_id: str, user_id: str):
        equipe = self.repository.buscar_por_id(equipe_id, user_id)
        if not equipe:
            raise NaoEncontradoError("Equipe não encontrada")
        return equipe

    def atualizar_equipe(self, equipe_id: str, equipe_update: EquipeUpdate, user_id: str):
        existente = self.repository.buscar_por_id(equipe_id, user_id)
        if not existente:
            raise NaoEncontradoError("Equipe não encontrada")

        dados_atualizacao = {}
        if equipe_update.nome is not None:
            dados_atualizacao["nome"] = equipe_update.nome
        if equipe_update.descricao is not None:
            dados_atualizacao["descricao"] = equipe_update.descricao

        return self.repository.atualizar(equipe_id, dados_atualizacao, user_id)

    def deletar_equipe(self, equipe_id: str, user_id: str):
        existente = self.repository.buscar_por_id(equipe_id, user_id)
        if not existente:
            raise NaoEncontradoError("Equipe não encontrada")
        return self.repository.deletar(equipe_id, user_id)


class CargoService:
    def __init__(self, repository: CargoRepository):
        self.repository = repository

    def _proprio(self, cargo_id: str, user_id: str) -> Dict[str, Any]:
        cargo = self.repository.buscar_por_id(cargo_id, user_id)
        if not cargo:
            raise NaoEncontradoError("Cargo não encontrado")
        if cargo["user_id"] is None:
            raise ConflitoError("Cargos pré-montados não podem ser alterados; crie um cargo próprio.")
        return cargo

    def _nome_livre(self, nome: str, user_id: str, ignorar_id: Optional[str] = None):
        usados = {c["nome"].lower() for c in self.repository.listar(user_id) if c["id"] != ignorar_id}
        if nome.strip().lower() in usados:
            raise ConflitoError(f"Já existe um cargo chamado '{nome}'")

    def listar_cargos(self, user_id: str):
        return self.repository.listar(user_id)

    def criar_cargo(self, cargo: CargoCreate, user_id: str):
        self._nome_livre(cargo.nome, user_id)
        return self.repository.criar(cargo.model_dump(mode="json"), user_id)

    def atualizar_cargo(self, cargo_id: str, cargo: CargoUpdate, user_id: str):
        self._proprio(cargo_id, user_id)
        dados = cargo.model_dump(mode="json", exclude_unset=True)
        if dados.get("nome"):
            self._nome_livre(dados["nome"], user_id, ignorar_id=cargo_id)
        return self.repository.atualizar(cargo_id, dados, user_id)

    def deletar_cargo(self, cargo_id: str, user_id: str):
        self._proprio(cargo_id, user_id)
        return self.repository.deletar(cargo_id, user_id)


# Campos-base que um cargo pode dispensar; os demais (nome, cargo) são sempre exigidos.
CAMPOS_BASE_OBRIGATORIOS = ("cpf", "data_inicio", "remuneracao")


def _valida_tipo(rotulo: str, tipo: str, valor: Any) -> Any:
    try:
        if tipo == "numero":
            return float(valor)
        if tipo == "data":
            return date.fromisoformat(str(valor)).isoformat()
    except ValueError:
        raise ValueError(f"Valor inválido para '{rotulo}'")
    return str(valor)


class MembroEquipeService:
    def __init__(self, repository: MembroEquipeRepository, cargo_repository: Optional[CargoRepository] = None):
        self.repository = repository
        self.cargo_repository = cargo_repository

    def _aplicar_cargo(self, dados: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Ajusta `dados` às regras do cargo: zera campos ocultos, exige os demais e valida os extras."""
        if not dados.get("cargo_id"):
            if not dados.get("cargo"):
                raise ValueError("Informe o cargo")
            faltando = [c for c in CAMPOS_BASE_OBRIGATORIOS if dados.get(c) in (None, "")]
            if faltando:
                raise ValueError(f"Campos obrigatórios ausentes: {', '.join(faltando)}")
            return dados

        cargo = self.cargo_repository.buscar_por_id(dados["cargo_id"], user_id) if self.cargo_repository else None
        if not cargo:
            raise NaoEncontradoError("Cargo não encontrado")

        dados["cargo"] = cargo["nome"]
        for campo in cargo["campos_ocultos"]:
            dados[campo] = None
        faltando = [
            c for c in CAMPOS_BASE_OBRIGATORIOS if c not in cargo["campos_ocultos"] and dados.get(c) in (None, "")
        ]
        if faltando:
            raise ValueError(f"Campos obrigatórios ausentes: {', '.join(faltando)}")

        recebidos = dados.get("dados_extras") or {}
        extras = {}
        for campo in cargo["campos_extras"]:
            valor = recebidos.get(campo["chave"])
            if valor in (None, ""):
                if campo["obrigatorio"]:
                    raise ValueError(f"Campo obrigatório ausente: {campo['rotulo']}")
                continue
            extras[campo["chave"]] = _valida_tipo(campo["rotulo"], campo["tipo"], valor)
        dados["dados_extras"] = extras
        return dados

    def _gerar_codigo_unico(self, user_id: str) -> str:
        for _ in range(10):
            codigo = f"#GP-0{random.randint(100, 999)}"
            membros = self.repository.listar(user_id=user_id)
            codigos_existentes = {m.get("code") for m in membros}
            if codigo not in codigos_existentes:
                return codigo
        return f"#GP-0{random.randint(1000, 9999)}"

    def criar_membro(self, membro: MembroEquipeCreate, user_id: str):
        dados = self._aplicar_cargo(membro.model_dump(mode="json"), user_id)
        if dados.get("cpf"):
            dados["cpf"] = dados["cpf"].strip()
        dados["status"] = dados.get("status") or "ATIVO"
        dados["code"] = self._gerar_codigo_unico(user_id)
        dados["created_at"] = dados["updated_at"] = datetime.now().isoformat()
        return self.repository.criar(dados, user_id)

    def listar_membros(
        self,
        user_id: str,
        nome: Optional[str] = None,
        cargo: Optional[str] = None,
        status: Optional[str] = None,
        orcamento_id: Optional[str] = None,
        equipe_id: Optional[str] = None,
    ):
        return self.repository.listar(user_id, nome, cargo, status, orcamento_id, equipe_id)

    def buscar_membro(self, membro_id: str, user_id: str):
        membro = self.repository.buscar_por_id(membro_id, user_id)
        if not membro:
            raise NaoEncontradoError("Membro da equipe não encontrado")
        return membro

    def atualizar_membro(self, membro_id: str, membro_update: MembroEquipeUpdate, user_id: str):
        existente = self.repository.buscar_por_id(membro_id, user_id)
        if not existente:
            raise NaoEncontradoError("Membro da equipe não encontrado")

        dados_atualizacao = membro_update.model_dump(mode="json", exclude_none=True)
        # Só revalida contra o cargo quando a edição mexe nele; trocar o status não deve falhar por regra nova.
        if "cargo_id" in dados_atualizacao or "dados_extras" in dados_atualizacao:
            final = self._aplicar_cargo({**existente, **dados_atualizacao}, user_id)
            for campo in ("cargo", "cargo_id", "cpf", "data_inicio", "remuneracao", "descricao", "dados_extras"):
                dados_atualizacao[campo] = final.get(campo)
        dados_atualizacao["updated_at"] = datetime.now().isoformat()

        return self.repository.atualizar(membro_id, dados_atualizacao, user_id)

    def deletar_membro(self, membro_id: str, user_id: str):
        existente = self.repository.buscar_por_id(membro_id, user_id)
        if not existente:
            raise NaoEncontradoError("Membro da equipe não encontrado")
        return self.repository.deletar(membro_id, user_id)

    def alocar_membros(self, membro_ids: List[str], orcamento_id: Optional[str], user_id: str):
        orc_id = str(orcamento_id) if orcamento_id else None
        return self.repository.alocar_ao_orcamento(membro_ids, orc_id, user_id)
