import logging
from datetime import datetime

from app.constants import (
    ALLOWED_DURATIONS,
    BOGOTA,
    MIN_BOOKING_NOTICE_HOURS,
    MIN_CANCELLATION_NOTICE_HOURS,
)
from app.services.booking_service import BookingService
from app.services.chat.llm_provider import ClaudeProvider
from app.services.chat.tools import build_tools
from app.services.schedule_service import ScheduleService
from app.utils.errors import ServiceError
from app.utils.rate_limit import SlidingWindowLimiter

logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 20
MAX_MESSAGE_CHARS = 1000
MAX_TOOL_ROUNDS = 6
MESSAGES_PER_WINDOW = 20
WINDOW_SECONDS = 300

WEEKDAYS = ("lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo")

SYSTEM_PROMPT = """\
Eres el asistente virtual de VEnglish Academy, una academia de inglés. Hablas con {student_name}, \
un estudiante que ya inició sesión. Responde siempre en español, con tono amable y mensajes cortos.

Ahora mismo es {now} (hora de Colombia).

Qué puedes hacer: explicar cómo usar la página, mostrar las clases del estudiante, consultar \
horarios disponibles de los profesores, reservar y cancelar clases. Para cualquier dato usa las \
herramientas; nunca inventes clases, profesores, horarios ni ids. Si te piden algo que no tiene \
que ver con la academia, di amablemente que solo puedes ayudar con la academia.

Cómo se usa la página: en el menú lateral, "Mis clases" muestra las clases reservadas (allí \
también se pueden cancelar) y "Reservar clase" permite elegir tipo de clase, profesor, fecha, \
duración y hora.

Reglas de la academia:
- Se reserva con mínimo {booking_hours} horas de anticipación.
- Se puede cancelar hasta {cancel_hours} horas antes de la clase.
- Duraciones posibles: {durations} minutos. Las clases empiezan en punto o y media.
- El profesor no puede tener dos clases a la vez ni el estudiante tampoco.

Para reservar: averigua tipo de clase, profesor, fecha, duración y hora (ofrece opciones reales \
con las herramientas). Antes de reservar o cancelar, muestra un resumen claro y pregunta si \
confirma. Llama a book_class o cancel_class con confirmed=true únicamente después de que el \
estudiante responda que sí a ese resumen. Si la herramienta devuelve un error, explícaselo con \
sus palabras y propón una alternativa. Muestra las fechas de forma legible (por ejemplo \
"lunes 9 de noviembre") y las horas como HH:MM.
"""


class ChatResult:
    def __init__(self, text, changed):
        self.text = text
        self.changed = changed


class ChatService:
    """Conversación del asistente: ejecuta el ciclo modelo -> herramientas -> modelo."""

    def __init__(self, provider=None, bookings=None, schedules=None, limiter=None):
        schedules = schedules or ScheduleService()
        bookings = bookings or BookingService(schedules=schedules)
        self._provider = provider or ClaudeProvider()
        self._tools = build_tools(bookings, schedules)
        self._limiter = limiter or SlidingWindowLimiter(MESSAGES_PER_WINDOW, WINDOW_SECONDS)

    def reply(self, student_id, student_name, history):
        messages = self._clean_history(history)
        if not self._limiter.allow(student_id):
            raise ServiceError("Has enviado muchos mensajes. Espera unos minutos.", 429)

        system = self._system_prompt(student_name)
        definitions = [tool.definition() for tool in self._tools.values()]
        changed = False

        for _ in range(MAX_TOOL_ROUNDS):
            turn = self._provider.complete(system, messages, definitions)
            if not turn.tool_calls:
                return ChatResult(turn.text or "No pude generar una respuesta.", changed)

            messages.append(turn.assistant_message)
            results = []
            for call in turn.tool_calls:
                tool = self._tools.get(call.name)
                if tool is None:
                    results.append((call, '{"error": "Herramienta desconocida"}', True))
                    continue
                content, is_error = tool.execute(call.arguments, student_id)
                changed = changed or (tool.changes_data and not is_error)
                results.append((call, content, is_error))
            messages.append(self._provider.tool_results_message(results))

        logger.warning("El asistente superó %s rondas de herramientas", MAX_TOOL_ROUNDS)
        return ChatResult("No pude completar la solicitud. ¿Puedes intentarlo de nuevo?", changed)

    @staticmethod
    def _clean_history(history):
        """Valida lo que envía el navegador: solo texto, roles válidos y termina en el usuario."""
        if not isinstance(history, list):
            raise ServiceError("Mensajes inválidos", 400)

        messages = []
        for item in history[-MAX_HISTORY_MESSAGES:]:
            role = item.get("role") if isinstance(item, dict) else None
            content = item.get("content") if isinstance(item, dict) else None
            if role not in ("user", "assistant") or not isinstance(content, str):
                raise ServiceError("Mensajes inválidos", 400)
            content = content.strip()[:MAX_MESSAGE_CHARS]
            if content:
                messages.append({"role": role, "content": content})

        while messages and messages[0]["role"] != "user":
            messages.pop(0)
        if not messages or messages[-1]["role"] != "user":
            raise ServiceError("Escribe un mensaje", 400)
        return messages

    @staticmethod
    def _system_prompt(student_name):
        now = datetime.now(BOGOTA)
        return SYSTEM_PROMPT.format(
            student_name=student_name or "estudiante",
            now=f"{WEEKDAYS[now.weekday()]} {now:%Y-%m-%d %H:%M}",
            booking_hours=MIN_BOOKING_NOTICE_HOURS,
            cancel_hours=MIN_CANCELLATION_NOTICE_HOURS,
            durations=", ".join(str(minutes) for minutes in ALLOWED_DURATIONS),
        )
