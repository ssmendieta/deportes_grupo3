# API Reference — Sistema de Gestión Deportiva UCB

> **Base URL:** `http://localhost:4000` | **Versión:** 1.0 | **Autenticación:** JWT RS256 Bearer Token

---

## 1. Autenticación

### Header de Autenticación

Todos los endpoints protegidos requieren:

```
Authorization: Bearer <token>
```

El token es un JWT firmado con **RSA256** por el servidor OAuth externo de la UCB.

### Endpoints Públicos (sin token)

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/health/ready` | Health check con BD |

### Endpoints con token opcional

| Método | Path | Descripción |
|---|---|---|
| `GET` | `/api/espacios` | Lista espacios (todos los roles) |
| `GET` | `/api/espacios/:id` | Detalle espacio (todos los roles) |
| `GET` | `/api/horarios-disponibles/:espacioId` | Disponibilidad (todos los roles) |
| `GET` | `/api/disciplinas` | Lista disciplinas (todos los roles) |
| `GET` | `/api/disciplinas/:id` | Detalle disciplina (todos los roles) |

### Matriz de Roles por Endpoint

| Endpoint | admin | entrenador | delegado | deportista |
|---|---|---|---|---|
| `/api/espacios/*` | ✅ R/W | ✅ R | ✅ R | ✅ R |
| `/api/horarios-disponibles/*` | ✅ R | ✅ R | ✅ R | ✅ R |
| `/api/disciplinas` (GET) | ✅ R | ✅ R | ✅ R | ✅ R |
| `/api/disciplinas` (POST/PATCH) | ✅ W | ❌ | ❌ | ❌ |
| `/api/deportistas/*` | ✅ R/W | ✅ R/W | ❌ | ❌ |
| `/api/reservas/*` | ✅ R/W | ✅ R/W | ❌ | ❌ |
| `/api/pagos` (GET) | ✅ R | ✅ R | ❌ | ❌ |
| `/api/pagos` (POST/PATCH) | ✅ W | ❌ | ❌ | ❌ |
| `/api/auth/logout` | ✅ | ✅ | ✅ | ✅ |
| `/api/health/*` | ✅ | ✅ | ✅ | ✅ |

---

## 2. Respuestas de Error Estándar

Todos los errores siguen este formato:

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas"
}
```

### Códigos de Error

| Código | Significado | Cuándo se retorna |
|---|---|---|
| `200` | OK | Request exitoso |
| `201` | Created | Recurso creado exitosamente |
| `204` | No Content | Logout exitoso |
| `400` | Bad Request | Datos inválidos o faltantes (validación DTO) |
| `401` | Unauthorized | Token ausente, inválido o expirado |
| `403` | Forbidden | Rol no autorizado para el endpoint |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto de horario, estado inválido, duplicado |
| `429` | Too Many Requests | Rate limit excedido (100 req/min) |
| `500` | Internal Server Error | Error interno del servidor |
| `503` | Service Unavailable | Base de datos no disponible |

---

## 3. Autenticación

### `POST /api/auth/logout`

Cierra la sesión del lado del servidor.

**Auth:** Token opcional (si se envía, registra el usuario en logs)

**Headers:**
```
Authorization: Bearer <token>  (opcional)
```

**Response:** `204 No Content`

**Ejemplo:**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## 4. Health Checks

### `GET /api/health`

Verifica que el servidor está corriendo.

**Auth:** No requerida

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-04T12:00:00.000Z"
}
```

### `GET /api/health/ready`

Verifica conexión a PostgreSQL.

**Auth:** No requerida

**Response 200:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-06-04T12:00:00.000Z"
}
```

**Response 503:**
```json
{
  "statusCode": 503,
  "message": "Database not available",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/health/ready"
}
```

---

## 5. Espacios

### `GET /api/espacios`

Lista todos los espacios físicos activos.

**Auth:** Token requerido (cualquier rol)

**Response 200:**
```json
[
  {
    "id": 1,
    "nombre_espacio": "Coliseo Polideportivo",
    "hora_apertura": "1970-01-01T07:00:00.000Z",
    "horario_cierre": "1970-01-01T22:00:00.000Z",
    "activo": true
  },
  {
    "id": 2,
    "nombre_espacio": "Cancha de Arquitectura",
    "hora_apertura": "1970-01-01T14:00:00.000Z",
    "horario_cierre": "1970-01-01T18:00:00.000Z",
    "activo": true
  }
]
```

### `GET /api/espacios/:id`

Detalle de un espacio específico.

**Auth:** Token requerido (cualquier rol)

**Path Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | number | ✅ | ID del espacio |

**Response 200:**
```json
{
  "id": 1,
  "nombre_espacio": "Coliseo Polideportivo",
  "hora_apertura": "1970-01-01T07:00:00.000Z",
  "horario_cierre": "1970-01-01T22:00:00.000Z",
  "activo": true
}
```

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "No existe el espacio con id 99",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/espacios/99"
}
```

---

## 6. Horarios Disponibles

### `GET /api/horarios-disponibles/:espacioId`

Retorna el horario del espacio y los bloques ocupados para una fecha.

**Auth:** Token requerido (cualquier rol)

**Path Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `espacioId` | number | ✅ | ID del espacio |

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `fecha` | string | ✅ | Fecha en formato YYYY-MM-DD |

**Response 200:**
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

**Response 400:**
```json
{
  "statusCode": 400,
  "message": "El parámetro fecha es requerido.",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/horarios-disponibles/1"
}
```

**Tipos de Bloques:**

| Tipo | Color | Descripción |
|---|---|---|
| `clase` | 🔴 | Bloqueado permanentemente por horario de clases |
| `reserva` | 🟡 | Reservado solo para esa fecha específica |

---

## 7. Disciplinas

### `GET /api/disciplinas`

Lista todas las disciplinas deportivas.

**Auth:** Token requerido (cualquier rol)

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `activo` | string | No | `"true"` para solo activas, `"false"` para solo inactivas |

**Response 200:**
```json
[
  {
    "id_disciplina": 1,
    "nombre_disciplina": "Fútsal",
    "activo": true
  },
  {
    "id_disciplina": 2,
    "nombre_disciplina": "Básquetbol",
    "activo": true
  },
  {
    "id_disciplina": 3,
    "nombre_disciplina": "Voleibol",
    "activo": true
  },
  {
    "id_disciplina": 4,
    "nombre_disciplina": "Ajedrez",
    "activo": true
  }
]
```

### `GET /api/disciplinas/:id`

Detalle de una disciplina.

**Auth:** Token requerido (cualquier rol)

**Path Params:**
| Parámetro | Tipo | Requerido |
|---|---|---|
| `id` | number | ✅ |

**Response 200:**
```json
{
  "id_disciplina": 1,
  "nombre_disciplina": "Fútsal",
  "activo": true
}
```

### `POST /api/disciplinas`

Crea una nueva disciplina.

**Auth:** Token requerido, rol `admin`

**Body:**
```json
{
  "nombre_disciplina": "Tenis de Mesa"
}
```

**Validaciones:**
| Campo | Tipo | Reglas |
|---|---|---|
| `nombre_disciplina` | string | 2-50 caracteres |

**Response 201:**
```json
{
  "id_disciplina": 5,
  "nombre_disciplina": "Tenis de Mesa",
  "activo": true
}
```

### `PATCH /api/disciplinas/:id`

Actualiza parcialmente una disciplina.

**Auth:** Token requerido, rol `admin`

**Body (todos opcionales):**
```json
{
  "nombre_disciplina": "Tenis de Mesa Actualizado"
}
```

**Response 200:** Objeto disciplina actualizado.

### `PATCH /api/disciplinas/:id/estado`

Activa o desactiva una disciplina (soft-delete).

**Auth:** Token requerido, rol `admin`

**Body:**
```json
{
  "activo": false
}
```

**Response 200:** Objeto disciplina con nuevo estado.

### `GET /api/disciplinas/reporte`

Exporta reporte de disciplinas en Excel o PDF.

**Auth:** Token requerido, rol `admin`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `formato` | string | ✅ | `"excel"` o `"pdf"` |
| `estado` | string | No | `"activas"`, `"inactivas"`, `"todas"` |

**Response:** Archivo descargable (`.xlsx` o `.pdf`)

---

## 8. Deportistas

### `GET /api/deportistas`

Lista paginada de deportistas con filtros opcionales.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Query Params:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `20` | Resultados por página |
| `tipo` | string | No | — | `academia`, `competitivo`, `estudiante_ucb`, `exonerado` |
| `disciplinaId` | number | No | — | Filtrar por disciplina |
| `activo` | string | No | — | `"true"` o `"false"` |

**Response 200:**
```json
{
  "data": [
    {
      "id_deportista": 1,
      "id_persona": 1,
      "tipo_deportista": "academia",
      "nombre_completo": "Martín Quispe Flores",
      "ci": 10011001,
      "complemento": "LP",
      "celular": "+591 71234567",
      "email": "martin.quispe@email.com",
      "activo": true,
      "carrera": null,
      "semestre": null,
      "estado_cuenta": "al_dia",
      "deuda": 0,
      "inscripciones": [
        {
          "id_inscripcion": 1,
          "disciplina": "Fútsal",
          "categoria": "Mayores",
          "estado": "activo",
          "fecha_inscripcion": "2026-01-15"
        }
      ]
    }
  ],
  "total": 13,
  "page": 1,
  "limit": 20
}
```

### `GET /api/deportistas/buscar`

Busca un deportista por su Cédula de Identidad.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `ci` | string | ✅ | Número de CI |

**Response 200:** Objeto deportista completo.

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "Deportista con CI 99999999 no encontrado",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/deportistas/buscar"
}
```

### `GET /api/deportistas/:id`

Detalle completo de un deportista.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Path Params:**
| Parámetro | Tipo | Requerido |
|---|---|---|
| `id` | number | ✅ |

**Response 200:** Objeto deportista con inscripciones e historial.

### `POST /api/deportistas`

Registra un nuevo deportista. Opcionalmente crea una inscripción automática.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Body:**
```json
{
  "nombres": "Juan Carlos",
  "ape_paterno": "Saravia",
  "ape_materno": "Mamani",
  "ci": 12345678,
  "complemento": "LP",
  "celular": "+591 71234567",
  "fecha_nacimiento": "2000-04-15",
  "tipo_deportista": "estudiante_ucb",
  "talla_ropa": "M",
  "id_carrera": 1,
  "semestre": 5,
  "est_regular": true,
  "email": "juan.mamani@ucb.edu.bo",
  "disciplinaId": 3,
  "id_categoria": 1
}
```

**Validaciones:**
| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `nombres` | string | ✅ | No vacío |
| `ape_paterno` | string | ✅ | No vacío |
| `ape_materno` | string | ✅ | No vacío |
| `ci` | number | ✅ | Entero positivo, único |
| `complemento` | string | No | Máx 5 chars |
| `celular` | string | ✅ | No vacío |
| `fecha_nacimiento` | string | ✅ | Formato ISO date |
| `tipo_deportista` | string | ✅ | `academia`, `competitivo`, `estudiante_ucb`, `exonerado` |
| `talla_ropa` | string | No | — |
| `id_carrera` | number | Condicional | Requerido si `tipo_deportista === "estudiante_ucb"` |
| `semestre` | number | Condicional | 1-12, requerido si `tipo_deportista === "estudiante_ucb"` |
| `est_regular` | boolean | No | Default: false |
| `colegio_instituto` | string | Condicional | Requerido si `tipo_deportista === "competitivo"` |
| `curso` | string | No | — |
| `email` | string | No | Formato email válido |
| `disciplinaId` | number | No | Para inscripción automática |
| `id_categoria` | number | No | Para inscripción automática |

**Response 201:** Objeto deportista creado.

**Response 409:**
```json
{
  "statusCode": 409,
  "message": "Ya existe un deportista con CI 12345678",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/deportistas"
}
```

### `PATCH /api/deportistas/:id`

Actualiza parcialmente los datos de un deportista.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Body:** Cualquiera de los campos del `CreateDeportistaDto` (todos opcionales).

**Response 200:** Objeto deportista actualizado.

### `PATCH /api/deportistas/:id/estado`

Activa o desactiva un deportista (soft-delete).

**Auth:** Token requerido, rol `admin`

**Body:**
```json
{
  "activo": false
}
```

**Response 200:** Objeto deportista con nuevo estado.

### `POST /api/deportistas/:id/inscripciones`

Inscribe un deportista en una disciplina.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Path Params:**
| Parámetro | Tipo | Requerido |
|---|---|---|
| `id` | number | ✅ | ID del deportista |

**Body:**
```json
{
  "disciplinaId": 3,
  "id_categoria": 1
}
```

**Response 201:** Inscripción creada.

**Response 409:**
```json
{
  "statusCode": 409,
  "message": "El deportista ya tiene una inscripción activa en esta disciplina",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/deportistas/1/inscripciones"
}
```

### `GET /api/deportistas/:id/inscripciones`

Obtiene todas las inscripciones (activas e inactivas) de un deportista.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Response 200:**
```json
[
  {
    "id_inscripcion": 1,
    "id_deportista": 1,
    "id_disciplina": 3,
    "id_categoria": 1,
    "fecha_inscripcion": "2026-01-15",
    "estado": "activo",
    "fecha_baja": null,
    "motivo_baja": null,
    "disciplina": {
      "id_disciplina": 3,
      "nombre_disciplina": "Voleibol"
    },
    "categoria": {
      "id_categoria": 1,
      "nombre_categoria": "Mayores"
    }
  }
]
```

### `GET /api/deportistas/reporte`

Exporta reporte de deportistas en Excel o PDF.

**Auth:** Token requerido, rol `admin`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `formato` | string | ✅ | `"excel"` o `"pdf"` |
| `tipo` | string | No | `estudiante_ucb`, `academia`, `competitivo` |
| `busqueda` | string | No | Buscar por nombre o CI |

**Response:** Archivo descargable (`.xlsx` o `.pdf`)

---

## 9. Reservas

### `GET /api/reservas`

Lista paginada de reservas con filtros opcionales.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Query Params:**
| Parámetro | Tipo | Requerido | Default | Descripción |
|---|---|---|---|---|
| `espacioId` | number | No | — | Filtrar por espacio |
| `fecha` | string | No | — | Filtrar por fecha (YYYY-MM-DD) |
| `page` | number | No | `1` | Número de página |
| `limit` | number | No | `50` | Resultados por página |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "id_reserva": 1,
      "espacio_id": 1,
      "id_espacio": 1,
      "id_persona_aprobador": 1,
      "fecha_reserva": "2026-05-20T12:00:00.000Z",
      "hora_inicio": "14:00",
      "hora_fin": "16:00",
      "tipo_reserva": "entrenamiento",
      "motivo": "Entrenamiento de equipo",
      "estado": "Pendiente",
      "nombre_solicitante": "Juan Pérez",
      "ci": 12345678,
      "complemento": "LP",
      "correo_solicitante": "juan.perez@ucb.edu.bo",
      "espacio_nombre": "Coliseo Polideportivo",
      "espacio": {
        "id": 1,
        "nombre": "Coliseo Polideportivo",
        "horario_apertura": "07:00",
        "horario_cierre": "22:00",
        "activo": true
      },
      "aprobador_nombre": "Admin Sistema"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 50
}
```

### `GET /api/reservas/:id`

Detalle de una reserva específica.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Path Params:**
| Parámetro | Tipo | Requerido |
|---|---|---|
| `id` | number | ✅ |

**Response 200:** Objeto reserva completo (mismo formato que un item del listado).

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "Reserva con id 99 no encontrada",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas/99"
}
```

### `POST /api/reservas`

Crea una nueva reserva. Valida disponibilidad y conflictos.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Body:**
```json
{
  "espacio_id": 1,
  "fecha_reserva": "2026-05-20",
  "hora_inicio": "14:00",
  "hora_fin": "16:00",
  "tipo_reserva": "entrenamiento",
  "motivo": "Entrenamiento de equipo",
  "nombre_solicitante": "Juan Pérez",
  "ci": 12345678,
  "complemento": "LP",
  "correo_solicitante": "juan.perez@ucb.edu.bo",
  "id_persona_aprobador": 1
}
```

**Validaciones:**
| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `espacio_id` | number | ✅ | Entero positivo, debe existir |
| `fecha_reserva` | string | ✅ | Formato ISO date (YYYY-MM-DD) |
| `hora_inicio` | string | ✅ | Formato HH:MM |
| `hora_fin` | string | ✅ | Formato HH:MM, debe ser > hora_inicio |
| `tipo_reserva` | string | ✅ | — |
| `motivo` | string | ✅ | 3-200 caracteres |
| `nombre_solicitante` | string | ✅ | Mínimo 2 caracteres |
| `ci` | number | ✅ | Entero positivo |
| `complemento` | string | No | — |
| `correo_solicitante` | string | No | Para envío de comprobante por email |
| `id_persona_aprobador` | number | ✅ | Entero positivo |

**Reglas de Negocio:**
- Duración máxima: 180 minutos (3 horas)
- Horario debe estar dentro del horario del espacio
- No puede coincidir con bloque de clase (`plantilla_horarios_fijos`)
- No puede coincidir con otra reserva confirmada

**Response 201:** Objeto reserva creada.

**Response 409 — Conflicto con clase:**
```json
{
  "statusCode": 409,
  "message": "El horario (08:00 - 10:00) coincide con un horario de clases",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas"
}
```

**Response 409 — Conflicto con reserva:**
```json
{
  "statusCode": 409,
  "message": "El horario (14:00 - 16:00) ya está reservado",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas"
}
```

**Response 409 — Fuera de horario:**
```json
{
  "statusCode": 409,
  "message": "El horario solicitado está fuera del horario del espacio (07:00 - 22:00)",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas"
}
```

**Response 400 — Duración inválida:**
```json
{
  "statusCode": 400,
  "message": "La hora de fin debe ser mayor a la hora de inicio",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas"
}
```

**Response 400 — Duración excesiva:**
```json
{
  "statusCode": 400,
  "message": "La reserva no puede durar más de 3 horas",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas"
}
```

### `PATCH /api/reservas/:id`

Actualiza el estado o datos de una reserva.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Body (todos opcionales):**
```json
{
  "estado": "confirmada",
  "motivo": "Entrenamiento actualizado",
  "hora_inicio": "15:00",
  "hora_fin": "17:00"
}
```

**Estados posibles:** `Pendiente`, `confirmada`, `cancelada`

**Reglas:**
- No se puede modificar una reserva ya cancelada
- Si se cambian horarios, se re-validan conflictos

**Response 200:** Objeto reserva actualizado.

**Response 409:**
```json
{
  "statusCode": 409,
  "message": "La reserva #5 ya se encuentra cancelada",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas/5"
}
```

### `GET /api/reservas/:id/comprobante`

Genera y descarga el comprobante PDF de la reserva.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Path Params:**
| Parámetro | Tipo | Requerido |
|---|---|---|
| `id` | number | ✅ |

**Response:** Archivo PDF descargable

**Headers de respuesta:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=comprobante-reserva-1.pdf
Content-Length: 45678
```

### `GET /api/reservas/reporte`

Exporta reporte de reservas en Excel o PDF.

**Auth:** Token requerido, rol `admin`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `formato` | string | ✅ | `"excel"` o `"pdf"` |
| `desde` | string | No | Fecha inicio (YYYY-MM-DD) |
| `hasta` | string | No | Fecha fin (YYYY-MM-DD) |
| `estado` | string | No | `confirmada`, `cancelada`, `Pendiente`, `todos` |

**Response:** Archivo descargable (`.xlsx` o `.pdf`)

---

## 10. Pagos

### `GET /api/pagos`

Lista paginada de pagos registrados.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Query Params:**
| Parámetro | Tipo | Requerido | Default |
|---|---|---|---|
| `page` | number | No | `1` |
| `limit` | number | No | `20` |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "id_pago": 1,
      "id_persona_pago": 1,
      "id_deportista_beneficiario": 1,
      "id_concepto": 2,
      "id_transaccion_caja": "CAJA-001",
      "monto_pagado": 120.00,
      "monto": 120.00,
      "fecha_pago": "2026-04-30",
      "mes_correspondiente": 3,
      "gestion": 2026,
      "estado_factura": "Activa",
      "estado": "Activa",
      "concepto": {
        "id": 2,
        "nombre": "Mensualidad Abril"
      }
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

### `GET /api/pagos/conceptos`

Lista los conceptos de pago disponibles.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `disciplinaId` | number | No | Filtrar por disciplina |

**Response 200:**
```json
[
  {
    "id": 1,
    "nombre": "Matrícula",
    "monto": 200.00,
    "activo": true,
    "disciplina_id": 1,
    "disciplina_nombre": "Fútsal"
  },
  {
    "id": 2,
    "nombre": "Mensualidad",
    "monto": 120.00,
    "activo": true,
    "disciplina_id": 1,
    "disciplina_nombre": "Fútsal"
  }
]
```

### `GET /api/pagos/planilla`

Obtiene la planilla de pagos de una disciplina para un año.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `disciplinaId` | number | ✅ | ID de la disciplina |
| `anio` | number | ✅ | Año (gestión) |

**Response 200:**
```json
[
  {
    "deportista_id": 1,
    "planilla": {
      "deportista_id": 1,
      "gestion": 2026,
      "matricula_pagada": true,
      "mes_1_pagado": true,
      "mes_2_pagado": true,
      "mes_3_pagado": false,
      "mes_4_pagado": false,
      "mes_5_pagado": false,
      "mes_6_pagado": false,
      "mes_7_pagado": false,
      "mes_8_pagado": false,
      "mes_9_pagado": false,
      "total_pagado": 320.00,
      "saldo_pendiente": 760.00
    }
  }
]
```

### `GET /api/pagos/morosos`

Lista deportistas con pagos pendientes.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `disciplinaId` | number | No | Filtrar por disciplina |
| `anio` | number | No | Filtrar por año (default: año actual) |

**Response 200:**
```json
[
  {
    "deportista_id": 5,
    "nombre_completo": "María López",
    "tipo_deportista": "academia",
    "matricula_pendiente": true,
    "meses_pendientes": ["Ene", "Feb", "Mar"],
    "cantidad_meses_pendientes": 3,
    "saldo_pendiente": 560.00
  }
]
```

Ordenado por `saldo_pendiente` descendente.

### `GET /api/pagos/deportista/:id`

Historial de pagos de un deportista.

**Auth:** Token requerido, rol `admin` o `entrenador`

**Path Params:**
| Parámetro | Tipo | Requerido |
|---|---|---|
| `id` | number | ✅ | ID del deportista |

**Response 200:** Lista de pagos ordenados por fecha descendente.

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "Deportista con id 99 no encontrado",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/pagos/deportista/99"
}
```

### `POST /api/pagos`

Registra un pago manual.

**Auth:** Token requerido, rol `admin`

**Body:**
```json
{
  "id_persona_pago": 1,
  "id_deportista_beneficiario": 1,
  "id_concepto": 2,
  "id_transaccion_caja": "CAJA-001",
  "monto_pagado": 120.00,
  "fecha_pago": "2026-04-30",
  "mes_correspondiente": 3,
  "gestion": 2026
}
```

**Validaciones:**
| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `id_persona_pago` | number | ✅ | Entero positivo |
| `id_deportista_beneficiario` | number | ✅ | Entero positivo, debe existir |
| `id_concepto` | number | ✅ | Entero positivo, debe existir |
| `id_transaccion_caja` | string | ✅ | Identificador de transacción |
| `monto_pagado` | number | ✅ | Número positivo |
| `fecha_pago` | string | ✅ | Formato ISO date |
| `mes_correspondiente` | number | ✅ | 1-12 |
| `gestion` | number | ✅ | Año |

**Response 201:** Objeto pago registrado.

**Response 409:**
```json
{
  "statusCode": 409,
  "message": "Ya existe un pago registrado para el mes 3 de la gestión 2026",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/pagos"
}
```

### `PATCH /api/pagos/:id/anular`

Anula un pago existente.

**Auth:** Token requerido, rol `admin`

**Path Params:**
| Parámetro | Tipo | Requerido |
|---|---|---|
| `id` | number | ✅ | ID del pago |

**Response 200:** Objeto pago con `estado_factura: "Anulado"`.

**Response 409:**
```json
{
  "statusCode": 409,
  "message": "El pago con id 5 ya está anulado",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/pagos/5/anular"
}
```

### `GET /api/pagos/reporte`

Exporta reporte de ingresos en Excel o PDF.

**Auth:** Token requerido, rol `admin`

**Query Params:**
| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `formato` | string | ✅ | `"excel"` o `"pdf"` |
| `mes` | string | No | Nombre del mes (`enero`, `febrero`...) o número (1-12) |
| `anio` | string | No | Año del pago |

**Response:** Archivo descargable (`.xlsx` o `.pdf`)

---

## 11. Swagger UI

La documentación interactiva de la API está disponible en:

```
http://localhost:4000/api
```

Se genera automáticamente desde los decorators `@ApiOperation`, `@ApiProperty`, `@ApiQuery`, `@ApiParam`, `@ApiResponse` de NestJS.

---

## 12. Rate Limiting

El backend aplica rate limiting global:

- **Límite:** 100 requests por minuto por IP
- **Configuración:** `@nestjs/throttler` con `ttl: 60000, limit: 100`

**Response 429:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "timestamp": "2026-06-04T12:00:00.000Z",
  "path": "/api/reservas"
}
```

---

## 13. Ejemplos de Uso con cURL

### Crear una reserva

```bash
curl -X POST http://localhost:4000/api/reservas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{
    "espacio_id": 1,
    "fecha_reserva": "2026-05-20",
    "hora_inicio": "14:00",
    "hora_fin": "16:00",
    "tipo_reserva": "entrenamiento",
    "motivo": "Entrenamiento de voleibol",
    "nombre_solicitante": "Ana García",
    "ci": 8765432,
    "complemento": "LP",
    "correo_solicitante": "ana.garcia@ucb.edu.bo",
    "id_persona_aprobador": 1
  }'
```

### Consultar planilla de pagos

```bash
curl "http://localhost:4000/api/pagos/planilla?disciplinaId=1&anio=2026" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

### Exportar reporte de deportistas

```bash
curl "http://localhost:4000/api/deportistas/reporte?formato=excel&tipo=academia" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  --output reporte_deportistas.xlsx
```

### Descargar comprobante PDF

```bash
curl "http://localhost:4000/api/reservas/1/comprobante" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  --output comprobante-reserva-1.pdf
```
