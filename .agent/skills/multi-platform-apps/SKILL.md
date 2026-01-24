---
name: multi-platform-apps
description: Cross-platform app coordination (web/iOS/Android). Estratégias para compartilhamento de código entre React Native, Flutter e Web.
---

# Multi-Platform Apps Skill

## Quando usar esta habilidade
- Ao construir um produto que deve funcionar em Web, iOS e Android.
- Para decidir entre Nativo, Cross-Platform ou PWA.
- Para organizar repositórios (Monorepo vs Polyrepo) em projetos multi-plataforma.

## Estratégias de Desenvolvimento

### 1. React Native (JS/TS)
- **Foco**: "Learn once, write anywhere".
- **Web**: React Native for Web (Twitter/X usa isso).
- **Compartilhamento**: Lógica de negócio (Hooks, Context, Utils) é 100% compartilhável. UI é adaptável.

### 2. Flutter (Dart)
- **Foco**: Renderização própria (Skia). Pixel perfect em todas as plataformas.
- **Web**: Funciona, mas o SEO e carregamento inicial podem ser piores que HTML nativo.
- **Compartilhamento**: Quase 100% de código compartilhado.

### 3. Progressive Web Apps (PWA)
- **Foco**: Web First. Instale como app.
- **Limitações**: Sem acesso a algumas APIs nativas (Bluetooth em iOS, Push Notifications limitadas em iOS antigo).
- **Custo**: Mais barato, só precisa de devs Web.

## Arquitetura de Compartilhamento (ex: Monorepo Turborepo)
```
apps/
  web/ (Next.js)
  mobile/ (React Native)
packages/
  ui/ (Componentes visuais compartilhados - Tamagui/NativeBase)
  core/ (Lógica de negócio, Zod Schemas, API Clients)
  tsconfig/ (Configurações TypeScript)
```

## Checklist de Decisão
- [ ] O app precisa de performance extrema (Jogos/Edição de Vídeo)? -> **Nativo (Swift/Kotlin)**.
- [ ] O time só sabe JS/React? -> **React Native**.
- [ ] O design é muito customizado e inovador? -> **Flutter**.
- [ ] É um app de conteúdo/e-commerce simples? -> **PWA/React Native**.
