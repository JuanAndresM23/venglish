import threading
import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    """Permite `limit` eventos por clave dentro de una ventana de `window_seconds`.

    Es en memoria: cada proceso de gunicorn lleva su propia cuenta.
    """

    def __init__(self, limit, window_seconds):
        self.limit = limit
        self.window_seconds = window_seconds
        self._events = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key):
        now = time.monotonic()
        with self._lock:
            events = self._events[key]
            while events and now - events[0] > self.window_seconds:
                events.popleft()
            if len(events) >= self.limit:
                return False
            events.append(now)
            return True
