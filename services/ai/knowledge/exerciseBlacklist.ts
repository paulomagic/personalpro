// Sistema de blacklist e priorização de exercícios
// Previne exercícios inadequados para determinados contextos (academia vs. casa)

import type { Exercise } from '../../exerciseService';
import { createScopedLogger } from '../../appLogger';

const isDev = import.meta.env.DEV;
const exerciseBlacklistLogger = createScopedLogger('exerciseBlacklist');
const debugLog = (message: string, metadata?: unknown) => {
    if (!isDev) return;
    if (metadata === undefined) {
        exerciseBlacklistLogger.debug(message);
        return;
    }
    if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
        exerciseBlacklistLogger.debug(message, metadata as Record<string, unknown>);
        return;
    }
    exerciseBlacklistLogger.debug(message, { detail: metadata });
};

export type TrainingContext = 'academia' | 'casa' | 'parque' | 'ginastica';

export interface ExerciseBlacklist {
    context: TrainingContext;
    blacklistedNames: string[];
    blacklistedPatterns: RegExp[];
    reason: string;
}

export interface ExercisePriority {
    context: TrainingContext;
    preferredExercises: string[];
    avoidExercises: string[];
}

export interface ContextFilterOptions {
    goal?: string;
    explicitExceptions?: string[];           // Ex.: ["flexao", "burpee"] para liberar pontualmente
    allowBodyweightForPatterns?: string[];   // Ex.: ["core"]
}

interface AntiPatternRule {
    context: TrainingContext;
    keywords: string[];
    reason: string;
}

// BLACKLIST PRINCIPAL
export const EXERCISE_BLACKLISTS: ExerciseBlacklist[] = [
    {
        context: 'academia',
        blacklistedNames: [
            'Flexão de Braços',
            'Flexão de Braços Declinada',
            'Flexão de Braços Inclinada',
            'Flexão Diamante',
            'Flexão Explosiva',
            'Polichinelo',
            'Corrida no Lugar',
            'Burpee (sem peso)'
        ],
        blacklistedPatterns: [
            /^flexão\s+de\s+bra[çc]os/i,
            /\bflex[aã]o\b/i,
            /push[\s-]?up/i
        ],
        reason: 'Em academia, há opções superiores com carga progressiva (supino, crucifixo, crossover, etc)'
    },
    {
        context: 'casa',
        blacklistedNames: [
            'Supino Reto com Barra',
            'Agachamento com Barra',
            'Levantamento Terra',
            'Leg Press 45°',
            'Cadeira Extensora',
            'Cadeira Flexora'
        ],
        blacklistedPatterns: [
            /com\s+barra$/i,
            /smith\s+machine/i,
            /leg\s+press/i,
            /cadeira\s+(extensora|flexora)/i
        ],
        reason: 'Equipamentos de academia não disponíveis em casa'
    }
];

// PRIORIDADES POR CONTEXTO
export const EXERCISE_PRIORITIES: ExercisePriority[] = [
    {
        context: 'academia',
        preferredExercises: [
            // PEITO
            'Supino Reto com Barra',
            'Supino Inclinado com Halteres',
            'Supino Declinado',
            'Crucifixo na Máquina',
            'Crossover',
            // COSTAS
            'Remada Curvada com Barra',
            'Pulldown',
            'Remada Baixa no Cabo',
            'Puxada Alta',
            // PERNAS
            'Leg Press 45°',
            'Cadeira Extensora',
            'Cadeira Flexora',  // CRÍTICO para posterior de coxa
            'Mesa Flexora',
            'Stiff',
            'Levantamento Terra Romeno',
            // OMBROS
            'Desenvolvimento com Halteres',
            'Elevação Lateral com Halteres'
        ],
        avoidExercises: [
            'Flexão de Braços',
            'Prancha',
            'Polichinelo'
        ]
    },
    {
        context: 'casa',
        preferredExercises: [
            'Flexão de Braços',
            'Flexão Inclinada',
            'Flexão Declinada',
            'Agachamento Livre',
            'Afundo',
            'Prancha',
            'Abdominal Crunch'
        ],
        avoidExercises: [
            'Supino com Barra',
            'Leg Press',
            'Cadeira Extensora'
        ]
    }
];

const CONTEXT_ANTI_PATTERNS: AntiPatternRule[] = [
    {
        context: 'academia',
        keywords: [
            'polichinelo',
            'corrida no lugar',
            'jumping jack',
            'mountain climber',
            'burpee',
            'high knees'
        ],
        reason: 'Anti-padrão para academia: exercício genérico de casa sem sobrecarga progressiva'
    }
];

function normalize(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function isExplicitException(exerciseName: string, options?: ContextFilterOptions): boolean {
    if (!options?.explicitExceptions || options.explicitExceptions.length === 0) return false;
    const target = normalize(exerciseName);
    return options.explicitExceptions.some(exception => target.includes(normalize(exception)));
}

/**
 * FUNÇÃO PRINCIPAL: Filtrar exercícios por contexto (academia/casa)
 * Remove exercícios inadequados da lista de candidatos
 */
export function filterByContext(
    exercises: Exercise[],
    context: TrainingContext,
    options?: ContextFilterOptions
): Exercise[] {
    const blacklist = EXERCISE_BLACKLISTS.find(bl => bl.context === context);
    if (!blacklist) return exercises;

    const filtered = exercises.filter(ex => {
        const nameLower = ex.name.toLowerCase().trim();

        // Check blacklisted names (exact or contains)
        const isBlacklistedName = blacklist.blacklistedNames.some(name =>
            nameLower === name.toLowerCase() || nameLower.includes(name.toLowerCase())
        );

        if (isBlacklistedName) {
            debugLog('Removed blacklisted exercise by exact name', {
                exerciseName: ex.name,
                context,
                reason: blacklist.reason
            });
            return false;
        }

        // Check blacklisted patterns
        const isBlacklistedPattern = blacklist.blacklistedPatterns.some(pattern =>
            pattern.test(ex.name)
        );

        if (isBlacklistedPattern) {
            debugLog('Removed blacklisted exercise by pattern match', {
                exerciseName: ex.name,
                context,
                reason: blacklist.reason
            });
            return false;
        }

        // Regra dinâmica: em academia, evitar exercícios exclusivamente de peso corporal
        // para padrões de força (exceto CORE), pois há melhores opções com sobrecarga progressiva.
        const allowBodyweightPattern = (options?.allowBodyweightForPatterns || []).includes(ex.movement_pattern);
        if (
            context === 'academia' &&
            ex.movement_pattern !== 'core' &&
            !allowBodyweightPattern &&
            !isExplicitException(ex.name, options) &&
            Array.isArray(ex.equipment) &&
            ex.equipment.length === 1 &&
            ex.equipment[0] === 'peso_corporal'
        ) {
            debugLog('Removed bodyweight-only exercise for gym context', {
                exerciseName: ex.name,
                context
            });
            return false;
        }

        const antiPattern = CONTEXT_ANTI_PATTERNS.find(rule => {
            if (rule.context !== context) return false;
            const normalizedName = normalize(ex.name);
            return rule.keywords.some(keyword => normalizedName.includes(normalize(keyword)));
        });

        if (antiPattern && !isExplicitException(ex.name, options)) {
            debugLog('Removed anti-pattern exercise for context', {
                exerciseName: ex.name,
                context,
                reason: antiPattern.reason
            });
            return false;
        }

        return true;
    });

    debugLog('Context filtering completed', {
        context,
        removedCount: exercises.length - filtered.length,
        inputCount: exercises.length,
        outputCount: filtered.length
    });
    return filtered;
}

/**
 * FUNÇÃO: Priorizar exercícios preferidos para o contexto
 * Move exercícios preferidos para o topo da lista
 */
export function prioritizeByContext(
    exercises: Exercise[],
    context: TrainingContext
): Exercise[] {
    const priority = EXERCISE_PRIORITIES.find(p => p.context === context);
    if (!priority) return exercises;

    return exercises.sort((a, b) => {
        const aPreferred = priority.preferredExercises.some(preferred =>
            a.name.toLowerCase().includes(preferred.toLowerCase())
        );
        const bPreferred = priority.preferredExercises.some(preferred =>
            b.name.toLowerCase().includes(preferred.toLowerCase())
        );

        const aAvoided = priority.avoidExercises.some(avoided =>
            a.name.toLowerCase().includes(avoided.toLowerCase())
        );
        const bAvoided = priority.avoidExercises.some(avoided =>
            b.name.toLowerCase().includes(avoided.toLowerCase())
        );

        // Preferidos vêm primeiro
        if (aPreferred && !bPreferred) return -1;
        if (!aPreferred && bPreferred) return 1;

        // Evitados vão para o final
        if (aAvoided && !bAvoided) return 1;
        if (!aAvoided && bAvoided) return -1;

        return 0; // Mantém ordem original
    });
}
