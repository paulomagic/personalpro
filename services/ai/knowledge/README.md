# Training Knowledge Base

Base de conhecimento científica para guiar decisões do AI Training Engine.

## Estrutura

```
knowledge/
├── README.md           # Este arquivo
├── volume.ts           # Guidelines de volume por grupo muscular
├── frequency.ts        # Frequência ótima de treino
├── progression.ts      # Modelos de progressão
├── periodization.ts    # Estratégias de periodização
├── recovery.ts         # Tempos de recuperação
└── sources.md          # Referências científicas
```

## Fontes Principais

- **NSCA** - National Strength and Conditioning Association
- **Renaissance Periodization** - Dr. Mike Israetel, Dr. James Hoffmann
- **Brad Schoenfeld** - Meta-análises de hipertrofia
- **Eric Helms** - Muscle & Strength Pyramids
- **Tudor Bompa** - Periodização clássica

## Como a IA Usa

1. `trainingEngine.ts` consulta `volume.ts` para definir sets por grupo
2. `selectTemplate()` considera frequência ótima de `frequency.ts`
3. `calculateScore()` usa dados de `recovery.ts` para evitar overtraining
