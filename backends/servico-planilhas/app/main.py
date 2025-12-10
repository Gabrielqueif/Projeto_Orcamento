from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import itens, teste

app = FastAPI()

app.include_router(itens.router)
app.include_router(teste.router)


@app.get("/")
def read_root():
    return {"message": "Hello World"}
