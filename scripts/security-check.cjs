const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '🛡️  Iniciando Verificação de Segurança PersonalPro...');

let hasErrors = false;

// 1. Verificar vulnerabilidades npm
console.log('\n📦 Verificando dependências (npm audit)...');
try {
    execSync('npm audit --audit-level=high', { stdio: 'inherit' });
    console.log('\x1b[32m%s\x1b[0m', '✅ Nenhuma vulnerabilidade crítica encontrada.');
} catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Vulnerabilidades encontradas! Execute "npm audit fix" imediatamente.');
    hasErrors = true;
}

// 2. Verificar Variáveis de Ambiente
console.log('\n🔑 Verificando variáveis de ambiente...');
const envExamplePath = path.join(__dirname, '../.env.example');
const envLocalPath = path.join(__dirname, '../.env.local');

// Helper para parsear .env manualmente
function parseEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(line => line.split('=')[0].trim());
    } catch (e) {
        return [];
    }
}

if (fs.existsSync(envExamplePath) && fs.existsSync(envLocalPath)) {
    const exampleKeys = parseEnv(envExamplePath);
    const localKeys = parseEnv(envLocalPath);

    // Filtrar chaves que estão no exemplo mas não no local
    const missingKeys = exampleKeys.filter(key => !localKeys.includes(key));

    if (missingKeys.length > 0) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Variáveis faltando em .env.local: ${missingKeys.join(', ')}`);
        hasErrors = true;
    } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ Todas as variáveis de ambiente necessárias estão presentes.');
    }
} else {
    // Apenas aviso se não encontrar os arquivos, não falha o script (pois pode ser CI/CD)
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ Arquivos .env não encontrados para comparação completa ou em ambiente de CI.');
}

// 3. Verificar arquivos críticos de segurança
console.log('\n📂 Verificando integridade estrutural...');
const criticalFiles = [
    'supabase/create_logs_tables.sql',
    'SECURITY_CHECKLIST.md',
    'vercel.json'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, `../${file}`))) {
        console.log(`✅ ${file} existe.`);
    } else {
        console.error('\x1b[31m%s\x1b[0m', `❌ Arquivo crítico ausente: ${file}`);
        hasErrors = true;
    }
});

console.log('\n-----------------------------------');
if (hasErrors) {
    console.error('\x1b[31m%s\x1b[0m', '⛔ A verificação de segurança falhou. Corrija os erros acima.');
    process.exit(1);
} else {
    console.log('\x1b[32m%s\x1b[0m', '🛡️  Sistema seguro! Nenhuma falha crítica detectada.');
    process.exit(0);
}
