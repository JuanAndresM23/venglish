import { apiFetch } from "./client";

const post = (path, body) =>
  apiFetch(path, { method: "POST", body: JSON.stringify(body) });

export const getCurrentUser = () => apiFetch("/api/me");
export const logout = () => apiFetch("/api/logout", { method: "POST" });

export const studentLogin = (studentCode, password) =>
  post("/api/student_login", { student_code: studentCode, password });
export const adminLogin = (username, password) =>
  post("/api/admin_login", { username, password });
export const studentRegister = (studentCode, password) =>
  post("/api/student_register", { student_code: studentCode, password });
// audience: "student" (por defecto) o "admin"
// Para audience "admin" también se envía el usuario: debe coincidir con el correo de esa cuenta.
export const forgotPassword = (email, audience = "student", username) =>
  post("/api/forgot_password", { email, type: audience, username });
export const resetPassword = (token, password) =>
  post("/api/reset_password", { token, password });
