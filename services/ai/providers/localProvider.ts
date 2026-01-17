// Local Provider - Fallback Smart Generator
// Used when external providers fail

import type { AIProvider, ProviderRequest, ProviderResponse, MovementPattern } from '../types';

// Movement pattern templates for local generation
const MOVEMENT_TEMPLATES: Record<string, Array<{
    movement_pattern: MovementPattern;
    primary_muscle: string;
    sets: number;
    reps: string;
    rest: string;
}>> = {
    'push': [
        { movement_pattern: 'empurrar_horizontal', primary_muscle: 'peito', sets: 4, reps: '8-12', rest: '60s' },
        { movement_pattern: 'empurrar_horizontal', primary_muscle: 'peito', sets: 3, reps: '10-12', rest: '45s' },
        { movement_pattern: 'empurrar_vertical', primary_muscle: 'ombro', sets: 4, reps: '8-10', rest: '60s' },
        { movement_pattern: 'empurrar_vertical', primary_muscle: 'ombro', sets: 3, reps: '12-15', rest: '45s' },
    ],
    'pull': [
        { movement_pattern: 'puxar_vertical', primary_muscle: 'costas', sets: 4, reps: '8-10', rest: '60s' },
        { movement_pattern: 'puxar_horizontal', primary_muscle: 'costas', sets: 4, reps: '8-12', rest: '60s' },
        { movement_pattern: 'puxar_horizontal', primary_muscle: 'costas', sets: 3, reps: '10-12', rest: '45s' },
    ],
    'legs': [
        { movement_pattern: 'agachar', primary_muscle: 'quadriceps', sets: 4, reps: '8-10', rest: '90s' },
        { movement_pattern: 'agachar', primary_muscle: 'quadriceps', sets: 3, reps: '10-12', rest: '60s' },
        { movement_pattern: 'hinge', primary_muscle: 'posterior_coxa', sets: 4, reps: '8-10', rest: '60s' },
        { movement_pattern: 'hinge', primary_muscle: 'gluteos', sets: 3, reps: '10-12', rest: '60s' },
    ],
    'core': [
        { movement_pattern: 'core', primary_muscle: 'core', sets: 3, reps: '30s', rest: '30s' },
        { movement_pattern: 'core', primary_muscle: 'core', sets: 3, reps: '15-20', rest: '30s' },
    ]
};

// Generate split based on days
function generateSplits(days: number, goal: string): Array<{
    name: string;
    focus: string;
    intentions: Array<{
        movement_pattern: MovementPattern;
        primary_muscle: string;
        sets: number;
        reps: string;
        rest: string;
    }>;
}> {
    const splits = [];

    if (days === 2) {
        splits.push({
            name: 'Treino A',
            focus: 'Full Body',
            intentions: [
                ...MOVEMENT_TEMPLATES.push.slice(0, 2),
                ...MOVEMENT_TEMPLATES.pull.slice(0, 2),
                ...MOVEMENT_TEMPLATES.legs.slice(0, 2)
            ]
        });
        splits.push({
            name: 'Treino B',
            focus: 'Full Body',
            intentions: [
                ...MOVEMENT_TEMPLATES.legs.slice(0, 2),
                ...MOVEMENT_TEMPLATES.push.slice(2, 4),
                ...MOVEMENT_TEMPLATES.pull.slice(1, 3)
            ]
        });
    } else if (days === 3) {
        splits.push({
            name: 'Treino A',
            focus: 'Push',
            intentions: [...MOVEMENT_TEMPLATES.push, ...MOVEMENT_TEMPLATES.core.slice(0, 1)]
        });
        splits.push({
            name: 'Treino B',
            focus: 'Pull',
            intentions: [...MOVEMENT_TEMPLATES.pull, ...MOVEMENT_TEMPLATES.core.slice(0, 1)]
        });
        splits.push({
            name: 'Treino C',
            focus: 'Legs',
            intentions: [...MOVEMENT_TEMPLATES.legs, ...MOVEMENT_TEMPLATES.core]
        });
    } else {
        // 4+ days - Push/Pull/Legs/Upper
        splits.push({
            name: 'Treino A',
            focus: 'Push',
            intentions: MOVEMENT_TEMPLATES.push
        });
        splits.push({
            name: 'Treino B',
            focus: 'Pull',
            intentions: MOVEMENT_TEMPLATES.pull
        });
        splits.push({
            name: 'Treino C',
            focus: 'Legs',
            intentions: MOVEMENT_TEMPLATES.legs
        });
        if (days >= 4) {
            splits.push({
                name: 'Treino D',
                focus: 'Upper Mix',
                intentions: [
                    ...MOVEMENT_TEMPLATES.push.slice(0, 2),
                    ...MOVEMENT_TEMPLATES.pull.slice(0, 2),
                    ...MOVEMENT_TEMPLATES.core
                ]
            });
        }
    }

    return splits.slice(0, days);
}

export const localProvider: AIProvider = {
    name: 'local',

    isAvailable(): boolean {
        return true; // Always available
    },

    async execute(request: ProviderRequest): Promise<ProviderResponse> {
        const startTime = Date.now();

        try {
            // Parse metadata for generation
            const { days = 3, goal = 'Hipertrofia', name = 'Aluno' } = request.metadata || {};

            if (request.action === 'training_intent') {
                const splits = generateSplits(days, goal);

                const response = {
                    title: `Protocolo ${goal} - ${name}`,
                    objective: `Programa de ${days}x por semana focado em ${goal.toLowerCase()}`,
                    splits
                };

                const text = JSON.stringify(response, null, 2);

                return {
                    success: true,
                    text,
                    provider: 'local',
                    model: 'smart-generator-v1',
                    latencyMs: Date.now() - startTime
                };
            }

            if (request.action === 'message') {
                const messages: Record<string, string> = {
                    reminder: `Olá! 👋 Lembrete do seu treino de hoje. Vamos manter o foco! 💪`,
                    motivation: `Você está mandando muito bem! Continue assim que os resultados vão aparecer! 🔥`,
                    billing: `Oi! Passando para lembrar sobre o pagamento deste mês. Qualquer dúvida, me chama! 😊`,
                    congratulation: `Parabéns pela conquista! Seu esforço está valendo a pena! 🎉`
                };

                const messageType = request.metadata?.type || 'motivation';

                return {
                    success: true,
                    text: messages[messageType] || messages.motivation,
                    provider: 'local',
                    model: 'template-v1',
                    latencyMs: Date.now() - startTime
                };
            }

            // Default: return empty
            return {
                success: false,
                text: null,
                provider: 'local',
                model: 'none',
                latencyMs: Date.now() - startTime,
                error: `Action ${request.action} not supported by local provider`
            };

        } catch (error: any) {
            return {
                success: false,
                text: null,
                provider: 'local',
                model: 'none',
                latencyMs: Date.now() - startTime,
                error: error?.message || 'Local generation failed'
            };
        }
    }
};

export default localProvider;
