from flask import Blueprint, jsonify, session

from app.constants import ROLE_ADMIN, ROLE_STUDENT
from app.services import auth_service
from app.utils.http import json_body

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"message": "Sesión cerrada"}), 200


@auth_bp.get("/me")
def current_user():
    role = session.get("role")
    if role == ROLE_STUDENT and session.get("student_id"):
        return jsonify({
            "is_logged_in": True,
            "role": ROLE_STUDENT,
            "user_id": session["student_id"],
            "name": session.get("student_name"),
        })
    if role == ROLE_ADMIN and session.get("user_id"):
        return jsonify({
            "is_logged_in": True,
            "role": ROLE_ADMIN,
            "user_id": session["user_id"],
            "name": session.get("admin_name"),
            "level": session.get("role_level", 0),
        })
    return jsonify({"is_logged_in": False, "role": None}), 401


@auth_bp.post("/student_login")
def student_login():
    data = json_body()
    student = auth_service.student_login(data.get("student_code"), data.get("password"))

    session.clear()
    session.permanent = True
    session["role"] = ROLE_STUDENT
    session["student_id"] = student["id"]
    session["student_name"] = student["name"]
    return jsonify({"message": "Login exitoso"}), 200


@auth_bp.post("/student_register")
def student_register():
    data = json_body()
    auth_service.student_register(data.get("student_code"), data.get("password"))
    return jsonify({"message": "Cuenta activada. Ya puedes iniciar sesión"}), 200


@auth_bp.post("/admin_login")
def admin_login():
    data = json_body()
    admin = auth_service.admin_login(data.get("username"), data.get("password"))

    session.clear()
    session.permanent = True
    session["role"] = ROLE_ADMIN
    session["user_id"] = admin["id"]
    session["role_level"] = admin["role_level"]
    session["admin_name"] = admin["name"]
    return jsonify({
        "message": f"Bienvenido/a {admin['name']}",
        "role": ROLE_ADMIN,
        "username": admin["username"],
        "role_level": admin["role_level"],
    }), 200


@auth_bp.post("/forgot_password")
def forgot_password():
    data = json_body()
    audience = "admin" if data.get("type") == "admin" else "student"
    message = auth_service.forgot_password(data.get("email"), audience, data.get("username"))
    return jsonify({"message": message}), 200


@auth_bp.post("/reset_password")
def reset_password():
    data = json_body()
    auth_service.reset_password(data.get("token"), data.get("password"))
    return jsonify({"message": "Contraseña actualizada correctamente"}), 200
