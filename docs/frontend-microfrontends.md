# Arquitectura Frontend — Microfrontends

LeanStart implementa una arquitectura de microfrontends usando **npm workspaces** dentro de un monorepo. Cada microfrontend es un paquete independiente con su propio `package.json`, `tsconfig.json`, dependencias y contratos públicos.

## Estructura

```
apps/frontend/
├── web-shell/              Host Next.js — unica app que corre
├── commons/                Design system + tipos + utilidades compartidas
├── dashboard-front/        Microfrontend de Dashboard
├── empresas-front/         Microfrontend de Empresas (canvas, productos, hipotesis)
└── notificaciones-front/   Microfrontend de Notificaciones
```

## Responsabilidades

### `web-shell` (host)
- Layout raiz, providers globales, autenticacion (NextAuth).
- Sidebar de navegacion y chrome de la aplicacion.
- Rutas del App Router: cada `page.tsx` es un **shim delgado** que solo monta el componente expuesto por el microfrontend correspondiente.

```tsx
// apps/frontend/web-shell/src/app/emprendedor/dashboard/page.tsx
import { DashboardView } from "@leanstart/dashboard-front";
export default function Page() { return <DashboardView />; }
```

### `commons` (design system)
- Componentes UI de shadcn/ui (Button, Card, Form, Dialog, etc.).
- Hooks compartidos (`useIsMobile`, `usePrivilegios`).
- Utilidades (`cn`).
- Tipos de dominio (`Role`, `EstadoEmpresa`, `Modulo`, `Accion`, etc.).

### `*-front` (microfrontends de negocio)
Cada uno expone:
- **Vistas**: componentes React que el shell monta como pagina.
- **Store**: estado propio del dominio (Zustand).
- **Contratos**: tipos publicos via su `index.ts`.

Por ejemplo, `empresas-front` expone:
```ts
export { EmpresasListView, EmpresaDetailView, CanvasView, ... };
export { useEmpresasStore, type Empresa, type Hipotesis, ... };
```

## Reglas de dependencias

```
web-shell  →  commons, dashboard-front, empresas-front, notificaciones-front
dashboard-front  →  commons, empresas-front (lee stats del store)
empresas-front  →  commons
notificaciones-front  →  commons
commons  →  (sin dependencias internas)
```

- Los `*-front` **nunca** dependen entre ellos como pares (excepto dashboard que lee stats de empresas, que es lectura).
- `commons` no depende de ningun otro paquete del monorepo.
- `web-shell` orquesta todo.

## Por que esta arquitectura (no Module Federation runtime)

`@module-federation/nextjs-mf` (el plugin oficial de MF para Next.js) **no soporta**:
1. Next.js 16 (solo Next 12-14).
2. App Router (solo Pages Router).
3. Esta planeado para descontinuarse a finales de 2026.

Frente a esa realidad, el monorepo con workspaces aislados es el patron actual de la industria para microfrontends en Next.js 14+. Conserva:
- **Independencia de codigo**: cada microfrontend vive en su carpeta con sus propias dependencias.
- **Contratos explicitos**: solo se importa lo que el `index.ts` expone.
- **Despliegues separables**: cada paquete puede publicarse y versionarse aparte si se quiere.
- **Hot reload nativo**: cambios en cualquier `*-front` recargan al instante en el shell.

Para migrar a Module Federation real en el futuro (cuando el ecosistema lo soporte), la frontera por paquete ya esta lista — solo cambia el mecanismo de carga.

## Tailwind

`web-shell/src/app/globals.css` declara `@source` para que Tailwind escanee las clases usadas en los microfrontends:

```css
@source "../../../commons/src/**/*.{ts,tsx}";
@source "../../../dashboard-front/src/**/*.{ts,tsx}";
@source "../../../empresas-front/src/**/*.{ts,tsx}";
@source "../../../notificaciones-front/src/**/*.{ts,tsx}";
```

## Comandos

Desde la raiz del repo:
```bash
npm install       # enlaza workspaces y descarga deps
npm run dev       # arranca el shell (puerto 3000), incluye todos los *-front
npm run build     # build de produccion
```
