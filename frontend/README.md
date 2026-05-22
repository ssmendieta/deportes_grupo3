# Frontend — Sistema de Reservas UCB

Aplicación SPA para la gestión y reserva de espacios deportivos de la UCB. Construida con React 19 + TypeScript + Vite.

---

## Tecnologías

- **React 19** con TypeScript
- **Vite 8** como bundler y dev server
- **react-router-dom v7** para enrutamiento
- **jsPDF** para generación de PDFs (comprobantes)
- **ESLint** con TypeScript y React Hooks reglas

---

## Rutas

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/login` | `LoginPage` | Público | Login con Google OAuth o pegar JWT manualmente |
| `/` | Redirect → `/pagos` | Autenticado | Redirección al módulo de pagos |
| `/dashboard` | `DashboardAdminPage` | Admin | Estadísticas y exportación de reportes |
| `/calendario` | `CalendarioPage` | Autenticado | Vista semanal de ocupación de espacios |
| `/deportistas` | `RegistroDeportistaPage` | Admin | Registro, listado y cuentas de deportistas |
| `/pagos` | `PagosAcademiasPage` | Admin | Verificación de pagos (tipo academia) |
| `/disciplinas` | `GestionDisciplinasPage` | Admin | CRUD de disciplinas deportivas |
| `/reservas` | `AdminReserva` | Admin | Listado, detalle y edición de reservas |
| `/reservas/nueva` | `NuevaReservaPage` | Admin | Formulario de creación de reservas |
| `/perfil` | `PerfilPage` | Autenticado | Información del usuario desde el JWT |

---

## Módulos (features)

### `auth`
- **`LoginPage`** — Interfaz de login con dos métodos: Google OAuth (popup) y pegado manual de JWT
- **`PerfilPage`** — Datos del usuario extraídos del payload del token
- **`authStore.ts`** — Gestión del token en `sessionStorage` (`getToken`, `setToken`, `clearToken`, `isAuthenticated`, `getUserFromToken`)

### `dashboard`
- **`DashboardAdminPage`** — Tarjetas con estadísticas (total deportistas, pagos pendientes, morosos, disciplinas activas) + exportación de reportes globales

### `calendario`
- **`CalendarioAdminPage`** — Grilla semanal con slots de 30 min (lun-sáb, 14:00-18:00), colores por espacio y estado, selector de espacio
- **`CalendarioEstudiantePage`** — Grilla de solo lectura para estudiantes
- **`GrillaCalendarioSemanal`** — Componente de grilla reutilizable con modo admin/estudiante
- **`NavegacionSemana`** — Navegación entre semanas

### `deportistas`
- **`RegistroDeportistaPage`** — Filtros por tipo/búsqueda, formulario de creación, tabla de deportistas, detalle de cuenta
- **`DeportistaForm`** — Formulario completo con validación (CI, nombre, fecha nac, género, teléfono, email, carrera, disciplina, categoría, nivel, talla)
- **`DeportistaTable`** — Listado con columnas: nombre, CI, disciplina, mes, estado, deuda, acción "Ver cuenta"
- **`DeportistaAccount`** — Vista detalle con info personal y tabla de pagos
- **`deportistaService.ts`** — API CRUD + búsqueda por CI + inscripciones + pagos por deportista

### `disciplinas`
- **`GestionDisciplinasPage`** — CRUD con búsqueda, filtro por estado, tabla, modal de creación/edición
- **`DisciplinaFormModal`** — Modal con campos: nombre, descripción, categorías, mensualidad, estado
- **`DisciplinaTable`** — Tabla con acciones de editar/activar/desactivar
- **`disciplinaService.ts`** — API CRUD + cambio de estado

### `pagos`
- **`PagosAcademiasPage`** — Dashboard de pagos con tarjetas de resumen (al día, pendientes, recaudación), filtros, tabla de deportistas y detalle de cuenta
- **`pagoService.ts`** — `listarCuentasAcademia()` y `calcularResumenPagos()`

### `reservas`
- **`AdminReserva`** — Layout de dos paneles: lista lateral (búsqueda, filtros, tabs activas/canceladas) + detalle/edición en panel derecho
- **`ReservaForm`** — Formulario de creación: solicitante, carnet, email, motivo, espacio, disciplina, fecha, hora inicio/fin (máx 3h), modal de éxito con descarga PDF
- **`ReservaConfirmadaModal`** — Modal post-creación con resumen y botón de descarga PDF
- **`reservaService.ts`** — API CRUD + disponibilidad + descarga de comprobante

---

## Componentes compartidos

| Componente | Descripción |
|---|---|
| `AppNavigation` | Barra de navegación superior con links a cada módulo |
| `PageHeader` | Encabezado de página con título, descripción y botón opcional |
| `StatCard` | Tarjeta de estadística con color (blue/green/yellow/red) |
| `StatusBadge` | Badge de estado con tono (success/warning/danger/info) |
| `EmptyState` | Estado vacío con título y descripción |
| `Spinner` | Indicador de carga (sm/md/lg) |
| `ErrorBoundary` | Límite de error con botón de recarga |
| `ExportarReporteButton` | Botón que abre modal de exportación (PDF/Excel) |
| `ReporteFilterModal` | Modal con filtros dinámicos para exportar reportes |

## Servicios compartidos

- **`apiClient.ts`** — Cliente HTTP genérico con `apiRequest<T>()`, manejo de JWT, detección de expiración, redirect 401
- **`reporteService.ts`** — `descargarReporte()` para exportar reportes desde el backend

## Utilidades

- **`validators.ts`** — Validaciones: CI, teléfono, email, nombre completo, requerido
- **`localStore.ts`** — `readLocalStore<T>()` y `writeLocalStore<T>()` para localStorage tipado

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base del backend | `http://localhost:4000` |

---

## Scripts

```bash
npm run dev      # Iniciar en desarrollo (puerto 5173)
npm run build    # Compilar para producción
npm run preview  # Previsualizar build de producción
npm run lint     # Ejecutar ESLint
```

---

## Convenciones

- **Autenticación**: JWT almacenado en `sessionStorage` bajo `ucb_auth_token`. Se elimina al cerrar pestaña.
- **Estado**: Sin librería externa — estado local con `useState` + `useEffect`.
- **API**: Un solo `apiClient.ts` con tipado genérico, adjunta `Authorization: Bearer` automáticamente.
- **Feature-based**: Cada módulo tiene `pages/`, `components/`, `services/`, `types/`.
- **Soft-delete**: Disciplinas y deportistas se desactivan, nunca se eliminan.
