from flask import Flask, request, session, jsonify
from database import get_connection
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
from datetime import timedelta
from flask import session
import psycopg2

app = Flask(__name__)
app.secret_key = "Parkour2311"

# --- CONFIGURACIÓN DE SEGURIDAD ---
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

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
    # Depuración: esto imprimirá en tu consola de Flask qué hay dentro de la sesión
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
            "name": "Victoria" 
        }), 200
    
    # Caso No logueado
    return jsonify({"is_logged_in": False, "role": None}), 401

@app.route("/api/logout")
def logout():
    session.clear()
    return jsonify({"message": "Sesión cerrada correctamente"})

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
        return jsonify({"message": "Login exitoso"})
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
def api_reserve():
    conn = get_connection()
    cursor = conn.cursor()

    if request.method == "GET":
        # Para llenar el dropdown de cursos en React
        cursor.execute("SELECT id, course_name FROM courses")
        courses = [{"id": r[0], "name": r[1]} for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify(courses)

    # Lógica POST para guardar la reserva
    data = request.json
    try:
        cursor.execute(
            "INSERT INTO bookings (student_id, course_id, class_date, class_time) VALUES (%s, %s, %s, %s)",
            (session["student_id"], data['course_id'], data['date'], data['time'])
        )
        conn.commit()
        return jsonify({"message": "Clase reservada con éxito"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
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
    # Buscamos al admin
    cur.execute("SELECT id, username, password FROM admins WHERE username = %s", (username,))
    admin = cur.fetchone()

    cur.close()
    conn.close()

    if admin and check_password_hash(admin[2], password):
        session.clear()
        session.permanent = True
        session["admin"] = True
        session["role"] = "admin"
        session["user_id"] = admin[0]
        return jsonify({"message": "Bienvenida Victoria"}), 200
    
    return jsonify({"error": "Credenciales inválidas"}), 401

@app.route("/api/admin/dashboard")
@admin_required
def admin_dashboard_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.id, s.name, c.course_name, b.class_date, b.class_time, s.phone, s.email
        FROM bookings b 
        JOIN students s ON b.student_id = s.id 
        JOIN courses c ON b.course_id = c.id
    """)
    events = [{
        "id": r[0], 
        "title": r[1], 
        "start": f"{r[3]}T{r[4]}", 
        "extendedProps": {"course": r[2], "phone": r[5], "email": r[6]}
    } for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(events)

@app.route("/api/list_students")
@admin_required
def api_list_students():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, phone, email, student_code FROM students")
    students = [{
        "id": r[0], "name": r[1], "phone": r[2], "email": r[3], "code": r[4]
    } for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(students)

@app.route("/api/add_student", methods=["POST"])
@admin_required
def api_add_student():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO students (name, phone, email, student_code) VALUES (%s, %s, %s, %s)",
            (data['name'], data['phone'], data['email'], data['student_code'])
        )
        conn.commit()
        return jsonify({"message": "Estudiante pre-registrado correctamente"})
    except Exception as e:
        return jsonify({"error": "Código o email ya existen"}), 400
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    app.run(debug=True, port=5000)