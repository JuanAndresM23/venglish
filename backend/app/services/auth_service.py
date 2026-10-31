import secrets
from datetime import datetime, timedelta

from flask import current_app

from app.database import UnitOfWork
from app.services.account_recovery import recovery_for_audience, recovery_for_token
from app.services.email_service import EmailService
from app.utils.errors import ServiceError
from app.utils.http import clean_text

MIN_PASSWORD_LENGTH = 10
RESET_TOKEN_HOURS = 1
FORGOT_PASSWORD_MESSAGE = "Si el correo existe, enviaremos instrucciones."
INACTIVE_STUDENT_MESSAGE = "Tu cuenta está desactivada. Comunícate con la academia."


class AuthService:
    """Inicio de sesión, activación de cuentas y recuperación de contraseña."""

    def __init__(self, uow_factory=UnitOfWork, emails=None):
        self._uow_factory = uow_factory
        self._emails = emails or EmailService()

    def student_login(self, student_code, password):
        student_code = clean_text(student_code, 50).upper()
        password = str(password or "")
        if not student_code or not password:
            raise ServiceError("Código y contraseña son requeridos", 400)

        with self._uow_factory() as uow:
            student = uow.students.find_by_code(student_code)

        if not student or not student.check_password(password):
            raise ServiceError("Código o contraseña incorrectos", 401)
        if not student.is_active:
            raise ServiceError(INACTIVE_STUDENT_MESSAGE, 403)

        return {"id": student.id, "name": student.name}

    def student_register(self, student_code, password):
        student_code = clean_text(student_code, 50).upper()
        password = str(password or "")
        if not student_code or not password:
            raise ServiceError("Código y contraseña son requeridos", 400)
        if len(password) < MIN_PASSWORD_LENGTH:
            raise ServiceError("La contraseña debe tener al menos 10 caracteres", 400)

        with self._uow_factory(commit=True) as uow:
            student = uow.students.find_by_code(student_code, for_update=True)
            if not student:
                raise ServiceError("Este código no existe en el sistema", 404)
            if not student.is_active:
                raise ServiceError(INACTIVE_STUDENT_MESSAGE, 403)
            if student.has_password:
                raise ServiceError("Este código ya fue utilizado", 409)
            student.change_password(password)
            uow.students.update(student)

    def admin_login(self, username, password):
        username = clean_text(username, 100)
        password = str(password or "")
        if not username or not password:
            raise ServiceError("Usuario y contraseña son requeridos", 400)

        with self._uow_factory() as uow:
            admin = uow.admins.find_by_username(username)

        if not admin or not admin.check_password(password):
            raise ServiceError("Credenciales inválidas", 401)

        return {
            "id": admin.id,
            "username": admin.username,
            "role_level": admin.role_level,
            "name": admin.display_name,
        }

    def forgot_password(self, email, audience="student", username=None):
        email = clean_text(email, 255).lower()
        if not email:
            raise ServiceError("Correo requerido", 400)

        recovery = recovery_for_audience(audience)
        username = clean_text(username, 100)
        if audience == "admin" and not username:
            raise ServiceError("Usuario requerido", 400)

        with self._uow_factory(commit=True) as uow:
            account = recovery.find_account(uow, email, username)
            if not account:
                return FORGOT_PASSWORD_MESSAGE

            token = secrets.token_urlsafe(32)
            expires_at = datetime.now() + timedelta(hours=RESET_TOKEN_HOURS)
            uow.reset_tokens.add(recovery.build_token(account, token, expires_at))

        origin = current_app.config["FRONTEND_ORIGINS"][0]
        reset_link = f"{origin}/reset-password?{recovery.link_query(token)}"
        self._emails.send_password_reset_email(
            student_name=account.display_name,
            student_email=account.email,
            reset_link=reset_link,
        )
        return FORGOT_PASSWORD_MESSAGE

    def reset_password(self, token, new_password):
        token = clean_text(token, 255)
        new_password = str(new_password or "")
        if not token or not new_password:
            raise ServiceError("Token y contraseña requeridos", 400)
        if len(new_password) < MIN_PASSWORD_LENGTH:
            raise ServiceError("La contraseña debe tener al menos 10 caracteres", 400)

        with self._uow_factory(commit=True) as uow:
            reset = uow.reset_tokens.find_by_token(token, for_update=True)
            if not reset:
                raise ServiceError("Token inválido", 400)
            if reset.used:
                raise ServiceError("Token ya utilizado", 400)
            if reset.is_expired:
                raise ServiceError("Token expirado", 400)

            recovery_for_token(reset).reset_password(uow, reset, new_password)
            reset.mark_used()
            uow.reset_tokens.update(reset)
