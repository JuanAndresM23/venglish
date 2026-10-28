from flask import Blueprint, jsonify, session

from app.constants import LEVEL_SUPERADMIN
from app.services import admin_service
from app.utils.decorators import admin_required, superadmin_required
from app.utils.http import json_body

admin_bp = Blueprint("admin", __name__)


def _is_superadmin():
    return session.get("role_level") == LEVEL_SUPERADMIN


@admin_bp.get("/admin/dashboard")
@admin_required
def dashboard():
    return jsonify(admin_service.dashboard_events(_is_superadmin(), session["user_id"]))


@admin_bp.get("/admin/stats")
@admin_required
def stats():
    return jsonify(admin_service.stats(_is_superadmin(), session.get("user_id"))), 200


@admin_bp.get("/list_students")
@superadmin_required
def list_students():
    return jsonify(admin_service.list_students())


@admin_bp.post("/add_student")
@superadmin_required
def add_student():
    admin_service.add_student(json_body())
    return jsonify({"message": "Estudiante pre-registrado correctamente"}), 201


@admin_bp.get("/admin/profile")
@admin_required
def get_profile():
    return jsonify(admin_service.get_profile(session["user_id"]))


@admin_bp.post("/admin/profile")
@admin_required
def update_profile():
    full_name = admin_service.update_profile(session["user_id"], json_body())
    session["admin_name"] = full_name
    return jsonify({"message": "Perfil actualizado correctamente", "name": full_name})


@admin_bp.post("/admin/profile/password")
@admin_required
def change_password():
    data = json_body()
    admin_service.change_password(
        session["user_id"], data.get("current_password"), data.get("new_password")
    )
    return jsonify({"message": "Contraseña actualizada correctamente"})


@admin_bp.put("/students/<int:student_id>")
@superadmin_required
def update_student(student_id):
    admin_service.update_student(student_id, json_body())
    return jsonify({"message": "Estudiante actualizado correctamente"})


@admin_bp.delete("/students/<int:student_id>")
@superadmin_required
def delete_student(student_id):
    admin_service.delete_student(student_id)
    return jsonify({"message": "Estudiante eliminado correctamente"})
