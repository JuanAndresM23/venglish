from app.entities import Admin, Booking, BookingDetail, Course, Student
from app.repositories.base_repository import BaseRepository

_OVERLAP = """
    AND TIMESTAMP(class_date, class_time) < %s
    AND TIMESTAMP(class_date, class_time) + INTERVAL duration_minutes MINUTE > %s
"""

_DETAIL_SELECT = f"""
    SELECT {Booking.select_list('b')}, {Student.select_list('s')},
           {Course.select_list('c')}, {Admin.select_list('a')}
    FROM bookings b
    JOIN students s ON b.student_id = s.id
    JOIN courses c ON b.course_id = c.id
    JOIN admins a ON b.teacher_id = a.id
"""


class BookingRepository(BaseRepository):
    entity = Booking

    def find_student_overlap(self, student_id, class_end, class_start):
        return self._fetch_one(
            f"student_id = %s {_OVERLAP}", (student_id, class_end, class_start), for_update=True
        )

    def find_teacher_overlap(self, teacher_id, class_end, class_start):
        return self._fetch_one(
            f"teacher_id = %s {_OVERLAP}", (teacher_id, class_end, class_start), for_update=True
        )

    def list_by_teacher_and_day(self, teacher_id, day):
        return self._fetch_all(
            "WHERE teacher_id = %s AND class_date = %s", (teacher_id, day)
        )

    def find_detail(self, booking_id, for_update=False):
        suffix = " FOR UPDATE" if for_update else ""
        self.cursor.execute(f"{_DETAIL_SELECT} WHERE b.id = %s{suffix}", (booking_id,))
        row = self.cursor.fetchone()
        return BookingDetail.from_row(row) if row else None

    def list_details(self, student_id=None, teacher_id=None):
        conditions, params = [], []
        if student_id is not None:
            conditions.append("b.student_id = %s")
            params.append(student_id)
        if teacher_id is not None:
            conditions.append("b.teacher_id = %s")
            params.append(teacher_id)
        where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
        self.cursor.execute(
            f"{_DETAIL_SELECT}{where} ORDER BY b.class_date, b.class_time", params
        )
        return [BookingDetail.from_row(row) for row in self.cursor.fetchall()]

    def count_upcoming(self, teacher_id=None):
        return self._count_from_today("", teacher_id)

    def count_next_week(self, teacher_id=None):
        return self._count_from_today("AND class_date < CURRENT_DATE + INTERVAL 7 DAY", teacher_id)

    def count_by_student(self, student_id):
        self.cursor.execute(
            "SELECT COUNT(*) FROM bookings WHERE student_id = %s", (student_id,)
        )
        return self.cursor.fetchone()[0]

    def _count_from_today(self, extra, teacher_id):
        query = f"SELECT COUNT(*) FROM bookings WHERE class_date >= CURRENT_DATE {extra}"
        params = ()
        if teacher_id is not None:
            query += " AND teacher_id = %s"
            params = (teacher_id,)
        self.cursor.execute(query, params)
        return self.cursor.fetchone()[0]
