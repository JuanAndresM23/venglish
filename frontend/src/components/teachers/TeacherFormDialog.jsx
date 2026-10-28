import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import GradientButton from "../ui/GradientButton";

const EMPTY_FORM = { username: "", full_name: "", email: "", password: "" };
const MIN_PASSWORD_LENGTH = 10;

// Formulario de alta de docentes.
// `onSubmit(form)` debe lanzar un error si falla, para que el diálogo siga abierto.
export default function TeacherFormDialog({ open, onClose, onSubmit }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: "22px", p: 1 } } }}
    >
      {/* Se monta solo al abrir, así el formulario empieza vacío cada vez */}
      {open && <TeacherForm onClose={onClose} onSubmit={onSubmit} />}
    </Dialog>
  );
}

function TeacherForm({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field) => (event) =>
    setForm({
      ...form,
      [field]: field === "username" ? event.target.value.replace(/\s/g, "") : event.target.value,
    });

  const passwordTooShort = form.password.length > 0 && form.password.length < MIN_PASSWORD_LENGTH;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch {
      // el llamador ya mostró el error; el diálogo se queda abierto
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle sx={{ fontWeight: 800 }}>Nuevo docente</DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
          <Typography variant="caption" color="var(--venglish-pink)" fontWeight="bold">
            EL DOCENTE INGRESARÁ CON ESTE USUARIO Y CONTRASEÑA, Y PODRÁ CAMBIARLA DESDE SU PERFIL
          </Typography>
          <TextField
            label="Nombre completo"
            value={form.full_name}
            onChange={setField("full_name")}
            required
            fullWidth
          />
          <TextField
            label="Usuario"
            placeholder="Ej: maria.gomez"
            value={form.username}
            onChange={setField("username")}
            required
            fullWidth
          />
          <TextField
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={setField("email")}
            helperText="Se usa para recuperar la contraseña."
            fullWidth
          />
          <TextField
            label="Contraseña inicial"
            type="password"
            value={form.password}
            onChange={setField("password")}
            error={passwordTooShort}
            helperText={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
            required
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ color: "var(--venglish-gray)", textTransform: "none", fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <GradientButton type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : "Crear docente"}
        </GradientButton>
      </DialogActions>
    </form>
  );
}
