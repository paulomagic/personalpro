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
    {
        id: 'ex1',
        name: 'Supino Reto',
        category: 'musculacao',
        sets: [
            { method: 'simples', reps: '10', load: '20kg', rest: '60s' },
            { method: 'simples', reps: '10', load: '20kg', rest: '60s' },
            { method: 'simples', reps: '10', load: '20kg', rest: '60s' }
        ],
        targetMuscle: 'Peitoral'
    },
    {
        id: 'ex2',
        name: 'Agachamento Livre',
        category: 'musculacao',
        sets: [
            { method: 'piramide', reps: '12', load: '30kg', rest: '90s' },
            { method: 'piramide', reps: '10', load: '40kg', rest: '90s' },
            { method: 'piramide', reps: '8', load: '50kg', rest: '90s' }
        ],
        targetMuscle: 'Quadríceps'
    },
    {
        id: 'ex3',
        name: 'Corrida Esteira',
        category: 'cardio',
        sets: [
            { method: 'simples', reps: '15 min', load: 'Vel 8-10', rest: '-' }
        ],
        notes: 'Falta de ar moderada'
    },
    {
        id: 'ex4',
        name: 'Burpees',
        category: 'funcional',
        sets: [
            { method: 'simples', reps: '15', load: 'Peso do corpo', rest: '30s' },
            { method: 'simples', reps: '15', load: 'Peso do corpo', rest: '30s' },
            { method: 'simples', reps: '15', load: 'Peso do corpo', rest: '30s' }
        ]
    }
];
