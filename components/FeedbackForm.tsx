import React, { useState } from 'react';
import type { SessionFeedback } from '../services/ai/feedback/types';

// ============ PROPS ============

export interface FeedbackFormProps {
    workoutId: string;
    studentId: string;
    exerciseId: string;
    exerciseName: string;
    prescribedSets: number;
    prescribedReps: string;
    prescribedLoad?: number;
    onSubmit: (feedback: Omit<SessionFeedback, 'session_date'>) => Promise<void>;
    onCancel: () => void;
}

// ============ COMPONENT ============

export function FeedbackForm({
    workoutId,
    studentId,
    exerciseId,
    exerciseName,
    prescribedSets,
    prescribedReps,
    prescribedLoad,
    onSubmit,
    onCancel
}: FeedbackFormProps) {

    // ============ STATE ============

    const [setsCompleted, setSetsCompleted] = useState(prescribedSets);
    const [repsPerSet, setRepsPerSet] = useState<number[]>(Array(prescribedSets).fill(0));
    const [loadUsed, setLoadUsed] = useState(prescribedLoad || 0);
    const [rpe, setRpe] = useState<number | undefined>();
    const [rir, setRir] = useState<number | undefined>();
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ============ HANDLERS ============

    const handleSetsChange = (newSets: number) => {
        setSetsCompleted(newSets);

        // Ajustar array de reps
        if (newSets > repsPerSet.length) {
            setRepsPerSet([...repsPerSet, ...Array(newSets - repsPerSet.length).fill(0)]);
        } else {
            setRepsPerSet(repsPerSet.slice(0, newSets));
        }
    };

    const handleRepsChange = (setIndex: number, reps: number) => {
        const newReps = [...repsPerSet];
        newReps[setIndex] = reps;
        setRepsPerSet(newReps);
    };

    const handleSubmit = async () => {
        // Validação
        if (!rpe && !rir) {
            alert('Por favor, informe RPE ou RIR');
            return;
        }

        if (repsPerSet.some(r => r === 0)) {
            alert('Por favor, preencha todas as repetições');
            return;
        }

        setIsSubmitting(true);

        try {
            const feedback: Omit<SessionFeedback, 'session_date'> = {
                workout_id: workoutId,
                student_id: studentId,
                exercise_id: exerciseId,
                sets_completed: setsCompleted,
                reps_completed: repsPerSet.slice(0, setsCompleted),
                load_used: loadUsed,
                rpe,
                rir,
                notes: notes.trim() || undefined
            };

            await onSubmit(feedback);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============ RENDER ============

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="border-b pb-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                    Feedback de Treino
                </h3>
                <p className="text-sm text-gray-600 mt-1">{exerciseName}</p>
                <p className="text-xs text-gray-500 mt-1">
                    Prescrito: {prescribedSets} séries x {prescribedReps} reps
                    {prescribedLoad && ` @ ${prescribedLoad}kg`}
                </p>
            </div>

            <div className="space-y-6">
                {/* Séries Completadas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Séries Completadas
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={setsCompleted}
                        onChange={(e) => handleSetsChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Repetições por Série */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repetições por Série
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: setsCompleted }).map((_, i) => (
                            <div key={i}>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Série {i + 1}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={repsPerSet[i] || ''}
                                    onChange={(e) => handleRepsChange(i, Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Carga Usada */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Carga Usada (kg)
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={loadUsed}
                        onChange={(e) => setLoadUsed(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* RPE Slider */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        RPE (Esforço Percebido): {rpe ? rpe.toFixed(1) : '-'} / 10
                    </label>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">Fácil</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={rpe || 5}
                            onChange={(e) => setRpe(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Máximo</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                        {rpe && rpe <= 3 && '😌 Muito fácil'}
                        {rpe && rpe > 3 && rpe <= 5 && '🙂 Fácil'}
                        {rpe && rpe > 5 && rpe <= 7 && '😐 Moderado'}
                        {rpe && rpe > 7 && rpe <= 9 && '😰 Difícil'}
                        {rpe && rpe > 9 && '😵 Máximo esforço'}
                    </div>
                </div>

                {/* RIR Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        RIR (Reps em Reserva)
                    </label>
                    <select
                        value={rir ?? ''}
                        onChange={(e) => setRir(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecione...</option>
                        <option value="0">0 - Falha completa (não conseguia mais nenhuma)</option>
                        <option value="1">1 - Mais 1 rep era possível</option>
                        <option value="2">2 - Mais 2 reps eram possíveis</option>
                        <option value="3">3 - Mais 3 reps eram possíveis</option>
                        <option value="4">4 - Mais 4 reps eram possíveis</option>
                        <option value="5">5+ - Muito fácil, muitas reps em reserva</option>
                    </select>
                </div>

                {/* Observações */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações (opcional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Como se sentiu? Alguma dor ou desconforto?"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Salvando...' : 'Salvar Feedback'}
                </button>
            </div>
        </div>
    );
}
