import { Fragment } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import logo from "../../../assets/venglish.jpeg";
import "./Sidebar.css";

// Barra lateral reutilizable: recibe el menú (ver config/navigation.js) y el usuario actual.
// Escritorio: se contrae a solo iconos. Móvil: se desliza sobre el contenido.
export default function Sidebar({
  items,
  user,
  roleLabel,
  subtitle,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onNavigate,
  onLogout,
}) {
  const { pathname } = useLocation();
  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  const withTooltip = (title, node) =>
    collapsed ? (
      <Tooltip title={title} placement="right" arrow>
        {node}
      </Tooltip>
    ) : (
      node
    );

  return (
    <aside
      className={`sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-open" : ""}`}
      aria-label="Menú principal"
    >
      <div className="sidebar-header">
        <img src={logo} alt="VEnglish Academy" className="sidebar-logo" />
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">VEnglish</span>
          <span className="sidebar-brand-sub">{subtitle}</span>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </button>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initial}</div>
        <div className="sidebar-user-text">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-role">{roleLabel}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <Fragment key={item.to}>
            {withTooltip(
              item.label,
              <NavLink
                to={item.to}
                end
                onClick={onNavigate}
                className={`sidebar-link${pathname === item.to ? " is-active" : ""}`}
              >
                <item.icon className="sidebar-link-icon" />
                <span className="sidebar-link-label">{item.label}</span>
              </NavLink>
            )}
          </Fragment>
        ))}
      </nav>

      <div className="sidebar-footer">
        {withTooltip(
          "Cerrar sesión",
          <button type="button" className="sidebar-link sidebar-logout" onClick={onLogout}>
            <LogoutIcon className="sidebar-link-icon" />
            <span className="sidebar-link-label">Cerrar sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
}
