from typing import List, Dict, Any
from decimal import Decimal
from datetime import date
import logging
from app.modules.almoxarifado.repositories import AlmoxarifadoRepository
from app.modules.almoxarifado.schemas import InsumoCreate, MovimentacaoCreate, LocacaoCreate

logger = logging.getLogger("projeto_orcamento")

class AlmoxarifadoService:
    def __init__(self, repository: AlmoxarifadoRepository):
        self.repository = repository

    def listar_insumos(self, obra_id: str) -> List[Dict[str, Any]]:
        insumos = self.repository.listar_insumos(obra_id)
        for insumo in insumos:
            # Adiciona o status calculado dinamicamente
            qtd_atual = Decimal(str(insumo.get("quantidade_atual", 0)))
            qtd_min = Decimal(str(insumo.get("quantidade_minima", 0)))
            insumo["status"] = "Crítico" if qtd_atual <= qtd_min else "Normal"
        return insumos

    def criar_insumo(self, obra_id: str, schema: InsumoCreate) -> Dict[str, Any]:
        dados = schema.model_dump()
        dados["quantidade_atual"] = float(dados.get("quantidade_atual") or 0.0)
        dados["quantidade_minima"] = float(dados.get("quantidade_minima") or 0.0)
        dados["preco_unitario"] = float(dados.get("preco_unitario") or 0.0)
        
        insumo = self.repository.criar_insumo(obra_id, dados)
        # Calcula status para o retorno
        insumo["status"] = "Crítico" if Decimal(str(insumo["quantidade_atual"])) <= Decimal(str(insumo["quantidade_minima"])) else "Normal"
        return insumo

    def registrar_movimentacao(self, insumo_id: str, schema: MovimentacaoCreate) -> Dict[str, Any]:
        insumo = self.repository.buscar_insumo_por_id(insumo_id)
        if not insumo:
            raise ValueError("Insumo não encontrado no almoxarifado")

        qtd_atual = Decimal(str(insumo["quantidade_atual"]))
        qtd_mov = Decimal(str(schema.quantidade))

        if schema.tipo_movimentacao == "SAIDA":
            if qtd_atual < qtd_mov:
                raise ValueError("Quantidade em estoque insuficiente para realizar a baixa")
            nova_qtd = qtd_atual - qtd_mov
        else: # ENTRADA
            nova_qtd = qtd_atual + qtd_mov

        # Registrar movimentação no banco
        mov_dados = schema.model_dump()
        mov_dados["quantidade"] = float(mov_dados["quantidade"])
        movimentacao = self.repository.criar_movimentacao(insumo_id, mov_dados)

        # Atualizar saldo atualizado do estoque
        self.repository.atualizar_quantidade_insumo(insumo_id, float(nova_qtd))

        # --- INTEGRAÇÃO COM FINANCEIRO DE CUSTOS ---
        # Se for uma ENTRADA (compra de material), gera automaticamente um lançamento de despesa!
        if schema.tipo_movimentacao == "ENTRADA":
            preco_unit = Decimal(str(insumo.get("preco_unitario", 0.0)))
            valor_desp = qtd_mov * preco_unit
            if valor_desp > 0:
                try:
                    despesa_dados = {
                        "obra_id": insumo["obra_id"],
                        "descricao": f"Entrada NF/Material: {insumo['descricao']}",
                        "valor": float(valor_desp),
                        "categoria": "Materiais",
                        "status": "APROVADO",
                        "data_competencia": str(date.today()),
                        "responsavel": schema.responsavel or "Almoxarife",
                        "origem": "ALMOXARIFADO",
                        "insumo_id": insumo_id
                    }
                    self.repository.supabase.table("custos_despesas").insert(despesa_dados).execute()
                except Exception as ex:
                    logger.error(f"Erro ao gerar despesa automatica para entrada de insumo: {ex}")

        return movimentacao

    def listar_movimentacoes(self, obra_id: str) -> List[Dict[str, Any]]:
        return self.repository.listar_movimentacoes(obra_id)

    def font_manrope(self) -> str:
        # Apenas para manter compatibilidade com testes anteriores
        return "Manrope"

    def listar_locacoes(self, obra_id: str) -> List[Dict[str, Any]]:
        return self.repository.listar_locacoes(obra_id)

    def registrar_locacao(self, obra_id: str, schema: LocacaoCreate) -> Dict[str, Any]:
        dados = schema.model_dump()
        dados["devolucao_prevista"] = str(dados["devolucao_prevista"])
        locacao = self.repository.criar_locacao(obra_id, dados)

        # --- INTEGRAÇÃO COM FINANCEIRO DE CUSTOS ---
        # Gera uma despesa com status "EM_ANALISE" na categoria "Equipamentos" para provisionar o contrato!
        try:
            despesa_dados = {
                "obra_id": obra_id,
                "descricao": f"Provisão Locação: {schema.nome_equipamento}",
                "valor": 0.0, # Preenchido depois pelo financeiro
                "categoria": "Equipamentos",
                "status": "EM_ANALISE",
                "data_competencia": str(date.today()),
                "responsavel": schema.responsavel or "Engenharia",
                "origem": "ALMOXARIFADO",
                "locacao_id": locacao["id"]
            }
            self.repository.supabase.table("custos_despesas").insert(despesa_dados).execute()
        except Exception as ex:
            logger.error(f"Erro ao gerar provisao automatica para locacao de equipamento: {ex}")

        return locacao

    def atualizar_status_locacao(self, locacao_id: str, status: str) -> Dict[str, Any]:
        return self.repository.atualizar_status_locacao(locacao_id, status)

    def deletar_insumo(self, insumo_id: str) -> bool:
        return self.repository.deletar_insumo(insumo_id)

    def deletar_locacao(self, locacao_id: str) -> bool:
        return self.repository.deletar_locacao(locacao_id)
