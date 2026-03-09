// BiomechanicalProfile - Perfil Clínico Compilado
// Traduz condições humanas em flags biomecânicas executáveis
// O LLM NUNCA vê lesões ou condições - só vê as consequências

import { SpecialCondition, SPECIAL_CONDITION_RULES } from './knowledge/specialConditions';
import type { Injury } from '../exerciseService';
import { createScopedLogger } from '../appLogger';

const isDev = import.meta.env.DEV;
const biomechanicalProfileLogger = createScopedLogger('biomechanicalProfile');
const debugLog = (message: string, metadata?: unknown) => {
    if (!isDev) return;
    if (metadata === undefined) {
        biomechanicalProfileLogger.debug(message);
        return;
    }
    if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
        biomechanicalProfileLogger.debug(message, metadata as Record<string, unknown>);
        return;
    }
    biomechanicalProfileLogger.debug(message, { detail: metadata });
};

// ============ TIPOS BIOMECÂNICOS PRECISOS ============

export type LoadTolerance = 'allowed' | 'limited' | 'forbidden';
export type MechanicsQuality = 'optimal' | 'limited' | 'impaired';

export interface BiomechanicalProfile {
    // Categorização base
    age_group: 'adolescent' | 'adult' | 'senior';

    // === CARGAS NA COLUNA (diferenciação crítica) ===
    // Compressão vertical (esmaga vértebras de cima para baixo)
    // Ex: Agachamento com barra, Militar em pé, Leg Press 45º
    axial_load: LoadTolerance;

    // Cisalhamento/torque (dobra/torce a coluna)
    // Ex: Stiff, Remada Curvada, Good Morning
    spinal_shear: LoadTolerance;

    // === ARTICULAÇÕES ===
    // Impacto no joelho (pliometria, saltos)
    knee_impact: LoadTolerance;

    // Flexão profunda do joelho (>90°)
    deep_knee_flexion: LoadTolerance;

    // Mecânica overhead (pressão no ombro acima da cabeça)
    overhead_mechanics: MechanicsQuality;

    // === ESTABILIDADE ===
    // Tolerância a exercícios instáveis (peso livre vs máquina)
    instability_tolerance: 'low' | 'moderate' | 'high';

    // === PREFERÊNCIAS DERIVADAS ===
    preferred_equipment: ('maquina' | 'cabo' | 'halter' | 'barra' | 'peso_corporal')[];

    // === MODIFICADORES DE VOLUME ===
    volume_multiplier: number;      // 0.5 a 1.0
    intensity_multiplier: number;   // 0.5 a 1.0
}

// ============ DEFAULTS ============

const HEALTHY_ADULT_PROFILE: BiomechanicalProfile = {
    age_group: 'adult',
    axial_load: 'allowed',
    spinal_shear: 'allowed',
    knee_impact: 'allowed',
    deep_knee_flexion: 'allowed',
    overhead_mechanics: 'optimal',
    instability_tolerance: 'high',
    preferred_equipment: ['barra', 'halter', 'maquina', 'cabo', 'peso_corporal'],
    volume_multiplier: 1.0,
    intensity_multiplier: 1.0
};

// ============ MAPEAMENTO: CONDIÇÃO → RESTRIÇÃO BIOMECÂNICA ============

interface ConditionBiomechanics {
    axial_load?: LoadTolerance;
    spinal_shear?: LoadTolerance;
    knee_impact?: LoadTolerance;
    deep_knee_flexion?: LoadTolerance;
    overhead_mechanics?: MechanicsQuality;
    instability_tolerance?: 'low' | 'moderate' | 'high';
    preferred_equipment?: BiomechanicalProfile['preferred_equipment'];
}

// Mapeamento clínico (baseado em guidelines ACSM, ACOG, etc.)
const CONDITION_BIOMECHANICS: Record<string, ConditionBiomechanics> = {
    // === CONDIÇÕES ESPECIAIS ===
    'idoso': {
        axial_load: 'limited',
        spinal_shear: 'limited',
        knee_impact: 'forbidden',
        deep_knee_flexion: 'limited',
        overhead_mechanics: 'limited',
        instability_tolerance: 'low',
        preferred_equipment: ['maquina', 'cabo']
    },
    'gestante': {
        axial_load: 'forbidden',
        spinal_shear: 'limited',
        knee_impact: 'forbidden',
        overhead_mechanics: 'limited',
        instability_tolerance: 'low',
        preferred_equipment: ['maquina', 'cabo']
    },
    'pos_parto': {
        axial_load: 'limited',
        spinal_shear: 'forbidden',  // Core ainda em recuperação
        instability_tolerance: 'low',
        preferred_equipment: ['maquina', 'cabo']
    },
    'adolescente': {
        axial_load: 'limited',  // Placas de crescimento
        instability_tolerance: 'moderate',
        preferred_equipment: ['maquina', 'peso_corporal', 'halter']
    },

    // === LESÕES (mapeadas de Injury type) ===
    'coluna': {
        axial_load: 'forbidden',
        spinal_shear: 'forbidden',
        instability_tolerance: 'low',
        preferred_equipment: ['maquina', 'cabo']
    },
    'hernia': {
        axial_load: 'forbidden',
        spinal_shear: 'limited',
        instability_tolerance: 'low'
    },
    'lombar': {
        axial_load: 'limited',
        spinal_shear: 'forbidden',
        preferred_equipment: ['maquina', 'cabo']
    },
    'joelho': {
        knee_impact: 'forbidden',
        deep_knee_flexion: 'limited',
        instability_tolerance: 'moderate'
    },
    'ombro': {
        overhead_mechanics: 'impaired',
        instability_tolerance: 'moderate'
    },
    'cotovelo': {
        // Afeta principalmente isoladores de braço
    },
    'punho': {
        // Afeta pegadas, prefere máquinas
        preferred_equipment: ['maquina', 'cabo']
    },

    // === CONDIÇÕES ARTICULARES (NOVO) ===
    'artrose': {
        knee_impact: 'forbidden',
        deep_knee_flexion: 'forbidden',  // Evita flexão profunda
        instability_tolerance: 'low',
        preferred_equipment: ['maquina', 'cabo']
    },
    'artrose_quadril': {
        knee_impact: 'forbidden',
        deep_knee_flexion: 'forbidden',  // Quadril não deve fechar muito
        axial_load: 'limited',
        instability_tolerance: 'low',
        preferred_equipment: ['maquina', 'cabo']
    },
    'condromalacia': {
        knee_impact: 'forbidden',
        deep_knee_flexion: 'forbidden',  // Evita compressão patelar
        instability_tolerance: 'moderate',
        preferred_equipment: ['maquina', 'cabo']
    },
    'quadril': {
        deep_knee_flexion: 'limited',  // Limita ângulo de fechamento
        instability_tolerance: 'moderate',
        preferred_equipment: ['maquina', 'cabo']
    }
};

// ============ FUNÇÃO PRINCIPAL: COMPILAÇÃO ============

/**
 * Compila condições clínicas humanas em perfil biomecânico executável.
 * 
 * @param conditions - Condições especiais detectadas (idoso, gestante, etc.)
 * @param injuries - Lesões parseadas do texto do cliente
 * @param age - Idade do cliente (para age_group)
 * @param observations - Observações em texto livre (detecta artrose, condromalácia, etc.)
 * @returns BiomechanicalProfile pronto para filtrar exercícios
 */
export function compileBiomechanicalProfile(
    conditions: SpecialCondition[],
    injuries: Injury[],
    age?: number,
    observations?: string
): BiomechanicalProfile {
    // Começa com adulto saudável
    const profile: BiomechanicalProfile = { ...HEALTHY_ADULT_PROFILE };

    // 1. Determinar age_group
    if (age !== undefined) {
        if (age < 18) profile.age_group = 'adolescent';
        else if (age >= 60) profile.age_group = 'senior';
        else profile.age_group = 'adult';
    }

    // 2. Aplicar restrições de condições especiais
    for (const condition of conditions) {
        const biomechanics = CONDITION_BIOMECHANICS[condition];
        if (biomechanics) {
            applyRestrictions(profile, biomechanics);
        }
    }

    // 3. Aplicar restrições de lesões tipadas
    for (const injury of injuries) {
        const biomechanics = CONDITION_BIOMECHANICS[injury];
        if (biomechanics) {
            applyRestrictions(profile, biomechanics);
        }
    }

    // 4. NOVO: Detectar condições articulares do texto de observações
    if (observations) {
        const obsLower = observations.toLowerCase();

        // Artrose de quadril
        if (obsLower.includes('artrose') && (obsLower.includes('quadril') || obsLower.includes('hip'))) {
            debugLog('[BiomechanicalProfile] Detected: artrose_quadril');
            applyRestrictions(profile, CONDITION_BIOMECHANICS['artrose_quadril']);
        }
        // Artrose geral (joelho, etc.)
        else if (obsLower.includes('artrose') || obsLower.includes('osteoartrite')) {
            debugLog('[BiomechanicalProfile] Detected: artrose');
            applyRestrictions(profile, CONDITION_BIOMECHANICS['artrose']);
        }

        // Condromalácia
        if (obsLower.includes('condromalacia') || obsLower.includes('condromalácia')) {
            debugLog('[BiomechanicalProfile] Detected: condromalacia');
            applyRestrictions(profile, CONDITION_BIOMECHANICS['condromalacia']);
        }

        // Problemas de quadril genéricos
        if (obsLower.includes('quadril') && !obsLower.includes('artrose')) {
            debugLog('[BiomechanicalProfile] Detected: quadril issue');
            applyRestrictions(profile, CONDITION_BIOMECHANICS['quadril']);
        }

        // Rigidez matinal (indicativo de condição reumática)
        if (obsLower.includes('rigidez') || obsLower.includes('rigidity')) {
            debugLog('[BiomechanicalProfile] Detected: rigidez (reducing instability tolerance)');
            profile.instability_tolerance = 'low';
        }
    }

    // 5. Buscar modificadores de volume/intensidade das condições
    let minVolume = 1.0;
    let minIntensity = 1.0;

    for (const condition of conditions) {
        const rule = SPECIAL_CONDITION_RULES.find(r => r.condition === condition);
        if (rule) {
            minVolume = Math.min(minVolume, rule.volume_modifier);
            minIntensity = Math.min(minIntensity, rule.intensity_modifier);
        }
    }

    profile.volume_multiplier = minVolume;
    profile.intensity_multiplier = minIntensity;

    debugLog('[BiomechanicalProfile] Compiled:', {
        conditions,
        injuries,
        age,
        hasObservations: !!observations,
        result: profile
    });

    return profile;
}

/**
 * Aplica restrições biomecânicas ao perfil (sempre usa a mais restritiva)
 */
function applyRestrictions(
    profile: BiomechanicalProfile,
    restrictions: ConditionBiomechanics
): void {
    // Hierarquia: forbidden > limited > allowed
    const loadPriority: Record<LoadTolerance, number> = {
        'forbidden': 0,
        'limited': 1,
        'allowed': 2
    };

    const mechanicsPriority: Record<MechanicsQuality, number> = {
        'impaired': 0,
        'limited': 1,
        'optimal': 2
    };

    // Aplica cada restrição (sempre a mais severa)
    if (restrictions.axial_load && loadPriority[restrictions.axial_load] < loadPriority[profile.axial_load]) {
        profile.axial_load = restrictions.axial_load;
    }

    if (restrictions.spinal_shear && loadPriority[restrictions.spinal_shear] < loadPriority[profile.spinal_shear]) {
        profile.spinal_shear = restrictions.spinal_shear;
    }

    if (restrictions.knee_impact && loadPriority[restrictions.knee_impact] < loadPriority[profile.knee_impact]) {
        profile.knee_impact = restrictions.knee_impact;
    }

    if (restrictions.deep_knee_flexion && loadPriority[restrictions.deep_knee_flexion] < loadPriority[profile.deep_knee_flexion]) {
        profile.deep_knee_flexion = restrictions.deep_knee_flexion;
    }

    if (restrictions.overhead_mechanics && mechanicsPriority[restrictions.overhead_mechanics] < mechanicsPriority[profile.overhead_mechanics]) {
        profile.overhead_mechanics = restrictions.overhead_mechanics;
    }

    if (restrictions.instability_tolerance) {
        const instabilityPriority: Record<string, number> = { 'low': 0, 'moderate': 1, 'high': 2 };
        if (instabilityPriority[restrictions.instability_tolerance] < instabilityPriority[profile.instability_tolerance]) {
            profile.instability_tolerance = restrictions.instability_tolerance;
        }
    }

    // Equipamentos preferidos: usa a lista mais restritiva
    if (restrictions.preferred_equipment && restrictions.preferred_equipment.length > 0) {
        // Interseção de equipamentos (mantém só os que ambos permitem)
        profile.preferred_equipment = profile.preferred_equipment.filter(
            eq => restrictions.preferred_equipment!.includes(eq)
        );
        // Se ficou vazio, usa o da restrição
        if (profile.preferred_equipment.length === 0) {
            profile.preferred_equipment = restrictions.preferred_equipment;
        }
    }
}

// ============ HELPERS PARA FILTRO DE EXERCÍCIOS ============

/**
 * Verifica se exercício é compatível com o perfil biomecânico
 */
export function isExerciseCompatible(
    exercise: {
        spinal_load: 'baixo' | 'moderado' | 'alto';
        stability_demand: 'baixo' | 'moderado' | 'alto';
        is_machine: boolean;
        movement_pattern: string;
        equipment: string[];
    },
    profile: BiomechanicalProfile
): { compatible: boolean; reason?: string } {

    // 1. Verificar carga axial/espinhal
    if (profile.axial_load === 'forbidden' && exercise.spinal_load === 'alto') {
        return { compatible: false, reason: 'Carga axial alta proibida' };
    }

    if (profile.axial_load === 'limited' && exercise.spinal_load === 'alto' && !exercise.is_machine) {
        return { compatible: false, reason: 'Carga axial alta só permitida em máquinas' };
    }

    // 2. Verificar estabilidade
    if (profile.instability_tolerance === 'low' && exercise.stability_demand === 'alto') {
        return { compatible: false, reason: 'Exercício requer alta estabilidade' };
    }

    // 3. Verificar overhead
    if (profile.overhead_mechanics !== 'optimal' && exercise.movement_pattern === 'empurrar_vertical') {
        if (profile.overhead_mechanics === 'impaired') {
            return { compatible: false, reason: 'Mecânica overhead comprometida' };
        }
        // Se 'limited', pode passar mas com cautela (score reduzido)
    }

    // 4. Verificar equipamento preferido
    if (profile.preferred_equipment.length > 0) {
        const hasPreferred = exercise.equipment.some(eq =>
            profile.preferred_equipment.includes(eq as any)
        );
        // Não bloqueia, mas reduz score depois
    }

    return { compatible: true };
}
