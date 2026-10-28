import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Typography,
  Grid,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { studentLogin } from "../../api/auth";
import useAuth from "../../hooks/useAuth";

export default function StudentLogin() {
  const { refreshUser } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await studentLogin(code.trim().toUpperCase(), password);

      const user = await refreshUser();
      if (!user?.is_logged_in) {
        setError("El inicio de sesión fue procesado, pero no se pudo validar la sesión.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(
        requestError.status
          ? requestError.message || "Código o contraseña incorrectos."
          : "No se pudo conectar con el servidor. Intenta nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "var(--venglish-bg-gradient)",
        p: 2,
      }}
    >
      <Grid
        container
        sx={{
          maxWidth: "1000px",
          width: "100%",
          borderRadius: "30px",
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
          backgroundColor: "rgba(255,255,255,0.4)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {/* Panel decorativo */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: {
              xs: "none",
              md: "flex",
            },
            background: "var(--venglish-gradient)",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            p: 4,
          }}
        >
          <Box
            sx={{
              color: "white",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              mb={2}
            >
              Únete a nuestra
              <br />
              comunidad
            </Typography>

            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
              }}
            >
              Lleva tu inglés al siguiente nivel con
              VEnglish.
            </Typography>
          </Box>
        </Grid>

        {/* Formulario */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            p: {
              xs: 4,
              md: 8,
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "white",
          }}
        >
          <Box width="100%">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              mb={4}
            >
              <Box
                sx={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor:
                    "rgba(255,75,176,0.1)",
                  border:
                    "2px solid var(--venglish-pink)",
                }}
              >
                <AccountCircleIcon
                  sx={{
                    fontSize: 50,
                    color: "var(--venglish-pink)",
                  }}
                />
              </Box>

              <Typography
                color="textPrimary"
                fontWeight="bold"
                variant="h5"
                sx={{
                  mt: 3,
                }}
              >
                Bienvenido a VEnglish
              </Typography>

              <Typography color="textSecondary">
                Inicia sesión para continuar
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <input
                  type="text"
                  placeholder="Código de estudiante"
                  className="custom-mui-input"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  autoComplete="username"
                  required
                />

                <input
                  type="password"
                  placeholder="Contraseña"
                  className="custom-mui-input"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                {error && (
                  <Typography
                    variant="body2"
                    role="alert"
                    textAlign="center"
                    sx={{
                      color: "white",
                      backgroundColor: "#e53935",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  >
                    {error}
                  </Typography>
                )}

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                  >
                    <Checkbox
                      sx={{
                        color:
                          "var(--venglish-pink)",
                        "&.Mui-checked": {
                          color:
                            "var(--venglish-pink)",
                        },
                      }}
                    />

                    <Typography
                      variant="body2"
                      color="textSecondary"
                    >
                      Recuérdame
                    </Typography>
                  </Box>

                  <Button
                    component={Link}
                    to="/forgot-password"
                    type="button"
                    size="small"
                    sx={{
                      color:
                        "var(--venglish-pink)",
                      textTransform: "none",
                      textAlign: "right",
                      fontWeight: 700,
                      minWidth: "auto",
                      p: 0,
                      "&:hover": {
                        backgroundColor:
                          "transparent",
                        textDecoration:
                          "underline",
                      },
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: "12px",
                    background:
                      "var(--venglish-gradient)",
                    fontWeight: "bold",
                    "&:hover": {
                      opacity: 0.9,
                    },
                  }}
                >
                  {submitting
                    ? "Ingresando..."
                    : "Entrar"}
                </Button>
              </Box>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}