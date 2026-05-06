import { useState } from 'react';
import { Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_URL from "../api";

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const text = await response.text();
      console.log("RESPUESTA BACKEND:", text);

      if (!response.ok) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }

      const userData = data;

      login({
        name: userData.name,
        role: userData.role,
        token: data.token,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      const role = userData.role;

      if (role === "Operaciones" || role === "Admin") {
        navigate("/dashboard");
      } else if (role === "Conductor") {
        navigate("/driver");
      } else {
        navigate("/");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-12 rounded-[2rem] shadow-lg w-full max-w-lg">

        <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
          <img 
            src="/logo.png" 
            alt="Logo empresa"
            className="h-8 w-auto object-contain"
          />
        </div>

        <h1 className="text-3xl text-center font-bold mb-2">
          Terranera SRL
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border rounded"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded"
          >
            {loading ? "Cargando..." : "Iniciar sesión"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default LoginScreen;