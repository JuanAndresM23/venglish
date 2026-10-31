from app.constants import LEVEL_SUPERADMIN, LEVEL_TEACHER
from app.entities.person import Person


class Admin(Person):
    """Cuenta del panel. Es abstracta: al leer de la BD se crea `Teacher` o `SuperAdmin`
    según `role_level`, y cada una resuelve a su manera lo que depende del rol (polimorfismo).
    """

    TABLE = "admins"
    COLUMNS = ("id", "username", "password", "role_level", "full_name", "email", "calendar_id")

    ROLE_LEVEL = LEVEL_TEACHER
    ROLE_LABEL = ""
    DASHBOARD_COLOR = ""

    def __init__(
        self,
        id=None,
        username="",
        password="",
        full_name=None,
        email=None,
        calendar_id=None,
    ):
        super().__init__(id, email, password)
        self.username = username
        self.role_level = self.ROLE_LEVEL
        self.full_name = full_name
        self.calendar_id = calendar_id

    @classmethod
    def from_row(cls, row):
        """Factory: devuelve la subclase que corresponde al nivel guardado en la fila."""
        data = dict(zip(cls.COLUMNS, row))
        kind = SuperAdmin if data.pop("role_level") == LEVEL_SUPERADMIN else Teacher
        return kind(**data)

    @property
    def display_name(self):
        return self.full_name or self.username

    @property
    def calendar_target(self):
        """Calendario donde se agregan las clases: el configurado o, si no, el correo."""
        return self.calendar_id or self.email

    @property
    def is_superadmin(self):
        return self.role_level == LEVEL_SUPERADMIN

    @property
    def role_label(self):
        return self.ROLE_LABEL

    def update_profile(self, full_name, email, calendar_id):
        self.full_name = full_name
        self.email = email
        self.calendar_id = calendar_id

    # --- comportamiento que cambia según el rol ---

    @property
    def teacher_scope_id(self):
        """Docente cuyas reservas puede ver; None = todas."""
        raise NotImplementedError

    def can_manage(self, booking):
        raise NotImplementedError

    def dashboard_title(self, detail):
        raise NotImplementedError

    def dashboard_event(self, detail):
        """Reserva como evento del calendario del panel (Template Method)."""
        booking = detail.booking
        return {
            "id": str(booking.id),
            "title": self.dashboard_title(detail),
            "start": f"{booking.class_date}T{booking.class_time}",
            "end": booking.ends_at.isoformat(),
            "extendedProps": {
                "course": detail.course.course_name,
                "teacher": detail.teacher.display_name,
                "duration": booking.duration_minutes,
            },
            "color": self.DASHBOARD_COLOR,
        }

    # --- vistas JSON ---

    def to_option(self):
        return {"id": self.id, "name": self.display_name}

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "name": self.display_name,
            "email": self.email,
        }


class Teacher(Admin):
    ROLE_LEVEL = LEVEL_TEACHER
    ROLE_LABEL = "Docente"
    DASHBOARD_COLOR = "#e91e63"

    @property
    def teacher_scope_id(self):
        return self.id

    def can_manage(self, booking):
        return booking.teacher_id == self.id

    def dashboard_title(self, detail):
        return detail.student.name


class SuperAdmin(Admin):
    ROLE_LEVEL = LEVEL_SUPERADMIN
    ROLE_LABEL = "Superadministrador"
    DASHBOARD_COLOR = "#1976d2"

    @property
    def teacher_scope_id(self):
        return None

    def can_manage(self, booking):
        return True

    def dashboard_title(self, detail):
        return f"{detail.student.name} ({detail.teacher.display_name})"
