from werkzeug.security import check_password_hash, generate_password_hash

from app.entities.base import Entity


class Person(Entity):
    """Lo que comparten estudiantes y administradores: correo y contraseña (herencia)."""

    def __init__(self, id=None, email=None, password=None):
        super().__init__(id)
        self.email = email
        self.password = password

    @property
    def display_name(self):
        raise NotImplementedError

    @property
    def has_password(self):
        return self.password is not None

    def check_password(self, plain_password):
        return bool(self.password) and check_password_hash(self.password, plain_password)

    def change_password(self, plain_password):
        self.password = generate_password_hash(plain_password)
