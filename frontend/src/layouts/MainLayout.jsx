import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar/Navbar";

// Layout de la parte pública y del área de estudiantes: barra superior + contenido.
export default function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      {children ?? <Outlet />}
    </>
  );
}
