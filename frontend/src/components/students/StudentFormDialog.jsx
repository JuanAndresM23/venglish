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

const EMPTY_FORM = { student_code: "", name: "", phone: "", email: "" };

function toForm(student) {
  return student
    ? {
        student_code: student.code || "",
        name: student.name || "",
        phone: student.phone || "",
        email: student.email || "",
      }
    : EMPTY_FORM;
}

// Formulario de alta y edición de estudiantes. Con `student` edita; sin él, crea.
// `onSubmit(form)` debe lanzar un error si falla, para que el diálogo siga abierto.
export default function StudentFormDialog({ open, student, onClose, onSubmit }) {
  const isEdit = Boolean(student);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: "22px", p: 1 } } }}
    >
      {/* `key` reinicia el formulario cada vez que se abre con otro estudiante */}
      <StudentForm
        key={student?.id ?? "new"}
        student={student}
        isEdit={isEdit}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}

function StudentForm({ student, isEdit, onClose, onSubmit }) {
  const [form, setForm] = useState(() => toForm(student));
  const [submitting, setSubmitting] = useState(false);

  const setField = (field) => (event) =>
    setForm({
      ...form,
      [field]: field === "student_code" ? event.target.value.toUpperCase() : event.target.value,
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? "Editar estudiante" : "Nuevo estudiante"}
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
          <Typography variant="caption" color="var(--venglish-pink)" fontWeight="bold">
            {isEdit
              ? "SI CAMBIAS EL CÓDIGO, EL ALUMNO DEBERÁ USAR EL NUEVO PARA INGRESAR"
              : "ESTE CÓDIGO ES EL QUE USARÁ EL ALUMNO PARA ACTIVAR SU CUENTA"}
          </Typography>
          <TextField
            label="Código único"
            placeholder="Ej: VENG-001"
            value={form.student_code}
            onChange={setField("student_code")}
            required
            fullWidth
          />
          <TextField
            label="Nombre completo"
            value={form.name}
            onChange={setField("name")}
            required
            fullWidth
          />
          <TextField label="Teléfono" value={form.phone} onChange={setField("phone")} fullWidth />
          <TextField
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={setField("email")}
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
          {submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar estudiante"}
        </GradientButton>
      </DialogActions>
    </form>
  );
}
