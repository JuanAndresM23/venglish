import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AddCircleIcon from "@mui/icons-material/AddCircle";

export const LEVEL_SUPERADMIN = 1;

// Para añadir una opción al menú lateral basta con agregar un objeto aquí (y su ruta en routes/AppRoutes).
// `label` puede ser una función para variar el texto según el usuario; `level` restringe por nivel de rol.
export const ADMIN_MENU = [
  { to: "/dashboard", label: "Calendario", icon: CalendarMonthIcon },
  {
    to: "/schedule",
    label: (user) => (user?.level === LEVEL_SUPERADMIN ? "Horarios" : "Mi horario"),
    icon: ScheduleIcon,
  },
  { to: "/students", label: "Estudiantes", icon: PeopleAltIcon, level: LEVEL_SUPERADMIN },
  { to: "/profile", label: "Perfil", icon: AccountCircleIcon },
];

export const STUDENT_MENU = [
  { to: "/dashboard", label: "Mis clases", icon: EventNoteIcon },
  { to: "/reserve", label: "Reservar clase", icon: AddCircleIcon },
];

export function getMenuItems(menu, user) {
  return menu
    .filter((item) => item.level === undefined || item.level === user?.level)
    .map((item) => ({
      ...item,
      label: typeof item.label === "function" ? item.label(user) : item.label,
    }));
}
