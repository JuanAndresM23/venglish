import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useNavigate } from "react-router-dom";

import { forgotPassword } from "../../api/auth";

export default function ForgotPassword({ audience = "student" }) {
  const loginPath = audience === "admin" ? "/admin-login" : "/login";

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    try {

      const response = await forgotPassword(email, audience, username);

      setMessage(response.message);

    } catch (err) {

      setError(
        err.message ||
        "No fue posible procesar la solicitud."
      );

    }

  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "var(--venglish-bg-gradient)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 5,
          width: "100%",
          maxWidth: "500px",
          borderRadius: "25px",
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          mb={4}
        >
          <LockResetIcon
            sx={{
              fontSize: 60,
              color: "var(--venglish-pink)",
              mb: 1
            }}
          />

          <Typography
            variant="h4"
            fontWeight="bold"
            textAlign="center"
          >
            Recuperar contraseña
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={1}
          >
            {audience === "admin"
              ? "Ingresa tu usuario y el correo registrado en tu perfil; solo enviaremos el enlace si ambos coinciden."
              : "Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña."}
          </Typography>
        </Box>

        {message && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>

          {audience === "admin" && (
            <TextField
              fullWidth
              label="Usuario"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
          )}

          <TextField
            fullWidth
            label="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              py: 1.5,
              borderRadius: "12px",
              background: "var(--venglish-gradient)",
              fontWeight: "bold"
            }}
          >
            Enviar enlace
          </Button>

          <Button
            fullWidth
            color="inherit"
            sx={{ mt: 2 }}
            onClick={() => navigate(loginPath)}
          >
            Volver al inicio de sesión
          </Button>

        </form>
      </Paper>
    </Box>
  );
}