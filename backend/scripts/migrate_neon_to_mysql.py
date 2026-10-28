"""Copia los datos de Neon (PostgreSQL) a MySQL local.

Uso (desde backend/):
    pip install psycopg2-binary          # solo para esta migración
    python scripts/migrate_neon_to_mysql.py "postgresql://user:pass@host/neondb?sslmode=require"

Requisitos: haber ejecutado database/db.sql y tener DATABASE_URL (mysql://...) en .env.
Solo lee de Neon; en MySQL vacía las tablas antes de insertar (--keep para no vaciar).
"""
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

import psycopg2
import pymysql
from dotenv import dotenv_values

# Orden respetando claves foráneas.
TABLES = ["courses", "admins", "students", "bookings", "teacher_schedules", "password_reset_tokens"]


def mysql_connect():
    env = dotenv_values(Path(__file__).resolve().parent.parent / ".env")
    url = urlparse(env["DATABASE_URL"].strip().strip('"').strip("'"))
    return pymysql.connect(
        host=url.hostname, port=url.port or 3306, user=unquote(url.username or ""),
        password=unquote(url.password or ""), database=url.path.lstrip("/"), charset="utf8mb4",
    )


def skip_duplicates(table, cols, rows):
    # La app asume student_code y email únicos; Neon no lo imponía, así que se omiten repetidos.
    seen, kept = {"student_code": set(), "email": set()}, []
    for row in rows:
        data = dict(zip(cols, row))
        clash = [k for k, v in seen.items() if data.get(k) is not None and data[k] in v]
        if clash:
            print(f"{table}: se omite id={data.get('id')} (duplicado en {clash})")
            continue
        for k, v in seen.items():
            if data.get(k) is not None:
                v.add(data[k])
        kept.append(row)
    return kept


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    keep = "--keep" in sys.argv

    pg = psycopg2.connect(args[0], connect_timeout=15)
    pg.set_session(readonly=True)
    my = mysql_connect()
    pgc, myc = pg.cursor(), my.cursor()

    myc.execute("SET FOREIGN_KEY_CHECKS = 0")
    try:
        for table in TABLES:
            myc.execute(f"SHOW COLUMNS FROM `{table}`")
            my_cols = [row[0] for row in myc.fetchall()]

            pgc.execute(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema = 'public' AND table_name = %s", (table,)
            )
            pg_cols = {row[0] for row in pgc.fetchall()}
            if not pg_cols:
                print(f"{table}: no existe en Neon, se omite")
                continue

            cols = [c for c in my_cols if c in pg_cols]
            skipped = sorted(pg_cols - set(my_cols))
            if skipped:
                print(f"{table}: columnas de Neon sin destino en MySQL (ignoradas): {skipped}")

            pgc.execute(f'SELECT {", ".join(f"{c}" for c in cols)} FROM "{table}"')
            rows = pgc.fetchall()

            if table == "students":
                rows = skip_duplicates(table, cols, rows)

            if not keep:
                myc.execute(f"DELETE FROM `{table}`")
            if rows:
                placeholders = ", ".join(["%s"] * len(cols))
                col_list = ", ".join(f"`{c}`" for c in cols)
                myc.executemany(f"INSERT INTO `{table}` ({col_list}) VALUES ({placeholders})", rows)
            print(f"{table}: {len(rows)} filas")
        my.commit()
    except Exception:
        my.rollback()
        raise
    finally:
        myc.execute("SET FOREIGN_KEY_CHECKS = 1")
        my.close()
        pg.close()


if __name__ == "__main__":
    main()
