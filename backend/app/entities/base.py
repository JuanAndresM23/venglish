class Entity:
    """Clase base de las entidades: cada subclase es una tabla de la base de datos.

    Cada subclase declara `TABLE` y `COLUMNS` (en el orden de la tabla) y recibe en su
    constructor un parámetro por columna. Así el mapeo fila <-> objeto se resuelve aquí una
    sola vez (Information Expert: la entidad conoce su propia estructura).
    """

    TABLE = ""
    COLUMNS = ()

    def __init__(self, id=None):
        self.id = id

    @classmethod
    def columns(cls):
        return cls.COLUMNS

    @classmethod
    def select_list(cls, alias=None):
        prefix = f"{alias}." if alias else ""
        return ", ".join(f"{prefix}{column}" for column in cls.COLUMNS)

    @classmethod
    def from_row(cls, row):
        return cls(**dict(zip(cls.COLUMNS, row)))

    def values(self, columns):
        return tuple(getattr(self, column) for column in columns)

    def __repr__(self):
        return f"{type(self).__name__}(id={self.id!r})"
