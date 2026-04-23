/**
 * Pasos finales: regenerar schema, opcional npm install, migración init
 * fresca, git init + commit inicial.
 */
import { execa } from 'execa';
import { rm } from 'node:fs/promises';
import path from 'node:path';

export async function finalize({ projectDir, options }) {
  const appDir = path.join(projectDir, 'app');

  // 1. Borrar migraciones del template (el proyecto parte con historial limpio).
  await rm(path.join(appDir, 'prisma', 'migrations'), { recursive: true, force: true });

  // 2. Regenerar schema.prisma desde los fragmentos.
  //    Usa node directamente — no depende de npm deps instaladas.
  await execa('node', ['prisma/build-schema.mjs'], {
    cwd: appDir,
    stdio: 'inherit',
  });

  // 3. npm install (si el usuario lo pidió).
  if (options.runInstall) {
    await execa('npm', ['install'], { cwd: appDir, stdio: 'inherit', shell: true });
    // Generar Prisma Client.
    await execa('npx', ['prisma', 'generate'], { cwd: appDir, stdio: 'inherit', shell: true });
  }

  // 4. git init + commit inicial.
  await execa('git', ['init', '-b', 'main'], { cwd: projectDir, stdio: 'ignore' });
  await execa('git', ['add', '-A'], { cwd: projectDir, stdio: 'ignore' });
  await execa(
    'git',
    [
      'commit',
      '-m',
      `Initial commit (generated from erp-base-template ${options.templateTag})`,
    ],
    { cwd: projectDir, stdio: 'ignore' },
  );
}
