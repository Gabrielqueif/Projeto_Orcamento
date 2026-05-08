from datetime import datetime
from typing import List, Optional
from app.repositories.orcamento_item_repository import OrcamentoItemRepository
from app.repositories.orcamento_repository import OrcamentoRepository
from app.repositories.item_repository import ItemRepository
from app.repositories.insumo_repository import InsumoRepository
from schemas.schemas import OrcamentoItemCreate, OrcamentoItemUpdate

class OrcamentoItemService:
    def __init__(self, 
                 repository: OrcamentoItemRepository,
                 orcamento_repository: OrcamentoRepository,
                 item_repository: ItemRepository,
                 insumo_repository: Optional[InsumoRepository] = None):
        self.repository = repository
        self.orcamento_repository = orcamento_repository
        self.item_repository = item_repository
        self.insumo_repository = insumo_repository

    def _buscar_preco_composicao(self, codigo_composicao: str, estado: str, mes_referencia: str, tipo_composicao: str, fonte: str = "SINAPI") -> Optional[float]:
        # Busca o preço de uma composição para um estado, mês, tipo e fonte específicos via repositório
        return self.item_repository.buscar_preco(codigo_composicao, estado, mes_referencia, tipo_composicao, fonte)

    def _atualizar_valor_total_orcamento(self, orcamento_id: str):
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            return 0.0
            
        bdi = float(orcamento.get("bdi") or 0.0)
        total_itens = self.repository.calcular_total_itens(orcamento_id)
        
        # Aplicar BDI: Valor Total = Custos Diretos * (1 + BDI/100)
        valor_total = total_itens * (1 + bdi / 100)
        
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

        # Verificar se a composição existe (pula para itens manuais)
        fonte = item.fonte or orcamento.get("fonte", "SINAPI")
        composicao = {"descricao": item.descricao, "unidade": item.unidade}
        
        if item.codigo_composicao != "MANUAL":
            comps = self.item_repository.buscar_por_codigo(item.codigo_composicao, fonte=fonte)
            if not comps:
                raise ValueError(f"Composição {item.codigo_composicao} não encontrada na base {fonte}")
            composicao = comps[0]

        # Buscar preço da composição (pula se já foi enviado preço manual)
        preco_unitario = item.preco_unitario
        
        if preco_unitario is None:
            preco_unitario = self._buscar_preco_composicao(
                item.codigo_composicao, 
                estado_para_buscar,
                orcamento.get("base_referencia"),
                orcamento.get("tipo_composicao"),
                fonte=fonte
            )
            
        if preco_unitario is None and item.codigo_composicao != "MANUAL":
            raise ValueError(f"Preço não encontrado para a composição {item.codigo_composicao}")
        
        # Se for manual e ainda sem preço, assume 0
        if preco_unitario is None:
            preco_unitario = 0.0

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
            "fonte": fonte, # Persistir a fonte de onde o preço foi buscado
            "etapa_id": item.etapa_id,
            "memoria_calculo": item.memoria_calculo,
            "variaveis": item.variaveis,
            "created_at": datetime.now().isoformat()
        }

        novo_item = self.repository.criar(dados_item)
        if not novo_item:
            raise Exception("Erro ao adicionar item")

        self._atualizar_valor_total_orcamento(orcamento_id)

        # Auto-explode insumos se o repositório de insumos estiver disponível
        if self.insumo_repository and isinstance(novo_item, dict):
            self._explodir_insumos(novo_item, orcamento, fonte, estado_para_buscar)
        
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

        # Se código, estado ou fonte mudaram, buscar novo preço
        if item_update.codigo_composicao is not None or item_update.estado is not None or item_update.fonte is not None:
            orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
            fonte = item_update.fonte or item_atual.get("fonte") or orcamento.get("fonte", "SINAPI")
            preco_unitario = self._buscar_preco_composicao(
                codigo_composicao, 
                estado,
                orcamento.get("base_referencia"),
                orcamento.get("tipo_composicao"),
                fonte=fonte
            )
            if preco_unitario is None:
                raise ValueError(f"Preço não encontrado para a composição {codigo_composicao} na base {fonte}")
            
            dados_atualizacao["preco_unitario"] = preco_unitario
            dados_atualizacao["codigo_composicao"] = codigo_composicao
            dados_atualizacao["estado"] = estado.lower()
            if item_update.fonte is not None:
                dados_atualizacao["fonte"] = item_update.fonte
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

    def listar_insumos(self, orcamento_id: str, item_id: str):
        """Lista os insumos de um item do orçamento."""
        item = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item:
            raise ValueError("Item não encontrado")
        if not self.insumo_repository:
            return []
        return self.insumo_repository.listar_por_item(item_id)

    def atualizar_insumo(self, orcamento_id: str, item_id: str, insumo_id: str, dados: dict):
        """Atualiza um insumo e recalcula os totais do item pai e do orçamento."""
        if not self.insumo_repository:
            raise ValueError("Repositório de insumos não disponível")

        insumo_atual = self.insumo_repository.buscar_por_id(insumo_id)
        if not insumo_atual:
            raise ValueError("Insumo não encontrado")

        # Preparar dados de atualização
        qtd = dados.get("quantidade_unitaria", insumo_atual.get("quantidade_unitaria", 0))
        preco_custom = dados.get("preco_unitario_custom")
        
        # Se não houver preço customizado, usa o base
        preco_efetivo = preco_custom if preco_custom is not None else insumo_atual.get("preco_unitario_base", 0)
        
        novo_total_insumo = round(float(qtd) * float(preco_efetivo), 2)

        upd_data = {
            "quantidade_unitaria": qtd,
            "preco_unitario_custom": preco_custom,
            "total": novo_total_insumo
        }

        insumo_upd = self.insumo_repository.atualizar(insumo_id, upd_data)

        # Recalcular Item Pai
        insumos = self.insumo_repository.listar_por_item(item_id)
        soma_totais = sum(float(i.get("total") or 0) for i in insumos)
        
        item_pai = self.repository.buscar_por_id(item_id, orcamento_id)
        qtd_pai = float(item_pai.get("quantidade") or 1)

        # O preço unitário da composição é a soma dos insumos dividido pela qtd do pai?
        # Na verdade, os coeficientes no SINAPI já são para 1 unidade. 
        # Mas nossa quantidade_unitaria no orcamento_item_insumo já está multiplicada pela qtd do pai.
        # Então a soma dos totais dos insumos já é o preco_total do item pai.
        novo_preco_total_pai = round(soma_totais, 2)
        novo_preco_unitario_pai = round(soma_totais / qtd_pai, 2) if qtd_pai > 0 else 0

        self.repository.atualizar(item_id, {
            "preco_unitario": novo_preco_unitario_pai,
            "preco_total": novo_preco_total_pai
        })

        # Atualizar Orçamento
        self._atualizar_valor_total_orcamento(orcamento_id)

        return insumo_upd

    def _explodir_insumos(
        self,
        item: dict,
        orcamento: dict,
        fonte: str,
        estado: str,
    ) -> None:
        """Busca os insumos da composição no catálogo analítico e os persiste."""
        try:
            codigo = item.get("codigo_composicao")
            mes = orcamento.get("base_referencia")
            tipo_composicao = orcamento.get("tipo_composicao", "Sem Desoneração")
            quantidade_pai = float(item.get("quantidade", 1))
            item_id = item.get("id")

            filhos = self.item_repository.buscar_filhos_composicao(codigo, mes, fonte)
            if not filhos:
                return

            # Limpa insumos anteriores (caso re-adicionando)
            self.insumo_repository.deletar_por_item(item_id)

            batch = []
            for filho in filhos:
                cod_filho = filho.get("codigo_filho")
                coef = float(filho.get("quantidade_coeficiente") or 0)
                if coef <= 0:
                    continue

                # Busca preço do insumo individual na tabela composicao_estados
                preco_base = self.item_repository.buscar_preco(
                    cod_filho, estado, mes, tipo_composicao, fonte
                )

                qtd_total = round(coef * quantidade_pai, 6)
                total = round(qtd_total * preco_base, 2) if preco_base else None

                batch.append({
                    "orcamento_item_id": item_id,
                    "codigo_insumo": cod_filho,
                    "descricao": filho.get("descricao_filho", ""),
                    "unidade": filho.get("unidade_filho", "-"),
                    "quantidade_unitaria": qtd_total,
                    "preco_unitario_base": preco_base,
                    "total": total,
                    "tipo_item": "MATERIAL",  # O tipo real virá das ISD; para MVP usamos MATERIAL
                })

            if batch:
                self.insumo_repository.criar_batch(batch)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Falha ao explodir insumos: {e}")

    def remover_item(self, orcamento_id: str, item_id: str):
        item_existente = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item_existente:
             raise ValueError("Item não encontrado")
        
        self.repository.deletar(item_id)
        self._atualizar_valor_total_orcamento(orcamento_id)
        return {"message": "Item removido com sucesso", "id": item_id}
