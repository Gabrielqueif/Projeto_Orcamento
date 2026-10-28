import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.modules.almoxarifado import router as almoxarifado_router
from app.modules.base_propria import router as base_propria_router
from app.modules.busca import router as busca_router
from app.modules.composicao import router as item_router
from app.modules.dashboard import router as dashboard_router
from app.modules.diario import router as diario_router
from app.modules.diario import router_resumo as diario_resumo_router
from app.modules.equipe import router_cargos, router_equipes, router_membros
from app.modules.etapa import router as etapa_router
from app.modules.financeiro import router as financeiro_router
from app.modules.financeiro import router_portfolio as financeiro_portfolio_router
from app.modules.importacao import router as importacao_router
from app.modules.medicao import router as medicao_router
from app.modules.notificacao import router as notificacao_router
from app.modules.obra import router as obra_router
from app.modules.orcamento import router as orcamento_router
from app.modules.perfil import router as perfil_router
from core.config import settings
from core.exceptions import ConflitoError, NaoEncontradoError

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


@app.exception_handler(NaoEncontradoError)
async def nao_encontrado_handler(request: Request, exc: NaoEncontradoError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ConflitoError)
async def conflito_handler(request: Request, exc: ConflitoError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"INTERNAL SERVER ERROR: {exc}", exc_info=True)
    # Em produção não expõe detalhes internos (mensagens de banco, caminhos etc.)
    detail = "Erro interno do servidor"
    if settings.ENVIRONMENT != "production":
        detail = f"{detail}: {exc}"
    headers = {}
    # Este handler roda fora do CORSMiddleware; sem o header o navegador
    # esconderia o 500 atrás de um erro de CORS. Só ecoa origens permitidas.
    origin = request.headers.get("origin")
    if origin and origin in settings.cors_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Vary"] = "Origin"
    return JSONResponse(status_code=500, content={"detail": detail}, headers=headers)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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
app.include_router(router_cargos)
app.include_router(obra_router)
app.include_router(almoxarifado_router)
app.include_router(financeiro_router)
app.include_router(financeiro_portfolio_router)
app.include_router(diario_router)
app.include_router(diario_resumo_router)
app.include_router(medicao_router)
app.include_router(dashboard_router)
app.include_router(notificacao_router)
app.include_router(base_propria_router)
app.include_router(busca_router)
app.include_router(perfil_router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


@app.get("/")
def read_root():
    return {"message": "Hello World"}
