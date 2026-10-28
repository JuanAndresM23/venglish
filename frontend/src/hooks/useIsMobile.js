import { useMediaQuery } from "@mui/material";

// true en pantallas de teléfono (< 600 px). Úsalo para cambiar tablas por tarjetas.
export default function useIsMobile() {
  return useMediaQuery("(max-width:599.95px)");
}
