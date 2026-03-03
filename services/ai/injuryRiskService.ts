import type { Client } from '../../types';
import type { AdaptiveTrainingSignal } from './adaptiveSignalTypes';

export type InjuryRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface InjuryRiskAssessment {
    score: number;
    level: InjuryRiskLevel;
    blockGeneration: boolean;
    conservativeMode: boolean;
    factors: string[];
    recommendedConstraints: string[];
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function getBmi(weight?: number, heightCm?: number): number | null {
    if (!weight || !heightCm || heightCm <= 0) return null;
    const meters = heightCm / 100;
    return weight / (meters * meters);
}

function hasKeywords(text: string | undefined, keywords: string[]): boolean {
    if (!text) return false;
    const normalized = text.toLowerCase();
    return keywords.some(k => normalized.includes(k));
}

function toLevel(score: number): InjuryRiskLevel {
    if (score >= 85) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
}

export function assessInjuryRisk(params: {
    client: Client;
    observations?: string;
    adaptiveSignal?: AdaptiveTrainingSignal | null;
}): InjuryRiskAssessment {
    const { client, observations, adaptiveSignal } = params;
    const factors: string[] = [];
    const constraints = new Set<string>();

    let score = 20;
    const injuries = client.injuries || '';
    const age = client.age || 0;
    const bmi = getBmi(client.weight, client.height);

    if (injuries && injuries.trim() && injuries.toLowerCase() !== 'nenhuma') {
        score += 22;
        factors.push('Histórico de lesão informado');
        constraints.add('Evitar padrões de alto impacto e picos de intensidade.');
    }

    if (hasKeywords(injuries, ['lca', 'lcp', 'ligament', 'menisco', 'hernia', 'hérnia', 'coluna'])) {
        score += 18;
        factors.push('Lesão estrutural sensível (joelho/coluna/ligamento)');
        constraints.add('Aplicar progressão conservadora e foco técnico.');
    }

    if (age >= 65) {
        score += 20;
        factors.push('Faixa etária 65+');
        constraints.add('Priorizar estabilidade, cadência controlada e RPE moderado.');
    } else if (age >= 55) {
        score += 12;
        factors.push('Faixa etária 55+');
    }

    if (bmi !== null) {
        if (bmi >= 35) {
            score += 18;
            factors.push(`IMC elevado (${bmi.toFixed(1)})`);
            constraints.add('Reduzir impacto articular e controlar densidade.');
        } else if (bmi >= 30) {
            score += 10;
            factors.push(`IMC aumentado (${bmi.toFixed(1)})`);
        }
    }

    if (hasKeywords(observations, ['dor', 'pain', 'incomodo', 'incômodo', 'inflama', 'travou'])) {
        score += 14;
        factors.push('Relato recente de dor/desconforto');
        constraints.add('Não progredir carga em exercícios com dor associada.');
    }

    if ((client.adherence || 0) < 45) {
        score += 7;
        factors.push('Baixa aderência recente');
    }

    if (adaptiveSignal) {
        if (adaptiveSignal.fatigueLevel === 'high') {
            score += 18;
            factors.push('Fadiga alta detectada');
            constraints.add('Aplicar microciclo com deload reforçado.');
        } else if (adaptiveSignal.fatigueLevel === 'moderate') {
            score += 8;
            factors.push('Fadiga moderada detectada');
        }

        if (adaptiveSignal.readinessScore < 45) {
            score += 14;
            factors.push('Prontidão baixa (<45)');
        } else if (adaptiveSignal.readinessScore < 60) {
            score += 7;
            factors.push('Prontidão abaixo do ideal');
        }
    }

    score = clamp(Math.round(score), 0, 100);
    const level = toLevel(score);
    const blockGeneration = level === 'critical';
    const conservativeMode = level === 'high' || level === 'critical';

    if (conservativeMode) {
        constraints.add('Limitar progressão semanal e aumentar monitoramento de feedback.');
    }

    if (constraints.size === 0) {
        constraints.add('Manter progressão progressiva padrão com monitoramento de RPE/RIR.');
    }

    return {
        score,
        level,
        blockGeneration,
        conservativeMode,
        factors,
        recommendedConstraints: Array.from(constraints)
    };
}
