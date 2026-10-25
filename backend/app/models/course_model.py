def list_all(cursor):
    cursor.execute("SELECT id, course_name FROM courses ORDER BY course_name")
    return cursor.fetchall()


def exists(cursor, course_id):
    cursor.execute("SELECT 1 FROM courses WHERE id = %s", (course_id,))
    return cursor.fetchone() is not None
