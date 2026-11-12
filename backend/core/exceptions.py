class NaoEncontradoError(ValueError):
    """Recurso não encontrado. Herda de ValueError para compatibilidade com os `except ValueError` existentes."""


class AcessoNegadoError(ValueError):
    """Usuário autenticado sem permissão para a operação nesta obra (ex.: membro tentando aprovar). Responde 403."""


class ConflitoError(ValueError):
    """Operação em conflito com o estado atual (código duplicado, registro em uso). Responde 409."""
