---
name: data-validation-suite
description: Schema validation and data quality. Validação robusta de dados e schemas (Zod, Pydantic, Joi).
---

# Data Validation Suite Skill

## Quando usar esta habilidade
- Para validar inputs de API (Requests).
- Para validar variáveis de ambiente (Config).
- Para garantir tipos em tempo de execução (Runtime Type Checking).
- Para sanitizar dados de formulários.

## Por que validar?
- **Segurança**: Previne injeção e dados malformados.
- **Estabilidade**: "Fail fast". Erre na entrada, não no meio do processo.
- **Intellisense**: Bibliotecas modernas inferem tipos estáticos a partir do validador.

## Ferramentas Recomendadas

### TypeScript: Zod (O Padrão Ouro)
```typescript
import { z } from "zod";

const UserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

type User = z.infer<typeof UserSchema>; // Tipo automático!

// Uso
const result = UserSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

### Python: Pydantic
```python
from pydantic import BaseModel, EmailStr, Field

class User(BaseModel):
    username: str = Field(min_length=3)
    email: EmailStr
    age: int | None = None

# Uso
try:
    user = User(username="foo", email="invalid")
except ValueError as e:
    print(e)
```

## Checklist de Validação
- [ ] **Env Vars**: Valide `process.env` no start da aplicação. Se faltar a `DB_URL`, o app nem deve subir.
- [ ] **API Inputs**: Valide body, query params e headers.
- [ ] **External APIs**: Valide o que você recebe de terceiros (não confie cegamente).
- [ ] **Parse, don't validate**: Transforme o dado validado num tipo confiável e use este tipo dali pra frente.
