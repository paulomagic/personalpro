// Recovery Guidelines - Base de Conhecimento
// Fontes: NSCA, Renaissance Periodization, ACSM

export interface RecoveryGuideline {
    muscle_group: string;
    min_rest_hours: number;      // Mínimo entre sessões do mesmo grupo
    optimal_rest_hours: number;  // Ideal para hipertrofia
    factors_that_increase: string[];  // Fatores que exigem mais descanso
    factors_that_decrease: string[];  // Fatores que permitem menos descanso
    recovery_indicators: string[];    // Como saber se recuperou
    source: string;
}

// ============ GUIDELINES DE RECUPERAÇÃO ============

export const RECOVERY_GUIDELINES: RecoveryGuideline[] = [
    // GRUPOS GRANDES - MAIOR DEMANDA SISTÊMICA
    {
        muscle_group: 'quadriceps',
        min_rest_hours: 48,
        optimal_rest_hours: 72,
        factors_that_increase: [
            'Alto volume (>12 sets)',
            'Exercícios pesados (agachamento, leg press)',
            'Idade > 40',
            'Déficit calórico'
        ],
        factors_that_decrease: [
            'Baixo volume',
            'Apenas máquinas',
            'Jovem e bem alimentado'
        ],
        recovery_indicators: [
            'Ausência de dor muscular (DOMS)',
            'Performance igual ou superior à sessão anterior',
            'Disposição para treinar'
        ],
        source: 'NSCA, Renaissance Periodization'
    },

    {
        muscle_group: 'posterior_coxa',
        min_rest_hours: 48,
        optimal_rest_hours: 72,
        factors_that_increase: ['Stiff pesado', 'Terra convencional', 'Alto volume'],
        factors_that_decrease: ['Apenas leg curl', 'Volume moderado'],
        recovery_indicators: ['Sem encurtamento', 'Amplitude completa restaurada'],
        source: 'NSCA'
    },

    {
        muscle_group: 'costas',
        min_rest_hours: 48,
        optimal_rest_hours: 72,
        factors_that_increase: ['Remada pesada', 'Terra', 'Alto volume de puxadas'],
        factors_that_decrease: ['Apenas cabos/máquinas'],
        recovery_indicators: ['Grip restaurado', 'Sem fadiga de lombar'],
        source: 'Renaissance Periodization'
    },

    // GRUPOS MÉDIOS
    {
        muscle_group: 'peito',
        min_rest_hours: 48,
        optimal_rest_hours: 72,
        factors_that_increase: ['Supino pesado', 'Alto volume'],
        factors_that_decrease: ['Apenas isolados', 'Cabos'],
        recovery_indicators: ['Ombro sem desconforto', 'Força restaurada'],
        source: 'Renaissance Periodization'
    },

    {
        muscle_group: 'ombro',
        min_rest_hours: 48,
        optimal_rest_hours: 72,
        factors_that_increase: ['Desenvolvimento pesado', 'Alto volume de laterais'],
        factors_that_decrease: ['Apenas isolados leves'],
        recovery_indicators: ['Sem dor no manguito', 'Mobilidade completa'],
        source: 'Renaissance Periodization'
    },

    {
        muscle_group: 'gluteos',
        min_rest_hours: 48,
        optimal_rest_hours: 72,
        factors_that_increase: ['Hip thrust pesado', 'Alto volume'],
        factors_that_decrease: ['Ativação leve'],
        recovery_indicators: ['Sem tensão em lombar', 'Ativação fácil'],
        source: 'Bret Contreras, Renaissance Periodization'
    },

    // GRUPOS PEQUENOS - RECUPERAÇÃO RÁPIDA
    {
        muscle_group: 'biceps',
        min_rest_hours: 24,
        optimal_rest_hours: 48,
        factors_that_increase: ['Volume extremo (>20 sets/sem)'],
        factors_that_decrease: ['Volume moderado'],
        recovery_indicators: ['Sem dor no cotovelo', 'Força de grip normal'],
        source: 'Renaissance Periodization'
    },

    {
        muscle_group: 'triceps',
        min_rest_hours: 24,
        optimal_rest_hours: 48,
        factors_that_increase: ['Volume extremo'],
        factors_that_decrease: ['Volume moderado'],
        recovery_indicators: ['Sem dor no cotovelo', 'Extensão completa'],
        source: 'Renaissance Periodization'
    },

    {
        muscle_group: 'panturrilha',
        min_rest_hours: 24,
        optimal_rest_hours: 48,
        factors_that_increase: ['Volume muito alto'],
        factors_that_decrease: ['Frequência alta moderada'],
        recovery_indicators: ['Sem encurtamento', 'Dorsiflexão normal'],
        source: 'Renaissance Periodization'
    },

    {
        muscle_group: 'core',
        min_rest_hours: 24,
        optimal_rest_hours: 48,
        factors_that_increase: ['Trabalho isométrico longo'],
        factors_that_decrease: ['Baixo volume'],
        recovery_indicators: ['Sem dor lombar', 'Estabilidade normal'],
        source: 'NSCA'
    }
];

// ============ FATORES GLOBAIS DE RECUPERAÇÃO ============

export interface GlobalRecoveryFactors {
    factor: string;
    impact: 'increase' | 'decrease';
    multiplier: number;  // 1.0 = neutral, >1.0 = mais descanso, <1.0 = menos descanso
    description: string;
}

export const GLOBAL_FACTORS: GlobalRecoveryFactors[] = [
    { factor: 'sono_inadequado', impact: 'increase', multiplier: 1.3, description: '< 7 horas/noite' },
    { factor: 'deficit_calorico', impact: 'increase', multiplier: 1.2, description: 'Cutting ou dieta restritiva' },
    { factor: 'estresse_alto', impact: 'increase', multiplier: 1.2, description: 'Estresse ocupacional ou pessoal' },
    { factor: 'idade_40_plus', impact: 'increase', multiplier: 1.15, description: 'Maior de 40 anos' },
    { factor: 'idade_50_plus', impact: 'increase', multiplier: 1.3, description: 'Maior de 50 anos' },
    { factor: 'otimo_sono', impact: 'decrease', multiplier: 0.9, description: '8+ horas de sono de qualidade' },
    { factor: 'superavit_calorico', impact: 'decrease', multiplier: 0.85, description: 'Bulking com nutrição adequada' },
    { factor: 'uso_substancias', impact: 'decrease', multiplier: 0.6, description: 'Uso de anabolizantes (não endossamos)' }
];

// ============ FUNÇÕES HELPER ============

export function getRecoveryTime(muscle: string): number {
    const guideline = RECOVERY_GUIDELINES.find(g => g.muscle_group === muscle);
    return guideline?.optimal_rest_hours || 48;
}

export function canTrainToday(
    muscle: string,
    hoursSinceLastSession: number
): boolean {
    const guideline = RECOVERY_GUIDELINES.find(g => g.muscle_group === muscle);
    if (!guideline) return true;

    return hoursSinceLastSession >= guideline.min_rest_hours;
}
