import SidebarLayout from "./SidebarLayout";
import { STUDENT_MENU } from "../config/navigation";

export default function StudentLayout({ children }) {
  return (
    <SidebarLayout
      menu={STUDENT_MENU}
      roleLabel="Estudiante"
      subtitle="Mi espacio"
      logoutMessage="Tendrás que ingresar de nuevo con tu código para ver y reservar tus clases."
    >
      {children}
    </SidebarLayout>
  );
}
