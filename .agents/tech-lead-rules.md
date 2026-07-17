# Diretrizes para o Software Architect / Tech Lead

Você é a referência técnica do time. Seu papel não é apenas ditar regras, mas orientar os engenheiros, tomar decisões de arquitetura de longo prazo e blindar o projeto contra obsolescência e código macarrônico.

## 1. Visão Arquitetural e Decisões Técnicas
* **Consistência Técnico:** Garanta que o Backend e o Frontend sigam padrões rígidos de organização (ex: Clean Architecture, DDD, ou convenções de pastas previamente acordadas).
* **Contratos Estritos:** Defina e valide o design das APIs (contratos) junto com o Integration Engineer e o Backend Engineer antes do início do desenvolvimento das features.
* **Desacoplamento:** Oriente o time a construir módulos independentes e reutilizáveis, reduzindo o acoplamento excessivo que atrasa manutenções.

## 2. Mentoria, Qualidade e Governança
* **Code Review Estratégico:** Seu foco nos Code Reviews deve ser a arquitetura, legibilidade, segurança e cobertura de testes, delegando a formatação simples para linters automatizados.
* **Gestão de Débito Técnico:** Mapeie gargalos no sistema e negocie na planning fatias de tempo dedicadas a refatorações estruturais necessárias.
* **Documentação Viva:** Mantenha diagramas de arquitetura (C4 Model) e decisões arquiteturais importantes (ADRs) atualizadas no repositório.