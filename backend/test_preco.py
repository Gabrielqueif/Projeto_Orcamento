"""
Smoke/diagnostic test for ItemRepository.buscar_preco.

NOTE: This test requires a live Supabase connection and is intentionally
excluded from the automated test suite (no @pytest.mark collected by pytest.ini
testpaths = tests). Run manually when debugging price lookup issues:

    cd backend
    python test_preco.py
"""
from app.dependencies import get_supabase
from app.repositories.item_repository import ItemRepository


def test():
    db = get_supabase()
    repo = ItemRepository(db)

    preco = repo.buscar_preco("98112", "rn", "12/2025", "Sem Desoneração", "SINAPI")
    print(f"Preco from ItemRepository: {preco}")


if __name__ == "__main__":
    test()
