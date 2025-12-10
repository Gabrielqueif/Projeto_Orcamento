from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_supabase

router = APIRouter(prefix="/teste", tags=["Teste - Conexão Supabase"])

# Nome da tabela de teste no Supabase
TABELA_TESTE = "teste"


# Schema para validação dos dados de entrada
class TesteCreate(BaseModel):
    nome: str
    escolaridade: str


class TesteResponse(BaseModel):
    id: Any
    nome: str
    escolaridade: str


@router.post("/", summary="Criar um registro de teste no Supabase")
def criar_teste(dados: TesteCreate, supabase=Depends(get_supabase)) -> Dict[str, Any]:
    """
    Cria um novo registro na tabela de teste do Supabase.
    
    - **nome**: Nome da pessoa (text)
    - **escolaridade**: Nível de escolaridade (text)
    """
    try:
        resposta = (
            supabase.table(TABELA_TESTE)
            .insert({"nome": dados.nome, "escolaridade": dados.escolaridade})
            .execute()
        )

        if not resposta.data:
            raise HTTPException(status_code=500, detail="Nenhum dado retornado após inserção")

        return {
            "status": "ok",
            "mensagem": "Registro criado com sucesso",
            "dados": resposta.data[0],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar registro: {str(e)}")


@router.get("/", summary="Listar todos os registros de teste")
def listar_testes(supabase=Depends(get_supabase)) -> List[Dict[str, Any]]:
    """
    Lista todos os registros da tabela de teste no Supabase.
    """
    try:
        resposta = supabase.table(TABELA_TESTE).select("*").execute()
        return resposta.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar registros: {str(e)}")


@router.get("/{id}", summary="Buscar um registro de teste por ID")
def buscar_teste(id: str, supabase=Depends(get_supabase)) -> Dict[str, Any]:
    """
    Busca um registro específico da tabela de teste pelo ID.
    """
    try:
        resposta = (
            supabase.table(TABELA_TESTE)
            .select("*")
            .eq("id", id)
            .execute()
        )

        if not resposta.data:
            raise HTTPException(status_code=404, detail="Registro não encontrado")

        return resposta.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar registro: {str(e)}")


@router.delete("/{id}", summary="Deletar um registro de teste por ID")
def deletar_teste(id: str, supabase=Depends(get_supabase)) -> Dict[str, str]:
    """
    Deleta um registro específico da tabela de teste pelo ID.
    """
    try:
        resposta = (
            supabase.table(TABELA_TESTE)
            .delete()
            .eq("id", id)
            .execute()
        )

        return {
            "status": "ok",
            "mensagem": f"Registro {id} deletado com sucesso",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar registro: {str(e)}")

