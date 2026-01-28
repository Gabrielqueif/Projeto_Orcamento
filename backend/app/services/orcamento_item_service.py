from datetime import datetime
from typing import List, Optional
from app.repositories.orcamento_item_repository import OrcamentoItemRepository
from app.repositories.orcamento_repository import OrcamentoRepository
from app.repositories.item_repository import ItemRepository
from schemas.schemas import OrcamentoItemCreate, OrcamentoItemUpdate

class OrcamentoItemService:
    def __init__(self, 
                 repository: OrcamentoItemRepository,
                 orcamento_repository: OrcamentoRepository,
                 item_repository: ItemRepository):
        self.repository = repository
        self.orcamento_repository = orcamento_repository
        self.item_repository = item_repository

    def _buscar_preco_composicao(self, codigo_composicao: str, estado: str) -> Optional[float]:
        # Busca o preço de uma composição para um estado específico
        # Usando listar_estados_por_item do ItemRepository
        estados = self.item_repository.listar_estados_por_item(codigo_composicao)
        if not estados:
            return None
            
        dados = estados[0]
        preco = dados.get(estado.lower())
        return float(preco) if preco else None

    def _atualizar_valor_total_orcamento(self, orcamento_id: str):
        valor_total = self.repository.calcular_total_itens(orcamento_id)
        self.orcamento_repository.atualizar(orcamento_id, {
            "valor_total": valor_total,
            "updated_at": datetime.now().isoformat()
        })
        return valor_total

    def adicionar_item(self, orcamento_id: str, item: OrcamentoItemCreate):
        # Verificar se o orçamento existe
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise ValueError("Orçamento não encontrado")

        # Usar estado do orçamento se não foi fornecido no item
        estado_para_buscar = item.estado or orcamento.get("estado")
        if not estado_para_buscar:
            raise ValueError("Estado não definido no orçamento")

        # Verificar se a composição existe (opcional se buscar preço ja valida, mas boa pratica)
        comps = self.item_repository.buscar_por_codigo(item.codigo_composicao)
        if not comps:
            raise ValueError("Composição não encontrada")
        composicao = comps[0]

        # Buscar preço da composição para o estado informado
        preco_unitario = self._buscar_preco_composicao(item.codigo_composicao, estado_para_buscar)
        if preco_unitario is None:
            raise ValueError(f"Preço não encontrado para a composição {item.codigo_composicao} no estado {estado_para_buscar}")

        # Validar quantidade
        if item.quantidade <= 0:
            raise ValueError("Quantidade deve ser maior que zero")

        # Calcular preço total
        preco_total = item.quantidade * preco_unitario

        # Usar descrição da composição se não foi fornecida
        descricao = item.descricao or composicao.get("descricao", "")
        unidade = item.unidade or composicao.get("unidade", "")
        
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

        novo_item = self.repository.criar(dados_item)
        if not novo_item:
            raise Exception("Erro ao adicionar item")

        self._atualizar_valor_total_orcamento(orcamento_id)
        
        return novo_item

    def listar_itens(self, orcamento_id: str):
        # Verificar se o orçamento existe
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise ValueError("Orçamento não encontrado")
            
        return self.repository.listar_por_orcamento(orcamento_id)

    def atualizar_item(self, orcamento_id: str, item_id: str, item_update: OrcamentoItemUpdate):
        item_atual = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item_atual:
            raise ValueError("Item não encontrado")

        dados_atualizacao = {}
        codigo_composicao = item_update.codigo_composicao or item_atual.get("codigo_composicao")
        estado = item_update.estado or item_atual.get("estado")
        quantidade = item_update.quantidade if item_update.quantidade is not None else item_atual.get("quantidade")

        # Se código ou estado mudaram, buscar novo preço
        if item_update.codigo_composicao is not None or item_update.estado is not None:
            preco_unitario = self._buscar_preco_composicao(codigo_composicao, estado)
            if preco_unitario is None:
                raise ValueError(f"Preço não encontrado para a composição {codigo_composicao} no estado {estado}")
            
            dados_atualizacao["preco_unitario"] = preco_unitario
            dados_atualizacao["codigo_composicao"] = codigo_composicao
            dados_atualizacao["estado"] = estado.lower()
        else:
            preco_unitario = item_atual.get("preco_unitario")

        # Se quantidade mudou, recalcular preço total
        if item_update.quantidade is not None:
            if quantidade <= 0:
                raise ValueError("Quantidade deve ser maior que zero")
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
            return item_atual

        item_atualizado = self.repository.atualizar(item_id, dados_atualizacao)
        self._atualizar_valor_total_orcamento(orcamento_id)
        
        return item_atualizado

    def remover_item(self, orcamento_id: str, item_id: str):
        item_existente = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item_existente:
             raise ValueError("Item não encontrado")
        
        self.repository.deletar(item_id)
        self._atualizar_valor_total_orcamento(orcamento_id)
        return {"message": "Item removido com sucesso", "id": item_id}
