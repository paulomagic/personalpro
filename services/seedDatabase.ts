import { supabase } from './supabaseCore';
import { Client } from '../types';

// ============ SEED DATA GENERATOR ============

const PERSONAS = [
    {
        name: 'Enzo Gabriel',
        age: 16,
        goal: 'Hipertrofia',
        level: 'Iniciante',
        status: 'active',
        adherence: 90,
        avatar_url: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Adolescente, muito motivado. Foco em ganhar massa muscular nos braços e peito. Precisa de orientação constante na postura.',
        injuries: 'Nenhuma',
        preferences: 'Gosta de supino e rosca direta. Odeia leg day.',
        history: { startWeight: 60, currentWeight: 66, startBF: 12, currentBF: 13 } // Ganhou massa
    },
    {
        name: 'Maria Helena',
        age: 68,
        goal: 'Saúde e Mobilidade',
        level: 'Iniciante',
        status: 'active',
        adherence: 100,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Idosa com osteoporose leve. Foco total em fortalecimento funcional e prevenção de quedas.',
        injuries: 'Osteoporose lombar, Dores no joelho (artrose leve).',
        preferences: 'Prefere exercícios sentada ou com apoio. Gosta de música clássica durante o treino.',
        history: { startWeight: 65, currentWeight: 64, startBF: 28, currentBF: 26 } // Melhorou composição lenta
    },
    {
        name: 'Juliana Costa',
        age: 29,
        goal: 'Gestante Saudável',
        level: 'Intermediário',
        status: 'active',
        adherence: 85,
        avatar_url: 'https://images.unsplash.com/photo-1596489399852-5a39cb36ca02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Gestante (24 semanas). Monitorar frequência cardíaca e evitar decúbito dorsal por tempo prolongado.',
        injuries: 'Lombalgia gestacional.',
        preferences: 'Gosta de pilates e exercícios na bola suíça.',
        history: { startWeight: 62, currentWeight: 68, startBF: 22, currentBF: 25 } // Aumento de peso saudável
    },
    {
        name: 'Roberto Andrade',
        age: 42,
        goal: 'Emagrecimento',
        level: 'Iniciante',
        status: 'at-risk',
        adherence: 50,
        avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Obesidade grau 1. Hipertenso controlado. Tem dificuldade com consistência e dieta.',
        injuries: 'Condromalácia patelar grau 2.',
        preferences: 'Prefere esteira assistindo séries. Não gosta de burpees.',
        history: { startWeight: 110, currentWeight: 106, startBF: 35, currentBF: 33 } // Perda lenta com recaídas
    },
    {
        name: 'Camila Vegan',
        age: 26,
        goal: 'Hipertrofia Glúteo',
        level: 'Avançado',
        status: 'active',
        adherence: 95,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Atleta Wellness amadora. Dieta vegana estrita. Treina pesado, foco total em inferiores.',
        injuries: 'Nenhuma.',
        preferences: 'Ama Elevação Pélvica (200kg) e Agachamento Búlgaro.',
        history: { startWeight: 58, currentWeight: 62, startBF: 18, currentBF: 16 } // Recomposição absurda
    },
    {
        name: 'Lucas Ferreira',
        age: 31,
        goal: 'Reabilitação LCA',
        level: 'Intermediário',
        status: 'paused',
        adherence: 0,
        avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Pós-operatório LCA (4 meses). Já liberado para fortalecimento mais intenso, mas viajou a trabalho.',
        injuries: 'Pós-op LCA Joelho Direito.',
        preferences: 'Focado em voltar a jogar futebol.',
        history: { startWeight: 78, currentWeight: 80, startBF: 15, currentBF: 18 } // Ganhou gordura parado
    },
    {
        name: 'Ana Soares',
        age: 70,
        goal: 'Saúde e Mobilidade',
        level: 'Iniciante',
        status: 'active',
        adherence: 95,
        avatar_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Idosa ativa de 70 anos. Sem lesões ou limitações graves. Foco em longevidade, força funcional e manutenção da qualidade de vida.',
        injuries: 'Nenhuma.',
        preferences: 'Gosta de exercícios com peso corporal e elásticos. Prefere treinos pela manhã.',
        history: { startWeight: 58, currentWeight: 57, startBF: 26, currentBF: 24 } // Melhorando composição
    },
    {
        name: 'Marcos Strong',
        age: 28,
        goal: 'Força (Powerlifting)',
        level: 'Atleta',
        status: 'active',
        adherence: 98,
        avatar_url: 'https://images.unsplash.com/photo-1544348817-5f2cf14b88c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Competidor de Powerlifting. Ciclo de choque. Cargas extremas.',
        injuries: 'Tendinite cotovelo recorrente.',
        preferences: 'Treino simples: SBD (Squat, Bench, Deadlift).',
        history: { startWeight: 90, currentWeight: 94, startBF: 15, currentBF: 16 } // Bulk sujo
    },
    {
        name: 'Fernanda Executiva',
        age: 40,
        goal: 'Anti-Stress/Saúde',
        level: 'Intermediário',
        status: 'active',
        adherence: 60,
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'CEO de startup. Altíssimo stress. Cortisol alto. Treina pra não surtar.',
        injuries: 'Tensão cervical crônica.',
        preferences: 'Boxe e HIIT para desestressar.',
        history: { startWeight: 60, currentWeight: 60, startBF: 24, currentBF: 22 } // Manutenção
    },
    {
        name: 'Carlos Mendes',
        age: 72,
        goal: 'Saúde e Mobilidade',
        level: 'Iniciante',
        status: 'active',
        adherence: 85,
        avatar_url: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        observations: 'Idoso de 72 anos com artrose de quadril bilateral. Foco em manter mobilidade articular e prevenir atrofia muscular. Evitar impactos e amplitudes extremas.',
        injuries: 'Artrose de quadril bilateral (grau 2), Rigidez matinal.',
        preferences: 'Prefere exercícios na água ou sentado. Não gosta de agachamentos profundos.',
        history: { startWeight: 72, currentWeight: 70, startBF: 22, currentBF: 20 } // Melhorando força
    }
];

export const seedDatabase = async (userId: string) => {
    console.log('🌱 Starting database seed for user:', userId);
    let createdCount = 0;

    for (const p of PERSONAS) {
        // 1. Create Client
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .insert({
                coach_id: userId,
                name: p.name,
                age: p.age,
                goal: p.goal,
                level: p.level,
                status: p.status,
                adherence: p.adherence,
                observations: p.observations,
                injuries: p.injuries,
                preferences: p.preferences,
                avatar_url: p.avatar_url,
                email: `${p.name.toLowerCase().replace(' ', '.')}@exemplo.com`,
                phone: '(11) 99999-9999',
                height: 1.70, // Generic
                weight: p.history.currentWeight
            })
            .select()
            .single();

        if (clientError) {
            console.error('Error creating client:', p.name, clientError);
            continue;
        }

        createdCount++;

        // 2. Create Assessments History (Last 6 months)
        const assessments = [];
        const months = 6;

        for (let i = months; i >= 0; i--) {
            // Linear interpolation for realistic progress
            const progress = 1 - (i / months); // 0 (start) to 1 (now)
            const weight = p.history.startWeight + (p.history.currentWeight - p.history.startWeight) * progress;
            const bf = p.history.startBF + (p.history.currentBF - p.history.startBF) * progress;

            // Random fluctuation
            const randomFluctuation = (Math.random() - 0.5) * 0.5;

            const date = new Date();
            date.setMonth(date.getMonth() - i);

            assessments.push({
                client_id: client.id,
                coach_id: userId,
                date: date.toISOString().split('T')[0],
                weight: Number((weight + randomFluctuation).toFixed(1)),
                body_fat: Number((bf + randomFluctuation).toFixed(1)),
                muscle_mass: Number((weight * (1 - bf / 100) * 0.9).toFixed(1)), // Rough estimate
                visceral_fat: Math.floor(Math.random() * 5) + 1,
                notes: i === months ? 'Avaliação inicial' : i === 0 ? 'Avaliação atual' : 'Acompanhamento mensal'
            });
        }

        const { error: assessError } = await supabase
            .from('assessments')
            .insert(assessments);

        if (assessError) {
            console.error('Error seeding assessments for:', p.name, assessError);
        }
    }

    return createdCount;
};
