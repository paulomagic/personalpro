import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuohwenofctcxdgqgtoo.supabase.co'
const supabaseKey = 'sb_publishable_dH7seEcJnPHzrzkaz1mfGQ_wsg1AVUS'

const supabase = createClient(supabaseUrl, supabaseKey)

async function forceReplace() {
    console.log('🔄 Deletando João Maratonista e Patrícia Lima...\n')

    try {
        // 1. Pegar os IDs dos alunos a serem removidos (para deletar assessments também)
        const { data: toDelete, error: fetchError } = await supabase
            .from('clients')
            .select('id, name, coach_id')
            .in('name', ['João Maratonista', 'Patrícia Lima'])

        if (fetchError) throw fetchError

        if (!toDelete || toDelete.length === 0) {
            console.log('⚠️  João e Patrícia não encontrados. Talvez já foram removidos.')
            return
        }

        console.log(`✅ Encontrados ${toDelete.length} alunos para remover`)
        const coachId = toDelete[0].coach_id

        // 2. Deletar assessments primeiro (foreign key)
        for (const client of toDelete) {
            const { error: assessError } = await supabase
                .from('assessments')
                .delete()
                .eq('client_id', client.id)

            if (assessError) console.error(`Erro ao deletar assessments de ${client.name}:`, assessError)
            else console.log(`  ✅ Assessments de ${client.name} deletados`)
        }

        // 3. Deletar os clients
        const { error: deleteError } = await supabase
            .from('clients')
            .delete()
            .in('name', ['João Maratonista', 'Patrícia Lima'])

        if (deleteError) throw deleteError
        console.log('✅ João Maratonista e Patrícia Lima removidos!\n')

        // 4. Inserir Ana Soares e Carlos Mendes
        console.log('📝 Inserindo Ana Soares e Carlos Mendes...\n')

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

        const { data: inserted, error: insertError } = await supabase
            .from('clients')
            .insert(newStudents)
            .select()

        if (insertError) throw insertError

        console.log('✅ Novos alunos inseridos com sucesso!\n')

        // 5. Criar assessments para os novos alunos
        console.log('📊 Criando histórico de assessments...\n')

        for (const client of inserted) {
            const assessments = []
            const months = 6
            const history = client.name === 'Ana Soares'
                ? { startWeight: 58, currentWeight: 57, startBF: 26, currentBF: 24 }
                : { startWeight: 72, currentWeight: 70, startBF: 22, currentBF: 20 }

            for (let i = months; i >= 0; i--) {
                const progress = 1 - (i / months)
                const weight = history.startWeight + (history.currentWeight - history.startWeight) * progress
                const bf = history.startBF + (history.currentBF - history.startBF) * progress
                const randomFluctuation = (Math.random() - 0.5) * 0.5

                const date = new Date()
                date.setMonth(date.getMonth() - i)

                assessments.push({
                    client_id: client.id,
                    coach_id: coachId,
                    date: date.toISOString().split('T')[0],
                    weight: Number((weight + randomFluctuation).toFixed(1)),
                    body_fat: Number((bf + randomFluctuation).toFixed(1)),
                    muscle_mass: Number((weight * (1 - bf / 100) * 0.9).toFixed(1)),
                    visceral_fat: Math.floor(Math.random() * 5) + 1,
                    notes: i === months ? 'Avaliação inicial' : i === 0 ? 'Avaliação atual' : 'Acompanhamento mensal'
                })
            }

            const { error: assessError } = await supabase
                .from('assessments')
                .insert(assessments)

            if (assessError) {
                console.error(`Erro ao criar assessments para ${client.name}:`, assessError)
            } else {
                console.log(`  ✅ ${assessments.length} assessments criados para ${client.name}`)
            }
        }

        console.log('\n🎉 Substituição concluída com sucesso!')
        console.log('\n📊 Novos alunos:')
        console.table(inserted.map(c => ({
            nome: c.name,
            idade: c.age,
            objetivo: c.goal,
            lesões: c.injuries,
            aderência: c.adherence + '%'
        })))

    } catch (error) {
        console.error('❌ Erro:', error)
        process.exit(1)
    }
}

forceReplace()
