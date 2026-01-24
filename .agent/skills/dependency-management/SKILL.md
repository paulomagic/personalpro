---
name: dependency-management
description: Auditoria de dependências e gestão de versões. Identifica vulnerabilidades, atualiza pacotes desatualizados e garante a segurança da cadeia de suprimentos de software.
---

# Dependency Management Skill

## Quando usar esta habilidade
- Para atualizar dependências (npm, pip, cargo, etc.).
- Para corrigir vulnerabilidades de segurança (CVEs).
- Para auditar o estado atual das dependências.
- Ao adicionar novas bibliotecas ao projeto.

## Fluxo de Trabalho

### 1. Auditoria
- Verifique vulnerabilidades conhecidas.
- Liste pacotes desatualizados.
- Verifique a saúde dos pacotes (manutenção, licença).

### 2. Atualização
- **Minor/Patch**: Geralmente seguras para atualizar automaticamente.
- **Major**: Requerem leitura do changelog e testes manuais/automatizados cuidadosos devido a breaking changes.

### 3. Manutenção
- Use lockfiles (`package-lock.json`, `poetry.lock`, `Cargo.lock`) para garantir reprodutibilidade.
- Remova dependências não utilizadas.

## Comandos Comuns

### JavaScript/TypeScript (npm/yarn/pnpm)
- Auditoria: `npm audit`
- Checar desatualizados: `npm outdated`
- Atualizar: `npm update` (minor/patch) ou `npm install <package>@latest`

### Python (pip/poetry)
- Auditoria: `pip-audit`
- Checar desatualizados: `pip list --outdated`
- Poetry: `poetry show --outdated`, `poetry update`

### Rust (cargo)
- Auditoria: `cargo audit`
- Atualizar: `cargo update` (dentro das restrições do Cargo.toml)

### Go
- Checar: `go list -m -u all`
- Atualizar: `go get -u ./...`

## Checklist de Segurança
- [ ] Lockfiles estão commitados?
- [ ] `npm audit` (ou equivalente) roda no CI?
- [ ] Dependências de dev (`devDependencies`) estão separadas?
- [ ] Licenças são compatíveis com o projeto?
