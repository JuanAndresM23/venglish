"""Recuperación de contraseña por tipo de cuenta (Strategy + Factory).

Estudiantes y administradores se recuperan con el mismo flujo pero difieren en cómo se
busca la cuenta, a quién pertenece el token y qué enlace se envía.
"""

from app.entities import PasswordResetToken


class AccountRecovery:
    def find_account(self, uow, email, username):
        raise NotImplementedError

    def build_token(self, account, token, expires_at):
        raise NotImplementedError

    def link_query(self, token):
        raise NotImplementedError

    def reset_password(self, uow, reset, new_password):
        raise NotImplementedError


class StudentRecovery(AccountRecovery):
    def find_account(self, uow, email, username):
        return uow.students.find_by_email(email)

    def build_token(self, account, token, expires_at):
        return PasswordResetToken(student_id=account.id, token=token, expires_at=expires_at)

    def link_query(self, token):
        return f"token={token}"

    def reset_password(self, uow, reset, new_password):
        student = uow.students.find_by_id(reset.student_id, for_update=True)
        student.change_password(new_password)
        uow.students.update(student)


class AdminRecovery(AccountRecovery):
    def find_account(self, uow, email, username):
        # Un administrador debe indicar su usuario y el correo registrado en esa misma cuenta.
        return uow.admins.find_by_username_and_email(username, email)

    def build_token(self, account, token, expires_at):
        return PasswordResetToken(admin_id=account.id, token=token, expires_at=expires_at)

    def link_query(self, token):
        return f"token={token}&type=admin"

    def reset_password(self, uow, reset, new_password):
        admin = uow.admins.find_by_id(reset.admin_id, for_update=True)
        admin.change_password(new_password)
        uow.admins.update(admin)


def recovery_for_audience(audience):
    return AdminRecovery() if audience == "admin" else StudentRecovery()


def recovery_for_token(reset):
    return AdminRecovery() if reset.belongs_to_admin else StudentRecovery()
