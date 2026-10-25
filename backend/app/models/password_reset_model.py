def create(cursor, student_id, token, expires_at):
    cursor.execute(
        """
        INSERT INTO password_reset_tokens (student_id, token, expires_at)
        VALUES (%s, %s, %s)
        """,
        (student_id, token, expires_at),
    )


def get_by_token(cursor, token):
    cursor.execute(
        """
        SELECT id, student_id, expires_at, used
        FROM password_reset_tokens
        WHERE token = %s
        """,
        (token,),
    )
    return cursor.fetchone()


def mark_used(cursor, reset_id):
    cursor.execute(
        "UPDATE password_reset_tokens SET used = TRUE WHERE id = %s",
        (reset_id,),
    )
