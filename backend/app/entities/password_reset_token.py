from datetime import datetime

from app.entities.base import Entity


class PasswordResetToken(Entity):
    TABLE = "password_reset_tokens"
    COLUMNS = ("id", "student_id", "admin_id", "token", "expires_at", "used")

    def __init__(
        self,
        id=None,
        student_id=None,
        admin_id=None,
        token="",
        expires_at=None,
        used=False,
    ):
        super().__init__(id)
        self.student_id = student_id
        self.admin_id = admin_id
        self.token = token
        self.expires_at = expires_at
        self.used = used

    @property
    def belongs_to_admin(self):
        return self.admin_id is not None

    @property
    def is_expired(self):
        return self.expires_at < datetime.now()

    def mark_used(self):
        self.used = True
