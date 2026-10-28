from flask import Blueprint, jsonify, session

from app.constants import ROLE_ADMIN, ROLE_STUDENT
from app.services import booking_service
from app.utils.decorators import student_required
from app.utils.http import json_body

booking_bp = Blueprint("booking", __name__)


@booking_bp.get("/courses")
def courses():
    return jsonify(booking_service.list_courses())


@booking_bp.get("/teachers")
def teachers():
    return jsonify(booking_service.list_teachers())


@booking_bp.get("/reserve")
@student_required
def reserve_get():
    return jsonify(booking_service.list_courses())


@booking_bp.post("/reserve")
@student_required
def reserve():
    booking_id = booking_service.create_booking(session["student_id"], json_body())
    return jsonify({"message": "Reserva confirmada", "booking_id": booking_id}), 201


@booking_bp.get("/my_classes")
@student_required
def my_classes():
    return jsonify(booking_service.list_student_classes(session["student_id"]))


@booking_bp.delete("/bookings/<int:booking_id>")
def cancel_booking(booking_id):
    role = session.get("role")
    if role not in {ROLE_STUDENT, ROLE_ADMIN}:
        return jsonify({"error": "No autorizado"}), 401

    booking_service.cancel_booking(
        booking_id,
        role=role,
        student_id=session.get("student_id"),
        user_id=session.get("user_id"),
        role_level=session.get("role_level"),
    )
    return jsonify({"message": "Reserva cancelada"}), 200
