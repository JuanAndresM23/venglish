"""Quién puede cancelar una reserva y bajo qué condiciones (Strategy + Factory)."""

from datetime import datetime, timedelta

from app.constants import BOGOTA, MIN_CANCELLATION_NOTICE_HOURS, ROLE_STUDENT
from app.utils.errors import ServiceError


class CancellationPolicy:
    def ensure_allowed(self, detail):
        raise NotImplementedError


class StudentCancellationPolicy(CancellationPolicy):
    def __init__(self, student_id):
        self.student_id = student_id

    def ensure_allowed(self, detail):
        booking = detail.booking
        if booking.student_id != self.student_id:
            raise ServiceError("No puedes cancelar esta reserva", 403)

        limit = datetime.now(BOGOTA) + timedelta(hours=MIN_CANCELLATION_NOTICE_HOURS)
        if booking.starts_at_bogota < limit:
            raise ServiceError("Solo puedes cancelar hasta 12 horas antes", 400)


class AdminCancellationPolicy(CancellationPolicy):
    """El permiso lo decide el propio administrador (polimorfismo Teacher / SuperAdmin)."""

    def __init__(self, admin):
        self.admin = admin

    def ensure_allowed(self, detail):
        if not self.admin.can_manage(detail.booking):
            raise ServiceError("No puedes cancelar una clase de otro docente", 403)


def policy_for(role, student_id=None, admin=None):
    """Factory: elige la política según el rol de quien cancela."""
    if role == ROLE_STUDENT:
        return StudentCancellationPolicy(student_id)
    return AdminCancellationPolicy(admin)
