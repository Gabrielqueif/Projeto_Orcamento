from typing import List, Optional
from fastapi import HTTPException, Depends
from schemas.schemas import EtapaCreate, EtapaUpdate
from app.dependencies import get_supabase
from datetime import datetime

TABELA_ETAPAS = "orcamento_etapas"

def criar_etapa(orcamento_id: str, etapa: EtapaCreate, supabase=Depends(get_supabase)) -> dict:
    """Cria uma nova etapa para um orçamento"""
    try:
        dados = {
            "orcamento_id": orcamento_id,
            "nome": etapa.nome,
            "ordem": etapa.ordem,
            "created_at": datetime.now().isoformat()
        }
        
        resultado = supabase.table(TABELA_ETAPAS).insert(dados).execute()
        
        if not resultado.data:
            raise HTTPException(status_code=500, detail="Erro ao criar etapa")
        
        return resultado.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar etapa: {str(e)}")

def listar_etapas(orcamento_id: str, supabase=Depends(get_supabase)) -> List[dict]:
    """Lista todas as etapas de um orçamento ordenadas"""
    try:
        resultado = supabase.table(TABELA_ETAPAS)\
            .select("*")\
            .eq("orcamento_id", orcamento_id)\
            .order("ordem")\
            .execute()
        
        return resultado.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar etapas: {str(e)}")

def deletar_etapa(etapa_id: str, orcamento_id: str, supabase=Depends(get_supabase)) -> dict:
    """Deleta uma etapa"""
    try:
        resultado = supabase.table(TABELA_ETAPAS)\
            .delete()\
            .eq("id", etapa_id)\
            .eq("orcamento_id", orcamento_id)\
            .execute()
        
        return {"message": "Etapa deletada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar etapa: {str(e)}")
