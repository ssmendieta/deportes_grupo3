---

## Requisitos previos

Tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

> ⚠️ **Windows:** Si tienes PostgreSQL instalado localmente, debes detenerlo antes de trabajar con el proyecto. Abre PowerShell **como administrador** y ejecuta:
> ```powershell
> Stop-Service -Name "postgresql-x64-13"
> Stop-Service -Name "postgresql-x64-17"
> ```
> Ajusta el nombre del servicio según tu versión instalada. Para ver qué servicios tienes:
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

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Verificar que el contenedor esté corriendo:

```bash
docker compose ps
```

Debe aparecer `grupo3_postgres` con estado **Up**.

### 2. Ejecutar migraciones de Prisma

```bash
cd backend
npx prisma migrate dev
```

### 3. Iniciar el backend

```bash
cd backend
npm run start:dev
```

El backend estará disponible en: `http://localhost:4000`

### 4. Iniciar el frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

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
# Levantar contenedores
docker compose up -d

# Detener contenedores
docker compose down

# Detener y eliminar volúmenes (resetea la base de datos)
docker compose down -v

# Ver logs de la base de datos
docker compose logs db
```

### Prisma

```bash
# Crear una nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones existentes
npx prisma migrate deploy

# Resetear la base de datos
npx prisma migrate reset

# Abrir Prisma Studio (visor de base de datos)
npx prisma studio

# Regenerar el cliente de Prisma
npx prisma generate
```

### Git

```bash
# Crear una rama para tu feature
git checkout -b feature/nombre-feature

# Subir cambios
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/nombre-feature
```

---

## Flujo de trabajo en equipo

1. Siempre trabaja en tu propia rama, **nunca directamente en `main`**
2. Antes de empezar a trabajar, actualiza tu rama:

```bash
   git pull origin main
```

3. Si alguien agrega una migración nueva, corre:

```bash
   npx prisma migrate dev
```

4. Haz Pull Request a `main` cuando tu feature esté lista

---

## Solución de problemas comunes

### Error P1000: Authentication failed

Tienes PostgreSQL instalado localmente en Windows. Sigue las instrucciones de la sección **Requisitos previos** para detenerlo.

### Error: Cannot connect to Docker

Asegúrate de que Docker Desktop esté abierto y corriendo antes de ejecutar `docker compose up -d`.

### Error: Port 5433 already in use

Otro proceso está usando el puerto 5433. Verifica con:

```powershell
netstat -ano | findstr :5433
```

### Error al correr migraciones tras clonar

Asegúrate de haber copiado el `.env` desde `.env.example` y de que Docker esté corriendo.
