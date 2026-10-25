from datetime import datetime

from app.constants import BOGOTA


def parse_class_datetime(date_text, time_text):
    try:
        return datetime.strptime(f"{date_text} {time_text}", "%Y-%m-%d %H:%M").replace(tzinfo=BOGOTA)
    except (TypeError, ValueError):
        return None
