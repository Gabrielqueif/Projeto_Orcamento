from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_supabase
from schemas.schemas import OrcamentoCreate, OrcamentoUpdate, OrcamentoResponse
from datetime import datetime
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path para importar schemas
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))



TABELA_ORCAMENTOS = "orcamentos"



def criar_orcamento(orcamento: OrcamentoCreate, supabase=Depends(get_supabase)):
    """Cria um novo orçamento"""
    try:
        dados = {
            "nome": orcamento.nome,
            "cliente": orcamento.cliente,
            "data": orcamento.data.isoformat() if hasattr(orcamento.data, 'isoformat') else str(orcamento.data),
            "base_referencia": orcamento.base_referencia,
            "estado": orcamento.estado.lower(),
            "status": orcamento.status or "em_elaboracao",
            "valor_total": 0.0,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        resultado = supabase.table(TABELA_ORCAMENTOS).insert(dados).execute()
        
        if not resultado.data:
            raise HTTPException(status_code=500, detail="Erro ao criar orçamento")
        
        return resultado.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar orçamento: {str(e)}")



def listar_orcamentos(
    status: Optional[str] = None,
    cliente: Optional[str] = None,
    supabase=Depends(get_supabase)
):
    """Lista todos os orçamentos, com filtros opcionais"""
    try:
        query = supabase.table(TABELA_ORCAMENTOS).select("*")
        
        if status:
            query = query.eq("status", status)
        if cliente:
            query = query.ilike("cliente", f"%{cliente}%")
        
        query = query.order("created_at", desc=True)
        
        resultado = query.execute()
        return resultado.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar orçamentos: {str(e)}")



def buscar_orcamento(orcamento_id: str, supabase=Depends(get_supabase)):
    """Busca um orçamento específico por ID"""
    try:
        resultado = supabase.table(TABELA_ORCAMENTOS).select("*").eq("id", orcamento_id).execute()
        
        if not resultado.data:
            raise HTTPException(status_code=404, detail="Orçamento não encontrado")
        
        return resultado.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar orçamento: {str(e)}")



def atualizar_orcamento(
    orcamento_id: str,
    orcamento_update: OrcamentoUpdate,
    supabase=Depends(get_supabase)
):
    """Atualiza um orçamento existente"""
    try:
        # Verificar se o orçamento existe
        resultado_existente = supabase.table(TABELA_ORCAMENTOS).select("*").eq("id", orcamento_id).execute()
        
        if not resultado_existente.data:
            raise HTTPException(status_code=404, detail="Orçamento não encontrado")
        
        # Preparar dados para atualização
        dados_atualizacao = {}
        dados_atualizacao["updated_at"] = datetime.now().isoformat()
        
        if orcamento_update.nome is not None:
            dados_atualizacao["nome"] = orcamento_update.nome
        if orcamento_update.cliente is not None:
            dados_atualizacao["cliente"] = orcamento_update.cliente
        if orcamento_update.data is not None:
            dados_atualizacao["data"] = orcamento_update.data.isoformat() if hasattr(orcamento_update.data, 'isoformat') else str(orcamento_update.data)
        if orcamento_update.base_referencia is not None:
            dados_atualizacao["base_referencia"] = orcamento_update.base_referencia
        if orcamento_update.status is not None:
            dados_atualizacao["status"] = orcamento_update.status
        if orcamento_update.valor_total is not None:
            dados_atualizacao["valor_total"] = orcamento_update.valor_total
        
        resultado = supabase.table(TABELA_ORCAMENTOS).update(dados_atualizacao).eq("id", orcamento_id).execute()
        
        if not resultado.data:
            raise HTTPException(status_code=500, detail="Erro ao atualizar orçamento")
        
        return resultado.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar orçamento: {str(e)}")



def deletar_orcamento(orcamento_id: str, supabase=Depends(get_supabase)):
    """Deleta um orçamento e seus itens relacionados"""
    try:
        # Verificar se o orçamento existe
        resultado_existente = supabase.table(TABELA_ORCAMENTOS).select("*").eq("id", orcamento_id).execute()
        
        if not resultado_existente.data:
            raise HTTPException(status_code=404, detail="Orçamento não encontrado")
        
        # Deletar itens do orçamento primeiro (se houver constraint de foreign key)
        try:
            supabase.table("orcamento_itens").delete().eq("orcamento_id", orcamento_id).execute()
        except:
            pass  # Ignora se não houver itens ou se a tabela não existir ainda
        
        # Deletar o orçamento
        resultado = supabase.table(TABELA_ORCAMENTOS).delete().eq("id", orcamento_id).execute()
        
        return {"message": "Orçamento deletado com sucesso", "id": orcamento_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar orçamento: {str(e)}")

