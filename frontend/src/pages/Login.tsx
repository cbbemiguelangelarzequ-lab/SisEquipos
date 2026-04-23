import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LogIn, Eye, EyeOff, User, Lock } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login_check', {
        email,
        password
      });

      if (response.data.token) {
        login(response.data.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-500 to-emerald-900 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white blur-3xl"></div>
        <div className="absolute top-[60%] left-[60%] w-[60%] h-[60%] rounded-full bg-emerald-300 blur-3xl"></div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden w-full max-w-[420px] flex flex-col z-10 animate-fade-in relative">
        <div
          className="h-56 relative flex flex-col items-center justify-center p-6 text-center"
          style={{
            backgroundImage: "url('https://cladera.org/foda/images/subcat-1146.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay to darken image slightly so text is readable */}
          <div className="absolute inset-0 bg-emerald-900/60 mix-blend-multiply"></div>

          <div className="relative z-10 mt-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">SisEquipos</h1>
            <p className="text-emerald-50 text-sm font-medium mt-1 drop-shadow-md">Gestión Global de Mantenimiento y Equipos</p>
          </div>
        </div>

        <div className="px-8 pt-8 pb-10">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-6">INICIAR SESIÓN</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center border border-red-100 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-emerald-700" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Correo Electrónico"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-emerald-700" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Contraseña"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder:font-normal placeholder:text-slate-400 tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl py-4 font-bold text-[15px] shadow-lg hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Iniciando...
                </span>
              ) : (
                <>Validar Credenciales <LogIn size={18} className="transition-transform group-hover:translate-x-1" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
