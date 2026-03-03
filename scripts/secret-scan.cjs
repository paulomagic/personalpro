const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = new Set(process.argv.slice(2));
const scanStaged = args.has('--staged');

const root = path.resolve(__dirname, '..');

const TEXT_FILE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.yml', '.yaml', '.toml', '.ini',
  '.env', '.md', '.txt', '.sql', '.sh', '.bash',
  '.html', '.css', '.scss'
]);

const IGNORED_PATH_FRAGMENTS = [
  'node_modules/',
  'dist/',
  '.tmp-tests/',
  '.git/',
  '.next/',
  'coverage/'
];

const SENSITIVE_ENV_KEY_ASSIGNMENTS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'STRIPE_SECRET_KEY',
  'JWT_SECRET',
  'SESSION_SECRET',
  'PRIVATE_KEY',
  'DATABASE_URL'
];

const PLACEHOLDER_MARKERS = [
  'your_',
  'example',
  'changeme',
  'replace_me',
  'placeholder',
  '<',
  '...'
];

const secretPatterns = [
  {
    id: 'PRIVATE_KEY_BLOCK',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
    description: 'Bloco de chave privada encontrado'
  },
  {
    id: 'AWS_ACCESS_KEY',
    regex: /\bAKIA[0-9A-Z]{16}\b/,
    description: 'Possível AWS Access Key'
  },
  {
    id: 'STRIPE_LIVE_KEY',
    regex: /\bsk_live_[0-9a-zA-Z]{16,}\b/,
    description: 'Possível Stripe live secret key'
  },
  {
    id: 'SLACK_BOT_TOKEN',
    regex: /\bxoxb-[0-9A-Za-z-]{24,}\b/,
    description: 'Possível Slack bot token'
  }
];

function run(command) {
  return String(execSync(command, { encoding: 'utf-8' } || '')).trim();
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function shouldScanFile(filePath) {
  const normalized = normalizePath(filePath);
  if (!normalized) return false;
  if (IGNORED_PATH_FRAGMENTS.some((fragment) => normalized.includes(fragment))) return false;

  const base = path.basename(normalized);
  if (base === '.env' || base.startsWith('.env.')) return true;

  const ext = path.extname(base).toLowerCase();
  return TEXT_FILE_EXTENSIONS.has(ext);
}

function listCandidateFiles() {
  const command = scanStaged
    ? 'git diff --cached --name-only --diff-filter=ACMRTUXB'
    : 'git ls-files';

  const raw = run(command);
  if (!raw) return [];

  return raw
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(shouldScanFile)
    .filter((item) => fs.existsSync(path.join(root, item)));
}

function isLikelyPlaceholder(value) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker));
}

function findEnvAssignmentSecret(line) {
  const assignment = line.match(/^\s*(?:export\s+)?([A-Z0-9_]{4,})\s*=\s*(.+?)\s*$/);
  if (!assignment) return null;

  const key = assignment[1];
  const rawValue = assignment[2].replace(/^['"]|['"]$/g, '').trim();
  const isSensitiveKey = SENSITIVE_ENV_KEY_ASSIGNMENTS.includes(key);

  if (!isSensitiveKey) return null;
  if (isLikelyPlaceholder(rawValue)) return null;
  if (rawValue.length < 16) return null;

  return `Chave sensível definida (${key})`;
}

function isLikelyFalsePositive(line) {
  const normalized = line.toLowerCase();
  return normalized.includes('example') || normalized.includes('exemplo');
}

function scanFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  const base = path.basename(relativePath);
  if (base === '.env' || base === '.env.local') {
    findings.push({
      file: relativePath,
      line: 1,
      reason: `Arquivo sensível (${base}) não deve ser versionado`
    });
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const envReason = findEnvAssignmentSecret(line);
    if (envReason) {
      findings.push({ file: relativePath, line: lineNumber, reason: envReason });
      return;
    }

    if (isLikelyFalsePositive(line)) return;

    for (const pattern of secretPatterns) {
      if (pattern.regex.test(line)) {
        findings.push({ file: relativePath, line: lineNumber, reason: pattern.description });
      }
    }
  });

  return findings;
}

function main() {
  const candidates = listCandidateFiles();
  if (candidates.length === 0) {
    console.log('✅ Secret scan: nenhum arquivo elegível para varredura.');
    return;
  }

  const findings = candidates.flatMap(scanFile);
  if (findings.length === 0) {
    console.log(`✅ Secret scan: ${candidates.length} arquivos verificados, sem vazamentos evidentes.`);
    return;
  }

  console.error('❌ Secret scan encontrou potenciais segredos versionáveis:');
  findings.forEach((item) => {
    console.error(`- ${item.file}:${item.line} -> ${item.reason}`);
  });
  console.error('\nCorrija/rotacione os segredos antes de prosseguir.');
  process.exit(1);
}

main();
