from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import itens, orcamentos, orcamento_itens, etapas
from core.config import settings

app = FastAPI(title="Projeto Orçamento", version="1.0.0")

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor: " + str(exc)},
    )



origins = settings.ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,    # Libera as origens configuradas
    allow_credentials=True,
    allow_methods=["*"],      # Libera GET, POST, DELETE, etc.
    allow_headers=["*"],
)

app.include_router(itens.router)
app.include_router(orcamentos.router)
app.include_router(orcamento_itens.router)
app.include_router(etapas.router)