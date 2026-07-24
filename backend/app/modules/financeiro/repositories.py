from typing import List, Dict, Any, Optional
import logging
import uuid
from decimal import Decimal

logger = logging.getLogger("projeto_orcamento")

TABELA_CUSTOS = "custos_despesas"
TABELA_OBRAS = "obras"
TABELA_ORCAMENTOS = "orcamentos"

def _is_valid_uuid(val: str) -> bool:
    if not val:
        return False
    try:
        uuid.UUID(str(val))
        return True
    except Exception:
        return False

class FinanceiroRepository:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def resolver_obra_uuid(self, obra_id: str) -> str:
        """
        Garante que o ID retornado seja um UUID válido de uma obra existente.
        Se obra_id for um UUID válido, tenta validar na tabela obras.
        Se não for um UUID (ex: 'controle' ou slug), busca a obra de fallback.
        """
        if _is_valid_uuid(obra_id):
            try:
                res_obra = self.supabase.table(TABELA_OBRAS).select("id").eq("id", obra_id).execute()
                if res_obra.data:
                    return res_obra.data[0]["id"]
                res_orc = self.supabase.table(TABELA_OBRAS).select("id").eq("orcamento_id", obra_id).execute()
                if res_orc.data:
                    return res_orc.data[0]["id"]
            except Exception as e:
                logger.warning(f"Erro ao buscar obra por UUID {obra_id}: {e}")
            return obra_id

        # Se não for um UUID válido (ex: 'controle')
        try:
            res_escopo = self.supabase.table(TABELA_OBRAS).select("id").ilike("escopo", f"%{obra_id}%").execute()
            if res_escopo.data:
                return res_escopo.data[0]["id"]

            res_primeira = self.supabase.table(TABELA_OBRAS).select("id").limit(1).execute()
            if res_primeira.data:
                return res_primeira.data[0]["id"]
        except Exception as e:
            logger.error(f"Erro ao buscar obra fallback para '{obra_id}': {e}")

        return obra_id

    def buscar_despesa_por_id(self, despesa_id: str) -> Optional[Dict[str, Any]]:
        try:
            resultado = self.supabase.table(TABELA_CUSTOS).select("*").eq("id", despesa_id).execute()
            if resultado.data:
                return resultado.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar despesa {despesa_id}: {e}")
            return None

    def criar_despesa(self, obra_id: str, dados: Dict[str, Any]) -> Dict[str, Any]:
        try:
            target_obra_id = self.resolver_obra_uuid(obra_id)
            dados["obra_id"] = target_obra_id
            resultado = self.supabase.table(TABELA_CUSTOS).insert(dados).execute()
            if not resultado.data:
                raise Exception("Falha ao criar registro de despesa")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao criar despesa: {e}")
            raise e

    def atualizar_status_despesa(self, despesa_id: str, status: str) -> Dict[str, Any]:
        try:
            resultado = self.supabase.table(TABELA_CUSTOS).update({
                "status": status,
                "updated_at": "now()"
            }).eq("id", despesa_id).execute()
            if not resultado.data:
                raise Exception("Falha ao atualizar status da despesa")
            return resultado.data[0]
        except Exception as e:
            logger.error(f"Erro ao atualizar status da despesa {despesa_id}: {e}")
            raise e

    def deletar_despesa(self, despesa_id: str) -> bool:
        try:
            resultado = self.supabase.table(TABELA_CUSTOS).delete().eq("id", despesa_id).execute()
            return len(resultado.data) > 0 if resultado.data else False
        except Exception as e:
            logger.error(f"Erro ao deletar despesa {despesa_id}: {e}")
            raise e

    def obter_orcamento_id_da_obra(self, obra_id: str) -> Optional[str]:
        try:
            target_obra_id = self.resolver_obra_uuid(obra_id)
            if _is_valid_uuid(target_obra_id):
                resultado = self.supabase.table(TABELA_OBRAS).select("orcamento_id").eq("id", target_obra_id).execute()
                if resultado.data and resultado.data[0].get("orcamento_id"):
                    return resultado.data[0]["orcamento_id"]
            return target_obra_id
        except Exception as e:
            logger.error(f"Erro ao buscar orcamento_id da obra {obra_id}: {e}")
            return obra_id

    def obter_valor_total_planejado(self, orcamento_id: str) -> Decimal:
        try:
            if not _is_valid_uuid(orcamento_id):
                return Decimal("0.0")

            resultado = self.supabase.table(TABELA_ORCAMENTOS).select("valor_total").eq("id", orcamento_id).execute()
            if resultado.data and resultado.data[0].get("valor_total"):
                val = Decimal(str(resultado.data[0]["valor_total"]))
                if val > Decimal("0.0"):
                    return val
            
            # Fallback: calcula o total pela soma dos itens cadastrados no orçamento
            res_itens = self.supabase.table("orcamento_itens").select("preco_total").eq("orcamento_id", orcamento_id).execute()
            if res_itens.data:
                total_itens = sum(Decimal(str(item.get("preco_total", 0.0) or 0.0)) for item in res_itens.data)
                if total_itens > Decimal("0.0"):
                    return total_itens

            return Decimal("0.0")
        except Exception as e:
            logger.error(f"Erro ao buscar valor total do orcamento {orcamento_id}: {e}")
            return Decimal("0.0")

    def obter_planejado_por_categoria(self, orcamento_id: str) -> Dict[str, Decimal]:
        """
        Consolida o orçamento planejado por tipo de insumo (MATERIAL, MAO_DE_OBRA, EQUIPAMENTO).
        """
        valores = {"Materiais": Decimal("0.0"), "Mão de Obra": Decimal("0.0"), "Equipamentos": Decimal("0.0"), "Outros": Decimal("0.0")}
        try:
            if not _is_valid_uuid(orcamento_id):
                return valores

            # 1. Busca os IDs dos itens do orçamento
            res_itens = self.supabase.table("orcamento_itens").select("id, quantidade").eq("orcamento_id", orcamento_id).execute()
            if not res_itens.data:
                return valores

            item_map = {item["id"]: Decimal(str(item.get("quantidade", 1.0))) for item in res_itens.data if "id" in item}
            item_ids = list(item_map.keys())
            if not item_ids:
                return valores

            # 2. Busca os insumos pertencentes aos itens do orçamento
            res_insumos = self.supabase.table("orcamento_item_insumo").select("tipo_item, total, orcamento_item_id").in_("orcamento_item_id", item_ids).execute()
            if not res_insumos.data:
                return valores

            for item in res_insumos.data:
                orc_item_id = item.get("orcamento_item_id")
                qtd_servico = item_map.get(orc_item_id, Decimal("1.0"))
                total_insumo = Decimal(str(item.get("total", 0.0)))
                val_calculado = total_insumo * qtd_servico

                tipo = str(item.get("tipo_item", "")).upper()
                if "MATERIAL" in tipo:
                    valores["Materiais"] += val_calculado
                elif "MAO" in tipo or "MÃO" in tipo:
                    valores["Mão de Obra"] += val_calculado
                elif "EQUIPAMENTO" in tipo or "MAQUINA" in tipo or "MÁQUINA" in tipo:
                    valores["Equipamentos"] += val_calculado
                else:
                    valores["Outros"] += val_calculado

            return valores
        except Exception as e:
            logger.error(f"Erro ao obter planejado por categoria do orcamento {orcamento_id}: {e}")
            return valores

    def listar_despesas(self, obra_id: str, categoria: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            target_obra_id = self.resolver_obra_uuid(obra_id)
            target_ids = [target_obra_id]

            if _is_valid_uuid(target_obra_id):
                res_obra = self.supabase.table(TABELA_OBRAS).select("id, orcamento_id").or_(f"id.eq.{target_obra_id},orcamento_id.eq.{target_obra_id}").execute()
                if res_obra.data:
                    for row in res_obra.data:
                        if row.get("id"): target_ids.append(row["id"])
                        if row.get("orcamento_id"): target_ids.append(row["orcamento_id"])

            target_ids = list(set([t for t in target_ids if _is_valid_uuid(t)]))
            if not target_ids:
                return []

            query = self.supabase.table(TABELA_CUSTOS).select("*").in_("obra_id", target_ids)
            if categoria:
                query = query.eq("categoria", categoria)
            resultado = query.order("data_competencia", desc=True).execute()
            return resultado.data or []
        except Exception as e:
            logger.error(f"Erro ao listar despesas da obra {obra_id}: {e}")
            return []

    def obter_gastos_reais_por_categoria(self, obra_id: str) -> Dict[str, Decimal]:
        valores = {"Materiais": Decimal("0.0"), "Mão de Obra": Decimal("0.0"), "Equipamentos": Decimal("0.0"), "Administrativo": Decimal("0.0"), "Outros": Decimal("0.0")}
        try:
            target_obra_id = self.resolver_obra_uuid(obra_id)
            target_ids = [target_obra_id]

            if _is_valid_uuid(target_obra_id):
                res_obra = self.supabase.table(TABELA_OBRAS).select("id, orcamento_id").or_(f"id.eq.{target_obra_id},orcamento_id.eq.{target_obra_id}").execute()
                if res_obra.data:
                    for row in res_obra.data:
                        if row.get("id"): target_ids.append(row["id"])
                        if row.get("orcamento_id"): target_ids.append(row["orcamento_id"])

            target_ids = list(set([t for t in target_ids if _is_valid_uuid(t)]))
            if not target_ids:
                return valores

            resultado = self.supabase.table(TABELA_CUSTOS).select("categoria, valor").in_("obra_id", target_ids).execute()
            
            if not resultado.data:
                return valores

            for item in resultado.data:
                cat = item.get("categoria", "Outros")
                val = Decimal(str(item.get("valor", 0.0)))
                if cat in valores:
                    valores[cat] += val
                else:
                    valores["Outros"] += val

            return valores
        except Exception as e:
            logger.error(f"Erro ao somar gastos por categoria da obra {obra_id}: {e}")
            return valores
