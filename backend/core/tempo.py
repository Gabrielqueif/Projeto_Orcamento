from datetime import date, datetime, timedelta, timezone

# O Brasil não tem horário de verão desde 2019, então um deslocamento fixo basta
# para decidir o que é "hoje" sem depender do banco de fusos do sistema.
FUSO_BRASIL = timezone(timedelta(hours=-3))


def hoje() -> date:
    return datetime.now(FUSO_BRASIL).date()
