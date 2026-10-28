from datetime import datetime, timedelta

from app.constants import (
    ALLOWED_DURATIONS,
    BOGOTA,
    CLASS_DURATION_MINUTES,
    MIN_BOOKING_NOTICE_HOURS,
    SLOT_MINUTES,
)
from app.database import db_cursor
from app.models import admin_model, booking_model, schedule_model
from app.utils.errors import ServiceError


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


def valid_half_hour(value):
    try:
        parsed = datetime.strptime(value, "%H:%M")
    except (TypeError, ValueError):
        return False
    return parsed.minute in (0, 30)


def available_slots(cursor, teacher_id, day, duration_minutes=CLASS_DURATION_MINUTES):
    """Horas de inicio libres del docente en `day` para una clase de `duration_minutes`."""
    ranges = schedule_model.get_ranges_for_day(cursor, teacher_id, day.isoweekday())
    booked = booking_model.booked_times(cursor, teacher_id, day)

    duration = timedelta(minutes=duration_minutes)
    min_start = datetime.now(BOGOTA) + timedelta(hours=MIN_BOOKING_NOTICE_HOURS)
    booked_ranges = [
        (
            datetime.strptime(start, "%H:%M"),
            datetime.strptime(start, "%H:%M") + timedelta(minutes=minutes),
        )
        for start, minutes in booked
    ]

    available = []
    for slot in build_slots(ranges, duration_minutes):
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


def get_available_times(teacher_id, date_text, duration_minutes=CLASS_DURATION_MINUTES):
    if not teacher_id or not date_text or duration_minutes not in ALLOWED_DURATIONS:
        return []

    try:
        day = datetime.strptime(date_text, "%Y-%m-%d").date()
    except ValueError:
        return []

    with db_cursor() as cursor:
        return available_slots(cursor, teacher_id, day, duration_minutes)


def get_schedule(teacher_id):
    if not teacher_id:
        raise ServiceError("Selecciona un docente", 400)

    with db_cursor() as cursor:
        rows = schedule_model.list_blocks(cursor, teacher_id)
    return [{"day": row[0], "start": row[1], "end": row[2]} for row in rows]


def save_schedule(teacher_id, blocks):
    if not teacher_id:
        raise ServiceError("Selecciona un docente", 400)
    if not isinstance(blocks, list):
        raise ServiceError("Formato de horario inválido", 400)

    clean_blocks = []
    for block in blocks:
        day = block.get("day")
        start = block.get("start")
        end = block.get("end")

        if day not in range(1, 8):
            raise ServiceError("Día inválido", 400)
        if not valid_half_hour(start) or not valid_half_hour(end):
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

    with db_cursor(commit=True) as cursor:
        if not admin_model.teacher_exists(cursor, teacher_id):
            raise ServiceError("Docente inválido", 400)
        schedule_model.replace_blocks(
            cursor,
            teacher_id,
            [(day, start.time(), end.time()) for day, start, end in clean_blocks],
        )
