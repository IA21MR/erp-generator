#!/usr/bin/env node
/**
 * Script de test no-interactivo: genera un proyecto con opciones arbitrarias,
 * saltando el wizard. Útil para CI y pruebas rápidas.
 *
 * Uso:
 *   node scripts/test-generate.mjs <projectDir> <modules csv> [--install]
 *
 * Ejemplo:
 *   node scripts/test-generate.mjs C:/tmp/demo-core ""
 *   node scripts/test-generate.mjs C:/tmp/demo-full "organizations,contacts" --install
 */
import path from 'node:path';
import { existsSync, rmSync } from 'node:fs';
import { fetchTemplate } from '../src/fetchTemplate.mjs';
import { pruneModules } from '../src/prune.mjs';
import { rewriteConfig } from '../src/rewrite.mjs';
import { finalize } from '../src/finalize.mjs';
import { randomBytes } from 'node:crypto';

const [, , projectDirArg, modulesArg, installFlag] = process.argv;
if (!projectDirArg) {
  console.error('Uso: node scripts/test-generate.mjs <projectDir> <modules csv> [--install]');
  process.exit(1);
}

const projectDir = path.resolve(projectDirArg);
const modules = (modulesArg || '').split(',').map((s) => s.trim()).filter(Boolean);
const runInstall = installFlag === '--install';
const projectName = path.basename(projectDir);

if (existsSync(projectDir)) rmSync(projectDir, { recursive: true, force: true });

const options = {
  projectName,
  productName: projectName,
  modules,
  db: { name: `${projectName.replace(/-/g, '_')}_dev`, port: 5433, user: 'erp', password: 'erp123' },
  ports: { app: 3000, web: 3001 },
  jwtSecret: randomBytes(48).toString('base64url'),
  jwtRefreshSecret: randomBytes(48).toString('base64url'),
  runInstall,
  templateTag: 'v0.1.0',
};

console.log(`→ Generando ${projectDir} con modules=[${modules.join(',') || '(core only)'}]`);
await fetchTemplate({ targetDir: projectDir, tag: options.templateTag });
await pruneModules({ projectDir, activeModules: options.modules });
await rewriteConfig({ projectDir, options });
await finalize({ projectDir, options });
console.log('✓ Listo');
