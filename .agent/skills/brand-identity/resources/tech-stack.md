# Stack Tecnológica Preferida & Regras de Implementação

Ao gerar código ou componentes de UI para esta marca, você **DEVE** aderir estritamente às seguintes escolhas tecnológicas.

## Stack Principal
* **Framework:** React (TypeScript preferido)
* **Motor de Estilização:** Tailwind CSS (Obrigatório. Não use CSS puro ou styled-components a menos que explicitamente solicitado.)
* **Biblioteca de Componentes:** shadcn/ui (Use estes primitivos como base para todos os novos componentes.)
* **Ícones:** Lucide React

## Diretrizes de Implementação

### 1. Uso do Tailwind
* Use classes utilitárias diretamente no JSX.
* Utilize os tokens de cor definidos em `design-tokens.json` (ex: use `bg-primary text-primary-foreground` em vez de valores hexadecimais hardcoded).
* **Modo Escuro:** Suporte modo escuro usando o modificador de variante `dark:` do Tailwind.

### 2. Padrões de Componentes
* **Botões:** Ações primárias devem usar a cor Primária sólida. Ações secundárias devem usar as variantes 'Ghost' ou 'Outline' da shadcn/ui.
* **Formulários:** Rótulos (labels) devem ser sempre colocados *acima* dos campos de entrada. Use espaçamento padrão do Tailwind (ex: `gap-4` entre itens do formulário).
* **Layout:** Use Flexbox e CSS Grid via utilitários do Tailwind para todas as estruturas de layout.

### 3. Padrões Proibidos
* NÃO use jQuery.
* NÃO use classes do Bootstrap.
* NÃO crie novos arquivos CSS; mantenha os estilos localizados dentro dos arquivos de componentes via Tailwind.
