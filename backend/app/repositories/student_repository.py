from app.entities import Student
from app.repositories.base_repository import BaseRepository


class StudentRepository(BaseRepository):
    entity = Student

    def find_by_code(self, student_code, for_update=False):
        return self._fetch_one("student_code = %s", (student_code,), for_update)

    def find_by_email(self, email):
        return self._fetch_one("LOWER(email) = %s", (email,))

    def list_all(self):
        return self._fetch_all("ORDER BY name")
