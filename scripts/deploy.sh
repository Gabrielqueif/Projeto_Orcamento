#!/bin/bash
# ===========================================
# Script de Deploy Automático - Projeto Orçamento
# ===========================================

set -e

PROJECT_DIR="/home/gpobras/Projeto_Orcamento"
LOG_FILE="/home/gpobras/deploy.log"
COMPOSE_FILE="docker-compose.prod.yml"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== DEPLOY INICIADO =========="

# 1. Entrar no diretório do projeto
cd "$PROJECT_DIR"

# 2. Fazer git pull
log "Fazendo git pull..."
git pull origin main 2>&1 | tee -a "$LOG_FILE"

# 3. Parar containers
log "Parando containers..."
docker-compose -f "$COMPOSE_FILE" down 2>&1 | tee -a "$LOG_FILE"

# 4. Rebuild e subir
log "Fazendo build e subindo containers..."
docker-compose -f "$COMPOSE_FILE" up -d --build 2>&1 | tee -a "$LOG_FILE"

# 5. Aguardar healthchecks
log "Aguardando healthchecks (30s)..."
sleep 30

# 6. Verificar status
log "Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}" 2>&1 | tee -a "$LOG_FILE"

# 7. Verificar se todos estão healthy
UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null)
if [ -n "$UNHEALTHY" ]; then
    log "⚠️  AVISO: Containers unhealthy: $UNHEALTHY"
    exit 1
else
    log "✅ Deploy concluído com sucesso!"
fi

log "========== DEPLOY FINALIZADO =========="
