import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist/assets');

const BUDGET = {
  maxInitialJS: 350 * 1024,
  maxChunkSize: 200 * 1024,
};

if (!fs.existsSync(distPath)) {
  console.error('❌ dist/assets directory not found. Run build first.');
  process.exit(1);
}

const files = fs.readdirSync(distPath);
const jsFiles = files.filter(f => f.endsWith('.js'));

let initialBundle = 0;
let violations = [];
let totalSize = 0;

console.log('\n📦 Bundle Size Report\n');
console.log('JavaScript Files:');
console.log('─────────────────────────────────────────────────');

jsFiles.forEach(file => {
  const size = fs.statSync(path.join(distPath, file)).size;
  totalSize += size;

  const sizeKB = (size / 1024).toFixed(2);
  console.log(`  ${file}: ${sizeKB} KB`);

  if (file.includes('index')) {
    initialBundle += size;
  }

  if (size > BUDGET.maxChunkSize) {
    violations.push(`${file}: ${sizeKB} KB exceeds ${(BUDGET.maxChunkSize / 1024).toFixed(0)} KB limit`);
  }
});

console.log('─────────────────────────────────────────────────');
console.log(`Total JS Size: ${(totalSize / 1024).toFixed(2)} KB\n`);

console.log('Initial Bundle Analysis:');
console.log(`  Size: ${(initialBundle / 1024).toFixed(2)} KB`);
console.log(`  Budget: ${(BUDGET.maxInitialJS / 1024).toFixed(0)} KB`);
console.log(`  Status: ${initialBundle <= BUDGET.maxInitialJS ? '✅ PASS' : '❌ FAIL'}\n`);

if (violations.length > 0) {
  console.warn('⚠️  Chunk Size Violations:\n');
  violations.forEach(v => console.warn(`  ${v}`));
  console.log('');
}

if (initialBundle > BUDGET.maxInitialJS) {
  console.error('❌ Initial bundle exceeds budget!');
  process.exit(1);
}

if (violations.length > 0) {
  console.warn('⚠️  Some chunks exceed size limits (non-blocking)');
}

console.log('✅ Bundle size check passed!\n');
