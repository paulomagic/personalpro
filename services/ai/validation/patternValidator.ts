import type { MovementPattern } from '../types';

const isDev = import.meta.env.DEV;
const debugLog = (...args: unknown[]) => {
    if (isDev) console.log(...args);
};

// ============ TYPES ============

export interface DayWithPatterns {
    day_id: string;
    label: string;
    patterns: MovementPattern[];
}

export interface PatternViolation {
    day1: string;
    day2: string;
    repeatedPattern: MovementPattern;
    severity: 'low' | 'medium' | 'high';
}

export interface PatternValidationResult {
    valid: boolean;
    violations: PatternViolation[];
    warnings: string[];
}

// ============ SEVERITY CLASSIFICATION ============

/**
 * Padrões compostos de alta demanda que precisam de mais recuperação
 */
const HIGH_SEVERITY_PATTERNS: MovementPattern[] = [
    'empurrar_horizontal',
    'empurrar_vertical',
    'puxar_horizontal',
    'puxar_vertical',
    'agachar',
    'hinge'
];

/**
 * Padrões de isolamento que podem ser repetidos com menos risco
 */
const LOW_SEVERITY_PATTERNS: MovementPattern[] = [
    'isolar_biceps',
    'isolar_triceps',
    'isolar_panturrilha',
    'isolar_antebraco'
];

/**
 * Determina a severidade da repetição de um padrão
 */
function getSeverity(pattern: MovementPattern): 'low' | 'medium' | 'high' {
    if (HIGH_SEVERITY_PATTERNS.includes(pattern)) {
        return 'high';
    }

    if (LOW_SEVERITY_PATTERNS.includes(pattern)) {
        return 'low';
    }

    return 'medium';
}

// ============ VALIDATION LOGIC ============

/**
 * Valida se há padrões biomecânicos repetidos em dias consecutivos
 * 
 * @param days - Array de dias com seus padrões
 * @returns Resultado da validação com violações e warnings
 * 
 * @example
 * ```typescript
 * const days = [
 *   { day_id: '1', label: 'Dia A', patterns: ['empurrar_horizontal', 'puxar_horizontal'] },
 *   { day_id: '2', label: 'Dia B', patterns: ['empurrar_horizontal', 'agachar'] }
 * ];
 * 
 * const result = validateConsecutivePatterns(days);
 * // result.violations: [{ day1: 'Dia A', day2: 'Dia B', repeatedPattern: 'empurrar_horizontal', severity: 'high' }]
 * ```
 */
export function validateConsecutivePatterns(
    days: DayWithPatterns[]
): PatternValidationResult {

    const violations: PatternViolation[] = [];
    const warnings: string[] = [];

    // Validar cada par de dias consecutivos
    for (let i = 0; i < days.length - 1; i++) {
        const currentDay = days[i];
        const nextDay = days[i + 1];

        // Converter para Set para facilitar comparação
        const currentPatterns = new Set(currentDay.patterns);
        const nextPatterns = new Set(nextDay.patterns);

        // Encontrar padrões repetidos
        const repeated: MovementPattern[] = [];
        for (const pattern of currentPatterns) {
            if (nextPatterns.has(pattern)) {
                repeated.push(pattern);
            }
        }

        // Processar cada padrão repetido
        if (repeated.length > 0) {
            repeated.forEach(pattern => {
                const severity = getSeverity(pattern);

                violations.push({
                    day1: currentDay.label,
                    day2: nextDay.label,
                    repeatedPattern: pattern,
                    severity
                });

                // Gerar warnings baseado na severidade
                if (severity === 'high') {
                    warnings.push(
                        `⚠️ CRÍTICO: Padrão "${pattern}" repetido em ${currentDay.label} e ${nextDay.label}. ` +
                        `Isso pode prejudicar a recuperação muscular. Considere reorganizar os dias.`
                    );
                } else if (severity === 'medium') {
                    warnings.push(
                        `⚠️ Padrão "${pattern}" repetido em ${currentDay.label} e ${nextDay.label}. ` +
                        `Recomenda-se variar os padrões para otimizar recuperação.`
                    );
                } else {
                    // Low severity - apenas log, não warning
                    debugLog(
                        `[PatternValidator] ℹ️ Padrão "${pattern}" repetido em ${currentDay.label} e ${nextDay.label} (baixa severidade - OK).`
                    );
                }
            });
        }
    }

    // Sistema é válido se não houver violações de alta severidade
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;

    return {
        valid: highSeverityCount === 0,
        violations,
        warnings
    };
}

// ============ HELPER FUNCTIONS ============

/**
 * Extrai padrões de um treino gerado para validação
 * 
 * @param workout - Treino gerado completo
 * @returns Array de dias com seus padrões
 */
export function extractPatternsFromWorkout(
    workout: any // GeneratedWorkout type
): DayWithPatterns[] {
    return workout.days.map((day: any) => ({
        day_id: day.day_id || day.label,
        label: day.label,
        patterns: day.slots
            .map((slot: any) => slot.movement_pattern)
            .filter((p: any) => p !== undefined && p !== null)
    }));
}

/**
 * Gera recomendações para resolver violações de padrões
 * 
 * @param violations - Lista de violações detectadas
 * @returns Array de sugestões de correção
 */
export function generateRecommendations(
    violations: PatternViolation[]
): string[] {
    const recommendations: string[] = [];

    // Agrupar por severidade
    const highSeverity = violations.filter(v => v.severity === 'high');
    const mediumSeverity = violations.filter(v => v.severity === 'medium');

    if (highSeverity.length > 0) {
        recommendations.push(
            '🔄 Considere reorganizar os dias do treino para espaçar padrões compostos.'
        );

        recommendations.push(
            `📋 Padrões problemáticos: ${[...new Set(highSeverity.map(v => v.repeatedPattern))].join(', ')}`
        );
    }

    if (mediumSeverity.length > 0) {
        recommendations.push(
            '💡 Variar os padrões pode melhorar a recuperação e progressão.'
        );
    }

    if (highSeverity.length === 0 && mediumSeverity.length === 0) {
        recommendations.push(
            '✅ Distribuição de padrões está otimizada para recuperação.'
        );
    }

    return recommendations;
}

/**
 * Formata o resultado da validação para log legível
 */
export function formatValidationResult(result: PatternValidationResult): string {
    const lines: string[] = [];

    lines.push('=== PATTERN VALIDATOR RESULT ===');
    lines.push(`Status: ${result.valid ? '✅ VÁLIDO' : '⚠️ ATENÇÃO'}`);
    lines.push(`Violações: ${result.violations.length}`);
    lines.push('');

    if (result.violations.length > 0) {
        lines.push('Detalhes:');
        result.violations.forEach(v => {
            const icon = v.severity === 'high' ? '🔴' : v.severity === 'medium' ? '🟡' : '🟢';
            lines.push(`  ${icon} ${v.day1} → ${v.day2}: ${v.repeatedPattern} (${v.severity})`);
        });
        lines.push('');
    }

    if (result.warnings.length > 0) {
        lines.push('Warnings:');
        result.warnings.forEach(w => lines.push(`  ${w}`));
        lines.push('');
    }

    const recommendations = generateRecommendations(result.violations);
    if (recommendations.length > 0) {
        lines.push('Recomendações:');
        recommendations.forEach(r => lines.push(`  ${r}`));
    }

    return lines.join('\n');
}
