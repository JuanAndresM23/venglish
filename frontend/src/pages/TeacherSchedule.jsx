import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { apiFetch } from "../api";

const DAYS = [
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
  { id: 6, name: "Sábado" },
  { id: 7, name: "Domingo" },
];

const TIME_OPTIONS = Array.from({ length: 33 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = minutes % 60 === 0 ? "00" : "30";
  return `${hours}:${mins}`;
});

function TimeSelect({ label, value, onChange }) {
  return (
    <FormControl size="small" sx={{ minWidth: 110 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {TIME_OPTIONS.map((time) => (
          <MenuItem key={time} value={time}>
            {time}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function TeacherSchedule({ user }) {
  const isSuperadmin = user?.level === 1;

  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isSuperadmin) return;

    apiFetch("/api/teachers")
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "No se pudieron cargar los docentes."));
  }, [isSuperadmin]);

  useEffect(() => {
    if (isSuperadmin && !teacherId) {
      setBlocks([]);
      return;
    }

    const query = isSuperadmin ? `?teacher_id=${teacherId}` : "";

    setLoading(true);
    setError("");
    setSuccess("");

    apiFetch(`/api/admin/schedule${query}`)
      .then((data) => setBlocks(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "No se pudo cargar el horario."))
      .finally(() => setLoading(false));
  }, [isSuperadmin, teacherId]);

  const addBlock = (day) => {
    setBlocks((current) => [...current, { day, start: "08:00", end: "12:00" }]);
  };

  const updateBlock = (index, changes) => {
    setBlocks((current) =>
      current.map((block, i) => (i === index ? { ...block, ...changes } : block))
    );
  };

  const removeBlock = (index) => {
    setBlocks((current) => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (blocks.some((block) => block.start >= block.end)) {
      setError("La hora de inicio debe ser menor que la hora de fin.");
      return;
    }

    setSaving(true);

    try {
      await apiFetch("/api/admin/schedule", {
        method: "POST",
        body: JSON.stringify({
          teacher_id: isSuperadmin ? teacherId : undefined,
          blocks,
        }),
      });
      setSuccess("Horario guardado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  };

  const indexedBlocks = blocks.map((block, index) => ({ ...block, index }));
  const canEdit = !isSuperadmin || Boolean(teacherId);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--venglish-bg-gradient)",
        display: "flex",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: "25px",
          maxWidth: "750px",
          width: "100%",
          height: "fit-content",
          backgroundColor: "rgba(255,255,255,0.95)",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <ScheduleIcon sx={{ fontSize: 50, color: "var(--venglish-pink)", mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            {isSuperadmin ? "Horarios de docentes" : "Mi horario"}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Los estudiantes solo podrán reservar dentro de estos bloques.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {isSuperadmin && (
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel id="schedule-teacher-label">Docente</InputLabel>
            <Select
              labelId="schedule-teacher-label"
              label="Docente"
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
            >
              {teachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress sx={{ color: "var(--venglish-pink)" }} />
          </Box>
        )}

        {!loading && canEdit && (
          <>
            {DAYS.map((day) => {
              const dayBlocks = indexedBlocks.filter((block) => block.day === day.id);

              return (
                <Box
                  key={day.id}
                  sx={{ py: 2, borderBottom: "1px solid rgba(255,75,176,0.12)" }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight="bold">{day.name}</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => addBlock(day.id)}
                      sx={{ color: "var(--venglish-pink)", textTransform: "none" }}
                    >
                      Agregar bloque
                    </Button>
                  </Box>

                  {dayBlocks.length === 0 && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      No disponible
                    </Typography>
                  )}

                  {dayBlocks.map((block) => (
                    <Box key={block.index} display="flex" alignItems="center" gap={2} mt={2}>
                      <TimeSelect
                        label="Desde"
                        value={block.start}
                        onChange={(value) => updateBlock(block.index, { start: value })}
                      />
                      <TimeSelect
                        label="Hasta"
                        value={block.end}
                        onChange={(value) => updateBlock(block.index, { end: value })}
                      />
                      <IconButton color="error" onClick={() => removeBlock(block.index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              );
            })}

            <Button
              fullWidth
              variant="contained"
              disabled={saving}
              onClick={handleSave}
              sx={{
                mt: 4,
                py: 1.5,
                borderRadius: "12px",
                background: "var(--venglish-gradient)",
                fontWeight: "bold",
              }}
            >
              {saving ? "Guardando..." : "Guardar horario"}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}