import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://yuohwenofctcxdgqgtoo.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_dH7seEcJnPHzrzkaz1mfGQ_wsg1AVUS'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function replaceStudents() {
    console.log('🔄 Substituindo alunos João Maratonista e Patrícia Lima...\n')

    try {
        // 1. Atualizar Patrícia Lima → Ana Soares
        console.log('📝 Atualizando Patrícia Lima → Ana Soares...')
        const { data: patricia, error: patriciError } = await supabase
            .from('clients')
            .update({
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
                weight: 57,
            })
            .eq('name', 'Patrícia Lima')
            .select()

        if (patriciError) throw patriciError
        console.log('✅ Ana Soares criada com sucesso!\n')

        // 2. Atualizar João Maratonista → Carlos Mendes
        console.log('📝 Atualizando João Maratonista → Carlos Mendes...')
        const { data: joao, error: joaoError } = await supabase
            .from('clients')
            .update({
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
                weight: 70,
            })
            .eq('name', 'João Maratonista')
            .select()

        if (joaoError) throw joaoError
        console.log('✅ Carlos Mendes criado com sucesso!\n')

        // 3. Verificar os novos alunos
        console.log('🔍 Verificando novos perfis...')
        const { data: newStudents, error: verifyError } = await supabase
            .from('clients')
            .select('name, age, goal, level, injuries, adherence')
            .in('name', ['Ana Soares', 'Carlos Mendes'])
            .order('name')

        if (verifyError) throw verifyError

        console.log('\n✅ Substituição concluída com sucesso!')
        console.log('\n📊 Novos perfis:')
        console.table(newStudents)

    } catch (error) {
        console.error('❌ Erro ao substituir alunos:', error)
        process.exit(1)
    }
}

replaceStudents()
