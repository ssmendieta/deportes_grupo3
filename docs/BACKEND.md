# Guía del Backend — Sistema de Gestión Deportiva UCB

> **Framework:** NestJS 10 + TypeScript | **ORM:** Prisma v7 | **Runtime:** Node.js

---

## 1. Estructura Modular

El backend está organizado en **12 módulos NestJS**, cada uno con responsabilidades bien definidas:

| Módulo | Prefijo API | Auth | Roles | Descripción |
|---|---|---|---|---|
| `auth` | `/api/auth` | Parcial | Todos | Logout de sesión |
| `espacios` | `/api/espacios` | Sí | Todos (lectura) | Espacios físicos deportivos |
| `horarios` | `/api/horarios-disponibles` | Sí | Todos (lectura) | Disponibilidad horaria |
| `disciplinas` | `/api/disciplinas` | Sí | Admin (write), Todos (read) | Disciplinas deportivas |
| `deportistas` | `/api/deportistas` | Sí | Admin, Entrenador | Registro e inscripciones |
| `reservas` | `/api/reservas` | Sí | Admin, Entrenador | Reservas de espacios |
| `pagos` | `/api/pagos` | Sí | Admin (write), Entrenador (read) | Pagos y planillas |
| `carreras` | `/api/carreras` | Sí | — | Carreras universitarias |
| `mail` | — | — | — | Servicio de correo (interno) |
| `reportes` | — | — | — | Generación Excel/PDF (interno) |
| `health` | `/api/health` | No | — | Health checks |
| `auditoria` | `/api/auditoria` | Sí | Admin | Log de auditoría |

---

## 2. Módulo: Auth

### Archivos
- `auth.module.ts` — Registra el módulo
- `auth.controller.ts` — `POST /api/auth/logout`
- `guards/roles.guard.ts` — Guard global de autorización
- `decorators/roles.decorator.ts` — `@Roles(...roles)`

### Funcionamiento

El módulo de auth no gestiona login (eso lo hace el servidor OAuth externo). Su responsabilidad es:

1. **Logout** (`POST /api/auth/logout`): Registra el cierre de sesión en los logs. Retorna `204 No Content`.
2. **RolesGuard**: Guard global que verifica `@Roles()` en cada endpoint protegido.
3. **@Roles decorator**: Metadata que especifica qué roles pueden acceder a un endpoint.

### RolesGuard — Lógica

```
1. Lee metadata @Roles() del handler/clase
2. Si no hay roles definidos → permite acceso (endpoint público)
3. Si hay roles → obtiene user.rol del request (inyectado por AuthMiddleware)
4. Compara case-insensitive
5. Si no coincide → ForbiddenException
```

---

## 3. Módulo: Espacios

### Archivos
- `espacios.module.ts`
- `espacios.controller.ts`
- `espacios.service.ts`

### Endpoints

| Método | Path | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/espacios` | Todos | Lista espacios activos |
| `GET` | `/api/espacios/:id` | Todos | Detalle de un espacio |

### Modelo de Datos

```prisma
model espacios {
  id_espacio       Int     @id @default(autoincrement())
  nombre_espacio   String  @db.VarChar(100)
  hora_apertura    DateTime @db.Time(6)
  horario_cierre   DateTime? @db.Time(6)
  activo           Boolean @default(true)
}
```

---

## 4. Módulo: Horarios

### Archivos
- `horarios.module.ts`
- `horarios.controller.ts`
- `horarios.service.ts`

### Endpoints

| Método | Path | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/horarios-disponibles/:espacioId?fecha=YYYY-MM-DD` | Todos | Bloques ocupados de un espacio en una fecha |

### Respuesta

```json
{
  "espacio": {
    "nombre": "Coliseo Polideportivo",
    "horario_apertura": "07:00",
    "horario_cierre": "22:00"
  },
  "bloques_ocupados": [
    {
      "hora_inicio": "08:00",
      "hora_fin": "10:00",
      "tipo": "clase",
      "motivo": "Horario de clases"
    },
    {
      "hora_inicio": "14:00",
      "hora_fin": "16:00",
      "tipo": "reserva",
      "estado": "confirmada",
      "motivo": "Entrenamiento Fútsal"
    }
  ]
}
```

### Lógica

1. Obtiene el espacio y su horario de apertura/cierre
2. Consulta `plantilla_horarios_fijos` para bloques de clase del día
3. Consulta `reservas` confirmadas para la fecha
4. Combina ambos en `bloques_ocupados` con `tipo: "clase"` o `tipo: "reserva"`

---

## 5. Módulo: Disciplinas

### Archivos
- `disciplinas.module.ts`
- `disciplinas.controller.ts`
- `disciplinas.service.ts`
- `dto/create-disciplina.dto.ts`
- `dto/update-disciplina.dto.ts`

### Endpoints

| Método | Path | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/disciplinas?activo=true` | Todos | Lista disciplinas (filtro activo opcional) |
| `GET` | `/api/disciplinas/:id` | Todos | Detalle de disciplina |
| `POST` | `/api/disciplinas` | Admin | Crear disciplina |
| `PATCH` | `/api/disciplinas/:id` | Admin | Actualizar disciplina |
| `PATCH` | `/api/disciplinas/:id/estado` | Admin | Activar/desactivar |
| `GET` | `/api/disciplinas/reporte?formato=excel&estado=activas` | Admin | Exportar reporte |

### Modelo de Datos

```prisma
model disciplinas {
  id_disciplina       Int     @id @default(autoincrement())
  nombre_disciplina   String  @db.VarChar(50)
  activo              Boolean @default(true)
}
```

---

## 6. Módulo: Deportistas

### Archivos
- `deportistas.module.ts`
- `deportistas.controller.ts`
- `deportistas.service.ts`
- `dto/create-deportista.dto.ts`
- `dto/update-deportista.dto.ts`

### Endpoints

| Método | Path | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/deportistas?page=1&limit=20&tipo=&disciplinaId=&activo=` | Admin, Entrenador | Lista paginada con filtros |
| `GET` | `/api/deportistas/buscar?ci=12345678` | Admin, Entrenador | Buscar por CI |
| `GET` | `/api/deportistas/:id` | Admin, Entrenador | Detalle completo |
| `POST` | `/api/deportistas` | Admin, Entrenador | Registrar nuevo deportista |
| `PATCH` | `/api/deportistas/:id` | Admin, Entrenador | Actualizar datos |
| `PATCH` | `/api/deportistas/:id/estado` | Admin | Activar/desactivar (soft-delete) |
| `POST` | `/api/deportistas/:id/inscripciones` | Admin, Entrenador | Inscribir en disciplina |
| `GET` | `/api/deportistas/:id/inscripciones` | Admin, Entrenador | Ver inscripciones |
| `GET` | `/api/deportistas/reporte?formato=excel&tipo=&busqueda=` | Admin | Exportar reporte |

### Tipos de Deportista

| Tipo | Descripción | Requiere carrera/semestre | Paga mensualidad |
|---|---|---|---|
| `estudiante_ucb` | Estudiante UCB | Sí | No (exonerado) |
| `academia` | Externo de academia | No | Sí |
| `competitivo` | Deportista competitivo | No | No (exonerado) |
| `exonerado` | Exonerado de pago | No | No |

### Modelo de Datos (simplificado)

```
personas (1) ── (1) deportistas (1) ── (N) deportistas_ucb / deportistas_externos
                                    │
                                    └── (N) inscripciones ── disciplinas
                                    └── (N) pagos
```

---

## 7. Módulo: Reservas

### Archivos
- `reserva.module.ts`
- `reserva.controller.ts`
- `reservas.service.ts`
- `dto/create-reserva.dto.ts`
- `dto/update-reserva.dto.ts`
- `pdf/comprobante-reserva.builder.ts`

### Endpoints

| Método | Path | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/reservas?espacioId=&fecha=&page=&limit=` | Admin, Entrenador | Lista paginada con filtros |
| `GET` | `/api/reservas/:id` | Admin, Entrenador | Detalle de reserva |
| `POST` | `/api/reservas` | Admin, Entrenador | Crear reserva |
| `PATCH` | `/api/reservas/:id` | Admin, Entrenador | Actualizar estado/datos |
| `GET` | `/api/reservas/:id/comprobante` | Admin, Entrenador | Descargar PDF comprobante |
| `GET` | `/api/reservas/reporte?formato=excel&desde=&hasta=&estado=` | Admin | Exportar reporte |

### Lógica de Creación de Reserva (`create`)

```
1. Validar duración (> 0 y <= 180 minutos)
2. Verificar que el espacio existe
3. Validar que el horario está dentro del horario del espacio
4. Verificar conflicto con plantilla_horarios_fijos (clases) → 409
5. Iniciar transacción Prisma:
   a. Verificar conflicto con reservas confirmadas → 409
   b. Crear reserva con estado "Pendiente"
6. Generar comprobante PDF
7. Enviar email de confirmación (sidecar, no bloqueante)
8. Retornar reserva mapeada
```

### Detección de Conflictos

Se verifican 3 tipos de solapamiento de horarios:

```typescript
// El bloque solicitado comienza dentro de un bloque existente
{ hora_inicio: { lte: hInicioDate }, hora_fin: { gt: hInicioDate } }

// El bloque solicitado termina dentro de un bloque existente
{ hora_inicio: { lt: hFinDate }, hora_fin: { gte: hFinDate } }

// El bloque solicitado contiene completamente un bloque existente
{ hora_inicio: { gte: hInicioDate }, hora_fin: { lte: hFinDate } }
```

### Comprobante PDF

Generado con `PDFKit` usando el patrón **Builder**:

1. `generarCabecera()` — Logo UCB + título institucional
2. `generarNumeracion(id)` — Correlativo `RES-YYYY-NNNNNN`
3. `generarContenido(reserva)` — Datos del solicitante, espacio, fecha, motivo
4. `generarPiePagina()` — Dirección, fecha de emisión, nota legal

### Estados de Reserva

| Estado | Descripción |
|---|---|
| `Pendiente` | Recién creada |
| `confirmada` | Aprobada y activa |
| `cancelada` | Cancelada (no se puede modificar) |

---

## 8. Módulo: Pagos

### Archivos
- `pagos.module.ts`
- `pagos.controller.ts`
- `pagos.service.ts`
- `dto/create-pago.dto.ts`
- `dto/pagination.dto.ts`

### Endpoints

| Método | Path | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/pagos?page=&limit=` | Admin, Entrenador | Lista paginada de pagos |
| `GET` | `/api/pagos/conceptos?disciplinaId=` | Admin, Entrenador | Conceptos de pago disponibles |
| `GET` | `/api/pagos/planilla?disciplinaId=&anio=` | Admin, Entrenador | Planilla de pagos por disciplina |
| `GET` | `/api/pagos/morosos?disciplinaId=&anio=` | Admin, Entrenador | Deportistas con pagos pendientes |
| `GET` | `/api/pagos/deportista/:id` | Admin, Entrenador | Historial de pagos de un deportista |
| `POST` | `/api/pagos` | Admin | Registrar pago manual |
| `PATCH` | `/api/pagos/:id/anular` | Admin | Anular pago |
| `GET` | `/api/pagos/reporte?formato=excel&mes=&anio=` | Admin | Exportar reporte de ingresos |

### Planilla de Pagos

La planilla se calcula usando la vista materializada `PlanillaPagosAcademia`:

```prisma
model PlanillaPagosAcademia {
  deportista_id    Int
  nombre_completo  String
  tipo_deportista  String
  gestion          Int
  matricula_pagada Boolean
  mes_1_pagado     Boolean   // Enero
  mes_2_pagado     Boolean   // Febrero
  // ... hasta mes_9_pagado (Septiembre)
  total_pagado     Decimal
  saldo_pendiente  Decimal

  @@id([deportista_id, gestion])
}
```

### Optimización de `getPlanilla()`

```
1. Obtener inscripciones activas de la disciplina (1 query)
2. Obtener registros de la vista PlanillaPagosAcademia (1 query)
3. Crear Map<deportista_id, registro>
4. Mapear inscripciones → planilla usando el Map
```

Esto elimina el problema N+1 que existía al hacer una query por deportista.

### Constantes de Negocio

```typescript
MESES_ACADEMICOS = [1, 2, 3, 4, 5, 6, 7, 8, 9]  // Enero a Septiembre
TIPOS_NO_APLICA_PAGO = ['estudiante_ucb', 'competitivo', 'exonerado']
MAX_RESERVA_MINUTES = 180  // 3 horas máximo por reserva
```

---

## 9. Módulo: Mail

### Archivos
- `mail.module.ts`
- `mail.service.ts`
- `templates/reserva-confirmada.hbs`

### Funcionamiento

- Usa **Nodemailer** con configuración SMTP desde variables de entorno
- Templates **Handlebars** compilados y cacheados en memoria
- Método principal: `sendReservaConfirmada(reserva, pdfBuffer)`
- Adjunta el comprobante PDF y el logo UCB como CID inline

### Configuración SMTP

| Variable | Descripción | Default (dev) |
|---|---|---|
| `SMTP_HOST` | Host del servidor SMTP | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | Puerto SMTP | `2525` |
| `SMTP_USER` | Usuario SMTP | — |
| `SMTP_PASS` | Contraseña SMTP | — |
| `SMTP_FROM` | Correo remitente | `noreply@ucb-deportes.dev` |

---

## 10. Módulo: Reportes

### Archivos
- `reportes.module.ts`
- `reportes.service.ts`

### Métodos

| Método | Descripción | Librería |
|---|---|---|
| `generarExcel(titulo, columnas, filas)` | Excel genérico con encabezado estilizado (azul UCB) | ExcelJS |
| `generarPdfTabla(titulo, columnas, filas)` | PDF con tabla genérica, saltos de página con encabezado repetido | PDFKit |

### Uso

Los controllers de `reservas`, `pagos`, `deportistas` y `disciplinas` inyectan `ReportesService` para generar reportes exportables.

---

## 11. Módulo: Health

### Archivos
- `health.module.ts`
- `health.controller.ts`

### Endpoints

| Método | Path | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | No | Status básico del servidor |
| `GET` | `/api/health/ready` | No | Verifica conexión a PostgreSQL |

### Respuestas

```json
// GET /api/health
{ "status": "ok", "timestamp": "2026-06-04T12:00:00.000Z" }

// GET /api/health/ready
{ "status": "ok", "database": "connected", "timestamp": "2026-06-04T12:00:00.000Z" }

// Si la BD no está disponible → 503 Service Unavailable
```

---

## 12. Módulo: Auditoría

### Archivos
- `auditoria.module.ts`
- `auditoria.middleware.ts`
- `auditoria.service.ts`
- `auditoria.controller.ts`

### Funcionamiento

El `AuditoriaMiddleware` intercepta requests de modificación:

1. Solo procesa `POST`, `PATCH`, `DELETE`
2. Detecta la entidad por URL (`/api/reservas` → `reserva`)
3. Determina la acción (`POST` → `CREAR`, `PATCH /estado` → `ACTUALIZAR_ESTADO`, etc.)
4. Extrae el ID de la entidad de la URL
5. Intercepta `res.json()` para capturar el response body
6. Registra en la tabla `auditoria`

### Modelo de Datos

```prisma
model auditoria {
  id              Int      @id @default(autoincrement())
  fecha           DateTime @default(now())
  usuario_email   String   @db.VarChar(150)
  usuario_rol     String   @db.VarChar(50)
  accion          String   @db.VarChar(50)
  entidad         String   @db.VarChar(50)
  entidad_id      Int
  detalle_antes   Json?
  detalle_despues Json?
  ip              String?  @db.VarChar(45)
  correlation_id  String?  @db.VarChar(50)
}
```

### Entidades Auditadas

| Path | Entidad |
|---|---|
| `/api/reservas` | `reserva` |
| `/api/deportistas` | `deportista` |
| `/api/pagos` | `pago` |
| `/api/disciplinas` | `disciplina` |

---

## 13. Módulo: Carreras

### Archivos
- `carreras.module.ts`
- `carreras.controller.ts`
- `carreras.service.ts`

Gestiona las carreras universitarias de la UCB. Los deportistas tipo `estudiante_ucb` están vinculados a una carrera.

---

## 14. DTOs y Validación

Cada módulo con endpoints de escritura define DTOs en su carpeta `dto/`:

| Módulo | DTOs |
|---|---|
| `reservas` | `CreateReservaDto`, `UpdateReservaDto` |
| `deportistas` | `CreateDeportistaDto`, `UpdateDeportistaDto` |
| `disciplinas` | `CreateDisciplinaDto`, `UpdateDisciplinaDto` |
| `pagos` | `CreatePagoDto`, `PaginationDto` |

Los DTOs definen la estructura esperada del request body. NestJS los valida automáticamente con `class-validator` (si están decorados).

---

## 15. Response Mapping

Los servicios usan métodos privados `map*()` para transformar los objetos Prisma (que usan nombres de columna de BD como `id_reserva`) a respuestas API limpias (que usan `id`):

```typescript
// Prisma → API
{ id_reserva: 1, id_espacio: 2 } → { id: 1, espacio_id: 2 }
```

Esto desacopla el modelo de datos del contrato de API.

---

## 16. Testing

### Estructura

```
backend/test/
├── app.e2e-spec.ts           # Test e2e del app
├── jest-e2e.json             # Configuración de Jest
├── test-app.module.ts        # Módulo de test
├── test-auth.middleware.ts   # Mock del AuthMiddleware
└── tsconfig.json
```

### Mock de Prisma

```
backend/src/prisma/__mocks__/prisma.service.ts
```

Se usa para tests unitarios sin necesidad de una base de datos real.

### Comandos

```bash
npm run test           # Tests unitarios
npm run test:watch     # Tests en modo watch
npm run test:cov       # Cobertura de tests
npm run test:e2e       # Tests end-to-end
```

---

## 17. Cómo Agregar un Nuevo Módulo

### Paso 1: Crear la estructura

```bash
nest generate module <nombre>
nest generate controller <nombre>
nest generate service <nombre>
```

### Paso 2: Registrar en `app.module.ts`

```typescript
import { NuevoModule } from './nuevo/nuevo.module';

@Module({
  imports: [
    // ...
    NuevoModule,
  ],
})
export class AppModule {}
```

### Paso 3: Definir el modelo en Prisma

```prisma
// prisma/schema.prisma
model nuevo_modelo {
  id   Int    @id @default(autoincrement())
  // ...
}
```

### Paso 4: Crear migración

```bash
npx prisma migrate dev --name create_nuevo_modelo
npx prisma generate
```

### Paso 5: Implementar controller y service

- Controller: endpoints con decorators `@Get()`, `@Post()`, `@Patch()`, `@Roles()`
- Service: lógica de negocio con inyección de `PrismaService`
- DTOs: validar inputs

### Paso 6: Agregar a auditoría (si aplica)

Agregar el path en `AUDITED_ENTITIES` del `AuditoriaMiddleware`.

---

## 18. Constantes de Negocio

Ubicadas en `src/common/constants/business.constants.ts`:

| Constante | Valor | Uso |
|---|---|---|
| `MESES_NOMBRES` | Array de nombres en español | Formateo de fechas |
| `MESES_MAP` | Map nombre → número | Parseo de meses en reportes |
| `MESES_ACADEMICOS` | `[1..9]` | Planilla de pagos |
| `CAMPOS_MESES_PAGADO` | `['mes_1_pagado', ...]` | Iteración de meses en planilla |
| `MAX_RESERVA_MINUTES` | `180` | Validación de duración de reserva |
| `TIPOS_NO_APLICA_PAGO` | `['estudiante_ucb', 'competitivo', 'exonerado']` | Exoneración de pagos |
| `DEPORTISTA_ROL` | `'deportista'` | Identificación de rol |

---

## 19. Variables de Entorno

| Variable | Descripción | Requerido | Default |
|---|---|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL | Sí | `postgresql://admin_user:admin_password123@localhost:5433/sistema_reservas?schema=public` |
| `PORT` | Puerto del servidor | No | `4000` |
| `CORS_ORIGIN` | Origen permitido para CORS | No | `http://localhost` |
| `ALLOW_DEV_MOCK` | Habilitar mock de auth | No | `false` |
| `SMTP_HOST` | Host SMTP | No | `sandbox.smtp.mailtrap.io` |
| `SMTP_PORT` | Puerto SMTP | No | `2525` |
| `SMTP_USER` | Usuario SMTP | No | — |
| `SMTP_PASS` | Contraseña SMTP | No | — |
| `SMTP_FROM` | Correo remitente | No | `noreply@ucb-deportes.dev` |

---

## 20. Comandos Útiles

```bash
# Desarrollo
npm run start:dev              # Hot reload

# Base de datos
npx prisma studio              # Visor visual de BD
npx prisma migrate dev         # Aplicar migraciones
npx prisma migrate reset       # Resetear BD completa
npx prisma db seed             # Cargar datos iniciales
npx prisma generate            # Regenerar Prisma Client

# Producción
npm run build                  # Compilar TypeScript
npm run start                  # Iniciar servidor

# Tests
npm run test                   # Unitarios
npm run test:e2e               # End-to-end
npm run test:cov               # Con cobertura
```
