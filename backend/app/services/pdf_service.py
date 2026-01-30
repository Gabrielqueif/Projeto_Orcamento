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

    def gerar_pdf(self, orcamento: Dict[str, Any], itens: List[Dict[str, Any]]) -> bytes:
        self.add_page()
        self.set_font('helvetica', '', 12)

        # Dados do Cliente
        self.set_font('helvetica', 'B', 12)
        self.cell(0, 10, f"Cliente: {orcamento.get('cliente', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.set_font('helvetica', '', 12)
        self.cell(0, 10, f"Obra: {orcamento.get('nome', 'Não informado')}", new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 10, f"Data: {orcamento.get('created_at', '')[:10]}", new_x="LMARGIN", new_y="NEXT")
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

        for item in itens:
            descricao = item.get('descricao', 'Sem descrição')
            quantidade = float(item.get('quantidade', 0))
            preco_unitario = float(item.get('preco_unitario', 0))
            total_item = quantidade * preco_unitario
            total_geral += total_item

            self.cell(100, 10, descricao[:50], border=1) # Limita caracteres por enquanto
            self.cell(30, 10, f"{quantidade:.2f}", border=1, align='C')
            self.cell(30, 10, f"R$ {preco_unitario:.2f}", border=1, align='R')
            self.cell(30, 10, f"R$ {total_item:.2f}", border=1, align='R', new_x="LMARGIN", new_y="NEXT")

        self.ln(5)
        
        # Total Geral
        self.set_font('helvetica', 'B', 12)
        self.cell(160, 10, 'TOTAL GERAL:', align='R')
        self.cell(30, 10, f"R$ {total_geral:.2f}", border=1, align='R', fill=True)

        return self.output()
