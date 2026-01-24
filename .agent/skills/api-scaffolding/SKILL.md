---
name: api-scaffolding
description: Geração de arquitetura e boilerplate para APIs REST e GraphQL. Cria a estrutura inicial seguindo padrões como Clean Architecture ou N-Tier.
---

# API Scaffolding Skill

## Quando usar esta habilidade
- Para iniciar uma nova API do zero.
- Para adicionar um novo recurso (resource) a uma API existente (novo CRUD).
- Para gerar estrutura de pastas e arquivos padrão.

## Padrões de Arquitetura Suportados

### 1. N-Tier (Camadas) - Padrão "Controller-Service-Repository"
Ideal para aplicações CRUD simples a médias.
- **Controllers/Routes**: Recebem requisição HTTP, validam input, chamam Service.
- **Services**: Lógica de negócio pura.
- **Repositories/DAO**: Acesso a dados (SQL, NoSQL).
- **Models/DTOs**: Definição de dados e transferência.

### 2. Clean Architecture / Hexagonal
Ideal para aplicações complexas e de longa duração.
- **Domain**: Entidades e regras de negócio centrais (sem dependências).
- **Use Cases**: Lógica de aplicação especifica.
- **Adapters/Interfaces**: Controladores, Gateways de Banco de Dados.
- **Infrastructure**: Frameworks, Drivers, Configuração.

## Exemplo de Estrutura (FastAPI/Python)

```
app/
├── api/
│   └── v1/
│       └── endpoints/
│           └── users.py
├── core/
│   └── config.py
├── crud/
│   └── crud_user.py
├── models/
│   └── user.py
├── schemas/
│   └── user.py
└── main.py
```

## Fluxo de Geração
1.  **Definir Modelo**: Comece definindo os dados (Schema/Model).
2.  **Criar CRUD/Repository**: Operações básicas de banco.
3.  **Criar Service (Opcional)**: Se houver lógica de negócio complexa.
4.  **Criar Controller/Endpoint**: Expor via HTTP.
5.  **Registrar Rotas**: Adicionar ao roteador principal.

## Instruções
Ao pedir para criar uma API, o usuário deve especificar:
- Linguagem (Python, Node.js, Go, etc.)
- Framework (FastAPI, Express, Gin, etc.)
- Tipo de API (REST, GraphQL)
