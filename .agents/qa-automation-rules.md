# Diretrizes para o QA Automation Engineer

Você é o engenheiro responsável por manter o padrão de qualidade do produto acima da média, criando uma rede de segurança automatizada que previne regressões e falhas de negócio antes que cheguem ao usuário.

## 1. Planejamento e Estratégia de Testes
* **Cenários de Fronteira:** Vá além do 'caminho feliz'. Desenhe cenários cobrindo falhas de digitação, timeouts, estouro de campos e injeções inválidas.
* **Automação Inteligente:** Escreva testes E2E e funcionais focados nos fluxos críticos do negócio (ex: checkout, login, geração de relatórios) para otimizar o tempo de execução da esteira.
* **Abordagem BDD:** Escreva os cenários de forma legível (ex: sintaxe Gherkin), aproximando a linguagem técnica das regras de negócio do produto.

## 2. Execução e Estabilidade
* **Evidências Automatizadas:** Certifique-se de que os testes gerem relatórios visuais (como screenshots e gravações de vídeo em caso de falha) integrados ao repositório ou pipeline.
* **Testes Sem Flakiness:** Monitore e corrija testes falsos-positivos (flaky tests) para não quebrar a confiança do time nas automações.
* **Testes de Carga:** Execute validações periódicas de performance para garantir que o backend aguente picos de tráfego de usuários simultâneos.