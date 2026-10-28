import json
import logging
import os
from datetime import timedelta

from google.oauth2 import service_account
from googleapiclient.discovery import build

from app.constants import BOGOTA

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar"]
EVENT_FORMAT = "%Y-%m-%dT%H:%M:%S"


def _credentials_info():
    # GOOGLE_CREDENTIALS contiene el JSON completo de la cuenta de servicio.
    raw = os.getenv("GOOGLE_CREDENTIALS", "").strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except ValueError:
        logger.error("GOOGLE_CREDENTIALS no es un JSON válido")
        return None


def service_account_email():
    """Correo con el que cada docente debe compartir su calendario."""
    info = _credentials_info()
    return info.get("client_email") if info else None


def _service():
    info = _credentials_info()
    if not info:
        return None
    credentials = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build("calendar", "v3", credentials=credentials, cache_discovery=False)


def create_event(calendar_id, summary, description, start, minutes):
    """Crea el evento en el calendario del docente. Devuelve su id o None si no se pudo."""
    if not calendar_id:
        return None
    try:
        service = _service()
        if not service:
            return None
        body = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start.strftime(EVENT_FORMAT), "timeZone": BOGOTA.key},
            "end": {
                "dateTime": (start + timedelta(minutes=minutes)).strftime(EVENT_FORMAT),
                "timeZone": BOGOTA.key,
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 60},
                    {"method": "popup", "minutes": 15},
                ],
            },
        }
        event = service.events().insert(calendarId=calendar_id, body=body).execute()
        return event.get("id")
    except Exception:
        logger.exception("Error creando evento en Google Calendar (%s)", calendar_id)
        return None


def delete_event(calendar_id, event_id):
    if not calendar_id or not event_id:
        return
    try:
        service = _service()
        if service:
            service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
    except Exception:
        logger.exception("Error eliminando evento %s de Google Calendar", event_id)
