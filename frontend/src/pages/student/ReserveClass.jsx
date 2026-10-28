import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School";
import { useNavigate } from "react-router-dom";

import { getAvailableTimes, listCourses, listTeachers, reserveClass } from "../../api/bookings";
import GradientButton from "../../components/ui/GradientButton";
import PageContainer from "../../components/ui/PageContainer";
import PageHeader from "../../components/ui/PageHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { DEFAULT_DURATION, DURATION_OPTIONS } from "../../config/booking";
import { alertError, alertSuccess } from "../../utils/alerts";
import { formatDuration, formatTimeRange } from "../../utils/format";

export default function ReserveClass() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const [form, setForm] = useState({
    course_id: "",
    teacher_id: "",
    date: "",
    duration: DEFAULT_DURATION,
    time: "",
  });

  const [error, setError] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // Cargar cursos y docentes
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const [courseData, teacherData] = await Promise.all([listCourses(), listTeachers()]);
        if (!active) return;
        setCourses(Array.isArray(courseData) ? courseData : []);
        setTeachers(Array.isArray(teacherData) ? teacherData : []);
      } catch (err) {
        if (active) setError(err.message || "No se pudieron cargar los cursos y docentes.");
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  // Horas disponibles: dependen del docente, la fecha y la duración elegida
  useEffect(() => {
    if (!form.teacher_id || !form.date) return;

    let active = true;

    async function loadTimes() {
      setLoadingTimes(true);
      try {
        const times = await getAvailableTimes({
          teacherId: form.teacher_id,
          date: form.date,
          duration: form.duration,
        });
        if (active) setAvailableTimes(Array.isArray(times) ? times : []);
      } catch {
        if (active) setAvailableTimes([]);
      } finally {
        if (active) setLoadingTimes(false);
      }
    }

    loadTimes();
    return () => {
      active = false;
    };
  }, [form.teacher_id, form.date, form.duration]);

  // Cambiar docente, fecha o duración invalida la hora ya elegida.
  const updateField = (field, value) => {
    const resetsTime = ["teacher_id", "date", "duration"].includes(field);
    setForm((current) => ({ ...current, [field]: value, ...(resetsTime ? { time: "" } : {}) }));
    if (resetsTime) setAvailableTimes([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.course_id || !form.teacher_id || !form.date || !form.time) {
      setError("Debes completar todos los campos.");
      return;
    }

    try {
      setSubmitting(true);
      await reserveClass(form);
      await alertSuccess(
        "¡Clase reservada!",
        `Tu clase de ${formatDuration(form.duration)} quedó agendada el ${form.date}, de ${formatTimeRange(form.time, form.duration)}.`
      );
      navigate("/dashboard");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      alertError("No se pudo reservar", err.message || "No se pudo completar la reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasSelection = form.teacher_id && form.date;
  const teacherUnavailable = hasSelection && !loadingTimes && availableTimes.length === 0;

  return (
    <PageContainer maxWidth={600}>
      <PageHeader
        icon={CalendarMonthIcon}
        title="Agendar nueva clase"
        subtitle="Reserva con mínimo 48 horas de anticipación."
      />

      <SurfaceCard>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {teacherUnavailable && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No hay horarios disponibles para esa fecha y duración. Prueba otro día, otro docente o
            una clase más corta.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <FormControl fullWidth disabled={loadingOptions}>
                <InputLabel id="course-label">Curso</InputLabel>
                <Select
                  labelId="course-label"
                  label="Curso"
                  value={form.course_id}
                  onChange={(event) => updateField("course_id", event.target.value)}
                  required
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth disabled={loadingOptions}>
                <InputLabel id="teacher-label">Docente</InputLabel>
                <Select
                  labelId="teacher-label"
                  label="Docente"
                  value={form.teacher_id}
                  onChange={(event) => updateField("teacher_id", event.target.value)}
                  required
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      <Box display="flex" alignItems="center">
                        <SchoolIcon sx={{ mr: 1, fontSize: 20, color: "gray" }} />
                        {teacher.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel id="duration-label">Duración de la clase</InputLabel>
                <Select
                  labelId="duration-label"
                  label="Duración de la clase"
                  value={form.duration}
                  onChange={(event) => updateField("duration", event.target.value)}
                >
                  {DURATION_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl
                fullWidth
                disabled={!hasSelection || loadingTimes || availableTimes.length === 0}
              >
                <InputLabel id="time-label">{loadingTimes ? "Cargando..." : "Hora de inicio"}</InputLabel>
                <Select
                  labelId="time-label"
                  label={loadingTimes ? "Cargando..." : "Hora de inicio"}
                  value={form.time}
                  onChange={(event) => updateField("time", event.target.value)}
                  required
                >
                  {availableTimes.map((time) => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {form.time && (
              <Grid size={12}>
                <Alert
                  severity="info"
                  icon={false}
                  sx={{ borderRadius: "12px", bgcolor: "rgba(255, 219, 88, 0.2)", color: "#5c4a00" }}
                >
                  Tu clase será de <b>{formatTimeRange(form.time, form.duration)}</b> (
                  {formatDuration(form.duration)}).
                </Alert>
              </Grid>
            )}

            <Grid size={12}>
              <GradientButton
                type="submit"
                fullWidth
                disabled={submitting || loadingOptions || !form.time}
              >
                {submitting ? "Confirmando..." : "Confirmar reserva"}
              </GradientButton>
            </Grid>

            <Grid size={12}>
              <Button onClick={() => navigate("/dashboard")} fullWidth color="inherit">
                Volver al panel
              </Button>
            </Grid>
          </Grid>
        </form>
      </SurfaceCard>
    </PageContainer>
  );
}
