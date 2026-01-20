import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://yuohwenofctxcdqggtoo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b2h3ZW5vZmN0eGNkcWdndG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxODg3MDIsImV4cCI6MjA1MTc2NDcwMn0.RHmCBGH9pK8l_eXaUtZIRQ4TgE43aJ0vt2l-RwrAWkY'
);

console.log('🔍 Verificando dados de Ana Soares...\n');

const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('name', 'Ana Soares');

if (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
}

if (!clients || clients.length === 0) {
    console.log('⚠️  Ana Soares não encontrada no banco!');
    console.log('\n💡 Você executou o SQL COLAR_NO_SUPABASE.sql?');
    process.exit(0);
}

const ana = clients[0];

console.log('📊 Dados de Ana Soares:');
console.log('------------------------');
console.log('Nome:', ana.name);
console.log('Goal:', ana.goal);
console.log('Level:', ana.level);
console.log('Age:', ana.age || '❌ CAMPO VAZIO');
console.log('Observações:', ana.observations);
console.log('Lesões:', ana.injuries);
console.log('\n✅ Verificação completa!');

if (!ana.age) {
    console.log('\n⚠️  PROBLEMA ENCONTRADO: Campo age está vazio!');
    console.log('📝 Solução: Execute o SQL COLAR_NO_SUPABASE.sql para popular com idade correta.');
} else if (ana.age >= 60) {
    console.log(`\n✅ Ana tem ${ana.age} anos - deveria receber template Senior!`);
}
