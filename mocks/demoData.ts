import { Client, WorkoutExercise } from '../types';

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
        paymentStatus: 'paid',
        missedClasses: [],
        assessments: []
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
        paymentStatus: 'overdue',
        missedClasses: [
            { date: '2023-12-20', reason: 'sick', replaced: false }
        ],
        assessments: []
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
        paymentStatus: 'paid',
        missedClasses: [],
        assessments: []
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
        paymentStatus: 'paid',
        missedClasses: [],
        assessments: []
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
        paymentStatus: 'pending',
        missedClasses: [
            { date: '2023-12-15', reason: 'travel', replaced: true }
        ],
        assessments: []
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
        paymentStatus: 'paid',
        missedClasses: [],
        assessments: []
    }
];

export const mockExercises: WorkoutExercise[] = [
    // --- SUPERIOR: OMBRO/TRAPÉZIO ---
    { id: 'sh1', name: 'Desenvolvimento com Halteres', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '14kg', rest: '60s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh2', name: 'Elevação Lateral', category: 'musculacao', sets: [{ method: 'piramide', reps: '15-12-10', load: '8kg', rest: '45s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh3', name: 'Remada Alta (Trapézio)', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '30kg', rest: '60s' }], targetMuscle: 'Ombro/Trapézio' },
    { id: 'sh4', name: 'Crucifixo Inverso', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: '6kg', rest: '45s' }], targetMuscle: 'Ombro/Trapézio' },

    // --- SUPERIOR: PEITO ---
    { id: 'ch1', name: 'Supino Reto Barra', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '60kg', rest: '90s' }], targetMuscle: 'Peito' },
    { id: 'ch2', name: 'Supino Inclinado Halteres', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '24kg', rest: '90s' }], targetMuscle: 'Peito' },
    { id: 'ch3', name: 'Crossover (Polia Alta)', category: 'musculacao', sets: [{ method: 'dropset', reps: '12+10', load: '20kg', rest: '60s' }], targetMuscle: 'Peito' },
    { id: 'ch4', name: 'Peck Deck (Voador)', category: 'musculacao', sets: [{ method: 'biset', reps: '15', load: '40kg', rest: '45s' }], targetMuscle: 'Peito' },

    // --- SUPERIOR: COSTAS ---
    { id: 'bk1', name: 'Puxada Frontal Aberta', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '50kg', rest: '60s' }], targetMuscle: 'Costas' },
    { id: 'bk2', name: 'Remada Curvada', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '60kg', rest: '90s' }], targetMuscle: 'Costas' },
    { id: 'bk3', name: 'Remada Baixa Triângulo', category: 'musculacao', sets: [{ method: 'dropset', reps: '10+10', load: '50kg', rest: '60s' }], targetMuscle: 'Costas' },
    { id: 'bk4', name: 'Pulldown Corda', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: '30kg', rest: '45s' }], targetMuscle: 'Costas' },

    // --- SUPERIOR: BÍCEPS ---
    { id: 'bi1', name: 'Rosca Direta Barra W', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '20kg', rest: '60s' }], targetMuscle: 'Bíceps' },
    { id: 'bi2', name: 'Rosca Alternada com Rotação', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '12kg', rest: '60s' }], targetMuscle: 'Bíceps' },
    { id: 'bi3', name: 'Rosca Scott Máquina', category: 'musculacao', sets: [{ method: 'dropset', reps: '10+8', load: '30kg', rest: '60s' }], targetMuscle: 'Bíceps' },

    // --- SUPERIOR: TRÍCEPS ---
    { id: 'tri1', name: 'Tríceps Pulley Corda', category: 'musculacao', sets: [{ method: 'piramide', reps: '15-12-10', load: '25kg', rest: '60s' }], targetMuscle: 'Tríceps' },
    { id: 'tri2', name: 'Tríceps Testa', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '20kg', rest: '60s' }], targetMuscle: 'Tríceps' },
    { id: 'tri3', name: 'Mergulho Banco', category: 'musculacao', sets: [{ method: 'simples', reps: 'até falha', load: 'Peso do corpo', rest: '60s' }], targetMuscle: 'Tríceps' },

    // --- INFERIOR: QUADRÍCEPS ---
    { id: 'quad1', name: 'Agachamento Livre', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '80kg', rest: '120s' }], targetMuscle: 'Quadríceps' },
    { id: 'quad2', name: 'Leg Press 45', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '200kg', rest: '120s' }], targetMuscle: 'Quadríceps' },
    { id: 'quad3', name: 'Cadeira Extensora', category: 'musculacao', sets: [{ method: 'dropset', reps: '15+10', load: '50kg', rest: '60s' }], targetMuscle: 'Quadríceps' },
    { id: 'quad4', name: 'Agachamento Búlgaro', category: 'musculacao', sets: [{ method: 'simples', reps: '10/cada', load: '10kg', rest: '90s' }], targetMuscle: 'Quadríceps' },

    // --- INFERIOR: POSTERIOR DE COXA ---
    { id: 'ham1', name: 'Mesa Flexora', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '40kg', rest: '60s' }], targetMuscle: 'Posterior de Coxa' },
    { id: 'ham2', name: 'Stiff com Barra', category: 'musculacao', sets: [{ method: 'simples', reps: '10', load: '50kg', rest: '90s' }], targetMuscle: 'Posterior de Coxa' },
    { id: 'ham3', name: 'Cadeira Flexora', category: 'musculacao', sets: [{ method: 'biset', reps: '15', load: '45kg', rest: '60s' }], targetMuscle: 'Posterior de Coxa' },

    // --- INFERIOR: GLÚTEO ---
    { id: 'glut1', name: 'Elevação Pélvica Barra', category: 'musculacao', sets: [{ method: 'simples', reps: '12', load: '80kg', rest: '120s' }], targetMuscle: 'Glúteo' },
    { id: 'glut2', name: 'Glúteo 4 Apoios Caneleira', category: 'musculacao', sets: [{ method: 'simples', reps: '20', load: '10kg', rest: '45s' }], targetMuscle: 'Glúteo' },
    { id: 'glut3', name: 'Cadeira Abdutora (Tronco Inclinado)', category: 'musculacao', sets: [{ method: 'dropset', reps: '20+15', load: '60kg', rest: '60s' }], targetMuscle: 'Glúteo' },

    // --- INFERIOR: PANTURRILHA / INTERNA ---
    { id: 'calf1', name: 'Panturrilha em Pé Máquina', category: 'musculacao', sets: [{ method: 'simples', reps: '20', load: '50kg', rest: '45s' }], targetMuscle: 'Panturrilha' },
    { id: 'calf2', name: 'Panturrilha Sentado (Banco)', category: 'musculacao', sets: [{ method: 'simples', reps: '15', load: '40kg', rest: '45s' }], targetMuscle: 'Panturrilha' },
    { id: 'aduc1', name: 'Cadeira Adutora', category: 'musculacao', sets: [{ method: 'simples', reps: '20', load: '40kg', rest: '45s' }], targetMuscle: 'Parte Interna da Coxa' },

    // --- CARDIO & FUNCIONAL (Mantidos) ---
    { id: 'card1', name: 'Esteira - Corrida Leve', category: 'cardio', sets: [{ method: 'simples', reps: '0', time: '20 min', load: 'Vel 8.0', rest: '-' }], targetMuscle: 'Cardio' },
    { id: 'card2', name: 'Esteira - Tiro (HIIT)', category: 'cardio', sets: [{ method: 'simples', reps: '10 tiros', time: '30s/30s', load: 'Vel 14', rest: '-' }], targetMuscle: 'Cardio' },
    { id: 'func1', name: 'Burpees', category: 'funcional', sets: [{ method: 'simples', reps: '15', load: 'Corporal', rest: '45s' }], targetMuscle: 'Full Body' },
    { id: 'func2', name: 'Kettlebell Swing', category: 'funcional', sets: [{ method: 'simples', reps: '20', load: '12kg', rest: '45s' }], targetMuscle: 'Posterior' }
];
