import { apiFetch } from "./client";

export const listCourses = () => apiFetch("/api/courses");
export const listTeachers = () => apiFetch("/api/teachers");

export const getAvailableTimes = ({ teacherId, date, duration }) =>
  apiFetch(`/api/available-times?teacher_id=${teacherId}&date=${date}&duration=${duration}`);

export const reserveClass = (booking) =>
  apiFetch("/api/reserve", { method: "POST", body: JSON.stringify(booking) });

export const listMyClasses = () => apiFetch("/api/my_classes");

export const cancelBooking = (bookingId) =>
  apiFetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
