from datetime import datetime, timedelta

from flask import jsonify, request, session

SLOT_MINUTES = 30


def build_slots(ranges, class_minutes):
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


def get_teacher_slots(cursor, teacher_id, day, class_minutes):
    cursor.execute("""
        SELECT start_time, end_time
        FROM teacher_schedules
        WHERE teacher_id = %s
          AND day_of_week = %s
          AND COALESCE(is_available, TRUE)
    """, (teacher_id, day.isoweekday()))

    return build_slots(cursor.fetchall(), class_minutes)


def valid_half_hour(value):
    try:
        parsed = datetime.strptime(value, "%H:%M")
    except (TypeError, ValueError):
        return False
    return parsed.minute in (0, 30)


def schedule_teacher_id(source):
    if session.get("role_level") == 1:
        try:
            return int(source.get("teacher_id"))
        except (TypeError, ValueError):
            return None
    return session.get("user_id")


def register_schedule_routes(app, db_cursor, admin_required, json_body,
                             bogota, class_minutes, min_notice_hours):

    @app.get("/api/available-times")
    def available_times():
        teacher_id = request.args.get("teacher_id", type=int)
        date_text = request.args.get("date")

        if not teacher_id or not date_text:
            return jsonify([])

        try:
            day = datetime.strptime(date_text, "%Y-%m-%d").date()
        except ValueError:
            return jsonify([])

        with db_cursor() as cursor:
            teacher_slots = get_teacher_slots(cursor, teacher_id, day, class_minutes)

            cursor.execute("""
                SELECT TO_CHAR(class_time, 'HH24:MI')
                FROM bookings
                WHERE teacher_id = %s
                  AND class_date = %s
            """, (teacher_id, day))
            rows = cursor.fetchall()

        duration = timedelta(minutes=class_minutes)
        min_start = datetime.now(bogota) + timedelta(hours=min_notice_hours)
        booked_starts = [datetime.strptime(row[0], "%H:%M") for row in rows]

        available = []

        for slot in teacher_slots:
            slot_start = datetime.strptime(slot, "%H:%M")
            slot_end = slot_start + duration

            overlaps = any(
                slot_start < booked + duration and slot_end > booked
                for booked in booked_starts
            )

            slot_datetime = datetime.combine(day, slot_start.time()).replace(tzinfo=bogota)

            if not overlaps and slot_datetime >= min_start:
                available.append(slot)

        return jsonify(available)

    @app.get("/api/admin/schedule")
    @admin_required
    def get_schedule():
        teacher_id = schedule_teacher_id(request.args)

        if not teacher_id:
            return jsonify({"error": "Selecciona un docente"}), 400

        with db_cursor() as cursor:
            cursor.execute("""
                SELECT
                    day_of_week,
                    TO_CHAR(start_time, 'HH24:MI'),
                    TO_CHAR(end_time, 'HH24:MI')
                FROM teacher_schedules
                WHERE teacher_id = %s
                  AND COALESCE(is_available, TRUE)
                ORDER BY day_of_week, start_time
            """, (teacher_id,))
            rows = cursor.fetchall()

        return jsonify([
            {"day": row[0], "start": row[1], "end": row[2]}
            for row in rows
        ])

    @app.post("/api/admin/schedule")
    @admin_required
    def save_schedule():
        data = json_body()
        teacher_id = schedule_teacher_id(data)

        if not teacher_id:
            return jsonify({"error": "Selecciona un docente"}), 400

        blocks = data.get("blocks")

        if not isinstance(blocks, list):
            return jsonify({"error": "Formato de horario inválido"}), 400

        clean_blocks = []

        for block in blocks:
            day = block.get("day")
            start = block.get("start")
            end = block.get("end")

            if day not in range(1, 8):
                return jsonify({"error": "Día inválido"}), 400

            if not valid_half_hour(start) or not valid_half_hour(end):
                return jsonify({"error": "Las horas deben ser en punto o y media"}), 400

            start_dt = datetime.strptime(start, "%H:%M")
            end_dt = datetime.strptime(end, "%H:%M")

            if end_dt - start_dt < timedelta(minutes=class_minutes):
                return jsonify({"error": "Cada bloque debe durar al menos una clase completa"}), 400

            clean_blocks.append((day, start_dt, end_dt))

        clean_blocks.sort(key=lambda item: (item[0], item[1]))

        for current, following in zip(clean_blocks, clean_blocks[1:]):
            current_day, current_start, current_end = current
            next_day, next_start, next_end = following

            if current_day == next_day and next_start < current_end:
                return jsonify({"error": "Hay bloques que se cruzan en el mismo día"}), 400

        with db_cursor(commit=True) as cursor:
            cursor.execute(
                "SELECT 1 FROM admins WHERE id = %s AND role_level = 0",
                (teacher_id,)
            )

            if not cursor.fetchone():
                return jsonify({"error": "Docente inválido"}), 400

            cursor.execute(
                "DELETE FROM teacher_schedules WHERE teacher_id = %s",
                (teacher_id,)
            )

            for day, start_dt, end_dt in clean_blocks:
                cursor.execute("""
                    INSERT INTO teacher_schedules (
                        teacher_id, day_of_week, start_time, end_time, is_available
                    )
                    VALUES (%s, %s, %s, %s, TRUE)
                """, (teacher_id, day, start_dt.time(), end_dt.time()))

        return jsonify({"message": "Horario guardado correctamente"}), 200