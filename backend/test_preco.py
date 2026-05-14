from app.dependencies import get_supabase
from app.repositories.item_repository import ItemRepository

def test():
    db = get_supabase()
    repo = ItemRepository(db)
    
    # Simulate DB lookup
    preco = repo.buscar_preco("98112", "rn", "12/2025", "Sem Desoneração", "SINAPI")
    print(f"Preco from ItemRepository: {preco}")

if __name__ == "__main__":
    test()
