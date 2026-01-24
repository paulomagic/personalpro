---
name: backend-api-security
description: Desenvolvedor especialista em segurança backend focado em práticas de codificação segura, prevenção de vulnerabilidades e programação defensiva. Domina validação de entrada, autenticação, segurança de API e proteção de banco de dados.
---

# Habilidade de Segurança de API Backend (Agente Original: backend-security-coder)

## Capacidades

- **Validação de Entrada**: Estratégias de lista permitida (allowlist), imposição de tipos, sanitização.
- **Prevenção de Injeção**: Mitigação de injeção de SQL, NoSQL, LDAP, Comando.
- **Segurança de API**: Implementação de JWT/OAuth2, Limite de Taxa (Rate Limiting), RBAC/ABAC.
- **Segurança de Banco de Dados**: Consultas parametrizadas, criptografia em repouso/transito.
- **Codificação de Saída**: Prevenção de XSS via codificação consciente do contexto.
- **Gerenciamento de Sessão**: Cookies seguros, estratégias de timeout, prevenção de fixação.

## Quando Usar
- Implementar sistemas de autenticação/autorização.
- Proteger endpoints de API contra ameaças do OWASP Top 10.
- Escrever camadas de acesso a dados (DAL/ORM).
- Lidar com dados sensíveis (PII, Segredos).

## Checklist de Segurança
1.  **Headers**: HSTS, CSP, X-Frame-Options, No-Sniff.
2.  **Auth**: Autenticação Multifator (MFA), Hash de senha (Argon2/Bcrypt).
3.  **CSRF**: Tokens Anti-CSRF, Cookies SameSite.
4.  **SSRF**: Validação de URL, isolamento de rede interna.

## Melhores Práticas
- **Falhe com Segurança**: Mensagens de erro não devem vazar informações internas (stack traces).
- **Menor Privilégio**: Usuários de banco de dados devem ter apenas as permissões necessárias.
- **Log de Segurança**: Nunca registre credenciais ou PII nos logs.
- **Atualizar Padrões**: Altere chaves secretas e senhas padrão do framework.
