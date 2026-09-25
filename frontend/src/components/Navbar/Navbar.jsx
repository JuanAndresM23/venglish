import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api";
import logo from "../../assets/venglish.jpeg";
import "./Navbar.css";

export default function Navbar({ user, setUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);
  const handleLogout = async () => {
    try { await apiFetch("/api/logout", { method: "POST" }); }
    finally { setUser(null); closeMenu(); navigate("/"); }
  };

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <Link to="/" onClick={closeMenu}><img src={logo} alt="VEnglish Academy" className="nav-logo" /></Link>
      <button className="menu-toggle" onClick={() => setIsOpen(v => !v)} aria-expanded={isOpen} aria-label="Abrir menú">
        {[1,2,3].map(i => <span key={i} className={`bar ${isOpen ? "open" : ""}`} />)}
      </button>
      <div className={`nav-links ${isOpen ? "active" : ""}`}>
        {!user && <><Link className="nav-link" to="/" onClick={closeMenu}>Inicio</Link><Link className="nav-link" to="/student-register" onClick={closeMenu}>Registro</Link></>}
        {user?.role === "student" && <><Link className="nav-link" to="/dashboard" onClick={closeMenu}>Mi panel</Link><Link className="nav-link" to="/reserve" onClick={closeMenu}>Reservar clases</Link></>}
        {user?.role === "admin" && <><Link className="nav-link" to="/dashboard" onClick={closeMenu}>Calendario</Link>{user.level === 1 && <><Link className="nav-link" to="/add-student" onClick={closeMenu}>Registrar alumno</Link><Link className="nav-link" to="/list-students" onClick={closeMenu}>Lista de alumnos</Link></>}</>}
        {user ? <button onClick={handleLogout} className="logout-link">Cerrar sesión</button> : <div className="auth-options"><Link className="login-btn" to="/login" onClick={closeMenu}>Estudiantes</Link><Link className="admin-link-tiny" to="/admin-login" onClick={closeMenu}>Docentes</Link></div>}
      </div>
    </nav>
  );
}