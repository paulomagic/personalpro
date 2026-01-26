// Exercise Ontology - Base de Conhecimento EXMO
// Regras biomecânicas baseadas em guidelines ACSM, ACOG, NSCA
// Fornece regras contextuais para injeção RAG no prompt

import type { DetectedCondition } from './conditionDetection';
import type { SpecialCondition } from './specialConditions';

// ============ TIPOS ============

export interface OntologyRule {
    id: string;
    condition: string;
    category: 'safety' | 'technique' | 'parameter' | 'equipment';
    priority: 'critical' | 'high' | 'medium' | 'low';
    rule: string;
    source?: string;
}

export interface ConditionContext {
    conditions: DetectedCondition[];
    specialConditions: SpecialCondition[];
    age?: number;
    level: string;
    goal: string;
}

// ============ BASE DE REGRAS EXMO ============

const EXMO_RULES: OntologyRule[] = [
    // ============ REGRAS DE CADEIA CINÉTICA ============
    {
        id: 'CKC-001',
        condition: 'lesao_ligamentar',
        category: 'safety',
        priority: 'critical',
        rule: 'Para lesões ligamentares (LCA/LCP), use EXCLUSIVAMENTE exercícios de Cadeia Cinética Fechada (CKC). CKC produz co-contração muscular que estabiliza a articulação e reduz forças de cisalhamento anterior em até 50%.',
        source: 'ACSM Guidelines for ACL Rehabilitation'
    },
    {
        id: 'CKC-002',
        condition: 'joelho',
        category: 'safety',
        priority: 'high',
        rule: 'Exercícios de Cadeia Cinética Aberta (OKC) como cadeira extensora aumentam forças de cisalhamento no LCA, especialmente nos últimos 30 graus de extensão. Evite OKC em ângulos de 0-30° de flexão.',
        source: 'Escamilla RF. Med Sci Sports Exerc. 1998'
    },
    {
        id: 'CKC-003',
        condition: 'condromalacia',
        category: 'safety',
        priority: 'high',
        rule: 'Condromalácia patelar: Evite compressão patelofemoral em ângulos de flexão >60°. Prefira agachamentos parciais (0-45°) e exercícios de glúteo/isquiotibiais.',
        source: 'Patellofemoral Pain Guidelines 2018'
    },

    // ============ REGRAS DE CARGA ESPINHAL ============
    {
        id: 'SPL-001',
        condition: 'hernia',
        category: 'safety',
        priority: 'critical',
        rule: 'Hérnia de disco: PROIBIDO exercícios que combinam flexão + rotação + carga. O momento de carga (força × distância da coluna) deve ser minimizado. Prefira máquinas com suporte dorsal.',
        source: 'McGill SM. Low Back Disorders'
    },
    {
        id: 'SPL-002',
        condition: 'espondilolistese',
        category: 'safety',
        priority: 'critical',
        rule: 'Espondilolistese: VETADO exercícios com extensão lombar ativa ou carga axial. Mantenha coluna em posição neutra SEMPRE. Apenas exercícios com suporte completo.',
        source: 'Spine Surgery Guidelines'
    },
    {
        id: 'SPL-003',
        condition: 'lombar',
        category: 'technique',
        priority: 'high',
        rule: 'Dor lombar: Tolerância da coluna é reduzida em flexão. Evite exercícios com carga longe do centro de massa (braço de momento alto). Mantenha cargas próximas ao corpo.',
        source: 'McGill SM. Ultimate Back Fitness'
    },
    {
        id: 'SPL-004',
        condition: 'escoliose',
        category: 'safety',
        priority: 'medium',
        rule: 'Escoliose: Evite cargas assimétricas intensas que podem acentuar a curvatura. Prefira exercícios bilaterais simétricos.',
        source: 'Scoliosis Exercise Guidelines'
    },

    // ============ REGRAS PARA POPULAÇÕES ESPECIAIS ============
    {
        id: 'POP-001',
        condition: 'gestante',
        category: 'safety',
        priority: 'critical',
        rule: 'Gestante após 20 semanas: PROIBIDA posição supina (risco de síndrome da veia cava - compressão da veia cava inferior pelo útero). Use apenas posições sentada, em pé ou lateral.',
        source: 'ACOG Committee Opinion 804 (2020)'
    },
    {
        id: 'POP-002',
        condition: 'gestante',
        category: 'parameter',
        priority: 'high',
        rule: 'Gestante: Mantenha FC <140bpm, evite manobra de Valsalva, mantenha hidratação constante. Interrompa imediatamente se houver dor, sangramento ou tontura.',
        source: 'ACOG Exercise in Pregnancy Guidelines'
    },
    {
        id: 'POP-003',
        condition: 'idoso',
        category: 'equipment',
        priority: 'high',
        rule: 'Idosos (60+): Priorize máquinas guiadas com assentos e apoios. Evite exercícios em pé sem suporte. Foco em prevenção de quedas e equilíbrio.',
        source: 'ACSM Guidelines for Older Adults'
    },
    {
        id: 'POP-004',
        condition: 'idoso',
        category: 'technique',
        priority: 'medium',
        rule: 'Idosos: Progressão deve ser 50-75% mais lenta que adultos. Adaptação neural é preservada, mas recuperação é mais lenta.',
        source: 'NSCA Position Statement on Older Adults'
    },
    {
        id: 'POP-005',
        condition: 'adolescente',
        category: 'parameter',
        priority: 'high',
        rule: 'Adolescentes (<18 anos): Evite cargas >85% 1RM. Foco deve ser aprendizado motor e técnica, não força máxima. Variedade de movimentos é importante.',
        source: 'NSCA Youth Training Guidelines'
    },
    {
        id: 'POP-006',
        condition: 'pos_parto',
        category: 'safety',
        priority: 'high',
        rule: 'Pós-parto: VETADO crunches e sit-ups (risco de agravar diástase). Foco em restauração do core profundo e assoalho pélvico.',
        source: 'Core Restore Postpartum Guidelines'
    },

    // ============ REGRAS DE IMPACTO ============
    {
        id: 'IMP-001',
        condition: 'obesidade',
        category: 'safety',
        priority: 'high',
        rule: 'Obesidade (IMC >30): Evite exercícios de alto impacto. Forças de reação do solo podem ser 2-3x o peso corporal, sobrecarregando articulações.',
        source: 'Obesity Exercise Guidelines'
    },
    {
        id: 'IMP-002',
        condition: 'protese',
        category: 'safety',
        priority: 'critical',
        rule: 'Prótese articular: PROIBIDO impacto na articulação substituída. Evite flexão profunda. Apenas exercícios de amplitude controlada.',
        source: 'Arthroplasty Rehabilitation Guidelines'
    },
    {
        id: 'IMP-003',
        condition: 'artrose',
        category: 'technique',
        priority: 'medium',
        rule: 'Artrose: Exercício é benéfico, mas evite amplitudes extremas e impacto. Aquecimento prolongado (10-15min) antes de carregar a articulação.',
        source: 'OARSI Osteoarthritis Guidelines'
    },

    // ============ REGRAS DE NÍVEL ============
    {
        id: 'LVL-001',
        condition: 'iniciante',
        category: 'equipment',
        priority: 'high',
        rule: 'Iniciantes (<6 meses): Máquinas guiadas ANTES de pesos livres. Adaptação inicial é neural (coordenação), não estrutural (força). Estabilidade antes de intensidade.',
        source: 'NSCA Beginner Training Guidelines'
    },
    {
        id: 'LVL-002',
        condition: 'iniciante',
        category: 'parameter',
        priority: 'medium',
        rule: 'Iniciantes: Use regra "2-for-2" para progressão. Só aumente carga quando conseguir 2 repetições extras em 2 sessões consecutivas.',
        source: 'NSCA Exercise Technique Manual'
    },

    // ============ REGRAS METABÓLICAS ============
    {
        id: 'MET-001',
        condition: 'diabetes',
        category: 'safety',
        priority: 'high',
        rule: 'Diabetes: NUNCA treinar em jejum. Monitorar glicemia antes/depois. Ter carboidrato de rápida absorção disponível. Cuidado com neuropatia periférica.',
        source: 'ADA Exercise and Diabetes Guidelines'
    },
    {
        id: 'MET-002',
        condition: 'hipertensao',
        category: 'technique',
        priority: 'medium',
        rule: 'Hipertensão: Evitar apneia e manobra de Valsalva. Respiração contínua durante exercícios. Prefira rep ranges moderados (8-15).',
        source: 'ACSM Hypertension Guidelines'
    },

    // ============ REGRAS DE OMBRO ============
    {
        id: 'SHL-001',
        condition: 'ombro',
        category: 'technique',
        priority: 'high',
        rule: 'Lesão de ombro: Evite abdução >90° com rotação interna (posição de risco). Prefira plano escapular e pegada neutra.',
        source: 'Shoulder Impingement Guidelines'
    },
    {
        id: 'SHL-002',
        condition: 'bursite',
        category: 'safety',
        priority: 'medium',
        rule: 'Bursite subacromial: Evite elevações laterais acima de 90° e exercícios com compressão subacromial direta.',
        source: 'Subacromial Impingement Rehab'
    }
];

// ============ FUNÇÃO DE BUSCA RAG ============

/**
 * Busca regras relevantes para o contexto do aluno
 * Simula RAG retornando regras aplicáveis às condições detectadas
 */
export function getRelevantRules(context: ConditionContext): OntologyRule[] {
    const relevantRules: OntologyRule[] = [];
    const processedIds = new Set<string>();

    // 1. Buscar regras por condições detectadas
    for (const condition of context.conditions) {
        const conditionType = condition.type.toLowerCase();
        const location = condition.location?.toLowerCase();

        for (const rule of EXMO_RULES) {
            if (processedIds.has(rule.id)) continue;

            // Match por tipo de condição
            if (rule.condition === conditionType) {
                relevantRules.push(rule);
                processedIds.add(rule.id);
            }

            // Match por localização
            if (location && rule.condition === location) {
                relevantRules.push(rule);
                processedIds.add(rule.id);
            }
        }
    }

    // 2. Buscar regras por condições especiais
    for (const specialCond of context.specialConditions) {
        for (const rule of EXMO_RULES) {
            if (processedIds.has(rule.id)) continue;

            if (rule.condition === specialCond) {
                relevantRules.push(rule);
                processedIds.add(rule.id);
            }
        }
    }

    // 3. Buscar regras por idade
    if (context.age !== undefined) {
        if (context.age >= 60) {
            for (const rule of EXMO_RULES) {
                if (processedIds.has(rule.id)) continue;
                if (rule.condition === 'idoso') {
                    relevantRules.push(rule);
                    processedIds.add(rule.id);
                }
            }
        }
        if (context.age < 18) {
            for (const rule of EXMO_RULES) {
                if (processedIds.has(rule.id)) continue;
                if (rule.condition === 'adolescente') {
                    relevantRules.push(rule);
                    processedIds.add(rule.id);
                }
            }
        }
    }

    // 4. Buscar regras por nível
    if (context.level.toLowerCase().includes('iniciante')) {
        for (const rule of EXMO_RULES) {
            if (processedIds.has(rule.id)) continue;
            if (rule.condition === 'iniciante') {
                relevantRules.push(rule);
                processedIds.add(rule.id);
            }
        }
    }

    // 5. Ordenar por prioridade
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    relevantRules.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return relevantRules;
}

/**
 * Formata regras para injeção no prompt
 */
export function formatRulesForPrompt(rules: OntologyRule[]): string {
    if (rules.length === 0) return '';

    const sections: Record<string, string[]> = {
        critical: ['🚨 REGRAS CRÍTICAS DE SEGURANÇA:'],
        high: ['⚠️ REGRAS DE ALTA PRIORIDADE:'],
        medium: ['📋 REGRAS ADICIONAIS:']
    };

    for (const rule of rules) {
        const emoji = rule.priority === 'critical' ? '🔴' : rule.priority === 'high' ? '🟠' : '🟡';
        const ruleText = `${emoji} [${rule.id}] ${rule.rule}`;

        if (rule.priority === 'critical') {
            sections.critical.push(ruleText);
        } else if (rule.priority === 'high') {
            sections.high.push(ruleText);
        } else {
            sections.medium.push(ruleText);
        }
    }

    const output: string[] = ['\n=== REGRAS EXMO (EXERCISE MEDICINE ONTOLOGY) ==='];

    if (sections.critical.length > 1) {
        output.push(sections.critical.join('\n'));
    }
    if (sections.high.length > 1) {
        output.push(sections.high.join('\n'));
    }
    if (sections.medium.length > 1) {
        output.push(sections.medium.join('\n'));
    }

    return output.join('\n\n');
}

/**
 * Obtém regra específica por ID
 */
export function getRuleById(id: string): OntologyRule | undefined {
    return EXMO_RULES.find(r => r.id === id);
}

/**
 * Lista todas as regras de uma categoria
 */
export function getRulesByCategory(category: OntologyRule['category']): OntologyRule[] {
    return EXMO_RULES.filter(r => r.category === category);
}

/**
 * Lista todas as regras de uma prioridade
 */
export function getRulesByPriority(priority: OntologyRule['priority']): OntologyRule[] {
    return EXMO_RULES.filter(r => r.priority === priority);
}

// ============ EXPORTS ============

export { EXMO_RULES };
