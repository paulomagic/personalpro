/**
 * Exemplo de integração do FeedbackForm em uma página de treino
 * 
 * Este arquivo demonstra como usar o FeedbackForm para coletar
 * feedback pós-treino e salvar no banco de dados.
 */

import React, { useState } from 'react';
import { FeedbackForm } from '../components/FeedbackForm';
import { saveSessionFeedback, getProgressionSuggestion } from '../services/ai/feedback';
import type { SessionFeedback } from '../services/ai/feedback/types';

// ============ TYPES ============

interface WorkoutExercise {
    id: string;
    name: string;
    sets: number;
    reps: string;
    load?: number;
}

// ============ COMPONENT ============

export function WorkoutHistoryPage() {
    const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    // Mock data - replace with real data from Supabase
    const workoutId = 'workout-123';
    const studentId = 'student-456';
    const exercises: WorkoutExercise[] = [
        { id: 'ex1', name: 'Supino Reto', sets: 4, reps: '8-12', load: 60 },
        { id: 'ex2', name: 'Remada Curvada', sets: 4, reps: '8-12', load: 50 },
        { id: 'ex3', name: 'Agachamento', sets: 4, reps: '10-15', load: 80 }
    ];

    // ============ HANDLERS ============

    const handleFeedbackClick = (exercise: WorkoutExercise) => {
        setSelectedExercise(exercise);
        setShowFeedbackModal(true);
    };

    const handleFeedbackSubmit = async (feedback: Omit<SessionFeedback, 'session_date'>) => {
        try {
            // Salvar feedback no banco
            const result = await saveSessionFeedback(feedback);

            if (result.success) {
                console.log('[Feedback] Salvo com sucesso:', result.id);

                // Buscar sugestão de progressão
                const suggestion = await getProgressionSuggestion(
                    feedback.student_id,
                    feedback.exercise_id
                );

                if (suggestion) {
                    // Mostrar sugestão ao usuário
                    const message = getSuggestionMessage(suggestion);
                    alert(message); // Substituir por toast/notification component
                }

                // Fechar modal
                setShowFeedbackModal(false);
                setSelectedExercise(null);
            } else {
                console.error('[Feedback] Erro ao salvar:', result.error);
                alert('Erro ao salvar feedback. Tente novamente.');
            }
        } catch (error) {
            console.error('[Feedback] Erro inesperado:', error);
            alert('Erro ao salvar feedback. Tente novamente.');
        }
    };

    const handleFeedbackCancel = () => {
        setShowFeedbackModal(false);
        setSelectedExercise(null);
    };

    // ============ HELPERS ============

    const getSuggestionMessage = (suggestion: any): string => {
        const { adjustment_reason, suggested_load, load_change_percent } = suggestion;

        switch (adjustment_reason) {
            case 'too_hard':
                return `💪 Ajuste recomendado: Reduza a carga para ${suggested_load}kg (${load_change_percent}%). Você está trabalhando muito próximo da falha.`;

            case 'too_easy':
                return `🚀 Ajuste recomendado: Aumente a carga para ${suggested_load}kg (+${load_change_percent}%). Você tem margem para progredir!`;

            case 'increase_reps':
                return `📈 Ajuste recomendado: Mantenha a carga e tente aumentar 1-2 reps. Você está progredindo bem!`;

            case 'optimal':
                return `✅ Perfeito! Continue com a mesma carga e tente aumentar reps gradualmente.`;

            default:
                return `ℹ️ Sugestão: ${suggestion.notes}`;
        }
    };

    // ============ RENDER ============

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Histórico de Treino</h1>

            {/* Lista de Exercícios */}
            <div className="space-y-4">
                {exercises.map((exercise) => (
                    <div
                        key={exercise.id}
                        className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="font-semibold text-lg">{exercise.name}</h3>
                            <p className="text-sm text-gray-600">
                                {exercise.sets} séries x {exercise.reps} reps
                                {exercise.load && ` @ ${exercise.load}kg`}
                            </p>
                        </div>

                        <button
                            onClick={() => handleFeedbackClick(exercise)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            ✍️ Adicionar Feedback
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal de Feedback */}
            {showFeedbackModal && selectedExercise && (
                <div className="fixed inset-0 bg-slate-950 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="max-w-2xl w-full">
                        <FeedbackForm
                            workoutId={workoutId}
                            studentId={studentId}
                            exerciseId={selectedExercise.id}
                            exerciseName={selectedExercise.name}
                            prescribedSets={selectedExercise.sets}
                            prescribedReps={selectedExercise.reps}
                            prescribedLoad={selectedExercise.load}
                            onSubmit={handleFeedbackSubmit}
                            onCancel={handleFeedbackCancel}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ USAGE NOTES ============

/**
 * Para integrar este componente:
 * 
 * 1. Importe o componente FeedbackForm
 * 2. Importe os serviços de feedback
 * 3. Configure os IDs corretos (workoutId, studentId, exerciseId)
 * 4. Implemente os handlers (onSubmit, onCancel)
 * 5. Mostre sugestões de progressão ao usuário
 * 
 * O feedback será automaticamente:
 * - Validado (RIR/RPE obrigatórios)
 * - Salvo no banco com timestamp
 * - Analisado para progressão
 * - Usado para ajustar cargas futuras
 */
