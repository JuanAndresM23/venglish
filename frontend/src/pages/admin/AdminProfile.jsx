import { useEffect, useState } from "react";
import { Alert, Box, Chip, Grid, TextField, Typography } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";

import { changePassword, getProfile, updateProfile } from "../../api/admin";
import GradientButton from "../../components/ui/GradientButton";
import LoadingState from "../../components/ui/LoadingState";
import PageContainer from "../../components/ui/PageContainer";
import PageHeader from "../../components/ui/PageHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import useAuth from "../../hooks/useAuth";
import { alertError, alertSuccess, confirmAction, toastSuccess } from "../../utils/alerts";

const EMPTY_PASSWORDS = { current: "", next: "", confirm: "" };

export default function AdminProfile() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: "", email: "" });
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [loadError, setLoadError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        setForm({ full_name: data.full_name, email: data.email });
      })
      .catch((err) => setLoadError(err.message || "No se pudo cargar el perfil."));
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const result = await updateProfile(form);
      setUser((current) => ({ ...current, name: result.name }));
      setProfile((current) => ({ ...current, ...form }));
      toastSuccess("Perfil actualizado correctamente");
    } catch (err) {
      alertError("No se pudo actualizar", err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwords.next !== passwords.confirm) {
      alertError("Las contraseñas no coinciden", "Escribe la misma contraseña nueva en ambos campos.");
      return;
    }

    const confirmed = await confirmAction({
      title: "¿Cambiar tu contraseña?",
      text: "Usarás la nueva contraseña la próxima vez que inicies sesión.",
      confirmText: "Sí, cambiarla",
    });
    if (!confirmed) return;

    setSavingPassword(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords(EMPTY_PASSWORDS);
      alertSuccess("Contraseña actualizada", "Tu contraseña se cambió correctamente.");
    } catch (err) {
      alertError("No se pudo cambiar la contraseña", err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadError) {
    return (
      <PageContainer maxWidth={900}>
        <Alert severity="error">{loadError}</Alert>
      </PageContainer>
    );
  }
  if (!profile) return <LoadingState message="Cargando perfil..." />;

  const initial = (profile.full_name || profile.username).charAt(0).toUpperCase();

  return (
    <PageContainer maxWidth={900}>
      <PageHeader
        icon={AccountCircleIcon}
        title="Mi perfil"
        subtitle="Consulta y actualiza tus datos de acceso."
      />

      <SurfaceCard sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
          <Box
            sx={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 36,
              fontWeight: 800,
              color: "#fff",
              background: "var(--venglish-gradient-strong)",
              boxShadow: "0 10px 24px rgba(255, 75, 176, 0.35)",
            }}
          >
            {initial}
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {profile.full_name || profile.username}
            </Typography>
            <Typography color="text.secondary">@{profile.username}</Typography>
            <Chip
              label={profile.role}
              size="small"
              sx={{ mt: 1, fontWeight: 700, color: "#fff", background: "var(--venglish-purple)" }}
            />
          </Box>
        </Box>
      </SurfaceCard>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SurfaceCard component="form" onSubmit={handleProfileSubmit} sx={{ height: "100%" }}>
            <Typography variant="h6" fontWeight="bold" mb={2.5}>
              Datos personales
            </Typography>
            <Box display="flex" flexDirection="column" gap={2.5}>
              <TextField
                label="Nombre completo"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                fullWidth
              />
              <TextField label="Usuario" value={profile.username} disabled fullWidth />
              <GradientButton type="submit" disabled={savingProfile}>
                {savingProfile ? "Guardando..." : "Guardar cambios"}
              </GradientButton>
            </Box>
          </SurfaceCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SurfaceCard component="form" onSubmit={handlePasswordSubmit} sx={{ height: "100%" }}>
            <Typography variant="h6" fontWeight="bold" mb={2.5} display="flex" gap={1} alignItems="center">
              <LockIcon sx={{ color: "var(--venglish-pink)" }} /> Cambiar contraseña
            </Typography>
            <Box display="flex" flexDirection="column" gap={2.5}>
              <TextField
                label="Contraseña actual"
                type="password"
                autoComplete="current-password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                autoComplete="new-password"
                helperText="Mínimo 10 caracteres"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Confirmar nueva contraseña"
                type="password"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
                fullWidth
              />
              <GradientButton type="submit" disabled={savingPassword}>
                {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
              </GradientButton>
            </Box>
          </SurfaceCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
