/**
 * Reescribe archivos específicos del proyecto con los valores del wizard.
 *
 *  - app/src/modules.config.ts  (ACTIVE_MODULES)
 *  - app/src/shared/plugin-system/application/ModuleCatalog.ts
 *  - app/prisma/permissions.mjs  (regenerada)
 *  - app/prisma/schema.prisma    (regenerada vía build-schema.mjs en finalize)
 *  - app/.env
 *  - app/package.json            (name)
 *  - README.md                   (productName)
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CORE_MODULES = ['auth', 'users'];
const ALL_OPTIONAL = ['organizations', 'contacts'];

export async function rewriteConfig({ projectDir, options }) {
  const { modules, productName, projectName, db, ports, jwtSecret, jwtRefreshSecret } = options;
  const appDir = path.join(projectDir, 'app');

  // 1. modules.config.ts
  const modulesConfig = `/**
 * Configuración de módulos activos para este proyecto.
 * Generada por @ia21mr/create-erp.
 */
export const ACTIVE_MODULES: ReadonlyArray<string> = [
${modules.map((m) => `  '${m}',`).join('\n')}
];
`;
  await writeFile(path.join(appDir, 'src', 'modules.config.ts'), modulesConfig, 'utf8');

  // 2. ModuleCatalog.ts — solo manifests de core + módulos activos
  const allActive = [...CORE_MODULES, ...modules];
  const imports = allActive.map((m) => {
    const pascal = m.charAt(0).toUpperCase() + m.slice(1);
    return `import { ${pascal}Manifest } from '../../../modules/${m}/${m}.manifest';`;
  });
  const catalog = `// Catálogo de módulos disponibles en ESTE proyecto.
// Generado por @ia21mr/create-erp.
import { ModuleManifest } from '../domain/ModuleManifest';
${imports.join('\n')}

export const MODULE_CATALOG: ReadonlyArray<ModuleManifest> = [
${allActive.map((m) => `  ${m.charAt(0).toUpperCase() + m.slice(1)}Manifest,`).join('\n')}
];

export function getManifest(name: string): ModuleManifest {
  const m = MODULE_CATALOG.find((x) => x.name === name);
  if (!m) {
    throw new Error(\`ModuleManifest no encontrado: "\${name}"\`);
  }
  return m;
}
`;
  await writeFile(
    path.join(appDir, 'src', 'shared', 'plugin-system', 'application', 'ModuleCatalog.ts'),
    catalog,
    'utf8',
  );

  // 3. permissions.mjs — solo los módulos activos
  const permLines = ['// Generado por @ia21mr/create-erp.'];
  permLines.push("import { CORE_PERMISSIONS } from './permissions/core.mjs';");
  for (const m of modules) {
    const upper = m.toUpperCase();
    permLines.push(`import { ${upper}_PERMISSIONS } from './permissions/${m}.mjs';`);
  }
  permLines.push('');
  permLines.push("export { CORE_PERMISSIONS } from './permissions/core.mjs';");
  for (const m of modules) {
    const upper = m.toUpperCase();
    permLines.push(`export { ${upper}_PERMISSIONS } from './permissions/${m}.mjs';`);
  }
  permLines.push('');
  permLines.push('// Alias heredados.');
  permLines.push('export const USER_PERMISSIONS = CORE_PERMISSIONS.slice(0, 7);');
  permLines.push('export const ROLE_PERMISSIONS = CORE_PERMISSIONS.slice(7);');
  if (modules.includes('organizations')) {
    permLines.push('export const ORGANIZATION_PERMISSIONS = ORGANIZATIONS_PERMISSIONS;');
  }
  if (modules.includes('contacts')) {
    permLines.push('export const CONTACT_PERMISSIONS = CONTACTS_PERMISSIONS;');
  }
  permLines.push('');
  const allSpread = ['CORE_PERMISSIONS', ...modules.map((m) => `${m.toUpperCase()}_PERMISSIONS`)]
    .map((n) => `  ...${n},`)
    .join('\n');
  permLines.push(`export const ALL_PERMISSIONS = [\n${allSpread}\n];`);
  permLines.push('');
  await writeFile(path.join(appDir, 'prisma', 'permissions.mjs'), permLines.join('\n'), 'utf8');

  // 4. .env
  const dbUrl = `postgresql://${db.user}:${db.password}@localhost:${db.port}/${db.name}?schema=public`;
  const env = `# Database
POSTGRES_USER=${db.user}
POSTGRES_PASSWORD=${db.password}
POSTGRES_DB=${db.name}
DATABASE_URL="${dbUrl}"

# App
PORT=${ports.app}
NODE_ENV=development

# JWT
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# Auth policy
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15
RESET_CODE_TTL_MINUTES=15

# Rate limit
RATE_LIMIT_MAX=100
RATE_LIMIT_TTL=60000

# CORS
CORS_ORIGINS=http://localhost:${ports.web}
`;
  await writeFile(path.join(appDir, '.env'), env, 'utf8');

  // 5. app/package.json — name
  const pkgAppPath = path.join(appDir, 'package.json');
  const pkgApp = JSON.parse(await readFile(pkgAppPath, 'utf8'));
  pkgApp.name = `${projectName}-api`;
  pkgApp.description = `API backend para ${productName}`;
  await writeFile(pkgAppPath, JSON.stringify(pkgApp, null, 2) + '\n', 'utf8');

  // 6. README.md raíz
  const readmePath = path.join(projectDir, 'README.md');
  const readme = `# ${productName}

Proyecto ERP generado con [\`@ia21mr/create-erp\`](https://github.com/IA21MR/erp-generator).

## Módulos activos

- core: auth, users
${modules.length ? `- opcionales: ${modules.join(', ')}` : '- (solo core)'}

## Puesta en marcha

\`\`\`bash
cd app
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
\`\`\`

Credenciales admin sembradas: \`admin@sotek.com\` / \`admin123\` (cambiar en producción).

Puerto backend: ${ports.app}
Puerto frontend: ${ports.web}
`;
  await writeFile(readmePath, readme, 'utf8');
}
