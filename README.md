# 🧩 Generador Inteligente de Inserciones para Bases de Datos

## 📖 ¿Qué es esto?

Este proyecto es una aplicación que **crea datos falsos (pero válidos) y los inserta automáticamente en una tabla de una base de datos**.

Imagina que tienes una tabla de "clientes" en tu base de datos y necesitas probar tu aplicación con 500 clientes de ejemplo. Hacerlo a mano tomaría horas. Este programa:

1. Se conecta a tu base de datos.
2. Lee cómo está armada la tabla (qué columnas tiene, de qué tipo son, si alguna es obligatoria, etc.).
3. Te pregunta cuántos registros quieres generar.
4. Crea datos realistas para cada columna (nombres, correos, fechas, números, etc.).
5. Los inserta en la tabla.
6. Te dice si todo salió bien o si hubo errores.

---

## 👥 Equipo y roles

| Integrante | Rol | Responsabilidad |
|---|---|---|
| **Criss** | Conexión y estructura de BD | Conectar con la base de datos y leer cómo están hechas las tablas (columnas, tipos, llaves) |
| **Veto** | Generación de datos | Crear los datos falsos/realistas y guardarlos en la tabla |
| **Jorge** | API y documentación | Conectar todas las piezas, exponer la funcionalidad como servicio, y documentar el proyecto |

---

## 🗂️ Estructura del proyecto

```
DBPROJECT/
│
├── src/
│   ├── config/
│   │   └── db.js                 → Configuración y conexión a la base de datos
│   │
│   ├── controllers/
│   │   └── generator.controller.js  → Recibe las peticiones y decide qué hacer
│   │
│   ├── routes/
│   │   └── generator.routes.js   → Define las URLs/endpoints de la aplicación
│   │
│   └── services/
│       ├── schema.service.js     → Lee la estructura de la tabla (columnas, tipos, restricciones)
│       ├── faker.service.js      → Genera datos falsos y realistas
│       ├── data.service.js       → Arma los datos según el tipo de cada columna
│       ├── insert.service.js     → Inserta los datos generados en la base de datos
│       └── history.service.js    → Guarda un historial/registro de lo que se ha hecho
│
├── app.js                        → Punto de entrada de la aplicación
├── docker-compose.yml            → Levanta la base de datos en un contenedor (para pruebas fáciles)
├── .env                          → Variables secretas (contraseñas, usuario, host) — NO se sube a GitHub
├── .gitignore                    → Lista de archivos que Git debe ignorar
├── package.json                  → Lista de dependencias del proyecto
└── package-lock.json             → Versión exacta de cada dependencia instalada
```

---

## ⚙️ Requisitos previos

Antes de instalar, necesitas tener en tu computadora:

- **Node.js** (versión 18 o superior) → [descargar aquí](https://nodejs.org/)
- **npm** (viene incluido con Node.js)
- **Docker** (opcional, si quieres usar el `docker-compose.yml` para levantar la base de datos rápido) → [descargar aquí](https://www.docker.com/)
- Una base de datos activa (MySQL, PostgreSQL, etc., según lo que uses)

---

## 🚀 Instalación paso a paso

### 1. Clonar el proyecto
```bash
git clone https://github.com/Yorchky/generador-inserciones-bd.git
cd generador-inserciones-bd
```

### 2. Instalar las dependencias
```bash
npm install
```

### 3. Configurar las variables de entorno
Crea un archivo llamado `.env` en la raíz del proyecto (si no existe) con este contenido, ajustado a tu base de datos:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=nombre_base_datos
PORT=3000
```

> ⚠️ **Importante:** este archivo nunca se sube a GitHub porque contiene información sensible. Ya está incluido en `.gitignore`.

### 4. (Opcional) Levantar la base de datos con Docker
Si no tienes una base de datos instalada localmente, puedes usar Docker:
```bash
docker-compose up -d
```

### 5. Ejecutar la aplicación
```bash
node app.js
```
o si tienes un script definido en `package.json`:
```bash
npm start
```

---

## 🖱️ Cómo usarlo

1. Con la aplicación corriendo, envía una petición (por Postman, navegador, o interfaz web) indicando:
   - El nombre de la tabla que quieres llenar.
   - La cantidad de registros que deseas generar.
2. La aplicación detecta automáticamente las columnas y tipos de datos de esa tabla.
3. Genera los datos falsos respetando las restricciones (NOT NULL, tipos de dato, llaves, etc.).
4. Inserta los registros y te devuelve un mensaje con el resultado (cuántos se insertaron, si hubo errores, etc.).

*(Aquí el equipo puede agregar una captura de pantalla o video de ejemplo como evidencia de funcionamiento).*

---

## 🤖 Uso de Inteligencia Artificial en el proyecto

*(Esta sección la debe completar el equipo con su experiencia real, aquí un ejemplo de cómo redactarla):*

Se utilizó IA como apoyo para:
- Generar datos más realistas y coherentes según el nombre y tipo de cada columna (por ejemplo, reconocer que una columna llamada `email` debe llevar un correo válido).
- Sugerir la estructura del código y buenas prácticas de organización en carpetas (`config`, `controllers`, `routes`, `services`).
- Optimizar la lógica de detección de restricciones (NOT NULL, ENUM, llaves foráneas).
- Ayudar a redactar esta documentación de forma clara.

El equipo comprende y puede explicar el funcionamiento completo de cada módulo implementado.

---

## 🛠️ Tecnologías utilizadas

- **Node.js** — entorno de ejecución del backend
- **Express** (si aplica) — para exponer los endpoints
- **Faker.js** o similar — para generar datos falsos realistas
- **Docker / docker-compose** — para levantar la base de datos fácilmente
- Motor de base de datos (MySQL / PostgreSQL / SQL Server / SQLite, según configuración en `.env`)

---

## 📌 Flujo de trabajo del equipo (Git)

- Cada integrante trabajó en su propia rama según su módulo asignado.
- Los cambios se integraron a `main` mediante *Pull Requests* revisados por el equipo.
- Rama de Criss: `feature/db-schema`
- Rama de Veto: `feature/data-generation`
- Rama de Jorge: `feature/api-y-docs`

---

## ✅ Estado del proyecto

- [x] Conexión a base de datos
- [x] Lectura de estructura de tabla
- [x] Generación de datos según tipo de columna
- [x] Inserción automática de registros
- [x] Mensaje de resultado del proceso
- [ ] Interfaz gráfica/web (si se implementó, marcar aquí)
- [ ] Soporte multi-motor de base de datos (si aplica)

---

## 📄 Licencia

Proyecto desarrollado con fines académicos.
