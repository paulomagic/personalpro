---
name: database-migrations
description: Database migration automation. Manage schema changes logically, version control database states, and ensure safe deployments and rollbacks.
---

# Database Migrations Skill

## Quando usar esta habilidade
- Para alterar o schema do banco de dados (criar tabela, alterar coluna).
- Para manter o banco de dados em sincronia entre Dev, Staging e Prod.
- Para reverter mudanças problemáticas (Rollback).

## Conceitos Chave
- **Migration**: Um arquivo (script) que descreve uma alteração no banco.
- **Up**: O comando para aplicar a mudança.
- **Down**: O comando para reverter a mudança.
- **Versionamento**: O timestamp ou ID sequencial que ordena as migrations.
- **Tabela de Controle**: Uma tabela no banco (ex: `alembic_version`, `schema_migrations`) que rastreia qual versão está aplicada.

## Fluxo de Trabalho Seguro

### 1. Criar Migration
- Gere automaticamente se a ferramenta permitir (ex: `alembic revision --autogenerate`).
- **SEMPRE revise o SQL gerado**. Ferramentas automáticas erram (especialmente com renames).

### 2. Testar Localmente
- Rode `upgrade head` (aplica).
- Rode `downgrade -1` (reverte).
- Rode `upgrade head` novamente.
- Verifique se os dados foram preservados corretamente.

### 3. Deploy
- O comando de migração deve rodar no pipeline de CD *antes* do deploy da nova versão do app (geralmente).
- **Non-blocking changes**: Evite travar tabelas grandes. Use `CONCURRENTLY` para criar índices em Postgres.

## Ferramentas Comuns

### Python
- **Alembic** (para SQLAlchemy)
- **Django Migrations** (Built-in)

### Node.js / TypeScript
- **Prisma Migrate**
- **TypeORM Migrations**
- **Knex.js**

### Go
- **Golang-Migrate**
- **Goose**

## Checklist de Segurança
- [ ] A migration tem `down` method (rollback)?
- [ ] A migration trava banco (lock)?
- [ ] Existe backup antes de rodar em produção?
- [ ] A mudança é retrocompatível com o código antigo rodando? (Básico para Zero Downtime Deploy).
