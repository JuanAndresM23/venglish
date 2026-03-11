from flask import Flask, render_template
from database import get_connection
from flask import request, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session

app = Flask(__name__)
app.secret_key = "una_clave_muy_segura_aqui"

@app.route("/")
def home():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students")
    students = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("index.html", students=students)


#inserta los estudiantes
@app.route("/add_student", methods=["GET", "POST"])
def add_student():
    if request.method == "POST":
        name = request.form["name"]
        phone = request.form["phone"]
        email = request.form["email"]

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO students (name, phone, email) VALUES (%s, %s, %s)",
            (name, phone, email)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return redirect(url_for("home"))

    return render_template("add_student.html")


@app.route("/student_register", methods=["GET", "POST"])
def student_register():
    if request.method == "POST":
        code = request.form["student_code"]
        password = request.form["password"]
        name = request.form["name"]
        email = request.form["email"]

        conn = get_connection()
        cursor = conn.cursor()

        # Verificar que Victoria ya creó el código
        cursor.execute("SELECT id FROM students WHERE student_code=%s", (code,))
        student = cursor.fetchone()

        if student:
            # Actualizar datos y contraseña
            cursor.execute(
                "UPDATE students SET name=%s, email=%s, password=%s WHERE student_code=%s",
                (name, email, generate_password_hash(password), code)
            )
        else:
            cursor.close()
            conn.close()
            return "⚠️ Código inválido, contacta a Victoria."

        conn.commit()
        cursor.close()
        conn.close()
        return "✅ Registro exitoso, ya puedes iniciar sesión."

    return render_template("student_register.html")


@app.route("/student_login", methods=["GET", "POST"])
def student_login():
    if request.method == "POST":
        code = request.form["student_code"]
        password = request.form["password"]

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, password FROM students WHERE student_code=%s", (code,))
        student = cursor.fetchone()
        cursor.close()
        conn.close()

        if student and check_password_hash(student[1], password):
            session["student_id"] = student[0]
            return redirect(url_for("reserve_class"))
        else:
            return "⚠️ Código o contraseña incorrecta."

    return render_template("student_login.html")

#reserva estudiantes 
@app.route("/reserve_class", methods=["GET", "POST"])
def reserve_class():
    # Verificar que el estudiante haya iniciado sesión
    student_id = session.get("student_id")
    if not student_id:
        return redirect(url_for("student_login"))

    # Conexión a la base de datos
    conn = get_connection()
    cursor = conn.cursor()
    
    # Traer cursos para dropdown
    cursor.execute("SELECT id, course_name FROM courses")
    courses = cursor.fetchall()

    # Traer los horarios ya ocupados
    cursor.execute("SELECT class_date, class_time FROM bookings")
    booked = cursor.fetchall()
    booked_set = {(str(date), str(time)) for date, time in booked}

    if request.method == "POST":
        student_name = request.form["name"]
        student_phone = request.form["phone"]
        student_email = request.form["email"]
        course_id = request.form["course_id"]
        class_date = request.form["class_date"]
        class_time = request.form["class_time"]

        # Crear o recuperar estudiante
        cursor.execute(
            "SELECT id FROM students WHERE phone=%s",
            (student_phone,)
        )
        student = cursor.fetchone()
        if student:
            student_id = student[0]
        else:
            cursor.execute(
                "INSERT INTO students (name, phone, email) VALUES (%s, %s, %s) RETURNING id",
                (student_name, student_phone, student_email)
            )
            student_id = cursor.fetchone()[0]
            conn.commit()

        # Verificar si el horario está libre
        if (class_date, class_time) in booked_set:
            cursor.close()
            conn.close()
            return "⚠️ Ese horario ya está ocupado, elige otro."

        # Guardar la reserva
        cursor.execute(
            "INSERT INTO bookings (student_id, course_id, class_date, class_time) VALUES (%s, %s, %s, %s)",
            (student_id, course_id, class_date, class_time)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return "✅ Clase reservada con éxito!"

    cursor.close()
    conn.close()
    return render_template("reserve_class.html", courses=courses, booked=booked_set)

#vista victoria

@app.route("/dashboard")
def dashboard():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT s.name, c.course_name, b.class_date, b.class_time
        FROM bookings b
        JOIN students s ON b.student_id = s.id
        JOIN courses c ON b.course_id = c.id
        ORDER BY b.class_date, b.class_time
    """)
    reservations = cursor.fetchall()
    cursor.close()
    conn.close()

    return render_template("dashboard.html", reservations=reservations)

if __name__ == "__main__":
    app.run(debug=True)
    
