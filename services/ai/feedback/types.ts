// Feedback Types - Session Feedback and Progression Adjustment
// Tipos para coleta de feedback pós-sessão e ajuste automático de progressão

// ============ TIPOS DE FEEDBACK ============

export interface SessionFeedback {
    workout_id: string;
    student_id: string;
    exercise_id: string;
    session_date: string;

    // Dados executados
    sets_completed: number;
    reps_completed: number[];  // Array de reps por série [12, 10, 9, 8]
    load_used: number;          // Carga em kg

    // Percepção de esforço
    rpe?: number;               // Rating of Perceived Exertion (1-10)
    rir?: number;               // Reps in Reserve (0-5)

    // Metadata
    notes?: string;
}

// ============ TIPOS DE AJUSTE ============

export type AdjustmentReason =
    | 'too_easy'          // RIR muito alto + completou todas as reps
    | 'too_hard'          // RIR muito baixo (falhou)
    | 'optimal'           // RIR no alvo
    | 'increase_reps'     // Manter carga, aumentar reps
    | 'deload';           // Reduzir carga significativamente

export interface ProgressionAdjustment {
    exercise_id: string;
    current_load: number;
    suggested_load: number;
    load_change_percent: number;  // Percentual de mudança
    adjustment_reason: AdjustmentReason;
    confidence: number;           // 0-1
    notes?: string;
}

// ============ CONFIGURAÇÃO DE PROGRESSÃO ============

export interface ProgressionConfig {
    target_rir: number;           // RIR alvo (default: 2)
    rir_tolerance: number;        // Tolerância (default: 1)
    load_increase_percent: number; // Aumento quando muito fácil (default: 2.5%)
    load_decrease_percent: number; // Redução quando muito difícil (default: 5%)
    min_reps_for_increase: number; // Mínimo de reps para aumentar carga (default: 10)
}

export const DEFAULT_PROGRESSION_CONFIG: ProgressionConfig = {
    target_rir: 2,
    rir_tolerance: 1,
    load_increase_percent: 2.5,
    load_decrease_percent: 5.0,
    min_reps_for_increase: 10
};

// ============ HISTÓRICO DE PROGRESSÃO ============

export interface ProgressionHistory {
    exercise_id: string;
    student_id: string;
    sessions: Array<{
        date: string;
        load: number;
        sets: number;
        reps: number[];
        rpe?: number;
        rir?: number;
        adjustment?: ProgressionAdjustment;
    }>;
}
