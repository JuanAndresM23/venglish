class ServiceError(Exception):
    """Error de negocio que se traduce a una respuesta JSON {"error": ...}."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status
