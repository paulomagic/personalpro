// Exercise Validator - Camada Simbólica de Validação
// Valida respostas da IA contra Hard Constraints biomecânicas
// Rejeita respostas que violam regras de segurança

import { z } from 'zod';
import type { BiomechanicalRestrictions, DetectedCondition } from '../knowledge/conditionDetection';
import type { BiomechanicalProfile } from '../biomechanicalProfile';
import type { Exercise } from '../../exerciseService';

// ============ SCHEMAS ZOD ============

/**
 * Schema para a resposta estruturada da IA
 */
export const AISelectionResponseSchema = z.object({
    selected: z.number().int().min(1).max(20),
    reasoning: z.string().min(5).max(500),
    safety_check: z.object({
        kinetic_chain: z.enum(['fechada', 'aberta']).optional(),
        spinal_load: z.enum(['baixo', 'moderado', 'alto']).optional(),
        is_machine: z.boolean().optional(),
        complexity: z.enum(['baixa', 'media', 'alta']).optional()
    }).optional()
});

export type AISelectionResponse = z.infer<typeof AISelectionResponseSchema>;

// ============ RESULTADO DA VALIDAÇÃO ============

export interface ValidationResult {
    valid: boolean;
    response?: AISelectionResponse;
    violations: string[];
    warnings: string[];
    selectedExercise?: Exercise;
}

// ============ REGRAS DE VALIDAÇÃO ============

interface ValidationContext {
    conditions: DetectedCondition[];
    restrictions: BiomechanicalRestrictions;
    biomechProfile: BiomechanicalProfile;
    level: string;
    goal: string;
}

// ============ VALIDADORES ESPECÍFICOS ============

/**
 * Valida cadeia cinética vs lesões de joelho/LCA
 */
function validateKineticChain(
    exercise: Exercise,
    aiResponse: AISelectionResponse,
    context: ValidationContext
): string[] {
    const violations: string[] = [];

    // Se tem lesão de LCA, LCP, menisco ou joelho
    const hasKneeInjury = context.conditions.some(c =>
        ['lesao_ligamentar', 'menisco', 'condromalacia'].includes(c.type) ||
        c.location === 'joelho'
    );

    if (hasKneeInjury) {
        // Cadeira extensora é OKC e perigosa para LCA
        if (exercise.name.toLowerCase().includes('extensora')) {
            violations.push('VIOLAÇÃO: Cadeira extensora é Cadeia Aberta - proibido para lesão de joelho');
        }

        // IA declarou cadeia aberta em lesão de joelho
        if (aiResponse.safety_check?.kinetic_chain === 'aberta') {
            violations.push('VIOLAÇÃO: IA selecionou exercício de Cadeia Aberta para aluno com lesão de joelho');
        }
    }

    return violations;
}

/**
 * Valida carga axial vs condições de coluna
 */
function validateSpinalLoad(
    exercise: Exercise,
    aiResponse: AISelectionResponse,
    context: ValidationContext
): string[] {
    const violations: string[] = [];

    // Se tem hérnia, espondilolistese ou problema lombar
    const hasSpinalIssue = context.conditions.some(c =>
        ['hernia', 'espondilolistese', 'escoliose'].includes(c.type) ||
        c.location === 'lombar' ||
        c.location === 'coluna'
    ) || context.restrictions.avoid_axial_load;

    if (hasSpinalIssue) {
        // Exercício com carga espinhal alta
        if (exercise.spinal_load === 'alto') {
            violations.push(`VIOLAÇÃO: ${exercise.name} tem carga espinhal ALTA - proibido para problema de coluna`);
        }

        // IA declarou carga espinhal alta
        if (aiResponse.safety_check?.spinal_load === 'alto') {
            violations.push('VIOLAÇÃO: IA selecionou exercício com carga espinhal ALTA para aluno com problema de coluna');
        }

        // Exercícios específicos vetados para coluna
        const spinalDangerousExercises = [
            'terra', 'levantamento terra', 'stiff', 'good morning',
            'agachamento livre', 'agachamento com barra', 'remada curvada'
        ];

        const exerciseLower = exercise.name.toLowerCase();
        for (const dangerous of spinalDangerousExercises) {
            if (exerciseLower.includes(dangerous)) {
                violations.push(`VIOLAÇÃO: ${exercise.name} é contraindicado para problema de coluna`);
                break;
            }
        }
    }

    return violations;
}

/**
 * Valida complexidade vs nível do aluno
 */
function validateComplexity(
    exercise: Exercise,
    aiResponse: AISelectionResponse,
    context: ValidationContext
): string[] {
    const violations: string[] = [];

    const isBeginnerLevel = context.level.toLowerCase().includes('iniciante');
    const isElderly = context.conditions.some(c => c.type === 'idoso');

    if (isBeginnerLevel || isElderly) {
        // Exercício de alta estabilidade/complexidade para iniciante
        if (exercise.stability_demand === 'alto' && !exercise.is_machine) {
            violations.push(`VIOLAÇÃO: ${exercise.name} tem alta demanda de estabilidade - inadequado para ${isElderly ? 'idoso' : 'iniciante'}`);
        }

        // IA declarou alta complexidade para iniciante
        if (aiResponse.safety_check?.complexity === 'alta' && (isBeginnerLevel || isElderly)) {
            violations.push(`VIOLAÇÃO: IA selecionou exercício de ALTA complexidade para ${isElderly ? 'idoso' : 'iniciante'}`);
        }

        // Peso livre complexo para iniciante
        if (!exercise.is_machine && isBeginnerLevel && exercise.is_compound) {
            // Apenas warning, não violation (pode ser OK em alguns casos)
        }
    }

    return violations;
}

/**
 * Valida impacto vs obesidade/prótese
 */
function validateImpact(
    exercise: Exercise,
    aiResponse: AISelectionResponse,
    context: ValidationContext
): string[] {
    const violations: string[] = [];

    const hasImpactRestriction =
        context.conditions.some(c => ['obesidade', 'protese', 'artrose'].includes(c.type)) ||
        context.restrictions.max_impact_level === 'none' ||
        context.restrictions.max_impact_level === 'low';

    if (hasImpactRestriction) {
        // Exercícios de impacto
        const impactExercises = [
            'salto', 'jump', 'burpee', 'box jump', 'pular', 'corrida',
            'pliometria', 'sprint', 'step alto'
        ];

        const exerciseLower = exercise.name.toLowerCase();
        for (const impact of impactExercises) {
            if (exerciseLower.includes(impact)) {
                violations.push(`VIOLAÇÃO: ${exercise.name} é exercício de impacto - proibido para ${context.conditions.find(c => ['obesidade', 'protese', 'artrose'].includes(c.type))?.type || 'restrição de impacto'}`);
                break;
            }
        }
    }

    return violations;
}

/**
 * Valida restrições de gestante
 */
function validatePregnancy(
    exercise: Exercise,
    context: ValidationContext
): string[] {
    const violations: string[] = [];

    const isPregnant = context.conditions.some(c => c.type === 'gestante');

    if (isPregnant) {
        const exerciseLower = exercise.name.toLowerCase();

        // Posição supina (risco de síndrome da veia cava)
        const supineExercises = ['supino', 'fly', 'crucifixo', 'pullover'];
        for (const supine of supineExercises) {
            if (exerciseLower.includes(supine)) {
                violations.push(`VIOLAÇÃO: ${exercise.name} é posição supina - PROIBIDO para gestante (síndrome da veia cava)`);
                break;
            }
        }

        // Carga axial alta
        if (exercise.spinal_load === 'alto') {
            violations.push(`VIOLAÇÃO: ${exercise.name} tem carga axial alta - proibido para gestante`);
        }

        // Abdominais
        if (exerciseLower.includes('abdominal') || exerciseLower.includes('crunch') || exerciseLower.includes('prancha')) {
            violations.push(`VIOLAÇÃO: ${exercise.name} é exercício abdominal intenso - proibido para gestante`);
        }
    }

    return violations;
}

/**
 * Valida preferência por máquinas quando necessário
 */
function validateMachinePreference(
    exercise: Exercise,
    context: ValidationContext
): string[] {
    const warnings: string[] = [];

    if (context.restrictions.prefer_machines && !exercise.is_machine) {
        warnings.push(`⚠️ AVISO: ${exercise.name} é peso livre, mas máquinas são preferidas para este perfil`);
    }

    return warnings;
}

// ============ FUNÇÃO PRINCIPAL DE VALIDAÇÃO ============

/**
 * Valida a resposta da IA contra todas as Hard Constraints
 * Retorna validação com lista de violações
 */
export function validateAIResponse(
    rawResponse: string,
    candidates: Exercise[],
    context: ValidationContext
): ValidationResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    // 1. Parse JSON
    let parsed: AISelectionResponse;
    try {
        // Limpa a resposta
        let cleanText = rawResponse.trim()
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/gi, '')
            .trim();

        const jsonStart = cleanText.indexOf('{');
        const jsonEnd = cleanText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanText = cleanText.slice(jsonStart, jsonEnd + 1);
        }

        const jsonParsed = JSON.parse(cleanText);
        parsed = AISelectionResponseSchema.parse(jsonParsed);
    } catch (error: any) {
        return {
            valid: false,
            violations: [`ERRO DE SCHEMA: ${error.message}`],
            warnings: []
        };
    }

    // 2. Verificar se seleção é válida
    if (parsed.selected < 1 || parsed.selected > candidates.length) {
        return {
            valid: false,
            response: parsed,
            violations: [`ERRO: Seleção ${parsed.selected} está fora do range (1-${candidates.length})`],
            warnings: []
        };
    }

    const selectedExercise = candidates[parsed.selected - 1];

    // 3. Executar todas as validações
    violations.push(...validateKineticChain(selectedExercise, parsed, context));
    violations.push(...validateSpinalLoad(selectedExercise, parsed, context));
    violations.push(...validateComplexity(selectedExercise, parsed, context));
    violations.push(...validateImpact(selectedExercise, parsed, context));
    violations.push(...validatePregnancy(selectedExercise, context));

    // 4. Coletar warnings
    warnings.push(...validateMachinePreference(selectedExercise, context));

    // 5. Resultado final
    return {
        valid: violations.length === 0,
        response: parsed,
        violations,
        warnings,
        selectedExercise
    };
}

/**
 * Encontra o melhor exercício alternativo se a validação falhar
 * Retorna o primeiro candidato que passa em todas as validações
 */
export function findSafeAlternative(
    candidates: Exercise[],
    context: ValidationContext
): Exercise | null {
    for (const exercise of candidates) {
        // Simula uma resposta de IA para este exercício
        const mockResponse: AISelectionResponse = {
            selected: 1,
            reasoning: 'Fallback automático',
            safety_check: {
                kinetic_chain: exercise.is_machine ? 'fechada' : 'aberta',
                spinal_load: exercise.spinal_load as any || 'moderado',
                is_machine: exercise.is_machine,
                complexity: exercise.stability_demand === 'alto' ? 'alta' : 'media'
            }
        };

        // Valida este exercício
        const allViolations = [
            ...validateKineticChain(exercise, mockResponse, context),
            ...validateSpinalLoad(exercise, mockResponse, context),
            ...validateComplexity(exercise, mockResponse, context),
            ...validateImpact(exercise, mockResponse, context),
            ...validatePregnancy(exercise, context)
        ];

        if (allViolations.length === 0) {
            return exercise;
        }
    }

    // Se nenhum candidato passar, retorna o primeiro (fallback final)
    return candidates[0] || null;
}

// ============ EXPORTS ============

export {
    validateKineticChain,
    validateSpinalLoad,
    validateComplexity,
    validateImpact,
    validatePregnancy,
    validateMachinePreference
};
