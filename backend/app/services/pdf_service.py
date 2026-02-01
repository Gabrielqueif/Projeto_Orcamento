from fpdf import FPDF
from io import BytesIO
from typing import Any, Dict, List

class PdfService(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 16)
        self.cell(0, 10, 'ORÇAMENTO', align='C', new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}/{{nb}}', align='C')

    def _fmt_moeda(self, valor: float) -> str:
        """Formata valor para BRL (R$ 1.234,56) sem depender de locale do sistema"""
        return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def _fmt_numero(self, valor: float) -> str:
        """Formata numero decimal para BRL (1.234,56)"""
        return f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def gerar_pdf(self, orcamento: Dict[str, Any], itens: List[Dict[str, Any]]) -> bytes:
        self.add_page()
        self.set_font('helvetica', '', 12)

        # Dados do Cliente
        self.set_font('helvetica', 'B', 12)
        self.cell(0, 10, f"Cliente: {orcamento.get('cliente', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', '', 12)
        self.cell(0, 10, f"Obra: {orcamento.get('nome', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 10, f"Data: {orcamento.get('created_at', '')[:10]}", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

        # Tabela de Itens com FPDF2 Table
        self.set_font('helvetica', '', 10)
        
        # Cores para o cabeçalho
        self.set_fill_color(200, 220, 255) # Azul claro
        
        # Layout da tabela
        # col_widths em porcentagem ou proporção relativa (ex: 4, 1, 1, 1)
        # Total largura ~190 (A4 210 - margins 10*2)
        # 100, 30, 30, 30 -> 10, 3, 3, 3
        with self.table(col_widths=(100, 30, 30, 30), first_row_as_headings=False) as table:
            # Cabeçalho
            row = table.row()
            self.set_font('helvetica', 'B', 10)
            row.cell('Descrição', align='L')
            row.cell('Quant.', align='C')
            row.cell('Unitário', align='R')
            row.cell('Total', align='R')
            self.set_font('helvetica', '', 10)

            total_geral = 0.0
            current_etapa_nome = None

            for item in itens:
                # Dados da Etapa
                etapa_data = item.get('orcamento_etapas') or {}
                etapa_nome = etapa_data.get('nome', 'Outros / Sem Etapa')
                
                # Cabeçalho da Etapa (se mudou)
                if etapa_nome != current_etapa_nome:
                    row_etapa = table.row()
                    self.set_font('helvetica', 'B', 9)
                    self.set_fill_color(240, 240, 240) # Cinza claro
                    row_etapa.cell(etapa_nome.upper(), colspan=4, align='L')
                    self.set_font('helvetica', '', 10)
                    current_etapa_nome = etapa_nome

                # Dados do Item
                descricao = item.get('descricao', 'Sem descrição')
                quantidade = float(item.get('quantidade', 0))
                preco_unitario = float(item.get('preco_unitario', 0))
                total_item = quantidade * preco_unitario
                total_geral += total_item

                row = table.row()
                row.cell(descricao, align='L') # Auto-wrap
                row.cell(self._fmt_numero(quantidade), align='C')
                row.cell(self._fmt_moeda(preco_unitario), align='R')
                row.cell(self._fmt_moeda(total_item), align='R')

        self.ln(5)
        
        # Total Geral
        self.set_font('helvetica', 'B', 12)
        self.cell(160, 10, 'TOTAL GERAL:', align='R')
        self.set_fill_color(200, 220, 255)
        self.cell(30, 10, self._fmt_moeda(total_geral), border=1, align='R', fill=True)

        return self.output()
