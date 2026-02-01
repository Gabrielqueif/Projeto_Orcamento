# Guia de Deploy

Este projeto é containerizado usando Docker, facilitando o deploy em qualquer plataforma que suporte containers Docker.

## Pré-requisitos

- [Docker](https://www.docker.com/) instalado na sua máquina ou servidor.
- [Git](https://git-scm.com/) para clonar o repositório.
- Credenciais do Supabase (URL e Chaves).

## Variáveis de Ambiente

Crie um arquivo `.env` no diretório raiz (ou configure-as no seu provedor de nuvem) com as seguintes variáveis:

```env
SUPABASE_URL=sua_supabase_url
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
SUPABASE_ANON_KEY=sua_anon_key
```

## Rodando Localmente com Docker Compose

Para rodar a aplicação inteira (Frontend + Backend) localmente:

1.  **Build e Iniciar:**
    ```bash
    docker-compose up --build
    ```

2.  **Acesso:**
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Documentação do Backend: [http://localhost:8000/docs](http://localhost:8000/docs)

## Deploy em Produção

### Opção 1: Docker Compose (VPS/Servidor Dedicado)

Este é o método recomendado para servidores dedicados (ex: DigitalOcean Droplet, AWS EC2, Hetzner, etc.).

#### 1. Configuração do Servidor
Garanta que seu servidor esteja rodando uma distribuição Linux (Ubuntu 20.04/22.04 LTS recomendado).

**Instalar Docker & Git:**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose git
sudo systemctl enable --now docker
```

#### 2. Obter o Código
Clone o repositório para o seu servidor:
```bash
git clone https://github.com/Gabrielqueif/Projeto_Orcamento.git
cd Projeto_Orcamento
```

#### 3. Configurar Ambiente
Crie o arquivo `.env` com suas chaves de produção:
```bash
nano .env
```
Cole suas variáveis:
```env
SUPABASE_URL=sua_url_supabase_prod
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_prod
SUPABASE_ANON_KEY=sua_anon_key_prod
ALLOWED_ORIGINS=http://seu-ip-servidor:3000,http://seu-dominio.com
```

#### 4. Rodar em Modo de Produção
Use o arquivo compose específico de produção que usa `gunicorn` para o backend e políticas de reinicialização:

```bash
# Build e iniciar em modo detached (segundo plano)
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

#### 5. Verificar status
Verifique se os containers estão rodando:
```bash
sudo docker ps
```

Para ver os logs se algo der errado:
```bash
sudo docker-compose -f docker-compose.prod.yml logs -f
```

#### (Opcional) Proxy Reverso Nginx
Para um setup profissional, você deve usar Nginx para escutar na porta 80/443 e encaminhar o tráfego para seus containers, e usar Certbot para SSL (HTTPS).

Exemplo simples de configuração Nginx (`/etc/nginx/sites-available/orcamento`):
```nginx
server {
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000; # Encaminha requisições começando com /api/ para o backend
        # Nota: Você pode precisar ajustar o prefixo do backend ou regras de reescrita dependendo das suas rotas
    }
}
```

### Opção 3: Self-Hosting (Servidor Caseiro / Notebook Antigo)

Se você quer usar seu laptop como um servidor para acessar dentro da sua Wi-Fi ou via internet.

#### 1. Preparar o Laptop
- **SO**: Linux (Ubuntu Server) é recomendado para performance, mas Windows com Docker Desktop também funciona.
- **Energia**: Configure o laptop para **nunca suspender** quando a tampa estiver fechada.

#### 2. Acesso na Rede Local
1.  Encontre o **Endereço IP Privado** do seu laptop:
    - Windows: `ipconfig` (IPv4, geralmente `192.168.x.x`)
    - Linux: `hostname -I`
2.  Siga as instruções da **Opção 1**, mas no `.env`, defina `ALLOWED_ORIGINS` para incluir o IP do seu laptop:
    ```env
    ALLOWED_ORIGINS=http://localhost:3000,http://192.168.1.15:3000
    ```
    *(Substitua `192.168.1.15` pelo seu IP real)*

3.  Rode o arquivo compose de produção:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

4.  Acessar de outros dispositivos na sua Wi-Fi:
    Abra `http://192.168.1.15:3000` no seu celular ou outro PC.

#### 3. Acesso da Internet (Opcional)
Para acessar seu sistema de fora de casa com segurança (sem abrir portas no roteador), use **Cloudflare Tunnel** (grátis):

1.  Inscreva-se no Cloudflare Zero Trust.
2.  Instale o conector `cloudflared` no seu laptop.
3.  Aponte um domínio (ex: `orcamento.meudominio.com`) para `http://localhost:3000`.
