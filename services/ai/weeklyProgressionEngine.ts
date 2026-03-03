import type { AdaptiveTrainingSignal } from './adaptiveSignalTypes';

export interface WeeklyMicrocycleWeek {
    week: number;
    phase: 'Acúmulo' | 'Intensificação' | 'Consolidação' | 'Deload';
    focus: string;
    volumeDeltaPct: number;
    intensityDeltaPct: number;
    instruction: string;
}

export interface WeeklyMicrocyclePlan {
    weeks: WeeklyMicrocycleWeek[];
    rationale: string;
}

interface BuildPlanInput {
    goal: string;
    daysPerWeek: number;
    adaptiveSignal?: AdaptiveTrainingSignal | null;
    injuryRiskScore?: number;
    coldStartMode?: boolean;
}

function normalizeGoal(goal: string): string {
    return (goal || '').toLowerCase();
}

function getGoalFocus(goal: string): string {
    const normalized = normalizeGoal(goal);
    if (normalized.includes('força') || normalized.includes('forca')) return 'força neural e execução técnica';
    if (normalized.includes('emagrec') || normalized.includes('perda')) return 'densidade metabólica e consistência';
    if (normalized.includes('resist')) return 'capacidade de trabalho e recuperação';
    if (normalized.includes('saúde') || normalized.includes('saude')) return 'segurança, mobilidade e aderência';
    return 'hipertrofia com progressão sustentável';
}

export function buildWeeklyMicrocyclePlan(input: BuildPlanInput): WeeklyMicrocyclePlan {
    const goalFocus = getGoalFocus(input.goal);
    const readiness = input.adaptiveSignal?.readinessScore ?? 65;
    const fatigue = input.adaptiveSignal?.fatigueLevel ?? 'moderate';
    const injuryRiskScore = input.injuryRiskScore ?? 45;
    const conservativeMode = fatigue === 'high' || injuryRiskScore >= 70 || Boolean(input.coldStartMode);

    let weeks: WeeklyMicrocycleWeek[] = [
        {
            week: 1,
            phase: 'Acúmulo',
            focus: `Base técnica para ${goalFocus}`,
            volumeDeltaPct: 0,
            intensityDeltaPct: 0,
            instruction: 'Priorizar execução perfeita, RPE alvo 6-7.'
        },
        {
            week: 2,
            phase: 'Intensificação',
            focus: `Progressão gradual de ${goalFocus}`,
            volumeDeltaPct: 6,
            intensityDeltaPct: 2,
            instruction: 'Aumentar carga/reps apenas com técnica estável.'
        },
        {
            week: 3,
            phase: 'Consolidação',
            focus: `Pico controlado para ${goalFocus}`,
            volumeDeltaPct: 9,
            intensityDeltaPct: 4,
            instruction: 'Semana de maior estímulo, monitorar fadiga diariamente.'
        },
        {
            week: 4,
            phase: 'Deload',
            focus: 'Recuperação e sensibilização para novo bloco',
            volumeDeltaPct: -25,
            intensityDeltaPct: -10,
            instruction: 'Reduzir volume e manter técnica para consolidar adaptação.'
        }
    ];

    if (conservativeMode) {
        weeks = [
            {
                week: 1,
                phase: 'Acúmulo',
                focus: `Controle de carga para ${goalFocus}`,
                volumeDeltaPct: -12,
                intensityDeltaPct: -8,
                instruction: 'Entrar em ritmo seguro, priorizar estabilidade articular.'
            },
            {
                week: 2,
                phase: 'Intensificação',
                focus: `Progressão cautelosa de ${goalFocus}`,
                volumeDeltaPct: -4,
                intensityDeltaPct: -3,
                instruction: 'Subir apenas se RPE <= 7 e sem dor pós-sessão.'
            },
            {
                week: 3,
                phase: 'Consolidação',
                focus: 'Consolidar técnica com baixa variância',
                volumeDeltaPct: 2,
                intensityDeltaPct: 1,
                instruction: 'Pequeno avanço com foco total em qualidade de movimento.'
            },
            {
                week: 4,
                phase: 'Deload',
                focus: 'Deload reforçado',
                volumeDeltaPct: -30,
                intensityDeltaPct: -15,
                instruction: 'Recuperação ampliada para reduzir risco e melhorar prontidão.'
            }
        ];
    } else if (readiness >= 80 && injuryRiskScore < 55) {
        weeks = [
            {
                week: 1,
                phase: 'Acúmulo',
                focus: `Base forte para ${goalFocus}`,
                volumeDeltaPct: 3,
                intensityDeltaPct: 1,
                instruction: 'Entrar com margem técnica e ritmo consistente.'
            },
            {
                week: 2,
                phase: 'Intensificação',
                focus: `Escalada de estímulo para ${goalFocus}`,
                volumeDeltaPct: 8,
                intensityDeltaPct: 3,
                instruction: 'Progressão dupla (reps e carga) com RPE 7-8.'
            },
            {
                week: 3,
                phase: 'Consolidação',
                focus: 'Pico de estímulo com controle',
                volumeDeltaPct: 11,
                intensityDeltaPct: 5,
                instruction: 'Semana mais forte do bloco, sem romper técnica.'
            },
            {
                week: 4,
                phase: 'Deload',
                focus: 'Deload funcional',
                volumeDeltaPct: -20,
                intensityDeltaPct: -8,
                instruction: 'Reduzir carga total para supercompensação.'
            }
        ];
    }

    return {
        weeks,
        rationale: `Plano semanal automático para ${input.daysPerWeek} dias/semana, readiness ${readiness}, risco ${injuryRiskScore}.`
    };
}
