from app.entities import Course
from app.repositories.base_repository import BaseRepository


class CourseRepository(BaseRepository):
    entity = Course

    def list_active(self):
        return self._fetch_all("WHERE is_active = TRUE ORDER BY id")

    def active_exists(self, course_id):
        return self._exists("id = %s AND is_active = TRUE", (course_id,))
