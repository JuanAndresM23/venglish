class SingletonMeta(type):
    """Metaclase Singleton: cada clase que la usa tiene una única instancia."""

    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]
