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


def list_teacher_accounts(cursor):
    cursor.execute(
        """
        SELECT id, username, full_name, email
        FROM admins
        WHERE role_level = %s
        ORDER BY COALESCE(full_name, username)
        """,
        (LEVEL_TEACHER,),
    )
    return cursor.fetchall()


def username_exists(cursor, username):
    cursor.execute("SELECT 1 FROM admins WHERE LOWER(username) = %s", (username,))
    return cursor.fetchone() is not None


def create_teacher(cursor, username, password_hash, full_name, email):
    cursor.execute(
        """
        INSERT INTO admins (username, password, role_level, full_name, email)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (username, password_hash, LEVEL_TEACHER, full_name, email),
    )


def count_teachers(cursor):
    cursor.execute(
        "SELECT COUNT(*) FROM admins WHERE role_level = %s", (LEVEL_TEACHER,)
    )
    return cursor.fetchone()[0]


def get_by_id(cursor, admin_id):
    cursor.execute(
        "SELECT username, full_name, email, role_level FROM admins WHERE id = %s",
        (admin_id,),
    )
    return cursor.fetchone()


def update_profile(cursor, admin_id, full_name, email):
    cursor.execute(
        "UPDATE admins SET full_name = %s, email = %s WHERE id = %s",
        (full_name, email, admin_id),
    )


def get_password_hash(cursor, admin_id):
    cursor.execute("SELECT password FROM admins WHERE id = %s FOR UPDATE", (admin_id,))
    row = cursor.fetchone()
    return row[0] if row else None


def set_password(cursor, admin_id, password_hash):
    cursor.execute(
        "UPDATE admins SET password = %s WHERE id = %s", (password_hash, admin_id)
    )


def get_by_username_and_email(cursor, username, email):
    cursor.execute(
        """
        SELECT id, COALESCE(full_name, username), email
        FROM admins
        WHERE username = %s AND LOWER(email) = %s
        """,
        (username, email),
    )
    return cursor.fetchone()
