import Swal from "sweetalert2";
import "../styles/swal.css";

// Todas las alertas de la app pasan por aquí para mantener un único estilo (colores de VEnglish).
const Alert = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: "venglish-swal",
    title: "venglish-swal-title",
    confirmButton: "venglish-swal-confirm",
    cancelButton: "venglish-swal-cancel",
  },
});

export const alertSuccess = (title, text) =>
  Alert.fire({ icon: "success", title, text, confirmButtonText: "Aceptar" });

export const alertError = (title, text) =>
  Alert.fire({ icon: "error", title, text, confirmButtonText: "Entendido" });

export const alertWarning = (title, text) =>
  Alert.fire({ icon: "warning", title, text, confirmButtonText: "Entendido" });

// Aviso breve que se cierra solo (ediciones y guardados).
export const toastSuccess = (title) =>
  Alert.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title,
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
  });

// Devuelve true si la persona confirma. `danger` pinta el botón de confirmación en rojo.
export async function confirmAction({
  title = "¿Estás seguro?",
  text,
  html,
  confirmText = "Sí, continuar",
  cancelText = "No, volver",
  danger = false,
}) {
  const result = await Alert.fire({
    icon: danger ? "warning" : "question",
    title,
    text,
    html,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    focusCancel: danger,
    customClass: {
      popup: "venglish-swal",
      title: "venglish-swal-title",
      confirmButton: danger ? "venglish-swal-danger" : "venglish-swal-confirm",
      cancelButton: "venglish-swal-cancel",
    },
  });
  return result.isConfirmed;
}
