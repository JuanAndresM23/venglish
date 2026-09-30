import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SchoolIcon from "@mui/icons-material/School";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "../css/index.css";

export default function ReserveClass() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  const [form, setForm] = useState({
    course_id: "",
    teacher_id: "",
    date: "",
    time: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // Cargar cursos y docentes
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        setError("");
        setLoadingOptions(true);

        const [courseData, teacherData] = await Promise.all([
          apiFetch("/api/courses"),
          apiFetch("/api/teachers"),
        ]);

        if (!active) return;

        setCourses(Array.isArray(courseData) ? courseData : []);
        setTeachers(Array.isArray(teacherData) ? teacherData : []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        if (active) {
          setError(err.message || "No se pudieron cargar los cursos y docentes.");
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  // Cargar horas disponibles cuando cambian docente o fecha
  useEffect(() => {
    if (!form.teacher_id || !form.date) {
      setAvailableTimes([]);
      return;
    }

    let active = true;

    async function loadTimes() {
      setLoadingTimes(true);
      setForm((current) => ({ ...current, time: "" }));

      try {
        const times = await apiFetch(
          `/api/available-times?teacher_id=${form.teacher_id}&date=${form.date}`
        );
        if (active) setAvailableTimes(Array.isArray(times) ? times : []);
      } catch (err) {
        console.error("Error cargando horarios:", err);
        if (active) setAvailableTimes([]);
      } finally {
        if (active) setLoadingTimes(false);
      }
    }

    loadTimes();

    return () => {
      active = false;
    };
  }, [form.teacher_id, form.date]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.course_id || !form.teacher_id || !form.date || !form.time) {
      setError("Debes completar todos los campos.");
      return;
    }

    try {
      setSubmitting(true);

      await apiFetch("/api/reserve", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setSuccess("¡Clase reservada correctamente!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Error reservando:", err);

      if (err.status === 401) {
        navigate("/login");
        return;
      }

      setError(err.message || "No se pudo completar la reserva.");
    } finally {
      setSubmitting(false);
    }
  };

  const teacherUnavailable =
    form.teacher_id && form.date && !loadingTimes && availableTimes.length === 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--venglish-bg-gradient)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: "25px",
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <CalendarMonthIcon sx={{ fontSize: 50, color: "var(--venglish-pink)", mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Agendar nueva clase
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reserva con mínimo 48 horas de anticipación
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        {teacherUnavailable && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            El docente no está disponible en la fecha seleccionada. Elige otro día u otro docente.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
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

            <Grid item xs={12}>
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

            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                disabled={!form.teacher_id || !form.date || loadingTimes || availableTimes.length === 0}
              >
                <InputLabel id="time-label">
                  {loadingTimes ? "Cargando..." : "Hora"}
                </InputLabel>
                <Select
                  labelId="time-label"
                  label={loadingTimes ? "Cargando..." : "Hora"}
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

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting || loadingOptions || !form.time}
                sx={{
                  py: 1.5,
                  borderRadius: "12px",
                  background: "var(--venglish-gradient)",
                  fontWeight: "bold",
                }}
              >
                {submitting ? "Confirmando..." : "Confirmar reserva"}
              </Button>
            </Grid>

                     <Grid item xs={12}>
              <Button
                onClick={() => navigate("/dashboard")}
                fullWidth
                color="inherit"
              >
                Volver al panel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}