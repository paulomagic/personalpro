import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yuohwenofctcxdgqgtoo.supabase.co';
const supabaseKey = 'sb_publishable_dH7seEcJnPHzrzkaz1mfGQ_wsg1AVUS';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTokenUsage() {
  console.log('📊 Consultando uso de tokens...\n');
  
  // Últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Query agregada
  const { data: summary, error: summaryError } = await supabase
    .from('ai_logs')
    .select('tokens_input, tokens_output, created_at')
    .eq('action_type', 'training_intent')
    .gte('created_at', sevenDaysAgo.toISOString());
  
  if (summaryError) {
    console.error('Erro:', summaryError);
    return;
  }
  
  if (!summary || summary.length === 0) {
    console.log('❌ Nenhuma chamada de IA encontrada nos últimos 7 dias');
    return;
  }
  
  // Calcular estatísticas
  const totalCalls = summary.length;
  const totalInput = summary.reduce((sum, log) => sum + (log.tokens_input || 0), 0);
  const totalOutput = summary.reduce((sum, log) => sum + (log.tokens_output || 0), 0);
  const totalTokens = totalInput + totalOutput;
  const avgInput = totalInput / totalCalls;
  const avgOutput = totalOutput / totalCalls;
  const avgTotal = totalTokens / totalCalls;
  
  // Calcular custo (Groq pricing)
  const inputCost = (totalInput / 1000000) * 0.59;
  const outputCost = (totalOutput / 1000000) * 0.79;
  const totalCost = inputCost + outputCost;
  const totalCostBRL = totalCost * 5.80; // Conversão aproximada
  
  console.log('=== RESUMO GERAL (Últimos 7 dias) ===');
  console.log(`Total de chamadas: ${totalCalls}`);
  console.log(`\n📥 INPUT:`);
  console.log(`  Total: ${totalInput.toLocaleString()} tokens`);
  console.log(`  Média: ${Math.round(avgInput).toLocaleString()} tokens/chamada`);
  console.log(`\n📤 OUTPUT:`);
  console.log(`  Total: ${totalOutput.toLocaleString()} tokens`);
  console.log(`  Média: ${Math.round(avgOutput).toLocaleString()} tokens/chamada`);
  console.log(`\n📊 TOTAL:`);
  console.log(`  Total: ${totalTokens.toLocaleString()} tokens`);
  console.log(`  Média: ${Math.round(avgTotal).toLocaleString()} tokens/chamada`);
  console.log(`\n💰 CUSTO ESTIMADO (Groq):`);
  console.log(`  USD: $${totalCost.toFixed(4)}`);
  console.log(`  BRL: R$ ${totalCostBRL.toFixed(2)}`);
  
  // Últimas 10 chamadas
  const { data: recent, error: recentError } = await supabase
    .from('ai_logs')
    .select('created_at, tokens_input, tokens_output, latency_ms, success, metadata')
    .eq('action_type', 'training_intent')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!recentError && recent && recent.length > 0) {
    console.log('\n\n=== ÚLTIMAS 10 CHAMADAS ===');
    recent.forEach((log, i) => {
      const total = (log.tokens_input || 0) + (log.tokens_output || 0);
      const date = new Date(log.created_at).toLocaleString('pt-BR');
      const status = log.success ? '✅' : '❌';
      console.log(`${i + 1}. ${status} ${date}`);
      console.log(`   Input: ${log.tokens_input || 0} | Output: ${log.tokens_output || 0} | Total: ${total}`);
      console.log(`   Latência: ${log.latency_ms}ms`);
    });
  }
}

checkTokenUsage().catch(console.error);
