def list_all(cursor):
    cursor.execute(
        "SELECT id, course_name FROM courses WHERE is_active = TRUE ORDER BY id"
    )
    return cursor.fetchall()


def exists(cursor, course_id):
    cursor.execute(
        "SELECT 1 FROM courses WHERE id = %s AND is_active = TRUE", (course_id,)
    )
    return cursor.fetchone() is not None
