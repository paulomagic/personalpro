const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '🛡️  Iniciando Verificação de Segurança PersonalPro...');

let hasErrors = false;
const OPTIONAL_ENV_KEYS = new Set(['VITE_TURNSTILE_SITE_KEY', 'VITE_CAPTCHA_STRICT_MODE', 'VITE_AUTH_GUARD_STRICT_MODE']);

// 1. Verificar vulnerabilidades npm
console.log('\n📦 Verificando dependências (npm audit)...');
try {
    const auditOutput = execSync('npm audit --audit-level=high', {
        stdio: 'pipe',
        encoding: 'utf-8'
    });
    const cleanAuditOutput = String(auditOutput || '').replace(/^\s*undefined\s*$/gm, '').trim();
    if (cleanAuditOutput) process.stdout.write(`${cleanAuditOutput}\n`);
    console.log('\x1b[32m%s\x1b[0m', '✅ Nenhuma vulnerabilidade crítica encontrada.');
} catch (error) {
    const combinedOutput = `${error?.stdout || ''}\n${error?.stderr || ''}\n${error?.message || ''}`;
    const cleanCombinedOutput = combinedOutput.replace(/^\s*undefined\s*$/gm, '').trim();
    if (cleanCombinedOutput) process.stdout.write(`${cleanCombinedOutput}\n`);

    const isNetworkFailure = /(ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|network)/i.test(cleanCombinedOutput);
    if (isNetworkFailure) {
        console.warn('\x1b[33m%s\x1b[0m', '⚠️ npm audit indisponível por falha de rede. Pulando esta etapa sem bloquear.');
    } else {
        console.error('\x1b[31m%s\x1b[0m', '❌ Vulnerabilidades encontradas! Execute "npm audit fix" imediatamente.');
        hasErrors = true;
    }
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

    const missingRequiredKeys = missingKeys.filter((key) => !OPTIONAL_ENV_KEYS.has(key));
    const missingOptionalKeys = missingKeys.filter((key) => OPTIONAL_ENV_KEYS.has(key));

    if (missingRequiredKeys.length > 0) {
        console.error('\x1b[31m%s\x1b[0m', `❌ Variáveis obrigatórias faltando em .env.local: ${missingRequiredKeys.join(', ')}`);
        hasErrors = true;
    }

    if (missingOptionalKeys.length > 0) {
        console.warn('\x1b[33m%s\x1b[0m', `⚠️ Variáveis opcionais ausentes em .env.local: ${missingOptionalKeys.join(', ')}`);
    }

    if (missingRequiredKeys.length === 0 && missingOptionalKeys.length === 0) {
        console.log('\x1b[32m%s\x1b[0m', '✅ Todas as variáveis de ambiente necessárias estão presentes.');
    } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ Nenhuma variável obrigatória está faltando.');
    }

    try {
        const mode = fs.statSync(envLocalPath).mode & 0o777;
        const isRestricted = (mode & 0o077) === 0;
        if (!isRestricted) {
            console.warn('\x1b[33m%s\x1b[0m', '⚠️ .env.local está com permissões amplas. Recomendado: chmod 600 .env.local');
        } else {
            console.log('\x1b[32m%s\x1b[0m', '✅ Permissões de .env.local estão restritas (owner-only).');
        }
    } catch {
        console.warn('\x1b[33m%s\x1b[0m', '⚠️ Não foi possível validar permissões de .env.local.');
    }
} else {
    // Apenas aviso se não encontrar os arquivos, não falha o script (pois pode ser CI/CD)
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ Arquivos .env não encontrados para comparação completa ou em ambiente de CI.');
}

// 3. Secret scan em arquivos versionados
console.log('\n🔎 Executando varredura de segredos em arquivos versionados...');
try {
    execSync('node scripts/secret-scan.cjs', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
} catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Secret scan identificou risco de vazamento.');
    hasErrors = true;
}

// 4. Verificar arquivos críticos de segurança
console.log('\n📂 Verificando integridade estrutural...');
const criticalFiles = [
    'supabase/create_logs_tables.sql',
    'supabase/functions/auth-guard/index.ts',
    'supabase/migrations/20260227_add_edge_rate_limit_rpc.sql',
    'supabase/migrations/20260227_add_edge_rate_limit_cleanup.sql',
    'scripts/secret-scan.cjs',
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
