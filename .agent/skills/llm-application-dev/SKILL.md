---
name: llm-application-dev
description: LLM apps and prompt engineering. Integração com APIs de IA (OpenAI, Anthropic, Gemini), RAG (Retrieval Augmented Generation) e design de prompts.
---

# LLM Application Development Skill

## Quando usar esta habilidade
- Para integrar chamadas de IA em um aplicativo.
- Para projetar Prompts (System Prompts, Few-shot prompting).
- Para construir sistemas RAG (Chat com seus dados).
- Para escolher entre modelos (GPT-4 vs Haiku vs Gemini Flash).

## Engenharia de Prompt (Best Practices)

### 1. Clareza e Contexto
- Dê uma **Persona** ("Você é um especialista em SQL...").
- Defina o **Formato de Saída** ("Responda apenas em JSON...").
- Dê **Exemplos** (Few-shot) se a tarefa for complexa.

### 2. Estratégias de Raciocínio
- **Chain of Thought (CoT)**: "Pense passo a passo antes de responder". Melhora muito a lógica.
- **Tree of Thoughts**: Pedir para gerar 3 soluções e escolher a melhor.

### 3. Prevenção de Alucinação
- Dê contexto (RAG) e instrua: "Responda apenas com base no contexto fornecido. Se não souber, diga que não sabe."

## Arquitetura RAG (Retrieval Augmented Generation)

1.  **Ingestion**: Quebrar documentos (PDF, MD) em chunks.
2.  **Embedding**: Converter chunks em vetores (OpenAI, Voyage AI).
3.  **Storage**: Salvar em Vector DB (Pinecone, Weaviate, pgvector).
4.  **Retrieval**: Buscar chunks similares à pergunta do usuário.
5.  **Generation**: Enviar {Contexto + Pergunta} para o LLM.

## Bibliotecas Comuns
- **LangChain** / **LangGraph**: Frameworks de orquestração (Python/JS).
- **LlamaIndex**: Focado em dados e RAG.
- **Vercel AI SDK**: Ótimo para frontend (React/Next.js) e streaming.
