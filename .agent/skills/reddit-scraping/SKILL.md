---
name: reddit-scraping
description: Coleta os principais posts de um subreddit especificado para análise de tendências e discussões. Use quando precisar extrair dados do Reddit.
---

# Reddit Scraping Skill

## Quando usar esta habilidade
- Quando você precisar monitorar tópicos em alta em uma comunidade específica.
- Quando precisar extrair títulos e URLs para análise de sentimento ou conteúdo.
- Para verificar rapidamente a atividade em um subreddit (ex: n8n, python, news).
- Quando o usuário pedir para listar "top posts" ou "o que está acontecendo" no Reddit.

## Fluxo de Trabalho
1. **Identificar o Subreddit**: Determine qual comunidade alvo (ex: `n8n`).
2. **Executar o Scraper**: Utilize o script fornecido em `scripts/reddit_scraper.py`.
3. **Analisar Saída**: O script retorna os 3 posts "Hot" com Título, Score e URL.

## Instruções
- O script usa a biblioteca `requests`. Certifique-se de que ela está instalada no ambiente (`pip install requests`).
- O script já define um `User-Agent` personalizado para evitar erros de limite de taxa (429).
- **Comando de Execução**:
  ```bash
  python3 .agent/skills/reddit-scraping/scripts/reddit_scraper.py <nome_do_subreddit>
  ```
  *Se nenhum subreddit for fornecido, ele usará `n8n` como exemplo.*

## Recursos
- [Script de Scraping](scripts/reddit_scraper.py): O script Python que realiza a coleta.
- [Exemplo de Saída](examples/output_example.txt): Exemplo do que esperar da execução.
