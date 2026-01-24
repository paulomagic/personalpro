---
name: security-compliance
description: Conformidade para SOC2, HIPAA, GDPR e LGPD. Fornece checklists e diretrizes para garantir que o software atenda aos requisitos regulatórios de proteção de dados.
---

# Security Compliance Skill

## Quando usar esta habilidade
- Ao iniciar um projeto que lida com dados sensíveis (PII, PHI).
- Durante auditorias de segurança (SOC2, ISO 27001).
- Para implementar controles de privacidade (GDPR/LGPD).
- Para responder a questionários de segurança de vendors.

## Frameworks Principais

### 1. GDPR / LGPD (Privacidade)
- **Direito ao Esquecimento**: O sistema deve permitir deletar todos os dados de um usuário.
- **Consentimento**: Cookies e coleta de dados devem ser opt-in explícito.
- **Minimização de Dados**: Colete apenas o necessário.
- **Portabilidade**: O usuário pode baixar seus dados em formato legível (JSON/CSV).

### 2. SOC 2 (Empresas de Tecnologia/SaaS)
- **Segurança**: Firewalls, WAF, 2FA, criptografia em repouso e trânsito.
- **Disponibilidade**: DRP (Disaster Recovery Plan), Backups testados.
- **Confidencialidade**: Controles de acesso (RBAC), princípio do menor privilégio.

### 3. HIPAA (Saúde - EUA)
- **Criptografia**: Obrigatória para todos os dados de pacientes (PHI).
- **Audit Logs**: Quem acessou o registro de qual paciente e quando? (Imutável).
- **BAA**: Contratos assinados com todos os fornecedores de cloud.

## Checklist de Implementação Técnica
- [ ] **Encryption at Rest**: Banco de dados criptografado (AES-256).
- [ ] **Encryption in Transit**: TLS 1.2+ obrigatório em tudo.
- [ ] **Audit Trails**: Logs centralizados de acesso e modificação.
- [ ] **Data Retention Policy**: Job automático para limpar dados antigos.
- [ ] **Access Control**: Revisão trimestral de acessos.
