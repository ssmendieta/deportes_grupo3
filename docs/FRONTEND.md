# Guía del Frontend — Sistema de Gestión Deportiva UCB

> **Framework:** React 18 + TypeScript | **Build:** Vite | **Routing:** react-router-dom v7

---

## 1. Arquitectura Feature-Sliced

El frontend está organizado siguiendo el patrón **Feature-Sliced Design**:

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Configuración de rutas
├── App.css / index.css         # Estilos globales
│
├── config/
│   └── routes.config.ts        # Rutas, roles y permisos
│
├── hooks/
│   └── useRole.ts              # Hook personalizado de rol
│
├── features/                   # Dominios de negocio
│   ├── auth/                   # Autenticación y perfil
│   ├── dashboard/              # Panel administrativo
│   ├── calendario/             # Calendario semanal
│   ├── deportistas/            # Gestión de deportistas
│   ├── disciplinas/            # Gestión de disciplinas
│   ├── reservas/               # Gestión de reservas
│   └── pagos/                  # Gestión de pagos
│
└── shared/                     # Código compartido
    ├── components/             # UI reutilizable
    ├── services/               # Servicios (API, reportes)
    ├── utils/                  # Funciones utilitarias
    ├── contexts/               # Contextos React
    └── types/                  # Tipos TypeScript
```

### Estructura Interna de una Feature

Cada feature sigue esta convención:

```
features/<nombre>/
├── components/     # Componentes UI específicos de la feature
├── pages/          # Componentes de página completa
├── services/       # Llamadas a la API
├── types/          # Tipos TypeScript específicos
└── mocks/          # Datos mock para desarrollo
```

---

## 2. Routing y Protección

### 2.1 Configuración de Rutas (`config/routes.config.ts`)

```typescript
export const ROUTES: RouteConfig[] = [
  { path: "/dashboard",   label: "Dashboard",    iconKey: "dashboard",   allowedRoles: ["admin"] },
  { path: "/calendario",  label: "Calendario",   iconKey: "calendario",  allowedRoles: ["admin", "entrenador", "delegado", "deportista"] },
  { path: "/deportistas", label: "Deportistas",  iconKey: "deportistas", allowedRoles: ["admin", "entrenador"] },
  { path: "/pagos",       label: "Pagos",        iconKey: "pagos",       allowedRoles: ["admin", "entrenador"] },
  { path: "/disciplinas", label: "Disciplinas",  iconKey: "disciplinas", allowedRoles: ["admin", "entrenador"] },
  { path: "/reservas",    label: "Reservas",     iconKey: "reservas",    allowedRoles: ["admin", "entrenador"] },
];
```

### 2.2 Rutas por Defecto por Rol

| Rol | Ruta por defecto |
|---|---|
| `admin` | `/dashboard` |
| `entrenador` | `/calendario` |
| `delegado` | `/calendario` |
| `deportista` | `/calendario` |

### 2.3 Mapa de Rutas

```
/                     → Redirect según rol
/login                → LoginPage (público)
/dashboard            → DashboardAdminPage (admin)
/calendario           → CalendarioPage (todos los roles)
/deportistas          → RegistroDeportistaPage (admin, entrenador)
/pagos                → PagosAcademiasPage (admin, entrenador)
/disciplinas          → GestionDisciplinasPage (admin, entrenador)
/reservas             → AdminReserva (admin, entrenador)
/reservas/nueva       → NuevaReservaPage (admin, entrenador)
/perfil               → PerfilPage (autenticado)
```

### 2.4 ProtectedLayout

El componente `ProtectedLayout` envuelve todas las rutas protegidas y:

1. Verifica autenticación → si no, redirect a `/login`
2. Verifica permisos de rol → si no, redirect a ruta por defecto del rol
3. Renderiza `Sidebar` + `Outlet` (ruta hija)
4. Incluye `ErrorBoundary` para manejo de errores React

---

## 3. Autenticación

### 3.1 authStore (`features/auth/authStore.ts`)

Gestión de estado de autenticación usando **sessionStorage**:

| Función | Descripción |
|---|---|
| `getToken()` | Obtiene el JWT de sessionStorage |
| `setToken(token)` | Guarda el JWT en sessionStorage |
| `clearToken()` | Elimina el token |
| `isAuthenticated()` | Verifica existencia y expiración del token |
| `getUserFromToken()` | Extrae `{ nombre, email, rol }` del payload JWT |

### 3.2 Captura del Token

La función `captureTokenFromUrl()` en `App.tsx`:

1. Busca `token` o `jwt` en query params (`?token=...`)
2. Si no encuentra, busca en hash params (`#token=...`)
3. Si encuentra → guarda en sessionStorage y limpia la URL

```typescript
function captureTokenFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  let token = params.get("token") ?? params.get("jwt");

  if (!token && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    token = hashParams.get("token") ?? hashParams.get("jwt");
  }

  if (!token) return;
  setToken(token);
  window.history.replaceState({}, "", window.location.pathname);
}
```

### 3.3 Expiración del Token

Se verifica en dos lugares:

1. **authStore.isAuthenticated()** — Al cargar rutas protegidas
2. **apiClient.tokenExpirado()** — Antes de cada request API

Ambos decodifican el payload JWT (base64url) y comparan `exp * 1000 < Date.now()`.

---

## 4. Servicio API (`shared/services/apiClient.ts`)

### 4.1 apiRequest

Wrapper tipado sobre `fetch`:

```typescript
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T>
```

### 4.2 Flujo de Request

```
1. Verificar expiración del token (si requiresAuth=true)
   → Si expirado: redirect a /login + throw Error
2. Construir headers:
   → Content-Type: application/json
   → Authorization: Bearer <token> (si requiresAuth=true)
3. Ejecutar fetch
4. Parsear respuesta (text → JSON)
5. Si response.ok → retornar data
6. Si 401 → redirect a /login + throw Error
7. Si 403 → throw Error con mensaje
8. Si otro error → throw Error con mensaje
```

### 4.3 Configuración de API_URL

```typescript
const viteApiUrl = import.meta.env.VITE_API_URL;
export const API_URL = viteApiUrl === "__RELATIVE__" ? "" : (viteApiUrl || "http://localhost:4000");
```

- En **desarrollo**: `http://localhost:4000`
- En **producción Docker**: `""` (relative, nginx hace proxy de `/api/*`)

### 4.4 Utilidades de Fecha

| Función | Descripción |
|---|---|
| `toDateInputValue(date)` | Convierte Date a `YYYY-MM-DD` para inputs |
| `formatFechaBO(date)` | Formatea fecha a `DD/MM/YYYY` (formato Bolivia) |

---

## 5. Feature: Auth

### Archivos
- `pages/LoginPage.tsx` — Página de login
- `pages/PerfilPage.tsx` — Perfil del usuario
- `authStore.ts` — Estado de autenticación

### LoginPage

Redirige al servidor OAuth externo. No maneja credenciales directamente.

### PerfilPage

Muestra información del usuario extraída del JWT (nombre, email, rol).

---

## 6. Feature: Dashboard

### Archivos
- `pages/DashboardAdminPage.tsx`

Panel administrativo con métricas y vistas rápidas del sistema. Solo accesible por `admin`.

---

## 7. Feature: Calendario

### Archivos
- `pages/CalendarioPage.tsx`
- `pages/CalendarioAdminPage.tsx`
- `pages/CalendarioEstudiantePage.tsx`
- `components/GrillaCalendarioSemanal.tsx`
- `components/NavegacionSemana.tsx`
- `components/LeyendaCalendario.tsx`
- `components/AlertasCalendario.tsx`
- `components/EncabezadoCalendario.tsx`

### Funcionalidad

- Vista semanal de horarios de espacios deportivos
- Navegación entre semanas
- Leyenda de colores por tipo de bloque
- Alertas de disponibilidad
- Diferentes vistas según rol (admin vs estudiante)

---

## 8. Feature: Deportistas

### Archivos
- `pages/RegistroDeportistaPage.tsx`
- `components/DeportistaForm.tsx`
- `components/DeportistaTable.tsx`
- `components/DeportistaAccount.tsx`
- `services/deportistaService.ts`
- `types/deportista.types.ts`
- `mocks/deportistasMock.ts`

### Funcionalidad

- Formulario de registro con validación
- Tabla paginada con filtros (tipo, disciplina, activo)
- Búsqueda por CI
- Gestión de inscripciones
- Estado de cuenta del deportista

---

## 9. Feature: Disciplinas

### Archivos
- `pages/GestionDisciplinasPage.tsx`
- `components/DisciplinaTable.tsx`
- `components/DisciplinaFormModal.tsx`
- `components/DisciplinaFilters.tsx`
- `components/EstadoDisciplinaBadge.tsx`
- `services/disciplinaService.ts`
- `types/disciplina.types.ts`
- `mocks/disciplinasMock.ts`

### Funcionalidad

- CRUD de disciplinas deportivas
- Modal de creación/edición
- Filtros por estado (activo/inactivo)
- Badge de estado visual

---

## 10. Feature: Reservas

### Archivos
- `pages/ReservasAdminPage.tsx`
- `pages/NuevaReservaPage.tsx`
- `components/AdminReserva.tsx`
- `components/ReservaForm.tsx`
- `components/ReservaConfirmadaModal.tsx`
- `services/reservaService.ts`
- `types/reserva.types.ts`

### Funcionalidad

- Listado de reservas con filtros (espacio, fecha)
- Formulario de nueva reserva con validación de disponibilidad
- Modal de confirmación de reserva
- Cambio de estado (confirmar/cancelar)
- Descarga de comprobante PDF

---

## 11. Feature: Pagos

### Archivos
- `pages/PagosAcademiasPage.tsx`
- `components/PagosFilters.tsx`
- `components/PagosLegend.tsx`
- `services/pagoService.ts`
- `types/pago.types.ts`

### Funcionalidad

- Planilla de pagos por disciplina y año
- Filtros de búsqueda
- Registro de pagos
- Lista de morosos
- Leyenda de estados de pago

---

## 12. Componentes Compartidos (`shared/components/`)

| Componente | Propósito |
|---|---|
| `Sidebar.tsx` | Navegación lateral con menú dinámico por rol |
| `Spinner.tsx` | Indicador de carga |
| `ErrorBoundary.tsx` | Captura errores de React y muestra fallback |
| `StatusBadge.tsx` | Badge de estado con color semántico |
| `StatCard.tsx` | Tarjeta de métrica/estadística |
| `PageHeader.tsx` | Encabezado de página con título y acciones |
| `EmptyState.tsx` | Estado vacío con icono y mensaje |
| `AppNavigation.tsx` | Navegación principal |
| `ReporteFilterModal.tsx` | Modal de filtros para reportes |
| `ExportarReporteButton.tsx` | Botón de exportación Excel/PDF |

---

## 13. Contextos React

### ToastContext (`shared/contexts/ToastContext.tsx`)

Contexto para notificaciones tipo toast:

```typescript
// Uso
const { showToast } = useToast();
showToast("Reserva creada exitosamente", "success");
showToast("Error al guardar", "error");
```

Tipos de toast: `success`, `error`, `warning`, `info`.

---

## 14. Utilidades Compartidas

### validators.ts (`shared/utils/validators.ts`)

Funciones de validación de formularios:

| Función | Descripción |
|---|---|
| Validación de CI | Formato boliviano (número + complemento opcional) |
| Validación de email | Formato RFC 5322 |
| Validación de teléfono | Formato boliviano (+591 7XXXXXXX) |
| Validación de fechas | Fecha válida, no futura, etc. |

### localStore.ts (`shared/utils/localStore.ts`)

Wrapper seguro sobre `localStorage` / `sessionStorage` con try-catch para evitar errores en modo incógnito.

---

## 15. Tipos Compartidos

### navigation.types.ts (`shared/types/navigation.types.ts`)

Tipos para navegación y routing:

```typescript
export type RouteConfig = {
  path: string;
  label: string;
  iconKey: string;
  allowedRoles: string[];
};
```

---

## 16. Servicios de Feature

Cada feature tiene su propio servicio que usa `apiRequest`:

| Servicio | Feature | Métodos principales |
|---|---|---|
| `deportistaService.ts` | Deportistas | `findAll`, `buscarPorCi`, `create`, `update`, `inscribir` |
| `disciplinaService.ts` | Disciplinas | `findAll`, `create`, `update`, `cambiarEstado` |
| `reservaService.ts` | Reservas | `findAll`, `create`, `update`, `descargarComprobante` |
| `pagoService.ts` | Pagos | `findAll`, `getConceptos`, `getPlanilla`, `registrarPago` |
| `reporteService.ts` | Shared | `descargarReporte` (Excel/PDF) |

### Patrón de Servicio

```typescript
export async function findAll(page = 1, limit = 20) {
  return apiRequest<DeportistaResponse>(
    `/api/deportistas?page=${page}&limit=${limit}`,
    { requiresAuth: true }
  );
}
```

---

## 17. Manejo de Errores

### 17.1 ErrorBoundary (React)

Componente que captura errores de renderizado:

```
<App>
  <ErrorBoundary>
    <Outlet />  {/* Si falla, muestra fallback UI */}
  </ErrorBoundary>
</App>
```

### 17.2 apiClient (HTTP)

- **401** → Redirect automático a `/login`
- **403** → Error con mensaje "No tienes permisos"
- **4xx/5xx** → Error con mensaje del backend
- **Network error** → Error genérico

### 17.3 Toast Notifications

Los errores se muestran como toasts en la UI:

```typescript
try {
  await crearReserva(data);
  showToast("Reserva creada", "success");
} catch (error) {
  showToast(error.message, "error");
}
```

---

## 18. Sidebar y Navegación por Rol

El `Sidebar` componente:

1. Obtiene el rol del usuario desde `getUserFromToken()`
2. Filtra rutas visibles con `getVisibleRoutes(rol)`
3. Renderiza solo las rutas permitidas
4. Incluye botón de logout que llama a `POST /api/auth/logout`

### Visibilidad de Rutas por Rol

| Ruta | admin | entrenador | delegado | deportista |
|---|---|---|---|---|
| `/dashboard` | ✅ | ❌ | ❌ | ❌ |
| `/calendario` | ✅ | ✅ | ✅ | ✅ |
| `/deportistas` | ✅ | ✅ | ❌ | ❌ |
| `/pagos` | ✅ | ✅ | ❌ | ❌ |
| `/disciplinas` | ✅ | ✅ | ❌ | ❌ |
| `/reservas` | ✅ | ✅ | ❌ | ❌ |

---

## 19. Variables de Entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL del backend API | `http://localhost:4000` |

En producción Docker se usa `__RELATIVE__` para que nginx haga proxy.

---

## 20. Cómo Agregar una Nueva Feature

### Paso 1: Crear estructura

```bash
mkdir -p src/features/<nombre>/{components,pages,services,types,mocks}
```

### Paso 2: Definir tipos

```typescript
// features/<nombre>/types/<nombre>.types.ts
export interface NuevoEntity {
  id: number;
  // ...
}
```

### Paso 3: Crear servicio

```typescript
// features/<nombre>/services/nuevoService.ts
import { apiRequest } from "../../../shared/services/apiClient";

export async function findAll() {
  return apiRequest<NuevoEntity[]>("/api/nuevo", { requiresAuth: true });
}
```

### Paso 4: Crear componente de página

```typescript
// features/<nombre>/pages/NuevoPage.tsx
import { useEffect, useState } from "react";
import { findAll } from "../services/nuevoService";

export default function NuevoPage() {
  const [data, setData] = useState<NuevoEntity[]>([]);

  useEffect(() => {
    findAll().then(setData);
  }, []);

  return <div>{/* UI */}</div>;
}
```

### Paso 5: Registrar ruta

En `App.tsx`:

```typescript
import NuevoPage from "./features/<nombre>/pages/NuevoPage";

// Dentro de <Routes>:
<Route path="/nuevo" element={<NuevoPage />} />
```

### Paso 6: Configurar permisos

En `config/routes.config.ts`:

```typescript
{ path: "/nuevo", label: "Nuevo", iconKey: "nuevo", allowedRoles: ["admin", "entrenador"] },
```

---

## 21. Convenciones de Código

### Naming

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `DeportistaForm.tsx` |
| Hooks | camelCase, prefix `use` | `useRole.ts`, `useToast.ts` |
| Servicios | camelCase + `Service` suffix | `deportistaService.ts` |
| Tipos | PascalCase + `.types.ts` | `deportista.types.ts` |
| Utils | camelCase | `validators.ts`, `localStore.ts` |
| Constantes | UPPER_SNAKE_CASE | `API_URL`, `TOKEN_KEY` |

### Imports

- Imports absolutos relativos a `src/`
- Imports de shared primero, luego de feature
- Orden: React → librerías → shared → feature

### Estilos

- CSS modules o CSS plano con clases BEM-like
- Colores institucionales UCB: `#003366` (azul), `#FFFFFF` (blanco)

---

## 22. Comandos Útiles

```bash
# Desarrollo
npm run dev              # Vite dev server (http://localhost:5173)

# Build
npm run build            # Build de producción (dist/)
npm run preview          # Preview del build

# Linting y tipos
npm run lint             # ESLint
npm run typecheck        # Verificación de tipos TypeScript
```
