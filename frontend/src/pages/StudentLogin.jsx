import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentLogin({ setUser }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("student_code", code);
    formData.append("password", password);

    const res = await fetch("http://127.0.0.1:5000/student_login", {
      method: "POST",
      body: formData // Seguimos enviando FormData para no tocar mucho tu Flask aún
    });

    if (res.ok) {
      // Re-consultamos /api/me para actualizar el estado global
      const userRes = await fetch("http://127.0.0.1:5000/api/me", { credentials: "include" });
      const userData = await userRes.json();
      setUser(userData);
      navigate("/dashboard");
    } else {
      alert("Error en el login");
    }
  };

  return (
    <div className="login-container">
      <h1>Login de Estudiante</h1>
      <form onSubmit={handleLogin}>
        <input type="text" placeholder="Código" onChange={e => setCode(e.target.value)} required />
        <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}