import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import API_URL from "../../config"; // ← AGREGADO

export default function Navbar({ user, setUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
        await fetch(`${API_URL}/api/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (err) {
        console.error("Error al cerrar sesión:", err);
    } finally {
        localStorage.removeItem("role_level");
        setUser(null);
        navigate("/");
    }
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <Link to="/" onClick={() => setIsOpen(false)}>
          <img
           src="/venglish.jpeg"
            alt="Venglish Logo"
            className="nav-logo"
          />
        </Link>
      </div>

      <button className="menu-toggle" onClick={toggleMenu}>
        <span className={`bar ${isOpen ? "open" : ""}`}></span>
        <span className={`bar ${isOpen ? "open" : ""}`}></span>
        <span className={`bar ${isOpen ? "open" : ""}`}></span>
      </button>

      <div className={`nav-links ${isOpen ? "active" : ""}`}>
        
        {/* --- 1. LINKS PARA USUARIOS NO LOGUEADOS --- */}
        {!user && (
          <>
            <Link className="nav-link" to="/" onClick={() => setIsOpen(false)}>Inicio</Link> {/* ← CORREGIDO /index → / */}
            <Link className="nav-link" to="/student-register" onClick={() => setIsOpen(false)}>Registro</Link>
          </>
        )}

        {/* --- 2. LINKS PARA ESTUDIANTES --- */}
        {user && user.role === "student" && (
          <>
            <Link className="nav-link" to="/dashboard" onClick={() => setIsOpen(false)}>Mi Panel</Link>
            <Link className="nav-link" to="/reserve" onClick={() => setIsOpen(false)}>Reservar Clases</Link>
          </>
        )}

        {/* --- 3. LINKS PARA MAESTROS (ADMIN) --- */}
        {user && user.role === "admin" && (
          <>
            <Link className="nav-link" to="/dashboard" onClick={() => setIsOpen(false)}>Calendario</Link>
            <Link className="nav-link" to="/add-student" onClick={() => setIsOpen(false)}>Registrar Alumno</Link>
            
            {/* VALIDACIÓN PARA VICTORIA (Nivel 1) */}
            {user.level === 1 && ( // ← CORREGIDO, eliminado localStorage
              <Link className="nav-link" to="/list-students" onClick={() => setIsOpen(false)}>
                Lista Alumnos
              </Link>
            )}
          </>
        )}

        {/* --- SECCIÓN DE BOTONES DE ACCIÓN --- */}
        <div className="nav-auth">
          {user ? (
            <button onClick={handleLogout} className="logout-link">
              Cerrar Sesión
            </button>
          ) : (
            <div className="auth-options">
              <Link className="login-btn" to="/login" onClick={() => setIsOpen(false)}>
                Estudiantes
              </Link>
              <Link className="admin-link-tiny" to="/admin-login" onClick={() => setIsOpen(false)}>
                Maestros
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}