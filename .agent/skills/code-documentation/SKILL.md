---
name: code-documentation
description: Gera documentação técnica abrangente, explica código complexo e mantém a documentação atualizada. Use quando o usuário pedir para documentar código, criar READMEs ou explicar como algo funciona.
---

# Code Documentation Skill

## Quando usar esta habilidade
- Quando o usuário pedir para documentar um arquivo, função ou classe.
- Quando for necessário criar um README.md ou CONTRIBUTING.md.
- Para explicar trechos de código complexos.
- Para gerar docstrings ou JSDoc/TSDoc.

## Fluxo de Trabalho

### 1. Análise
- Identifique o público-alvo (desenvolvedores, usuários finais, arquitetos).
- Determine o nível de detalhe necessário.
- Verifique padrões existentes no projeto (ex: estilo de docstring).

### 2. Geração de Documentação
- **Para Arquivos**: Comece com um resumo de alto nível do propósito do arquivo.
- **Para Funções/Classes**:
    - Descreva o propósito.
    - Liste parâmetros com tipos e descrições.
    - Descreva o valor de retorno.
    - Liste exceções que podem ser lançadas.
    - **Sempre inclua um exemplo de uso**.
- **Para READMEs**:
    - Título e Descrição curta.
    - Instalação.
    - Como usar (Quick Start).
    - API Reference (se aplicável).
    - Contribuição.

### 3. Explicação de Código
- Use a abordagem "De cima para baixo": explique o que faz, depois como faz.
- Destaque algoritmos chave ou lógicas de negócio complexas.
- Mencione trade-offs ou decisões de design importantes.

## Padrões Recomendados

### Python (Google Style ou NumPy Style)
```python
def function(param1: int) -> bool:
    """Brief description.

    Detailed description if needed.

    Args:
        param1: Description of param1.

    Returns:
        True if success, False otherwise.

    Raises:
        ValueError: If param1 is negative.
    """
```

### TypeScript/JavaScript (TSDoc/JSDoc)
```typescript
/**
 * Brief description.
 *
 * @param param1 - Description of param1
 * @returns True if success
 * @throws {Error} If something goes wrong
 *
 * @example
 * const result = function(10);
 */
```

## Checklist de Qualidade
- [ ] A documentação está atualizada com o código?
- [ ] Os exemplos de código funcionam?
- [ ] A linguagem está clara e concisa?
- [ ] Links internos/externos estão funcionando?
