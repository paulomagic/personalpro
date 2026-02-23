// Sistema de blacklist e priorização de exercícios
// Previne exercícios inadequados para determinados contextos (academia vs. casa)

import type { Exercise } from '../../exerciseService';

const isDev = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
    if (isDev) console.log(...args);
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

/**
 * FUNÇÃO PRINCIPAL: Filtrar exercícios por contexto (academia/casa)
 * Remove exercícios inadequados da lista de candidatos
 */
export function filterByContext(
    exercises: Exercise[],
    context: TrainingContext
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
            debugLog(`[Blacklist] ❌ Removido "${ex.name}": ${blacklist.reason}`);
            return false;
        }

        // Check blacklisted patterns
        const isBlacklistedPattern = blacklist.blacklistedPatterns.some(pattern =>
            pattern.test(ex.name)
        );

        if (isBlacklistedPattern) {
            debugLog(`[Blacklist] ❌ Removido "${ex.name}" (pattern match): ${blacklist.reason}`);
            return false;
        }

        // Regra dinâmica: em academia, evitar exercícios exclusivamente de peso corporal
        // para padrões de força (exceto CORE), pois há melhores opções com sobrecarga progressiva.
        if (
            context === 'academia' &&
            ex.movement_pattern !== 'core' &&
            Array.isArray(ex.equipment) &&
            ex.equipment.length === 1 &&
            ex.equipment[0] === 'peso_corporal'
        ) {
            debugLog(`[Blacklist] ❌ Removido "${ex.name}" (bodyweight-only em academia)`);
            return false;
        }

        return true;
    });

    debugLog(`[Blacklist] ${exercises.length - filtered.length} exercícios removidos para contexto "${context}"`);
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
