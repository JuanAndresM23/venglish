from datetime import datetime, timedelta

from app.constants import (
    ALLOWED_DURATIONS,
    BOGOTA,
    CLASS_DURATION_MINUTES,
    MIN_BOOKING_NOTICE_HOURS,
    SLOT_MINUTES,
)
from app.database import UnitOfWork
from app.entities import TeacherSchedule
from app.utils.errors import ServiceError


class ScheduleService:
    """Horario semanal de los docentes y cálculo de horas disponibles."""

    def __init__(self, uow_factory=UnitOfWork):
        self._uow_factory = uow_factory

    @staticmethod
    def build_slots(ranges, class_minutes=CLASS_DURATION_MINUTES):
        base_day = datetime(2000, 1, 1).date()
        duration = timedelta(minutes=class_minutes)
        step = timedelta(minutes=SLOT_MINUTES)
        slots = set()

        for start_time, end_time in ranges:
            current = datetime.combine(base_day, start_time)
            limit = datetime.combine(base_day, end_time)

            while current + duration <= limit:
                slots.add(current.strftime("%H:%M"))
                current += step

        return sorted(slots)

    @staticmethod
    def valid_half_hour(value):
        try:
            parsed = datetime.strptime(value, "%H:%M")
        except (TypeError, ValueError):
            return False
        return parsed.minute in (0, 30)

    def available_slots(self, uow, teacher_id, day, duration_minutes=CLASS_DURATION_MINUTES):
        """Horas de inicio libres del docente en `day` para una clase de `duration_minutes`."""
        schedules = uow.schedules.list_for_day(teacher_id, day.isoweekday())
        ranges = [(block.start_time, block.end_time) for block in schedules]
        booked = uow.bookings.list_by_teacher_and_day(teacher_id, day)

        duration = timedelta(minutes=duration_minutes)
        min_start = datetime.now(BOGOTA) + timedelta(hours=MIN_BOOKING_NOTICE_HOURS)
        booked_ranges = []
        for booking in booked:
            start = datetime.strptime(f"{booking.class_time:%H:%M}", "%H:%M")
            booked_ranges.append((start, start + timedelta(minutes=booking.duration_minutes)))

        available = []
        for slot in self.build_slots(ranges, duration_minutes):
            slot_start = datetime.strptime(slot, "%H:%M")
            slot_end = slot_start + duration

            overlaps = any(
                slot_start < booked_end and slot_end > booked_start
                for booked_start, booked_end in booked_ranges
            )
            slot_datetime = datetime.combine(day, slot_start.time()).replace(tzinfo=BOGOTA)

            if not overlaps and slot_datetime >= min_start:
                available.append(slot)

        return available

    def get_available_times(self, teacher_id, date_text, duration_minutes=CLASS_DURATION_MINUTES):
        if not teacher_id or not date_text or duration_minutes not in ALLOWED_DURATIONS:
            return []

        try:
            day = datetime.strptime(date_text, "%Y-%m-%d").date()
        except ValueError:
            return []

        with self._uow_factory() as uow:
            return self.available_slots(uow, teacher_id, day, duration_minutes)

    def get_schedule(self, teacher_id):
        if not teacher_id:
            raise ServiceError("Selecciona un docente", 400)

        with self._uow_factory() as uow:
            blocks = uow.schedules.list_available(teacher_id)
        return [block.to_dict() for block in blocks]

    def save_schedule(self, teacher_id, blocks):
        if not teacher_id:
            raise ServiceError("Selecciona un docente", 400)
        if not isinstance(blocks, list):
            raise ServiceError("Formato de horario inválido", 400)

        clean_blocks = self._validate_blocks(blocks)

        with self._uow_factory(commit=True) as uow:
            if not uow.admins.teacher_exists(teacher_id):
                raise ServiceError("Docente inválido", 400)
            uow.schedules.replace_all(
                teacher_id,
                [
                    TeacherSchedule(
                        teacher_id=teacher_id,
                        day_of_week=day,
                        start_time=start.time(),
                        end_time=end.time(),
                    )
                    for day, start, end in clean_blocks
                ],
            )

    def _validate_blocks(self, blocks):
        clean_blocks = []
        for block in blocks:
            day = block.get("day")
            start = block.get("start")
            end = block.get("end")

            if day not in range(1, 8):
                raise ServiceError("Día inválido", 400)
            if not self.valid_half_hour(start) or not self.valid_half_hour(end):
                raise ServiceError("Las horas deben ser en punto o y media", 400)

            start_dt = datetime.strptime(start, "%H:%M")
            end_dt = datetime.strptime(end, "%H:%M")
            if end_dt - start_dt < timedelta(minutes=CLASS_DURATION_MINUTES):
                raise ServiceError("Cada bloque debe durar al menos una clase completa", 400)

            clean_blocks.append((day, start_dt, end_dt))

        clean_blocks.sort(key=lambda item: (item[0], item[1]))

        for current, following in zip(clean_blocks, clean_blocks[1:]):
            if current[0] == following[0] and following[1] < current[2]:
                raise ServiceError("Hay bloques que se cruzan en el mismo día", 400)

        return clean_blocks
