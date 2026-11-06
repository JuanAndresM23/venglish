from app.controllers.admin_controller import admin_bp
from app.controllers.auth_controller import auth_bp
from app.controllers.booking_controller import booking_bp
from app.controllers.chat_controller import chat_bp
from app.controllers.schedule_controller import schedule_bp

API_PREFIX = "/api"


def register_blueprints(app):
    for blueprint in (auth_bp, booking_bp, admin_bp, schedule_bp, chat_bp):
        app.register_blueprint(blueprint, url_prefix=API_PREFIX)
