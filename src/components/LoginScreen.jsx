import { useState } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react'; // Importamos iconos nuevos
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_URL from "../api";

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para ver/ocultar
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      let data = JSON.parse(text);
      login({
        name: data.name,
        role: data.role,
        token: data.token,
      });

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data));

      if (data.role === "Operaciones" || data.role === "Admin") {
        navigate("/dashboard");
      } else if (data.role === "Conductor") {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-lg w-full max-w-lg">
        
        <div className="flex items-center gap-4 mb-8">
          <img src="/logo.png" alt="Terranera" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight">Terranera SRL</h1>
            <p className="text-xs text-gray-400 tracking-wide">Logística y Transporte</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Campo Usuario con Aclaración */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Usuario</label>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
            />
            <div className="flex items-start gap-2 px-1">
              <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-gray-500 leading-tight">
                Usa la <span className="font-bold text-gray-700">primera letra Mayúscula</span> y <span className="font-bold text-gray-700">no pongas espacios</span> al final.
              </p>
            </div>
          </div>

          {/* Campo Contraseña con Botón de Ojo */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Contraseña (Carnet)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Solo números"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 active:scale-95 transition-all disabled:bg-gray-400 shadow-md"
          >
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default LoginScreen;