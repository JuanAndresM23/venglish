from flask import Flask, request, session, jsonify
from database import get_connection
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
from datetime import timedelta
from flask import session
from datetime import datetime, timedelta
import psycopg2

app = Flask(__name__)
app.secret_key = "Parkour2311"

# --- CONFIGURACIÓN DE SEGURIDAD ---
# Agregamos 'methods' para que el navegador no bloquee el DELETE
CORS(app, 
     supports_credentials=True, 
     origins=["http://localhost:5173"],
     methods=["GET", "POST", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

app.config.update(
    SESSION_COOKIE_SAMESITE='Lax', 
    SESSION_COOKIE_SECURE=False,   
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_DOMAIN=None,    # Importante: No restrinjas el dominio
    USE_X_FORWARDED_HOST=True,
    SESSION_PERMANENT=True
)
# Configuración de sesión (1 hora de duración)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=60)

@app.before_request
def make_session_permanent():
    session.permanent = True



@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Sesión cerrada"}), 200



# --- DECORADORES DE PROTECCIÓN ---
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("admin"):
            return jsonify({"error": "Acceso de administrador requerido"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- RUTAS DE IDENTIDAD (AUTH) ---

@app.route("/api/me")
def get_current_user():
    print(f"Contenido de la sesión actual: {dict(session)}")

    # Caso Estudiante
    if session.get("role") == "student" or "student_id" in session:
        return jsonify({
            "is_logged_in": True, 
            "role": "student", 
            "user_id": session.get("student_id"), 
            "name": session.get("student_name")
        }), 200
    
    # Caso Admin
    elif session.get("role") == "admin" or "admin" in session:
        return jsonify({
            "is_logged_in": True, 
            "role": "admin",
            "name": "Victoria",
            "level": session.get("role_level", 0)  # ← única línea nueva
        }), 200
    
    # Caso No logueado
    return jsonify({"is_logged_in": False, "role": None}), 401



# --- RUTAS DE ESTUDIANTES ---

@app.route("/api/student_login", methods=["POST"])
def student_login():
    data = request.json
    db = get_connection()
    cur = db.cursor()
    cur.execute("SELECT id, name, password FROM students WHERE student_code = %s", (data.get('student_code'),))
    student = cur.fetchone()
    cur.close()
    db.close()

    if student and check_password_hash(student[2], data.get('password')):
        session["student_id"] = student[0]
        session["student_name"] = student[1]
        session["role"] = "student"  # <--- ESTO ES VITAL PARA api/me
        return jsonify({"message": "Login exitoso"}), 200
        
    return jsonify({"error": "Código o contraseña incorrectos"}), 401

@app.route("/api/student_register", methods=["POST"])
def student_register():
    data = request.json
    student_code = data.get('student_code')
    new_password = data.get('password')
    
    if not student_code or not new_password:
        return jsonify({"error": "Código y contraseña son requeridos"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    
    # Buscamos si el código existe
    cursor.execute("SELECT id, password FROM students WHERE student_code=%s", (student_code,))
    student = cursor.fetchone()

    if not student:
        return jsonify({"error": "Este código no existe en el sistema."}), 404
    
    # Si ya tiene password, es que ya se registró antes
    if student[1]:
        return jsonify({"error": "Este código ya fue utilizado para crear una cuenta."}), 400

    try:
        # Solo actualizamos la contraseña. Nombre y correo ya los puso Victoria.
        hashed_pw = generate_password_hash(new_password)
        cursor.execute(
            "UPDATE students SET password=%s WHERE student_code=%s",
            (hashed_pw, student_code)
        )
        conn.commit()
        return jsonify({"message": "¡Contraseña creada! Ya puedes iniciar sesión."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
        

@app.route("/delete_booking/<int:booking_id>", methods=['DELETE', 'OPTIONS'])
def delete_booking(booking_id):
    # 1. Si es OPTIONS, respondemos OK de inmediato para el navegador
    if request.method == 'OPTIONS':
        return jsonify({"message": "ok"}), 200

    # 2. Ahora sí, verificamos si es admin manualmente
    if not session.get("admin"):
        return jsonify({"error": "Acceso de administrador requerido"}), 401

    # 3. Lógica de eliminación (tu código actual)
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (booking_id,))
        if not cursor.fetchone():
            return jsonify({"error": "La reserva no existe"}), 404

        cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
        conn.commit()
        return jsonify({"message": "Reserva eliminada con éxito"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/api/my_classes")
def my_classes():
    if "student_id" not in session:
        return jsonify({"error": "No autorizado"}), 401
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.id, c.course_name, b.class_date, b.class_time 
        FROM bookings b 
        JOIN courses c ON b.course_id = c.id 
        WHERE b.student_id = %s
        ORDER BY b.class_date, b.class_time
    """, (session["student_id"],))
    
    classes = []
    for r in cursor.fetchall():
        classes.append({
            "id": r[0], 
            "course": r[1], 
            "date": str(r[2]), 
            "time": str(r[3])
        })
    
    cursor.close()
    conn.close()
    return jsonify(classes)

@app.route("/api/reserve", methods=["GET", "POST"])
def post_reserve():
    if request.method == "GET":
        conn = get_connection()
        cur = conn.cursor()
        try:
            cur.execute("SELECT id, course_name FROM courses") 
            rows = cur.fetchall()
            return jsonify([{"id": r[0], "name": r[1]} for r in rows]), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            cur.close()
            conn.close()

    # --- LÓGICA PARA GUARDAR (POST) ---
    student_id = session.get("student_id")
    if not student_id:
        return jsonify({"error": "No autorizado"}), 401
        
    data = request.json
    course_id = data.get('course_id')
    teacher_id = data.get('teacher_id') # <--- RECIBIMOS EL PROFESOR SELECCIONADO
    date_str = data.get('date')
    time_str = data.get('time')

    if not teacher_id:
        return jsonify({"error": "Debes seleccionar un profesor"}), 400

    requested_time = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    start_limit = (requested_time - timedelta(minutes=59)).strftime("%H:%M:%S")
    end_limit = (requested_time + timedelta(minutes=59)).strftime("%H:%M:%S")

    conn = get_connection()
    cur = conn.cursor()

    try:
        # REGLA 1: ¿El estudiante ya tiene otra clase a esa hora (con cualquier profe)?
        cur.execute("""
            SELECT id FROM bookings 
            WHERE student_id = %s AND class_date = %s 
            AND class_time > %s AND class_time < %s
        """, (student_id, date_str, start_limit, end_limit))
        
        if cur.fetchone():
            return jsonify({"error": "Ya tienes una clase registrada en este horario"}), 400

        # REGLA 2: ¿EL PROFESOR SELECCIONADO ya está ocupado a esa hora?
        # Ahora filtramos por teacher_id para que otros profes sí puedan estar libres
        cur.execute("""
            SELECT id FROM bookings 
            WHERE teacher_id = %s AND class_date = %s 
            AND class_time > %s AND class_time < %s
        """, (teacher_id, date_str, start_limit, end_limit))

        if cur.fetchone():
            return jsonify({"error": "Este profesor ya tiene una clase asignada en este horario"}), 400

        # GUARDAR RESERVA INCLUYENDO EL PROFESOR
        cur.execute("""
            INSERT INTO bookings (course_id, student_id, teacher_id, class_date, class_time)
            VALUES (%s, %s, %s, %s, %s)
        """, (course_id, student_id, teacher_id, date_str, time_str))
        
        conn.commit()
        return jsonify({"message": "Reserva confirmada"}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Error en el servidor"}), 500
    finally:
        cur.close()
        conn.close()
# --- RUTAS DE ADMINISTRADOR (VICTORIA) ---

@app.route("/api/admin_login", methods=["POST"])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    conn = get_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500

    cur = conn.cursor()
    # 1. Agregamos role_level a la consulta SQL
    cur.execute("SELECT id, username, password, role_level FROM admins WHERE username = %s", (username,))
    admin = cur.fetchone()

    cur.close()
    conn.close()

    # admin[0]=id, admin[1]=username, admin[2]=password, admin[3]=role_level
    if admin and check_password_hash(admin[2], password):
        session.clear()
        session.permanent = True
        session["admin"] = True
        session["role"] = "admin"
        session["user_id"] = admin[0]
        session["role_level"] = admin[3] # Guardamos en sesión por seguridad

        # 2. Retornamos el role_level y el username al frontend
        return jsonify({
            "message": f"Bienvenido/a {admin[1]}",
            "role": "admin",
            "username": admin[1],
            "role_level": admin[3] # <--- Esto es lo que activará el botón en el Navbar
        }), 200
    
    return jsonify({"error": "Credenciales inválidas"}), 401


@app.route("/api/admin/dashboard")
@admin_required
def admin_dashboard_data():
    current_admin_id = session.get("user_id")
    
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # 1. Ver el nivel del admin logueado
        cur.execute("SELECT role_level FROM admins WHERE id = %s", (current_admin_id,))
        admin_data = cur.fetchone()
        
        if not admin_data:
            return jsonify({"error": "Admin no encontrado"}), 404
            
        role_level = admin_data[0]

        # 2. Query base con los JOINs necesarios
        # Traemos: ID reserva, Nombre Estudiante, Nombre Curso, Fecha, Hora y Nombre Profesor
        query = """
            SELECT b.id, s.name, c.course_name, b.class_date, b.class_time, a.username
            FROM bookings b
            JOIN students s ON b.student_id = s.id
            JOIN courses c ON b.course_id = c.id
            JOIN admins a ON b.teacher_id = a.id
        """

        # 3. Aplicar el filtro de "Aislamiento"
        if role_level == 1:
            # Victoria (SuperAdmin): Ve todo
            cur.execute(query)
        else:
            # Profesores (Andrés, Juan, etc.): Solo ven sus clases
            query += " WHERE b.teacher_id = %s"
            cur.execute(query, (current_admin_id,))

        rows = cur.fetchall()

        # 4. Transformar los resultados al formato de FullCalendar
        events = []
        for r in rows:
            # Formateamos el título para que Victoria vea quién da la clase
            # Ejemplo: "Juan Ochoa (Prof. Andrés)"
            display_title = f"{r[1]} ({r[5]})" if role_level == 1 else r[1]
            
            events.append({
                "id": str(r[0]),
                "title": display_title,
                "start": f"{r[3]}T{r[4]}", # Formato ISO: YYYY-MM-DDTHH:MM:SS
                "extendedProps": {
                    "course": r[2],
                    "teacher": r[5]
                },
                # Color opcional: Victoria ve todo azul, profes ven otro color
                "color": "#1976d2" if role_level == 1 else "#e91e63"
            })

        return jsonify(events), 200

    except Exception as e:
        print(f"Error en dashboard: {e}")
        return jsonify({"error": "No se pudo cargar la agenda"}), 500
    finally:
        cur.close()
        conn.close()

        
@app.route("/api/list_students", methods=['GET', 'OPTIONS'])
def api_list_students():
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200

    # 1. Verificación de sesión básica
    if not session.get("admin"):
        return jsonify({"error": "Acceso de administrador requerido"}), 401

    # 2. Obtener el ID del admin de la sesión para verificar su rango
    current_admin_id = session.get("user_id")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # 3. Verificamos si el admin es SuperAdmin (role_level 1)
        cursor.execute("SELECT role_level FROM admins WHERE id = %s", (current_admin_id,))
        admin_data = cursor.fetchone()
        
        # Si no existe o su nivel no es 1 (Victoria), bloqueamos el acceso
        if not admin_data or admin_data[0] != 1:
            return jsonify({"error": "Acceso restringido: Solo la dirección puede ver esta lista"}), 403

        # 4. Si pasó la validación, traemos los estudiantes
        cursor.execute("SELECT id, name, phone, email, student_code FROM students ORDER BY id ASC")
        rows = cursor.fetchall()
        
        students = [{
            "id": r[0], 
            "name": r[1], 
            "phone": r[2], 
            "email": r[3], 
            "code": r[4]
        } for r in rows]
        
        return jsonify(students), 200

    except Exception as e:
        print(f"Error en la base de datos: {e}")
        return jsonify({"error": "No se pudo cargar la lista"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/api/add_student", methods=["POST"])
@admin_required
def api_add_student():
    data = request.json
    
    # Usamos .get() con un valor por defecto (None o "") 
    # para que no explote si Victoria deja el teléfono en blanco
    name = data.get('name')
    phone = data.get('phone', '')
    email = data.get('email', '')
    student_code = data.get('student_code')

    if not name or not student_code:
        return jsonify({"error": "Nombre y Código son obligatorios"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO students (name, phone, email, student_code) VALUES (%s, %s, %s, %s)",
            (name, phone, email, student_code)
        )
        conn.commit()
        return jsonify({"message": "Estudiante pre-registrado correctamente"}), 201
    except Exception as e:
        # Imprime el error real en tu consola de Flask para que tú sepas qué pasó
        print(f"Error en DB: {e}") 
        return jsonify({"error": "El Código o Email ya están registrados"}), 400
    finally:
        cursor.close()
        conn.close()


@app.route("/api/teachers")
def get_teachers():
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        # 1. Seleccionamos full_name además del id y el username
        # Usamos COALESCE para que si full_name es NULL, traiga el username por defecto
        cur.execute("""
            SELECT id, full_name, username 
            FROM admins 
            WHERE role_level = 0 
            ORDER BY full_name ASC
        """)
        
        rows = cur.fetchall()
        
        # 2. Formateamos la respuesta para el frontend
        teachers = []
        for r in rows:
            teachers.append({
                "id": r[0],
                # Si r[1] (full_name) existe, lo usamos. Si no, r[2] (username)
                "name": r[1] if r[1] else r[2] 
            })
            
        return jsonify(teachers), 200

    except Exception as e:
        print(f"Error al obtener profesores: {e}")
        return jsonify({"error": "No se pudo cargar la lista de profesores"}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    app.run(debug=True, port=5000)