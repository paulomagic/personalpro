import { Client, WorkoutExercise, WorkoutTemplate, CustomMethod } from '../types';

export const mockClients: Client[] = [
    {
        id: '1',
        name: 'Ana Silva',
        avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200&h=200&fit=crop',
        goal: 'Hipertrofia Glúteo',
        level: 'Intermediário',
        adherence: 88,
        lastTraining: 'Ontem',
        status: 'active',
        email: 'ana@email.com',
        phone: '11999999999',
        birthDate: '1995-03-15',
        startDate: '2024-01-10',
        paymentStatus: 'paid',
        observations: 'Prefere treinar pela manhã. Evitar exercícios de alto impacto por conta do joelho esquerdo.',
        injuries: 'Lesão antiga no joelho esquerdo - evitar agachamento profundo',
        preferences: 'Hip Thrust é o exercício favorito. Gosta de treinos com música alta.',
        missedClasses: [],
        assessments: [
            {
                id: '1',
                date: '2024-12-15',
                photos: ['photo1.jpg', 'photo2.jpg'],
                weight: 62,
                bodyFat: 22,
                measures: { chest: 88, waist: 68, hips: 98, thighRight: 56, thighLeft: 55 },
                skinfolds: { triceps: 18, abdomen: 22, thigh: 28 }
            }
        ],
        totalClasses: 48,
        completedClasses: 42
    },
    {
        id: '2',
        name: 'Carlos Mendes',
        avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&h=200&fit=crop',
        goal: 'Perda de Peso',
        level: 'Iniciante',
        adherence: 45,
        lastTraining: '3 dias atrás',
        status: 'at-risk',
        email: 'carlos@email.com',
        phone: '11999999999',
        birthDate: '1988-07-22',
        startDate: '2024-09-01',
        paymentStatus: 'overdue',
        observations: 'Trabalha à noite, prefere treinar no fim da tarde. Tem dificuldade com disciplina alimentar.',
        injuries: 'Hérnia de disco L4-L5 - cuidado com exercícios axiais',
        preferences: 'Prefere cardio na esteira. Não gosta de exercícios de abdominal.',
        missedClasses: [
            { id: '1', date: '2024-12-20', reason: 'sick', replaced: false, notes: 'Gripe forte' },
            { id: '2', date: '2024-12-18', reason: 'personal', replaced: false }
        ],
        assessments: [],
        totalClasses: 24,
        completedClasses: 11
    },
    {
        id: '3',
        name: 'Júlia Costa',
        avatar: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop',
        goal: 'Condicionamento',
        level: 'Avançado',
        adherence: 92,
        lastTraining: 'Hoje',
        status: 'active',
        email: 'julia@email.com',
        phone: '11999999999',
        birthDate: '1992-11-08',
        startDate: '2023-06-15',
        paymentStatus: 'paid',
        observations: 'Atleta amadora de corrida. Treina para maratona em abril.',
        injuries: 'Nenhuma',
        preferences: 'Ama treinos de HIIT e funcionais.',
        missedClasses: [],
        assessments: [
            {
                id: '2',
                date: '2024-12-01',
                photos: [],
                weight: 55,
                bodyFat: 16,
                measures: { chest: 82, waist: 62, hips: 90 },
                skinfolds: { triceps: 12, abdomen: 14, thigh: 18 }
            }
        ],
        totalClasses: 72,
        completedClasses: 66
    },
    {
        id: '4',
        name: 'Pedro Souza',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
        goal: 'Força Máxima',
        level: 'Avançado',
        adherence: 95,
        lastTraining: 'Hoje',
        status: 'active',
        email: 'pedro@email.com',
        phone: '11999999999',
        birthDate: '1990-02-14',
        startDate: '2022-03-20',
        paymentStatus: 'paid',
        observations: 'Powerlifter competidor. Foco em agachamento, supino e terra.',
        injuries: 'Tendinite no ombro direito - cuidado com supino inclinado',
        preferences: 'Prefere treinos pesados com poucos exercícios. Gostade Rest-Pause.',
        missedClasses: [],
        assessments: [],
        totalClasses: 120,
        completedClasses: 114
    },
    {
        id: '5',
        name: 'Mariana Oliveira',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop',
        goal: 'Bem-estar',
        level: 'Iniciante',
        adherence: 60,
        lastTraining: '5 dias atrás',
        status: 'at-risk',
        email: 'mariana@email.com',
        phone: '11999999999',
        birthDate: '1998-09-30',
        startDate: '2024-10-01',
        paymentStatus: 'pending',
        observations: 'Iniciante, precisa de motivação constante. Prefere exercícios mais leves.',
        suspensionReason: 'travel',
        suspensionStartDate: '2024-12-20',
        suspensionEndDate: '2024-12-30',
        missedClasses: [
            { id: '3', date: '2024-12-15', reason: 'travel', replaced: true, replacementDate: '2024-12-10' }
        ],
        assessments: [],
        totalClasses: 12,
        completedClasses: 7
    },
    {
        id: '6',
        name: 'Ricardo Santos',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
        goal: 'Hipertrofia',
        level: 'Intermediário',
        adherence: 78,
        lastTraining: '2 dias atrás',
        status: 'active',
        email: 'ricardo@email.com',
        phone: '11999999999',
        birthDate: '1993-05-18',
        startDate: '2024-04-01',
        paymentStatus: 'paid',
        observations: 'Objetivo principal é ganhar massa muscular no peitoral e braços.',
        injuries: 'Nenhuma',
        preferences: 'Gosta de Bi-Sets e Drop-Sets. Ama treino de braço.',
        missedClasses: [],
        assessments: [],
        totalClasses: 36,
        completedClasses: 28
    },
    // ============ PERFIS ESPECIAIS ============
    {
        id: '7',
        name: 'Gabriel Ferreira',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
        goal: 'Desenvolvimento Atlético',
        level: 'Intermediário',
        adherence: 85,
        lastTraining: 'Ontem',
        status: 'active',
        email: 'gabriel@email.com',
        phone: '11999999999',
        birthDate: '2008-05-20', // 16 anos - ADOLESCENTE
        startDate: '2024-06-01',
        paymentStatus: 'paid',
        observations: '🧒 ADOLESCENTE 16 anos. Joga futebol na base do Palmeiras. Precisa desenvolver força funcional sem comprometer crescimento. Responsável: mãe (Carla).',
        injuries: 'Dor no joelho direito após treinos intensos (crescimento)',
        preferences: 'Ama exercícios explosivos e funcionais. Não pode treino muito pesado ainda.',
        missedClasses: [],
        assessments: [
            { id: 'g1', date: '2024-12-15', photos: [], weight: 62, bodyFat: 14, measures: { chest: 85, waist: 70, hips: 88, thighRight: 50, thighLeft: 50 }, skinfolds: { triceps: 8, abdomen: 10, thigh: 12 } },
            { id: 'g2', date: '2024-11-01', photos: [], weight: 60, bodyFat: 15, measures: { chest: 83, waist: 69, hips: 86, thighRight: 48, thighLeft: 48 }, skinfolds: { triceps: 9, abdomen: 11, thigh: 13 } },
            { id: 'g3', date: '2024-09-15', photos: [], weight: 58, bodyFat: 16, measures: { chest: 80, waist: 68, hips: 84, thighRight: 46, thighLeft: 46 }, skinfolds: { triceps: 10, abdomen: 12, thigh: 14 } },
            { id: 'g4', date: '2024-08-01', photos: [], weight: 56, bodyFat: 17, measures: { chest: 78, waist: 67, hips: 82, thighRight: 44, thighLeft: 44 }, skinfolds: { triceps: 11, abdomen: 14, thigh: 15 } },
            { id: 'g5', date: '2024-07-01', photos: [], weight: 54, bodyFat: 18, measures: { chest: 76, waist: 66, hips: 80, thighRight: 42, thighLeft: 42 }, skinfolds: { triceps: 12, abdomen: 16, thigh: 16 } }
        ],
        totalClasses: 28,
        completedClasses: 24
    },
    {
        id: '8',
        name: 'Dona Margarete Lima',
        avatar: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=200&h=200&fit=crop',
        goal: 'Qualidade de Vida',
        level: 'Iniciante',
        adherence: 92,
        lastTraining: 'Hoje',
        status: 'active',
        email: 'margarete@email.com',
        phone: '11999999999',
        birthDate: '1956-08-12', // 68 anos - IDOSA
        startDate: '2024-06-15',
        paymentStatus: 'paid',
        observations: '👵 IDOSA 68 anos. Objetivo: manter independência funcional, prevenir quedas, controlar osteoporose. Tem hipertensão controlada com medicação. Muito dedicada!',
        injuries: 'Artrose leve no joelho direito. Osteoporose. Evitar impacto.',
        preferences: 'Prefere exercícios sentada ou com apoio. Adora hidroginástica.',
        missedClasses: [],
        assessments: [
            { id: 'm1', date: '2024-12-10', photos: [], weight: 68, bodyFat: 32, measures: { chest: 98, waist: 88, hips: 102, thighRight: 52, thighLeft: 51 }, skinfolds: { triceps: 28, abdomen: 32, thigh: 30 } },
            { id: 'm2', date: '2024-10-15', photos: [], weight: 69, bodyFat: 33, measures: { chest: 99, waist: 90, hips: 103, thighRight: 52, thighLeft: 51 }, skinfolds: { triceps: 29, abdomen: 33, thigh: 31 } },
            { id: 'm3', date: '2024-09-01', photos: [], weight: 70, bodyFat: 34, measures: { chest: 100, waist: 92, hips: 104, thighRight: 51, thighLeft: 50 }, skinfolds: { triceps: 30, abdomen: 35, thigh: 32 } },
            { id: 'm4', date: '2024-07-20', photos: [], weight: 71, bodyFat: 35, measures: { chest: 101, waist: 94, hips: 105, thighRight: 50, thighLeft: 49 }, skinfolds: { triceps: 32, abdomen: 38, thigh: 34 } }
        ],
        totalClasses: 26,
        completedClasses: 24
    },
    {
        id: '9',
        name: 'Camila Rodrigues',
        avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop',
        goal: 'Recuperação Pós-Parto',
        level: 'Iniciante',
        adherence: 70,
        lastTraining: '2 dias atrás',
        status: 'active',
        email: 'camila@email.com',
        phone: '11999999999',
        birthDate: '1994-02-28',
        startDate: '2024-08-01',
        paymentStatus: 'paid',
        observations: '🤱 PÓS-PARTO (4 meses). Parto cesárea em agosto/2024. Diástase abdominal de 2 dedos. Amamentando. Foco: recuperar core, assoalho pélvico, perder gordura localizada.',
        injuries: 'Diástase abdominal - evitar crunches tradicionais. Sensibilidade na cicatriz da cesárea.',
        preferences: 'Prefere treinos curtos (30-40min) por conta do bebê. Horário flexível.',
        missedClasses: [
            { id: 'c1', date: '2024-12-18', reason: 'personal', replaced: false, notes: 'Bebê doente' },
            { id: 'c2', date: '2024-12-10', reason: 'personal', replaced: false, notes: 'Consulta pediatra' }
        ],
        assessments: [
            { id: 'c1', date: '2024-12-20', photos: [], weight: 68, bodyFat: 29, measures: { chest: 94, waist: 82, hips: 100, thighRight: 58, thighLeft: 57 }, skinfolds: { triceps: 22, abdomen: 28, thigh: 26 } },
            { id: 'c2', date: '2024-11-01', photos: [], weight: 70, bodyFat: 31, measures: { chest: 95, waist: 86, hips: 102, thighRight: 59, thighLeft: 58 }, skinfolds: { triceps: 24, abdomen: 32, thigh: 28 } },
            { id: 'c3', date: '2024-09-15', photos: [], weight: 73, bodyFat: 34, measures: { chest: 98, waist: 92, hips: 106, thighRight: 61, thighLeft: 60 }, skinfolds: { triceps: 28, abdomen: 38, thigh: 32 } },
            { id: 'c4', date: '2024-08-05', photos: [], weight: 76, bodyFat: 36, measures: { chest: 100, waist: 98, hips: 110, thighRight: 63, thighLeft: 62 }, skinfolds: { triceps: 30, abdomen: 42, thigh: 35 } }
        ],
        totalClasses: 20,
        completedClasses: 14
    },
    {
        id: '10',
        name: 'Fernanda Alves',
        avatar: 'https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=200&h=200&fit=crop',
        goal: 'Gestação Saudável',
        level: 'Intermediário',
        adherence: 88,
        lastTraining: 'Ontem',
        status: 'active',
        email: 'fernanda@email.com',
        phone: '11999999999',
        birthDate: '1991-11-05',
        startDate: '2024-04-01',
        paymentStatus: 'paid',
        observations: '🤰 GESTANTE 28 semanas. DPP: março/2025. Já treinava antes da gestação. Liberada pelo obstetra. Foco: manter condicionamento, preparar para parto, controlar ganho de peso.',
        injuries: 'Leve dor lombar. Evitar posição supina prolongada (síndrome da veia cava).',
        preferences: 'Prefere exercícios funcionais e pilates. Evitar exercícios de impacto.',
        missedClasses: [],
        assessments: [
            { id: 'f1', date: '2024-12-15', photos: [], weight: 72, bodyFat: null, measures: { chest: 96, waist: 95, hips: 104, thighRight: 55, thighLeft: 55 }, skinfolds: null },
            { id: 'f2', date: '2024-11-01', photos: [], weight: 70, bodyFat: null, measures: { chest: 94, waist: 90, hips: 102, thighRight: 54, thighLeft: 54 }, skinfolds: null },
            { id: 'f3', date: '2024-09-15', photos: [], weight: 67, bodyFat: null, measures: { chest: 92, waist: 82, hips: 100, thighRight: 53, thighLeft: 53 }, skinfolds: null },
            { id: 'f4', date: '2024-07-01', photos: [], weight: 64, bodyFat: 23, measures: { chest: 90, waist: 72, hips: 98, thighRight: 52, thighLeft: 52 }, skinfolds: { triceps: 18, abdomen: 20, thigh: 22 } },
            { id: 'f5', date: '2024-05-01', photos: [], weight: 62, bodyFat: 22, measures: { chest: 88, waist: 70, hips: 96, thighRight: 51, thighLeft: 51 }, skinfolds: { triceps: 16, abdomen: 18, thigh: 20 } }
        ],
        totalClasses: 35,
        completedClasses: 31
    },
    {
        id: '11',
        name: 'Roberto Nascimento',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
        goal: 'Controle Diabetes',
        level: 'Iniciante',
        adherence: 75,
        lastTraining: '1 dia atrás',
        status: 'active',
        email: 'roberto@email.com',
        phone: '11999999999',
        birthDate: '1975-04-10', // 49 anos
        startDate: '2024-06-01',
        paymentStatus: 'paid',
        observations: '💉 DIABÉTICO TIPO 2. HbA1c inicial: 8.2%, atual: 6.8%. Usa metformina. Pressão alta controlada. Objetivo: perder peso, melhorar sensibilidade insulínica, ganhar massa muscular.',
        injuries: 'Neuropatia leve nos pés - cuidado com exercícios de impacto. Cuidado com hipoglicemia.',
        preferences: 'Prefere treinos pela manhã. Sempre traz lanche no caso de hipo.',
        missedClasses: [
            { id: 'r1', date: '2024-12-16', reason: 'sick', replaced: false, notes: 'Glicemia descompensada' }
        ],
        assessments: [
            { id: 'r1', date: '2024-12-18', photos: [], weight: 92, bodyFat: 28, measures: { chest: 108, waist: 102, hips: 104, thighRight: 58, thighLeft: 57 }, skinfolds: { triceps: 22, abdomen: 35, thigh: 24 } },
            { id: 'r2', date: '2024-10-20', photos: [], weight: 95, bodyFat: 30, measures: { chest: 110, waist: 106, hips: 106, thighRight: 58, thighLeft: 57 }, skinfolds: { triceps: 24, abdomen: 38, thigh: 25 } },
            { id: 'r3', date: '2024-09-01', photos: [], weight: 98, bodyFat: 32, measures: { chest: 112, waist: 110, hips: 108, thighRight: 57, thighLeft: 56 }, skinfolds: { triceps: 26, abdomen: 42, thigh: 26 } },
            { id: 'r4', date: '2024-07-15', photos: [], weight: 102, bodyFat: 35, measures: { chest: 114, waist: 115, hips: 110, thighRight: 56, thighLeft: 55 }, skinfolds: { triceps: 28, abdomen: 48, thigh: 28 } },
            { id: 'r5', date: '2024-06-05', photos: [], weight: 105, bodyFat: 37, measures: { chest: 116, waist: 118, hips: 112, thighRight: 55, thighLeft: 54 }, skinfolds: { triceps: 30, abdomen: 52, thigh: 30 } }
        ],
        totalClasses: 28,
        completedClasses: 21
    }
];

// ============ EXERCISE LIBRARY ============
export const mockExercises: WorkoutExercise[] = [
    // ============ SUPERIOR: OMBRO/TRAPÉZIO ============
    { id: 'sh1', name: 'Desenvolvimento com Halteres', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '14kg', rest: '60s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh2', name: 'Elevação Lateral', category: 'musculacao', sets: [{ method: 'piramide', reps: '15-12-10', load: '8kg', rest: '45s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh3', name: 'Remada Alta (Trapézio)', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '30kg', rest: '60s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh4', name: 'Crucifixo Inverso', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: '6kg', rest: '45s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh5', name: 'Elevação Frontal', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '8kg', rest: '45s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh6', name: 'Arnold Press', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '12kg', rest: '60s' }], targetMuscle: 'Ombro/Trapézio' },

    // ============ SUPERIOR: PEITO ============
    { id: 'ch1', name: 'Supino Reto Barra', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '60kg', rest: '90s' }], targetMuscle: 'Peito', videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Bench_press_-_exercise_demonstration_video.webm' },
    { id: 'ch2', name: 'Supino Inclinado Halteres', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '24kg', rest: '90s' }], targetMuscle: 'Peito' },
    { id: 'ch3', name: 'Crossover (Polia Alta)', category: 'musculacao', sets: [{ method: 'dropset', reps: '12+10', load: '20kg', rest: '60s' }], targetMuscle: 'Peito' },
    { id: 'ch4', name: 'Peck Deck (Voador)', category: 'musculacao', sets: [{ method: 'biset', reps: '15', load: '40kg', rest: '45s' }], targetMuscle: 'Peito' },
    { id: 'ch5', name: 'Supino Declinado', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '50kg', rest: '90s' }], targetMuscle: 'Peito' },
    { id: 'ch6', name: 'Flexão de Braço', category: 'musculacao', sets: [{ method: 'restPause', reps: '20+10+5', load: 'Corporal', rest: '15s' }], targetMuscle: 'Peito' },

    // ============ SUPERIOR: COSTAS ============
    { id: 'bk1', name: 'Puxada Frontal Aberta', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '50kg', rest: '60s' }], targetMuscle: 'Costas' },
    { id: 'bk2', name: 'Remada Curvada', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '60kg', rest: '90s' }], targetMuscle: 'Costas' },
    { id: 'bk3', name: 'Remada Baixa Triângulo', category: 'musculacao', sets: [{ method: 'dropset', reps: '10+10', load: '50kg', rest: '60s' }], targetMuscle: 'Costas' },
    { id: 'bk4', name: 'Pulldown Corda', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: '30kg', rest: '45s' }], targetMuscle: 'Costas' },
    { id: 'bk5', name: 'Barra Fixa', category: 'musculacao', sets: [{ method: 'restPause', reps: 'Max+Max+Max', load: 'Corporal', rest: '20s' }], targetMuscle: 'Costas' },
    { id: 'bk6', name: 'Remada Unilateral Halter', category: 'musculacao', sets: [{ method: 'simples', reps: '12 cada', load: '20kg', rest: '60s' }], targetMuscle: 'Costas' },

    // ============ SUPERIOR: BÍCEPS ============
    { id: 'bi1', name: 'Rosca Direta Barra W', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '20kg', rest: '60s' }], targetMuscle: 'Bíceps', videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/14/Barbell_curl_-_exercise_demonstration_video.webm/Barbell_curl_-_exercise_demonstration_video.webm.480p.vp9.webm' },
    { id: 'bi2', name: 'Rosca Alternada com Rotação', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '12kg', rest: '60s' }], targetMuscle: 'Bíceps' },
    { id: 'bi3', name: 'Rosca Scott Máquina', category: 'musculacao', sets: [{ method: 'dropset', reps: '10+8', load: '30kg', rest: '60s' }], targetMuscle: 'Bíceps' },
    { id: 'bi4', name: 'Rosca Martelo', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '14kg', rest: '60s' }], targetMuscle: 'Bíceps' },
    { id: 'bi5', name: 'Rosca 21', category: 'musculacao', sets: [{ method: '21s', reps: '7+7+7', load: '15kg', rest: '90s' }], targetMuscle: 'Bíceps' },

    // ============ SUPERIOR: TRÍCEPS ============
    { id: 'tri1', name: 'Tríceps Pulley Corda', category: 'musculacao', sets: [{ method: 'piramide', reps: '15-12-10', load: '25kg', rest: '60s' }], targetMuscle: 'Tríceps' },
    { id: 'tri2', name: 'Tríceps Testa', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '20kg', rest: '60s' }], targetMuscle: 'Tríceps' },
    { id: 'tri3', name: 'Mergulho Banco', category: 'musculacao', sets: [{ method: 'simples', reps: 'até falha', load: 'Corporal', rest: '60s' }], targetMuscle: 'Tríceps' },
    { id: 'tri4', name: 'Tríceps Francês', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '10kg', rest: '60s' }], targetMuscle: 'Tríceps' },
    { id: 'tri5', name: 'Paralela', category: 'musculacao', sets: [{ method: 'restPause', reps: 'Max+Max', load: 'Corporal', rest: '20s' }], targetMuscle: 'Tríceps' },

    // ============ INFERIOR: QUADRÍCEPS ============
    { id: 'quad1', name: 'Agachamento Livre', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '80kg', rest: '120s' }], targetMuscle: 'Quadríceps', videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/18/Squat_-_exercise_demonstration_video.webm/Squat_-_exercise_demonstration_video.webm.480p.vp9.webm' },
    { id: 'quad2', name: 'Leg Press 45', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '200kg', rest: '120s' }], targetMuscle: 'Quadríceps', videoUrl: 'https://youtu.be/fppT8gFqGwA' },
    { id: 'quad3', name: 'Cadeira Extensora', category: 'musculacao', sets: [{ method: 'dropset', reps: '15+10', load: '50kg', rest: '60s' }], targetMuscle: 'Quadríceps' },
    { id: 'quad4', name: 'Agachamento Búlgaro', category: 'musculacao', sets: [{ method: 'simples', reps: '10/cada', load: '10kg', rest: '90s' }], targetMuscle: 'Quadríceps' },
    { id: 'quad5', name: 'Hack Squat', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '100kg', rest: '90s' }], targetMuscle: 'Quadríceps' },
    { id: 'quad6', name: 'Agachamento Frontal', category: 'musculacao', sets: [{ method: 'simples', reps: '8', load: '60kg', rest: '120s' }], targetMuscle: 'Quadríceps' },
    { id: 'quad7', name: 'Sissy Squat', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: 'Corporal', rest: '60s' }], targetMuscle: 'Quadríceps' },

    // ============ INFERIOR: POSTERIOR DE COXA ============
    { id: 'ham1', name: 'Mesa Flexora', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '40kg', rest: '60s' }], targetMuscle: 'Posterior de Coxa' },
    { id: 'ham2', name: 'Stiff com Barra', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '50kg', rest: '90s' }], targetMuscle: 'Posterior de Coxa' },
    { id: 'ham3', name: 'Cadeira Flexora', category: 'musculacao', sets: [{ method: 'biset', reps: '15', load: '45kg', rest: '60s' }], targetMuscle: 'Posterior de Coxa' },
    { id: 'ham4', name: 'Stiff Unilateral', category: 'musculacao', sets: [{ method: 'simples', reps: '12 cada', load: '12kg', rest: '60s' }], targetMuscle: 'Posterior de Coxa' },
    { id: 'ham5', name: 'Good Morning', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '40kg', rest: '60s' }], targetMuscle: 'Posterior de Coxa' },

    // ============ INFERIOR: GLÚTEO ============
    { id: 'glut1', name: 'Elevação Pélvica Barra (Hip Thrust)', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '80kg', rest: '120s' }], targetMuscle: 'Glúteo' },
    { id: 'glut2', name: 'Glúteo 4 Apoios Caneleira', category: 'musculacao', sets: [{ method: 'simples', reps: '20', load: '10kg', rest: '45s' }], targetMuscle: 'Glúteo' },
    { id: 'glut3', name: 'Cadeira Abdutora (Tronco Inclinado)', category: 'musculacao', sets: [{ method: 'dropset', reps: '20+15', load: '60kg', rest: '60s' }], targetMuscle: 'Glúteo' },
    { id: 'glut4', name: 'Sumo Squat', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: '20kg', rest: '60s' }], targetMuscle: 'Glúteo' },
    { id: 'glut5', name: 'Kickback na Polia', category: 'musculacao', sets: [{ method: 'simples', reps: '15 cada', load: '15kg', rest: '45s' }], targetMuscle: 'Glúteo' },
    { id: 'glut6', name: 'Frog Pump', category: 'musculacao', sets: [{ method: 'simples', reps: '30', load: 'Corporal', rest: '45s' }], targetMuscle: 'Glúteo' },

    // ============ INFERIOR: PANTURRILHA / INTERNA ============
    { id: 'calf1', name: 'Panturrilha em Pé Máquina', category: 'musculacao', sets: [{ method: 'simples', reps: '20', load: '50kg', rest: '45s' }], targetMuscle: 'Panturrilha' },
    { id: 'calf2', name: 'Panturrilha Sentado', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: '40kg', rest: '45s' }], targetMuscle: 'Panturrilha' },
    { id: 'aduc1', name: 'Cadeira Adutora', category: 'musculacao', sets: [{ method: 'simples', reps: '20', load: '40kg', rest: '45s' }], targetMuscle: 'Parte Interna da Coxa' },
    { id: 'calf3', name: 'Panturrilha no Leg Press', category: 'musculacao', sets: [{ method: 'dropset', reps: '20+15+10', load: '100kg', rest: '30s' }], targetMuscle: 'Panturrilha' },

    // ============ CARDIO - ESTEIRA / CORRIDA ============
    { id: 'run1', name: 'Corrida Leve (Zona 2)', category: 'corrida', sets: [{ method: 'simples', reps: '-', time: '20 min', load: 'Vel 8.0', rest: '-', effortZone: 2 }], targetMuscle: 'Cardio' },
    { id: 'run2', name: 'HIIT Esteira (Tiros)', category: 'corrida', sets: [{ method: 'simples', reps: '10 tiros', time: '30s/30s', load: 'Vel 14/6', rest: '-', effortZone: 5 }], targetMuscle: 'Cardio' },
    { id: 'run3', name: 'Corrida em Rampa', category: 'corrida', sets: [{ method: 'simples', reps: '-', time: '15 min', load: 'Incl 8% Vel 6', rest: '-', effortZone: 3 }], targetMuscle: 'Cardio/Glúteo' },
    { id: 'run4', name: 'Caminhada Rápida', category: 'corrida', sets: [{ method: 'simples', reps: '-', time: '30 min', load: 'Vel 6.5', rest: '-', effortZone: 1 }], targetMuscle: 'Cardio' },
    { id: 'run5', name: 'Fartlek', category: 'corrida', sets: [{ method: 'simples', reps: '-', time: '25 min', load: 'Variado', rest: '-', effortZone: 4 }], targetMuscle: 'Cardio' },

    // ============ CARDIO - ESCADA / STAIRMASTER ============
    { id: 'stair1', name: 'Escada Infinita (Moderado)', category: 'escada', sets: [{ method: 'simples', reps: '-', time: '15 min', load: 'Nível 6', rest: '-', effortZone: 3 }], targetMuscle: 'Cardio/Glúteo' },
    { id: 'stair2', name: 'Escada HIIT', category: 'escada', sets: [{ method: 'simples', reps: '8 sprints', time: '30s/30s', load: 'Nível 10/4', rest: '-', effortZone: 5 }], targetMuscle: 'Cardio/Pernas' },
    { id: 'stair3', name: 'Escada de Oxigênio (Ladder)', category: 'escada', sets: [{ method: 'simples', reps: '1-2-3-4-5-4-3-2-1 min', time: '25 min total', load: 'Nível crescente', rest: 'Ativo', effortZone: 4 }], targetMuscle: 'Cardio' },
    { id: 'stair4', name: 'Escada Lateral', category: 'escada', sets: [{ method: 'simples', reps: '-', time: '10 min', load: 'Nível 5', rest: '-', effortZone: 3 }], targetMuscle: 'Glúteo Médio' },
    { id: 'stair5', name: 'Skip na Escada', category: 'escada', sets: [{ method: 'simples', reps: '-', time: '12 min', load: 'Nível 7', rest: '-', effortZone: 4 }], targetMuscle: 'Cardio/Potência' },

    // ============ CARDIO - GERAL ============
    { id: 'card1', name: 'Bike Ergométrica', category: 'cardio', sets: [{ method: 'simples', reps: '-', time: '20 min', load: 'Resistência 6', rest: '-', effortZone: 2 }], targetMuscle: 'Cardio' },
    { id: 'card2', name: 'Bike HIIT (Tabata)', category: 'cardio', sets: [{ method: 'simples', reps: '8 rounds', time: '20s/10s', load: 'Max', rest: '-', effortZone: 5 }], targetMuscle: 'Cardio' },
    { id: 'card3', name: 'Transport (Ergômetro de Braço)', category: 'cardio', sets: [{ method: 'simples', reps: '-', time: '10 min', load: 'Nível 5', rest: '-', effortZone: 3 }], targetMuscle: 'Cardio/Braços' },
    { id: 'card4', name: 'Remo Ergométrico', category: 'cardio', sets: [{ method: 'simples', reps: '-', time: '15 min', load: '24 SPM', rest: '-', effortZone: 3 }], targetMuscle: 'Cardio/Full Body' },
    { id: 'card5', name: 'Elíptico (Cross Trainer)', category: 'cardio', sets: [{ method: 'simples', reps: '-', time: '20 min', load: 'Nível 8', rest: '-', effortZone: 2 }], targetMuscle: 'Cardio' },
    { id: 'card6', name: 'Assault Bike', category: 'cardio', sets: [{ method: 'simples', reps: '10 sprints', time: '15s/45s', load: 'Max', rest: '-', effortZone: 5 }], targetMuscle: 'Cardio/Full Body' },

    // ============ FUNCIONAL ============
    { id: 'func1', name: 'Burpees', category: 'funcional', sets: [{ method: 'simples', reps: '15', load: 'Corporal', rest: '45s' }], targetMuscle: 'Full Body' },
    { id: 'func2', name: 'Kettlebell Swing', category: 'funcional', sets: [{ method: 'simples', reps: '20', load: '12kg', rest: '45s' }], targetMuscle: 'Posterior/Cardio' },
    { id: 'func3', name: 'Box Jump', category: 'funcional', sets: [{ method: 'simples', reps: '12', load: 'Box 60cm', rest: '60s' }], targetMuscle: 'Explosão/Pernas' },
    { id: 'func4', name: 'Battle Rope (Ondas)', category: 'funcional', sets: [{ method: 'simples', reps: '-', time: '30s', load: 'Intenso', rest: '30s' }], targetMuscle: 'Full Body/Cardio' },
    { id: 'func5', name: 'Sled Push', category: 'funcional', sets: [{ method: 'simples', reps: '4 viagens', load: '50kg', rest: '90s' }], targetMuscle: 'Força/Potência' },
    { id: 'func6', name: 'Turkish Get Up', category: 'funcional', sets: [{ method: 'simples', reps: '3 cada lado', load: '12kg', rest: '60s' }], targetMuscle: 'Full Body/Core' },
    { id: 'func7', name: 'Medicine Ball Slam', category: 'funcional', sets: [{ method: 'simples', reps: '15', load: '8kg', rest: '45s' }], targetMuscle: 'Core/Explosão' },
    { id: 'func8', name: 'Farmer Walk', category: 'funcional', sets: [{ method: 'simples', reps: '3 viagens 20m', load: '24kg cada', rest: '60s' }], targetMuscle: 'Grip/Core' },
    { id: 'func9', name: 'Wall Ball', category: 'funcional', sets: [{ method: 'simples', reps: '20', load: '6kg', rest: '45s' }], targetMuscle: 'Full Body' },
    { id: 'func10', name: 'Thrusters', category: 'funcional', sets: [{ method: 'simples', reps: '12', load: '30kg', rest: '60s' }], targetMuscle: 'Full Body' },
    { id: 'func11', name: 'Rope Climb', category: 'funcional', sets: [{ method: 'simples', reps: '3 subidas', load: 'Corporal', rest: '90s' }], targetMuscle: 'Costas/Braços' },
    { id: 'func12', name: 'Bear Crawl', category: 'funcional', sets: [{ method: 'simples', reps: '30m', load: 'Corporal', rest: '45s' }], targetMuscle: 'Core/Full Body' },

    // ============ PLIOMETRIA ============
    { id: 'plyo1', name: 'Salto em Profundidade', category: 'pliometria', sets: [{ method: 'simples', reps: '8', load: 'Box 40cm', rest: '90s' }], targetMuscle: 'Explosão' },
    { id: 'plyo2', name: 'Salto Lateral', category: 'pliometria', sets: [{ method: 'simples', reps: '10 cada lado', load: 'Corporal', rest: '60s' }], targetMuscle: 'Agilidade' },
    { id: 'plyo3', name: 'Skipping Alto', category: 'pliometria', sets: [{ method: 'simples', reps: '20m', load: 'Corporal', rest: '45s' }], targetMuscle: 'Explosão/Cardio' },
    { id: 'plyo4', name: 'Pogo Jumps', category: 'pliometria', sets: [{ method: 'simples', reps: '20', load: 'Corporal', rest: '45s' }], targetMuscle: 'Panturrilha/Explosão' },
    { id: 'plyo5', name: 'Broad Jump', category: 'pliometria', sets: [{ method: 'simples', reps: '6', load: 'Corporal', rest: '90s' }], targetMuscle: 'Potência Horizontal' },
    { id: 'plyo6', name: 'Tuck Jump', category: 'pliometria', sets: [{ method: 'simples', reps: '10', load: 'Corporal', rest: '60s' }], targetMuscle: 'Explosão/Core' },

    // ============ MOBILIDADE ============
    { id: 'mob1', name: 'Alongamento de Quadril (90/90)', category: 'mobilidade', sets: [{ method: 'simples', reps: '-', time: '60s cada', load: '-', rest: '-' }], targetMuscle: 'Quadril' },
    { id: 'mob2', name: 'Cat-Cow (Gato-Vaca)', category: 'mobilidade', sets: [{ method: 'simples', reps: '15', load: '-', rest: '-' }], targetMuscle: 'Coluna' },
    { id: 'mob3', name: 'World\'s Greatest Stretch', category: 'mobilidade', sets: [{ method: 'simples', reps: '5 cada lado', load: '-', rest: '-' }], targetMuscle: 'Full Body' },
    { id: 'mob4', name: 'Foam Roller Quadríceps', category: 'mobilidade', sets: [{ method: 'simples', reps: '-', time: '90s', load: '-', rest: '-' }], targetMuscle: 'Quadríceps' },
    { id: 'mob5', name: 'Arm Circles', category: 'mobilidade', sets: [{ method: 'simples', reps: '20 cada direção', load: '-', rest: '-' }], targetMuscle: 'Ombros' },
    { id: 'mob6', name: 'Hip Flexor Stretch', category: 'mobilidade', sets: [{ method: 'simples', reps: '-', time: '60s cada', load: '-', rest: '-' }], targetMuscle: 'Quadril' },
    { id: 'mob7', name: 'Hanging (Pendurar na Barra)', category: 'mobilidade', sets: [{ method: 'simples', reps: '-', time: '30s', load: 'Corporal', rest: '-' }], targetMuscle: 'Ombros/Coluna' },

    // ============ ESPORTES ESPECÍFICOS ============
    { id: 'sport1', name: 'Ladder Drill (Escada de Agilidade)', category: 'esporte', sets: [{ method: 'simples', reps: '5 passadas', load: '-', rest: '30s' }], targetMuscle: 'Agilidade', sportParams: { sport: 'futebol', effortZone: 4 } },
    { id: 'sport2', name: 'Cone Drills (Mudança de Direção)', category: 'esporte', sets: [{ method: 'simples', reps: '8', load: '-', rest: '45s' }], targetMuscle: 'Agilidade', sportParams: { sport: 'tenis', effortZone: 4 } },
    { id: 'sport3', name: 'Shuttle Run', category: 'esporte', sets: [{ method: 'simples', reps: '6', load: '20m', rest: '60s' }], targetMuscle: 'Velocidade', sportParams: { sport: 'futebol', effortZone: 5 } },
    { id: 'sport4', name: 'Medicine Ball Rotation Throw', category: 'esporte', sets: [{ method: 'simples', reps: '10 cada lado', load: '4kg', rest: '45s' }], targetMuscle: 'Core/Rotação', sportParams: { sport: 'tenis', effortZone: 3 } },
    { id: 'sport5', name: 'Sprint com Resistência (Paraquedas)', category: 'esporte', sets: [{ method: 'simples', reps: '6', load: '30m', rest: '90s' }], targetMuscle: 'Velocidade', sportParams: { sport: 'corrida', effortZone: 5 } },
];

// ============ WORKOUT TEMPLATES (Premium) ============
export const mockTemplates: WorkoutTemplate[] = [
    {
        id: 'tpl1',
        name: 'Push Day - Hipertrofia',
        description: 'Treino de empurrar focado em peito, ombro e tríceps para hipertrofia',
        category: 'hipertrofia',
        exercises: mockExercises.filter(e => ['ch1', 'ch2', 'sh1', 'sh2', 'tri1', 'tri2'].includes(e.id)),
        duration: '60 min',
        difficulty: 'intermediario',
        createdBy: 'system',
        isPublic: true,
        tags: ['push', 'peito', 'ombro', 'triceps']
    },
    {
        id: 'tpl2',
        name: 'Pull Day - Hipertrofia',
        description: 'Treino de puxar focado em costas e bíceps para hipertrofia',
        category: 'hipertrofia',
        exercises: mockExercises.filter(e => ['bk1', 'bk2', 'bk3', 'bi1', 'bi2'].includes(e.id)),
        duration: '55 min',
        difficulty: 'intermediario',
        createdBy: 'system',
        isPublic: true,
        tags: ['pull', 'costas', 'biceps']
    },
    {
        id: 'tpl3',
        name: 'Legs Day - Foco Glúteo',
        description: 'Treino de pernas com ênfase em glúteos para mulheres',
        category: 'hipertrofia',
        exercises: mockExercises.filter(e => ['glut1', 'glut2', 'glut3', 'ham2', 'quad4'].includes(e.id)),
        duration: '50 min',
        difficulty: 'avancado',
        createdBy: 'system',
        isPublic: true,
        tags: ['pernas', 'gluteo', 'feminino']
    },
    {
        id: 'tpl4',
        name: 'HIIT Full Body',
        description: 'Circuito funcional de alta intensidade para queima de gordura',
        category: 'emagrecimento',
        exercises: mockExercises.filter(e => ['func1', 'func2', 'func3', 'func7', 'card2'].includes(e.id)),
        duration: '30 min',
        difficulty: 'avancado',
        createdBy: 'system',
        isPublic: true,
        tags: ['hiit', 'funcional', 'cardio', 'queima']
    },
    {
        id: 'tpl5',
        name: 'Força Máxima - Básicos',
        description: 'Treino de força com os exercícios básicos do powerlifting',
        category: 'forca',
        exercises: mockExercises.filter(e => ['quad1', 'ch1', 'ham2'].includes(e.id)),
        duration: '75 min',
        difficulty: 'avancado',
        createdBy: 'system',
        isPublic: true,
        tags: ['forca', 'powerlifting', 'basicos']
    }
];

// ============ CUSTOM METHODS (Premium) ============
export const mockCustomMethods: CustomMethod[] = [
    {
        id: 'cm1',
        name: 'Método 12-22',
        description: 'Realizar 12 reps, descansar 22 segundos, repetir até completar 4 mini-séries',
        icon: '🔥',
        color: 'from-orange-500 to-red-500',
        structure: {
            sets: 4,
            repsPattern: '12-12-12-12',
            restPattern: '22s entre mini-séries',
            loadPattern: 'Manter carga',
            specialInstructions: 'Não travar articulação no topo do movimento'
        },
        createdBy: 'system'
    },
    {
        id: 'cm2',
        name: 'Myo Reps',
        description: 'Série ativadora + mini-séries com pausa mínima até perder 2+ reps',
        icon: '💪',
        color: 'from-purple-500 to-pink-500',
        structure: {
            sets: 5,
            repsPattern: '15 + 5+5+5+5',
            restPattern: '3-5 respirações',
            loadPattern: 'Mesma carga sempre',
            specialInstructions: 'Parar quando perder 2 reps em relação à primeira mini-série'
        },
        createdBy: 'system'
    },
    {
        id: 'cm3',
        name: 'Cluster Set',
        description: 'Reps individuais com carga alta e descanso curto entre cada rep',
        icon: '⚡',
        color: 'from-blue-500 to-cyan-500',
        structure: {
            sets: 1,
            repsPattern: '6 singles',
            restPattern: '15-20s entre reps',
            loadPattern: '85-90% 1RM',
            specialInstructions: 'Cada rep deve ser explosiva e perfeita'
        },
        createdBy: 'system'
    },
    {
        id: 'cm4',
        name: 'FST-7',
        description: 'Fascia Stretch Training - 7 séries finais com descanso curto',
        icon: '🔄',
        color: 'from-emerald-500 to-teal-500',
        structure: {
            sets: 7,
            repsPattern: '10-12',
            restPattern: '30-45s',
            loadPattern: 'Moderada, foco na contração',
            specialInstructions: 'Alongar a fáscia entre séries. Usar como finalizador.'
        },
        createdBy: 'system'
    }
];

