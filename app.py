from flask import Flask, render_template
from database import get_connection
from flask import request, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session
from flask import Flask, render_template, request, redirect, session
from functools import wraps
from flask import session, redirect, url_for

app = Flask(__name__)
app.secret_key = "Parkour2311"
conn = get_connection()
from datetime import timedelta

# 1. Definir cuánto tiempo dura la sesión (10 minutos)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=0.10)

# 2. Asegurarse de que la sesión sea "permanente" (para que use el tiempo anterior)
@app.before_request
def make_session_permanent():
    session.permanent = True



def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Verificamos si la clave "admin" existe en la sesión
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return decorated_function

@app.route("/logout")
def logout():
    # Elimina todos los datos de la sesión actual
    session.clear() 
    # Redirige al login para que el usuario sepa que salió
    return redirect(url_for("admin_login"))


@app.route("/")
def index():
 return render_template('index.html')

@app.route("/list_student")
def list_student():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students")
    students = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("list_student.html", students=students)


#inserta los estudiantes
@app.route("/add_student", methods=["GET", "POST"])
@admin_required

def add_student():
    if "admin" not in session:
        return redirect("/admin_login")
   

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

        return redirect(url_for("index"))

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

        student_code = request.form["student_code"]
        password = request.form["password"]

        cur = conn.cursor()

        cur.execute("""
            SELECT id, name
            FROM students
            WHERE student_code = %s AND password = %s
        """, (student_code, password))

        student = cur.fetchone()

        if student:

            session["student_id"] = student[0]
            session["student_name"] = student[1]

            return redirect("/student_dashboard")

        else:
            return "Invalid login"

    return render_template("student_login.html")

#reserva estudiantes 
@app.route("/reserve_class", methods=["GET", "POST"])
def reserve_class():

    if "student_id" not in session:
        return redirect("/student_login")

    # Verificar que el estudiante haya iniciado sesión
    student_id = session.get("student_id")
    if not student_id:
        return redirect(url_for("student_login"))

    conn = get_connection()
    cursor = conn.cursor()

    # Traer cursos para el dropdown
    cursor.execute("SELECT id, course_name FROM courses")
    courses = cursor.fetchall()

    # Traer horarios ocupados
    cursor.execute("SELECT class_date, class_time FROM bookings")
    booked = cursor.fetchall()
    booked_set = {(str(date), str(time)) for date, time in booked}

    if request.method == "POST":

        course_id = request.form["course_id"]
        class_date = request.form["class_date"]
        class_time = request.form["class_time"]

        # Verificar si el estudiante ya tiene una clase en ese horario
        cursor.execute("""
        SELECT id
        FROM bookings
        WHERE student_id = %s
        AND class_date = %s
        AND class_time = %s
        """, (student_id, class_date, class_time))

        existing_booking = cursor.fetchone()

        if existing_booking:
            cursor.close()
            conn.close()
            return "⚠️ You already have a class at this time."

        # Verificar si el horario ya está ocupado
        if (class_date, class_time) in booked_set:
            cursor.close()
            conn.close()
            return "⚠️ This time slot is already booked."

        # Guardar reserva
        cursor.execute("""
        INSERT INTO bookings (student_id, course_id, class_date, class_time)
        VALUES (%s, %s, %s, %s)
        """, (student_id, course_id, class_date, class_time))

        conn.commit()

        cursor.close()
        conn.close()

        return "✅ Class reserved successfully!"

    cursor.close()
    conn.close()

    return render_template("reserve_class.html", courses=courses, booked=booked_set)

#vista victoria

@app.route("/dashboard")
def dashboard():

    if "admin" not in session:
        return redirect("/admin_login")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
bookings.id,
        students.name,
        students.phone,
        students.email,
        courses.course_name,
        bookings.class_date,
        bookings.class_time
    FROM bookings
    JOIN students ON bookings.student_id = students.id
    JOIN courses ON bookings.course_id = courses.id
    ORDER BY bookings.class_date, bookings.class_time
    """)

    rows = cursor.fetchall()

    events = []

    for row in rows:

     events.append({
            "id": row[0],
            "title": row[1],
            "start": f"{row[5]}T{row[6]}",
            "course": row[4],
            "phone": row[2],
            "email": row[3]
        })

    cursor.close()
    conn.close()
  
    return render_template("dashboard.html", events=events)


#estudiantes
@app.route("/student_dashboard")
def student_dashboard():


    if "student_id" not in session:
        return redirect("/student_login")

    student_id = session["student_id"]

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT 
        bookings.id,
        courses.course_name,
        bookings.class_date,
        bookings.class_time
    FROM bookings
    JOIN courses ON bookings.course_id = courses.id
    WHERE bookings.student_id = %s
    ORDER BY bookings.class_date, bookings.class_time
    """, (student_id,))

    classes = cursor.fetchall()

    cursor.close()
    conn.close()



    return render_template("student_dashboard.html", classes=classes)


@app.route("/cancel_class/<int:booking_id>")
def cancel_class(booking_id):

    student_id = session.get("student_id")

    if not student_id:
        return redirect(url_for("student_login"))

    conn = get_connection()
    cursor = conn.cursor()

    # eliminar solo si la reserva pertenece al estudiante
    cursor.execute("""
    DELETE FROM bookings
    WHERE id = %s AND student_id = %s
    """, (booking_id, student_id))

    conn.commit()

    cursor.close()
    conn.close()

    return redirect(url_for("student_dashboard"))


@app.route("/delete_booking/<int:booking_id>")
def delete_booking(booking_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM bookings WHERE id = %s",
        (booking_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return "deleted"

@app.route("/admin_login", methods=["GET","POST"])
def admin_login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        cur = conn.cursor()
        cur.execute("SELECT * FROM admins WHERE username=%s AND password=%s", (username, password))
        admin = cur.fetchone()

        if admin:
            session["admin"] = True
            
            # 1. Buscamos si existe un destino previo en la URL
            next_page = request.args.get('next')
            
            # 2. Si existe, vamos allá. Si no, vamos al dashboard.
            # (El or "/dashboard" es tu salvavidas por defecto)
            return redirect(next_page or url_for("dashboard"))

        else:
            return "Invalid admin login"

    return render_template("admin_login.html")


@app.before_request
def check_session():
    # 1. Definimos qué rutas son exclusivas para el ADMIN
    admin_only_routes = ["dashboard", "list_student", "add_student"]

    # 2. Definimos qué rutas son públicas (No requieren login)
    open_routes = ["admin_login", "student_login", "student_register", "static", "index"]

    # Si no hay un endpoint válido (ej. error 404), no hacemos nada
    if not request.endpoint:
        return

    # 3. LÓGICA DE PROTECCIÓN
    # Si la ruta que intenta visitar está en la lista de ADMIN...
    if request.endpoint in admin_only_routes:
        if "admin" not in session:
            # Si no es admin, lo mandamos a SU login
            return redirect(url_for("admin_login", next=request.full_path))

    # 4. Si la ruta NO es pública y NO es de admin (es decir, es de estudiante)...
    elif request.endpoint not in open_routes:
        if "student_id" not in session:
            # Si no hay sesión de estudiante, al login de estudiantes
            return redirect(url_for("student_login"))

if __name__ == "__main__":
    app.run(debug=True)
    
