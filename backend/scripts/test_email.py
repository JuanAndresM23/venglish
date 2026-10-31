import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import Config  # noqa: F401  (carga el .env)
from app.services.email_service import EmailService

EmailService().send_email(
    "juanandresmunozochoa@gmail.com",
    "Prueba VEnglish",
    "<h1>Correo de prueba desde VEnglish</h1>"
)

print("Correo enviado")
