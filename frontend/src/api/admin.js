import { apiFetch } from "./client";

const post = (path, body) =>
  apiFetch(path, { method: "POST", body: JSON.stringify(body) });

export const getDashboardEvents = () => apiFetch("/api/admin/dashboard");
export const getStats = () => apiFetch("/api/admin/stats");

export const listStudents = () => apiFetch("/api/list_students");
export const addStudent = (student) => post("/api/add_student", student);
export const updateStudent = (id, student) =>
  apiFetch(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(student) });
export const setStudentEnabled = (id, enabled) =>
  apiFetch(`/api/students/${id}/status`, { method: "PUT", body: JSON.stringify({ enabled }) });
export const deleteStudent = (id) => apiFetch(`/api/students/${id}`, { method: "DELETE" });

export const listTeachers = () => apiFetch("/api/admin/teachers");
export const addTeacher = (teacher) => post("/api/admin/teachers", teacher);

export const getSchedule = (teacherId) =>
  apiFetch(`/api/admin/schedule${teacherId ? `?teacher_id=${teacherId}` : ""}`);
export const saveSchedule = (teacherId, blocks) =>
  post("/api/admin/schedule", { teacher_id: teacherId || undefined, blocks });

export const getProfile = () => apiFetch("/api/admin/profile");
export const updateProfile = (profile) => post("/api/admin/profile", profile);
export const changePassword = (currentPassword, newPassword) =>
  post("/api/admin/profile/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
