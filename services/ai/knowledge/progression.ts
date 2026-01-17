// Progression Models - Base de Conhecimento
// Fontes: Eric Helms (3DMJ), NSCA, Practical Programming (Rippetoe)

export type ProgressionModel =
    | 'double_progression'     // Aumenta reps, depois carga
    | 'linear'                 // Aumenta carga toda sessão
    | 'weekly_linear'          // Aumenta carga toda semana
    | 'dup'                    // Daily Undulating Periodization
    | 'block'                  // Block Periodization
    | 'autoregulated';         // Baseado em RPE/RIR

export interface ProgressionGuideline {
    model: ProgressionModel;
    name: string;
    suitable_levels: string[];
    description: string;
    when_to_use: string;
    example: string;
    source: string;
}

// ============ MODELOS DE PROGRESSÃO ============

export const PROGRESSION_MODELS: ProgressionGuideline[] = [
    {
        model: 'linear',
        name: 'Progressão Linear',
        suitable_levels: ['iniciante'],
        description: 'Adicionar peso a cada sessão de treino.',
        when_to_use: 'Iniciantes nos primeiros 3-6 meses de treino.',
        example: 'Supino: 40kg → 42.5kg → 45kg (cada treino)',
        source: 'Starting Strength, NSCA'
    },

    {
        model: 'weekly_linear',
        name: 'Progressão Linear Semanal',
        suitable_levels: ['iniciante', 'intermediario'],
        description: 'Adicionar peso a cada semana, mantendo mesmo peso nas sessões da semana.',
        when_to_use: 'Quando progressão por sessão não é mais possível.',
        example: 'Semana 1: 60kg | Semana 2: 62.5kg | Semana 3: 65kg',
        source: 'Practical Programming'
    },

    {
        model: 'double_progression',
        name: 'Dupla Progressão',
        suitable_levels: ['intermediario', 'avancado'],
        description: 'Primeiro aumenta reps até limite superior, depois aumenta carga e volta ao limite inferior.',
        when_to_use: 'Para maioria dos exercícios de hipertrofia.',
        example: '60kg x 8 → 60kg x 10 → 60kg x 12 → 62.5kg x 8',
        source: 'Renaissance Periodization, Eric Helms'
    },

    {
        model: 'dup',
        name: 'Periodização Ondulada Diária (DUP)',
        suitable_levels: ['intermediario', 'avancado', 'atleta'],
        description: 'Variar intensidade e volume entre sessões da mesma semana.',
        when_to_use: 'Treino de alta frequência (3x+/semana por grupo).',
        example: 'Seg: 4x6 pesado | Qua: 3x12 leve | Sex: 4x8 moderado',
        source: 'Brad Schoenfeld, Zourdos et al.'
    },

    {
        model: 'block',
        name: 'Periodização em Blocos',
        suitable_levels: ['avancado', 'atleta'],
        description: 'Fases distintas focando em qualidades diferentes (volume→intensidade→peak).',
        when_to_use: 'Preparação para competição ou quebra de platô.',
        example: 'Bloco 1 (4sem): Volume | Bloco 2 (4sem): Intensidade | Bloco 3 (2sem): Peak',
        source: 'Tudor Bompa, Vladimir Issurin'
    },

    {
        model: 'autoregulated',
        name: 'Autoregulação (RPE/RIR)',
        suitable_levels: ['intermediario', 'avancado', 'atleta'],
        description: 'Ajustar carga baseado em percepção de esforço do dia.',
        when_to_use: 'Atletas experientes que sabem avaliar RPE com precisão.',
        example: 'Supino 4x6 @RPE 8 (2 reps em reserva)',
        source: 'Mike Tuchscherer (RTS), Renaissance Periodization'
    }
];

// ============ RECOMENDAÇÃO POR NÍVEL ============

export function getRecommendedProgression(level: string): ProgressionModel[] {
    const levelLower = level.toLowerCase();

    if (levelLower.includes('inic')) {
        return ['linear', 'weekly_linear'];
    }
    if (levelLower.includes('inter')) {
        return ['double_progression', 'weekly_linear'];
    }
    if (levelLower.includes('avanc')) {
        return ['double_progression', 'dup', 'autoregulated'];
    }
    if (levelLower.includes('atlet')) {
        return ['block', 'dup', 'autoregulated'];
    }

    return ['double_progression'];
}

// ============ REP RANGES POR OBJETIVO ============

export const REP_RANGES = {
    forca: { min: 1, max: 5, rest: '180-300s', intensity: 'very_high' },
    forca_hipertrofia: { min: 6, max: 8, rest: '120-180s', intensity: 'high' },
    hipertrofia: { min: 8, max: 12, rest: '60-120s', intensity: 'moderate' },
    resistencia_muscular: { min: 12, max: 20, rest: '30-60s', intensity: 'low' },
    resistencia_metabolica: { min: 20, max: 30, rest: '15-30s', intensity: 'very_low' }
};

export function getRepRangeForGoal(goal: string): typeof REP_RANGES.hipertrofia {
    const goalLower = goal.toLowerCase();

    if (goalLower.includes('força') || goalLower.includes('forca')) {
        return REP_RANGES.forca_hipertrofia;
    }
    if (goalLower.includes('hipertrofia')) {
        return REP_RANGES.hipertrofia;
    }
    if (goalLower.includes('emagrecimento') || goalLower.includes('condicion')) {
        return REP_RANGES.resistencia_muscular;
    }

    return REP_RANGES.hipertrofia; // Default
}
