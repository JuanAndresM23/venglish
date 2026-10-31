import logging
from dataclasses import dataclass

from app.entities import BookingDetail
from app.utils.singleton import SingletonMeta

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class BookingCreated:
    detail: BookingDetail


@dataclass(frozen=True)
class BookingCancelled:
    detail: BookingDetail


class EventBus(metaclass=SingletonMeta):
    """Observer: los servicios publican eventos y los suscriptores reaccionan.

    Un suscriptor que falla no afecta a los demás ni a quien publica, igual que antes
    cuando los correos y el calendario eran efectos secundarios best-effort.
    """

    def __init__(self):
        self._subscribers = {}

    def subscribe(self, event_type, handler):
        handlers = self._subscribers.setdefault(event_type, [])
        if handler not in handlers:
            handlers.append(handler)

    def publish(self, event):
        for handler in self._subscribers.get(type(event), []):
            try:
                handler(event)
            except Exception:
                logger.exception("Error en el suscriptor %s", getattr(handler, "__name__", handler))
