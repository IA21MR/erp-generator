# @ia21mr/create-erp

CLI para generar un proyecto ERP white-label a partir del template
[`erp-base-template`](https://github.com/IA21MR/erp-base-template).

## Uso

```bash
npx @ia21mr/create-erp mi-cliente
```

> **Nota (v0.1.0):** el módulo `organizations` es obligatorio. El módulo `users` del template todavía tiene acoplamiento duro con `OrganizationId`. El modo "core-only" se habilitará cuando el template refactorice esa dependencia.

Abre un wizard interactivo que:

1. Pide nombre del producto, módulos opcionales a activar (`organizations`,
   `contacts`), credenciales de base de datos y puertos.
2. Clona el template en el tag elegido.
3. Poda los módulos no seleccionados (código TS, fragmentos Prisma, seeds,
   permisos, tests e2e).
4. Regenera `prisma/schema.prisma` desde los fragmentos activos.
5. Genera una migración `init` fresca.
6. Escribe `.env` y metadatos (`package.json`, `README.md`, `docker-compose.yml`).
7. `git init` + commit inicial + (opcional) `npm install`.

## Flags

- `--version <tag>`: tag del template a usar (default: `v0.1.0`).
- `--no-install`: saltea `npm install`.
- `--yes`: acepta defaults sin preguntar.
