# Sistema de Reservas de Espacios Deportivos - Grupo 3

Sistema web para la gestión y reserva de espacios deportivos de la UCB, desarrollado con NestJS, React, Prisma v7 y PostgreSQL en Docker.

---

## Tecnologías

- **Backend:** Node.js + NestJS + TypeScript
- **Frontend:** React + TypeScript + Vite
- **Base de datos:** PostgreSQL 15
- **ORM:** Prisma v7
- **Contenedores:** Docker + Docker Compose

---

## Estructura del proyecto

```
proyecto-grupo3/
├── docker-compose.yml
├── package.json (raíz)
├── README.md
│
├── backend/
│ ├── .env.example
│ ├── package.json
│ ├── tsconfig.json
│ ├── prisma.config.ts
│ ├── prisma/
│ │ ├── schema.prisma
│ │ ├── migrations/
│ │ └── seed.ts
│ └── src/
│     ├── main.ts
│     ├── app.module.ts
│     ├── config/
│     │   ├── mail.config.ts
│     │   └── public.pem
│     ├── middleware/
│     │   └── auth.middleware.ts
│     ├── prisma/
│     │   ├── prisma.module.ts
│     │   └── prisma.service.ts
│     ├── mail/
│     │   ├── mail.module.ts
│     │   ├── mail.service.ts
│     │   └── templates/
│     │       └── reserva-confirmada.hbs
│     ├── auth/
│     │   ├── auth.module.ts
│     │   └── auth.controller.ts
│     ├── espacios/
│     │   ├── espacios.module.ts
│     │   ├── espacios.controller.ts
│     │   └── espacios.service.ts
│     ├── horarios/
│     │   ├── horarios.module.ts
│     │   ├── horarios.controller.ts
│     │   └── horarios.service.ts
│     ├── disciplinas/
│     │   ├── disciplinas.module.ts
│     │   ├── disciplinas.controller.ts
│     │   ├── disciplinas.service.ts
│     │   └── dto/
│     │       ├── create-disciplina.dto.ts
│     │       └── update-disciplina.dto.ts
│     ├── deportistas/
│     │   ├── deportistas.module.ts
│     │   ├── deportistas.controller.ts
│     │   ├── deportistas.service.ts
│     │   └── dto/
│     │       ├── create-deportista.dto.ts
│     │       └── update-deportista.dto.ts
│     ├── reservas/
│     │   ├── reserva.module.ts
│     │   ├── reserva.controller.ts
│     │   ├── reservas.service.ts
│     │   └── dto/
│     │       ├── create-reserva.dto.ts
│     │       └── update-reserva.dto.ts
│     └── pagos/
│         ├── pagos.module.ts
│         ├── pagos.controller.ts
│         ├── pagos.service.ts
│         └── dto/
│             └── create-pago.dto.ts
│
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── App.css
        ├── index.css
        ├── assets/
        ├── shared/
        │   ├── components/
        │   ├── services/
        │   ├── utils/
        │   └── types/
        └── features/
            ├── auth/
            ├── dashboard/
            ├── calendario/
            ├── deportistas/
            ├── disciplinas/
            ├── reservas/
            └── pagos/
```

---

## Requisitos previos

Tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

> ⚠️ **Windows:** Si tienes PostgreSQL instalado localmente, debes detenerlo antes de trabajar con el proyecto. Abre PowerShell **como administrador** y ejecuta:
>
> ```powershell
> Stop-Service -Name "postgresql-x64-13"
> Stop-Service -Name "postgresql-x64-17"
> ```
>
> Para ver qué servicios tienes:
>
> ```powershell
> Get-Service -Name postgresql*
> ```

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/proyecto-grupo3.git
cd proyecto-grupo3
```

### 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

---

## Levantar el proyecto

### 1. Iniciar la base de datos con Docker

```bash
docker compose up -d
docker compose ps
```

### 2. Ejecutar migraciones y seed

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 3. Iniciar el backend

```bash
npm run start:dev
```

El backend estará disponible en: `http://localhost:4000`

### 4. Iniciar el frontend

```bash
cd ../frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## API Reference

**Base URL:** `http://localhost:4000`

---

### 🔐 Autenticación

Los endpoints protegidos requieren el header:

```
Authorization: Bearer <token>
```

El token es un JWT firmado con RSA256 por el servidor de autenticación externo. El backend verifica la firma usando una clave pública (`backend/src/config/public.pem`).

**Endpoints públicos** (no requieren auth):
- `GET /api/espacios`
- `GET /api/espacios/:id`
- `GET /api/disciplinas`
- `GET /api/disciplinas/:id`
- `GET /api/horarios-disponibles/:espacioId`

**Endpoints protegidos** (requieren rol `admin`):
- Todos los de `/api/reservas*`
- Todos los de `/api/pagos*`
- Todos los de `/api/deportistas*`
- `POST /api/disciplinas`
- `PATCH /api/disciplinas/*`

#### `POST /api/auth/logout`

Cierra la sesión del lado del servidor.

**Requiere auth:** No (pero si se envía token, se registra el usuario)

**Respuesta:** `204 No Content`

---



### 📍 Espacios — Público

#### `GET /api/espacios`

Lista todos los espacios activos.

**Respuesta:**

```json
[
  {
    "id": 1,
    "nombre": "Coliseo Polideportivo",
    "ubicacion": "Campus Central - Bloque A",
    "capacidad": 150,
    "horario_apertura": "07:00",
    "horario_cierre": "22:00",
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Cancha de Arquitectura",
    "ubicacion": "Facultad de Arquitectura - Exterior",
    "capacidad": 12,
    "horario_apertura": "14:00",
    "horario_cierre": "18:00",
    "activo": true
  }
]
```

#### `GET /api/espacios/:id`

Detalle de un espacio específico.

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Coliseo Polideportivo",
  "ubicacion": "Campus Central - Bloque A",
  "capacidad": 150,
  "horario_apertura": "07:00",
  "horario_cierre": "22:00",
  "activo": true
}
```

**Error 404:**

```json
{
  "message": "Espacio con id 99 no encontrado",
  "statusCode": 404
}
```

---

### 🎯 Disciplinas — Público

#### `GET /api/disciplinas`

Lista todas las disciplinas activas ordenadas por `orden`.

**Respuesta:**

```json
[
  {
    "id": 1,
    "nombre": "Fútsal",
    "descripcion": "Fútbol sala",
    "activo": true,
    "orden": 1
  },
  {
    "id": 2,
    "nombre": "Básquetbol",
    "descripcion": "Baloncesto",
    "activo": true,
    "orden": 2
  },
  {
    "id": 3,
    "nombre": "Voleibol",
    "descripcion": "Vóleibol",
    "activo": true,
    "orden": 3
  },
  {
    "id": 4,
    "nombre": "Ajedrez",
    "descripcion": "Ajedrez",
    "activo": true,
    "orden": 4
  }
]
```

---

### 📅 Horarios Disponibles — Público

#### `GET /api/horarios-disponibles/:espacioId?fecha=YYYY-MM-DD`

Retorna el horario del espacio y los bloques ocupados para una fecha específica.

**Parámetros:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `espacioId` | number | ✅ | ID del espacio |
| `fecha` | string | ✅ | Fecha en formato YYYY-MM-DD |

**Respuesta:**

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

> 💡 El frontend debe mostrar el horario completo del espacio (`horario_apertura` a `horario_cierre`) y marcar los `bloques_ocupados` como no disponibles.
>
> - 🔴 `tipo: "clase"` — bloqueado permanentemente
> - 🟡 `tipo: "reserva"` — reservado ese día

**Error 400 — sin fecha:**

```json
{
  "message": "El parámetro fecha es requerido. Formato: YYYY-MM-DD",
  "statusCode": 400
}
```

**Error 404 — espacio no existe:**

```json
{
  "message": "Espacio con id 99 no encontrado",
  "statusCode": 404
}
```

---

### 📋 Reservas — Protegido (solo admin)

> ⚠️ Todos los endpoints de reservas requieren `Bearer <token>` con rol `admin`

#### `GET /api/reservas`

Lista todas las reservas con filtros opcionales.

**Query params opcionales:**
| Parámetro | Tipo | Descripción |
|---|---|---|
| `espacioId` | number | Filtrar por espacio |
| `fecha` | string | Filtrar por fecha (YYYY-MM-DD) |

**Ejemplos:**

```
GET /api/reservas
GET /api/reservas?fecha=2026-04-28
GET /api/reservas?espacioId=1&fecha=2026-04-28
```

#### `POST /api/reservas`

Crea una nueva reserva. La reserva se crea directamente como `confirmada`.

**Body:**

```json
{
  "espacio_id": 1,
  "fecha": "2026-04-28",
  "hora_inicio": "14:00",
  "hora_fin": "16:00",
  "disciplina_id": 1,
  "motivo": "Entrenamiento Selección Universitaria",
  "nombre_solicitante": "Juan Pérez",
  "carnet": "1234567 LP",
  "email_solicitante": "juan.perez@ucb.edu.bo"
}
```

**Error 409 — conflicto con clase:**

```json
{
  "message": "El horario solicitado (08:00 - 10:00) coincide con un horario de clases",
  "statusCode": 409
}
```

**Error 409 — conflicto con reserva:**

```json
{
  "message": "El horario solicitado (14:00 - 16:00) ya está reservado",
  "statusCode": 409
}
```

#### `GET /api/reservas/:id`

Detalle de una reserva específica.

#### `PATCH /api/reservas/:id`

Actualiza el estado de una reserva.

**Body:**

```json
{
  "estado": "cancelada"
}
```

> Estados posibles: `confirmada`, `cancelada`

**Error 409 — reserva ya cancelada:**

```json
{
  "message": "No se puede modificar una reserva que ya está cancelada",
  "statusCode": 409
}
```

#### `GET /api/reservas/:id/comprobante`

Genera y descarga el comprobante PDF de la reserva.

> ⏳ En desarrollo

---

### 👤 Deportistas — Protegido (solo admin)

> ⚠️ Todos los endpoints de deportistas requieren `Bearer <token>` con rol `admin`

#### `GET /api/deportistas`

Lista paginada de deportistas con filtros opcionales.

**Query params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `page` | number | No | Número de página (default: 1) |
| `limit` | number | No | Resultados por página (default: 20) |
| `tipo` | string | No | Filtrar por tipo: `academia`, `competitivo`, `estudiante_ucb` |
| `disciplinaId` | number | No | Filtrar por disciplina |
| `activo` | boolean | No | Filtrar por estado activo/inactivo |

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "tipo": "academia",
      "ci": "10011001",
      "nombre_completo": "Martín Quispe Flores",
      "estado_cuenta": "al_dia",
      "deuda": 0,
      "inscripciones": [ ... ]
    }
  ],
  "total": 13,
  "page": 1,
  "limit": 20
}
```

#### `GET /api/deportistas/buscar?ci=12345678`

Busca un deportista por su Cédula de Identidad.

**Respuesta:** Objeto deportista o `404`

#### `GET /api/deportistas/:id`

Detalle completo de un deportista.

#### `POST /api/deportistas`

Registra un nuevo deportista. Opcionalmente crea una inscripción automática.

**Body:**
```json
{
  "tipo": "estudiante_ucb",
  "ci": "12345678",
  "nombre_completo": "Juan Pérez",
  "carrera": "Ingeniería de Sistemas",
  "semestre": 5,
  "fecha_nacimiento": "2002-04-15",
  "genero": "masculino",
  "telefono": "+591 71234567",
  "email": "juan.perez@ucb.edu.bo",
  "disciplinaId": 1,
  "categoria": "Mayores",
  "nivel": "Intermedio"
}
```

> `carrera` y `semestre` son requeridos solo si `tipo === "estudiante_ucb"`

#### `PATCH /api/deportistas/:id`

Actualiza parcialmente los datos de un deportista.

#### `PATCH /api/deportistas/:id/estado`

Activa o desactiva un deportista (soft-delete).

**Body:**
```json
{
  "activo": false
}
```

#### `POST /api/deportistas/:id/inscripciones`

Inscribe un deportista en una disciplina.

**Body:**
```json
{
  "disciplinaId": 1,
  "categoria": "Mayores",
  "nivel": "Intermedio"
}
```

#### `GET /api/deportistas/:id/inscripciones`

Obtiene todas las inscripciones (activas e inactivas) de un deportista.

---

### 💰 Pagos — Protegido (solo admin)

> ⚠️ Todos los endpoints de pagos requieren `Bearer <token>` con rol `admin`

#### `GET /api/pagos/conceptos`

Lista los conceptos de pago disponibles.

**Query params:**
| Parámetro | Tipo | Descripción |
|---|---|---|
| `disciplinaId` | number | Filtrar por disciplina |

#### `GET /api/pagos/planilla?disciplinaId=1&anio=2026`

Obtiene la planilla de pagos de una disciplina para un año específico.

**Respuesta:** Lista de deportistas con su estado de planilla (matrícula, meses pagados, saldo pendiente).

#### `GET /api/pagos/morosos`

Lista deportistas con pagos pendientes.

**Query params:**
| Parámetro | Tipo | Descripción |
|---|---|---|
| `disciplinaId` | number | Filtrar por disciplina |
| `anio` | number | Filtrar por año |

#### `GET /api/pagos/deportista/:id`

Historial de pagos de un deportista específico.

#### `POST /api/pagos`

Registra un pago manual. Actualiza automáticamente la planilla del deportista.

**Body:**
```json
{
  "deportista_id": 1,
  "concepto_id": 2,
  "monto": 120.0,
  "mes": 3,
  "anio": 2026,
  "fecha_pago": "2026-04-30",
  "comprobante": "REC-001",
  "observaciones": "Pago en efectivo"
}
```

> Si `mes` se omite, se registra como pago de matrícula.

#### `PATCH /api/pagos/:id/anular`

Anula un pago existente y revierte los cambios en la planilla.

**Error 409:** El pago ya está anulado.

---

### 🎯 Disciplinas — Mixto (público + protegido)

#### `GET /api/disciplinas` — Público

Lista todas las disciplinas. Opcionalmente filtrar por activas.

**Query params:**
| Parámetro | Tipo | Descripción |
|---|---|---|
| `activo` | boolean | Filtrar solo activas (`true`) |

#### `GET /api/disciplinas/:id` — Público

Detalle de una disciplina.

#### `POST /api/disciplinas` — Protegido

Crea una nueva disciplina deportiva.

**Body:**
```json
{
  "nombre": "Voleibol",
  "descripcion": "Deporte de conjunto",
  "categorias": "Mayores, Sub-17",
  "mensualidad": 120,
  "orden": 1
}
```

#### `PATCH /api/disciplinas/:id` — Protegido

Actualiza parcialmente una disciplina.

#### `PATCH /api/disciplinas/:id/estado` — Protegido

Activa o desactiva una disciplina.

**Body:**
```json
{
  "activo": false
}
```

---

## Códigos de error estándar

| Código | Descripción                                      |
| ------ | ------------------------------------------------ |
| 200    | OK                                               |
| 201    | Creado correctamente                             |
| 400    | Datos inválidos o faltantes                      |
| 401    | No autorizado — falta el header de autenticación |
| 403    | Prohibido — no tienes permisos                   |
| 404    | Recurso no encontrado                            |
| 409    | Conflicto — horario ocupado o estado inválido    |
| 500    | Error interno del servidor                       |

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable        | Descripción                             | Valor por defecto                                                                         |
| --------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | URL de conexión a PostgreSQL            | `postgresql://admin_user:admin_password123@localhost:5433/sistema_reservas?schema=public` |
| `PORT`          | Puerto del servidor                     | `4000`                                                                                    |
| `SMTP_HOST`     | Host del servidor SMTP                  | `smtp.ucb.edu.bo`                                                                         |
| `SMTP_PORT`     | Puerto SMTP                             | `587`                                                                                     |
| `SMTP_USER`     | Usuario SMTP (correo remitente)         | `sistema.deportes@ucb.edu.bo`                                                             |
| `SMTP_PASS`     | Contraseña SMTP                         | *(sin valor por defecto)*                                                                 |
| `SMTP_FROM`     | Dirección de correo remitente           | `sistema.deportes@ucb.edu.bo`                                                             |

### Frontend (`frontend/.env`)

| Variable       | Descripción     | Valor por defecto       |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | URL del backend | `http://localhost:4000` |

---

## Decisiones de diseño

### JWT RS256 (asimétrico)
El backend autentica con RSA256 usando una clave pública (`public.pem`) provista por el equipo externo de autenticación. El frontend nunca maneja la clave privada. En desarrollo, si no hay `public.pem`, el middleware usa un mock para pruebas locales.

### Hash vs Query para el token
El token se pasa del login OAuth al SPA mediante `#hash` (fragmento de URL), no `?query`. Esto evita que el token quede expuesto en logs del servidor, cabeceras `Referer` o historial del navegador.

### sessionStorage vs localStorage
El token se almacena en `sessionStorage` en vez de `localStorage` para limitar la exposición: el token se invalida al cerrar la pestaña, reduciendo la ventana de ataque en caso de XSS.

### Soft-delete en deportistas y disciplinas
No se eliminan registros físicamente. Se usa el campo `activo` para deshabilitar entidades, preservando la integridad referencial de reservas históricas e inscripciones.

### Planilla de pagos optimizada
El cálculo de `getPlanilla()` carga todos los pagos y conceptos en una sola consulta (`findMany`) y los procesa en memoria con un `Map`, eliminando el problema N+1 que existía con consultas por deportista.

### Transacciones atómicas en pagos
El registro y anulación de pagos envuelven todas las operaciones (crear pago + actualizar planilla) en una transacción Prisma, garantizando consistencia entre tablas.

### Sidecar de email
El envío de correos de confirmación se lanza con `.catch()` sin bloquear la respuesta HTTP. Si el SMTP falla, el usuario recibe su comprobante igual, y el error se registra en el Logger.

### Migración de Prisma versionada
Todas las migraciones se crean con `prisma migrate dev --name ...` y se incluyen en el repositorio. No se usa `push` en producción para evitar pérdida de datos.

---

## Comandos útiles

### Docker

```bash
docker compose up -d        # Levantar contenedores
docker compose down         # Detener contenedores
docker compose down -v      # Detener y eliminar volúmenes
docker compose logs db      # Ver logs de la base de datos
docker compose ps           # Ver estado de contenedores
```

### Prisma

```bash
npx prisma migrate dev --name nombre    # Nueva migración
npx prisma migrate reset                # Resetear base de datos
npx prisma db seed                      # Correr seed
npx prisma generate                     # Regenerar cliente
npx prisma studio                       # Abrir visor de BD
```

### Backend

```bash
npm run start:dev    # Modo desarrollo con hot reload
npm run build        # Compilar para producción
npm run start        # Iniciar en producción
```

---

## Flujo de trabajo en equipo

1. Siempre trabaja en tu propia rama, **nunca directamente en `main`**
2. Antes de empezar actualiza tu rama:
   ```bash
   git pull origin main
   ```
3. Si alguien agrega una migración nueva:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Haz Pull Request a `main` cuando tu feature esté lista

---

## Solución de problemas comunes

### Error P1000: Authentication failed

Tienes PostgreSQL instalado localmente. Detén el servicio como administrador:

```powershell
Stop-Service -Name "postgresql-x64-17"
```

### Cannot GET /api/...

El módulo no se registró. Borra la carpeta `dist` y reinicia:

```powershell
Remove-Item -Recurse -Force dist
npm run start:dev
```

### Endpoint devuelve `[]`

El seed no se corrió. Ejecuta:

```powershell
npx prisma db seed
```

---
