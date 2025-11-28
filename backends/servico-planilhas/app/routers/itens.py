# Exemplo no router:
from schemas.schemas import ItemCreate
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db # Importa a dependência

router = APIRouter()

@router.get("/itens")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    # 'db' agora é sua sessão SQLAlchemy pronta para uso!
    # ... lógica de inserção usando SQLAlchemy (orm.add(), orm.commit())
    return {"status": "Item created"}