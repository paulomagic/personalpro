// Condition Detection v2.0 - Sistema de detecção expandido
// Keywords robustas + Localização específica + Restrições biomecânicas
// Complementa specialConditions.ts com detecção mais inteligente

import type { Injury } from '../../exerciseService';

// ============ TIPOS EXPANDIDOS ============

export interface DetectedCondition {
    type: string;           // Tipo da condição (artrose, hernia, idoso)
    location?: string;      // Localização específica (joelho, quadril, lombar)
    severity?: 'leve' | 'moderada' | 'grave';
    notes?: string;         // Notas adicionais
}

export interface BiomechanicalRestrictions {
    avoid_axial_load: boolean;      // Evitar carga compressiva na coluna
    avoid_spinal_shear: boolean;    // Evitar cisalhamento espinhal
    avoid_knee_shear: boolean;      // Evitar cisalhamento no joelho
    avoid_deep_knee_flexion: boolean; // Evitar flexão profunda do joelho
    avoid_shoulder_overhead: boolean; // Evitar exercícios acima da cabeça
    avoid_spinal_flexion: boolean;  // Evitar flexão da coluna
    avoid_spinal_rotation: boolean; // Evitar rotação da coluna
    avoid_hip_impact: boolean;      // Evitar impacto no quadril
    max_impact_level: 'none' | 'low' | 'medium' | 'high';
    requires_supervision: boolean;  // Necessita supervisão constante
    prefer_machines: boolean;       // Preferir máquinas vs peso livre
    volume_modifier: number;        // 0.5 a 1.0
    intensity_modifier: number;     // 0.5 a 1.0
}

export interface DetectionResult {
    conditions: DetectedCondition[];
    restrictions: BiomechanicalRestrictions;
    blockedExercises: string[];
    warnings: string[];
    parsedInjuries: Injury[];
}

// ============ KEYWORDS EXPANDIDAS ============

interface ConditionKeywords {
    keywords: string[];
    locations?: Record<string, string[]>;
    restrictions: Partial<BiomechanicalRestrictions>;
    blockedExercises?: string[];
}

export const CONDITION_KEYWORDS: Record<string, ConditionKeywords> = {
    // ============ ARTROSE ============
    artrose: {
        keywords: [
            'artrose', 'artroze', 'osteoartrite', 'osteoartrose',
            'desgaste articular', 'desgaste na articulação',
            'articulação desgastada', 'cartilagem desgastada',
            'artrite degenerativa', 'artrose bilateral',
            'degeneração articular'
        ],
        locations: {
            joelho: ['joelho', 'joelhos', 'patela', 'patelar', 'femorotibial'],
            quadril: ['quadril', 'bacia', 'coxofemoral', 'hip', 'coxas', 'anca'],
            coluna: ['coluna', 'lombar', 'cervical', 'torácica', 'vértebra', 'vertebral', 'espinha'],
            ombro: ['ombro', 'ombros', 'glenoumeral'],
            mao: ['mão', 'mãos', 'dedo', 'dedos', 'punho', 'pulso']
        },
        restrictions: {
            avoid_deep_knee_flexion: true,
            avoid_hip_impact: true,
            max_impact_level: 'low',
            prefer_machines: true,
            volume_modifier: 0.8
        },
        blockedExercises: [
            'agachamento livre', 'agachamento profundo', 'pistol squat',
            'hack squat', 'sissy squat', 'jumping squat'
        ]
    },

    // ============ CONDROMALÁCIA ============
    condromalacia: {
        keywords: [
            'condromalácia', 'condromalacia', 'condromalacia patelar',
            'condromalácia patelar', 'joelho de corredor',
            'amolecimento da cartilagem', 'cartilagem desgastada patela',
            'síndrome femoropatelar', 'condropatia'
        ],
        restrictions: {
            avoid_deep_knee_flexion: true,
            avoid_knee_shear: true,
            max_impact_level: 'low',
            prefer_machines: true,
            volume_modifier: 0.85
        },
        blockedExercises: [
            'agachamento', 'leg press 45', 'hack squat',
            'afundo', 'passada', 'lunge', 'cadeira extensora',
            'sissy squat', 'jumping squat', 'pistol squat'
        ]
    },

    // ============ HÉRNIA DE DISCO ============
    hernia: {
        keywords: [
            'hérnia', 'hernia', 'hérnia de disco', 'hernia de disco',
            'hérnia discal', 'hernia discal', 'protrusão discal',
            'disco protruso', 'abaulamento discal', 'disco estourado',
            'disco herniado', 'hernia extrusa', 'hernia sequestrada'
        ],
        locations: {
            lombar: ['lombar', 'l1', 'l2', 'l3', 'l4', 'l5', 's1', 'coluna lombar', 'região lombar', 'baixa coluna'],
            cervical: ['cervical', 'c3', 'c4', 'c5', 'c6', 'c7', 'pescoço', 'coluna cervical'],
            toracica: ['torácica', 'toracica', 't1', 't2', 't3', 't4', 't5']
        },
        restrictions: {
            avoid_axial_load: true,
            avoid_spinal_shear: true,
            avoid_spinal_flexion: true,
            avoid_spinal_rotation: true,
            max_impact_level: 'none',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.6,
            intensity_modifier: 0.7
        },
        blockedExercises: [
            'levantamento terra', 'terra', 'stiff', 'good morning',
            'agachamento livre', 'agachamento com barra',
            'remada curvada', 'remada t-bar', 'abdominal crunch',
            'russian twist', 'prancha dinâmica', 'sit up'
        ]
    },

    // ============ LESÃO DE MENISCO ============
    menisco: {
        keywords: [
            'menisco', 'lesão de menisco', 'lesao de menisco',
            'menisco lesionado', 'menisco rompido', 'meniscectomia',
            'menisco medial', 'menisco lateral', 'tear do menisco'
        ],
        restrictions: {
            avoid_knee_shear: true,
            avoid_deep_knee_flexion: true,
            max_impact_level: 'low',
            prefer_machines: true,
            volume_modifier: 0.75
        },
        blockedExercises: [
            'agachamento profundo', 'pistol squat', 'hack squat',
            'afundo', 'passada', 'lunge', 'step alto',
            'corrida', 'salto', 'jump'
        ]
    },

    // ============ LESÃO LIGAMENTAR (LCA/LCP) ============
    lesao_ligamentar: {
        keywords: [
            'lesão de lca', 'lesao de lca', 'lca rompido', 'lca lesionado',
            'lesão de lcp', 'lesao de lcp', 'lcp rompido', 'lcp lesionado',
            'ligamento cruzado', 'ruptura do lca', 'reconstrução de lca',
            'pós-operatório lca', 'plástica de lca'
        ],
        restrictions: {
            avoid_knee_shear: true,
            avoid_deep_knee_flexion: true,
            max_impact_level: 'none',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.6,
            intensity_modifier: 0.6
        },
        blockedExercises: [
            'agachamento', 'leg press', 'hack squat',
            'afundo', 'passada', 'lunge', 'cadeira extensora',
            'corrida', 'salto', 'jump', 'pivoteamento'
        ]
    },

    // ============ BURSITE ============
    bursite: {
        keywords: [
            'bursite', 'inflamação da bursa', 'bursite trocantérica',
            'bursite subacromial', 'bursite olecraniana', 'bursite do ombro'
        ],
        locations: {
            ombro: ['ombro', 'subacromial', 'subdeltoidea'],
            quadril: ['quadril', 'trocantérica', 'trocanter', 'isquiática'],
            joelho: ['joelho', 'patelar', 'anserina'],
            cotovelo: ['cotovelo', 'olecraniana']
        },
        restrictions: {
            avoid_shoulder_overhead: true,
            avoid_hip_impact: true,
            prefer_machines: true,
            volume_modifier: 0.75
        }
    },

    // ============ TENDINITE / TENDINOPATIA ============
    tendinite: {
        keywords: [
            'tendinite', 'tendinopatia', 'tendinose', 'tendão inflamado',
            'epicondilite', 'cotovelo de tenista', 'cotovelo de golfista',
            'tendinite patelar', 'joelho do saltador', 'manguito rotador'
        ],
        locations: {
            ombro: ['ombro', 'manguito', 'supraespinhal', 'supraespinhoso', 'rotador'],
            cotovelo: ['cotovelo', 'epicondilite', 'lateral', 'medial'],
            joelho: ['joelho', 'patelar', 'infraspatelar'],
            aquiles: ['aquiles', 'calcanhar', 'tornozelo']
        },
        restrictions: {
            prefer_machines: true,
            volume_modifier: 0.7,
            intensity_modifier: 0.75
        }
    },

    // ============ ESCOLIOSE ============
    escoliose: {
        keywords: [
            'escoliose', 'coluna torta', 'curvatura lateral',
            'desvio da coluna', 'escoliose lombar', 'escoliose toracica'
        ],
        restrictions: {
            avoid_spinal_rotation: true,
            avoid_axial_load: true,
            prefer_machines: true,
            volume_modifier: 0.85
        },
        blockedExercises: [
            'russian twist', 'rotação de tronco', 'woodchop',
            'agachamento com barra alta'
        ]
    },

    // ============ ESPONDILOLISTESE ============
    espondilolistese: {
        keywords: [
            'espondilolistese', 'espondilolisteses', 'escorregamento vertebral',
            'listese', 'espondilólise', 'vértebra escorregada'
        ],
        restrictions: {
            avoid_axial_load: true,
            avoid_spinal_shear: true,
            avoid_spinal_flexion: true,
            avoid_spinal_rotation: true,
            max_impact_level: 'none',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.5,
            intensity_modifier: 0.6
        },
        blockedExercises: [
            'agachamento', 'terra', 'stiff', 'good morning',
            'leg press 45', 'remada curvada', 'abdominal'
        ]
    },

    // ============ PRÓTESE ============
    protese: {
        keywords: [
            'prótese', 'protese', 'artroplastia', 'cirurgia de substituição',
            'prótese total', 'prótese parcial', 'implante articular',
            'joelho de metal', 'quadril de metal'
        ],
        locations: {
            joelho: ['joelho', 'joelhos'],
            quadril: ['quadril', 'bacia', 'fêmur']
        },
        restrictions: {
            avoid_deep_knee_flexion: true,
            avoid_hip_impact: true,
            max_impact_level: 'none',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.7
        },
        blockedExercises: [
            'agachamento profundo', 'pistol squat',
            'corrida', 'salto', 'jump', 'pular corda'
        ]
    },

    // ============ FIBROMIALGIA ============
    fibromialgia: {
        keywords: [
            'fibromialgia', 'síndrome dolorosa', 'dor crônica generalizada',
            'pontos gatilho', 'trigger points'
        ],
        restrictions: {
            max_impact_level: 'low',
            prefer_machines: true,
            volume_modifier: 0.6,
            intensity_modifier: 0.7
        }
    },

    // ============ IDOSO (detectado por keywords também) ============
    idoso: {
        keywords: [
            'idoso', 'idosa', 'terceira idade', '3ª idade',
            'melhor idade', 'idade avançada', 'sênior', 'senior',
            'aposentado', 'aposentada', '60 anos', '65 anos',
            '70 anos', '75 anos', '80 anos', '85 anos',
            'osteoporose', 'sarcopenia', 'fragilidade'
        ],
        restrictions: {
            avoid_axial_load: true,
            max_impact_level: 'none',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.7,
            intensity_modifier: 0.8
        },
        blockedExercises: [
            'box jump', 'burpee', 'salto', 'jump squat',
            'pistol squat', 'dragon flag', 'handstand',
            'agachamento livre', 'terra', 'stiff'
        ]
    },

    // ============ GESTANTE ============
    gestante: {
        keywords: [
            'gestante', 'grávida', 'gravidez', 'prenhez',
            'gestação', 'esperando bebê', 'com bebê',
            'primeiro trimestre', 'segundo trimestre', 'terceiro trimestre',
            '1º trimestre', '2º trimestre', '3º trimestre',
            'semanas de gestação', 'semanas de gravidez'
        ],
        restrictions: {
            avoid_axial_load: true,
            avoid_spinal_shear: true,
            max_impact_level: 'none',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.6,
            intensity_modifier: 0.65
        },
        blockedExercises: [
            'supino reto', 'supino inclinado', 'supino',
            'agachamento livre', 'leg press 45', 'terra',
            'abdominal', 'prancha', 'crunch',
            'barra fixa', 'pull up', 'burpee', 'salto'
        ]
    },

    // ============ PÓS-PARTO ============
    pos_parto: {
        keywords: [
            'pós-parto', 'pos-parto', 'pós parto', 'pos parto',
            'posparto', 'diástase', 'diastase', 'diástase abdominal',
            'cesárea', 'cesariana', 'parto recente',
            'amamentando', 'puerpério'
        ],
        restrictions: {
            avoid_spinal_flexion: true,
            avoid_axial_load: true,
            max_impact_level: 'low',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.5,
            intensity_modifier: 0.6
        },
        blockedExercises: [
            'crunch', 'abdominal tradicional', 'sit up',
            'prancha dinâmica', 'russian twist', 'v-up',
            'agachamento livre', 'terra', 'burpee'
        ]
    },

    // ============ OBESIDADE ============
    obesidade: {
        keywords: [
            'obesidade', 'obeso', 'obesa', 'sobrepeso',
            'excesso de peso', 'acima do peso', 'imc alto',
            'obesidade mórbida', 'obesidade grau'
        ],
        restrictions: {
            max_impact_level: 'low',
            prefer_machines: true,
            requires_supervision: true,
            volume_modifier: 0.75,
            intensity_modifier: 0.8
        },
        blockedExercises: [
            'corrida', 'salto', 'jump', 'burpee',
            'box jump', 'pular corda', 'step alto'
        ]
    },

    // ============ HIPERTENSÃO ============
    hipertensao: {
        keywords: [
            'hipertensão', 'hipertenso', 'hipertensa', 'pressão alta',
            'pressao alta', 'pa elevada', 'cardiopata', 'coração',
            'cardiaco', 'cardíaco'
        ],
        restrictions: {
            intensity_modifier: 0.85
        },
        blockedExercises: [
            'valsalva', 'isometria prolongada'
        ]
    },

    // ============ DIABETES ============
    diabetes: {
        keywords: [
            'diabetes', 'diabético', 'diabética', 'diabete',
            'glicemia alta', 'açúcar no sangue', 'insulina',
            'tipo 1', 'tipo 2', 'dm1', 'dm2', 'neuropatia diabética'
        ],
        restrictions: {
            max_impact_level: 'medium',
            volume_modifier: 0.9
        }
    },

    // ============ LABIRINTITE / VERTIGEM ============
    labirintite: {
        keywords: [
            'labirintite', 'vertigem', 'tontura', 'desequilíbrio',
            'vestibular', 'problema de ouvido', 'ouvido interno'
        ],
        restrictions: {
            max_impact_level: 'low',
            prefer_machines: true,
            requires_supervision: true
        },
        blockedExercises: [
            'exercícios de cabeça para baixo', 'supino declinado',
            'roa', 'salto', 'giro', 'rotação rápida'
        ]
    }
};

// ============ FUNÇÃO PRINCIPAL DE DETECÇÃO ============

/**
 * Detecta condições especiais a partir de texto livre
 * Usa detecção por keywords + localização + idade
 */
export function detectConditionsEnhanced(
    observations: string = '',
    injuries: string = '',
    age?: number,
    bmi?: number,
    weight?: number,
    height?: number
): DetectionResult {
    const detected: DetectedCondition[] = [];
    const blockedExercises = new Set<string>();
    const warnings: string[] = [];
    const parsedInjuries: Injury[] = [];

    // Combina observações e lesões
    const fullText = `${observations} ${injuries}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fullTextOriginal = `${observations} ${injuries}`.toLowerCase();

    // 1. Detecta por idade
    if (age !== undefined) {
        if (age >= 60) {
            detected.push({ type: 'idoso', notes: `Idade: ${age} anos` });
            warnings.push(`🧓 Idoso (${age} anos): Priorizar máquinas e exercícios de baixo impacto`);
        } else if (age < 18) {
            detected.push({ type: 'adolescente', notes: `Idade: ${age} anos` });
            warnings.push(`👦 Adolescente (${age} anos): Evitar cargas máximas, foco em técnica`);
        }
    }

    // 2. Detecta por IMC (calcula se tiver peso e altura)
    let calculatedBmi = bmi;
    if (!calculatedBmi && weight && height) {
        calculatedBmi = weight / ((height / 100) ** 2);
    }
    if (calculatedBmi && calculatedBmi >= 30) {
        detected.push({
            type: 'obesidade',
            severity: calculatedBmi >= 40 ? 'grave' : calculatedBmi >= 35 ? 'moderada' : 'leve',
            notes: `IMC: ${calculatedBmi.toFixed(1)}`
        });
        warnings.push(`⚖️ Obesidade (IMC ${calculatedBmi.toFixed(1)}): Evitar exercícios de alto impacto`);
    }

    // 3. Detecta por keywords
    Object.entries(CONDITION_KEYWORDS).forEach(([conditionType, config]) => {
        // Verifica se alguma keyword está presente
        const foundKeyword = config.keywords.some(keyword => {
            const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            return fullText.includes(normalizedKeyword) || fullTextOriginal.includes(keyword.toLowerCase());
        });

        if (foundKeyword) {
            // Detecta localização se disponível
            let location: string | undefined;
            if (config.locations) {
                for (const [loc, locKeywords] of Object.entries(config.locations)) {
                    if (locKeywords.some(lk => fullTextOriginal.includes(lk.toLowerCase()))) {
                        location = loc;
                        break;
                    }
                }
            }

            // Adiciona condição detectada
            detected.push({
                type: conditionType,
                location,
                notes: location ? `Localização: ${location}` : undefined
            });

            // Adiciona exercícios bloqueados
            if (config.blockedExercises) {
                config.blockedExercises.forEach(ex => blockedExercises.add(ex));
            }

            // Mapeia para Injury se aplicável
            const injuryMap: Record<string, Injury> = {
                'ombro': 'ombro',
                'joelho': 'joelho',
                'coluna': 'coluna',
                'lombar': 'coluna',
                'cervical': 'coluna',
                'quadril': 'quadril',
                'cotovelo': 'cotovelo',
                'punho': 'punho'
            };
            if (location && injuryMap[location]) {
                if (!parsedInjuries.includes(injuryMap[location])) {
                    parsedInjuries.push(injuryMap[location]);
                }
            }

            // Adiciona warning
            warnings.push(`⚠️ ${formatConditionName(conditionType)}${location ? ` (${location})` : ''} detectado`);
        }
    });

    // 4. Compilar restrições biomecânicas agregadas
    const restrictions = compileRestrictions(detected);

    // Remove duplicatas de condições do mesmo tipo
    const uniqueConditions = removeDuplicateConditions(detected);

    return {
        conditions: uniqueConditions,
        restrictions,
        blockedExercises: Array.from(blockedExercises),
        warnings,
        parsedInjuries
    };
}

// ============ HELPERS ============

function compileRestrictions(conditions: DetectedCondition[]): BiomechanicalRestrictions {
    // Começa com perfil liberal
    const restrictions: BiomechanicalRestrictions = {
        avoid_axial_load: false,
        avoid_spinal_shear: false,
        avoid_knee_shear: false,
        avoid_deep_knee_flexion: false,
        avoid_shoulder_overhead: false,
        avoid_spinal_flexion: false,
        avoid_spinal_rotation: false,
        avoid_hip_impact: false,
        max_impact_level: 'high',
        requires_supervision: false,
        prefer_machines: false,
        volume_modifier: 1.0,
        intensity_modifier: 1.0
    };

    const impactPriority: Record<string, number> = {
        'none': 0, 'low': 1, 'medium': 2, 'high': 3
    };

    // Aplica restrições de cada condição (sempre a mais restritiva)
    for (const condition of conditions) {
        const config = CONDITION_KEYWORDS[condition.type];
        if (!config?.restrictions) continue;

        const r = config.restrictions;

        // Booleans: qualquer true prevalece
        if (r.avoid_axial_load) restrictions.avoid_axial_load = true;
        if (r.avoid_spinal_shear) restrictions.avoid_spinal_shear = true;
        if (r.avoid_knee_shear) restrictions.avoid_knee_shear = true;
        if (r.avoid_deep_knee_flexion) restrictions.avoid_deep_knee_flexion = true;
        if (r.avoid_shoulder_overhead) restrictions.avoid_shoulder_overhead = true;
        if (r.avoid_spinal_flexion) restrictions.avoid_spinal_flexion = true;
        if (r.avoid_spinal_rotation) restrictions.avoid_spinal_rotation = true;
        if (r.avoid_hip_impact) restrictions.avoid_hip_impact = true;
        if (r.requires_supervision) restrictions.requires_supervision = true;
        if (r.prefer_machines) restrictions.prefer_machines = true;

        // Impact level: usa o mais restritivo
        if (r.max_impact_level && impactPriority[r.max_impact_level] < impactPriority[restrictions.max_impact_level]) {
            restrictions.max_impact_level = r.max_impact_level;
        }

        // Modifiers: usa o menor (mais conservador)
        if (r.volume_modifier && r.volume_modifier < restrictions.volume_modifier) {
            restrictions.volume_modifier = r.volume_modifier;
        }
        if (r.intensity_modifier && r.intensity_modifier < restrictions.intensity_modifier) {
            restrictions.intensity_modifier = r.intensity_modifier;
        }
    }

    return restrictions;
}

function removeDuplicateConditions(conditions: DetectedCondition[]): DetectedCondition[] {
    const seen = new Map<string, DetectedCondition>();

    for (const cond of conditions) {
        const key = cond.location ? `${cond.type}_${cond.location}` : cond.type;

        // Se já vimos essa condição, verifica se a nova é mais específica
        if (seen.has(cond.type) && cond.location) {
            // Condição com localização é mais específica
            seen.set(key, cond);
        } else if (!seen.has(key)) {
            seen.set(key, cond);
        }
    }

    return Array.from(seen.values());
}

export function formatConditionName(condition: string): string {
    const names: Record<string, string> = {
        artrose: 'Artrose',
        artrose_joelho: 'Artrose no Joelho',
        artrose_quadril: 'Artrose no Quadril',
        artrose_coluna: 'Artrose na Coluna',
        condromalacia: 'Condromalácia Patelar',
        hernia: 'Hérnia de Disco',
        hernia_lombar: 'Hérnia Lombar',
        hernia_cervical: 'Hérnia Cervical',
        menisco: 'Lesão de Menisco',
        lesao_ligamentar: 'Lesão Ligamentar (LCA/LCP)',
        bursite: 'Bursite',
        tendinite: 'Tendinite',
        escoliose: 'Escoliose',
        espondilolistese: 'Espondilolistese',
        protese: 'Prótese Articular',
        protese_joelho: 'Prótese de Joelho',
        protese_quadril: 'Prótese de Quadril',
        fibromialgia: 'Fibromialgia',
        idoso: 'Idoso',
        gestante: 'Gestante',
        pos_parto: 'Pós-Parto',
        obesidade: 'Obesidade',
        hipertensao: 'Hipertensão',
        diabetes: 'Diabetes',
        adolescente: 'Adolescente',
        labirintite: 'Labirintite/Vertigem'
    };

    return names[condition] || condition.charAt(0).toUpperCase() + condition.slice(1).replace(/_/g, ' ');
}

// ============ EXPORT PARA INTEGRAÇÃO ============

export function getRestrictionsDescription(restrictions: BiomechanicalRestrictions): string[] {
    const descriptions: string[] = [];

    if (restrictions.avoid_axial_load) {
        descriptions.push('Evitando exercícios com carga axial elevada');
    }
    if (restrictions.avoid_spinal_shear) {
        descriptions.push('Evitando cisalhamento espinhal');
    }
    if (restrictions.avoid_knee_shear) {
        descriptions.push('Evitando cisalhamento nos joelhos');
    }
    if (restrictions.avoid_deep_knee_flexion) {
        descriptions.push('Evitando flexão profunda do joelho');
    }
    if (restrictions.avoid_shoulder_overhead) {
        descriptions.push('Evitando exercícios acima da cabeça');
    }
    if (restrictions.avoid_spinal_flexion) {
        descriptions.push('Evitando flexão da coluna');
    }
    if (restrictions.avoid_spinal_rotation) {
        descriptions.push('Evitando rotação da coluna');
    }
    if (restrictions.avoid_hip_impact) {
        descriptions.push('Evitando impacto no quadril');
    }
    if (restrictions.max_impact_level !== 'high') {
        descriptions.push(`Limitado a exercícios de ${restrictions.max_impact_level === 'none' ? 'zero' : 'baixo'} impacto`);
    }
    if (restrictions.prefer_machines) {
        descriptions.push('Priorizando máquinas e cabos');
    }
    if (restrictions.requires_supervision) {
        descriptions.push('⚠️ Necessita supervisão constante');
    }
    if (restrictions.volume_modifier < 1.0) {
        descriptions.push(`Volume reduzido para ${Math.round(restrictions.volume_modifier * 100)}%`);
    }
    if (restrictions.intensity_modifier < 1.0) {
        descriptions.push(`Intensidade reduzida para ${Math.round(restrictions.intensity_modifier * 100)}%`);
    }

    return descriptions;
}
