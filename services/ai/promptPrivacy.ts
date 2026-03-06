function fnv1aHash(input: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36).toUpperCase();
}

function normalizeText(value?: string): string {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function stripPersonalIdentifiers(text: string): string {
    return text
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
        .replace(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, '[phone]')
        .replace(/\b\d{6,}\b/g, '[num]')
        .replace(/\s+/g, ' ')
        .trim();
}

const INJURY_CATEGORY_KEYWORDS: Record<string, string[]> = {
    joelho: ['joelho', 'menisco', 'lca', 'lcp', 'patela', 'condromalacia'],
    ombro: ['ombro', 'manguito', 'supraespinal', 'bursite', 'tendinite'],
    coluna: ['coluna', 'lombar', 'hernia', 'escoliose', 'espondilo', 'cervical'],
    quadril: ['quadril', 'anca', 'coxofemoral'],
    cotovelo_punho: ['cotovelo', 'punho', 'pulso', 'epicondilite'],
    tornozelo_pe: ['tornozelo', 'pe', 'fascite', 'aquiles'],
    gestacao: ['gestante', 'gravidez', 'pos parto', 'pos-parto', 'amament'],
    cardiovascular: ['hipertensao', 'pressao', 'cardiaco', 'cardiopatia'],
    metabolico: ['diabetes', 'insulina', 'obesidade', 'sindrome metabolica'],
    dor_generalizada: ['fibromialgia', 'dor cronica', 'dor generalizada']
};

const PREFERENCE_TAG_KEYWORDS: Record<string, string[]> = {
    maquinas: ['maquina', 'aparelho'],
    peso_livre: ['halter', 'barra', 'peso livre'],
    calistenia: ['calistenia', 'peso corporal', 'flexao', 'barra fixa'],
    cardio: ['cardio', 'corrida', 'bike', 'esteira'],
    funcional: ['funcional', 'mobilidade'],
    baixo_impacto: ['baixo impacto', 'sem impacto', 'articular'],
    foco_gluteo: ['gluteo', 'gluteos'],
    foco_superior: ['superior', 'bracos', 'peito', 'costas', 'ombro'],
    foco_inferior: ['inferior', 'perna', 'quadriceps', 'posterior', 'panturrilha'],
    treino_em_casa: ['casa', 'domicilio', 'residencia']
};

export function pseudonymizeClientName(name?: string): string {
    const normalized = stripPersonalIdentifiers((name || '').trim());
    if (!normalized) return 'ATLETA_ANONIMO';
    return `ATLETA_${fnv1aHash(normalized).slice(0, 8)}`;
}

export function classifyInjuryConstraints(injuries?: string): string {
    const normalized = normalizeText(injuries);
    if (!normalized || normalized === 'nenhuma' || normalized === 'nenhum' || normalized === 'sem_restricoes_reportadas') {
        return 'sem_restricoes_reportadas';
    }

    const tags = new Set<string>();
    Object.entries(INJURY_CATEGORY_KEYWORDS).forEach(([tag, keywords]) => {
        if (keywords.some((keyword) => normalized.includes(keyword))) {
            tags.add(tag);
        }
    });

    if (tags.size === 0) {
        return 'restricoes_nao_categorizadas';
    }

    return Array.from(tags).join(', ');
}

export function summarizePreferenceTags(preferences?: string): string {
    const normalized = normalizeText(preferences);
    if (!normalized || normalized === 'nao especificadas' || normalized === 'sem_preferencias_especificas') {
        return 'sem_preferencias_especificas';
    }

    const tags = new Set<string>();
    Object.entries(PREFERENCE_TAG_KEYWORDS).forEach(([tag, keywords]) => {
        if (keywords.some((keyword) => normalized.includes(keyword))) {
            tags.add(tag);
        }
    });

    if (tags.size === 0) {
        return 'preferencias_genericas';
    }

    return Array.from(tags).join(', ');
}

export function sanitizeCoachObservations(observations?: string, maxLength = 220): string {
    const normalized = stripPersonalIdentifiers(observations || '');
    if (!normalized) return 'sem_observacoes_relevantes';
    return normalized.slice(0, maxLength);
}

export function sanitizePromptText(value?: string, maxLength = 220): string {
    const normalized = stripPersonalIdentifiers(value || '');
    if (!normalized) return '';
    return normalized.slice(0, maxLength);
}

export function sanitizeWorkoutHistoryEntry(value?: string, maxLength = 80): string {
    if (!value) return '';
    return stripPersonalIdentifiers(value).slice(0, maxLength);
}
