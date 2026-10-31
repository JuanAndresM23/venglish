from flask import Blueprint, jsonify, session

from app.services.admin_service import (
    DashboardService,
    ProfileService,
    StudentService,
    TeacherService,
)
from app.utils.decorators import admin_required, superadmin_required
from app.utils.http import json_body

admin_bp = Blueprint("admin", __name__)

dashboard_service = DashboardService()
student_service = StudentService()
teacher_service = TeacherService()
profile_service = ProfileService()


@admin_bp.get("/admin/dashboard")
@admin_required
def dashboard():
    return jsonify(dashboard_service.dashboard_events(session["user_id"]))


@admin_bp.get("/admin/stats")
@admin_required
def stats():
    return jsonify(dashboard_service.stats(session["user_id"])), 200


@admin_bp.get("/list_students")
@superadmin_required
def list_students():
    return jsonify(student_service.list_students())


@admin_bp.post("/add_student")
@superadmin_required
def add_student():
    student_service.add_student(json_body())
    return jsonify({"message": "Estudiante pre-registrado correctamente"}), 201


@admin_bp.get("/admin/teachers")
@superadmin_required
def list_teachers():
    return jsonify(teacher_service.list_teachers())


@admin_bp.post("/admin/teachers")
@superadmin_required
def add_teacher():
    teacher_service.add_teacher(json_body())
    return jsonify({"message": "Docente creado correctamente"}), 201


@admin_bp.get("/admin/profile")
@admin_required
def get_profile():
    return jsonify(profile_service.get_profile(session["user_id"]))


@admin_bp.post("/admin/profile")
@admin_required
def update_profile():
    full_name = profile_service.update_profile(session["user_id"], json_body())
    session["admin_name"] = full_name
    return jsonify({"message": "Perfil actualizado correctamente", "name": full_name})


@admin_bp.post("/admin/profile/password")
@admin_required
def change_password():
    data = json_body()
    profile_service.change_password(
        session["user_id"], data.get("current_password"), data.get("new_password")
    )
    return jsonify({"message": "Contraseña actualizada correctamente"})


@admin_bp.put("/students/<int:student_id>")
@superadmin_required
def update_student(student_id):
    student_service.update_student(student_id, json_body())
    return jsonify({"message": "Estudiante actualizado correctamente"})


@admin_bp.put("/students/<int:student_id>/status")
@superadmin_required
def set_student_status(student_id):
    data = json_body()
    student_service.set_student_enabled(student_id, data)
    message = "Estudiante activado" if data.get("enabled") else "Estudiante desactivado"
    return jsonify({"message": message})


@admin_bp.delete("/students/<int:student_id>")
@superadmin_required
def delete_student(student_id):
    student_service.delete_student(student_id)
    return jsonify({"message": "Estudiante eliminado correctamente"})
