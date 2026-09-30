import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY")


def send_email(to_email, subject, html):
    try:
        resend.Emails.send({
            "from": os.getenv("EMAIL_FROM"),
            "to": [to_email],
            "subject": subject,
            "html": html,
        })

        return True

    except Exception as e:
        print(f"Error enviando correo: {e}")
        return False


def send_student_booking_email(
    student_name,
    student_email,
    teacher_name,
    course_name,
    date,
    time
):
    html = f"""
    <h2>✅ Clase Confirmada</h2>

    <p>Hola <strong>{student_name}</strong>,</p>

    <p>Tu clase ha sido confirmada.</p>

    <ul>
        <li><strong>Curso:</strong> {course_name}</li>
        <li><strong>Profesor:</strong> {teacher_name}</li>
        <li><strong>Fecha:</strong> {date}</li>
        <li><strong>Hora:</strong> {time}</li>
    </ul>

    <p>Gracias por confiar en VEnglish Academy.</p>
    """

    return send_email(
        student_email,
        "✅ Tu clase ha sido confirmada",
        html
    )


def send_teacher_booking_email(
    teacher_name,
    teacher_email,
    student_name,
    course_name,
    date,
    time
):
    html = f"""
    <h2>📚 Nueva Clase Asignada</h2>

    <p>Hola <strong>{teacher_name}</strong>,</p>

    <p>Se ha reservado una nueva clase.</p>

    <ul>
        <li><strong>Estudiante:</strong> {student_name}</li>
        <li><strong>Curso:</strong> {course_name}</li>
        <li><strong>Fecha:</strong> {date}</li>
        <li><strong>Hora:</strong> {time}</li>
    </ul>
    """

    return send_email(
        teacher_email,
        "📚 Nueva clase asignada",
        html
    )

def send_student_cancellation_email(
    student_name,
    student_email,
    teacher_name,
    course_name,
    date,
    time
):
    html = f"""
    <h2>❌ Clase Cancelada</h2>

    <p>Hola <strong>{student_name}</strong>,</p>

    <p>La siguiente clase ha sido cancelada:</p>

    <ul>
        <li><strong>Curso:</strong> {course_name}</li>
        <li><strong>Profesor:</strong> {teacher_name}</li>
        <li><strong>Fecha:</strong> {date}</li>
        <li><strong>Hora:</strong> {time}</li>
    </ul>
    """

    return send_email(
        student_email,
        "❌ Tu clase fue cancelada",
        html
    )

def send_teacher_cancellation_email(
    teacher_name,
    teacher_email,
    student_name,
    course_name,
    date,
    time
):
    html = f"""
    <h2>❌ Clase Cancelada</h2>

    <p>Hola <strong>{teacher_name}</strong>,</p>

    <p>Se canceló una clase.</p>

    <ul>
        <li><strong>Estudiante:</strong> {student_name}</li>
        <li><strong>Curso:</strong> {course_name}</li>
        <li><strong>Fecha:</strong> {date}</li>
        <li><strong>Hora:</strong> {time}</li>
    </ul>
    """

    return send_email(
        teacher_email,
        "❌ Clase cancelada",
        html
    )
def send_password_reset_email(
    student_name,
    student_email,
    reset_link
):
    html = f"""
    <h2>🔐 Recuperación de contraseña</h2>

    <p>Hola <strong>{student_name}</strong>,</p>

    <p>
        Recibimos una solicitud para restablecer tu contraseña.
    </p>

    <p>
        Haz clic en el siguiente enlace:
    </p>

    <p>
        {reset_link}
            Restablecer contraseña
        </a>
    </p>

    <p>
        Este enlace expirará en 1 hora.
    </p>
    """

    return send_email(
        student_email,
        "🔐 Recuperar contraseña VEnglish",
        html
    )

    return send_email(
        student_email,
        "🔐 Recuperar contraseña VEnglish",
        html
    )