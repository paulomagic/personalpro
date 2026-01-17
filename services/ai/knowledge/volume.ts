// Volume Guidelines - Base de Conhecimento
// Fontes: Renaissance Periodization, Brad Schoenfeld, NSCA
// MEV = Minimum Effective Volume | MAV = Maximum Adaptive Volume | MRV = Maximum Recoverable Volume

export type TrainingLevel = 'iniciante' | 'intermediario' | 'avancado' | 'atleta';

export interface VolumeGuideline {
    muscle_group: string;
    mev: number;  // Minimum Effective Volume (sets/semana)
    mav: number;  // Maximum Adaptive Volume (sets/semana)
    mrv: number;  // Maximum Recoverable Volume (sets/semana)
    optimal_frequency: number;  // Treinos por semana
    recovery_hours: number;     // Horas mínimas entre sessões
    notes: string;
    source: string;
}

// ============ GUIDELINES POR GRUPO MUSCULAR ============
// Baseado em Renaissance Periodization (Dr. Mike Israetel)
// Valores para nível intermediário. Ajustar por nível.

export const VOLUME_GUIDELINES: VolumeGuideline[] = [
    // PEITO
    {
        muscle_group: 'peito',
        mev: 8,
        mav: 12,
        mrv: 20,
        optimal_frequency: 2,
        recovery_hours: 48,
        notes: 'Composto (supino) antes de isolados. Inclinado para porção clavicular.',
        source: 'Renaissance Periodization'
    },

    // COSTAS
    {
        muscle_group: 'costas',
        mev: 10,
        mav: 14,
        mrv: 25,
        optimal_frequency: 2,
        recovery_hours: 48,
        notes: 'Dividir entre puxadas verticais (largura) e horizontais (espessura).',
        source: 'Renaissance Periodization'
    },

    // OMBRO (DELTOIDE)
    {
        muscle_group: 'ombro',
        mev: 8,
        mav: 12,
        mrv: 22,
        optimal_frequency: 2,
        recovery_hours: 48,
        notes: 'Deltoide anterior já recebe estímulo de supino. Focar em lateral e posterior.',
        source: 'Renaissance Periodization'
    },

    // QUADRÍCEPS
    {
        muscle_group: 'quadriceps',
        mev: 8,
        mav: 12,
        mrv: 18,
        optimal_frequency: 2,
        recovery_hours: 72,
        notes: 'Alta demanda sistêmica. Considerar fadiga acumulada.',
        source: 'Renaissance Periodization'
    },

    // GLÚTEOS
    {
        muscle_group: 'gluteos',
        mev: 4,
        mav: 8,
        mrv: 16,
        optimal_frequency: 2,
        recovery_hours: 48,
        notes: 'Hip thrust e variações de hinge são mais efetivos que agachamento.',
        source: 'Renaissance Periodization'
    },

    // POSTERIOR DE COXA
    {
        muscle_group: 'posterior_coxa',
        mev: 6,
        mav: 10,
        mrv: 16,
        optimal_frequency: 2,
        recovery_hours: 48,
        notes: 'Combinar hip hinge (stiff) e leg curl para estímulo completo.',
        source: 'Renaissance Periodization'
    },

    // BÍCEPS
    {
        muscle_group: 'biceps',
        mev: 6,
        mav: 10,
        mrv: 20,
        optimal_frequency: 2,
        recovery_hours: 24,
        notes: 'Já recebe estímulo de puxadas. Volume adicional moderado.',
        source: 'Renaissance Periodization'
    },

    // TRÍCEPS
    {
        muscle_group: 'triceps',
        mev: 6,
        mav: 10,
        mrv: 18,
        optimal_frequency: 2,
        recovery_hours: 24,
        notes: 'Já recebe estímulo de empurrões. Volume adicional moderado.',
        source: 'Renaissance Periodization'
    },

    // PANTURRILHA
    {
        muscle_group: 'panturrilha',
        mev: 8,
        mav: 12,
        mrv: 20,
        optimal_frequency: 3,
        recovery_hours: 24,
        notes: 'Alta frequência funciona bem. Alongamento completo importante.',
        source: 'Renaissance Periodization'
    },

    // CORE/ABDÔMEN
    {
        muscle_group: 'core',
        mev: 0,
        mav: 8,
        mrv: 16,
        optimal_frequency: 3,
        recovery_hours: 24,
        notes: 'Trabalho direto opcional se treino inclui compostos pesados.',
        source: 'Renaissance Periodization'
    },

    // TRAPÉZIO
    {
        muscle_group: 'trapezio',
        mev: 0,
        mav: 6,
        mrv: 12,
        optimal_frequency: 2,
        recovery_hours: 24,
        notes: 'Recebe estímulo significativo de remadas e puxadas.',
        source: 'Renaissance Periodization'
    },

    // ANTEBRAÇO
    {
        muscle_group: 'antebraco',
        mev: 0,
        mav: 4,
        mrv: 10,
        optimal_frequency: 2,
        recovery_hours: 24,
        notes: 'Trabalho direto geralmente desnecessário para maioria.',
        source: 'Renaissance Periodization'
    }
];

// ============ AJUSTE POR NÍVEL ============

export const LEVEL_MULTIPLIERS: Record<TrainingLevel, { volume: number; frequency: number }> = {
    'iniciante': { volume: 0.6, frequency: 0.75 },      // 60% do volume, menos frequência
    'intermediario': { volume: 1.0, frequency: 1.0 },   // Baseline
    'avancado': { volume: 1.2, frequency: 1.1 },        // +20% volume
    'atleta': { volume: 1.4, frequency: 1.2 }           // +40% volume
};

// ============ FUNÇÕES HELPER ============

export function getVolumeForMuscle(
    muscle: string,
    level: TrainingLevel
): VolumeGuideline | null {
    const guideline = VOLUME_GUIDELINES.find(g => g.muscle_group === muscle);
    if (!guideline) return null;

    const multiplier = LEVEL_MULTIPLIERS[level];

    return {
        ...guideline,
        mev: Math.round(guideline.mev * multiplier.volume),
        mav: Math.round(guideline.mav * multiplier.volume),
        mrv: Math.round(guideline.mrv * multiplier.volume),
        optimal_frequency: Math.round(guideline.optimal_frequency * multiplier.frequency)
    };
}

export function isVolumeInRange(
    muscle: string,
    weeklysets: number,
    level: TrainingLevel
): 'low' | 'optimal' | 'high' | 'excessive' {
    const guideline = getVolumeForMuscle(muscle, level);
    if (!guideline) return 'optimal';

    if (weeklysets < guideline.mev) return 'low';
    if (weeklysets <= guideline.mav) return 'optimal';
    if (weeklysets <= guideline.mrv) return 'high';
    return 'excessive';
}
