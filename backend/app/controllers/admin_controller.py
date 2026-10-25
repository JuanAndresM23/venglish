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
