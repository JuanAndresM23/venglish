def get_ranges_for_day(cursor, teacher_id, day_of_week):
    cursor.execute(
        """
        SELECT start_time, end_time
        FROM teacher_schedules
        WHERE teacher_id = %s
          AND day_of_week = %s
          AND COALESCE(is_available, TRUE)
        """,
        (teacher_id, day_of_week),
    )
    return cursor.fetchall()


def list_blocks(cursor, teacher_id):
    cursor.execute(
        """
        SELECT day_of_week,
               to_char(start_time, 'HH24:MI'),
               to_char(end_time, 'HH24:MI')
        FROM teacher_schedules
        WHERE teacher_id = %s
          AND COALESCE(is_available, TRUE)
        ORDER BY day_of_week, start_time
        """,
        (teacher_id,),
    )
    return cursor.fetchall()


def replace_blocks(cursor, teacher_id, blocks):
    cursor.execute(
        "DELETE FROM teacher_schedules WHERE teacher_id = %s", (teacher_id,)
    )
    for day, start_time, end_time in blocks:
        cursor.execute(
            """
            INSERT INTO teacher_schedules (
                teacher_id, day_of_week, start_time, end_time, is_available
            )
            VALUES (%s, %s, %s, %s, TRUE)
            """,
            (teacher_id, day, start_time, end_time),
        )
