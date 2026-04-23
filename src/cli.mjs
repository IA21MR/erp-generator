#!/usr/bin/env node
/**
 * @ia21mr/create-erp — CLI entry point.
 *
 * Uso:
 *   create-erp [nombre-carpeta] [--version vX.Y.Z] [--no-install] [--yes]
 */
import * as p from '@clack/prompts';
import kleur from 'kleur';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { runWizard } from './prompts.mjs';
import { fetchTemplate } from './fetchTemplate.mjs';
import { pruneModules } from './prune.mjs';
import { rewriteConfig } from './rewrite.mjs';
import { finalize } from './finalize.mjs';

function parseArgs(argv) {
  const args = { positionals: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') args.flags.yes = true;
    else if (a === '--no-install') args.flags.noInstall = true;
    else if (a === '--version') args.flags.version = argv[++i];
    else if (a.startsWith('--version=')) args.flags.version = a.split('=')[1];
    else args.positionals.push(a);
  }
  return args;
}

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const projectName = positionals[0];

  let options;
  try {
    options = await runWizard({ projectName, defaults: flags.yes });
  } catch (e) {
    p.cancel(e.message || 'Cancelado');
    process.exit(1);
  }

  if (flags.version) options.templateTag = flags.version;
  if (flags.noInstall) options.runInstall = false;

  const projectDir = path.resolve(process.cwd(), options.projectName);
  if (existsSync(projectDir)) {
    p.cancel(`La carpeta ${projectDir} ya existe.`);
    process.exit(1);
  }

  const spin = p.spinner();

  try {
    spin.start(`Clonando template (${options.templateTag})...`);
    await fetchTemplate({ targetDir: projectDir, tag: options.templateTag });
    spin.stop('Template clonado.');

    spin.start('Podando módulos no seleccionados...');
    await pruneModules({ projectDir, activeModules: options.modules });
    spin.stop('Módulos podados.');

    spin.start('Reescribiendo configuración del proyecto...');
    await rewriteConfig({ projectDir, options });
    spin.stop('Configuración escrita.');

    spin.start('Regenerando schema + git init + commit inicial...');
    await finalize({ projectDir, options });
    spin.stop('Proyecto listo.');

    p.outro(
      kleur.green(`✓ Proyecto generado en ${projectDir}`) +
        `\n\nSiguientes pasos:\n` +
        `  ${kleur.cyan(`cd ${options.projectName}/app`)}\n` +
        (options.runInstall ? '' : `  ${kleur.cyan('npm install')}\n`) +
        `  ${kleur.cyan('npx prisma migrate dev --name init')}\n` +
        `  ${kleur.cyan('npm run prisma:seed')}\n` +
        `  ${kleur.cyan('npm run start:dev')}\n`,
    );
  } catch (e) {
    spin.stop(kleur.red('Error.'));
    console.error(e);
    process.exit(1);
  }
}

main();
