class NaoEncontradoError(ValueError):
    """Recurso não encontrado. Herda de ValueError para compatibilidade com os `except ValueError` existentes."""


class ConflitoError(ValueError):
    """Operação em conflito com o estado atual (código duplicado, registro em uso). Responde 409."""
