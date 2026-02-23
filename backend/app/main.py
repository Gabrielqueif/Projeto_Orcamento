import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import itens, orcamentos, orcamento_itens, etapas, sinapi
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
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"INTERNAL SERVER ERROR: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocorreu um erro interno no servidor. Por favor, contate o suporte."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(itens.router)
app.include_router(orcamentos.router)
app.include_router(orcamento_itens.router)
app.include_router(etapas.router)
app.include_router(sinapi.router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


@app.get("/")
def read_root():
    return {"message": "Hello World"}

