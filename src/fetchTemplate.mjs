/**
 * Descarga el template desde GitHub en un tag específico.
 */
import { execa } from 'execa';
import { rm } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_REPO = 'https://github.com/IA21MR/erp-base-template.git';

export async function fetchTemplate({ targetDir, tag = 'v0.3.0', repo = DEFAULT_REPO }) {
  // git clone --depth=1 --branch <tag> <repo> <targetDir>
  await execa('git', ['clone', '--depth=1', '--branch', tag, repo, targetDir], {
    stdio: 'ignore',
  });
  // Borrar metadata de git del template (el proyecto generado tendrá historia propia).
  await rm(path.join(targetDir, '.git'), { recursive: true, force: true });
}
