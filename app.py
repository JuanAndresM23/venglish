from flask import Flask, request, session, jsonify
from database import get_connection
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
from datetime import datetime, timedelta
from flask import session
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
import psycopg2
import os

from dotenv import load_dotenv
load_dotenv()

# ============================================================
# GOOGLE CALENDAR
# ============================================================
def get_calendar_service():
    credentials_json = os.environ.get("GOOGLE_CREDENTIALS")
    credentials_dict = json.loads(credentials_json)
    credentials = service_account.Credentials.from_service_account_info(
        credentials_dict,
        scopes=["https://www.googleapis.com/auth/calendar"]
    )
    return build("calendar", "v3", credentials=credentials)

def create_calendar_event(teacher_email, student_email, student_name, course_name, date_str, time_str):
    try:
        service = get_calendar_service()
        start_datetime = f"{date_str}T{time_str}:00"
        end_time = (datetime.strptime(time_str, "%H:%M") + timedelta(hours=1)).strftime("%H:%M")
        end_datetime = f"{date_str}T{end_time}:00"

        attendees = [{"email": teacher_email}]
        if student_email:
            attendees.append({"email": student_email})

        event = {
            "summary": f"Clase de {course_name} - {student_name}",
            "description": f"Clase agendada con {student_name} en Venglish Academy",
            "start": {"dateTime": start_datetime, "timeZone": "America/Bogota"},
            "end": {"dateTime": end_datetime, "timeZone": "America/Bogota"},
            "attendees": attendees,
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 1440},  # 24 horas antes
                    {"method": "email", "minutes": 60},    # 1 hora antes
                    {"method": "popup", "minutes": 30}     # 30 min antes
                ]
            }
        }

        event = service.events().insert(
            calendarId=teacher_email,
            body=event,
            sendUpdates="all"
        ).execute()

        print(f"Evento creado: {event.get('htmlLink')}")
        return event.get("id")

    except Exception as e:
        print(f"Error creando evento en Calendar: {e}")
        return None

def delete_calendar_event(teacher_email, event_id):
    try:
        service = get_calendar_service()
        service.events().delete(
            calendarId=teacher_email,
            eventId=event_id,
            sendUpdates="all"
        ).execute()
        print(f"Evento {event_id} eliminado de Calendar")
        return True
    except Exception as e:
        print(f"Error eliminando evento de Calendar: {e}")
        return False

app = Flask(__name__)
app.secret_key = "Parkour2311"

CORS(app, 
     supports_credentials=True, 
     origins=[
         "http://localhost:5173",
         "https://venglishacademy.lat",
         "https://www.venglishacademy.lat",
         "https://venglish.vercel.app"
     ],
     methods=["GET", "POST", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_DOMAIN=None,
    USE_X_FORWARDED_HOST=True,
    SESSION_PERMANENT=True
)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=60)

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Sesión cerrada"}), 200

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("admin"):
            return jsonify({"error": "Acceso de administrador requerido"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route("/api/me")
def get_current_user():
    print(f"Contenido de la sesión actual: {dict(session)}")

    if session.get("role") == "student" or "student_id" in session:
        return jsonify({
            "is_logged_in": True, 
            "role": "student", 
            "user_id": session.get("student_id"), 
            "name": session.get("student_name")
        }), 200
    
    elif session.get("role") == "admin" or "admin" in session:
        return jsonify({
            "is_logged_in": True, 
            "role": "admin",
            "name": "Victoria",
            "level": session.get("role_level", 0)
        }), 200
    
    return jsonify({"is_logged_in": False, "role": None}), 401

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
        session["role"] = "student"
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
    
    cursor.execute("SELECT id, password FROM students WHERE student_code=%s", (student_code,))
    student = cursor.fetchone()

    if not student:
        return jsonify({"error": "Este código no existe en el sistema."}), 404
    
    if student[1]:
        return jsonify({"error": "Este código ya fue utilizado para crear una cuenta."}), 400

    try:
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
    if request.method == 'OPTIONS':
        return jsonify({"message": "ok"}), 200

    if not session.get("admin"):
        return jsonify({"error": "Acceso de administrador requerido"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Obtener datos antes de eliminar
        cursor.execute("""
            SELECT b.calendar_event_id, a.email 
            FROM bookings b
            JOIN admins a ON b.teacher_id = a.id
            WHERE b.id = %s
        """, (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            return jsonify({"error": "La reserva no existe"}), 404

        # Eliminar de la BD
        cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
        conn.commit()

        # Eliminar de Google Calendar
        calendar_event_id = booking[0]
        teacher_email = booking[1]
        
        if calendar_event_id and teacher_email:
            delete_calendar_event(teacher_email, calendar_event_id)

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

    student_id = session.get("student_id")
    if not student_id:
        return jsonify({"error": "No autorizado"}), 401
        
    data = request.json
    course_id = data.get('course_id')
    teacher_id = data.get('teacher_id')
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
        cur.execute("""
            SELECT id FROM bookings 
            WHERE student_id = %s AND class_date = %s 
            AND class_time > %s AND class_time < %s
        """, (student_id, date_str, start_limit, end_limit))
        
        if cur.fetchone():
            return jsonify({"error": "Ya tienes una clase registrada en este horario"}), 400

        cur.execute("""
            SELECT id FROM bookings 
            WHERE teacher_id = %s AND class_date = %s 
            AND class_time > %s AND class_time < %s
        """, (teacher_id, date_str, start_limit, end_limit))

        if cur.fetchone():
            return jsonify({"error": "Este profesor ya tiene una clase asignada en este horario"}), 400

        # GUARDAR RESERVA
        cur.execute("""
            INSERT INTO bookings (course_id, student_id, teacher_id, class_date, class_time)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (course_id, student_id, teacher_id, date_str, time_str))
        
        booking_id = cur.fetchone()[0]
        conn.commit()

        # GOOGLE CALENDAR
        try:
            cur.execute("SELECT email FROM admins WHERE id = %s", (teacher_id,))
            teacher = cur.fetchone()
            
            cur.execute("SELECT name, email FROM students WHERE id = %s", (student_id,))
            student = cur.fetchone()
            
            cur.execute("SELECT course_name FROM courses WHERE id = %s", (course_id,))
            course = cur.fetchone()
            
            if teacher and teacher[0]:
                event_id = create_calendar_event(
                    teacher_email=teacher[0],
                    student_email=student[1] if student and student[1] else None,
                    student_name=student[0] if student else "Estudiante",
                    course_name=course[0] if course else "Clase",
                    date_str=date_str,
                    time_str=time_str
                )
                
                if event_id:
                    cur.execute("""
                        UPDATE bookings SET calendar_event_id = %s WHERE id = %s
                    """, (event_id, booking_id))
                    conn.commit()
                    
        except Exception as e:
            print(f"Error al crear evento en Calendar: {e}")

        return jsonify({"message": "Reserva confirmada"}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Error en el servidor"}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/api/admin_login", methods=["POST"])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    conn = get_connection()
    if conn is None:
        return jsonify({"error": "Error de conexión a la base de datos"}), 500

    cur = conn.cursor()
    cur.execute("SELECT id, username, password, role_level FROM admins WHERE username = %s", (username,))
    admin = cur.fetchone()
    cur.close()
    conn.close()

    if admin and check_password_hash(admin[2], password):
        session.clear()
        session.permanent = True
        session["admin"] = True
        session["role"] = "admin"
        session["user_id"] = admin[0]
        session["role_level"] = admin[3]

        return jsonify({
            "message": f"Bienvenido/a {admin[1]}",
            "role": "admin",
            "username": admin[1],
            "role_level": admin[3]
        }), 200
    
    return jsonify({"error": "Credenciales inválidas"}), 401

@app.route("/api/admin/dashboard")
@admin_required
def admin_dashboard_data():
    current_admin_id = session.get("user_id")
    
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT role_level FROM admins WHERE id = %s", (current_admin_id,))
        admin_data = cur.fetchone()
        
        if not admin_data:
            return jsonify({"error": "Admin no encontrado"}), 404
            
        role_level = admin_data[0]

        query = """
            SELECT b.id, s.name, c.course_name, b.class_date, b.class_time, a.username
            FROM bookings b
            JOIN students s ON b.student_id = s.id
            JOIN courses c ON b.course_id = c.id
            JOIN admins a ON b.teacher_id = a.id
        """

        if role_level == 1:
            cur.execute(query)
        else:
            query += " WHERE b.teacher_id = %s"
            cur.execute(query, (current_admin_id,))

        rows = cur.fetchall()

        events = []
        for r in rows:
            display_title = f"{r[1]} ({r[5]})" if role_level == 1 else r[1]
            
            events.append({
                "id": str(r[0]),
                "title": display_title,
                "start": f"{r[3]}T{r[4]}",
                "extendedProps": {
                    "course": r[2],
                    "teacher": r[5]
                },
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

    if not session.get("admin"):
        return jsonify({"error": "Acceso de administrador requerido"}), 401

    current_admin_id = session.get("user_id")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT role_level FROM admins WHERE id = %s", (current_admin_id,))
        admin_data = cursor.fetchone()
        
        if not admin_data or admin_data[0] != 1:
            return jsonify({"error": "Acceso restringido: Solo la dirección puede ver esta lista"}), 403

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
        cur.execute("""
            SELECT id, full_name, username 
            FROM admins 
            WHERE role_level = 0 
            ORDER BY full_name ASC
        """)
        
        rows = cur.fetchall()
        
        teachers = []
        for r in rows:
            teachers.append({
                "id": r[0],
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
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)