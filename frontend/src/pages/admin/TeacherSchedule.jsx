import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ScheduleIcon from "@mui/icons-material/Schedule";

import { getSchedule, saveSchedule } from "../../api/admin";
import { listTeachers } from "../../api/bookings";
import GradientButton from "../../components/ui/GradientButton";
import LoadingState from "../../components/ui/LoadingState";
import PageContainer from "../../components/ui/PageContainer";
import PageHeader from "../../components/ui/PageHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import useAuth from "../../hooks/useAuth";
import { alertError, confirmAction, toastSuccess } from "../../utils/alerts";

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
    <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {TIME_OPTIONS.map((time) => (
          <MenuItem key={time} value={time}>
            {time}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default function TeacherSchedule() {
  const { user } = useAuth();
  const isSuperadmin = user?.level === 1;

  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSuperadmin) return;

    listTeachers()
      .then((data) => setTeachers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "No se pudieron cargar los docentes."));
  }, [isSuperadmin]);

  useEffect(() => {
    if (isSuperadmin && !teacherId) {
      setBlocks([]);
      return;
    }

    setLoading(true);
    setError("");

    getSchedule(isSuperadmin ? teacherId : undefined)
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

  const removeBlock = async (index) => {
    const confirmed = await confirmAction({
      title: "¿Eliminar este bloque?",
      text: "Se quitará de tu horario cuando guardes los cambios.",
      confirmText: "Sí, eliminar",
      danger: true,
    });
    if (confirmed) {
      setBlocks((current) => current.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (blocks.some((block) => block.start >= block.end)) {
      alertError("Horario inválido", "La hora de inicio debe ser menor que la hora de fin.");
      return;
    }

    setSaving(true);
    try {
      await saveSchedule(isSuperadmin ? teacherId : undefined, blocks);
      toastSuccess("Horario guardado correctamente");
    } catch (err) {
      alertError("No se pudo guardar", err.message || "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  };

  const indexedBlocks = blocks.map((block, index) => ({ ...block, index }));
  const canEdit = !isSuperadmin || Boolean(teacherId);

  return (
    <PageContainer maxWidth={800}>
      <PageHeader
        icon={ScheduleIcon}
        title={isSuperadmin ? "Horarios de docentes" : "Mi horario"}
        subtitle="Los estudiantes solo podrán reservar dentro de estos bloques."
      />

      <SurfaceCard>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isSuperadmin && (
          <FormControl fullWidth sx={{ mb: 3 }}>
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

        {loading && <LoadingState minHeight="200px" message="Cargando horario..." />}

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
                    <Box key={block.index} display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} mt={2}>
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
                      <IconButton color="error" onClick={() => removeBlock(block.index)} aria-label="Eliminar bloque">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              );
            })}

            <GradientButton fullWidth disabled={saving} onClick={handleSave} sx={{ mt: 4 }}>
              {saving ? "Guardando..." : "Guardar horario"}
            </GradientButton>
          </>
        )}
      </SurfaceCard>
    </PageContainer>
  );
}
