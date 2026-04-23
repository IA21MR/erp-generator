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
      path.join(projectDir, 'app', 'src', 'modules', mod),
      path.join(projectDir, 'app', 'prisma', 'fragments', `${mod}.prisma`),
      path.join(projectDir, 'app', 'prisma', 'permissions', `${mod}.mjs`),
      path.join(projectDir, 'app', 'prisma', 'seeds', `${mod}.seed.mjs`),
      path.join(projectDir, 'app', 'test', `${mod}.e2e-spec.ts`),
    ];
    for (const t of targets) {
      await rm(t, { recursive: true, force: true });
    }
  }
}
