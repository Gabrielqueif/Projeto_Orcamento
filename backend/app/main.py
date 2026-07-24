import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.modules.item import router as item_router
from app.modules.orcamento import router as orcamento_router
from app.modules.etapa import router as etapa_router
from app.modules.importacao import router as importacao_router
from app.modules.equipe import router_equipes, router_membros
from app.modules.obra import router as obra_router
from app.modules.almoxarifado import router as almoxarifado_router
from app.modules.financeiro import router as financeiro_router, router_portfolio as financeiro_portfolio_router
from core.config import settings


# Configurar logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("projeto_orcamento")

app = FastAPI(
    title="Projeto Orçamento",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    status_code = 400
    msg = str(exc).lower()
    if "não encontrado" in msg or "not found" in msg:
        status_code = 404
        
    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"INTERNAL SERVER ERROR: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erro interno do servidor: {str(exc)}"},
        headers={"Access-Control-Allow-Origin": "*"}
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(item_router)
app.include_router(orcamento_router)
app.include_router(etapa_router)
app.include_router(importacao_router)
app.include_router(router_equipes)
app.include_router(router_membros)
app.include_router(obra_router)
app.include_router(almoxarifado_router)
app.include_router(financeiro_router)
app.include_router(financeiro_portfolio_router)



@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


@app.get("/")
def read_root():
    return {"message": "Hello World"}

