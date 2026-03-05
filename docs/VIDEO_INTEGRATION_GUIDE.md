# Guia de Integração de Vídeos - Personal Pro

## 📋 Resumo do Problema Resolvido

### Situação Inicial
- **Supino Reto Barra**: Botão "Ver Execução" funcionava ✅
- **Leg Press 45**: Botão "Ver Execução" NÃO aparecia ❌

### Causa Raiz
O sistema tinha um **bug de matching de nomes**:
1. Treinos salvos tinham: `"Leg Press 45"`
2. Banco de dados tinha: `"Leg Press 45°"` (com símbolo de grau)
3. A query fazia **match exato** → Não encontrava → Sem vídeo

### Solução Implementada
Alteramos a lógica de hydration para:
1. Buscar **TODOS** os exercícios com vídeo (não filtrar por nome)
2. Fazer **match normalizado** no código (remove símbolos, acentos, espaços)
3. Resultado: `"legpress45"` = `"legpress45"` ✅

---

## 🎯 Como Adicionar Vídeos (Processo Correto)

### Passo 1: Upload do Vídeo no YouTube
1. Acesse seu canal privado no YouTube
2. Faça upload do vídeo de execução
3. Configure como **Não listado**
4. Copie o link (ex: `https://youtu.be/ABC123`)

### Passo 2: Atualizar o Banco de Dados
Execute no **Supabase SQL Editor**:

```sql
-- Verificar se o exercício existe
SELECT id, slug, name, video_url 
FROM exercises 
WHERE name ILIKE '%Nome do Exercício%';

-- Adicionar o vídeo
UPDATE exercises 
SET 
  video_url = 'https://youtu.be/SEU_LINK_AQUI',
  updated_at = NOW()
WHERE name ILIKE '%Nome do Exercício%';

-- Confirmar atualização
SELECT id, slug, name, video_url, updated_at
FROM exercises 
WHERE name ILIKE '%Nome do Exercício%';
```

### Passo 3: Testar
1. Abra o app no celular/navegador
2. Entre em qualquer treino que tenha esse exercício
3. O botão "Ver Execução" deve aparecer automaticamente
4. **Não precisa recriar treinos!** A hydration injeta o vídeo em tempo real

---

## 🔧 Como Funciona a Hydration

### Arquitetura
```
┌─────────────────────┐
│  Treino Salvo (DB)  │
│  {                  │
│    name: "Leg Press"│
│    videoUrl: null   │ ← Treino antigo sem vídeo
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  hydrateWorkoutWithVideos()         │
│  1. Busca TODOS exercícios com vídeo│
│  2. Normaliza nomes (fuzzy match)   │
│  3. Injeta videoUrl nos exercícios  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Treino Hidratado   │
│  {                  │
│    name: "Leg Press"│
│    videoUrl: "..."  │ ← Vídeo injetado!
│  }                  │
└─────────────────────┘
```

### Código Relevante
**Arquivo:** `services/exerciseService.ts`

```typescript
export async function hydrateWorkoutWithVideos(workout: any) {
  // 1. Busca TODOS exercícios com vídeo
  const { data: dbExercises } = await supabase
    .from('exercises')
    .select('slug, name, video_url')
    .not('video_url', 'is', null);

  // 2. Normaliza nomes (remove símbolos, acentos, espaços)
  const normalize = (str: string) => {
    return str.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  // 3. Cria mapa: nome normalizado → URL
  const videoMap = new Map();
  dbExercises.forEach(ex => {
    videoMap.set(normalize(ex.name), ex.video_url);
  });

  // 4. Injeta vídeos nos exercícios do treino
  exercises.forEach(ex => {
    if (!ex.videoUrl) {
      const url = videoMap.get(normalize(ex.name));
      if (url) ex.videoUrl = url;
    }
  });
}
```

---

## ⚠️ Problemas Comuns e Soluções

### Problema 1: "Adicionei vídeo mas não aparece"
**Causa:** Nome do exercício no treino ≠ nome no banco

**Solução:**
```sql
-- Verificar nomes exatos
SELECT DISTINCT name FROM exercises WHERE name ILIKE '%leg press%';

-- Verificar o que está no treino (via console do navegador)
console.log(workout.splits[0].exercises.map(e => e.name));
```

### Problema 2: "Funciona para alguns exercícios mas não para outros"
**Causa:** `video_url` está `null` no banco

**Solução:**
```sql
-- Listar exercícios SEM vídeo
SELECT name, slug FROM exercises WHERE video_url IS NULL;

-- Adicionar vídeos em massa
UPDATE exercises 
SET video_url = 'https://youtu.be/LINK'
WHERE slug IN ('exercicio-1', 'exercicio-2');
```

### Problema 3: "Vídeo não carrega (erro 404)"
**Causa:** Link do YouTube incorreto ou vídeo privado

**Solução:**
1. Verificar se o vídeo está **Não listado** (não Privado)
2. Testar o link em aba anônima
3. Usar formato curto: `https://youtu.be/ABC123`

---

## 📝 Checklist de Adição de Vídeo

- [ ] Upload do vídeo no YouTube (Não listado)
- [ ] Copiar link do vídeo
- [ ] Executar SQL no Supabase para atualizar `exercises.video_url`
- [ ] Verificar no SQL Editor que o update funcionou
- [ ] Testar no app (recarregar página)
- [ ] Confirmar que botão "Ver Execução" aparece
- [ ] Confirmar que modal de vídeo abre corretamente

---

## 🚀 Próximos Passos

### Adicionar Vídeos em Massa
```sql
-- Template para múltiplos exercícios
UPDATE exercises 
SET video_url = CASE 
  WHEN slug = 'agachamento-livre' THEN 'https://youtu.be/LINK1'
  WHEN slug = 'supino-inclinado' THEN 'https://youtu.be/LINK2'
  WHEN slug = 'rosca-direta' THEN 'https://youtu.be/LINK3'
  ELSE video_url
END,
updated_at = NOW()
WHERE slug IN ('agachamento-livre', 'supino-inclinado', 'rosca-direta');
```

### Criar Interface Admin (Futuro)
- Tela para upload de vídeos via UI
- Preview do vídeo antes de salvar
- Busca de exercícios sem vídeo
- Upload em lote

---

## 📚 Referências Técnicas

### Arquivos Modificados
- `services/exerciseService.ts` - Função `hydrateWorkoutWithVideos()`
- `services/supabase/domains/workoutsDomain.ts` - Chamada da hydration em `getCurrentWorkoutByClient()`
- `views/StudentView.tsx` - Renderização do botão "Ver Execução"
- `components/VideoPlayerModal.tsx` - Modal de exibição

### Commits Relevantes
- `05971fb` - fix: hydration now fetches all exercises with videos for fuzzy matching
- `9b11ca2` - feat: add YouTube video to Leg Press and implement dynamic workout hydration

### Testes Realizados
- ✅ Verificação de permissões RLS na tabela `exercises`
- ✅ Query de exercícios com vídeo
- ✅ Normalização de strings (fuzzy match)
- ✅ Build local sem erros
- ✅ Deploy em produção

---

## 💡 Lições Aprendidas

1. **Sempre use fuzzy matching** para nomes de exercícios (símbolos variam)
2. **Teste permissões RLS** antes de assumir que queries funcionam
3. **Logs são essenciais** para debug (`console.log('[Hydration] ...')`)
4. **Cache de PWA** pode esconder problemas - sempre testar em aba anônima
5. **Normalização de strings** resolve 90% dos problemas de matching

---

**Última atualização:** 26/01/2026  
**Autor:** Antigravity AI Assistant
