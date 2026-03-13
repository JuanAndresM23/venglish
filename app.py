from flask import Flask, request, session, jsonify
from database import get_connection
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
from datetime import timedelta

app = Flask(__name__)
app.secret_key = "Parkour2311"

# --- CONFIGURACIÓN DE SEGURIDAD ---
# Permite que el puerto de React (5173) se comunique con Flask
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

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
    """Verifica quién está logueado para que React sepa qué mostrar"""
    if "student_id" in session:
        return jsonify({
            "is_logged_in": True, 
            "role": "student", 
            "user_id": session["student_id"], 
            "name": session.get("student_name")
        })
    elif "admin" in session:
        return jsonify({"is_logged_in": True, "role": "admin"})
    
    return jsonify({"is_logged_in": False}), 401

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
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM students WHERE student_code=%s", (data.get('student_code'),))
    student_exists = cursor.fetchone()

    if student_exists:
        cursor.execute(
            "UPDATE students SET name=%s, email=%s, password=%s WHERE student_code=%s",
            (data.get('name'), data.get('email'), generate_password_hash(data.get('password')), data.get('student_code'))
        )
        conn.commit()
        response = jsonify({"message": "Registro completado con éxito"})
    else:
        response = (jsonify({"error": "Código inválido. Contacta a Victoria."}), 400)
    
    cursor.close()
    conn.close()
    return response

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
    db = get_connection()
    cur = db.cursor()
    cur.execute("SELECT password FROM admins WHERE username=%s", (data.get('username'),))
    admin_data = cur.fetchone()
    cur.close()
    db.close()

    if admin_data and check_password_hash(admin_data[0], data.get('password')):
        session["admin"] = True
        return jsonify({"message": "Bienvenida, Victoria"})
    return jsonify({"error": "Credenciales de admin incorrectas"}), 401

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