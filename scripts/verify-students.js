import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuohwenofctcxdgqgtoo.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseKey) {
    console.error('❌ SUPABASE_ANON_KEY não configurada no ambiente')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyStudents() {
    console.log('🔍 Verificando todos os alunos no banco...\n')

    const { data: allStudents, error } = await supabase
        .from('clients')
        .select('name, age, goal, injuries')
        .order('name')

    if (error) {
        console.error('❌ Erro:', error)
        return
    }

    console.log(`📊 Total de alunos: ${allStudents.length}\n`)
    console.table(allStudents)

    // Verificar especificamente os novos
    const ana = allStudents.find(s => s.name === 'Ana Soares')
    const carlos = allStudents.find(s => s.name === 'Carlos Mendes')
    const joao = allStudents.find(s => s.name === 'João Maratonista')
    const patricia = allStudents.find(s => s.name === 'Patrícia Lima')

    console.log('\n🎯 Status:')
    console.log(ana ? '✅ Ana Soares encontrada' : '❌ Ana Soares NÃO encontrada')
    console.log(carlos ? '✅ Carlos Mendes encontrado' : '❌ Carlos Mendes NÃO encontrado')
    console.log(joao ? '⚠️  João Maratonista ainda existe (deveria ter sido substituído)' : '✅ João Maratonista removido')
    console.log(patricia ? '⚠️  Patrícia Lima ainda existe (deveria ter sido substituída)' : '✅ Patrícia Lima removida')
}

verifyStudents()
