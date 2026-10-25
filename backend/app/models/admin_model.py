from app.constants import LEVEL_TEACHER


def get_by_username(cursor, username):
    cursor.execute(
        "SELECT id, username, password, role_level, full_name FROM admins WHERE username = %s",
        (username,),
    )
    return cursor.fetchone()


def list_teachers(cursor):
    cursor.execute(
        """
        SELECT id, COALESCE(full_name, username)
        FROM admins
        WHERE role_level = %s
        ORDER BY COALESCE(full_name, username)
        """,
        (LEVEL_TEACHER,),
    )
    return cursor.fetchall()


def teacher_exists(cursor, teacher_id):
    cursor.execute(
        "SELECT 1 FROM admins WHERE id = %s AND role_level = %s",
        (teacher_id, LEVEL_TEACHER),
    )
    return cursor.fetchone() is not None


def count_teachers(cursor):
    cursor.execute(
        "SELECT COUNT(*) FROM admins WHERE role_level = %s", (LEVEL_TEACHER,)
    )
    return cursor.fetchone()[0]
