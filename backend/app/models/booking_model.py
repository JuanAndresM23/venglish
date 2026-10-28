_OVERLAP = """
    AND (class_date + class_time) < %s
    AND (class_date + class_time) + make_interval(mins => duration_minutes) > %s
"""


def find_student_overlap(cursor, student_id, class_end, class_start):
    cursor.execute(
        f"SELECT id FROM bookings WHERE student_id = %s {_OVERLAP} FOR UPDATE",
        (student_id, class_end, class_start),
    )
    return cursor.fetchone()


def find_teacher_overlap(cursor, teacher_id, class_end, class_start):
    cursor.execute(
        f"SELECT id FROM bookings WHERE teacher_id = %s {_OVERLAP} FOR UPDATE",
        (teacher_id, class_end, class_start),
    )
    return cursor.fetchone()


def create(cursor, course_id, student_id, teacher_id, class_date, class_time, duration_minutes):
    cursor.execute(
        """
        INSERT INTO bookings (
            course_id, student_id, teacher_id, class_date, class_time, duration_minutes
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (course_id, student_id, teacher_id, class_date, class_time, duration_minutes),
    )
    return cursor.fetchone()[0]


def get_reservation_contacts(cursor, course_id, teacher_id, student_id):
    cursor.execute(
        """
        SELECT s.name, s.email, c.course_name,
               COALESCE(a.full_name, a.username), a.email,
               COALESCE(NULLIF(a.calendar_id, ''), a.email)
        FROM students s
        JOIN courses c ON c.id = %s
        JOIN admins a ON a.id = %s
        WHERE s.id = %s
        """,
        (course_id, teacher_id, student_id),
    )
    return cursor.fetchone()


def list_by_student(cursor, student_id):
    cursor.execute(
        """
        SELECT b.id, c.course_name, b.class_date, b.class_time,
               COALESCE(a.full_name, a.username), b.duration_minutes
        FROM bookings b
        JOIN courses c ON b.course_id = c.id
        JOIN admins a ON b.teacher_id = a.id
        WHERE b.student_id = %s
        ORDER BY b.class_date, b.class_time
        """,
        (student_id,),
    )
    return cursor.fetchall()


def get_for_cancellation(cursor, booking_id):
    cursor.execute(
        """
        SELECT b.student_id, b.teacher_id, b.class_date, b.class_time,
               s.name, s.email, c.course_name,
               COALESCE(a.full_name, a.username), a.email, b.duration_minutes,
               COALESCE(NULLIF(a.calendar_id, ''), a.email), b.calendar_event_id
        FROM bookings b
        JOIN students s ON b.student_id = s.id
        JOIN courses c ON b.course_id = c.id
        JOIN admins a ON b.teacher_id = a.id
        WHERE b.id = %s
        FOR UPDATE
        """,
        (booking_id,),
    )
    return cursor.fetchone()


def set_calendar_event(cursor, booking_id, event_id):
    cursor.execute(
        "UPDATE bookings SET calendar_event_id = %s WHERE id = %s", (event_id, booking_id)
    )


def delete(cursor, booking_id):
    cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))


def list_for_dashboard(cursor, teacher_id=None):
    query = """
        SELECT b.id, s.name, c.course_name, b.class_date, b.class_time,
               COALESCE(a.full_name, a.username), b.duration_minutes
        FROM bookings b
        JOIN students s ON b.student_id = s.id
        JOIN courses c ON b.course_id = c.id
        JOIN admins a ON b.teacher_id = a.id
    """
    params = ()
    if teacher_id is not None:
        query += " WHERE b.teacher_id = %s"
        params = (teacher_id,)
    query += " ORDER BY b.class_date, b.class_time"
    cursor.execute(query, params)
    return cursor.fetchall()


def count_upcoming(cursor, teacher_id=None):
    query = "SELECT COUNT(*) FROM bookings WHERE class_date >= CURRENT_DATE"
    params = ()
    if teacher_id is not None:
        query += " AND teacher_id = %s"
        params = (teacher_id,)
    cursor.execute(query, params)
    return cursor.fetchone()[0]


def count_next_week(cursor, teacher_id=None):
    query = """
        SELECT COUNT(*) FROM bookings
        WHERE class_date >= CURRENT_DATE
          AND class_date < CURRENT_DATE + INTERVAL '7 days'
    """
    params = ()
    if teacher_id is not None:
        query += " AND teacher_id = %s"
        params = (teacher_id,)
    cursor.execute(query, params)
    return cursor.fetchone()[0]


def booked_times(cursor, teacher_id, day):
    cursor.execute(
        """
        SELECT to_char(class_time, 'HH24:MI'), duration_minutes
        FROM bookings
        WHERE teacher_id = %s AND class_date = %s
        """,
        (teacher_id, day),
    )
    return [(row[0], row[1]) for row in cursor.fetchall()]


def count_by_student(cursor, student_id):
    cursor.execute("SELECT COUNT(*) FROM bookings WHERE student_id = %s", (student_id,))
    return cursor.fetchone()[0]
