from typing import List, Dict, Any, Optional
from decimal import Decimal
from app.modules.financeiro.repositories import FinanceiroRepository
from app.modules.financeiro.schemas import DespesaCreate, ConsolidadoFinanceiro, CategoriaGasto

class FinanceiroService:
    def __init__(self, repository: FinanceiroRepository):
        self.repository = repository

    def listar_despesas(self, obra_id: str, categoria: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.repository.listar_despesas(obra_id, categoria)

    def criar_despesa(self, obra_id: str, schema: DespesaCreate) -> Dict[str, Any]:
        dados = schema.model_dump(exclude_none=True)
        dados["valor"] = float(dados["valor"])
        dados["data_competencia"] = str(dados["data_competencia"])
        return self.repository.criar_despesa(obra_id, dados)

    def atualizar_status_despesa(self, despesa_id: str, status: str) -> Dict[str, Any]:
        return self.repository.atualizar_status_despesa(despesa_id, status)

    def deletar_despesa(self, despesa_id: str) -> bool:
        return self.repository.deletar_despesa(despesa_id)

    def obter_consolidado_financeiro(self, obra_id: str) -> Dict[str, Any]:
        orcamento_id = self.repository.obter_orcamento_id_da_obra(obra_id)
        
        # 1. Obter valor planejado total
        total_orcado = Decimal("0.0")
        planejado_categorias = {"Materiais": Decimal("0.0"), "Mão de Obra": Decimal("0.0"), "Equipamentos": Decimal("0.0"), "Administrativo": Decimal("0.0"), "Outros": Decimal("0.0")}
        
        if orcamento_id:
            total_orcado = self.repository.obter_valor_total_planejado(orcamento_id)
            planejado_detalhado = self.repository.obter_planejado_por_categoria(orcamento_id)
            for k, v in planejado_detalhado.items():
                if k in planejado_categorias:
                    planejado_categorias[k] = v
                else:
                    planejado_categorias["Outros"] += v

        # 2. Obter gastos reais por categoria
        realizado_categorias = self.repository.obter_gastos_reais_por_categoria(obra_id)
        
        # 3. Somar total realizado
        total_realizado = sum(realizado_categorias.values(), Decimal("0.0"))
        
        # 4. Calcular saldo restante e desvio total
        saldo_restante = total_orcado - total_realizado
        
        if total_orcado > Decimal("0.0"):
            desvio_percentual = float(((total_realizado - total_orcado) / total_orcado) * Decimal("100.0"))
        else:
            desvio_percentual = 0.0

        # 5. Formatar gastos por categoria
        gasto_por_categoria = []
        categorias_lista = ["Materiais", "Mão de Obra", "Equipamentos", "Administrativo", "Outros"]
        
        for cat in categorias_lista:
            orc = planejado_categorias.get(cat, Decimal("0.0"))
            real = realizado_categorias.get(cat, Decimal("0.0"))
            desvio = real - orc
            
            if orc > Decimal("0.0"):
                cat_desvio_percentual = float((desvio / orc) * Decimal("100.0"))
            else:
                cat_desvio_percentual = 0.0 if real == Decimal("0.0") else 100.0

            gasto_por_categoria.append({
                "categoria": cat,
                "orcado": float(orc),
                "realizado": float(real),
                "desvio": float(desvio),
                "desvio_percentual": cat_desvio_percentual
            })

        return {
            "total_orcado": float(total_orcado),
            "total_realizado": float(total_realizado),
            "saldo_restante": float(saldo_restante),
            "desvio_percentual": desvio_percentual,
            "gasto_por_categoria": gasto_por_categoria
        }

    def obter_portfolio_consolidado(self) -> Dict[str, Any]:
        obras = self.repository.supabase.table("obras").select("*").execute().data or []
        
        total_orcado_global = Decimal("0.0")
        total_realizado_global = Decimal("0.0")
        
        projetos = []
        alerta_critico = None
        maior_desvio = -999.0

        categorias_globais = {
            "Materiais": {"orc": Decimal("0.0"), "real": Decimal("0.0")},
            "Mão de Obra": {"orc": Decimal("0.0"), "real": Decimal("0.0")},
            "Equipamentos": {"orc": Decimal("0.0"), "real": Decimal("0.0")},
            "Administrativo": {"orc": Decimal("0.0"), "real": Decimal("0.0")},
            "Outros": {"orc": Decimal("0.0"), "real": Decimal("0.0")},
        }

        for o in obras:
            obra_id = o.get("id")
            nome_obra = o.get("escopo") or f"Obra {o.get('cliente', '')}"
            gestor = o.get("engenheiro_responsavel_id") or "Engenharia"

            consolidado = self.obter_consolidado_financeiro(obra_id)
            orcado = Decimal(str(consolidado["total_orcado"]))
            realizado = Decimal(str(consolidado["total_realizado"]))
            pct_utilizacao = float(((realizado / orcado) * Decimal("100.0"))) if orcado > Decimal("0.0") else (0.0 if realizado == Decimal("0.0") else 100.0)

            total_orcado_global += orcado
            total_realizado_global += realizado

            # Status e Cores
            if pct_utilizacao > 90:
                status = "CRÍTICO"
                statusClass = "bg-color-danger-bg text-color-danger-dark"
                barColor = "bg-color-danger"
            elif pct_utilizacao > 60:
                status = "ALERTA"
                statusClass = "bg-color-warning-bg text-color-warning-dark"
                barColor = "bg-color-warning"
            else:
                status = "NO PRAZO"
                statusClass = "bg-color-success-bg text-color-success-dark"
                barColor = "bg-color-success"

            projetos.append({
                "id": obra_id,
                "nome": nome_obra,
                "gestor": gestor,
                "previsto": float(orcado),
                "realizado": float(realizado),
                "percent": round(pct_utilizacao, 1),
                "status": status,
                "statusClass": statusClass,
                "barColor": barColor,
                "href": f"/obras/{obra_id}"
            })

            # Verifica alertas
            if consolidado["desvio_percentual"] > maior_desvio and consolidado["desvio_percentual"] > 0:
                maior_desvio = consolidado["desvio_percentual"]
                alerta_critico = {
                    "obra_nome": nome_obra,
                    "excesso_pct": round(consolidado["desvio_percentual"], 1),
                    "obra_id": obra_id
                }

            # Somar categorias para gráfico global
            for cat in consolidado["gasto_por_categoria"]:
                c_nome = cat["categoria"]
                if c_nome in categorias_globais:
                    categorias_globais[c_nome]["orc"] += Decimal(str(cat["orcado"]))
                    categorias_globais[c_nome]["real"] += Decimal(str(cat["realizado"]))

        saldo_restante_global = total_orcado_global - total_realizado_global
        desvio_global = float(((total_realizado_global - total_orcado_global) / total_orcado_global) * Decimal("100.0")) if total_orcado_global > Decimal("0.0") else 0.0

        gasto_por_categoria_list = []
        for cat_nome, valores in categorias_globais.items():
            orc = valores["orc"]
            real = valores["real"]
            desv = real - orc
            desv_pct = float((desv / orc) * Decimal("100.0")) if orc > Decimal("0.0") else 0.0
            gasto_por_categoria_list.append({
                "categoria": cat_nome,
                "orcado": float(orc),
                "realizado": float(real),
                "desvio": float(desv),
                "desvio_percentual": round(desv_pct, 1)
            })

        return {
            "total_orcado": float(total_orcado_global),
            "total_realizado": float(total_realizado_global),
            "saldo_restante": float(saldo_restante_global),
            "desvio_percentual": round(desvio_global, 1),
            "projetos": projetos,
            "gasto_por_categoria": gasto_por_categoria_list,
            "alerta_critico": alerta_critico
        }

