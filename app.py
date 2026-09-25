import logging
import os
from datetime import datetime, timedelta
from functools import wraps
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
load_dotenv(override=os.getenv("APP_ENV", "development") == "development")

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from psycopg2 import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
from database import db_cursor

BOGOTA = ZoneInfo("America/Bogota")
CLASS_DURATION_MINUTES = 60
MIN_BOOKING_NOTICE_HOURS = 48
MIN_CANCELLATION_NOTICE_HOURS = 12

app = Flask(__name__)
app.config.from_object(Config)

CORS(
    app,
    resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGINS"]}},
    supports_credentials=True,
    methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.before_request
def make_session_permanent():
    session.permanent = True


def json_body():
    return request.get_json(silent=True) or {}


def clean_text(value, max_length=255):
    return str(value or "").strip()[:max_length]


def admin_required(func):
    @wraps(func)
    def wrapped(*args, **kwargs):
        if session.get("role") != "admin" or not session.get("user_id"):
            return jsonify({"error": "Acceso de administrador requerido"}), 401
        return func(*args, **kwargs)
    return wrapped


def superadmin_required(func):
    @wraps(func)
    def wrapped(*args, **kwargs):
        if session.get("role") != "admin" or session.get("role_level") != 1:
            return jsonify({"error": "Acceso exclusivo de superadministración"}), 403
        return func(*args, **kwargs)
    return wrapped


def student_required(func):
    @wraps(func)
    def wrapped(*args, **kwargs):
        if session.get("role") != "student" or not session.get("student_id"):
            return jsonify({"error": "Acceso de estudiante requerido"}), 401
        return func(*args, **kwargs)
    return wrapped


def parse_class_datetime(date_text, time_text):
    try:
        return datetime.strptime(f"{date_text} {time_text}", "%Y-%m-%d %H:%M").replace(tzinfo=BOGOTA)
    except (TypeError, ValueError):
        return None


@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Ruta no encontrada"}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.exception("Error interno no controlado", exc_info=error)
    return jsonify({"error": "Error interno del servidor"}), 500


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"message": "Sesión cerrada"}), 200


@app.get("/api/me")
def current_user():
    role = session.get("role")
    if role == "student" and session.get("student_id"):
        return jsonify({
            "is_logged_in": True,
            "role": "student",
            "user_id": session["student_id"],
            "name": session.get("student_name"),
        })
    if role == "admin" and session.get("user_id"):
        return jsonify({
            "is_logged_in": True,
            "role": "admin",
            "user_id": session["user_id"],
            "name": session.get("admin_name"),
            "level": session.get("role_level", 0),
        })
    return jsonify({"is_logged_in": False, "role": None}), 401


@app.post("/api/student_login")
def student_login():
    data = json_body()
    student_code = clean_text(data.get("student_code"), 50).upper()
    password = str(data.get("password") or "")
    if not student_code or not password:
        return jsonify({"error": "Código y contraseña son requeridos"}), 400

    with db_cursor() as cursor:
        cursor.execute(
            "SELECT id, name, password FROM students WHERE student_code = %s",
            (student_code,),
        )
        student = cursor.fetchone()

    if not student or not student[2] or not check_password_hash(student[2], password):
        return jsonify({"error": "Código o contraseña incorrectos"}), 401

    session.clear()
    session.permanent = True
    session["role"] = "student"
    session["student_id"] = student[0]
    session["student_name"] = student[1]
    return jsonify({"message": "Login exitoso"}), 200


@app.post("/api/student_register")
def student_register():
    data = json_body()
    student_code = clean_text(data.get("student_code"), 50).upper()
    password = str(data.get("password") or "")
    if not student_code or not password:
        return jsonify({"error": "Código y contraseña son requeridos"}), 400
    if len(password) < 10:
        return jsonify({"error": "La contraseña debe tener al menos 10 caracteres"}), 400

    with db_cursor(commit=True) as cursor:
        cursor.execute(
            "SELECT id, password FROM students WHERE student_code = %s FOR UPDATE",
            (student_code,),
        )
        student = cursor.fetchone()
        if not student:
            return jsonify({"error": "Este código no existe en el sistema"}), 404
        if student[1]:
            return jsonify({"error": "Este código ya fue utilizado"}), 409
        cursor.execute(
            "UPDATE students SET password = %s WHERE id = %s",
            (generate_password_hash(password), student[0]),
        )
    return jsonify({"message": "Cuenta activada. Ya puedes iniciar sesión"}), 200


@app.post("/api/admin_login")
def admin_login():
    data = json_body()
    username = clean_text(data.get("username"), 100)
    password = str(data.get("password") or "")
    if not username or not password:
        return jsonify({"error": "Usuario y contraseña son requeridos"}), 400

    with db_cursor() as cursor:
        cursor.execute(
            "SELECT id, username, password, role_level, full_name FROM admins WHERE username = %s",
            (username,),
        )
        admin = cursor.fetchone()

    if not admin or not check_password_hash(admin[2], password):
        return jsonify({"error": "Credenciales inválidas"}), 401

    session.clear()
    session.permanent = True
    session["role"] = "admin"
    session["user_id"] = admin[0]
    session["role_level"] = admin[3]
    session["admin_name"] = admin[4] or admin[1]
    return jsonify({
        "message": f"Bienvenido/a {admin[4] or admin[1]}",
        "role": "admin",
        "username": admin[1],
        "role_level": admin[3],
    }), 200


@app.get("/api/courses")
def courses():
    with db_cursor() as cursor:
        cursor.execute("SELECT id, course_name FROM courses ORDER BY course_name")
        rows = cursor.fetchall()
    return jsonify([{"id": row[0], "name": row[1]} for row in rows])

@app.get("/api/reserve")
@student_required
def reserve_get():
    with db_cursor() as cursor:
        cursor.execute(
            "SELECT id, course_name FROM courses ORDER BY course_name"
        )

        rows = cursor.fetchall()

    return jsonify(
        [
            {
                "id": row[0],
                "name": row[1],
            }
            for row in rows
        ]
    )


@app.get("/api/teachers")
def teachers():
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT id, COALESCE(full_name, username)
            FROM admins
            WHERE role_level = 0
            ORDER BY COALESCE(full_name, username)
        """)
        rows = cursor.fetchall()
    return jsonify([{"id": row[0], "name": row[1]} for row in rows])


@app.post("/api/reserve")
@student_required
def reserve():
    data = json_body()
    course_id = data.get("course_id")
    teacher_id = data.get("teacher_id")
    date_text = clean_text(data.get("date"), 10)
    time_text = clean_text(data.get("time"), 5)
    requested_at = parse_class_datetime(date_text, time_text)

    if not all([course_id, teacher_id, date_text, time_text]) or requested_at is None:
        return jsonify({"error": "Curso, profesor, fecha y hora son requeridos"}), 400
    if requested_at < datetime.now(BOGOTA) + timedelta(hours=MIN_BOOKING_NOTICE_HOURS):
        return jsonify({"error": "Debes reservar con mínimo 48 horas de anticipación"}), 400

    class_end = requested_at + timedelta(minutes=CLASS_DURATION_MINUTES)
    student_id = session["student_id"]

    try:
        with db_cursor(commit=True) as cursor:
            cursor.execute("SELECT 1 FROM courses WHERE id = %s", (course_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Curso inválido"}), 400
            cursor.execute("SELECT 1 FROM admins WHERE id = %s AND role_level = 0", (teacher_id,))
            if not cursor.fetchone():
                return jsonify({"error": "Profesor inválido"}), 400

            cursor.execute("""
                SELECT id FROM bookings
                WHERE student_id = %s
                  AND (class_date + class_time) < %s
                  AND (class_date + class_time + INTERVAL '60 minutes') > %s
                FOR UPDATE
            """, (student_id, class_end.replace(tzinfo=None), requested_at.replace(tzinfo=None)))
            if cursor.fetchone():
                return jsonify({"error": "Ya tienes una clase que se cruza con ese horario"}), 409

            cursor.execute("""
                SELECT id FROM bookings
                WHERE teacher_id = %s
                  AND (class_date + class_time) < %s
                  AND (class_date + class_time + INTERVAL '60 minutes') > %s
                FOR UPDATE
            """, (teacher_id, class_end.replace(tzinfo=None), requested_at.replace(tzinfo=None)))
            if cursor.fetchone():
                return jsonify({"error": "El profesor ya está ocupado en ese horario"}), 409

            cursor.execute("""
                INSERT INTO bookings (course_id, student_id, teacher_id, class_date, class_time)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (course_id, student_id, teacher_id, date_text, time_text))
            booking_id = cursor.fetchone()[0]
    except IntegrityError:
        return jsonify({"error": "El horario acaba de ser reservado. Selecciona otro"}), 409

    return jsonify({"message": "Reserva confirmada", "booking_id": booking_id}), 201


@app.get("/api/my_classes")
@student_required
def my_classes():
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT b.id, c.course_name, b.class_date, b.class_time,
                   COALESCE(a.full_name, a.username)
            FROM bookings b
            JOIN courses c ON b.course_id = c.id
            JOIN admins a ON b.teacher_id = a.id
            WHERE b.student_id = %s
            ORDER BY b.class_date, b.class_time
        """, (session["student_id"],))
        rows = cursor.fetchall()
    return jsonify([{
        "id": row[0], "course": row[1], "date": str(row[2]),
        "time": str(row[3]), "teacher": row[4],
    } for row in rows])


@app.delete("/api/bookings/<int:booking_id>")
def cancel_booking(booking_id):
    role = session.get("role")
    if role not in {"student", "admin"}:
        return jsonify({"error": "No autorizado"}), 401

    with db_cursor(commit=True) as cursor:
        cursor.execute("""
            SELECT student_id, teacher_id, class_date, class_time
            FROM bookings WHERE id = %s FOR UPDATE
        """, (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            return jsonify({"error": "La reserva no existe"}), 404

        if role == "student":
            if booking[0] != session.get("student_id"):
                return jsonify({"error": "No puedes cancelar esta reserva"}), 403
            starts_at = datetime.combine(booking[2], booking[3]).replace(tzinfo=BOGOTA)
            if starts_at < datetime.now(BOGOTA) + timedelta(hours=MIN_CANCELLATION_NOTICE_HOURS):
                return jsonify({"error": "Solo puedes cancelar hasta 12 horas antes"}), 400
        else:
            is_superadmin = session.get("role_level") == 1
            is_owner_teacher = booking[1] == session.get("user_id")
            if not is_superadmin and not is_owner_teacher:
                return jsonify({"error": "No puedes cancelar una clase de otro docente"}), 403

        cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
    return jsonify({"message": "Reserva cancelada"}), 200


@app.get("/api/admin/dashboard")
@admin_required
def admin_dashboard():
    is_superadmin = session.get("role_level") == 1
    query = """
        SELECT b.id, s.name, c.course_name, b.class_date, b.class_time,
               COALESCE(a.full_name, a.username)
        FROM bookings b
        JOIN students s ON b.student_id = s.id
        JOIN courses c ON b.course_id = c.id
        JOIN admins a ON b.teacher_id = a.id
    """
    params = ()
    if not is_superadmin:
        query += " WHERE b.teacher_id = %s"
        params = (session["user_id"],)
    query += " ORDER BY b.class_date, b.class_time"

    with db_cursor() as cursor:
        cursor.execute(query, params)
        rows = cursor.fetchall()
    return jsonify([{
        "id": str(row[0]),
        "title": f"{row[1]} ({row[5]})" if is_superadmin else row[1],
        "start": f"{row[3]}T{row[4]}",
        "extendedProps": {"course": row[2], "teacher": row[5]},
        "color": "#1976d2" if is_superadmin else "#e91e63",
    } for row in rows])


@app.get("/api/list_students")
@superadmin_required
def list_students():
    with db_cursor() as cursor:
        cursor.execute("""
            SELECT id, name, phone, email, student_code
            FROM students ORDER BY name
        """)
        rows = cursor.fetchall()
    return jsonify([{
        "id": row[0], "name": row[1], "phone": row[2],
        "email": row[3], "code": row[4],
    } for row in rows])


@app.post("/api/add_student")
@superadmin_required
def add_student():
    data = json_body()
    name = clean_text(data.get("name"), 150)
    phone = clean_text(data.get("phone"), 30)
    email = clean_text(data.get("email"), 254).lower()
    student_code = clean_text(data.get("student_code"), 50).upper()
    if not name or not student_code:
        return jsonify({"error": "Nombre y código son obligatorios"}), 400

    try:
        with db_cursor(commit=True) as cursor:
            cursor.execute("""
                INSERT INTO students (name, phone, email, student_code)
                VALUES (%s, %s, %s, %s)
            """, (name, phone, email or None, student_code))
    except IntegrityError:
        return jsonify({"error": "El código o el correo ya están registrados"}), 409
    return jsonify({"message": "Estudiante pre-registrado correctamente"}), 201


if __name__ == "__main__":
    app.run(debug=os.getenv("APP_ENV", "development") == "development", port=5000)