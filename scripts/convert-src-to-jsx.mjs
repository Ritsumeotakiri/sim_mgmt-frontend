import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

const files = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (/\.d\.ts$/i.test(entry.name)) continue;
    if (/\.(ts|tsx)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

function rewriteImportExtensions(code) {
  return code
    .replace(/(from\s+['"][^'"]+)\.tsx(['"])/g, '$1.jsx$2')
    .replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2')
    .replace(/(import\s*['"][^'"]+)\.tsx(['"])/g, '$1.jsx$2')
    .replace(/(import\s*['"][^'"]+)\.ts(['"])/g, '$1.js$2')
    .replace(/(import\(\s*['"][^'"]+)\.tsx(['"]\s*\))/g, '$1.jsx$2')
    .replace(/(import\(\s*['"][^'"]+)\.ts(['"]\s*\))/g, '$1.js$2');
}

walk(srcDir);

for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  const cleaned = rewriteImportExtensions(source);

  const output = ts.transpileModule(cleaned, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.Preserve,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      verbatimModuleSyntax: false,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      removeComments: false,
    },
    fileName: filePath,
    reportDiagnostics: false,
  }).outputText;

  const targetPath = ext === '.tsx'
    ? filePath.slice(0, -4) + '.jsx'
    : filePath.slice(0, -3) + '.js';

  fs.writeFileSync(targetPath, output, 'utf8');
  fs.unlinkSync(filePath);
}

console.log(`Converted ${files.length} files from TS/TSX to JS/JSX.`);
