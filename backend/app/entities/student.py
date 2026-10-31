from app.entities.person import Person


class Student(Person):
    TABLE = "students"
    COLUMNS = (
        "id", "name", "phone", "email", "student_code",
        "password", "registration_date", "is_active",
    )

    def __init__(
        self,
        id=None,
        name="",
        phone=None,
        email=None,
        student_code="",
        password=None,
        registration_date=None,
        is_active=True,
    ):
        super().__init__(id, email, password)
        self.name = name
        self.phone = phone
        self.student_code = student_code
        self.registration_date = registration_date
        self.is_active = is_active

    @property
    def display_name(self):
        return self.name

    def update_details(self, name, phone, email, student_code):
        self.name = name
        self.phone = phone
        self.email = email
        self.student_code = student_code

    def enable(self):
        self.is_active = True

    def disable(self):
        self.is_active = False

    def to_dict(self):
        """Vista para el panel de administración."""
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "code": self.student_code,
            "active": self.has_password,
            "enabled": self.is_active,
        }
