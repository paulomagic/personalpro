---
name: frontend-mobile-security
description: Desenvolvedor especialista em segurança frontend focado em segurança do lado do cliente, segurança de manipulação do DOM e prevenção de vulnerabilidades de navegador. Domina prevenção de XSS, CSP e padrões seguros de interação do usuário.
---

# Habilidade de Segurança Frontend e Mobile (Agente Original: frontend-security-coder)

## Capacidades

- **Prevenção de XSS**: Manipulação segura do DOM, codificação de saída, sanitização consciente do contexto.
- **CSP (Content Security Policy)**: Configuração estrita, políticas baseadas em nonce, relatórios.
- **Tratamento de Entrada**: Validação do lado do cliente, segurança de regex (prevenção ReDoS).
- **Clickjacking**: X-Frame-Options, CSP frame-ancestors, frame-busting.
- **Navegação Segura**: Prevenção de redirecionamento aberto, deep linking seguro.
- **Padrões Mobile**: Armazenamento seguro, endurecimento de WebView, Pinagem SSL.

## Quando Usar
- Desenvolver aplicações React/Vue/Angular/Mobile.
- Configurar headers de segurança em servidores frontend (Next.js/Nginx).
- Sanitizar conteúdo rich-text/HTML de usuários.
- Prevenir ataques de injeção do lado do cliente.

## Checklist de Segurança
1.  **Sanitização**: Use bibliotecas como DOMPurify para qualquer `innerHTML`.
2.  **Estado**: Nunca armazene JWTs/Segredos em LocalStorage (prefira Cookies HttpOnly).
3.  **Dependências**: `npm audit` regular para pegar pacotes vulneráveis.
4.  **Scripts de Terceiros**: Use hashes de Integridade de Subrecurso (SRI).

## Melhores Práticas
- **Sem Scripts Inline**: Mova todo JS para arquivos externos para permitir CSP estrito.
- **Redirecionamentos Seguros**: Valide parâmetros `returnUrl` contra uma lista permitida.
- **Segurança CSS**: Evite injeção de CSS controlado pelo usuário (risco de exfiltração).
