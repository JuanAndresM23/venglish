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
import ListStudents from "./pages/ListStudents"; 
import Navbar from "./components/Navbar/Navbar";

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
      {/* Pasamos setUser al Navbar por si necesitas manejar el Logout ahí */}
      <Navbar user={user} setUser={setUser} /> 
      
      <Routes>
        {/* 1. RUTAS PÚBLICAS */}
        <Route path="/" element={<Index />} />
        <Route path="/student-register" element={<StudentRegister />} />
        
        {/* 2. LOGINS (Redirigen al dashboard si ya hay sesión) */}
        <Route 
          path="/login" 
          element={user?.is_logged_in ? <Navigate to="/dashboard" /> : <StudentLogin setUser={setUser} />} 
        />
        <Route 
          path="/admin-login" 
          element={user?.is_logged_in ? <Navigate to="/dashboard" /> : <AdminLogin setUser={setUser} />} 
        />

        {/* 3. DASHBOARD ÚNICO (Lógica de Roles) */}
        <Route 
          path="/dashboard" 
          element={
            user?.is_logged_in 
              ? (user.role === 'admin' ? <AdminDashboard /> : <StudentDashboard user={user} />) 
              : <Navigate to="/" /> 
          } 
        />

        {/* 4. RUTAS PROTEGIDAS ESTUDIANTES */}
        <Route 
          path="/reserve" 
          element={user?.is_logged_in && user.role === 'student' ? <ReserveClass /> : <Navigate to="/login" />} 
        />

        {/* 5. RUTAS PROTEGIDAS ADMIN (VICTORIA) */}
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

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;