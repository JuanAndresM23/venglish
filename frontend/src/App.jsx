import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import Index from "./pages/Index";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import ReserveClass from "./pages/ReserveClass";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AddStudent from "./pages/AddStudent";
import ListStudents from "./pages/ListStudents";
import Navbar from "./components/Navbar/Navbar";
import "./css/App.css";

function RequireAuth({ user, role, level, children }) {
  if (!user?.is_logged_in) return <Navigate to={role === "admin" ? "/admin-login" : "/login"} replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  if (level !== undefined && user.level !== level) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando VEnglish...</div>;

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/student-register" element={<StudentRegister />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <StudentLogin setUser={setUser} />} />
        <Route path="/admin-login" element={user ? <Navigate to="/dashboard" replace /> : <AdminLogin setUser={setUser} />} />
        <Route path="/dashboard" element={
          <RequireAuth user={user}>{user?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}</RequireAuth>
        } />
        <Route path="/reserve" element={<RequireAuth user={user} role="student"><ReserveClass /></RequireAuth>} />
        <Route path="/add-student" element={<RequireAuth user={user} role="admin" level={1}><AddStudent /></RequireAuth>} />
        <Route path="/list-students" element={<RequireAuth user={user} role="admin" level={1}><ListStudents /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}