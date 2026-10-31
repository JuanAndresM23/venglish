from app.entities.base import Entity


class TeacherSchedule(Entity):
    TABLE = "teacher_schedules"
    COLUMNS = ("id", "teacher_id", "day_of_week", "start_time", "end_time", "is_available")

    def __init__(
        self,
        id=None,
        teacher_id=None,
        day_of_week=1,
        start_time=None,
        end_time=None,
        is_available=True,
    ):
        super().__init__(id)
        self.teacher_id = teacher_id
        self.day_of_week = day_of_week
        self.start_time = start_time
        self.end_time = end_time
        self.is_available = is_available

    def to_dict(self):
        return {
            "day": self.day_of_week,
            "start": f"{self.start_time:%H:%M}",
            "end": f"{self.end_time:%H:%M}",
        }
