from app.entities.base import Entity


class Course(Entity):
    TABLE = "courses"
    COLUMNS = ("id", "course_name", "duration", "is_active")

    def __init__(self, id=None, course_name="", duration=None, is_active=True):
        super().__init__(id)
        self.course_name = course_name
        self.duration = duration
        self.is_active = is_active

    def to_dict(self):
        return {"id": self.id, "name": self.course_name}
