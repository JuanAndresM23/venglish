import { Navigate, Route, Routes } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import MainLayout from "../layouts/MainLayout";
import StudentLayout from "../layouts/StudentLayout";
import { LEVEL_SUPERADMIN } from "../config/navigation";

import Index from "../pages/public/Index";
import StudentLogin from "../pages/public/StudentLogin";
import StudentRegister from "../pages/public/StudentRegister";
import AdminLogin from "../pages/public/AdminLogin";
import ForgotPassword from "../pages/public/ForgotPassword";
import ResetPassword from "../pages/public/ResetPassword";

import StudentDashboard from "../pages/student/StudentDashboard";
import ReserveClass from "../pages/student/ReserveClass";

import AdminDashboard from "../pages/admin/AdminDashboard";
import TeacherSchedule from "../pages/admin/TeacherSchedule";
import Students from "../pages/admin/Students";
import Teachers from "../pages/admin/Teachers";
import AdminProfile from "../pages/admin/AdminProfile";

// /dashboard es compartida: cada rol ve su propio panel dentro de su propio layout.
function DashboardPage() {
  const { user } = useAuth();
  return user.role === "admin" ? (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  ) : (
    <StudentLayout>
      <StudentDashboard />
    </StudentLayout>
  );
}

function HomePage() {
  const { user } = useAuth();
  return user?.role === "admin" ? <Navigate to="/dashboard" replace /> : <Index />;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Público: barra superior */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword audience="admin" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/student-register" element={<StudentRegister />} />
        <Route path="/login" element={<GuestOnly><StudentLogin /></GuestOnly>} />
        <Route path="/admin-login" element={<GuestOnly><AdminLogin /></GuestOnly>} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Estudiantes: barra lateral */}
      <Route element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route path="/reserve" element={<ReserveClass />} />
      </Route>

      {/* Administración: barra lateral */}
      <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route path="/schedule" element={<TeacherSchedule />} />
        <Route path="/profile" element={<AdminProfile />} />
        <Route element={<ProtectedRoute role="admin" level={LEVEL_SUPERADMIN} />}>
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/add-student" element={<Navigate to="/students" replace />} />
          <Route path="/list-students" element={<Navigate to="/students" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
