"""Crea una cuenta de superadministrador.

Uso: python scripts/create_superadmin.py <usuario> "<nombre completo>" <correo>
La contraseña se pide por consola (mínimo 10 caracteres).
"""

import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app  # noqa: E402
from app.database import IntegrityError, UnitOfWork  # noqa: E402
from app.entities import SuperAdmin  # noqa: E402


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    username, full_name, email = sys.argv[1].lower(), sys.argv[2], sys.argv[3].lower()
    password = getpass.getpass("Contraseña: ")
    if len(password) < 10:
        sys.exit("La contraseña debe tener al menos 10 caracteres")

    admin = SuperAdmin(username=username, full_name=full_name, email=email)
    admin.change_password(password)

    with create_app().app_context():
        try:
            with UnitOfWork(commit=True) as uow:
                if uow.admins.username_exists(username):
                    sys.exit("Ese nombre de usuario ya existe")
                uow.admins.add(admin)
        except IntegrityError:
            sys.exit("Ese nombre de usuario ya existe")
    print(f"Superadministrador '{username}' creado")


if __name__ == "__main__":
    main()
