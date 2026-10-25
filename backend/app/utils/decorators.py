from functools import wraps

from flask import jsonify, session

from app.constants import LEVEL_SUPERADMIN, ROLE_ADMIN, ROLE_STUDENT


def admin_required(func):
    @wraps(func)
    def wrapped(*args, **kwargs):
        if session.get("role") != ROLE_ADMIN or not session.get("user_id"):
            return jsonify({"error": "Acceso de administrador requerido"}), 401
        return func(*args, **kwargs)
    return wrapped


def superadmin_required(func):
    @wraps(func)
    def wrapped(*args, **kwargs):
        if session.get("role") != ROLE_ADMIN or session.get("role_level") != LEVEL_SUPERADMIN:
            return jsonify({"error": "Acceso exclusivo de superadministración"}), 403
        return func(*args, **kwargs)
    return wrapped


def student_required(func):
    @wraps(func)
    def wrapped(*args, **kwargs):
        if session.get("role") != ROLE_STUDENT or not session.get("student_id"):
            return jsonify({"error": "Acceso de estudiante requerido"}), 401
        return func(*args, **kwargs)
    return wrapped
