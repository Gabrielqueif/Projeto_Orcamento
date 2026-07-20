from datetime import date, datetime
from typing import Dict, Any, List, Optional
from schemas.obra import ObraTransitionCreate
from app.repositories.obra_repository import ObraRepository
from app.repositories.orcamento_repository import OrcamentoRepository
from app.repositories.etapa_repository import EtapaRepository
from app.repositories.orcamento_item_repository import OrcamentoItemRepository

class ObraService:
    def __init__(
        self,
        obra_repository: ObraRepository,
        orcamento_repository: OrcamentoRepository,
        etapa_repository: EtapaRepository,
        orcamento_item_repository: OrcamentoItemRepository,
        supabase_client
    ):
        self.obra_repository = obra_repository
        self.orcamento_repository = orcamento_repository
        self.etapa_repository = etapa_repository
        self.orcamento_item_repository = orcamento_item_repository
        self.supabase = supabase_client

    def gerar_obra(self, orcamento_id: str, dados_transicao: ObraTransitionCreate) -> Dict[str, Any]:
        # 1. Validar orçamento
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise ValueError("Orçamento não encontrado")

        status_orcamento = orcamento.get("status", "").upper()
        if "APROVADO" not in status_orcamento and "CONCLUIDO" not in status_orcamento:
            raise ValueError("Apenas orçamentos com status APROVADO podem ser iniciados como obra.")

        # 2. Criar obra
        dados_obra = {
            "orcamento_id": orcamento_id,
            "cliente": orcamento.get("cliente"),
            "endereco": orcamento.get("endereco") or {},
            "escopo": orcamento.get("nome"),
            "data_inicio_real": dados_transicao.data_inicio_real.isoformat() if hasattr(dados_transicao.data_inicio_real, 'isoformat') else str(dados_transicao.data_inicio_real),
            "prazo_estimado_dias": dados_transicao.prazo_estimado_dias,
            "engenheiro_responsavel_id": dados_transicao.engenheiro_responsavel_id,
            "enviar_curva_abc_almoxarifado": dados_transicao.enviar_curva_abc_almoxarifado,
            "bloquear_planilha_base": dados_transicao.bloquear_planilha_base,
            "status": "EM_ANDAMENTO",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        obra_criada = self.obra_repository.criar_obra(dados_obra)
        obra_id = obra_criada["id"]

        # 3. Bloquear planilha base do orçamento original
        if dados_transicao.bloquear_planilha_base:
            self.orcamento_repository.atualizar(orcamento_id, {
                "status": "concluido",
                "updated_at": datetime.now().isoformat()
            })

        # 4. Gerar Snapshot do Orçamento Meta
        etapas = self.etapa_repository.listar_por_orcamento(orcamento_id)
        itens = self.orcamento_item_repository.listar_por_orcamento(orcamento_id)
        
        insumos = []
        if itens:
            item_ids = [item["id"] for item in itens]
            # Realiza a busca em batch de todos os insumos dos itens
            resultado_insumos = self.supabase.table("orcamento_item_insumo").select("*").in_("orcamento_item_id", item_ids).execute()
            insumos = resultado_insumos.data or []

        snapshot_data = {
            "orcamento": orcamento,
            "etapas": etapas,
            "itens": itens,
            "insumos": insumos
        }

        dados_meta = {
            "orcamento_id": orcamento_id,
            "nome": orcamento.get("nome"),
            "cliente": orcamento.get("cliente"),
            "valor_total": orcamento.get("valor_total") or 0.0,
            "bdi": orcamento.get("bdi") or 0.0,
            "snapshot_data": snapshot_data,
            "created_at": datetime.now().isoformat()
        }
        self.obra_repository.criar_snapshot_meta(dados_meta)

        # 5. Explosão de Insumos da Curva ABC
        if dados_transicao.enviar_curva_abc_almoxarifado and insumos:
            limites_dict = {}
            for insumo in insumos:
                codigo = insumo.get("codigo_insumo")
                if not codigo:
                    continue
                
                qtd = float(insumo.get("quantidade_unitaria") or 0.0)
                desc = insumo.get("descricao") or ""
                unid = insumo.get("unidade") or ""

                if codigo in limites_dict:
                    limites_dict[codigo]["quantidade_limite"] += qtd
                else:
                    limites_dict[codigo] = {
                        "obra_id": obra_id,
                        "codigo_insumo": codigo,
                        "descricao": desc,
                        "unidade": unid,
                        "quantidade_limite": qtd,
                        "quantidade_requisitada": 0.0,
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
            
            limites = list(limites_dict.values())
            self.obra_repository.criar_limites_requisicao_batch(limites)

        return obra_criada

    def buscar_obra(self, obra_id: str) -> Optional[Dict[str, Any]]:
        obra = self.obra_repository.buscar_obra_por_id(obra_id)
        if not obra:
            raise ValueError("Obra não encontrada")
        return obra

    def listar_obras(self) -> List[Dict[str, Any]]:
        return self.obra_repository.listar_obras()

    def listar_limites(self, obra_id: str) -> List[Dict[str, Any]]:
        return self.obra_repository.listar_limites_por_obra(obra_id)
