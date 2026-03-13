import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Importación de Páginas
import Index from "./pages/Index";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import ReserveClass from "./pages/ReserveClass";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AddStudent from "./pages/AddStudent";
import ListStudents from "./pages/ListStudents"; // No olvides crear este archivo

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificación de sesión inicial
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando Venglish...</div>;

  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<StudentRegister />} />
        
        {/* Logins: Si ya está logueado, lo mandamos directo al dashboard */}
        <Route 
          path="/login" 
          element={user?.is_logged_in ? <Navigate to="/dashboard" /> : <StudentLogin setUser={setUser} />} 
        />
        <Route 
          path="/admin-login" 
          element={user?.is_logged_in ? <Navigate to="/dashboard" /> : <AdminLogin setUser={setUser} />} 
        />

        {/* --- RUTAS PROTEGIDAS (ESTUDIANTES Y ADMIN) --- */}
        <Route 
          path="/dashboard" 
          element={
            user?.is_logged_in 
              ? (user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard user={user} />) 
              : <Navigate to="/login" />
          } 
        />

        <Route 
          path="/reserve" 
          element={user?.is_logged_in ? <ReserveClass /> : <Navigate to="/login" />} 
        />

        {/* --- RUTAS EXCLUSIVAS DE ADMIN (VICTORIA) --- */}
        <Route 
          path="/add-student" 
          element={
            user?.is_logged_in && user.role === 'admin' 
              ? <AddStudent /> 
              : <Navigate to="/admin-login" />
          } 
        />

        <Route 
          path="/list-students" 
          element={
            user?.is_logged_in && user.role === 'admin' 
              ? <ListStudents /> 
              : <Navigate to="/admin-login" />
          } 
        />

        {/* Redirección por defecto para rutas que no existen */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;