from app.database import IntegrityError, UnitOfWork
from app.entities import Student, Teacher
from app.services.google_calendar import GoogleCalendar
from app.utils.errors import ServiceError
from app.utils.http import clean_text

MIN_PASSWORD_LENGTH = 10


def _valid_email(email):
    return "@" in email and "." in email.split("@")[-1]


class AdminAccountMixin:
    """Carga la cuenta de quien consulta el panel."""

    @staticmethod
    def _load_admin(uow, admin_id):
        admin = uow.admins.find_by_id(admin_id)
        if not admin:
            raise ServiceError("Usuario no encontrado", 404)
        return admin


class DashboardService(AdminAccountMixin):
    """Calendario y estadísticas del panel; el rol de la cuenta decide qué ve (polimorfismo)."""

    def __init__(self, uow_factory=UnitOfWork):
        self._uow_factory = uow_factory

    def dashboard_events(self, admin_id):
        with self._uow_factory() as uow:
            viewer = self._load_admin(uow, admin_id)
            details = uow.bookings.list_details(teacher_id=viewer.teacher_scope_id)
        return [viewer.dashboard_event(detail) for detail in details]

    def stats(self, admin_id):
        with self._uow_factory() as uow:
            viewer = self._load_admin(uow, admin_id)
            scope = viewer.teacher_scope_id
            is_superadmin = viewer.is_superadmin
            return {
                "is_superadmin": is_superadmin,
                "students": uow.students.count() if is_superadmin else None,
                "teachers": uow.admins.count_teachers() if is_superadmin else None,
                "upcoming_bookings": uow.bookings.count_upcoming(scope),
                "week_bookings": uow.bookings.count_next_week(scope),
            }


class StudentService:
    """Gestión de estudiantes por el superadministrador."""

    def __init__(self, uow_factory=UnitOfWork):
        self._uow_factory = uow_factory

    def list_students(self):
        with self._uow_factory() as uow:
            students = uow.students.list_all()
        return [student.to_dict() for student in students]

    @staticmethod
    def _clean(data):
        name = clean_text(data.get("name"), 150)
        phone = clean_text(data.get("phone"), 30)
        email = clean_text(data.get("email"), 254).lower()
        student_code = clean_text(data.get("student_code"), 50).upper()
        if not name or not student_code:
            raise ServiceError("Nombre y código son obligatorios", 400)
        if email and not _valid_email(email):
            raise ServiceError("Correo inválido", 400)
        return name, phone, email or None, student_code

    def add_student(self, data):
        name, phone, email, student_code = self._clean(data)

        try:
            with self._uow_factory(commit=True) as uow:
                uow.students.add(
                    Student(name=name, phone=phone, email=email, student_code=student_code)
                )
        except IntegrityError:
            raise ServiceError("El código o el correo ya están registrados", 409)

    def update_student(self, student_id, data):
        name, phone, email, student_code = self._clean(data)

        try:
            with self._uow_factory(commit=True) as uow:
                student = uow.students.find_by_id(student_id, for_update=True)
                if not student:
                    raise ServiceError("El estudiante no existe", 404)
                student.update_details(name, phone, email, student_code)
                uow.students.update(student)
        except IntegrityError:
            raise ServiceError("El código o el correo ya están registrados", 409)

    def set_student_enabled(self, student_id, data):
        enabled = data.get("enabled")
        if not isinstance(enabled, bool):
            raise ServiceError("Estado inválido", 400)
        with self._uow_factory(commit=True) as uow:
            student = uow.students.find_by_id(student_id, for_update=True)
            if not student:
                raise ServiceError("El estudiante no existe", 404)
            if enabled:
                student.enable()
            else:
                student.disable()
            uow.students.update(student)

    def delete_student(self, student_id):
        with self._uow_factory(commit=True) as uow:
            if not uow.students.find_by_id(student_id, for_update=True):
                raise ServiceError("El estudiante no existe", 404)

            bookings = uow.bookings.count_by_student(student_id)
            if bookings:
                raise ServiceError(
                    f"No se puede eliminar: tiene {bookings} reserva(s) registradas. "
                    "Cancela sus clases primero.",
                    409,
                )
            uow.students.delete(student_id)


class TeacherService:
    """Gestión de docentes por el superadministrador."""

    def __init__(self, uow_factory=UnitOfWork):
        self._uow_factory = uow_factory

    def list_teachers(self):
        with self._uow_factory() as uow:
            teachers = uow.admins.list_teachers()
        return [teacher.to_dict() for teacher in teachers]

    def add_teacher(self, data):
        username = clean_text(data.get("username"), 100).lower()
        full_name = clean_text(data.get("full_name"), 150)
        email = clean_text(data.get("email"), 255).lower()
        password = str(data.get("password") or "")
        if not username or not full_name:
            raise ServiceError("Usuario y nombre son obligatorios", 400)
        if " " in username:
            raise ServiceError("El usuario no puede contener espacios", 400)
        if email and not _valid_email(email):
            raise ServiceError("Correo inválido", 400)
        if len(password) < MIN_PASSWORD_LENGTH:
            raise ServiceError("La contraseña debe tener al menos 10 caracteres", 400)

        teacher = Teacher(username=username, full_name=full_name, email=email or None)
        teacher.change_password(password)

        try:
            with self._uow_factory(commit=True) as uow:
                if uow.admins.username_exists(username):
                    raise ServiceError("Ese nombre de usuario ya está registrado", 409)
                uow.admins.add(teacher)
        except IntegrityError:
            raise ServiceError("Ese nombre de usuario ya está registrado", 409)


class ProfileService(AdminAccountMixin):
    """Perfil y contraseña de la cuenta de administrador que inició sesión."""

    def __init__(self, uow_factory=UnitOfWork, calendar=None):
        self._uow_factory = uow_factory
        self._calendar = calendar or GoogleCalendar()

    def get_profile(self, admin_id):
        with self._uow_factory() as uow:
            admin = self._load_admin(uow, admin_id)
        return {
            "username": admin.username,
            "full_name": admin.full_name or "",
            "email": admin.email or "",
            "level": admin.role_level,
            "role": admin.role_label,
            "calendar_id": admin.calendar_id or "",
            "calendar_share_email": self._calendar.service_account_email(),
        }

    def update_profile(self, admin_id, data):
        full_name = clean_text(data.get("full_name"), 100)
        email = clean_text(data.get("email"), 100).lower()
        calendar_id = clean_text(data.get("calendar_id"), 255)
        if not full_name:
            raise ServiceError("El nombre es obligatorio", 400)
        if email and not _valid_email(email):
            raise ServiceError("Correo inválido", 400)

        with self._uow_factory(commit=True) as uow:
            admin = uow.admins.find_by_id(admin_id, for_update=True)
            if not admin:
                raise ServiceError("Usuario no encontrado", 404)
            admin.update_profile(full_name, email or None, calendar_id or None)
            uow.admins.update(admin)
        return full_name

    def change_password(self, admin_id, current_password, new_password):
        current_password = str(current_password or "")
        new_password = str(new_password or "")
        if len(new_password) < MIN_PASSWORD_LENGTH:
            raise ServiceError("La nueva contraseña debe tener al menos 10 caracteres", 400)

        with self._uow_factory(commit=True) as uow:
            admin = uow.admins.find_by_id(admin_id, for_update=True)
            if not admin or not admin.check_password(current_password):
                raise ServiceError("La contraseña actual es incorrecta", 400)
            admin.change_password(new_password)
            uow.admins.update(admin)
