const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TARGET_DIRS = ['App.tsx', 'index.tsx', 'components', 'views', 'services'];
const PATTERN = /style=\{\{?|document\.body\.style\./g;

function walk(targetPath, files = []) {
  if (!fs.existsSync(targetPath)) return files;
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    files.push(targetPath);
    return files;
  }
  for (const entry of fs.readdirSync(targetPath)) {
    walk(path.join(targetPath, entry), files);
  }
  return files;
}

const allFiles = TARGET_DIRS.flatMap((target) => walk(path.join(ROOT, target)));
const hits = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matchCount = (content.match(PATTERN) || []).length;
  if (matchCount > 0) {
    hits.push({
      file: path.relative(ROOT, file),
      count: matchCount
    });
  }
}

hits.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));

const total = hits.reduce((sum, item) => sum + item.count, 0);
console.log(`[inline-style-audit] files=${hits.length} total=${total}`);
hits.slice(0, 50).forEach((item) => {
  console.log(`${String(item.count).padStart(3, ' ')}  ${item.file}`);
});
