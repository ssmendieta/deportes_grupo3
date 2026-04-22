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
├── README.md
├── .gitignore
├── backend/
│ ├── prisma/
│ │ ├── schema.prisma
│ │ ├── migrations/
│ │ └── seed.ts
│ ├── src/
│ │ ├── disciplinas/
│ │ ├── espacios/
│ │ ├── horarios/
│ │ ├── reservas/
│ │ ├── middlewares/
│ │ │ └── auth.middleware.ts
│ │ ├── prisma/
│ │ │ ├── prisma.service.ts
│ │ │ └── prisma.module.ts
│ │ ├── app.module.ts
│ │ └── main.ts
│ ├── prisma.config.ts
│ ├── .env.example
│ ├── Dockerfile
│ ├── package.json
│ └── tsconfig.json
└── frontend/
├── src/
│ ├── components/
│ ├── pages/
│ ├── services/
│ ├── store/
│ └── App.tsx
├── .env.example
├── Dockerfile
└── package.json

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

**Simulado (mientras G1 entrega JWT):**

```
x-rol: admin
```

**Cuando G1 entregue el JWT:**

```
Authorization: Bearer <token>
```

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

> ⚠️ Todos los endpoints de reservas requieren el header `x-rol: admin`

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
  "solicitante_id": 101,
  "deportista_id": 501,
  "fecha": "2026-04-28",
  "hora_inicio": "14:00",
  "hora_fin": "16:00",
  "disciplina_id": 1,
  "motivo": "Entrenamiento Selección Universitaria"
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

| Variable       | Descripción                  | Valor por defecto                                                                         |
| -------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://admin_user:admin_password123@localhost:5433/sistema_reservas?schema=public` |
| `PORT`         | Puerto del servidor          | `4000`                                                                                    |

### Frontend (`frontend/.env`)

| Variable       | Descripción     | Valor por defecto       |
| -------------- | --------------- | ----------------------- |
| `VITE_API_URL` | URL del backend | `http://localhost:4000` |

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
