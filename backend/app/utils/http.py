from flask import request


def json_body():
    return request.get_json(silent=True) or {}


def clean_text(value, max_length=255):
    return str(value or "").strip()[:max_length]
