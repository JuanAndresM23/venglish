def get_credentials_by_code(cursor, student_code):
    cursor.execute(
        "SELECT id, name, password FROM students WHERE student_code = %s",
        (student_code,),
    )
    return cursor.fetchone()


def get_by_email(cursor, email):
    cursor.execute(
        "SELECT id, name, email FROM students WHERE LOWER(email) = %s",
        (email,),
    )
    return cursor.fetchone()


def get_for_activation(cursor, student_code):
    cursor.execute(
        "SELECT id, password FROM students WHERE student_code = %s FOR UPDATE",
        (student_code,),
    )
    return cursor.fetchone()


def set_password(cursor, student_id, password_hash):
    cursor.execute(
        "UPDATE students SET password = %s WHERE id = %s",
        (password_hash, student_id),
    )


def list_all(cursor):
    cursor.execute(
        "SELECT id, name, phone, email, student_code FROM students ORDER BY name"
    )
    return cursor.fetchall()


def create(cursor, name, phone, email, student_code):
    cursor.execute(
        """
        INSERT INTO students (name, phone, email, student_code)
        VALUES (%s, %s, %s, %s)
        """,
        (name, phone, email, student_code),
    )


def count(cursor):
    cursor.execute("SELECT COUNT(*) FROM students")
    return cursor.fetchone()[0]
