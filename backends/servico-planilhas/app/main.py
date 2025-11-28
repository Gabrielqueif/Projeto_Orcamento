from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import itens

app = FastAPI()

app.include_router(itens.router)


@app.get("/")
def read_root():
    return {"message": "Hello World"}
