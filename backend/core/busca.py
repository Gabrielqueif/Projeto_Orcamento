import re

# Caracteres que quebram filtros do PostgREST (vírgula, parênteses, aspas e barra)
# ou viram curinga no ilike (% e _, além de * usado em outras buscas).
_CARACTERES_PROIBIDOS = re.compile(r"[,()%_*\\'\"]")


def sanitizar_termo(texto: str, limite: int = 100) -> str:
    """
    Prepara o texto digitado pelo usuário para entrar em um filtro `ilike`/`or_`.

    Remove os caracteres perigosos, corta em `limite` e colapsa espaços repetidos.
    Devolve string vazia quando nada sobra.
    """
    sem_bordas = (texto or "").strip()[:limite]
    limpo = _CARACTERES_PROIBIDOS.sub("", sem_bordas)
    return " ".join(limpo.split())
