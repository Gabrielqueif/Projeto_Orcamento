from fpdf import FPDF
from io import BytesIO
from typing import Any, Dict, List, Optional

class PdfService(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 16)
        self.cell(0, 10, 'ORÇAMENTO', align='C', new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}/{{nb}}', align='C')

    def _formatar_real(self, valor: float) -> str:
        # Formata valor no padrão brasileiro R$ 1.000,00 ou R$ 540,00
        try:
            valor = float(valor)
            partes = f"{valor:.2f}".split('.')
            inteiro = partes[0]
            decimal = partes[1]
            
            sinal = "-" if inteiro.startswith("-") else ""
            if sinal:
                inteiro = inteiro[1:]
                
            acumulado = []
            for i, char in enumerate(reversed(inteiro)):
                if i > 0 and i % 3 == 0:
                    acumulado.append('.')
                acumulado.append(char)
                
            inteiro_formatado = "".join(reversed(acumulado))
            return f"{sinal}R$ {inteiro_formatado},{decimal}"
        except (ValueError, TypeError):
            return "R$ 0,00"

    def _render_row(self, indent: str, number_str: str, description: str, quant_str: str, unitario_str: str, total_str: str, fill: bool = False):
        line_h = 6
        full_text = f"{indent}{number_str}. {description}" if number_str else f"{indent}{description}"
        
        # Calcula a quebra de texto usando o dry_run do multi_cell
        lines = self.multi_cell(w=100, h=line_h, text=full_text, dry_run=True, output='LINES')
        num_lines = max(1, len(lines))
        row_h = num_lines * line_h
        
        # Verifica se cabe na página corrente, caso contrário força quebra de página
        if self.get_y() + row_h > self.page_break_trigger:
            self.add_page()
            
        start_x = self.get_x()
        start_y = self.get_y()
        
        # Renderiza a descrição
        self.multi_cell(w=100, h=line_h, text=full_text, border=1, fill=fill)
        
        # Renderiza as colunas de quantidade, unitário e total com a mesma altura calculada
        self.set_xy(start_x + 100, start_y)
        self.cell(w=30, h=row_h, text=quant_str, border=1, align='C', fill=fill)
        self.cell(w=30, h=row_h, text=unitario_str, border=1, align='R', fill=fill)
        self.cell(w=30, h=row_h, text=total_str, border=1, align='R', fill=fill, new_x="LMARGIN", new_y="NEXT")

    def _render_stage_row(self, prefix: str, name: str, subtotal_str: str, depth: int):
        line_h = 7
        
        # Escolhe o estilo visual dependendo do nível hierárquico
        if depth == 1:
            self.set_font('helvetica', 'B', 10)
            self.set_fill_color(220, 235, 255)  # Fundo azul-claro
            fill = True
        elif depth == 2:
            self.set_font('helvetica', 'B', 9)
            self.set_fill_color(245, 247, 250)  # Fundo cinza-claro
            fill = True
        else:
            self.set_font('helvetica', 'BI', 9)
            self.set_fill_color(255, 255, 255)
            fill = False

        full_text = f"{prefix}. {name}"
        
        # Calcula quebra de texto da descrição da etapa
        lines = self.multi_cell(w=160, h=line_h, text=full_text, dry_run=True, output='LINES')
        num_lines = max(1, len(lines))
        row_h = num_lines * line_h
        
        # Verifica quebra de página
        if self.get_y() + row_h > self.page_break_trigger:
            self.add_page()
            
        start_x = self.get_x()
        start_y = self.get_y()
        
        # Renderiza descrição da etapa (ocupando 160 de largura)
        self.multi_cell(w=160, h=line_h, text=full_text, border=1, fill=fill)
        
        # Renderiza o subtotal da etapa
        self.set_xy(start_x + 160, start_y)
        self.cell(w=30, h=row_h, text=subtotal_str, border=1, align='R', fill=fill, new_x="LMARGIN", new_y="NEXT")

    def gerar_pdf(self, orcamento: Dict[str, Any], itens: List[Dict[str, Any]], etapas: Optional[List[Dict[str, Any]]] = None) -> bytes:
        if not etapas:
            return self._gerar_pdf_plano(orcamento, itens)
            
        # 1. Processar e estruturar as etapas hierarquicamente
        stages_by_id = {e['id']: {**e, 'children': []} for e in etapas}
        roots = []
        for e in stages_by_id.values():
            parent_id = e.get('parent_id')
            if parent_id and parent_id in stages_by_id:
                stages_by_id[parent_id]['children'].append(e)
            else:
                roots.append(e)
                
        # Ordenar etapas de cada nível por ordem, depois por data ou nome
        roots.sort(key=lambda x: (x.get('ordem') or 0, x.get('created_at') or '', x.get('nome') or ''))
        for e in stages_by_id.values():
            e['children'].sort(key=lambda x: (x.get('ordem') or 0, x.get('created_at') or '', x.get('nome') or ''))

        # 2. Agrupar itens por etapa_id
        itens_by_etapa = {}
        itens_sem_etapa = []
        for item in itens:
            e_id = item.get('etapa_id')
            if e_id and e_id in stages_by_id:
                if e_id not in itens_by_etapa:
                    itens_by_etapa[e_id] = []
                itens_by_etapa[e_id].append(item)
            else:
                itens_sem_etapa.append(item)

        # 3. Calcular subtotais acumulados recursivamente para cada etapa
        def calculate_subtotal(node):
            subtotal = sum(float(i.get('quantidade', 0)) * float(i.get('preco_unitario', 0)) for i in itens_by_etapa.get(node['id'], []))
            for child in node.get('children', []):
                subtotal += calculate_subtotal(child)
            node['subtotal'] = subtotal
            return subtotal

        for root in roots:
            calculate_subtotal(root)

        # 4. Renderizar a página de cabeçalho
        self.add_page()
        self.set_font('helvetica', '', 12)

        # Dados do Cliente
        self.set_font('helvetica', 'B', 12)
        self.cell(0, 10, f"Cliente: {orcamento.get('cliente', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', '', 12)
        self.cell(0, 10, f"Obra: {orcamento.get('nome', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 10, f"Fonte: {orcamento.get('fonte', 'SINAPI')} | Data Ref: {orcamento.get('base_referencia', '')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 10, f"Emitido em: {orcamento.get('created_at', '')[:10]}", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)

        # Cabeçalho da Tabela
        self.set_font('helvetica', 'B', 10)
        self.set_fill_color(200, 220, 255)
        self.cell(100, 10, 'Descrição', border=1, fill=True)
        self.cell(30, 10, 'Quant.', border=1, align='C', fill=True)
        self.cell(30, 10, 'Unitário', border=1, align='R', fill=True)
        self.cell(30, 10, 'Total', border=1, align='R', fill=True, new_x="LMARGIN", new_y="NEXT")

        # 5. Função recursiva para renderizar a árvore de etapas
        def render_node(node, prefix):
            depth = len(prefix.split('.'))
            
            # Renderizar etapa usando o helper de etapa
            self._render_stage_row(prefix, node['nome'], self._formatar_real(node['subtotal']), depth)

            # Renderizar itens diretos desta etapa
            self.set_font('helvetica', '', 9)
            indent = "  " * depth
            for item_idx, item in enumerate(itens_by_etapa.get(node['id'], [])):
                descricao = item.get('descricao', 'Sem descrição')
                quantidade = float(item.get('quantidade', 0))
                preco_unitario = float(item.get('preco_unitario', 0))
                total_item = quantidade * preco_unitario

                item_number = f"{prefix}.{item_idx + 1}"
                self._render_row(
                    indent=indent,
                    number_str=item_number,
                    description=descricao,
                    quant_str=f"{quantidade:.2f}",
                    unitario_str=self._formatar_real(preco_unitario),
                    total_str=self._formatar_real(total_item)
                )

            # Renderizar sub-etapas recursivamente
            for idx, child in enumerate(node.get('children', [])):
                render_node(child, f"{prefix}.{idx + 1}")

        # Renderizar etapas raiz
        for idx, root in enumerate(roots):
            render_node(root, str(idx + 1))

        # Renderizar itens sem etapa vinculada
        if itens_sem_etapa:
            self.set_font('helvetica', 'B', 10)
            self.set_fill_color(240, 240, 240)
            subtotal_sem_etapa = sum(float(i.get('quantidade', 0)) * float(i.get('preco_unitario', 0)) for i in itens_sem_etapa)
            self._render_stage_row("Outros", "Itens sem etapa vinculada", self._formatar_real(subtotal_sem_etapa), depth=2)

            self.set_font('helvetica', '', 9)
            for item_idx, item in enumerate(itens_sem_etapa):
                descricao = item.get('descricao', 'Sem descrição')
                quantidade = float(item.get('quantidade', 0))
                preco_unitario = float(item.get('preco_unitario', 0))
                total_item = quantidade * preco_unitario

                self._render_row(
                    indent="",
                    number_str=str(item_idx + 1),
                    description=descricao,
                    quant_str=f"{quantidade:.2f}",
                    unitario_str=self._formatar_real(preco_unitario),
                    total_str=self._formatar_real(total_item)
                )

        # 6. Calcular Totais Finais
        total_direto = sum(float(i.get('quantidade', 0)) * float(i.get('preco_unitario', 0)) for i in itens)
        bdi = float(orcamento.get('bdi') or 0.0)
        valor_bdi = total_direto * (bdi / 100)
        valor_venda = total_direto + valor_bdi

        self.ln(5)
        self.set_font('helvetica', '', 10)
        self.cell(160, 8, 'CUSTO DIRETO TOTAL:', align='R')
        self.cell(30, 8, self._formatar_real(total_direto), border=1, align='R')
        self.ln(8)

        self.cell(160, 8, f'BDI ({bdi:.2f}%):', align='R')
        self.cell(30, 8, self._formatar_real(valor_bdi), border=1, align='R')
        self.ln(10)

        # Total Geral (Preço de Venda)
        self.set_font('helvetica', 'B', 12)
        self.set_fill_color(240, 240, 240)
        self.cell(160, 10, 'PREÇO DE VENDA TOTAL:', align='R')
        self.cell(30, 10, self._formatar_real(valor_venda), border=1, align='R', fill=True)

        return self.output()

    def _gerar_pdf_plano(self, orcamento: Dict[str, Any], itens: List[Dict[str, Any]]) -> bytes:
        self.add_page()
        self.set_font('helvetica', '', 12)

        # Dados do Cliente
        self.set_font('helvetica', 'B', 12)
        self.cell(0, 10, f"Cliente: {orcamento.get('cliente', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', '', 12)
        self.cell(0, 10, f"Obra: {orcamento.get('nome', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 10, f"Fonte: {orcamento.get('fonte', 'SINAPI')} | Data Ref: {orcamento.get('base_referencia', '')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 10, f"Emitido em: {orcamento.get('created_at', '')[:10]}", new_x="LMARGIN", new_y="NEXT")
        self.ln(10)

        # Cabeçalho da Tabela
        self.set_font('helvetica', 'B', 10)
        self.set_fill_color(200, 220, 255)
        self.cell(100, 10, 'Descrição', border=1, fill=True)
        self.cell(30, 10, 'Quant.', border=1, align='C', fill=True)
        self.cell(30, 10, 'Unitário', border=1, align='R', fill=True)
        self.cell(30, 10, 'Total', border=1, align='R', fill=True, new_x="LMARGIN", new_y="NEXT")

        # Itens
        self.set_font('helvetica', '', 10)
        total_geral = 0.0

        for idx, item in enumerate(itens):
            descricao = item.get('descricao', 'Sem descrição')
            quantidade = float(item.get('quantidade', 0))
            preco_unitario = float(item.get('preco_unitario', 0))
            total_item = quantity * preco_unitario if 'quantity' in locals() else quantidade * preco_unitario  # Let's write it standardly:
            total_item = quantidade * preco_unitario
            total_geral += total_item

            self._render_row(
                indent="",
                number_str=str(idx + 1),
                description=descricao,
                quant_str=f"{quantidade:.2f}",
                unitario_str=self._formatar_real(preco_unitario),
                total_str=self._formatar_real(total_item)
            )

        self.ln(5)
        
        # Totais
        total_direto = total_geral
        bdi = float(orcamento.get('bdi') or 0.0)
        valor_bdi = total_direto * (bdi / 100)
        valor_venda = total_direto + valor_bdi

        self.set_font('helvetica', '', 10)
        self.cell(160, 8, 'CUSTO DIRETO TOTAL:', align='R')
        self.cell(30, 8, self._formatar_real(total_direto), border=1, align='R')
        self.ln(8)

        self.cell(160, 8, f'BDI ({bdi:.2f}%):', align='R')
        self.cell(30, 8, self._formatar_real(valor_bdi), border=1, align='R')
        self.ln(10)

        # Total Geral (Preço de Venda)
        self.set_font('helvetica', 'B', 12)
        self.set_fill_color(240, 240, 240)
        self.cell(160, 10, 'PREÇO DE VENDA TOTAL:', align='R')
        self.cell(30, 10, self._formatar_real(valor_venda), border=1, align='R', fill=True)

        return self.output()
