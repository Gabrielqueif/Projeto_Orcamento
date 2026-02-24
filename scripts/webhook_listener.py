#!/usr/bin/env python3
"""
Webhook Listener para Auto-Deploy
Escuta webhooks do GitHub e executa o deploy automaticamente.
"""

import hashlib
import hmac
import json
import logging
import os
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# Configuração
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")
DEPLOY_SCRIPT = "/home/gpobras/Projeto_Orcamento/scripts/deploy.sh"
BRANCH = "main"
PORT = 9000

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("/home/gpobras/webhook.log"),
    ],
)
logger = logging.getLogger("webhook")


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verifica a assinatura HMAC do GitHub."""
    if not WEBHOOK_SECRET:
        logger.warning("WEBHOOK_SECRET não configurado! Aceitando sem verificação.")
        return True

    if not signature:
        return False

    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


def run_deploy():
    """Executa o script de deploy em background."""
    logger.info("Iniciando deploy...")
    try:
        result = subprocess.run(
            ["bash", DEPLOY_SCRIPT],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutos máximo
        )
        if result.returncode == 0:
            logger.info(f"Deploy concluído com sucesso!\n{result.stdout[-500:]}")
        else:
            logger.error(f"Deploy falhou!\nSTDOUT: {result.stdout[-500:]}\nSTDERR: {result.stderr[-500:]}")
    except subprocess.TimeoutExpired:
        logger.error("Deploy excedeu o timeout de 5 minutos!")
    except Exception as e:
        logger.error(f"Erro ao executar deploy: {e}")


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/webhook":
            self.send_response(404)
            self.end_headers()
            return

        # Ler payload
        content_length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(content_length)

        # Verificar assinatura
        signature = self.headers.get("X-Hub-Signature-256", "")
        if not verify_signature(payload, signature):
            logger.warning("Assinatura inválida! Rejeitando webhook.")
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b'{"error": "Invalid signature"}')
            return

        # Processar evento
        event = self.headers.get("X-GitHub-Event", "")
        logger.info(f"Evento recebido: {event}")

        if event == "push":
            try:
                data = json.loads(payload)
                ref = data.get("ref", "")
                branch = ref.split("/")[-1] if "/" in ref else ref

                if branch == BRANCH:
                    logger.info(f"Push na branch '{BRANCH}' detectado. Iniciando deploy...")
                    # Executa em thread separada para não bloquear a resposta
                    thread = threading.Thread(target=run_deploy)
                    thread.start()

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(b'{"status": "deploy iniciado"}')
                else:
                    logger.info(f"Push na branch '{branch}' ignorado (esperando '{BRANCH}').")
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'{"status": "branch ignorada"}')
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "Invalid JSON"}')
        elif event == "ping":
            logger.info("Ping recebido do GitHub!")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status": "pong"}')
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status": "evento ignorado"}')

    def do_GET(self):
        if self.path == "/webhook/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        """Silencia logs do HTTP server (usamos nosso próprio logger)."""
        logger.debug(f"{self.client_address[0]} - {args}")


if __name__ == "__main__":
    if not WEBHOOK_SECRET:
        logger.warning("⚠️  WEBHOOK_SECRET não definido! Configure no .env para segurança.")

    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    logger.info(f"🚀 Webhook listener rodando na porta {PORT}")
    logger.info(f"📌 Esperando pushes na branch: {BRANCH}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Webhook listener encerrado.")
        server.server_close()
