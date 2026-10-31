import logging

from app.constants import ROLE_STUDENT
from app.database import IntegrityError, UnitOfWork
from app.entities import Booking
from app.events import BookingCancelled, BookingCreated, EventBus
from app.services import cancellation_policy
from app.services.booking_request import BookingRequest
from app.services.schedule_service import ScheduleService
from app.utils.errors import ServiceError

logger = logging.getLogger(__name__)


class BookingService:
    """Reservas y cancelaciones de clases (Facade para los controladores)."""

    def __init__(self, uow_factory=UnitOfWork, schedules=None, events=None):
        self._uow_factory = uow_factory
        self._schedules = schedules or ScheduleService(uow_factory)
        self._events = events or EventBus()

    def list_courses(self):
        with self._uow_factory() as uow:
            courses = uow.courses.list_active()
        return [course.to_dict() for course in courses]

    def list_teachers(self):
        with self._uow_factory() as uow:
            teachers = uow.admins.list_teachers()
        return [teacher.to_option() for teacher in teachers]

    def list_student_classes(self, student_id):
        with self._uow_factory() as uow:
            details = uow.bookings.list_details(student_id=student_id)
        return [detail.to_student_view() for detail in details]

    def create_booking(self, student_id, data):
        request = BookingRequest.from_payload(data)

        try:
            with self._uow_factory(commit=True) as uow:
                student = uow.students.find_by_id(student_id)
                if not student or not student.is_active:
                    raise ServiceError(
                        "Tu cuenta está desactivada. Comunícate con la academia.", 403
                    )
                if not uow.courses.active_exists(request.course_id):
                    raise ServiceError("Curso inválido", 400)
                if not uow.admins.teacher_exists(request.teacher_id):
                    raise ServiceError("Profesor inválido", 400)

                slots = self._schedules.available_slots(
                    uow, request.teacher_id, request.requested_at.date(), request.duration
                )
                if request.time_text not in slots:
                    raise ServiceError(
                        "El profesor no está disponible en ese horario para la duración elegida",
                        409,
                    )

                if uow.bookings.find_student_overlap(
                    student_id, request.class_end, request.class_start
                ):
                    raise ServiceError("Ya tienes una clase que se cruza con ese horario", 409)
                if uow.bookings.find_teacher_overlap(
                    request.teacher_id, request.class_end, request.class_start
                ):
                    raise ServiceError("El profesor ya está ocupado en ese horario", 409)

                booking = uow.bookings.add(
                    Booking(
                        course_id=request.course_id,
                        student_id=student_id,
                        teacher_id=request.teacher_id,
                        class_date=request.class_start.date(),
                        class_time=request.class_start.time(),
                        duration_minutes=request.duration,
                    )
                )
                detail = uow.bookings.find_detail(booking.id)
        except ServiceError:
            raise
        except IntegrityError:
            raise ServiceError("El horario acaba de ser reservado. Selecciona otro", 409)
        except Exception:
            logger.exception("Error creando reserva")
            raise ServiceError("No fue posible crear la reserva", 500)

        self._events.publish(BookingCreated(detail))
        return booking.id

    def cancel_booking(self, booking_id, role, student_id, user_id):
        with self._uow_factory(commit=True) as uow:
            detail = uow.bookings.find_detail(booking_id, for_update=True)
            if not detail:
                raise ServiceError("La reserva no existe", 404)

            admin = None
            if role != ROLE_STUDENT:
                admin = uow.admins.find_by_id(user_id)
                if admin is None:
                    raise ServiceError("No autorizado", 401)

            policy = cancellation_policy.policy_for(role, student_id=student_id, admin=admin)
            policy.ensure_allowed(detail)

            uow.bookings.delete(booking_id)

        self._events.publish(BookingCancelled(detail))
