
import pandas as pd
from pathlib import Path

def analyze_seinfra(file_path, report_file):
    with open(report_file, "a", encoding="utf-8") as f_out:
        f_out.write(f"\n--- Analisando: {file_path} ---\n")
        try:
            df = pd.read_excel(file_path, header=None)
            all_text = " ".join(df.fillna("").astype(str).values.flatten()).upper()
            
            keywords = {
                "RODOVIAS / PAVIMENTAÇÃO": ["RODOVIA", "ASFALTO", "PAVIMENTO", "MEIO-FIO", "ESTRADA"],
                "SANEAMENTO / HIDRÁULICA": ["ESGOTO", "TUBO PVC", "DRENAGEM", "MANILHA", "ÁGUA POTÁVEL", "ADUTORA"],
                "ELÉTRICA / ILUMINAÇÃO": ["POSTE", "CABO ELÉTRICO", "LUMINÁRIA", "SUBESTAÇÃO", "TRANSFORMADOR"],
                "TELEFONIA / DADOS": ["FIBRA ÓPTICA", "CABO TELEFÔNICO", "TELEFONIA"],
                "URBANISMO / PAISAGISMO": ["ÁRVORE", "GRAMA", "BANCO", "PRAÇA", "PLAYGROUND"],
                "EDIFICAÇÕES (CONSTRUÇÃO CIVIL)": ["ALVENARIA", "TIJOLO", "REBOCO", "PISO", "TELHADO", "CONCRETO"]
            }
            
            f_out.write("Distribuição de tópicos encontrados (contagem de palavras-chave):\n")
            for category, terms in keywords.items():
                count = sum(all_text.count(term) for term in terms)
                f_out.write(f"- {category}: {count} ocorrências\n")
                
            f_out.write("\nExemplos de itens de Infraestrutura (Não-Construção):\n")
            infra_terms = keywords["RODOVIAS / PAVIMENTAÇÃO"] + keywords["SANEAMENTO / HIDRÁULICA"] + keywords["ELÉTRICA / ILUMINAÇÃO"]
            found_infra = []
            for idx, row in df.iterrows():
                row_str = " ".join([str(v) for v in row.values if pd.notna(v)]).upper()
                if any(term in row_str for term in infra_terms):
                    found_infra.append(row_str[:120])
                    if len(found_infra) >= 15: break
            
            for item in found_infra:
                f_out.write(f"  > {item}\n")

        except Exception as e:
            f_out.write(f"Erro ao ler {file_path}: {e}\n")

report_path = "scripts/diagnostics/seinfra_analysis_report.txt"
with open(report_path, "w", encoding="utf-8") as f:
    f.write("RELATÓRIO DE DIVERSIDADE DE CONTEÚDO - SEINFRA\n")

files = [
    "planilhas/Tabela-de-Insumos-028.1---ENC.-SOCIAIS-84,44.xls",
    "planilhas/Composicoes-028.1---ENC.-SOCIAIS-84,44.xls"
]

for f in files:
    path = Path(f)
    if path.exists():
        analyze_seinfra(path, report_path)
    else:
        abs_path = Path("/app") / f
        if abs_path.exists():
             analyze_seinfra(abs_path, report_path)
