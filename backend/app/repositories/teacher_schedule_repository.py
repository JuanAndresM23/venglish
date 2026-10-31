from app.entities import TeacherSchedule
from app.repositories.base_repository import BaseRepository


class TeacherScheduleRepository(BaseRepository):
    entity = TeacherSchedule

    def list_for_day(self, teacher_id, day_of_week):
        return self._fetch_all(
            "WHERE teacher_id = %s AND day_of_week = %s AND COALESCE(is_available, TRUE)",
            (teacher_id, day_of_week),
        )

    def list_available(self, teacher_id):
        return self._fetch_all(
            "WHERE teacher_id = %s AND COALESCE(is_available, TRUE) "
            "ORDER BY day_of_week, start_time",
            (teacher_id,),
        )

    def replace_all(self, teacher_id, blocks):
        """Reemplaza todo el horario del docente por `blocks` (lista de TeacherSchedule)."""
        self.cursor.execute(
            "DELETE FROM teacher_schedules WHERE teacher_id = %s", (teacher_id,)
        )
        for block in blocks:
            self.add(block)
