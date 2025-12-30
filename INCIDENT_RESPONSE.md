# 🚨 Plano de Resposta a Incidentes (IRP)

**Nível de Confidencialidade:** Interno
**Última Atualização:** 2025-12-29

Este documento define os procedimentos padrão para detectar, responder e recuperar de incidentes de segurança no PersonalPro.

## 👥 1. Funções e Responsabilidades (Equipe de Resposta)

| Função | Responsabilidade | Contato Primário |
|--------|------------------|------------------|
| **Incident Commander** | Coordena a resposta, toma decisões críticas | `@PauloRicardo` |
| **Tech Lead / Dev** | Investigação técnica, correção de código | `@DevTeam` |
| **Comunicação** | Notifica usuários afetados (se necessário) | `@Support` |

## 🔄 2. Ciclo de Vida do Incidente

### Fase 1: Detecção e Análise
**Gatilhos:**
- Logs de erro anômalos no Supabase (`ai_logs`, `activity_logs`).
- Alerta de usuário sobre comportamento estranho.
- Falha na verificação automatizada (`npm run security-check`).

**Ações:**
1. Validar se é um falso positivo.
2. Classificar severidade (Baixa, Média, Alta, Crítica).
3. Abrir issue/ticket de incidente.

### Fase 2: Contenção
**Objetivo:** Parar o sangramento.

**Ações Imediatas (Exemplos):**
- **Vazamento de Chave:** Rotacionar chaves no painel Supabase/Vercel imediatamente.
- **Ataque DDoS:** Ativar "Under Attack Mode" no Cloudflare.
- **Abuso de API:** Revogar sessões de usuários suspeitos via Supabase Auth.
- **Bug Crítico:** Reverter deploy (`git revert` + deploy).

### Fase 3: Erradicação e Recuperação
**Objetivo:** Remover a causa raiz e restaurar o serviço.

1. Aplicar patch de correção (Hotfix).
2. Verificar integridade dos dados (tabelas afetadas).
3. Monitorar logs por 1 hora após a correção.

### Fase 4: Pós-Incidente (Post-Mortem)
**Obrigatório para severidade Alta/Crítica.**
1. O que aconteceu?
2. Por que aconteceu?
3. O que faremos para evitar que se repita?
4. Atualizar `SECURITY_CHECKLIST.md` se necessário.

## 📞 3. Matrix de Escalonamento

| Nível | Descrição | Quem Acionar | Tempo de Resposta |
|-------|-----------|--------------|-------------------|
| **P1 - Crítico** | Vazamento de dados, Sistema Offline | Commander + Dev Imediato | < 30 min |
| **P2 - Alto** | Funcionalidade Core quebrada, Falha de Auth | Dev Imediato | < 1 hora |
| **P3 - Médio** | Bug funcional, Lentidão | Dev (Horário Comercial) | < 4 horas |
| **P4 - Baixo** | Visual, Typos | Backlog | N/A |

## 🛠️ 4. Ferramentas Úteis
- **Logs:** Painel Supabase > Logs
- **Vercel:** Dashboard > Deployments
- **Git:** `git log`, `git revert`

---
*Em caso de dúvida, peque pelo excesso de cautela. Acione o Incident Commander.*
