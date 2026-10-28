import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";

import {
  addStudent,
  deleteStudent,
  listStudents,
  setStudentEnabled,
  updateStudent,
} from "../../api/admin";
import StudentFormDialog from "../../components/students/StudentFormDialog";
import DataCard from "../../components/ui/DataCard";
import GradientButton from "../../components/ui/GradientButton";
import PageContainer from "../../components/ui/PageContainer";
import PageHeader from "../../components/ui/PageHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import useIsMobile from "../../hooks/useIsMobile";
import { alertError, alertSuccess, confirmAction, toastSuccess } from "../../utils/alerts";

const headCell = { fontWeight: 700, color: "var(--venglish-black)", background: "#fff5fa" };

// Desactivado (por la academia) tiene prioridad sobre Activa/Pendiente (si ya creó su contraseña).
function accountStatus(student) {
  if (!student.enabled) return { label: "Desactivado", color: "#fff", background: "var(--venglish-gray)" };
  if (student.active) return { label: "Activa", color: "#fff", background: "var(--venglish-purple)" };
  return { label: "Pendiente", color: "#7a5c00", background: "var(--venglish-yellow)" };
}

function StatusChip({ student }) {
  const { label, color, background } = accountStatus(student);
  return <Chip label={label} size="small" sx={{ fontWeight: 700, color, background }} />;
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // null = diálogo cerrado · {} = nuevo estudiante · {...student} = edición
  const [editing, setEditing] = useState(null);

  const loadStudents = useCallback(async () => {
    try {
      const data = await listStudents();
      setStudents(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("No se pudo cargar la lista. Intenta recargar la página.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      [s.name, s.code, s.email, s.phone].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [students, search]);

  const isEditing = Boolean(editing?.id);

  const handleSave = async (form) => {
    try {
      if (isEditing) {
        await updateStudent(editing.id, form);
      } else {
        await addStudent(form);
      }
      setEditing(null);
      loadStudents();
    } catch (err) {
      alertError("No se pudo guardar", err.message || "Error al guardar el estudiante.");
      throw err;
    }

    if (isEditing) {
      toastSuccess("Estudiante actualizado correctamente");
    } else {
      alertSuccess(
        "Estudiante registrado",
        `${form.name} ya puede activar su cuenta con el código ${form.student_code}.`
      );
    }
  };

  const handleToggleEnabled = async (student) => {
    const enabling = !student.enabled;
    const confirmed = await confirmAction({
      title: enabling ? "¿Activar estudiante?" : "¿Desactivar estudiante?",
      text: enabling
        ? `${student.name} podrá volver a iniciar sesión y reservar clases.`
        : `${student.name} no podrá iniciar sesión ni reservar clases. Sus datos y clases ya reservadas se conservan.`,
      confirmText: enabling ? "Sí, activar" : "Sí, desactivar",
      cancelText: "Cancelar",
      danger: !enabling,
    });
    if (!confirmed) return;

    try {
      await setStudentEnabled(student.id, enabling);
      setStudents((current) =>
        current.map((item) => (item.id === student.id ? { ...item, enabled: enabling } : item))
      );
      toastSuccess(enabling ? "Estudiante activado" : "Estudiante desactivado");
    } catch (err) {
      alertError("No se pudo cambiar el estado", err.message || "Error al actualizar el estudiante.");
    }
  };

  const handleDelete = async (student) => {
    const confirmed = await confirmAction({
      title: "¿Eliminar estudiante?",
      text: `Se eliminará a ${student.name} (${student.code}). Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar",
      cancelText: "Conservar",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await deleteStudent(student.id);
      setStudents((current) => current.filter((item) => item.id !== student.id));
      toastSuccess("Estudiante eliminado correctamente");
    } catch (err) {
      alertError("No se pudo eliminar", err.message || "Error al eliminar el estudiante.");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={PeopleAltIcon}
        title="Estudiantes"
        subtitle={`${students.length} estudiantes registrados`}
        actions={
          <GradientButton startIcon={<PersonAddIcon />} onClick={() => setEditing({})}>
            Nuevo estudiante
          </GradientButton>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <SurfaceCard sx={{ p: { xs: 1.5, md: 3 } }}>
        <TextField
          placeholder="Buscar estudiante..."
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        {isMobile ? (
          <Box display="flex" flexDirection="column" gap={2}>
            {filtered.length > 0 ? (
              filtered.map((student) => (
                <DataCard
                  key={student.id}
                  title={student.name}
                  badges={[
                    <Chip
                      key="code"
                      label={student.code}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 700, color: "var(--venglish-pink)", borderColor: "var(--venglish-pink)" }}
                    />,
                    <StatusChip key="status" student={student} />,
                  ]}
                  fields={[
                    { label: "Teléfono", value: student.phone },
                    { label: "Email", value: student.email },
                  ]}
                  actions={
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setEditing(student)}
                        sx={{
                          flex: 1,
                          textTransform: "none",
                          borderRadius: "10px",
                          color: "var(--venglish-pink)",
                          borderColor: "var(--venglish-pink)",
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        color={student.enabled ? "inherit" : "success"}
                        startIcon={student.enabled ? <BlockIcon /> : <CheckCircleIcon />}
                        onClick={() => handleToggleEnabled(student)}
                        sx={{ flex: 1, textTransform: "none", borderRadius: "10px" }}
                      >
                        {student.enabled ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(student)}
                        sx={{ flex: 1, textTransform: "none", borderRadius: "10px" }}
                      >
                        Eliminar
                      </Button>
                    </>
                  }
                />
              ))
            ) : (
              <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                {loading ? "Cargando estudiantes..." : "No se encontraron estudiantes."}
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer>
          <Table aria-label="tabla de estudiantes">
            <TableHead>
              <TableRow>
                <TableCell sx={headCell}>Nombre</TableCell>
                <TableCell sx={headCell}>Código</TableCell>
                <TableCell sx={headCell}>Contacto</TableCell>
                <TableCell sx={headCell}>Email</TableCell>
                <TableCell sx={headCell}>Cuenta</TableCell>
                <TableCell sx={headCell} align="right">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{student.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.code}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 700,
                          color: "var(--venglish-pink)",
                          borderColor: "var(--venglish-pink)",
                        }}
                      />
                    </TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <StatusChip student={student} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Editar">
                        <IconButton
                          aria-label={`Editar a ${student.name}`}
                          onClick={() => setEditing(student)}
                          sx={{ color: "var(--venglish-pink)" }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={student.enabled ? "Desactivar" : "Activar"}>
                        <IconButton
                          aria-label={`${student.enabled ? "Desactivar" : "Activar"} a ${student.name}`}
                          color={student.enabled ? "default" : "success"}
                          onClick={() => handleToggleEnabled(student)}
                        >
                          {student.enabled ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          aria-label={`Eliminar a ${student.name}`}
                          color="error"
                          onClick={() => handleDelete(student)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    {loading ? "Cargando estudiantes..." : "No se encontraron estudiantes."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TableContainer>
        )}
      </SurfaceCard>

      <StudentFormDialog
        open={editing !== null}
        student={isEditing ? editing : null}
        onClose={() => setEditing(null)}
        onSubmit={handleSave}
      />
    </PageContainer>
  );
}
