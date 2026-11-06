from flask import Blueprint, jsonify, session

from app.services.chat.chat_service import ChatService
from app.utils.decorators import student_required
from app.utils.http import json_body

chat_bp = Blueprint("chat", __name__)
chat_service = ChatService()


@chat_bp.post("/chat")
@student_required
def chat():
    result = chat_service.reply(
        session["student_id"], session.get("student_name"), json_body().get("messages")
    )
    return jsonify({"reply": result.text, "changed": result.changed})
