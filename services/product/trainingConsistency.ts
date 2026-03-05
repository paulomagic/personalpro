import type { Client, CompletedWorkout, Workout } from '../../types';

export interface StudentConsistencyStats {
    workoutsCompleted: number;
    workoutsPlanned: number;
    totalMinutes: number;
    totalLoadVolume: number;
    streak: number;
    consistencyScore: number;
    completionRate: number;
    lastCompletedAt: string | null;
}

export interface SmartGoalItem {
    id: 'sessions' | 'minutes' | 'load' | 'streak';
    label: string;
    current: number;
    target: number;
    unit: string;
    color: 'blue' | 'cyan' | 'emerald' | 'purple';
    hint: string;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDurationToMinutes(duration?: string | null): number {
    if (!duration) return 0;
    const match = duration.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
}

function resolveCompletedAt(workout: CompletedWorkout): string | null {
    return workout.date || workout.created_at || null;
}

function distinctCompletionDays(history: CompletedWorkout[]): Date[] {
    const unique = new Map<string, Date>();

    for (const workout of history) {
        const completedAt = resolveCompletedAt(workout);
        if (!completedAt) continue;
        const date = startOfDay(new Date(completedAt));
        if (Number.isNaN(date.getTime())) continue;
        unique.set(date.toISOString(), date);
    }

    return Array.from(unique.values()).sort((a, b) => b.getTime() - a.getTime());
}

function calculateCurrentStreak(history: CompletedWorkout[]): number {
    const days = distinctCompletionDays(history);
    if (!days.length) return 0;

    let streak = 1;
    for (let index = 1; index < days.length; index += 1) {
        const previous = days[index - 1];
        const current = days[index];
        const diffDays = Math.round((previous.getTime() - current.getTime()) / 86400000);
        if (diffDays !== 1) break;
        streak += 1;
    }

    return streak;
}

function filterWindow(history: CompletedWorkout[], windowDays: number): CompletedWorkout[] {
    const threshold = Date.now() - windowDays * 86400000;
    return history.filter((workout) => {
        const completedAt = resolveCompletedAt(workout);
        if (!completedAt) return false;
        const timestamp = new Date(completedAt).getTime();
        return Number.isFinite(timestamp) && timestamp >= threshold;
    });
}

export function derivePlannedSessionsPerWeek(
    client: Client | null,
    currentWorkout: Workout | null
): number {
    const splitCount = Array.isArray(currentWorkout?.splits) ? currentWorkout!.splits.length : 0;
    if (splitCount > 0) return clamp(splitCount, 2, 6);

    const adherence = client?.adherence ?? 70;
    if (adherence >= 85) return 5;
    if (adherence >= 65) return 4;
    if (adherence >= 45) return 3;
    return 2;
}

export function deriveStudentConsistencyStats(params: {
    history: CompletedWorkout[];
    client: Client | null;
    currentWorkout: Workout | null;
}): StudentConsistencyStats {
    const recentHistory = filterWindow(params.history, 7);
    const workoutsCompleted = recentHistory.length;
    const workoutsPlanned = derivePlannedSessionsPerWeek(params.client, params.currentWorkout);
    const totalMinutes = recentHistory.reduce((sum, workout) => sum + parseDurationToMinutes(workout.duration), 0);
    const totalLoadVolume = recentHistory.reduce((sum, workout) => sum + (workout.total_load_volume || 0), 0);
    const streak = calculateCurrentStreak(params.history);
    const completionRate = workoutsPlanned > 0 ? clamp((workoutsCompleted / workoutsPlanned) * 100, 0, 100) : 0;
    const consistencyScore = Math.round(clamp(completionRate * 0.7 + (params.client?.adherence || 0) * 0.3, 0, 100));

    return {
        workoutsCompleted,
        workoutsPlanned,
        totalMinutes,
        totalLoadVolume,
        streak,
        consistencyScore,
        completionRate,
        lastCompletedAt: resolveCompletedAt(params.history[0]) || null
    };
}

export function deriveSmartGoals(params: {
    history: CompletedWorkout[];
    client: Client | null;
    currentWorkout: Workout | null;
}): SmartGoalItem[] {
    const stats = deriveStudentConsistencyStats(params);
    const recentHistory = filterWindow(params.history, 14);
    const averageMinutes = recentHistory.length > 0
        ? Math.round(recentHistory.reduce((sum, workout) => sum + parseDurationToMinutes(workout.duration), 0) / recentHistory.length)
        : 45;
    const averageLoad = recentHistory.length > 0
        ? Math.round(recentHistory.reduce((sum, workout) => sum + (workout.total_load_volume || 0), 0) / recentHistory.length)
        : 0;

    const minutesTarget = Math.max(stats.workoutsPlanned * averageMinutes, stats.workoutsPlanned * 40);
    const weeklyLoadTarget = averageLoad > 0
        ? Math.round(averageLoad * stats.workoutsPlanned * (stats.consistencyScore >= 80 ? 1.06 : 1))
        : stats.workoutsPlanned * 800;
    const streakTarget = Math.max(3, Math.min(14, stats.streak + 2));

    return [
        {
            id: 'sessions',
            label: 'Sessões na Semana',
            current: stats.workoutsCompleted,
            target: stats.workoutsPlanned,
            unit: '',
            color: 'blue',
            hint: stats.completionRate >= 100 ? 'Meta semanal concluída.' : `Faltam ${Math.max(stats.workoutsPlanned - stats.workoutsCompleted, 0)} sessões para fechar a semana.`
        },
        {
            id: 'minutes',
            label: 'Minutos de Treino',
            current: stats.totalMinutes,
            target: minutesTarget,
            unit: 'min',
            color: 'cyan',
            hint: `Baseado na sua média recente de ${averageMinutes} min por sessão.`
        },
        {
            id: 'load',
            label: 'Volume Total',
            current: Math.round(stats.totalLoadVolume),
            target: weeklyLoadTarget,
            unit: 'kg',
            color: 'emerald',
            hint: averageLoad > 0 ? 'Meta calibrada pelo volume das últimas sessões.' : 'Meta inicial conservadora até acumular histórico.'
        },
        {
            id: 'streak',
            label: 'Sequência',
            current: stats.streak,
            target: streakTarget,
            unit: 'd',
            color: 'purple',
            hint: stats.streak > 0 ? 'Consistência diária aumenta a progressão automática.' : 'Complete hoje para iniciar sua sequência.'
        }
    ];
}

export function buildConsistencyRecommendation(stats: StudentConsistencyStats): string {
    if (stats.consistencyScore >= 85) {
        return 'Consistência alta. A recomendação é manter o ritmo e subir estímulo de forma controlada.';
    }
    if (stats.consistencyScore >= 65) {
        return 'Consistência estável. O foco deve ser fechar a meta semanal antes de aumentar carga.';
    }
    return 'Consistência abaixo do ideal. Reduzir fricção e proteger o hábito vale mais que aumentar volume.';
}
