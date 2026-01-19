// Special Conditions & Contraindications - Knowledge Base
// Para populações especiais: gestantes, pós-parto, idosos, diabéticos, etc.

export type SpecialCondition =
    | 'pos_parto'
    | 'gestante'
    | 'idoso'
    | 'diabetico'
    | 'hipertenso'
    | 'adolescente'
    | 'atleta_lesionado';

export interface ConditionRule {
    condition: SpecialCondition;
    keywords: string[];  // Keywords para detectar nas observações
    volume_modifier: number;  // Multiplicador de volume
    intensity_modifier: number;  // Multiplicador de intensidade
    blocked_movements: string[];  // Padrões de movimento bloqueados
    blocked_exercises: string[];  // Exercícios específicos bloqueados
    preferred_equipment: string[];  // Equipamentos preferidos
    special_notes: string[];
    source: string;
}

// ============ REGRAS POR CONDIÇÃO ============

export const SPECIAL_CONDITION_RULES: ConditionRule[] = [
    // PÓS-PARTO (0-12 meses)
    {
        condition: 'pos_parto',
        keywords: ['pós-parto', 'pos-parto', 'pós parto', 'pos parto', 'diástase', 'diastase', 'cesariana', 'cesárea'],
        volume_modifier: 0.5,  // 50% do volume normal
        intensity_modifier: 0.6,  // 60% intensidade
        blocked_movements: ['core_flexion', 'crunch', 'sit_up'],  // Bloqueia crunches
        blocked_exercises: [
            'crunch',
            'abdominal tradicional',
            'sit up',
            'prancha dinâmica'
        ],
        preferred_equipment: ['maquina', 'cabo', 'elástico'],
        special_notes: [
            'Evitar exercícios que aumentam pressão intra-abdominal',
            'Foco em assoalho pélvico e core restoration',
            'Sem impacto até liberação médica',
            'Posição supina limitada (máx 15min se amamentando)'
        ],
        source: 'ACOG Guidelines, Core Restore'
    },

    // GESTANTE
    {
        condition: 'gestante',
        keywords: ['gestante', 'grávida', 'gravida', 'semanas', 'trimestre', 'dpp'],
        volume_modifier: 0.6,  // 60% volume (REDUZIDO de 70%)
        intensity_modifier: 0.65,  // 65% intensidade (REDUZIDO de 75%)
        blocked_movements: ['supino_reto', 'posicao_supina', 'compressao_abdominal'],
        blocked_exercises: [
            // Posição supina (síndrome veia cava após 20 semanas)
            'supino reto',
            'supino inclinado',
            'supino declinado',
            'supino',
            'fly',
            'crucifixo',
            'pullover',

            // Carga axial alta
            'agachamento livre',
            'agachamento com barra',
            'leg press 45',
            'leg press',
            'hack squat',
            'stiff',
            'levantamento terra',
            'terra',
            'good morning',

            // Overhead/sobre a cabeça (risco de queda)
            'desenvolvimento',
            'militar',
            'push press',
            'thruster',

            // Pulling vertical (aumenta pressão abdominal)
            'barra fixa',
            'pull up',
            'chin up',
            'muscle up',

            // Impacto
            'box jump',
            'salto',
            'burpee',
            'jump',

            // Core intenso
            'prancha',
            'abdominal',
            'crunch',
            'sit up',
            'russian twist',
            'v-up',

            // Máquinas que fecham ângulo do quadril muito
            'leg curl deitado'
        ],
        preferred_equipment: ['maquina', 'cabo', 'halter_leve'],
        special_notes: [
            '🚨 ATENÇÃO: Evitar posição supina após 20 semanas (síndrome veia cava)',
            'Evitar exercícios de alta carga axial (compressão coluna)',
            'NUNCA aumentar pressão intra-abdominal (sem valsalva)',
            'Monitorar frequência cardíaca (<140bpm)',
            'Priorizar máquinas/cabos com apoio',
            'Hidratação constante',
            'PARAR IMEDIATAMENTE em caso de: dor, sangramento, tontura, falta de ar',
            'Exercícios de mobilidade e alongamento são seguros e recomendados'
        ],
        source: 'ACOG Committee Opinion 804 (2020)'
    },

    // IDOSO (>65 anos)
    {
        condition: 'idoso',
        keywords: ['idoso', 'idosa', '65 anos', '70 anos', '75 anos', '80 anos', 'terceira idade', 'osteoporose', 'sarcopenia'],
        volume_modifier: 0.7,  // 70% volume
        intensity_modifier: 0.8,  // 80% intensidade
        blocked_movements: [],  // Não bloqueia, mas score desfavorece
        blocked_exercises: [
            // Pliométricos/Impacto
            'box jump', 'burpee', 'salto em profundidade', 'jump squat', 'pular corda',

            // Posições desconfortáveis/instáveis
            'donkey calf raise', 'sissy squat', 'jefferson squat', 'zercher squat',
            'pistol squat', 'dragon flag', 'handstand push up',

            // Alta complexidade/risco de queda
            'agachamento búlgaro', 'bulgarian split squat', 'passada com salto',
            'walking lunge', 'single leg deadlift',

            // Peso livre pesado com risco de coluna
            'levantamento terra', 'terra', 'stiff', 'good morning',
            'agachamento livre', 'agachamento com barra',

            // Overhead com risco
            'militar em pé', 'push press', 'thruster',

            // Core intenso
            'abdominal crunch', 'russian twist', 'v-up', 'dragon flag'
        ],
        preferred_equipment: ['maquina', 'apoio', 'cadeira', 'cabo'],
        special_notes: [
            'PRIORIZAR máquinas com apoio e assentos',
            'EVITAR exercícios em pé sem apoio',
            'Priorizar prevenção de quedas (equilíbrio)',
            'Exercícios de carga para densidade óssea',
            'Mobilidade articular essencial',
            'Progressão mais lenta',
            'Atenção redobrada com recuperação'
        ],
        source: 'ACSM Guidelines for Older Adults'
    },

    // DIABÉTICO
    {
        condition: 'diabetico',
        keywords: ['diabético', 'diabetico', 'diabetes', 'glicemia', 'insulina', 'hba1c'],
        volume_modifier: 0.9,  // 90% volume (pode treinar normal com controle)
        intensity_modifier: 0.9,
        blocked_movements: [],
        blocked_exercises: [],
        preferred_equipment: [],
        special_notes: [
            'NUNCA treinar em jejum',
            'Monitorar glicemia antes/depois',
            'Ter carboidrato de rápida absorção disponível',
            'Cuidado com neuropatia periférica (pés)',
            'Evitar exercícios de impacto se neuropatia',
            'Hidratação extra importante'
        ],
        source: 'ADA Exercise Guidelines'
    },

    // HIPERTENSO
    {
        condition: 'hipertenso',
        keywords: ['hipertensão', 'hipertensao', 'pressão alta', 'hipertenso'],
        volume_modifier: 1.0,  // Volume normal
        intensity_modifier: 0.85,  // 85% intensidade
        blocked_movements: [],
        blocked_exercises: [
            'valsalva maneuver exercises'  // Evitar bloqueio respiratório
        ],
        preferred_equipment: [],
        special_notes: [
            'Evitar apneia/valsalva',
            'Respiração contínua durante exercícios',
            'Monitorar PA se sintomas',
            'Descansos adequados entre séries',
            'Preferir rep ranges moderados (8-15)'
        ],
        source: 'ACSM Hypertension Guidelines'
    },

    // ADOLESCENTE (<18 anos)
    {
        condition: 'adolescente',
        keywords: ['adolescente', '13 anos', '14 anos', '15 anos', '16 anos', '17 anos'],
        volume_modifier: 0.8,  // 80% volume
        intensity_modifier: 0.75,  // 75% intensidade
        blocked_movements: [],
        blocked_exercises: [],
        preferred_equipment: ['maquina', 'peso corporal'],
        special_notes: [
            'Evitar cargas máximas (<85% 1RM)',
            'Foco em técnica e desenvolvimento motor',
            'Crescimento ainda em andamento',
            'Supervisão constante',
            'Variedade de movimentos importante'
        ],
        source: 'NSCA Youth Training Guidelines'
    }
];

// ============ FUNÇÕES HELPER ============

export function detectConditions(observations: string = '', injuries: string = '', birthDate?: string): SpecialCondition[] {
    const detected: SpecialCondition[] = [];
    const searchText = `${observations} ${injuries}`.toLowerCase();

    // Detecta por keywords
    for (const rule of SPECIAL_CONDITION_RULES) {
        if (rule.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
            detected.push(rule.condition);
        }
    }

    // Detecta idoso por idade
    if (birthDate) {
        const age = calculateAge(birthDate);
        if (age >= 65 && !detected.includes('idoso')) {
            detected.push('idoso');
        }
        if (age < 18 && !detected.includes('adolescente')) {
            detected.push('adolescente');
        }
    }

    return detected;
}

export function getConditionRules(condition: SpecialCondition): ConditionRule | undefined {
    return SPECIAL_CONDITION_RULES.find(r => r.condition === condition);
}

export function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export function getAggregatedModifiers(conditions: SpecialCondition[]): {
    volume: number;
    intensity: number;
    blockedMovements: string[];
    blockedExercises: string[];
    specialNotes: string[];
} {
    if (conditions.length === 0) {
        return {
            volume: 1.0,
            intensity: 1.0,
            blockedMovements: [],
            blockedExercises: [],
            specialNotes: []
        };
    }

    // Aplica o modificar MAIS RESTRITIVO
    let volume = 1.0;
    let intensity = 1.0;
    const blockedMovements = new Set<string>();
    const blockedExercises = new Set<string>();
    const specialNotes: string[] = [];

    for (const condition of conditions) {
        const rule = getConditionRules(condition);
        if (!rule) continue;

        // Usa o menor multiplicador (mais conservador)
        volume = Math.min(volume, rule.volume_modifier);
        intensity = Math.min(intensity, rule.intensity_modifier);

        // Agrega bloqueios
        rule.blocked_movements.forEach(m => blockedMovements.add(m));
        rule.blocked_exercises.forEach(e => blockedExercises.add(e));

        // Agrega notas
        specialNotes.push(`[${condition.toUpperCase()}]`, ...rule.special_notes);
    }

    return {
        volume,
        intensity,
        blockedMovements: Array.from(blockedMovements),
        blockedExercises: Array.from(blockedExercises),
        specialNotes
    };
}
