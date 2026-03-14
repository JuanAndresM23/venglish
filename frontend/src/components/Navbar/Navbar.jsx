import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <Link to="/" onClick={() => setIsOpen(false)}>
          <img
            src="/src/assets/venglish.jpeg"
            alt="Venglish Logo"
            className="nav-logo"
          />
        </Link>
      </div>

      {/* Botón Hamburguesa (Solo se ve en móvil) */}
      <button className="menu-toggle" onClick={toggleMenu}>
        <span className={`bar ${isOpen ? "open" : ""}`}></span>
        <span className={`bar ${isOpen ? "open" : ""}`}></span>
        <span className={`bar ${isOpen ? "open" : ""}`}></span>
      </button>

      {/* Links de navegación */}
      <div className={`nav-links ${isOpen ? "active" : ""}`}>
        <Link className="nav-link" to="/" onClick={() => setIsOpen(false)}>
          Inicio
        </Link>
        <Link
          className="nav-link"
          to="/#pricing"
          onClick={() => setIsOpen(false)}
        >
          Programas
        </Link>
        <Link
          className="nav-link"
          to="/#testimonials"
          onClick={() => setIsOpen(false)}
        >
          Recomendaciones
        </Link>

        {/* Sección de autenticación en el Navbar */}
        <div className="nav-auth">
          {user?.is_logged_in ? (
            // Si ya inició sesión (ya sea estudiante o admin)
            <div className="user-logged">
              <Link
                className="dashboard-btn"
                to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
              >
                Mi Panel {user.role === "admin" && "(Admin)"}
              </Link>
              <button onClick={handleLogout} className="logout-link">
                Salir
              </button>
            </div>
          ) : (
            // Si NO ha iniciado sesión
            <div className="auth-options">
              <Link className="login-btn" to="/login">
                Estudiantes
              </Link>
              {/* Opción discreta para Victoria (Admin) */}
              <Link className="admin-link-tiny" to="/admin-login">
                Maestros
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
