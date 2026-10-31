"""Herramientas que el asistente puede usar (patrón Command).

Cada herramienta delega en los servicios existentes, así que las reglas de negocio
(48 h para reservar, 12 h para cancelar, cruces de horario) siguen aplicándose igual.
El `student_id` siempre viene de la sesión, nunca de lo que diga el modelo.
"""

import json

from app.constants import ALLOWED_DURATIONS, ROLE_STUDENT
from app.utils.errors import ServiceError


class ChatTool:
    name = ""
    description = ""
    input_schema = {"type": "object", "properties": {}, "required": [], "additionalProperties": False}
    changes_data = False  # True si modifica reservas

    def __init__(self, bookings, schedules):
        self._bookings = bookings
        self._schedules = schedules

    def definition(self):
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }

    def run(self, args, student_id):
        raise NotImplementedError

    def execute(self, args, student_id):
        """Devuelve (texto JSON, es_error); un error de negocio se le explica al modelo."""
        try:
            return json.dumps(self.run(args, student_id), ensure_ascii=False), False
        except ServiceError as error:
            return json.dumps({"error": error.message}, ensure_ascii=False), True
        except (KeyError, TypeError, ValueError):
            return json.dumps({"error": "Argumentos inválidos"}), True


def _object(properties):
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }


class ListMyClasses(ChatTool):
    name = "list_my_classes"
    description = (
        "Lista las clases reservadas del estudiante (id, curso, fecha, hora, profesor y "
        "duración en minutos), ordenadas por fecha. Incluye clases pasadas y futuras."
    )

    def run(self, args, student_id):
        return self._bookings.list_student_classes(student_id)


class ListCourses(ChatTool):
    name = "list_courses"
    description = "Lista los tipos de clase que se pueden reservar (id y nombre)."

    def run(self, args, student_id):
        return self._bookings.list_courses()


class ListTeachers(ChatTool):
    name = "list_teachers"
    description = "Lista los profesores disponibles (id y nombre)."

    def run(self, args, student_id):
        return self._bookings.list_teachers()


class GetAvailableTimes(ChatTool):
    name = "get_available_times"
    description = (
        "Horas de inicio libres de un profesor en una fecha para una duración dada. "
        "Devuelve una lista vacía si no hay horarios."
    )
    input_schema = _object({
        "teacher_id": {"type": "integer", "description": "Id del profesor"},
        "date": {"type": "string", "description": "Fecha en formato AAAA-MM-DD"},
        "duration": {
            "type": "integer",
            "enum": list(ALLOWED_DURATIONS),
            "description": "Duración de la clase en minutos",
        },
    })

    def run(self, args, student_id):
        return self._schedules.get_available_times(
            args["teacher_id"], args["date"], args["duration"]
        )


class BookClass(ChatTool):
    name = "book_class"
    changes_data = True
    description = (
        "Reserva una clase para el estudiante. Usa confirmed=true SOLO si el estudiante "
        "aceptó explícitamente el resumen de la reserva en su último mensaje."
    )
    input_schema = _object({
        "course_id": {"type": "integer"},
        "teacher_id": {"type": "integer"},
        "date": {"type": "string", "description": "Fecha AAAA-MM-DD"},
        "time": {"type": "string", "description": "Hora de inicio HH:MM"},
        "duration": {"type": "integer", "enum": list(ALLOWED_DURATIONS)},
        "confirmed": {"type": "boolean"},
    })

    def run(self, args, student_id):
        if not args["confirmed"]:
            raise ServiceError("El estudiante aún no ha confirmado la reserva.")
        booking_id = self._bookings.create_booking(
            student_id,
            {key: args[key] for key in ("course_id", "teacher_id", "date", "time", "duration")},
        )
        return {"booking_id": booking_id, "status": "reservada"}


class CancelClass(ChatTool):
    name = "cancel_class"
    changes_data = True
    description = (
        "Cancela una clase del estudiante. Usa confirmed=true SOLO si el estudiante "
        "aceptó explícitamente cancelar esa clase en su último mensaje."
    )
    input_schema = _object({
        "booking_id": {"type": "integer"},
        "confirmed": {"type": "boolean"},
    })

    def run(self, args, student_id):
        if not args["confirmed"]:
            raise ServiceError("El estudiante aún no ha confirmado la cancelación.")
        self._bookings.cancel_booking(
            args["booking_id"], role=ROLE_STUDENT, student_id=student_id, user_id=None
        )
        return {"booking_id": args["booking_id"], "status": "cancelada"}


def build_tools(bookings, schedules):
    classes = (ListMyClasses, ListCourses, ListTeachers, GetAvailableTimes, BookClass, CancelClass)
    return {tool.name: tool for tool in (cls(bookings, schedules) for cls in classes)}
