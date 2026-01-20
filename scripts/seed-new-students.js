import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuohwenofctcxdgqgtoo.supabase.co'
const supabaseKey = 'sb_publishable_dH7seEcJnPHzrzkaz1mfGQ_wsg1AVUS'

const supabase = createClient(supabaseUrl, supabaseKey)

// Pegar o user_id do coach (você precisa estar logado ou usar um ID fixo)
async function seedWithNewProfiles() {
    console.log('🌱 Fazendo seed do banco com os novos perfis...\n')

    // Primeiro, verificar se há um usuário logado
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        console.log('⚠️  Nenhum usuário logado. Você precisa rodar isso pela interface do app ou fornecer um coach_id.')
        console.log('👉 Alternativa: Faça login no app e clique no botão "Seed Database" na tela de Alunos.')
        return
    }

    const coachId = user.id
    console.log(`👤 Coach ID: ${coachId}\n`)

    // Criar apenas Ana Soares e Carlos Mendes como exemplo
    const newStudents = [
        {
            coach_id: coachId,
            name: 'Ana Soares',
            age: 70,
            goal: 'Saúde e Mobilidade',
            level: 'Iniciante',
            status: 'active',
            adherence: 95,
            observations: 'Idosa ativa de 70 anos. Sem lesões ou limitações graves. Foco em longevidade, força funcional e manutenção da qualidade de vida.',
            injuries: 'Nenhuma.',
            preferences: 'Gosta de exercícios com peso corporal e elásticos. Prefere treinos pela manhã.',
            avatar_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
            email: 'ana.soares@exemplo.com',
            phone: '(11) 99999-9999',
            height: 1.60,
            weight: 57,
        },
        {
            coach_id: coachId,
            name: 'Carlos Mendes',
            age: 72,
            goal: 'Saúde e Mobilidade',
            level: 'Iniciante',
            status: 'active',
            adherence: 85,
            observations: 'Idoso de 72 anos com artrose de quadril bilateral. Foco em manter mobilidade articular e prevenir atrofia muscular. Evitar impactos e amplitudes extremas.',
            injuries: 'Artrose de quadril bilateral (grau 2), Rigidez matinal.',
            preferences: 'Prefere exercícios na água ou sentado. Não gosta de agachamentos profundos.',
            avatar_url: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
            email: 'carlos.mendes@exemplo.com',
            phone: '(11) 99999-8888',
            height: 1.72,
            weight: 70,
        }
    ]

    const { data, error } = await supabase
        .from('clients')
        .insert(newStudents)
        .select()

    if (error) {
        console.error('❌ Erro ao inserir alunos:', error)
        return
    }

    console.log('✅ Alunos criados com sucesso!')
    console.table(data.map(d => ({ nome: d.name, idade: d.age, objetivo: d.goal, lesões: d.injuries })))
}

seedWithNewProfiles()
