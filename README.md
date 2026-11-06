# Venglish

Plataforma web para reservar y gestionar clases de inglés. Tiene un **backend** en Flask (Python + MySQL) y un **frontend** en React (Vite).

```
venglish/
├── backend/    API en Flask + esquema de la base de datos (database/db.sql)
└── frontend/   Aplicación React (Vite)
```

## 1. Requisitos

Instala esto antes de empezar:

| Herramienta | Versión | Descarga |
|---|---|---|
| Python | 3.11 o superior | https://www.python.org/downloads/ |
| Node.js (incluye npm) | 18 o superior | https://nodejs.org/ |
| MySQL Server | 8.x | https://dev.mysql.com/downloads/mysql/ |

Comprueba que funcionan:

```bash
python --version
node --version
mysql --version
```

## 2. Crear la base de datos

Desde la raíz del proyecto, ejecuta el script que crea la base `bd_venglish`, las tablas y los tipos de clase iniciales:

```bash
mysql -u root -p < backend/database/db.sql
```

(Te pedirá la contraseña de tu usuario de MySQL.)

## 3. Configurar el backend

```bash
cd backend
python -m venv venv
```

Activa el entorno virtual:

- **Windows (PowerShell):** `venv\Scripts\Activate.ps1`
- **Windows (cmd):** `venv\Scripts\activate.bat`
- **macOS / Linux:** `source venv/bin/activate`

Instala las dependencias:

```bash
pip install -r requirements.txt
```

Crea tu archivo de configuración copiando el ejemplo:

- **Windows:** `copy .env.example .env`
- **macOS / Linux:** `cp .env.example .env`

Abre `backend/.env` y completa **como mínimo** estos dos valores:

```env
DATABASE_URL=mysql://USUARIO:CONTRASEÑA@localhost:3306/bd_venglish
SECRET_KEY=una-cadena-larga-y-aleatoria
```

Para generar un `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

> Si tu contraseña de MySQL tiene caracteres especiales (`@`, `:`, `/`, `#`...), codifícalos en la URL (por ejemplo `@` → `%40`).

Variables opcionales (la app arranca sin ellas):

| Variable | Para qué sirve |
|---|---|
| `RESEND_API_KEY`, `EMAIL_FROM` | Envío de correos (recuperar contraseña). Sin ellas no se envían correos. |
| `ANTHROPIC_API_KEY` | Activa el asistente de chat. Sin ella el chat no funciona. |
| `FRONTEND_ORIGINS` | Origen permitido del frontend (por defecto `http://localhost:5173`). |

## 4. Crear el primer usuario administrador

La base de datos empieza sin usuarios. Crea un superadmin (con el entorno virtual activo, dentro de `backend/`):

```bash
python -c "from werkzeug.security import generate_password_hash as g; print(g('TU_CONTRASEÑA'))"
```

Copia el hash que imprime y ejecútalo en MySQL:

```sql
USE bd_venglish;
INSERT INTO admins (username, password, role_level, full_name, email)
VALUES ('admin', 'PEGA_AQUI_EL_HASH', 1, 'Administrador', 'admin@ejemplo.com');
```

`role_level = 1` es superadmin; `0` es docente. Con este usuario podrás iniciar sesión y crear docentes y estudiantes desde la propia aplicación.

## 5. Arrancar el backend

Dentro de `backend/` y con el entorno virtual activo:

```bash
python run.py
```

La API queda en http://127.0.0.1:5000.

## 6. Arrancar el frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador. En desarrollo, Vite redirige automáticamente las llamadas `/api` al backend, no necesitas configurar nada más.

## Problemas comunes

- **`KeyError: 'SECRET_KEY'`** al arrancar: falta `SECRET_KEY` en `backend/.env`.
- **`DATABASE_URL no está definida`**: no existe `backend/.env` o está vacío ese valor.
- **Error de conexión a MySQL**: verifica que el servicio de MySQL esté corriendo y que usuario/contraseña de `DATABASE_URL` sean correctos.
- **El frontend no carga datos**: confirma que el backend esté corriendo en el puerto 5000.
- **`Activate.ps1` bloqueado en PowerShell**: ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Comandos útiles

| Dónde | Comando | Qué hace |
|---|---|---|
| `frontend/` | `npm run build` | Genera la versión de producción en `dist/` |
| `frontend/` | `npm run lint` | Revisa el código con ESLint |
