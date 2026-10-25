import secrets
from datetime import datetime, timedelta

from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash

from app.database import db_cursor
from app.models import admin_model, password_reset_model, student_model
from app.services.email_service import send_password_reset_email
from app.utils.errors import ServiceError
from app.utils.http import clean_text

MIN_PASSWORD_LENGTH = 10
RESET_TOKEN_HOURS = 1
FORGOT_PASSWORD_MESSAGE = "Si el correo existe, enviaremos instrucciones."


def student_login(student_code, password):
    student_code = clean_text(student_code, 50).upper()
    password = str(password or "")
    if not student_code or not password:
        raise ServiceError("Código y contraseña son requeridos", 400)

    with db_cursor() as cursor:
        student = student_model.get_credentials_by_code(cursor, student_code)

    if not student or not student[2] or not check_password_hash(student[2], password):
        raise ServiceError("Código o contraseña incorrectos", 401)

    return {"id": student[0], "name": student[1]}


def student_register(student_code, password):
    student_code = clean_text(student_code, 50).upper()
    password = str(password or "")
    if not student_code or not password:
        raise ServiceError("Código y contraseña son requeridos", 400)
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ServiceError("La contraseña debe tener al menos 10 caracteres", 400)

    with db_cursor(commit=True) as cursor:
        student = student_model.get_for_activation(cursor, student_code)
        if not student:
            raise ServiceError("Este código no existe en el sistema", 404)
        if student[1]:
            raise ServiceError("Este código ya fue utilizado", 409)
        student_model.set_password(cursor, student[0], generate_password_hash(password))


def admin_login(username, password):
    username = clean_text(username, 100)
    password = str(password or "")
    if not username or not password:
        raise ServiceError("Usuario y contraseña son requeridos", 400)

    with db_cursor() as cursor:
        admin = admin_model.get_by_username(cursor, username)

    if not admin or not check_password_hash(admin[2], password):
        raise ServiceError("Credenciales inválidas", 401)

    return {
        "id": admin[0],
        "username": admin[1],
        "role_level": admin[3],
        "name": admin[4] or admin[1],
    }


def forgot_password(email):
    email = clean_text(email, 255).lower()
    if not email:
        raise ServiceError("Correo requerido", 400)

    with db_cursor(commit=True) as cursor:
        student = student_model.get_by_email(cursor, email)
        if not student:
            return FORGOT_PASSWORD_MESSAGE

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=RESET_TOKEN_HOURS)
        password_reset_model.create(cursor, student[0], token, expires_at)

    reset_link = f"{current_app.config['FRONTEND_ORIGINS'][0]}/reset-password?token={token}"
    send_password_reset_email(
        student_name=student[1],
        student_email=student[2],
        reset_link=reset_link,
    )
    return FORGOT_PASSWORD_MESSAGE


def reset_password(token, new_password):
    token = clean_text(token, 255)
    new_password = str(new_password or "")
    if not token or not new_password:
        raise ServiceError("Token y contraseña requeridos", 400)

    with db_cursor(commit=True) as cursor:
        reset = password_reset_model.get_by_token(cursor, token)
        if not reset:
            raise ServiceError("Token inválido", 400)
        if reset[3]:
            raise ServiceError("Token ya utilizado", 400)
        if reset[2] < datetime.now():
            raise ServiceError("Token expirado", 400)

        student_model.set_password(cursor, reset[1], generate_password_hash(new_password))
        password_reset_model.mark_used(cursor, reset[0])
