// En desarrollo se usan rutas relativas (/api/...) para que el proxy de Vite las envíe al
// backend: así el navegador ve un único origen y guarda la cookie de sesión.
const defaultUrl = import.meta.env.DEV ? "" : "http://127.0.0.1:5000";

export const API_URL = (import.meta.env.VITE_API_URL ?? defaultUrl).replace(/\/$/, "");

export default API_URL;
