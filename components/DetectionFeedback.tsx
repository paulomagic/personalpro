// DetectionFeedback - Componente Visual de Feedback de Detecção
// Mostra ao personal O QUE foi detectado e QUAIS restrições serão aplicadas

import React, { useMemo } from 'react';
import {
    detectConditionsEnhanced,
    formatConditionName,
    getRestrictionsDescription,
    type DetectionResult
} from '../services/ai/knowledge/conditionDetection';

interface DetectionFeedbackProps {
    observations: string;
    injuries?: string;
    age?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    className?: string;
    compact?: boolean;  // Modo compacto para espaços menores
}

export const DetectionFeedback: React.FC<DetectionFeedbackProps> = ({
    observations,
    injuries,
    age,
    weight,
    height,
    bmi,
    className = '',
    compact = false
}) => {
    // Detecta condições quando inputs mudam
    const detection: DetectionResult = useMemo(() => {
        return detectConditionsEnhanced(observations, injuries, age, bmi, weight, height);
    }, [observations, injuries, age, bmi, weight, height]);

    const { conditions, restrictions, blockedExercises } = detection;
    const restrictionDescriptions = getRestrictionsDescription(restrictions);

    // Se não detectou nada, mostra mensagem simples
    if (conditions.length === 0) {
        return (
            <div className={`rounded-2xl bg-green-500/10 border border-green-500/20 p-4 ${className}`}>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400">verified</span>
                    <span className="text-sm text-green-400 font-medium">
                        Nenhuma condição especial detectada
                    </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                    O sistema usará parâmetros padrão para este aluno.
                </p>
            </div>
        );
    }

    // Modo compacto - apenas lista de badges
    if (compact) {
        return (
            <div className={`rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 ${className}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-blue-400 text-sm">warning</span>
                    <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                        {conditions.length} condição{conditions.length !== 1 ? 'ões' : ''} detectada{conditions.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {conditions.map((cond, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-500/20 text-amber-300 rounded-full text-xs font-medium"
                        >
                            {formatConditionName(cond.type)}
                            {cond.location && ` (${cond.location})`}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    // Modo completo
    return (
        <div className={`rounded-2xl bg-slate-800/50 border border-blue-500/30 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-blue-500/20 px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">health_and_safety</span>
                <h3 className="font-bold text-amber-300 text-sm tracking-wide">
                    🔍 CONDIÇÕES DETECTADAS
                </h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Condições detectadas */}
                <div>
                    <div className="flex flex-wrap gap-2">
                        {conditions.map((cond, idx) => (
                            <ConditionBadge key={idx} condition={cond} />
                        ))}
                    </div>
                </div>

                {/* Restrições aplicadas */}
                {restrictionDescriptions.length > 0 && (
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="font-semibold text-blue-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">shield</span>
                            Restrições Aplicadas
                        </h4>
                        <ul className="space-y-1.5">
                            {restrictionDescriptions.map((desc, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                    <span className="text-blue-400 mt-0.5">•</span>
                                    {desc}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Exercícios bloqueados (resumido) */}
                {blockedExercises.length > 0 && (
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="font-semibold text-red-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">block</span>
                            Exercícios Evitados ({blockedExercises.length})
                        </h4>
                        <div className="flex flex-wrap gap-1">
                            {blockedExercises.slice(0, 8).map((ex, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs"
                                >
                                    {ex}
                                </span>
                            ))}
                            {blockedExercises.length > 8 && (
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                                    +{blockedExercises.length - 8} mais
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Volume/Intensidade modifier */}
                {(restrictions.volume_modifier < 1.0 || restrictions.intensity_modifier < 1.0) && (
                    <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {restrictions.volume_modifier < 1.0 && (
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-400">
                                        {Math.round(restrictions.volume_modifier * 100)}%
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase">Volume</div>
                                </div>
                            )}
                            {restrictions.intensity_modifier < 1.0 && (
                                <div className="text-center">
                                    <div className="text-lg font-bold text-orange-400">
                                        {Math.round(restrictions.intensity_modifier * 100)}%
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase">Intensidade</div>
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-slate-400">Ajuste automático</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Badge individual para cada condição
const ConditionBadge: React.FC<{ condition: { type: string; location?: string; severity?: string; notes?: string } }> = ({
    condition
}) => {
    // Cores por tipo de condição
    const getColors = (type: string): string => {
        if (['hernia', 'espondilolistese', 'lesao_ligamentar'].includes(type)) {
            return 'bg-red-500/20 text-red-300 border-red-500/30'; // Grave
        }
        if (['artrose', 'condromalacia', 'menisco', 'protese'].includes(type)) {
            return 'bg-orange-500/20 text-orange-300 border-orange-500/30'; // Moderado
        }
        if (['idoso', 'gestante', 'pos_parto'].includes(type)) {
            return 'bg-purple-500/20 text-purple-300 border-purple-500/30'; // População especial
        }
        if (['obesidade', 'hipertensao', 'diabetes'].includes(type)) {
            return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'; // Metabólico
        }
        return 'bg-blue-500/20 text-amber-300 border-blue-500/30'; // Padrão
    };

    const getIcon = (type: string): string => {
        const icons: Record<string, string> = {
            idoso: 'elderly',
            gestante: 'pregnant_woman',
            pos_parto: 'baby_changing_station',
            obesidade: 'monitor_weight',
            hipertensao: 'cardiology',
            diabetes: 'glucose',
            artrose: 'arthritis',
            condromalacia: 'leg',
            hernia: 'back_hand',
            menisco: 'leg',
            protese: 'orthopedics',
            adolescente: 'face_6'
        };
        return icons[type] || 'healing';
    };

    return (
        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${getColors(condition.type)}`}>
            <span className="material-symbols-outlined text-sm">{getIcon(condition.type)}</span>
            <span className="text-sm font-medium">
                {formatConditionName(condition.type)}
                {condition.location && (
                    <span className="opacity-75"> ({condition.location})</span>
                )}
            </span>
            {condition.severity && (
                <span className="text-xs opacity-60">• {condition.severity}</span>
            )}
        </div>
    );
};

export default DetectionFeedback;
