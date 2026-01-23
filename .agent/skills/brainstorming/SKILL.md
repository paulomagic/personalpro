---
name: brainstorming
description: "Você DEVE usar isso antes de qualquer trabalho criativo - criar recursos, construir componentes, adicionar funcionalidades ou modificar comportamento. Explora a intenção do usuário, requisitos e design antes da implementação."
---

# Brainstorming: Ideias em Designs

## Visão Geral

Ajude a transformar ideias em designs e especificações totalmente formados por meio de um diálogo colaborativo natural.

Comece entendendo o contexto atual do projeto, depois faça perguntas uma de cada vez para refinar a ideia. Assim que entender o que está construindo, apresente o design em pequenas seções (200-300 palavras), verificando após cada seção se parece correto até agora.

## O Processo

**Entendendo a ideia:**
- Verifique o estado atual do projeto primeiro (arquivos, documentos, commits recentes)
- Faça perguntas uma de cada vez para refinar a ideia
- Prefira perguntas de múltipla escolha quando possível, mas abertas também são boas
- Apenas uma pergunta por mensagem - se um tópico precisar de mais exploração, divida em múltiplas perguntas
- Foque no entendimento: propósito, restrições, critérios de sucesso

**Explorando abordagens:**
- Proponha 2-3 abordagens diferentes com prós e contras (trade-offs)
- Apresente opções de forma conversacional com sua recomendação e raciocínio
- Comece com sua opção recomendada e explique o porquê

**Apresentando o design:**
- Assim que acreditar que entende o que está construindo, apresente o design
- Divida em seções de 200-300 palavras
- Pergunte após cada seção se parece correto até agora
- Cubra: arquitetura, componentes, fluxo de dados, tratamento de erros, testes
- Esteja pronto para voltar e esclarecer se algo não fizer sentido

## Após o Design

**Documentação:**
- Escreva o design validado em `docs/plans/YYYY-MM-DD-<topico>-design.md`
- Use outras skills de escrita se disponíveis
- Comite o documento de design no git

**Implementação (se continuar):**
- Pergunte: "Pronto para configurar para implementação?"
- Use `planning` (anteriormente `writing-plans`) para criar um plano de implementação detalhado

## Princípios Chave

- **Uma pergunta por vez** - Não sobrecarregue com múltiplas perguntas
- **Múltipla escolha preferida** - Mais fácil de responder do que abertas quando possível
- **YAGNI impiedosamente** - Remova funcionalidades desnecessárias de todos os designs
- **Explore alternativas** - Sempre proponha 2-3 abordagens antes de decidir
- **Validação incremental** - Apresente o design em seções, valide cada uma
- **Seja flexível** - Volte e esclareça quando algo não fizer sentido
