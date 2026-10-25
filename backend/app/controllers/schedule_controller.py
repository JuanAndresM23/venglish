from flask import Blueprint, jsonify, request, session

from app.constants import LEVEL_SUPERADMIN
from app.services import schedule_service
from app.utils.decorators import admin_required
from app.utils.http import json_body

schedule_bp = Blueprint("schedule", __name__)


def _schedule_teacher_id(source):
    """Un superadmin elige el docente; un docente solo gestiona su propio horario."""
    if session.get("role_level") == LEVEL_SUPERADMIN:
        try:
            return int(source.get("teacher_id"))
        except (TypeError, ValueError):
            return None
    return session.get("user_id")


@schedule_bp.get("/available-times")
def available_times():
    teacher_id = request.args.get("teacher_id", type=int)
    date_text = request.args.get("date")
    return jsonify(schedule_service.get_available_times(teacher_id, date_text))


@schedule_bp.get("/admin/schedule")
@admin_required
def get_schedule():
    teacher_id = _schedule_teacher_id(request.args)
    return jsonify(schedule_service.get_schedule(teacher_id))


@schedule_bp.post("/admin/schedule")
@admin_required
def save_schedule():
    data = json_body()
    teacher_id = _schedule_teacher_id(data)
    schedule_service.save_schedule(teacher_id, data.get("blocks"))
    return jsonify({"message": "Horario guardado correctamente"}), 200
