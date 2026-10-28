import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import logo from "../../../assets/venglish.jpeg";
import "./Navbar.css";

// Barra superior del sitio público y del área de estudiantes.
// Los administradores usan la barra lateral (layouts/AdminLayout).
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);
  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate("/");
  };

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <Link to="/" onClick={closeMenu}>
        <img src={logo} alt="VEnglish Academy" className="nav-logo" />
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label="Abrir menú"
      >
        {[1, 2, 3].map((i) => (
          <span key={i} className={`bar ${isOpen ? "open" : ""}`} />
        ))}
      </button>

      <div className={`nav-links ${isOpen ? "active" : ""}`}>
        {!user && (
          <>
            <Link className="nav-link" to="/" onClick={closeMenu}>
              Inicio
            </Link>
            <Link className="nav-link" to="/student-register" onClick={closeMenu}>
              Registro
            </Link>
          </>
        )}

        {user?.role === "student" && (
          <>
            <Link className="nav-link" to="/dashboard" onClick={closeMenu}>
              Mi panel
            </Link>
            <Link className="nav-link" to="/reserve" onClick={closeMenu}>
              Reservar clases
            </Link>
          </>
        )}

        {user ? (
          <button onClick={handleLogout} className="logout-link">
            Cerrar sesión
          </button>
        ) : (
          <div className="auth-options">
            <Link className="login-btn" to="/login" onClick={closeMenu}>
              Estudiantes
            </Link>
            <Link className="admin-link-tiny" to="/admin-login" onClick={closeMenu}>
              Docentes
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
