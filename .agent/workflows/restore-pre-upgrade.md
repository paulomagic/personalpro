---
description: Restaurar o app para o estado anterior ao upgrade Student Mode (paleta azul, sem convites)
---

# Restaurar para v1.0-pre-student-upgrade

Este workflow restaura o Personal PRO para o estado **antes** do upgrade Student Mode.

## Informações do Backup
- **Tag**: `v1.0-pre-student-upgrade`
- **Commit**: `83bcf0b` (main em 07/01/2026)
- **Hash completo**: `1b0044613e880f75da34fea3b950137c5c16b03c`
- **Descrição**: Paleta azul original, sem sistema de convites, antes das mudanças UI/UX

## Passos para Restaurar

### Opção 1: Restauração Total (recomendado)

// turbo-all
```bash
# 1. Certifique-se de estar na pasta do projeto
cd /Users/pauloricardo/Desktop/apex---premium-pt-assistant

# 2. Salve qualquer trabalho não commitado (opcional)
git stash

# 3. Volte para a tag de backup
git checkout v1.0-pre-student-upgrade

# 4. Se quiser criar uma nova branch a partir deste ponto
git checkout -b restore-pre-upgrade

# 5. Se quiser RESETAR main para este ponto (cuidado!)
git checkout main
git reset --hard v1.0-pre-student-upgrade
git push origin main --force
```

### Opção 2: Restaurar arquivos específicos

```bash
# Restaurar apenas o CSS (cores)
git checkout v1.0-pre-student-upgrade -- index.css

# Restaurar apenas o App.tsx
git checkout v1.0-pre-student-upgrade -- App.tsx

# Restaurar uma view específica
git checkout v1.0-pre-student-upgrade -- views/LoginView.tsx
```

### Opção 3: Ver diferenças antes de restaurar

```bash
# Ver o que mudou desde o backup
git diff v1.0-pre-student-upgrade..HEAD

# Ver apenas arquivos modificados
git diff --name-only v1.0-pre-student-upgrade..HEAD
```

## Rollback do Banco de Dados

Se migrações SQL foram aplicadas, será necessário reverter manualmente:

```sql
-- Executar no Supabase SQL Editor
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS user_profiles;
```

## Verificação

Após restaurar:
1. Rodar `npm run dev`
2. Verificar se cores são AZUIS (não verdes)
3. Verificar se login funciona normalmente
4. Verificar se não há erros no console
