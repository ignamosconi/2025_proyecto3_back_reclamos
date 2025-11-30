# Backend - Sistema de Reclamos

API REST desarrollada con NestJS para la gestión de reclamos, proyectos, usuarios y áreas responsables.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración del Entorno](#configuración-del-entorno)
- [Base de Datos](#base-de-datos)
- [Ejecutar Seeders](#ejecutar-seeders)
- [Ejecutar la Aplicación](#ejecutar-la-aplicación)
- [Documentación de la API](#documentación-de-la-api)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Troubleshooting](#troubleshooting)

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu sistema:

- **Node.js** (versión 18 o superior)
- **npm** (viene incluido con Node.js) o **yarn**
- **MongoDB** (versión 4.4 o superior) - Puede ser local o remoto (MongoDB Atlas)
- **Git** (para clonar el repositorio)

### Verificar Instalaciones

```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
mongod --version  # Debe mostrar la versión de MongoDB
```

## 📦 Instalación

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd proyecto3.back
```

### 2. Instalar Dependencias

```bash
npm install
```

Este comando instalará todas las dependencias necesarias definidas en `package.json`.

## ⚙️ Configuración del Entorno

### 1. Crear Archivo de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de Datos MongoDB
MONGO_URI=mongodb://localhost:27017/reclamos
# O para MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/reclamos?retryWrites=true&w=majority

# Configuración JWT - Autenticación
JWT_ACCESS_SECRET=tu_secret_key_super_segura_para_access_token_minimo_32_caracteres
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=tu_secret_key_super_segura_para_refresh_token_minimo_32_caracteres
JWT_REFRESH_EXPIRATION=7d

# Configuración de Email (Opcional - el sistema funciona sin esto)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=tu_email@gmail.com
MAIL_PASS=tu_app_password
MAIL_FROM=tu_email@gmail.com
```

### 2. Generar Secrets para JWT

**⚠️ IMPORTANTE**: Los secrets de JWT deben ser cadenas seguras y aleatorias. Puedes generarlas usando:

```bash
# En Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# En Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejecuta este comando dos veces para obtener dos secrets diferentes (uno para ACCESS y otro para REFRESH).

### 3. Configurar MongoDB

#### Opción A: MongoDB Local

1. Asegúrate de que MongoDB esté corriendo en tu máquina:

   ```bash
   # En Windows (si está instalado como servicio, se inicia automáticamente)
   # En Linux/Mac
   sudo systemctl start mongod
   # O
   mongod
   ```

2. Verifica la conexión:

   ```bash
   mongosh
   # O en versiones antiguas:
   mongo
   ```

3. En el archivo `.env`, usa:
   ```env
   MONGO_URI=mongodb://localhost:27017/reclamos
   ```

#### Opción B: MongoDB Atlas (Cloud)

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. Obtén la cadena de conexión desde "Connect" → "Connect your application"
4. Reemplaza `<password>` y `<dbname>` en la cadena de conexión
5. En el archivo `.env`, usa la cadena de conexión completa:
   ```env
   MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/reclamos?retryWrites=true&w=majority
   ```

### 4. Configurar Email (Opcional)

El sistema puede funcionar sin configuración de email, pero algunas funcionalidades (como recuperación de contraseña) no estarán disponibles.

**Para Gmail:**

1. Habilita la verificación en 2 pasos
2. Genera una "Contraseña de aplicación" desde tu cuenta de Google
3. Usa esa contraseña en `MAIL_PASS`

**Para otros proveedores:**

- Consulta la documentación de tu proveedor de email para obtener los valores de `MAIL_HOST` y `MAIL_PORT`

## 🗄️ Base de Datos

### Verificar Conexión

Una vez configurado el `.env`, puedes verificar la conexión a MongoDB ejecutando la aplicación (ver sección [Ejecutar la Aplicación](#ejecutar-la-aplicación)).

Si hay errores de conexión, verifica:

- Que MongoDB esté corriendo (si es local)
- Que la cadena de conexión en `.env` sea correcta
- Que las credenciales sean válidas (si es remoto)
- Que no haya problemas de firewall

## 🌱 Ejecutar Seeders

Los seeders poblarán la base de datos con datos iniciales necesarios para el funcionamiento del sistema.

### Ejecutar Todos los Seeders

```bash
npm run seed
```

Este comando ejecutará los siguientes seeders en orden:

1. **AreasSeeder** - Crea las áreas responsables
2. **TipoReclamoSeeder** - Crea los tipos de reclamo
3. **UsersSeeder** - Crea usuarios iniciales
4. **ProyectosSeeder** - Crea proyectos de ejemplo
5. **ReclamosSeeder** - Crea reclamos de ejemplo
6. **HistorialReclamosSeeder** - Crea historial de reclamos
7. **EncuestaSeeder** - Crea encuestas de ejemplo
8. **SintesisSeeder** - Crea síntesis de ejemplo
9. **ComentarioSeeder** - Crea comentarios de ejemplo

### ⚠️ Importante

- **Ejecuta los seeders solo una vez** al configurar el proyecto por primera vez
- Si necesitas resetear la base de datos, elimina la base de datos y vuelve a ejecutar los seeders:

  ```bash
  # Conectarse a MongoDB
  mongosh
  # O
  mongo

  # Dentro de MongoDB shell
  use reclamos
  db.dropDatabase()
  exit

  # Luego ejecutar los seeders nuevamente
  npm run seed
  ```

## 🚀 Ejecutar la Aplicación

### Modo Desarrollo (con hot-reload)

```bash
npm run start:dev
```

O también puedes usar:

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### Modo Producción

1. Primero, compila el proyecto:

   ```bash
   npm run build
   ```

2. Luego, ejecuta la aplicación:
   ```bash
   npm run start:prod
   ```

### Modo Debug

```bash
npm run start:debug
```

## 📚 Documentación de la API

Una vez que la aplicación esté corriendo, puedes acceder a la documentación interactiva de Swagger en:

**http://localhost:3000/api**

Esta documentación incluye:

- Todos los endpoints disponibles
- Parámetros requeridos y opcionales
- Ejemplos de requests y responses
- Posibilidad de probar los endpoints directamente desde el navegador

## 📁 Estructura del Proyecto

```
proyecto3.back/
├── src/
│   ├── areasResponsables/    # Módulo de áreas responsables
│   ├── auth/                  # Módulo de autenticación y JWT
│   ├── comentario/            # Módulo de comentarios
│   ├── dashboard/             # Módulo de dashboard y estadísticas
│   ├── encuesta/              # Módulo de encuestas
│   ├── historial/             # Módulo de historial
│   ├── mailer/                # Servicio de envío de emails
│   ├── proyectos/             # Módulo de proyectos
│   ├── reclamo/               # Módulo principal de reclamos
│   ├── seeders/               # Seeders para poblar la base de datos
│   ├── sintesis/              # Módulo de síntesis
│   ├── tipoReclamo/           # Módulo de tipos de reclamo
│   ├── users/                 # Módulo de usuarios
│   ├── app.module.ts          # Módulo principal
│   └── main.ts                # Punto de entrada de la aplicación
├── dist/                      # Código compilado (generado)
├── test/                      # Tests end-to-end
├── postman/                   # Colecciones de Postman
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Scripts Disponibles

| Comando               | Descripción                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run seed`        | Ejecuta todos los seeders para poblar la base de datos |
| `npm run dev`         | Inicia la aplicación en modo desarrollo con hot-reload |
| `npm run start:dev`   | Inicia la aplicación en modo desarrollo                |
| `npm run start:debug` | Inicia la aplicación en modo debug                     |
| `npm run build`       | Compila el proyecto TypeScript a JavaScript            |
| `npm run start`       | Inicia la aplicación (requiere build previo)           |
| `npm run start:prod`  | Inicia la aplicación en modo producción                |
| `npm run lint`        | Ejecuta el linter y corrige errores automáticamente    |
| `npm run format`      | Formatea el código con Prettier                        |
| `npm test`            | Ejecuta los tests unitarios                            |
| `npm run test:watch`  | Ejecuta los tests en modo watch                        |
| `npm run test:cov`    | Ejecuta los tests con cobertura                        |
| `npm run test:e2e`    | Ejecuta los tests end-to-end                           |

## 🔍 Troubleshooting

### Error: "Cannot find module"

**Solución**: Ejecuta `npm install` nuevamente para asegurarte de que todas las dependencias estén instaladas.

### Error: "MongoNetworkError" o problemas de conexión a MongoDB

**Soluciones**:

1. Verifica que MongoDB esté corriendo (si es local)
2. Verifica la cadena de conexión en `.env`
3. Si usas MongoDB Atlas, verifica que tu IP esté en la whitelist
4. Verifica que no haya problemas de firewall

### Error: "Faltan variables de entorno JWT"

**Solución**: Asegúrate de que todas las variables JWT estén definidas en el archivo `.env`:

- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRATION`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRATION`

### Error al ejecutar seeders

**Soluciones**:

1. Asegúrate de que la base de datos esté corriendo y accesible
2. Verifica que el archivo `.env` esté correctamente configurado
3. Si los seeders fallan por datos duplicados, elimina la base de datos y vuelve a ejecutarlos

### Puerto 3000 ya está en uso

**Solución**:

1. Cambia el puerto en `src/main.ts` (línea 27) o
2. Detén el proceso que está usando el puerto 3000:

   ```bash
   # En Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # En Linux/Mac
   lsof -ti:3000 | xargs kill
   ```

### Problemas con TypeScript

**Solución**:

1. Verifica que tengas TypeScript instalado globalmente: `npm install -g typescript`
2. Limpia y reinstala las dependencias: `rm -rf node_modules package-lock.json && npm install`

## 📝 Notas Adicionales

- El proyecto usa **NestJS 11** con **TypeScript**
- La base de datos es **MongoDB** con **Mongoose**
- La autenticación usa **JWT** (JSON Web Tokens)
- El envío de emails es opcional y usa **Nodemailer**
- La documentación de la API está disponible en Swagger UI

## 🤝 Contribuir

Si encuentras algún problema o tienes sugerencias, por favor:

1. Verifica que sigas todos los pasos de instalación
2. Revisa la sección de Troubleshooting
3. Abre un issue en el repositorio con los detalles del problema

## 📄 Licencia

Este proyecto es privado y está bajo licencia UNLICENSED.
