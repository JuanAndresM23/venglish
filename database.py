import psycopg2
#conexion a base de datos
def get_connection():
    connection = psycopg2.connect(
        host="localhost",
        database="sistema_reservas",
        user="postgres",
        password="123456"
    )
    return connection