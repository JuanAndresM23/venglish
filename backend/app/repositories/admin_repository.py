from app.constants import LEVEL_TEACHER
from app.entities import Admin
from app.repositories.base_repository import BaseRepository


class AdminRepository(BaseRepository):
    entity = Admin

    def find_by_username(self, username):
        return self._fetch_one("username = %s", (username,))

    def find_by_username_and_email(self, username, email):
        return self._fetch_one("username = %s AND LOWER(email) = %s", (username, email))

    def list_teachers(self):
        return self._fetch_all(
            "WHERE role_level = %s ORDER BY COALESCE(full_name, username)", (LEVEL_TEACHER,)
        )

    def teacher_exists(self, teacher_id):
        return self._exists("id = %s AND role_level = %s", (teacher_id, LEVEL_TEACHER))

    def username_exists(self, username):
        return self._exists("LOWER(username) = %s", (username,))

    def count_teachers(self):
        self.cursor.execute(
            "SELECT COUNT(*) FROM admins WHERE role_level = %s", (LEVEL_TEACHER,)
        )
        return self.cursor.fetchone()[0]
