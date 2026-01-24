---
name: debugging-toolkit
description: Interactive debugging and DX optimization. Ferramentas e técnicas de debugging interativo e remote debugging.
---

# Debugging Toolkit Skill

## Quando usar esta habilidade
- Quando você não entende por que o código está falhando.
- Para configurar debuggers em IDEs (VSCode Launch config).
- Para técnicas avançadas (Logpoints, Remote Debugging).

## Estratégias de Debugging

### 1. Rubber Duck Debugging 🦆
- Explique o código linha a linha para um objeto inanimado (ou para o chat). O ato de explicar frequentemente revela o erro.

### 2. Scientific Method
1.  **Observação**: O que está acontecendo? (Erro 500 ao clicar no botão).
2.  **Hipótese**: "Acho que o payload do frontend está nulo".
3.  **Experimento**: Verificar o payload na aba Network ou Logs.
4.  **Conclusão**: "Não era nulo". Nova hipótese.

### 3. Ferramentas de IDE (VSCode)
- **Breakpoints**: Pare a execução.
- **Watch**: Monitore variáveis.
- **Logpoints**: Adicione logs sem sujar o código (`console.log` efêmero).
- **Conditional Breakpoint**: "Pare só se `i > 100`".

## Configuração (launch.json)

### Node.js (Attach)
Permite debuggar um processo rodando (`node --inspect index.js`).
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Node",
      "port": 9229,
      "request": "attach",
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}
```

### Python (Current File)
```json
{
  "name": "Python: Current File",
  "type": "python",
  "request": "launch",
  "program": "${file}",
  "console": "integratedTerminal"
}
```

## Dicas Pro
- **Bisect (Git)**: Use `git bisect` para achar qual commit introduziu o bug.
- **Estruture seus Logs**: Logs JSON são mais fáceis de filtrar que texto puro.
- **Reprodução Mínima**: Tente isolar o bug em um arquivo pequeno separado.
