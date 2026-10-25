import logging

from flask import Flask, jsonify, session
from flask_cors import CORS

from app.config import Config
from app.controllers import register_blueprints
from app.database import init_db
from app.utils.errors import ServiceError

logger = logging.getLogger(__name__)


def create_app(config_class=Config):
    logging.basicConfig(level=logging.INFO)

    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)

    init_db(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGINS"]}},
        supports_credentials=True,
        methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    @app.before_request
    def make_session_permanent():
        session.permanent = True

    register_blueprints(app)
    register_error_handlers(app)
    return app


def register_error_handlers(app):
    @app.errorhandler(ServiceError)
    def service_error(error):
        return jsonify({"error": error.message}), error.status

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Ruta no encontrada"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.exception("Error interno no controlado", exc_info=error)
        return jsonify({"error": "Error interno del servidor"}), 500
