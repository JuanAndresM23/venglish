class BaseRepository:
    """CRUD genérico para una entidad (Template Method: las subclases solo fijan `entity`).

    Los repositorios concentran todo el SQL; los servicios solo trabajan con entidades.
    """

    entity = None

    def __init__(self, cursor):
        self.cursor = cursor

    def _select(self):
        return f"SELECT {self.entity.select_list()} FROM {self.entity.TABLE}"

    def _fetch_one(self, where, params, for_update=False):
        suffix = " FOR UPDATE" if for_update else ""
        self.cursor.execute(f"{self._select()} WHERE {where}{suffix}", params)
        row = self.cursor.fetchone()
        return self.entity.from_row(row) if row else None

    def _fetch_all(self, tail="", params=()):
        self.cursor.execute(f"{self._select()} {tail}", params)
        return [self.entity.from_row(row) for row in self.cursor.fetchall()]

    def _exists(self, where, params):
        self.cursor.execute(f"SELECT 1 FROM {self.entity.TABLE} WHERE {where}", params)
        return self.cursor.fetchone() is not None

    def find_by_id(self, entity_id, for_update=False):
        return self._fetch_one("id = %s", (entity_id,), for_update)

    def list_all(self):
        return self._fetch_all("ORDER BY id")

    def count(self):
        self.cursor.execute(f"SELECT COUNT(*) FROM {self.entity.TABLE}")
        return self.cursor.fetchone()[0]

    def add(self, item):
        """Inserta la entidad. Las columnas en None se omiten para que apliquen los DEFAULT."""
        columns = [
            column
            for column in self.entity.columns()
            if column != "id" and getattr(item, column) is not None
        ]
        placeholders = ", ".join(["%s"] * len(columns))
        self.cursor.execute(
            f"INSERT INTO {self.entity.TABLE} ({', '.join(columns)}) "
            f"VALUES ({placeholders})",
            item.values(columns),
        )
        item.id = self.cursor.lastrowid
        return item

    def update(self, item):
        columns = [column for column in self.entity.columns() if column != "id"]
        assignments = ", ".join(f"{column} = %s" for column in columns)
        self.cursor.execute(
            f"UPDATE {self.entity.TABLE} SET {assignments} WHERE id = %s",
            item.values(columns) + (item.id,),
        )
        return item

    def delete(self, entity_id):
        self.cursor.execute(f"DELETE FROM {self.entity.TABLE} WHERE id = %s", (entity_id,))
