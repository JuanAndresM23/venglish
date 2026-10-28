import { Button } from "@mui/material";

// Botón principal con el degradado de la marca.
export default function GradientButton({ children, sx, ...props }) {
  return (
    <Button
      variant="contained"
      disableElevation
      sx={{
        py: 1.4,
        px: 3,
        borderRadius: "12px",
        fontWeight: "bold",
        textTransform: "none",
        color: "#fff",
        background: "var(--venglish-gradient-strong)",
        boxShadow: "0 8px 18px rgba(255, 75, 176, 0.28)",
        "&:hover": { opacity: 0.92, boxShadow: "0 10px 22px rgba(255, 75, 176, 0.38)" },
        "&.Mui-disabled": { color: "rgba(255,255,255,0.8)", opacity: 0.55 },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
