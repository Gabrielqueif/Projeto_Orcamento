from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
import logging

from app.modules.orcamento.repositories import OrcamentoRepository, OrcamentoItemRepository, InsumoRepository
from app.modules.composicao.repositories import ItemRepository
from app.modules.etapa.repositories import EtapaRepository
from app.modules.orcamento.schemas import OrcamentoCreate, OrcamentoUpdate, OrcamentoItemCreate, OrcamentoItemUpdate
from app.modules.orcamento.bdi import BDIConfig, calcular_bdi_tcu, determinar_tipo_bdi_item

logger = logging.getLogger("projeto_orcamento")

class OrcamentoService:
    def __init__(
        self,
        repository: OrcamentoRepository,
        etapa_repository: Optional[EtapaRepository] = None,
        orcamento_item_repository: Optional[OrcamentoItemRepository] = None,
        supabase_client: Optional[Any] = None
    ):
        self.repository = repository
        self.etapa_repository = etapa_repository
        self.orcamento_item_repository = orcamento_item_repository
        self.item_repository = orcamento_item_repository
        self.supabase = supabase_client

    def criar_orcamento(self, orcamento: OrcamentoCreate):
        tipo_bdi = orcamento.tipo_bdi or "ANALITICO"
        bdi_config = orcamento.bdi_config or BDIConfig()

        if tipo_bdi == "ANALITICO":
            bdi_calculado = calcular_bdi_tcu(bdi_config)
        else:
            bdi_calculado = orcamento.bdi or 0.0

        dados = {
            "nome": orcamento.nome,
            "cliente": orcamento.cliente,
            "data": orcamento.data.isoformat() if hasattr(orcamento.data, 'isoformat') else str(orcamento.data),
            "base_referencia": orcamento.base_referencia,
            "tipo_composicao": orcamento.tipo_composicao,
            "estado": orcamento.estado.lower(),
            "fonte": orcamento.fonte or "SINAPI",
            "bdi": bdi_calculado,
            "tipo_bdi": tipo_bdi,
            "bdi_config": bdi_config.model_dump(),
            "status": orcamento.status or "em_elaboracao",
            "valor_total": 0.0,
            "variaveis_globais": orcamento.variaveis_globais or [],
            "locais": orcamento.locais or [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        return self.repository.criar(dados)

    def listar_orcamentos(self, nome: Optional[str] = None, status: Optional[str] = None, cliente: Optional[str] = None):
        return self.repository.listar(nome, status, cliente)

    def buscar_orcamento(self, orcamento_id: str):
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise ValueError("Orçamento não encontrado")
        return orcamento

    def atualizar_orcamento(self, orcamento_id: str, orcamento_update: OrcamentoUpdate):
        existente = self.repository.buscar_por_id(orcamento_id)
        if not existente:
            raise ValueError("Orçamento não encontrado")

        dados_atualizacao = {}
        dados_atualizacao["updated_at"] = datetime.now().isoformat()
        bdi_alterado = False
        
        if orcamento_update.nome is not None:
            dados_atualizacao["nome"] = orcamento_update.nome
        if orcamento_update.cliente is not None:
            dados_atualizacao["cliente"] = orcamento_update.cliente
        if orcamento_update.data is not None:
            dados_atualizacao["data"] = orcamento_update.data.isoformat() if hasattr(orcamento_update.data, 'isoformat') else str(orcamento_update.data)
        if orcamento_update.base_referencia is not None:
            dados_atualizacao["base_referencia"] = orcamento_update.base_referencia
        if orcamento_update.tipo_composicao is not None:
            dados_atualizacao["tipo_composicao"] = orcamento_update.tipo_composicao
        if orcamento_update.estado is not None:
            dados_atualizacao["estado"] = orcamento_update.estado.lower()
        if orcamento_update.fonte is not None:
            dados_atualizacao["fonte"] = orcamento_update.fonte
        if orcamento_update.tipo_bdi is not None:
            dados_atualizacao["tipo_bdi"] = orcamento_update.tipo_bdi
            bdi_alterado = True
        if orcamento_update.bdi_config is not None:
            bdi_config = orcamento_update.bdi_config
            dados_atualizacao["bdi_config"] = bdi_config.model_dump()
            bdi_alterado = True
        if orcamento_update.bdi is not None:
            dados_atualizacao["bdi"] = orcamento_update.bdi
            bdi_alterado = True
        if orcamento_update.status is not None:
            dados_atualizacao["status"] = orcamento_update.status
        if orcamento_update.valor_total is not None:
            dados_atualizacao["valor_total"] = orcamento_update.valor_total
        if orcamento_update.variaveis_globais is not None:
            dados_atualizacao["variaveis_globais"] = orcamento_update.variaveis_globais
        if orcamento_update.locais is not None:
            dados_atualizacao["locais"] = orcamento_update.locais

        # Recalcula BDI analítico quando bdi_config é enviado
        tipo_bdi_efetivo = dados_atualizacao.get("tipo_bdi") or existente.get("tipo_bdi", "ANALITICO")
        if bdi_alterado and tipo_bdi_efetivo == "ANALITICO" and orcamento_update.bdi_config is not None:
            dados_atualizacao["bdi"] = calcular_bdi_tcu(orcamento_update.bdi_config)

        resultado = self.repository.atualizar(orcamento_id, dados_atualizacao)

        # Recalcula preços com BDI de todos os itens quando a taxa muda
        if bdi_alterado and self.orcamento_item_repository:
            self._recalcular_bdi_itens(orcamento_id)

        return resultado

    def _recalcular_bdi_itens(self, orcamento_id: str):
        """Recalcula preços com BDI de todos os itens do orçamento em lote."""
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento or not self.orcamento_item_repository:
            return

        bdi_padrao = float(orcamento.get("bdi") or 0.0)
        bdi_config_raw = orcamento.get("bdi_config")
        bdi_diferenciado = float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0

        itens = self.orcamento_item_repository.listar_por_orcamento(orcamento_id)
        valor_total_geral = 0.0

        for item in itens:
            tipo_item = item.get("tipo_bdi_item", "PADRAO")
            taxa_bdi = bdi_diferenciado if tipo_item == "DIFERENCIADO" else bdi_padrao
            preco_unitario = float(item.get("preco_unitario") or 0.0)
            quantidade = float(item.get("quantidade") or 0.0)

            preco_unitario_bdi = round(preco_unitario * (1 + taxa_bdi / 100), 2)
            preco_total_bdi = round(quantidade * preco_unitario_bdi, 2)

            self.orcamento_item_repository.atualizar(item["id"], {
                "bdi_aplicado": taxa_bdi,
                "preco_unitario_bdi": preco_unitario_bdi,
                "preco_total_bdi": preco_total_bdi,
            })

            valor_total_geral += preco_total_bdi

        self.repository.atualizar(orcamento_id, {
            "valor_total": round(valor_total_geral, 2),
            "updated_at": datetime.now().isoformat()
        })

    def deletar_orcamento(self, orcamento_id: str):
        existente = self.repository.buscar_por_id(orcamento_id)
        if not existente:
            raise ValueError("Orçamento não encontrado")
        return self.repository.deletar(orcamento_id)

    def obter_estatisticas(self) -> Dict[str, Any]:
        orcamentos = self.repository.listar()
        if not orcamentos:
            return {
                "total_orcamentos": 0,
                "valor_total": 0.0,
                "taxa_aprovacao": 0.0,
                "ticket_medio": 0.0,
                "tempo_resposta_medio": 0.0
            }

        total_orcamentos = len(orcamentos)
        valor_total = sum(float(o.get("valor_total") or 0.0) for o in orcamentos)
        aprovados = sum(1 for o in orcamentos if o.get("status", "").lower() in ["aprovado", "concluido"])
        
        taxa_aprovacao = (aprovados / total_orcamentos) * 100.0 if total_orcamentos > 0 else 0.0
        ticket_medio = valor_total / total_orcamentos if total_orcamentos > 0 else 0.0

        times = []
        for o in orcamentos:
            created = o.get("created_at")
            updated = o.get("updated_at")
            if created and updated and o.get("status", "").lower() in ["aprovado", "concluido"]:
                try:
                    t_created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    t_updated = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    diff_days = (t_updated - t_created).total_seconds() / 86400.0
                    times.append(diff_days)
                except Exception:
                    pass

        tempo_resposta_medio = sum(times) / len(times) if times else 1.4

        return {
            "total_orcamentos": total_orcamentos,
            "valor_total": round(valor_total, 2),
            "taxa_aprovacao": round(taxa_aprovacao, 1),
            "ticket_medio": round(ticket_medio, 2),
            "tempo_resposta_medio": round(tempo_resposta_medio, 1)
        }

    def obter_curva_abc(self, orcamento_id: str) -> Dict[str, Any]:
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise ValueError("Orçamento não encontrado")

        if not self.orcamento_item_repository or not self.supabase:
            raise ValueError("Dependências de Curva ABC não injetadas no serviço")

        itens = self.orcamento_item_repository.listar_por_orcamento(orcamento_id)
        if not itens:
            return {
                "valor_total": 0.0,
                "insumos": [],
                "resumo_classes": {"A": 0.0, "B": 0.0, "C": 0.0}
            }

        item_ids = [item["id"] for item in itens]
        resultado_insumos = self.supabase.table("orcamento_item_insumo").select("*").in_("orcamento_item_id", item_ids).execute()
        insumos = resultado_insumos.data or []

        grouped_insumos = {}
        for insumo in insumos:
            codigo = insumo.get("codigo_insumo")
            if not codigo:
                continue
            
            qtd = float(insumo.get("quantidade_unitaria") or 0.0)
            total = float(insumo.get("total") or 0.0)
            desc = insumo.get("descricao") or ""
            unid = insumo.get("unidade") or ""

            if codigo not in grouped_insumos:
                grouped_insumos[codigo] = {
                    "codigo_insumo": codigo,
                    "descricao": desc,
                    "unidade": unid,
                    "quantidade": 0.0,
                    "total": 0.0
                }
            grouped_insumos[codigo]["quantidade"] += qtd
            grouped_insumos[codigo]["total"] += total

        custo_total_acumulado = sum(ins["total"] for ins in grouped_insumos.values())
        if custo_total_acumulado == 0:
            return {
                "valor_total": 0.0,
                "insumos": [],
                "resumo_classes": {"A": 0.0, "B": 0.0, "C": 0.0}
            }

        insumos_calculados = sorted(grouped_insumos.values(), key=lambda x: x["total"], reverse=True)

        acumulado_pct = 0.0
        resumo_classes = {"A": 0.0, "B": 0.0, "C": 0.0}
        
        for ins in insumos_calculados:
            porcentagem = (ins["total"] / custo_total_acumulado) * 100.0
            acumulado_pct += porcentagem
            ins["porcentagem"] = round(porcentagem, 2)
            ins["acumulado"] = round(acumulado_pct, 2)

            if acumulado_pct <= 80.0001:
                ins["classe"] = "A"
                resumo_classes["A"] += ins["total"]
            elif acumulado_pct <= 95.0001:
                ins["classe"] = "B"
                resumo_classes["B"] += ins["total"]
            else:
                ins["classe"] = "C"
                resumo_classes["C"] += ins["total"]

            ins["total"] = round(ins["total"], 2)
            ins["quantidade"] = round(ins["quantidade"], 4)

        return {
            "valor_total": round(custo_total_acumulado, 2),
            "insumos": insumos_calculados,
            "resumo_classes": {k: round(v, 2) for k, v in resumo_classes.items()}
        }

    def obter_cronograma(self, orcamento_id: str) -> Dict[str, Any]:
        orcamento = self.repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise ValueError("Orçamento não encontrado")

        if not self.etapa_repository or not self.orcamento_item_repository:
            raise ValueError("Dependências de Cronograma não injetadas no serviço")

        etapas = self.etapa_repository.listar_por_orcamento(orcamento_id)
        itens = self.orcamento_item_repository.listar_por_orcamento(orcamento_id)

        if not etapas or not itens:
            return {"valor_total": 0.0, "mensal": []}

        etapa_custo_acumulado = {}
        for item in itens:
            etapa_id = item.get("etapa_id")
            if not etapa_id:
                continue
            etapa_custo_acumulado[etapa_id] = etapa_custo_acumulado.get(etapa_id, 0.0) + float(item.get("preco_total") or 0.0)

        def parse_date(val):
            if not val:
                return None
            if isinstance(val, date):
                return val
            if isinstance(val, datetime):
                return val.date()
            try:
                return datetime.fromisoformat(val.replace("Z", "+00:00")).date()
            except Exception:
                return None

        orcamento_date = parse_date(orcamento.get("data")) or date.today()

        desembolsos_mensais = {}
        etapas_ativas_no_mes = {}

        for etapa in etapas:
            etapa_id = etapa["id"]
            custo_etapa = etapa_custo_acumulado.get(etapa_id, 0.0)
            if custo_etapa <= 0:
                continue

            data_inicio = parse_date(etapa.get("data_inicio"))
            data_fim = parse_date(etapa.get("data_fim"))

            if not data_inicio or not data_fim:
                ordem = etapa.get("ordem") or 0
                data_inicio = orcamento_date + timedelta(days=ordem * 30)
                data_fim = data_inicio + timedelta(days=29)

            months_spanned = []
            curr = date(data_inicio.year, data_inicio.month, 1)
            end_month = date(data_fim.year, data_fim.month, 1)

            while curr <= end_month:
                months_spanned.append(f"{curr.year}-{curr.month:02d}")
                if curr.month == 12:
                    curr = date(curr.year + 1, 1, 1)
                else:
                    curr = date(curr.year, curr.month + 1, 1)

            if not months_spanned:
                months_spanned = [f"{data_inicio.year}-{data_inicio.month:02d}"]

            cost_per_month = custo_etapa / len(months_spanned)
            for m in months_spanned:
                desembolsos_mensais[m] = desembolsos_mensais.get(m, 0.0) + cost_per_month
                if m not in etapas_ativas_no_mes:
                    etapas_ativas_no_mes[m] = set()
                etapas_ativas_no_mes[m].add(etapa.get("nome"))

        if not desembolsos_mensais:
            return {"valor_total": 0.0, "mensal": []}

        sorted_months = sorted(desembolsos_mensais.keys())
        total_desembolso = sum(desembolsos_mensais.values())

        MESES_PT = {
            "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
            "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
            "09": "Set", "10": "Out", "11": "Nov", "12": "Dez"
        }

        mensal_res = []
        acumulado_acum = 0.0

        for m in sorted_months:
            val = desembolsos_mensais[m]
            pct = (val / total_desembolso) * 100.0 if total_desembolso > 0 else 0.0
            acumulado_acum += pct

            y, month_num = m.split("-")
            mes_display = f"{MESES_PT[month_num]}/{y}"

            servicos_ativos = ", ".join(sorted(list(etapas_ativas_no_mes[m])))

            mensal_res.append({
                "mes": mes_display,
                "servicos": servicos_ativos,
                "valor": round(val, 2),
                "acumulado_pct": round(acumulado_acum, 1)
            })

        return {
            "valor_total": round(total_desembolso, 2),
            "mensal": mensal_res
        }


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
        return self.item_repository.buscar_preco(codigo_composicao, estado, mes_referencia, tipo_composicao, fonte)

    def _atualizar_valor_total_orcamento(self, orcamento_id: str):
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            return 0.0

        bdi_padrao = float(orcamento.get("bdi") or 0.0)
        bdi_config_raw = orcamento.get("bdi_config")
        bdi_diferenciado = float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0

        itens = self.repository.listar_por_orcamento(orcamento_id)
        valor_total_geral = 0.0

        if itens and isinstance(itens, list) and len(itens) > 0 and isinstance(itens[0], dict):
            for item in itens:
                tipo_item = item.get("tipo_bdi_item", "PADRAO")
                taxa_bdi = bdi_diferenciado if tipo_item == "DIFERENCIADO" else bdi_padrao
                preco_unitario = float(item.get("preco_unitario") or 0.0)
                quantidade = float(item.get("quantidade") or 0.0)

                preco_unitario_bdi = round(preco_unitario * (1 + taxa_bdi / 100), 2)
                preco_total_bdi = round(quantidade * preco_unitario_bdi, 2)

                if "id" in item:
                    self.repository.atualizar(item["id"], {
                        "bdi_aplicado": taxa_bdi,
                        "preco_unitario_bdi": preco_unitario_bdi,
                        "preco_total_bdi": preco_total_bdi,
                    })

                valor_total_geral += preco_total_bdi
        else:
            total_direto = self.repository.calcular_total_itens(orcamento_id)
            valor_total_geral = float(total_direto or 0.0) * (1 + bdi_padrao / 100)

        self.orcamento_repository.atualizar(orcamento_id, {
            "valor_total": round(valor_total_geral, 2),
            "updated_at": datetime.now().isoformat()
        })
        return round(valor_total_geral, 2)

    def adicionar_item(self, orcamento_id: str, item: OrcamentoItemCreate):
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        if not orcamento:
            raise ValueError("Orçamento não encontrado")

        estado_para_buscar = item.estado or orcamento.get("estado")
        if not estado_para_buscar:
            raise ValueError("Estado não definido no orçamento")

        fonte = item.fonte or orcamento.get("fonte", "SINAPI")
        composicao = {"descricao": item.descricao, "unidade": item.unidade}
        
        if item.codigo_composicao != "MANUAL":
            comps = self.item_repository.buscar_por_codigo(item.codigo_composicao, fonte=fonte)
            if not comps:
                raise ValueError(f"Composição {item.codigo_composicao} não encontrada na base {fonte}")
            composicao = comps[0]

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
        
        if preco_unitario is None:
            preco_unitario = 0.0

        if item.quantidade <= 0:
            raise ValueError("Quantidade deve ser maior que zero")

        preco_total = item.quantidade * preco_unitario

        descricao = item.descricao or composicao.get("descricao", "")
        unidade = item.unidade or composicao.get("unidade", "")
        
        tipo_bdi_item = item.tipo_bdi_item or determinar_tipo_bdi_item(item.codigo_composicao, descricao)
        bdi_padrao = float(orcamento.get("bdi") or 0.0)
        bdi_config_raw = orcamento.get("bdi_config")
        bdi_diferenciado = float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0

        if item.bdi_aplicado is not None:
            bdi_aplicado = float(item.bdi_aplicado)
        else:
            bdi_aplicado = bdi_diferenciado if tipo_bdi_item == "DIFERENCIADO" else bdi_padrao

        preco_unitario_bdi = round(preco_unitario * (1 + bdi_aplicado / 100), 2)
        preco_total_bdi = round(item.quantidade * preco_unitario_bdi, 2)

        dados_item = {
            "orcamento_id": orcamento_id,
            "codigo_composicao": item.codigo_composicao,
            "descricao": descricao,
            "quantidade": item.quantidade,
            "unidade": unidade,
            "preco_unitario": preco_unitario,
            "preco_total": preco_total,
            "tipo_bdi_item": tipo_bdi_item,
            "bdi_aplicado": bdi_aplicado,
            "preco_unitario_bdi": preco_unitario_bdi,
            "preco_total_bdi": preco_total_bdi,
            "estado": estado_para_buscar.lower(),
            "fonte": fonte,
            "etapa_id": item.etapa_id,
            "memoria_calculo": item.memoria_calculo,
            "variaveis": item.variaveis,
            "created_at": datetime.now().isoformat()
        }

        novo_item = self.repository.criar(dados_item)
        if not novo_item:
            raise Exception("Erro ao adicionar item")

        self._atualizar_valor_total_orcamento(orcamento_id)

        if self.insumo_repository and isinstance(novo_item, dict):
            self._explodir_insumos(novo_item, orcamento, fonte, estado_para_buscar)
        
        return novo_item

    def listar_itens(self, orcamento_id: str):
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
        quantidade = item_update.quantidade if item_update.quantidade is not None else item_atual.get("quantidade", 1.0)

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
            preco_unitario = float(item_atual.get("preco_unitario") or 0.0)

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

        # Atualização de parâmetros BDI do item
        if item_update.tipo_bdi_item is not None:
            dados_atualizacao["tipo_bdi_item"] = item_update.tipo_bdi_item
        if item_update.bdi_aplicado is not None:
            dados_atualizacao["bdi_aplicado"] = item_update.bdi_aplicado

        # Recálculo de preços com BDI do item
        orcamento = self.orcamento_repository.buscar_por_id(orcamento_id)
        tipo_bdi_item = dados_atualizacao.get("tipo_bdi_item") or item_atual.get("tipo_bdi_item", "PADRAO")
        bdi_padrao = float(orcamento.get("bdi") or 0.0) if orcamento else 0.0
        bdi_config_raw = orcamento.get("bdi_config") if orcamento else {}
        bdi_diferenciado = float(bdi_config_raw.get("bdi_diferenciado", 15.0)) if isinstance(bdi_config_raw, dict) else 15.0

        if "bdi_aplicado" in dados_atualizacao:
            taxa_bdi = float(dados_atualizacao["bdi_aplicado"])
        elif "tipo_bdi_item" in dados_atualizacao:
            taxa_bdi = bdi_diferenciado if tipo_bdi_item == "DIFERENCIADO" else bdi_padrao
            dados_atualizacao["bdi_aplicado"] = taxa_bdi
        else:
            taxa_bdi = float(item_atual.get("bdi_aplicado") or (bdi_diferenciado if tipo_bdi_item == "DIFERENCIADO" else bdi_padrao))

        preco_unit_efetivo = dados_atualizacao.get("preco_unitario") or preco_unitario
        qtd_efetiva = dados_atualizacao.get("quantidade") or float(item_atual.get("quantidade") or 1.0)
        
        dados_atualizacao["preco_unitario_bdi"] = round(preco_unit_efetivo * (1 + taxa_bdi / 100), 2)
        dados_atualizacao["preco_total_bdi"] = round(qtd_efetiva * dados_atualizacao["preco_unitario_bdi"], 2)

        if not dados_atualizacao:
            return item_atual

        item_atualizado = self.repository.atualizar(item_id, dados_atualizacao)
        self._atualizar_valor_total_orcamento(orcamento_id)
        
        return item_atualizado

    def listar_insumos(self, orcamento_id: str, item_id: str):
        item = self.repository.buscar_por_id(item_id, orcamento_id)
        if not item:
            raise ValueError("Item não encontrado")
        if not self.insumo_repository:
            return []
        return self.insumo_repository.listar_por_item(item_id)

    def atualizar_insumo(self, orcamento_id: str, item_id: str, insumo_id: str, dados: dict):
        if not self.insumo_repository:
            raise ValueError("Repositório de insumos não disponível")

        insumo_atual = self.insumo_repository.buscar_por_id(insumo_id)
        if not insumo_atual:
            raise ValueError("Insumo não encontrado")

        qtd = dados.get("quantidade_unitaria", insumo_atual.get("quantidade_unitaria", 0))
        preco_custom = dados.get("preco_unitario_custom")
        
        preco_efetivo = preco_custom if preco_custom is not None else insumo_atual.get("preco_unitario_base", 0)
        
        novo_total_insumo = round(float(qtd) * float(preco_efetivo), 2)

        upd_data = {
            "quantidade_unitaria": qtd,
            "preco_unitario_custom": preco_custom,
            "total": novo_total_insumo
        }

        insumo_upd = self.insumo_repository.atualizar(insumo_id, upd_data)

        insumos = self.insumo_repository.listar_por_item(item_id)
        soma_totais = sum(float(i.get("total") or 0) for i in insumos)
        
        item_pai = self.repository.buscar_por_id(item_id, orcamento_id)
        qtd_pai = float(item_pai.get("quantidade") or 1)

        novo_preco_total_pai = round(soma_totais, 2)
        novo_preco_unitario_pai = round(soma_totais / qtd_pai, 2) if qtd_pai > 0 else 0

        self.repository.atualizar(item_id, {
            "preco_unitario": novo_preco_unitario_pai,
            "preco_total": novo_preco_total_pai
        })

        self._atualizar_valor_total_orcamento(orcamento_id)

        return insumo_upd

    def _explodir_insumos(
        self,
        item: dict,
        orcamento: dict,
        fonte: str,
        estado: str,
    ) -> None:
        try:
            codigo = item.get("codigo_composicao")
            mes = orcamento.get("base_referencia")
            tipo_composicao = orcamento.get("tipo_composicao", "Sem Desoneração")
            quantidade_pai = float(item.get("quantidade", 1))
            item_id = item.get("id")

            filhos = self.item_repository.buscar_filhos_composicao(codigo, mes, fonte)
            if not filhos:
                return

            self.insumo_repository.deletar_por_item(item_id)

            batch = []
            for filho in filhos:
                cod_filho = filho.get("codigo_filho")
                coef = float(filho.get("quantidade_coeficiente") or 0)
                if coef <= 0:
                    continue

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
                    "tipo_item": "MATERIAL",
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
