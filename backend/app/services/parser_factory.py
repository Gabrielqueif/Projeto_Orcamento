from .base_excel_parser import BaseExcelParser
from .sinapi_excel_parser import SinapiExcelParser
# from .seinfra_excel_parser import SeinfraExcelParser # Futuro

def get_parser(file_content: bytes, source_type: str = "SINAPI") -> BaseExcelParser:
    """
    Fábrica para retornar a instância correta de parser baseada na fonte.
    """
    if source_type.upper() == "SINAPI":
        return SinapiExcelParser(file_content)
    
    # Adicionar novas fontes aqui
    # if source_type.upper() == "SEINFRA":
    #     return SeinfraExcelParser(file_content)
        
    raise ValueError(f"Fonte de dados '{source_type}' não suportada atualmente.")
