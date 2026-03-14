import React, { useState } from "react";
import { Box, Button, Checkbox, Typography, colors } from "@mui/material";
import Grid from "@mui/material/Grid"; // Usamos el Grid estándar por compatibilidad
import { useNavigate } from "react-router-dom";
import "../components/StudentLogin.css";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function StudentLogin({ setUser }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Ahora el botón del diseño dispara esto
    const formData = new FormData();
    formData.append("student_code", code);
    formData.append("password", password);

    const res = await fetch("http://127.0.0.1:5000/student_login", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const userRes = await fetch("http://127.0.0.1:5000/api/me", {
        credentials: "include",
      });
      const userData = await userRes.json();
      setUser(userData);
      navigate("/dashboard");
    } else {
      alert("Código o contraseña incorrectos");
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%)",
      }}
    >
      <Grid container justifyContent="center">
        <Grid item xs={12} sm={8} md={6} lg={5} xl={4}>
          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(15px)",
              p: { xs: 3, md: 6 }, // Aumentamos el padding interno (p) para que respire más
              width: "100%", // Que ocupe todo el ancho del Grid
              maxWidth: "550px", // Limita el ancho máximo para que no se estire infinito en 27"
              borderRadius: "30px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box width="100%">
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mb={4}
              >
                {/* LOGO VENGLISH */}
                <Box
                  sx={{
                    mt: 2,
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    boxShadow: `0 0 20px rgba(255, 75, 176, 0.5)`,
                  }}
                >
                  <AccountCircleIcon sx={{ fontSize: 80, color: "white" }} />
                </Box>

                <Typography
                  color="white"
                  fontWeight="bold"
                  variant="h5"
                  sx={{ mt: 3, textAlign: "center" }}
                >
                  Welcome to Venglish
                </Typography>
                <Typography
                  color="white"
                  sx={{ opacity: 0.8, textAlign: "center" }}
                >
                  Sign in to continue your learning
                </Typography>
              </Box>

              {/* FORMULARIO */}
              <form onSubmit={handleLogin}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <input
                    type="text"
                    placeholder="Student Code"
                    className="custom-mui-input"
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="custom-mui-input"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    color="white"
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Checkbox
                        disableRipple
                        sx={{
                          p: 0,
                          pr: 1,
                          color: "white",
                          "&.Mui-checked": { color: "white" },
                        }}
                      />
                      <Typography variant="body2">Remember me</Typography>
                    </div>
                    <Typography
                      variant="body2"
                      sx={{ cursor: "pointer", textDecoration: "underline" }}
                    >
                      Forgot password?
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: "12px",
                      backgroundColor: "#ff4bb0",
                      "&:hover": { backgroundColor: "#e03a9d" },
                      boxShadow: `0 4px 15px rgba(255, 75, 176, 0.4)`,
                    }}
                  >
                    Login
                  </Button>
                </Box>
              </form>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
