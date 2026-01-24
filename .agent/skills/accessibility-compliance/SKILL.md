---
name: accessibility-compliance
description: WCAG auditing and inclusive design. Garante que o software seja utilizável por pessoas com deficiências visuais, motoras, auditivas ou cognitivas.
---

# Accessibility Compliance Skill

## Quando usar esta habilidade
- Durante o design de UI (contraste, tamanho de fonte).
- Durante o desenvolvimento Frontend (ARIA, HTML semântico).
- Para auditorias de conformidade legal (Lei Brasileira de Inclusão, ADA).

## Princípios WCAG (POUR)

### 1. Perceivable (Perceptível)
- **Texto Alternativo**: Imagens devem ter `alt=""`.
- **Legendas**: Vídeos devem ter legendas.
- **Contraste**: Texto/Fundo deve ter razão mínima de 4.5:1 (AA).

### 2. Operable (Operável)
- **Teclado**: Tudo deve ser acessível apenas com Tab/Enter/Espaço. Sem "mouse traps".
- **Foco Visível**: O elemento focado deve ter um contorno claro (`outline`).
- **Tempo**: Se houver limite de tempo, o usuário deve poder estender.

### 3. Understandable (Compreensível)
- **Idioma**: A tag `<html lang="pt-br">` deve estar correta.
- **Consistência**: A navegação deve ser igual em todas as páginas.
- **Erros**: Mensagens de erro devem ser claras e sugerir correção.

### 4. Robust (Robusto)
- **HTML Semântico**: Use `<button>`, `<nav>`, `<main>` corretamente. Não faça `<div onclick="...">`.
- **Compatibilidade**: Deve funcionar em Leitores de Tela (NVDA, VoiceOver, JAWS).

## Checklist Rápido
- [ ] Consigo navegar no site inteiro só com o TAB?
- [ ] O contraste de cores passa na ferramenta (ex: WebAIM)?
- [ ] Todas as imagens informativas têm `alt`? (Decorativas devem ter `alt=""` vazio).
- [ ] Formulários têm `<label>` conectados aos inputs?
