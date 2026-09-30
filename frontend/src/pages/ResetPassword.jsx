import { useSearchParams, useNavigate } from "react-router-dom";
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

import { apiFetch } from "../api";

export default function ResetPassword() {

  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token");

  const [password,
    setPassword] = useState("");

  const [confirmPassword,
    setConfirmPassword] = useState("");

  const [message,
    setMessage] = useState("");

  const [error,
    setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    try {

      const response =
        await apiFetch(
          "/api/reset_password",
          {
            method: "POST",
            body: JSON.stringify({
              token,
              password
            })
          }
        );

      setMessage(response.message);

      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {

      setError(
        err.message ||
        "No fue posible cambiar la contraseña."
      );

    }

  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "var(--venglish-bg-gradient)",
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
          backgroundColor:
            "rgba(255,255,255,0.92)",
          backdropFilter:
            "blur(10px)"
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
              color:
                "var(--venglish-pink)",
              mb: 1
            }}
          />

          <Typography
            variant="h4"
            fontWeight="bold"
            textAlign="center"
          >
            Nueva contraseña
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={1}
          >
            Ingresa una nueva contraseña para tu cuenta.
          </Typography>
        </Box>

        {message && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
          >
            {message}
            <br />
            Serás redirigido al login...
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>

          <TextField
            type="password"
            fullWidth
            label="Nueva contraseña"
            margin="normal"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            required
          />

          <TextField
            type="password"
            fullWidth
            label="Confirmar contraseña"
            margin="normal"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: "12px",
              background:
                "var(--venglish-gradient)",
              fontWeight: "bold"
            }}
          >
            Cambiar contraseña
          </Button>

          <Button
            fullWidth
            color="inherit"
            sx={{ mt: 2 }}
            onClick={() =>
              navigate("/login")
            }
          >
            Volver al inicio de sesión
          </Button>

        </form>

      </Paper>
    </Box>
  );
}