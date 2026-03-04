// System Prompt Builder - Construtor de Prompts Dinâmicos
// Gera prompts personalizados baseados no perfil biomecânico do aluno
// Parte da arquitetura neuro-simbólica para geração segura de treinos

import type { BiomechanicalProfile } from '../biomechanicalProfile';
import type { DetectedCondition, BiomechanicalRestrictions } from '../knowledge/conditionDetection';
import type { SpecialCondition } from '../knowledge/specialConditions';

// ============ TIPOS ============

export interface ClientContext {
    name: string;
    age?: number;
    level: string;
    goal: string;
    injuries: string;
    observations: string;
    conditions: DetectedCondition[];
    specialConditions: SpecialCondition[];
    restrictions: BiomechanicalRestrictions;
    biomechProfile: BiomechanicalProfile;
}

export interface SlotContext {
    movement_pattern: string;
    target_muscle?: string;
    intensity: string;
    candidateCount: number;
}

// ============ REGRAS BIOMECÂNICAS POR CONDIÇÃO ============

const CONDITION_HARD_CONSTRAINTS: Record<string, string[]> = {
    // Hérnia/Lombar
    hernia: [
        '🚨 HÉRNIA DETECTADA: PROIBIDO carga axial alta',
        'VETADO: Agachamento Livre, Terra, Stiff, Good Morning',
        'VETADO: Remada curvada, exercícios com flexão de tronco',
        'PRIORIZAR: Máquinas com apoio dorsal',
        'REGRA: Cadeia Cinética Fechada SEMPRE para membros inferiores'
    ],

    // Coluna/Lombar genérico
    lombar: [
        '⚠️ DOR LOMBAR: Evitar cisalhamento espinhal',
        'VETADO: Flexão + Rotação + Carga simultâneas',
        'PRIORIZAR: Máquinas com apoio, cabos',
        'REGRA: Manter coluna neutra em todos os exercícios'
    ],

    // Joelho/LCA/Menisco
    joelho: [
        '⚠️ LESÃO DE JOELHO: Cadeia Cinética Fechada (CKC)',
        'VETADO: Cadeira extensora em arcos de 0-30° (cisalhamento LCA)',
        'VETADO: Agachamento profundo (>90° flexão)',
        'PRIORIZAR: Leg Press, Agachamento parcial (0-60°)',
        'REGRA: Co-contração muscular para estabilidade'
    ],

    lesao_ligamentar: [
        '🚨 LESÃO LIGAMENTAR (LCA/LCP): MÁXIMA CAUTELA',
        'PROIBIDO: Exercícios de Cadeia Cinética Aberta',
        'PROIBIDO: Saltos, pivoteamentos, mudanças de direção',
        'PRIORIZAR APENAS: Máquinas guiadas, Cadeia Fechada',
        'REGRA: ZERO impacto, supervisão constante'
    ],

    menisco: [
        '⚠️ MENISCO: Evitar compressão rotacional',
        'VETADO: Agachamento profundo, rotações sob carga',
        'PRIORIZAR: Exercícios lineares, amplitude controlada',
        'REGRA: Sem torção do joelho sob carga'
    ],

    condromalacia: [
        '⚠️ CONDROMALÁCIA PATELAR: Proteger a patela',
        'VETADO: Cadeira extensora, arcos finais de extensão',
        'VETADO: Agachamento profundo, escadas',
        'PRIORIZAR: Exercícios de glúteo, isquiotibiais',
        'REGRA: Ângulos de 30-60° são mais seguros'
    ],

    // Ombro
    ombro: [
        '⚠️ OMBRO: Evitar posições de risco',
        'VETADO: Desenvolvimento atrás da nuca',
        'VETADO: Supino muito aberto (>90° abdução)',
        'PRIORIZAR: Pegada neutra, plano escapular',
        'REGRA: Evitar rotação interna sob carga'
    ],

    bursite: [
        '⚠️ BURSITE: Evitar movimentos repetitivos na área',
        'VETADO: Movimentos que comprimem a bursa afetada',
        'PRIORIZAR: Amplitudes reduzidas, baixa carga',
        'REGRA: Sem dor = movimento permitido'
    ],

    tendinite: [
        '⚠️ TENDINITE: Evitar sobrecarga do tendão afetado',
        'Carga excêntrica controlada é terapêutica',
        'EVITAR: Volume alto na área afetada',
        'REGRA: Progressão muito gradual'
    ],

    // Condições especiais
    gestante: [
        '🚨 GESTANTE: RESTRIÇÕES CRÍTICAS DE SEGURANÇA',
        'PROIBIDO: Posição supina após 20 semanas (síndrome veia cava)',
        'PROIBIDO: Carga axial alta, Valsalva, impacto',
        'PROIBIDO: Supino reto, barra fixa, abdominais',
        'APENAS: Máquinas sentada ou em pé, cabos',
        'REGRA: FC <140bpm, hidratação constante'
    ],

    pos_parto: [
        '⚠️ PÓS-PARTO: Recuperação em andamento',
        'PROIBIDO: Crunches, sit-ups (risco diástase)',
        'PRIORIZAR: Core restoration, assoalho pélvico',
        'REGRA: Sem exercícios que aumentem pressão intra-abdominal'
    ],

    idoso: [
        '⚠️ IDOSO (60+ anos): Segurança em primeiro lugar',
        'VETADO: Exercícios de alto impacto (saltos, corrida)',
        'VETADO: Pesos livres complexos sem supervisão',
        'PRIORIZAR: Máquinas guiadas, apoio, assentos',
        'REGRA: Equilíbrio e prevenção de quedas é prioridade',
        'REGRA: Progressão MUITO lenta'
    ],

    adolescente: [
        '⚠️ ADOLESCENTE (<18 anos): Desenvolvimento em andamento',
        'EVITAR: Cargas máximas (>85% 1RM)',
        'PRIORIZAR: Técnica, desenvolvimento motor',
        'REGRA: Variedade > Intensidade'
    ],

    obesidade: [
        '⚠️ OBESIDADE: Reduzir impacto articular',
        'VETADO: Corrida, saltos, exercícios de alto impacto',
        'PRIORIZAR: Máquinas, exercícios sentados',
        'REGRA: Máquinas > Peso livre para segurança articular'
    ],

    hipertensao: [
        '⚠️ HIPERTENSÃO: Controle cardiovascular',
        'EVITAR: Apneia, manobra de Valsalva',
        'EVITAR: Isometrias prolongadas',
        'REGRA: Respiração contínua sempre'
    ],

    diabetes: [
        '⚠️ DIABETES: Monitorar glicemia',
        'NUNCA treinar em jejum',
        'Ter carboidrato rápido disponível',
        'REGRA: Cuidado com neuropatia periférica'
    ],

    fibromialgia: [
        '⚠️ FIBROMIALGIA: Respeitar limites de dor',
        'EVITAR: Volume excessivo',
        'PRIORIZAR: Intensidade leve a moderada',
        'REGRA: Recuperação estendida entre treinos'
    ],

    protese: [
        '🚨 PRÓTESE ARTICULAR: Restrições permanentes',
        'PROIBIDO: Impacto na articulação substituída',
        'PROIBIDO: Flexão profunda da articulação',
        'PRIORIZAR: Movimentos controlados, amplitude limitada',
        'REGRA: Supervisão constante recomendada'
    ],

    escoliose: [
        '⚠️ ESCOLIOSE: Proteger a coluna',
        'EVITAR: Rotações intensas da coluna',
        'EVITAR: Carga axial assimétrica',
        'PRIORIZAR: Exercícios simétricos, máquinas'
    ],

    espondilolistese: [
        '🚨 ESPONDILOLISTESE: MÁXIMA CAUTELA ESPINHAL',
        'PROIBIDO: Extensão, hiperextensão da coluna',
        'PROIBIDO: Carga axial, impacto',
        'APENAS: Máquinas com suporte total',
        'REGRA: Supervisão OBRIGATÓRIA'
    ],

    artrose: [
        '⚠️ ARTROSE: Proteger cartilagem',
        'EVITAR: Impacto na articulação afetada',
        'EVITAR: Amplitudes extremas',
        'PRIORIZAR: Exercícios de amplitude controlada',
        'REGRA: Aquecimento prolongado antes do treino'
    ]
};

// ============ REGRAS POR NÍVEL ============

const LEVEL_RULES: Record<string, string[]> = {
    iniciante: [
        'NÍVEL INICIANTE: Prioridade é aprendizado motor',
        'PRIORIZAR: Máquinas guiadas sobre peso livre',
        'EVITAR: Exercícios complexos (LPO, movimentos multi-articulares avançados)',
        'REGRA: Estabilidade antes de intensidade',
        'REGRA: Volume baixo, foco em técnica'
    ],
    intermediario: [
        'NÍVEL INTERMEDIÁRIO: Pode usar peso livre básico',
        'PRIORIZAR: Progressão gradual',
        'REGRA: Equilíbrio entre máquinas e peso livre'
    ],
    avancado: [
        'NÍVEL AVANÇADO: Pode usar exercícios complexos',
        'PERMITIDO: Peso livre, compostos pesados',
        'REGRA: Atenção a overtraining em volume alto'
    ],
    atleta: [
        'NÍVEL ATLETA: Pode usar todas as técnicas',
        'PERMITIDO: Exercícios balísticos, pliometria',
        'REGRA: Periodização é essencial'
    ]
};

// ============ REGRAS POR OBJETIVO ============

const GOAL_RULES: Record<string, string[]> = {
    forca: [
        'OBJETIVO FORÇA: Priorizar compostos pesados',
        'PARÂMETROS: 4-6 reps, descanso longo (2-3min)',
        'PRIORIZAR: Barra, exercícios multiarticulares'
    ],
    'força': [
        'OBJETIVO FORÇA: Priorizar compostos pesados',
        'PARÂMETROS: 4-6 reps, descanso longo (2-3min)',
        'PRIORIZAR: Barra, exercícios multiarticulares'
    ],
    hipertrofia: [
        'OBJETIVO HIPERTROFIA: Tensão mecânica e volume',
        'PARÂMETROS: 8-12 reps, descanso moderado (60-90s)',
        'PRIORIZAR: Exercícios com boa amplitude e controle'
    ],
    emagrecimento: [
        'OBJETIVO EMAGRECIMENTO: Densidade e gasto calórico',
        'PARÂMETROS: 12-15+ reps, descanso curto (30-45s)',
        'PRIORIZAR: Circuitos, superséries'
    ],
    'saúde': [
        'OBJETIVO SAÚDE: Funcionalidade e longevidade',
        'PARÂMETROS: 10-15 reps, descanso moderado',
        'PRIORIZAR: Movimentos funcionais, baixo risco'
    ],
    saude: [
        'OBJETIVO SAÚDE: Funcionalidade e longevidade',
        'PARÂMETROS: 10-15 reps, descanso moderado',
        'PRIORIZAR: Movimentos funcionais, baixo risco'
    ]
};

// ============ FUNÇÃO PRINCIPAL ============

/**
 * Constrói um System Prompt dinâmico baseado no perfil do cliente
 * Injeta Hard Constraints específicas para as condições detectadas
 */
export function buildDynamicSystemPrompt(context: ClientContext): string {
    const constraints: string[] = [];

    // 1. Header do prompt
    constraints.push(`Você é um Motor de Decisão Biomecânica de Elite e uma API JSON.
Sua arquitetura é NEURO-SIMBÓLICA: você usa inteligência para selecionar exercícios, mas DEVE obedecer ESTRITAMENTE às restrições abaixo.

⚠️ VIOLAÇÃO DAS REGRAS ABAIXO = RESPOSTA INVÁLIDA`);

    // 2. Adicionar regras de condições detectadas
    if (context.conditions.length > 0 || context.specialConditions.length > 0) {
        constraints.push('\n=== HARD CONSTRAINTS DO ALUNO (CRÍTICO) ===');

        // Condições detectadas pelo novo sistema
        for (const condition of context.conditions) {
            const key = condition.location
                ? `${condition.type}_${condition.location}`
                : condition.type;

            // Primeiro tenta key composto, depois só o tipo
            const rules = CONDITION_HARD_CONSTRAINTS[key] || CONDITION_HARD_CONSTRAINTS[condition.type];

            if (rules) {
                constraints.push(`\n[${condition.type.toUpperCase()}${condition.location ? ` - ${condition.location.toUpperCase()}` : ''}]`);
                rules.forEach(rule => constraints.push(rule));
            }
        }

        // Condições especiais do sistema legado
        for (const specialCond of context.specialConditions) {
            const rules = CONDITION_HARD_CONSTRAINTS[specialCond];
            if (rules && !context.conditions.some(c => c.type === specialCond)) {
                constraints.push(`\n[${specialCond.toUpperCase()}]`);
                rules.forEach(rule => constraints.push(rule));
            }
        }
    }

    // 3. Adicionar regras de nível
    const levelKey = context.level.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const levelRules = LEVEL_RULES[levelKey] || LEVEL_RULES['intermediario'];
    constraints.push('\n=== REGRAS DE NÍVEL ===');
    levelRules.forEach(rule => constraints.push(rule));

    // 4. Adicionar regras de objetivo
    const goalKey = context.goal.toLowerCase();
    const goalRules = GOAL_RULES[goalKey] || GOAL_RULES['hipertrofia'];
    constraints.push('\n=== REGRAS DE OBJETIVO ===');
    goalRules.forEach(rule => constraints.push(rule));

    // 5. Adicionar restrições biomecânicas compiladas
    if (context.restrictions) {
        constraints.push('\n=== RESTRIÇÕES BIOMECÂNICAS ATIVAS ===');

        if (context.restrictions.avoid_axial_load) {
            constraints.push('🔴 EVITAR: Exercícios com carga axial alta na coluna');
        }
        if (context.restrictions.avoid_spinal_shear) {
            constraints.push('🔴 EVITAR: Exercícios com cisalhamento espinhal');
        }
        if (context.restrictions.avoid_knee_shear) {
            constraints.push('🔴 EVITAR: Exercícios com cisalhamento no joelho');
        }
        if (context.restrictions.avoid_deep_knee_flexion) {
            constraints.push('🔴 EVITAR: Flexão profunda do joelho (>90°)');
        }
        if (context.restrictions.avoid_shoulder_overhead) {
            constraints.push('🔴 EVITAR: Exercícios acima da cabeça');
        }
        if (context.restrictions.avoid_spinal_flexion) {
            constraints.push('🔴 EVITAR: Flexão da coluna sob carga');
        }
        if (context.restrictions.avoid_spinal_rotation) {
            constraints.push('🔴 EVITAR: Rotação da coluna sob carga');
        }
        if (context.restrictions.avoid_hip_impact) {
            constraints.push('🔴 EVITAR: Impacto no quadril');
        }
        if (context.restrictions.max_impact_level === 'none') {
            constraints.push('🔴 ZERO IMPACTO: Apenas exercícios sem impacto');
        } else if (context.restrictions.max_impact_level === 'low') {
            constraints.push('🟡 BAIXO IMPACTO: Apenas exercícios de baixo impacto');
        }
        if (context.restrictions.prefer_machines) {
            constraints.push('🟢 PREFERÊNCIA: Máquinas e cabos sobre peso livre');
        }
    }

    // 6. Formato de resposta
    constraints.push(`
=== FORMATO DE RESPOSTA (OBRIGATÓRIO) ===
Responda APENAS com JSON válido, sem markdown, sem introduções.
Campo "selected" DEVE ser inteiro puro (ex: 1). Não use texto, ordinal, range, null, NaN ou string.

{
  "selected": <número 1-N do exercício escolhido>,
  "reasoning": "<justificativa biomecânica em 1 frase>",
  "safety_check": {
    "kinetic_chain": "fechada|aberta",
    "spinal_load": "baixo|moderado|alto",
    "is_machine": true|false,
    "complexity": "baixa|media|alta"
  }
}`);

    return constraints.join('\n');
}

/**
 * Constrói o User Prompt com contexto do aluno e slot atual
 */
export function buildUserPrompt(
    context: ClientContext,
    slot: SlotContext,
    candidates: Array<{
        num: number;
        name: string;
        equipment?: string;
        is_machine: boolean;
        is_compound: boolean;
        spinal_load?: string;
    }>
): string {
    const conditionsList = context.conditions.length > 0
        ? context.conditions.map(c => c.location ? `${c.type} (${c.location})` : c.type).join(', ')
        : 'Nenhuma';

    const specialCondsList = context.specialConditions.length > 0
        ? context.specialConditions.join(', ')
        : 'Nenhuma';

    return `PERFIL DO ALUNO:
- Nome: ${context.name}
- Idade: ${context.age || 'Não informada'}
- Nível: ${context.level}
- Objetivo: ${context.goal}
- Lesões: ${context.injuries || 'Nenhuma'}
- Condições Detectadas: ${conditionsList}
- Condições Especiais: ${specialCondsList}
- Observações: ${context.observations || 'Nenhuma'}

SLOT ATUAL:
- Padrão de Movimento: ${slot.movement_pattern}
- Músculo Alvo: ${slot.target_muscle || 'geral'}
- Intensidade: ${slot.intensity}

CANDIDATOS PRÉ-FILTRADOS (escolha UM):
${JSON.stringify(candidates, null, 2)}

Selecione o exercício MAIS SEGURO e ADEQUADO para este aluno.
Responda com JSON: { "selected": <número>, "reasoning": "<1 frase>", "safety_check": {...} }`;
}

// ============ EXPORTS ============

export { CONDITION_HARD_CONSTRAINTS, LEVEL_RULES, GOAL_RULES };
