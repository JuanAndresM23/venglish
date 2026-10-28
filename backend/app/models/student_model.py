def get_credentials_by_code(cursor, student_code):
    cursor.execute(
        "SELECT id, name, password, is_active FROM students WHERE student_code = %s",
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
        "SELECT id, password, is_active FROM students WHERE student_code = %s FOR UPDATE",
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
        "SELECT id, name, phone, email, student_code, password IS NOT NULL, is_active "
        "FROM students ORDER BY name"
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


def update(cursor, student_id, name, phone, email, student_code):
    cursor.execute(
        """
        UPDATE students
        SET name = %s, phone = %s, email = %s, student_code = %s
        WHERE id = %s
        """,
        (name, phone, email, student_code, student_id),
    )
    return cursor.rowcount


def get_for_delete(cursor, student_id):
    cursor.execute("SELECT id FROM students WHERE id = %s FOR UPDATE", (student_id,))
    return cursor.fetchone()


def delete(cursor, student_id):
    cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))


def set_active(cursor, student_id, is_active):
    cursor.execute(
        "UPDATE students SET is_active = %s WHERE id = %s", (is_active, student_id)
    )
    return cursor.rowcount


def is_active(cursor, student_id):
    cursor.execute("SELECT is_active FROM students WHERE id = %s", (student_id,))
    row = cursor.fetchone()
    return bool(row and row[0])
