/**
 * Elimina archivos de módulos opcionales no seleccionados.
 * (ModuleCatalog.ts y permissions.mjs se regeneran en rewrite.mjs.)
 */
import { rm } from 'node:fs/promises';
import path from 'node:path';

const ALL_OPTIONAL = ['organizations', 'contacts'];

export async function pruneModules({ projectDir, activeModules }) {
  const inactive = ALL_OPTIONAL.filter((m) => !activeModules.includes(m));

  for (const mod of inactive) {
    const targets = [
      // Backend
      path.join(projectDir, 'app', 'src', 'modules', mod),
      path.join(projectDir, 'app', 'prisma', 'fragments', `${mod}.prisma`),
      path.join(projectDir, 'app', 'prisma', 'permissions', `${mod}.mjs`),
      path.join(projectDir, 'app', 'prisma', 'seeds', `${mod}.seed.mjs`),
      path.join(projectDir, 'app', 'test', `${mod}.e2e-spec.ts`),
      // Frontend
      path.join(projectDir, 'web', 'src', 'modules', mod),
      path.join(projectDir, 'web', 'src', 'app', '(dashboard)', mod),
    ];
    for (const t of targets) {
      await rm(t, { recursive: true, force: true });
    }
  }

  // Poda específica para core-only (sin organizations):
  // los guards/middleware/migración FK son responsabilidad del provider
  // de tenant (módulo organizations). Sin él, deben removerse.
  if (!activeModules.includes('organizations')) {
    const orgProviderArtifacts = [
      path.join(projectDir, 'app', 'src', 'shared', 'infrastructure', 'guards', 'OrganizationContextGuard.ts'),
      path.join(projectDir, 'app', 'src', 'shared', 'infrastructure', 'guards', 'ModuleGuard.ts'),
      path.join(projectDir, 'app', 'src', 'shared', 'infrastructure', 'http', 'OrganizationContextMiddleware.ts'),
      // La migración que enlaza User <-> Organization se borra; el schema
      // sin organizations no la necesita y se regenera vía build-schema.
      path.join(projectDir, 'app', 'prisma', 'migrations', '20260422220000_add_user_organization_id'),
    ];
    for (const t of orgProviderArtifacts) {
      await rm(t, { recursive: true, force: true });
    }
  }

  // El test unit del plugin-system valida el catálogo completo del template;
  // no tiene sentido en proyectos generados.
  await rm(
    path.join(
      projectDir,
      'app',
      'src',
      'shared',
      'plugin-system',
      '__tests__',
    ),
    { recursive: true, force: true },
  );
}
