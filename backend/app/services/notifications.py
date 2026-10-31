"""Observadores de los eventos de reserva (Observer): correos y Google Calendar."""

import logging

from app.database import UnitOfWork
from app.events import BookingCancelled, BookingCreated, EventBus
from app.services.email_service import EmailService
from app.services.google_calendar import GoogleCalendar

logger = logging.getLogger(__name__)


class BookingEmailNotifier:
    """Avisa por correo al estudiante y al docente cuando una reserva se crea o cancela."""

    def __init__(self, emails=None):
        self._emails = emails or EmailService()

    @staticmethod
    def _details(detail):
        return dict(
            teacher_name=detail.teacher.display_name,
            course_name=detail.course.course_name,
            date=str(detail.booking.class_date),
            time=detail.time_range,
        )

    def on_created(self, event):
        detail = event.detail
        common = self._details(detail)
        self._emails.send_student_booking_email(
            student_name=detail.student.name, student_email=detail.student.email, **common
        )
        self._emails.send_teacher_booking_email(
            teacher_email=detail.teacher.email, student_name=detail.student.name, **common
        )

    def on_cancelled(self, event):
        detail = event.detail
        common = self._details(detail)
        self._emails.send_student_cancellation_email(
            student_name=detail.student.name, student_email=detail.student.email, **common
        )
        self._emails.send_teacher_cancellation_email(
            teacher_email=detail.teacher.email, student_name=detail.student.name, **common
        )


class CalendarSynchronizer:
    """Mantiene el calendario del docente al día con sus reservas."""

    def __init__(self, calendar=None, uow_factory=UnitOfWork):
        self._calendar = calendar or GoogleCalendar()
        self._uow_factory = uow_factory

    def on_created(self, event):
        detail = event.detail
        booking = detail.booking
        student = detail.student
        event_id = self._calendar.create_event(
            detail.teacher.calendar_target,
            summary=f"{detail.course.course_name} - {student.name}",
            description=(
                f"Clase reservada en Venglish por {student.name} "
                f"({student.email or 'sin correo'})."
            ),
            start=booking.starts_at,
            minutes=booking.duration_minutes,
        )
        if not event_id:
            return
        try:
            with self._uow_factory(commit=True) as uow:
                stored = uow.bookings.find_by_id(booking.id, for_update=True)
                if stored:
                    stored.attach_calendar_event(event_id)
                    uow.bookings.update(stored)
        except Exception:
            logger.exception("Error guardando el evento de calendario de la reserva %s", booking.id)

    def on_cancelled(self, event):
        detail = event.detail
        self._calendar.delete_event(detail.teacher.calendar_target, detail.booking.calendar_event_id)


def register_subscribers(bus=None):
    bus = bus or EventBus()
    emails = BookingEmailNotifier()
    calendar = CalendarSynchronizer()
    bus.subscribe(BookingCreated, emails.on_created)
    bus.subscribe(BookingCreated, calendar.on_created)
    bus.subscribe(BookingCancelled, emails.on_cancelled)
    bus.subscribe(BookingCancelled, calendar.on_cancelled)
