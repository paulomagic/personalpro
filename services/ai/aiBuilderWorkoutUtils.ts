import type { Client } from '../../types';

export interface AIBuilderExercise {
    id?: string;
    name: string;
    targetMuscle?: string;
    category?: string;
    sets?: Array<{ reps?: string }>;
}

export function mapToLocalExercises(aiResult: any, localExercises: AIBuilderExercise[]) {
    if (!aiResult || !aiResult.splits) return aiResult;

    const mappedSplits = aiResult.splits.map((split: any) => ({
        ...split,
        exercises: split.exercises.map((exercise: any) => {
            let localMatch = localExercises.find((catalogExercise) =>
                catalogExercise.name.toLowerCase() === exercise.name.toLowerCase()
            );

            if (!localMatch) {
                localMatch = localExercises.find((catalogExercise) =>
                    catalogExercise.name.toLowerCase().includes(exercise.name.toLowerCase()) ||
                    exercise.name.toLowerCase().includes(catalogExercise.name.toLowerCase())
                );
            }

            if (localMatch) {
                return {
                    ...exercise,
                    id: localMatch.id,
                    videoUrl: `https://videos.apex-app.com/${localMatch.id}.mp4`,
                    isVerified: true
                };
            }

            return { ...exercise, isVerified: false };
        })
    }));

    return { ...aiResult, splits: mappedSplits };
}

function hasMeaningfulLastTraining(value?: string): boolean {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return !normalized.includes('não registrado') && !normalized.includes('iniciando');
}

export function isColdStartClient(client: Client): boolean {
    const hasAssessments = Array.isArray(client.assessments) && client.assessments.length > 0;
    const hasCompletedClasses = (client.completedClasses || 0) > 0;
    const hasTrainingHistory = hasMeaningfulLastTraining(client.lastTraining);
    return !hasAssessments && !hasCompletedClasses && !hasTrainingHistory;
}

function parseRestToSeconds(rest: string | number | undefined): number {
    if (typeof rest === 'number') return rest;
    if (!rest) return 90;
    const asText = String(rest).trim().toLowerCase();

    const mmss = asText.match(/^(\d+):(\d{1,2})$/);
    if (mmss) {
        return Number(mmss[1]) * 60 + Number(mmss[2]);
    }

    if (asText.includes('min')) {
        const match = asText.match(/(\d+)/);
        if (match) return Number(match[1]) * 60;
    }

    const match = String(rest).match(/(\d+)/);
    return match ? Number(match[1]) : 90;
}

function formatRestSeconds(seconds: number): string {
    return `${Math.max(45, Math.round(seconds))}s`;
}

export function applyColdStartProtocol(workout: any) {
    if (!workout?.splits) return workout;

    const tunedSplits = workout.splits.map((split: any) => ({
        ...split,
        exercises: (split.exercises || []).map((exercise: any) => {
            const tuneRest = (value: string | number | undefined) => formatRestSeconds(parseRestToSeconds(value) + 15);

            let tunedSets: any = Math.max(2, Number(exercise.sets || 3) - 1);
            if (Array.isArray(exercise.sets)) {
                const targetCount = Math.max(2, exercise.sets.length - 1);
                tunedSets = exercise.sets.slice(0, targetCount).map((setItem: any) => ({
                    ...setItem,
                    rest: tuneRest(setItem?.rest ?? exercise.rest)
                }));
            }

            const tunedRest = tuneRest(exercise.rest);
            return {
                ...exercise,
                sets: tunedSets,
                rest: tunedRest
            };
        })
    }));

    const existingNotes: string[] = Array.isArray(workout.personalNotes) ? workout.personalNotes : [];
    const coldStartNotes = [
        '🧭 Cold Start ativo: volume inicial reduzido para calibrar resposta individual.',
        '📈 Sessão 1: validar técnica, dor e tolerância de carga.',
        '📈 Sessão 2: manter carga e ajustar reps com base no RPE/RIR.',
        '📈 Sessão 3: iniciar progressão de carga se execução estiver estável.',
        '📝 Obrigatório coletar feedback pós-treino (RPE, dor, dificuldade, conclusão).'
    ];

    return {
        ...workout,
        splits: tunedSplits,
        coldStartMode: true,
        calibrationPlan: {
            sessions: 3,
            objectives: [
                'Baseline técnico',
                'Calibração de esforço percebido',
                'Início de progressão segura'
            ]
        },
        personalNotes: [...existingNotes, ...coldStartNotes]
    };
}

function extractKeywords(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
        .replace(/[.,;:!?]/g, ' ')
        .split(' ')
        .filter(word => word.length > 3)
        .filter(word => !['para', 'como', 'mais', 'muito', 'pouco', 'evitar', 'cuidado', 'lesão', 'antiga', 'prefere', 'gosta'].includes(word));
}

export function generateSmartWorkout(client: Client, observations: string, exerciseCatalog: AIBuilderExercise[]) {
    const { name, goal, level, adherence, injuries, preferences } = client;

    const injuryKeywords = extractKeywords(injuries || '');
    const filteredExercises = exerciseCatalog.filter(ex => {
        const exName = ex.name.toLowerCase();

        for (const keyword of injuryKeywords) {
            if (keyword.includes('joelho') && (exName.includes('agachamento') || exName.includes('leg press'))) return false;
            if (keyword.includes('ombro') && (exName.includes('desenvolvimento') || exName.includes('elevação') || exName.includes('supino inclinado'))) return false;
            if (keyword.includes('coluna') || keyword.includes('hérnia') || keyword.includes('disco')) {
                if (exName.includes('stiff') || exName.includes('terra') || exName.includes('agachamento livre') || exName.includes('good morning')) return false;
            }
            if (keyword.includes('pulso') && (exName.includes('rosca') || exName.includes('flexão'))) return false;
        }
        return true;
    });

    const preferenceKeywords = extractKeywords(preferences || '');
    const prioritizedExercises = [...filteredExercises].sort((a, b) => {
        const aScore = preferenceKeywords.some(k => a.name.toLowerCase().includes(k)) ? -1 : 0;
        const bScore = preferenceKeywords.some(k => b.name.toLowerCase().includes(k)) ? -1 : 0;
        return aScore - bScore;
    });

    let exercisesPerSplit = 5;
    let setsPerExercise = 4;
    if (adherence >= 85) {
        exercisesPerSplit = 6;
        setsPerExercise = 4;
    } else if (adherence >= 70) {
        exercisesPerSplit = 5;
        setsPerExercise = 4;
    } else if (adherence >= 50) {
        exercisesPerSplit = 4;
        setsPerExercise = 3;
    } else {
        exercisesPerSplit = 3;
        setsPerExercise = 3;
    }

    const methodsByLevel: { [key: string]: string[] } = {
        'Iniciante': ['simples'],
        'Intermediário': ['simples', 'piramide', 'biset'],
        'Avançado': ['simples', 'piramide', 'biset', 'dropset', 'restPause'],
        'Atleta': ['simples', 'piramide', 'biset', 'dropset', 'restPause', 'cluster', 'myo']
    };
    const allowedMethods = methodsByLevel[level] || methodsByLevel['Intermediário'];

    const getEx = (muscle: string, count: number) => {
        return prioritizedExercises
            .filter(e => (e.targetMuscle?.includes(muscle) ?? false) || (muscle === 'Cardio' && e.category === 'cardio'))
            .slice(0, count)
            .map(e => ({
                name: e.name,
                sets: setsPerExercise,
                reps: e.sets?.[0]?.reps || '12',
                rest: level === 'Iniciante' ? '90s' : level === 'Avançado' || level === 'Atleta' ? '60s' : '75s',
                targetMuscle: e.targetMuscle || 'Geral',
                method: allowedMethods[Math.floor(Math.random() * allowedMethods.length)]
            }));
    };

    let splits: any[] = [];
    let title = '';
    let objective = '';
    const personalNotes: string[] = [];

    if (injuries && injuries.toLowerCase() !== 'nenhuma') {
        personalNotes.push(`⚠️ Evitando exercícios que afetam: ${injuries.split('-')[0].trim()}`);
    }
    if (adherence < 60) {
        personalNotes.push(`📉 Treino reduzido: aderência em ${adherence}% - foco em consistência`);
    } else if (adherence >= 85) {
        personalNotes.push(`🔥 Volume aumentado: aderência excelente (${adherence}%)`);
    }
    if (preferences) {
        personalNotes.push(`❤️ Priorizando: ${preferences.split('.')[0]}`);
    }
    if (observations) {
        personalNotes.push(`📝 ${observations}`);
    }

    if (goal.toLowerCase().includes('hipertrofia') || goal.toLowerCase().includes('glúteo')) {
        title = `Protocolo Hipertrofia - ${name}`;
        objective = `Foco em tensão mecânica e volume progressivo. ${level === 'Iniciante' ? 'Ênfase em técnica.' : 'Métodos avançados aplicados.'}`;

        const isGlutesFocus = goal.toLowerCase().includes('glúteo');

        if (isGlutesFocus) {
            splits = [
                { name: 'A - Glúteo & Posterior', exercises: [...getEx('Glúteo', 3), ...getEx('Posterior de Coxa', 2)] },
                { name: 'B - Superior Completo', exercises: [...getEx('Costas', 2), ...getEx('Peito', 2), ...getEx('Ombro', 1)] },
                { name: 'C - Quadríceps & Panturrilha', exercises: [...getEx('Quadríceps', 3), ...getEx('Panturrilha', 1), ...getEx('Cardio', 1)] }
            ];
        } else {
            splits = [
                { name: 'A - Empurrar (Push)', exercises: [...getEx('Peito', 2), ...getEx('Ombro', 2), ...getEx('Tríceps', 1)] },
                { name: 'B - Puxar (Pull)', exercises: [...getEx('Costas', 3), ...getEx('Bíceps', 2)] },
                { name: 'C - Pernas Completo', exercises: [...getEx('Quadríceps', 2), ...getEx('Posterior de Coxa', 1), ...getEx('Glúteo', 1), ...getEx('Panturrilha', 1)] }
            ];
        }
    } else if (goal.toLowerCase().includes('perda') || goal.toLowerCase().includes('emagrecimento')) {
        title = `Protocolo Fat Burn - ${name}`;
        objective = `Alta densidade metabólica. Descansos curtos. ${adherence < 60 ? 'Adaptado ao seu ritmo.' : 'Intensidade máxima.'}`;

        splits = [
            { name: 'A - Full Body Metabólico', exercises: [...getEx('Quadríceps', 1), ...getEx('Peito', 1), ...getEx('Costas', 1), ...getEx('Cardio', 2)] },
            { name: 'B - Inferior + HIIT', exercises: [...getEx('Glúteo', 2), ...getEx('Posterior de Coxa', 1), ...getEx('Cardio', 2)] }
        ];
    } else if (goal.toLowerCase().includes('força')) {
        title = `Protocolo Força Máxima - ${name}`;
        objective = `Foco em cargas altas e descansos longos para máxima força. Métodos: ${allowedMethods.slice(0, 2).join(', ')}.`;

        splits = [
            { name: 'A - Supino & Acessórios', exercises: [...getEx('Peito', 2), ...getEx('Tríceps', 2), ...getEx('Ombro', 1)] },
            { name: 'B - Agachamento & Posterior', exercises: [...getEx('Quadríceps', 2), ...getEx('Posterior de Coxa', 2), ...getEx('Panturrilha', 1)] },
            { name: 'C - Terra & Costas', exercises: [...getEx('Costas', 3), ...getEx('Bíceps', 2)] }
        ];
    } else if (goal.toLowerCase().includes('condicionamento')) {
        title = `Protocolo Condicionamento - ${name}`;
        objective = 'Treino funcional e metabólico para condicionamento geral.';

        splits = [
            { name: 'A - Funcional Total', exercises: [...getEx('Quadríceps', 1), ...getEx('Peito', 1), ...getEx('Costas', 1), ...getEx('Cardio', 2)] },
            { name: 'B - Core + Cardio', exercises: [...getEx('Core', 2), ...getEx('Cardio', 3)] }
        ];
    } else {
        title = `Treino Personalizado - ${name}`;
        objective = 'Treino equilibrado focado no objetivo e no perfil atual.';

        splits = [
            { name: 'A - Superior', exercises: [...getEx('Peito', 2), ...getEx('Costas', 2), ...getEx('Ombro', 1)] },
            { name: 'B - Inferior', exercises: [...getEx('Quadríceps', 2), ...getEx('Posterior de Coxa', 2), ...getEx('Glúteo', 1)] }
        ];
    }

    splits = splits.map(split => ({
        ...split,
        exercises: split.exercises.slice(0, exercisesPerSplit)
    }));

    return {
        title,
        objective,
        splits,
        personalNotes,
        clientLevel: level,
        adherenceScore: adherence
    };
}
