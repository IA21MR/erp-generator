/**
 * Preguntas interactivas del wizard.
 */
import * as p from '@clack/prompts';
import { randomBytes } from 'node:crypto';

const OPTIONAL_MODULES = [
  { value: 'organizations', label: 'organizations', hint: '[siempre activo en v0.1.0] multi-tenant + branding' },
  { value: 'contacts', label: 'contacts', hint: 'Gestión de clientes, proveedores, empleados' },
];

function randomSecret(bytes = 48) {
  return randomBytes(bytes).toString('base64url');
}

export async function runWizard({ projectName, defaults = false } = {}) {
  p.intro('🧩  create-erp — generador de ERP white-label');

  const name = projectName ?? (await p.text({
    message: '¿Nombre de la carpeta del proyecto?',
    placeholder: 'mi-cliente',
    validate: (v) => {
      if (!v) return 'Requerido';
      if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) return 'Usa kebab-case (minúsculas, guiones)';
    },
  }));
  if (p.isCancel(name)) throw new Error('Cancelado');

  if (defaults) {
    return {
      projectName: name,
      productName: name,
      modules: ['organizations', 'contacts'],
      db: { name: `${name.replace(/-/g, '_')}_dev`, port: 5433, user: 'erp', password: 'erp123' },
      ports: { app: 3000, web: 3001 },
      jwtSecret: randomSecret(),
      jwtRefreshSecret: randomSecret(),
      runInstall: true,
      templateTag: 'v0.2.0',
    };
  }

  const productName = await p.text({
    message: 'Nombre del producto (display):',
    placeholder: name,
    defaultValue: name,
  });
  if (p.isCancel(productName)) throw new Error('Cancelado');

  const modules = await p.multiselect({
    message: 'Módulos opcionales a activar (core incluye auth + users + organizations):',
    options: OPTIONAL_MODULES,
    required: false,
    initialValues: ['contacts'],
  });
  if (p.isCancel(modules)) throw new Error('Cancelado');
  // v0.1.0: organizations es obligatorio (users tiene acoplamiento duro con
  // OrganizationId). Se fuerza si no fue seleccionado.
  const modulesWithOrg = Array.from(new Set(['organizations', ...modules]));

  const dbName = await p.text({
    message: 'Nombre de la base de datos (dev):',
    defaultValue: `${name.replace(/-/g, '_')}_dev`,
    placeholder: `${name.replace(/-/g, '_')}_dev`,
  });
  if (p.isCancel(dbName)) throw new Error('Cancelado');

  const dbPort = await p.text({
    message: 'Puerto PostgreSQL:',
    defaultValue: '5433',
    placeholder: '5433',
    validate: (v) => (/^\d+$/.test(v) ? undefined : 'Número'),
  });
  if (p.isCancel(dbPort)) throw new Error('Cancelado');

  const dbUser = await p.text({
    message: 'Usuario PostgreSQL:',
    defaultValue: 'erp',
    placeholder: 'erp',
  });
  if (p.isCancel(dbUser)) throw new Error('Cancelado');

  const dbPassword = await p.text({
    message: 'Password PostgreSQL:',
    defaultValue: 'erp123',
    placeholder: 'erp123',
  });
  if (p.isCancel(dbPassword)) throw new Error('Cancelado');

  const appPort = await p.text({
    message: 'Puerto del backend:',
    defaultValue: '3000',
    placeholder: '3000',
    validate: (v) => (/^\d+$/.test(v) ? undefined : 'Número'),
  });
  if (p.isCancel(appPort)) throw new Error('Cancelado');

  const webPort = await p.text({
    message: 'Puerto del frontend:',
    defaultValue: '3001',
    placeholder: '3001',
    validate: (v) => (/^\d+$/.test(v) ? undefined : 'Número'),
  });
  if (p.isCancel(webPort)) throw new Error('Cancelado');

  const runInstall = await p.confirm({
    message: '¿Correr `npm install` al finalizar?',
    initialValue: true,
  });
  if (p.isCancel(runInstall)) throw new Error('Cancelado');

  return {
    projectName: name,
    productName: productName || name,
    modules: modulesWithOrg,
    db: { name: dbName, port: Number(dbPort), user: dbUser, password: dbPassword },
    ports: { app: Number(appPort), web: Number(webPort) },
    jwtSecret: randomSecret(),
    jwtRefreshSecret: randomSecret(),
    runInstall,
    templateTag: 'v0.2.0',
  };
}
