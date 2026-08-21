from flask import Flask, request, session, jsonify
from database import get_connection
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
from datetime import datetime, timedelta
from flask import session
import json
import threading
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2 import service_account
from googleapiclient.discovery import build
import psycopg2
import os
from apscheduler.schedulers.background import BackgroundScheduler

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

        event = {
            "summary": f"Clase de {course_name} - {student_name}",
            "description": f"Clase agendada con {student_name} en Venglish Academy\nEstudiante: {student_email or 'Sin correo'}",
            "start": {"dateTime": start_datetime, "timeZone": "America/Bogota"},
            "end": {"dateTime": end_datetime, "timeZone": "America/Bogota"},
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 1440},
                    {"method": "email", "minutes": 60},
                    {"method": "popup", "minutes": 30}
                ]
            }
        }

        event = service.events().insert(
            calendarId=teacher_email,
            body=event,
            sendUpdates="none"  # ← CAMBIADO
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

GMAIL_USER = "venglishcolombia@gmail.com"

def send_email(to_email, subject, body):
    """Envía un email usando Gmail SMTP en thread separado"""
    if not to_email:
        print(f"No se puede enviar email: destinatario vacío")
        return False

    def _send():
        try:
            gmail_password = os.environ.get("GMAIL_PASSWORD")
            msg = MIMEMultipart()
            msg['From'] = f"Venglish Academy <{GMAIL_USER}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))

            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.ehlo()
                server.starttls()
                server.login(GMAIL_USER, gmail_password)
                server.sendmail(GMAIL_USER, to_email, msg.as_string())

            print(f"Email enviado a {to_email}")
        except Exception as e:
            print(f"Error enviando email a {to_email}: {e}")

    thread = threading.Thread(target=_send)
    thread.daemon = True
    thread.start()
    return True

def notify_class_booked(teacher_email, teacher_name, student_name, student_email, date_str, time_str):
    """Notifica cuando se agenda una clase"""
    # Email al profesor
    send_email(
        teacher_email,
        f"📚 Nueva clase agendada - {student_name}",
        f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff4bb0;">¡Tienes una nueva clase!</h2>
            <p>Hola <strong>{teacher_name}</strong>,</p>
            <p>El estudiante <strong>{student_name}</strong> ha agendado una clase contigo.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; border-left: 4px solid #ff4bb0;">
                <p>📅 <strong>Fecha:</strong> {date_str}</p>
                <p>🕐 <strong>Hora:</strong> {time_str}</p>
                <p>👤 <strong>Estudiante:</strong> {student_name}</p>
            </div>
            <p style="color: #888; font-size: 0.9rem;">Venglish Academy</p>
        </div>
        """
    )
    # Email al estudiante
    send_email(
        student_email,
        f"✅ Clase confirmada - Venglish Academy",
        f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff4bb0;">¡Tu clase está confirmada!</h2>
            <p>Hola <strong>{student_name}</strong>,</p>
            <p>Tu clase ha sido agendada exitosamente.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; border-left: 4px solid #ff4bb0;">
                <p>📅 <strong>Fecha:</strong> {date_str}</p>
                <p>🕐 <strong>Hora:</strong> {time_str}</p>
                <p>👩‍🏫 <strong>Docente:</strong> {teacher_name}</p>
            </div>
            <p>Recuerda que puedes cancelar hasta <strong>12 horas antes</strong>.</p>
            <p style="color: #888; font-size: 0.9rem;">Venglish Academy</p>
        </div>
        """
    )

def notify_class_cancelled_by_student(teacher_email, teacher_name, student_name, date_str, time_str):
    """Notifica al profesor cuando el estudiante cancela"""
    send_email(
        teacher_email,
        f"❌ Clase cancelada - {student_name}",
        f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53935;">Clase cancelada</h2>
            <p>Hola <strong>{teacher_name}</strong>,</p>
            <p>El estudiante <strong>{student_name}</strong> ha cancelado su clase.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; border-left: 4px solid #e53935;">
                <p>📅 <strong>Fecha:</strong> {date_str}</p>
                <p>🕐 <strong>Hora:</strong> {time_str}</p>
            </div>
            <p>Este horario ha quedado libre en tu calendario.</p>
            <p style="color: #888; font-size: 0.9rem;">Venglish Academy</p>
        </div>
        """
    )

def notify_class_cancelled_by_teacher(student_email, student_name, teacher_name, date_str, time_str):
    """Notifica al estudiante cuando el profesor cancela"""
    send_email(
        student_email,
        f"❌ Tu clase fue cancelada - Venglish Academy",
        f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53935;">Tu clase fue cancelada</h2>
            <p>Hola <strong>{student_name}</strong>,</p>
            <p>Lamentamos informarte que tu docente <strong>{teacher_name}</strong> ha cancelado la clase.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; border-left: 4px solid #e53935;">
                <p>📅 <strong>Fecha:</strong> {date_str}</p>
                <p>🕐 <strong>Hora:</strong> {time_str}</p>
            </div>
            <p>Por favor agenda una nueva clase en la plataforma.</p>
            <p style="color: #888; font-size: 0.9rem;">Venglish Academy</p>
        </div>
        """
    )

def send_reminder(to_email, name, teacher_name, date_str, time_str, hours_before):
    """Envía recordatorio de clase"""
    send_email(
        to_email,
        f"⏰ Recordatorio: Clase en {hours_before} hora{'s' if hours_before > 1 else ''}",
        f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff4bb0;">⏰ Recordatorio de clase</h2>
            <p>Hola <strong>{name}</strong>,</p>
            <p>Te recordamos que tienes una clase en <strong>{hours_before} hora{'s' if hours_before > 1 else ''}</strong>.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; border-left: 4px solid #ff4bb0;">
                <p>📅 <strong>Fecha:</strong> {date_str}</p>
                <p>🕐 <strong>Hora:</strong> {time_str}</p>
                <p>👩‍🏫 <strong>Docente:</strong> {teacher_name}</p>
            </div>
            <p style="color: #888; font-size: 0.9rem;">Venglish Academy</p>
        </div>
        """
    )

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

    if not session.get("admin") and not session.get("student_id"):
        return jsonify({"error": "Acceso requerido"}), 401

    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Obtener todos los datos necesarios antes de eliminar
        cursor.execute("""
            SELECT b.calendar_event_id, a.email, b.class_date, b.class_time,
                   a.full_name, s.name, s.email
            FROM bookings b
            JOIN admins a ON b.teacher_id = a.id
            JOIN students s ON b.student_id = s.id
            WHERE b.id = %s
        """, (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            return jsonify({"error": "La reserva no existe"}), 404

        calendar_event_id = booking[0]
        teacher_email     = booking[1]
        class_date        = booking[2]
        class_time        = booking[3]
        teacher_name      = booking[4]
        student_name      = booking[5]
        student_email     = booking[6]

        # Validar regla de 12h si es estudiante
        if session.get("student_id"):
            class_datetime = datetime.combine(class_date, class_time)
            colombia_offset = timedelta(hours=-5)
            now_colombia = datetime.now(__import__('datetime').timezone.utc).replace(tzinfo=None) + colombia_offset
            diff_hours = (class_datetime - now_colombia).total_seconds() / 3600
            if diff_hours < 12:
                return jsonify({"error": "No puedes cancelar con menos de 12 horas de anticipación"}), 400

        # Eliminar de la BD
        cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
        conn.commit()

        # Eliminar de Google Calendar
        if calendar_event_id and teacher_email:
            delete_calendar_event(teacher_email, calendar_event_id)

        # Notificaciones por email según quién cancela
        try:
            if session.get("student_id"):
                # Estudiante cancela → notificar al profesor
                notify_class_cancelled_by_student(
                    teacher_email=teacher_email,
                    teacher_name=teacher_name,
                    student_name=student_name,
                    date_str=str(class_date),
                    time_str=str(class_time)
                )
            else:
                # Profesor/Victoria cancela → notificar al estudiante
                notify_class_cancelled_by_teacher(
                    student_email=student_email,
                    student_name=student_name,
                    teacher_name=teacher_name,
                    date_str=str(class_date),
                    time_str=str(class_time)
                )
        except Exception as e:
            print(f"Error enviando notificación de cancelación: {e}")

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
        SELECT b.id, b.class_date, b.class_time, a.full_name
        FROM bookings b 
        LEFT JOIN admins a ON b.teacher_id = a.id
        WHERE b.student_id = %s
        ORDER BY b.class_date, b.class_time
    """, (session["student_id"],))
    
    classes = []
    for r in cursor.fetchall():
        classes.append({
            "id": r[0],
            "course": "Clase de Inglés",
            "date": str(r[1]),
            "time": str(r[2]),
            "teacher": r[3] if r[3] else "Profesora"
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
    course_id = data.get('course_id',None)
    teacher_id = data.get('teacher_id')
    date_str = data.get('date')
    time_str = data.get('time')

    if not teacher_id:
     return jsonify({"error": "Debes seleccionar un profesor"}), 400

# Validación 48h
    from datetime import timezone
    requested_datetime = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    colombia_offset = timedelta(hours=-5)
    now_colombia = datetime.now(timezone.utc).replace(tzinfo=None) + colombia_offset
    if requested_datetime < now_colombia + timedelta(hours=48):
        return jsonify({"error": "Debes agendar con mínimo 48 horas de anticipación"}), 400

    requested_time = requested_datetime  # ← reutilizamos la variable
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
            cur.execute("SELECT email, full_name FROM admins WHERE id = %s", (teacher_id,))
            teacher = cur.fetchone()
            
            cur.execute("SELECT name, email FROM students WHERE id = %s", (student_id,))
            student = cur.fetchone()
            
            cur.execute("SELECT course_name FROM courses WHERE id = %s", (course_id,))
            course = cur.fetchone()
            
            teacher_email = teacher[0] if teacher else None
            teacher_name  = teacher[1] if teacher else "Docente"
            student_name  = student[0] if student else "Estudiante"
            student_email = student[1] if student and len(student) > 1 else None
            
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

            # ← AGREGAR: Notificaciones por email
            notify_class_booked(
                teacher_email=teacher[0] if teacher else None,
                teacher_name=teacher[1] if teacher else "Docente",
                student_name=student[0] if student else "Estudiante",
                student_email=student[1] if student and len(student) > 1 else None,
                date_str=date_str,
                time_str=time_str
            )
                    
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
    LEFT JOIN courses c ON b.course_id = c.id
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



# ============================================================
# HORARIOS DE PROFESORES
# ============================================================

@app.route("/api/teacher/schedule", methods=["GET", "POST"])
def teacher_schedule():
    if not session.get("admin"):
        return jsonify({"error": "No autorizado"}), 401
    
    teacher_id = session.get("user_id")
    conn = get_connection()
    cur = conn.cursor()

    if request.method == "GET":
        try:
            cur.execute("""
                SELECT id, day_of_week, start_time, end_time, is_available
                FROM teacher_schedules
                WHERE teacher_id = %s
                ORDER BY day_of_week
            """, (teacher_id,))
            rows = cur.fetchall()
            schedules = [{
                "id": r[0],
                "day_of_week": r[1],
                "start_time": str(r[2]),
                "end_time": str(r[3]),
                "is_available": r[4]
            } for r in rows]
            return jsonify(schedules), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            cur.close()
            conn.close()

    if request.method == "POST":
        data = request.json
        try:
            # Eliminar horarios anteriores del día
            cur.execute("""
                DELETE FROM teacher_schedules 
                WHERE teacher_id = %s AND day_of_week = %s
            """, (teacher_id, data.get("day_of_week")))

            # Insertar nuevo horario
            cur.execute("""
                INSERT INTO teacher_schedules 
                (teacher_id, day_of_week, start_time, end_time, is_available)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                teacher_id,
                data.get("day_of_week"),
                data.get("start_time"),
                data.get("end_time"),
                data.get("is_available", True)
            ))
            conn.commit()
            return jsonify({"message": "Horario guardado"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            cur.close()
            conn.close()


@app.route("/api/teachers/availability")
def teachers_availability():
    """Retorna profesores con su disponibilidad para una fecha y hora específica"""
    date_str = request.args.get("date")
    time_str = request.args.get("time")

    if not date_str or not time_str:
        return jsonify({"error": "Fecha y hora requeridas"}), 400

    try:
        # Obtener día de la semana (0=Lunes, 6=Domingo)
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = date_obj.weekday()
        time_obj = datetime.strptime(time_str, "%H:%M").time()

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT a.id, a.full_name, a.username,
                   ts.start_time, ts.end_time, ts.is_available
            FROM admins a
            LEFT JOIN teacher_schedules ts 
                ON a.id = ts.teacher_id 
                AND ts.day_of_week = %s
            WHERE a.role_level = 0
            ORDER BY a.full_name ASC
        """, (day_of_week,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        teachers = []
        for r in rows:
            teacher_id = r[0]
            name = r[1] if r[1] else r[2]
            start_time = r[3]
            end_time = r[4]
            is_available = r[5]

            # Verificar si el profesor tiene horario definido
            if start_time is None or end_time is None or not is_available:
                status = "unavailable"
            elif start_time <= time_obj <= end_time:
                status = "available"
            else:
                status = "unavailable"

            # Verificar si ya tiene clase en ese horario
            conn2 = get_connection()
            cur2 = conn2.cursor()
            cur2.execute("""
                SELECT id FROM bookings
                WHERE teacher_id = %s AND class_date = %s
                AND class_time = %s
            """, (teacher_id, date_str, time_str))
            
            if cur2.fetchone():
                status = "busy"
            
            cur2.close()
            conn2.close()

            teachers.append({
                "id": teacher_id,
                "name": name,
                "status": status,  # available, unavailable, busy
                "start_time": str(start_time) if start_time else None,
                "end_time": str(end_time) if end_time else None
            })

        return jsonify(teachers), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500



# ============================================================
# RECORDATORIOS AUTOMÁTICOS
# ============================================================

def send_reminders():
    """Ejecuta cada hora y envía recordatorios 24h y 1h antes"""
    print("Ejecutando recordatorios...")
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        colombia_offset = timedelta(hours=-5)
        now_colombia = datetime.now(__import__('datetime').timezone.utc).replace(tzinfo=None) + colombia_offset

        # Buscar clases en las próximas 24h y 1h
        for hours in [24, 1]:
            target_time = now_colombia + timedelta(hours=hours)
            target_date = target_time.date()
            target_hour = target_time.strftime("%H:%M")

            cur.execute("""
                SELECT b.id, s.name, s.email, a.full_name, a.email, 
                       b.class_date, b.class_time
                FROM bookings b
                JOIN students s ON b.student_id = s.id
                JOIN admins a ON b.teacher_id = a.id
                WHERE b.class_date = %s
                AND TO_CHAR(b.class_time, 'HH24:MI') = %s
                AND b.status = 'scheduled'
            """, (target_date, target_hour))

            classes = cur.fetchall()
            for c in classes:
                student_name, student_email = c[1], c[2]
                teacher_name, teacher_email = c[3], c[4]
                date_str, time_str = str(c[5]), str(c[6])

                # Recordatorio al estudiante
                send_reminder(student_email, student_name, teacher_name, date_str, time_str, hours)
                # Recordatorio al profesor
                send_reminder(teacher_email, teacher_name, teacher_name, date_str, time_str, hours)

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error en recordatorios: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(send_reminders, 'interval', hours=1)
scheduler.start()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)