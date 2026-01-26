from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_supabase
from schemas.schemas import OrcamentoItemCreate, OrcamentoItemUpdate, OrcamentoItemResponse
from datetime import datetime



TABELA_ORCAMENTOS = "orcamentos"
TABELA_ORCAMENTO_ITENS = "orcamento_itens"
TABELA_COMPOSICOES = "composicao"
TABELA_COMPOSICOES_ESTADOS = "composicao_estados"


def buscar_preco_composicao(codigo_composicao: str, estado: str, supabase) -> Optional[float]:
    """Busca o preço de uma composição para um estado específico"""
    try:
        # Normalizar estado para minúsculas
        estado_lower = estado.lower()
        
        # Buscar preço na tabela de estados
        resultado = supabase.table(TABELA_COMPOSICOES_ESTADOS).select("*").eq("codigo_composicao", codigo_composicao).execute()
        
        if not resultado.data or len(resultado.data) == 0:
            return None
        
        # Pegar o primeiro registro (deve ter apenas um por código)
        preco_data = resultado.data[0]
        
        # Buscar o preço do estado específico
        preco = preco_data.get(estado_lower)
        
        if preco is None:
            return None
        
        return float(preco) if preco else None
    except Exception as e:
        print(f"Erro ao buscar preço: {str(e)}")
        return None


def atualizar_valor_total_orcamento(orcamento_id: str, supabase):
    """Recalcula e atualiza o valor total do orçamento"""
    try:
        # Buscar todos os itens do orçamento
        resultado_itens = supabase.table(TABELA_ORCAMENTO_ITENS).select("preco_total").eq("orcamento_id", orcamento_id).execute()
        
        valor_total = 0.0
        if resultado_itens.data:
            for item in resultado_itens.data:
                preco = item.get("preco_total")
                if preco:
                    valor_total += float(preco)
        
        # Atualizar o valor total do orçamento
        supabase.table(TABELA_ORCAMENTOS).update({
            "valor_total": valor_total,
            "updated_at": datetime.now().isoformat()
        }).eq("id", orcamento_id).execute()
        
        return valor_total
    except Exception as e:
        print(f"Erro ao atualizar valor total: {str(e)}")
        return None



def adicionar_item(
    orcamento_id: str,
    item: OrcamentoItemCreate,
    supabase=Depends(get_supabase)
):
    """Adiciona um novo item ao orçamento"""
    try:
        # Verificar se o orçamento existe
        resultado_orcamento = supabase.table(TABELA_ORCAMENTOS).select("*").eq("id", orcamento_id).execute()
        if not resultado_orcamento.data:
            raise HTTPException(status_code=404, detail="Orçamento não encontrado")
        
        orcamento = resultado_orcamento.data[0]
        
        # Usar estado do orçamento se não foi fornecido no item
        estado_para_buscar = item.estado or orcamento.get("estado")
        if not estado_para_buscar:
            raise HTTPException(status_code=400, detail="Estado não definido no orçamento")
        
        # Verificar se a composição existe
        resultado_composicao = supabase.table(TABELA_COMPOSICOES).select("*").eq("codigo_composicao", item.codigo_composicao).execute()
        if not resultado_composicao.data:
            raise HTTPException(status_code=404, detail="Composição não encontrada")
        
        composicao = resultado_composicao.data[0]
        
        # Buscar preço da composição para o estado informado
        preco_unitario = buscar_preco_composicao(item.codigo_composicao, estado_para_buscar, supabase)
        
        if preco_unitario is None:
            raise HTTPException(
                status_code=400, 
                detail=f"Preço não encontrado para a composição {item.codigo_composicao} no estado {estado_para_buscar}"
            )
        
        # Validar quantidade
        if item.quantidade <= 0:
            raise HTTPException(status_code=400, detail="Quantidade deve ser maior que zero")
        
        # Calcular preço total
        preco_total = item.quantidade * preco_unitario
        
        # Usar descrição da composição se não foi fornecida
        descricao = item.descricao or composicao.get("descricao", "")
        unidade = item.unidade or composicao.get("unidade", "")
        
        # Criar o item
        dados_item = {
            "orcamento_id": orcamento_id,
            "codigo_composicao": item.codigo_composicao,
            "descricao": descricao,
            "quantidade": item.quantidade,
            "unidade": unidade,
            "preco_unitario": preco_unitario,
            "preco_total": preco_total,
            "estado": estado_para_buscar.lower(),
            "etapa_id": item.etapa_id,
            "memoria_calculo": item.memoria_calculo,
            "variaveis": item.variaveis,
            "created_at": datetime.now().isoformat()
        }
        
        resultado = supabase.table(TABELA_ORCAMENTO_ITENS).insert(dados_item).execute()
        
        if not resultado.data:
            raise HTTPException(status_code=500, detail="Erro ao adicionar item")
        
        # Atualizar valor total do orçamento
        atualizar_valor_total_orcamento(orcamento_id, supabase)
        
        return resultado.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar item: {str(e)}")



def listar_itens(orcamento_id: str, supabase=Depends(get_supabase)):
    """Lista todos os itens de um orçamento"""
    try:
        # Verificar se o orçamento existe
        resultado_orcamento = supabase.table(TABELA_ORCAMENTOS).select("*").eq("id", orcamento_id).execute()
        if not resultado_orcamento.data:
            raise HTTPException(status_code=404, detail="Orçamento não encontrado")
        
        resultado = supabase.table(TABELA_ORCAMENTO_ITENS).select("*").eq("orcamento_id", orcamento_id).order("created_at").execute()
        
        return resultado.data or []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar itens: {str(e)}")



def atualizar_item(
    orcamento_id: str,
    item_id: str,
    item_update: OrcamentoItemUpdate,
    supabase=Depends(get_supabase)
):
    """Atualiza um item do orçamento"""
    try:
        # Verificar se o item existe
        resultado_existente = supabase.table(TABELA_ORCAMENTO_ITENS).select("*").eq("id", item_id).eq("orcamento_id", orcamento_id).execute()
        
        if not resultado_existente.data:
            raise HTTPException(status_code=404, detail="Item não encontrado")
        
        item_atual = resultado_existente.data[0]
        
        # Preparar dados para atualização
        dados_atualizacao = {}
        codigo_composicao = item_update.codigo_composicao or item_atual.get("codigo_composicao")
        estado = item_update.estado or item_atual.get("estado")
        quantidade = item_update.quantidade if item_update.quantidade is not None else item_atual.get("quantidade")
        
        # Se código ou estado mudaram, buscar novo preço
        if item_update.codigo_composicao is not None or item_update.estado is not None:
            preco_unitario = buscar_preco_composicao(codigo_composicao, estado, supabase)
            if preco_unitario is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Preço não encontrado para a composição {codigo_composicao} no estado {estado}"
                )
            dados_atualizacao["preco_unitario"] = preco_unitario
            dados_atualizacao["codigo_composicao"] = codigo_composicao
            dados_atualizacao["estado"] = estado.lower()
        else:
            preco_unitario = item_atual.get("preco_unitario")
        
        # Se quantidade mudou, recalcular preço total
        if item_update.quantidade is not None:
            if quantidade <= 0:
                raise HTTPException(status_code=400, detail="Quantidade deve ser maior que zero")
            dados_atualizacao["quantidade"] = quantidade
            dados_atualizacao["preco_total"] = quantidade * (preco_unitario or item_atual.get("preco_unitario", 0))
        
        if item_update.descricao is not None:
            dados_atualizacao["descricao"] = item_update.descricao
        if item_update.unidade is not None:
            dados_atualizacao["unidade"] = item_update.unidade
        if item_update.etapa_id is not None:
            dados_atualizacao["etapa_id"] = item_update.etapa_id
        if item_update.memoria_calculo is not None:
            dados_atualizacao["memoria_calculo"] = item_update.memoria_calculo
        if item_update.variaveis is not None:
            dados_atualizacao["variaveis"] = item_update.variaveis
        
        if not dados_atualizacao:
            # Se não há nada para atualizar, retornar o item atual
            return item_atual
        
        resultado = supabase.table(TABELA_ORCAMENTO_ITENS).update(dados_atualizacao).eq("id", item_id).execute()
        
        if not resultado.data:
            raise HTTPException(status_code=500, detail="Erro ao atualizar item")
        
        # Atualizar valor total do orçamento
        atualizar_valor_total_orcamento(orcamento_id, supabase)
        
        return resultado.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar item: {str(e)}")



def remover_item(orcamento_id: str,
                 item_id: str,
                 supabase=Depends(get_supabase)):
    """Remove um item do orçamento"""
    try:
        # Verificar se o item existe
        resultado_existente = supabase.table(TABELA_ORCAMENTO_ITENS).select("*").eq("id", item_id).eq("orcamento_id", orcamento_id).execute()
        
        if not resultado_existente.data:
            raise HTTPException(status_code=404, detail="Item não encontrado")
        
        # Deletar o item
        resultado = supabase.table(TABELA_ORCAMENTO_ITENS).delete().eq("id", item_id).execute()
        
        # Atualizar valor total do orçamento
        atualizar_valor_total_orcamento(orcamento_id, supabase)
        
        return {"message": "Item removido com sucesso", "id": item_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover item: {str(e)}")

