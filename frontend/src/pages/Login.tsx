import React from 'react';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { unlockAllAudio } from '../services/music';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await api.post('/auth/register', { username, password });
      }

      // Hacemos el login real con el username
      const { data } = await api.post('/auth/login', { username, password });
      login(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/guest');
      login(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Error al iniciar sesión de invitado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {isForgot ? (
              <span className="text-6xl select-none">🔑</span>
            ) : (
              <svg 
                className="w-16 h-16 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] hover:rotate-180 transition-transform duration-500 cursor-pointer select-none" 
                viewBox="0 0 100 100" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Contorno exterior negro/gris oscuro */}
                <circle cx="50" cy="50" r="46" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                {/* Mitad superior roja */}
                <path d="M 8,50 A 42,42 0 0 1 92,50 Z" fill="#ef4444" />
                {/* Mitad inferior blanca */}
                <path d="M 8,50 A 42,42 0 0 0 92,50 Z" fill="#ffffff" />
                {/* Línea central */}
                <line x1="8" y1="50" x2="92" y2="50" stroke="#1f2937" strokeWidth="6" />
                {/* Botón exterior central */}
                <circle cx="50" cy="50" r="14" fill="#1f2937" />
                {/* Botón interior blanco */}
                <circle cx="50" cy="50" r="8" fill="#ffffff" />
                {/* Brillo del botón */}
                <circle cx="48" cy="48" r="3" fill="#e2e8f0" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {isForgot ? 'Recuperar Clave' : 'The TCG Project'}
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            {isForgot
              ? 'Sigue el proceso para restablecer tu cuenta'
              : isRegister
              ? 'Crea tu cuenta de entrenador'
              : 'Inicia sesión para continuar'}
          </p>
        </div>

        {isForgot ? (
          <div className="space-y-6 text-white leading-relaxed">
            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 p-4 rounded-xl shadow-lg">
              <span className="text-2xl mt-0.5">✉️</span>
              <div>
                <h4 className="font-bold text-yellow-300 text-sm">1. Envía un correo</h4>
                <p className="text-xs text-white/80 mt-1">
                  Manda un correo a:{' '}
                  <a
                    href="mailto:tcg.project.official.support@gmail.com"
                    className="text-cyan-300 hover:text-cyan-200 underline font-semibold transition"
                  >
                    tcg.project.official.support@gmail.com
                  </a>{' '}
                  con tu <strong>usuario</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 p-4 rounded-xl shadow-lg">
              <span className="text-2xl mt-0.5">🔑</span>
              <div>
                <h4 className="font-bold text-yellow-300 text-sm">2. Recibe tu clave temporal</h4>
                <p className="text-xs text-white/80 mt-1">
                  El administrador te responderá al correo dándote una clave temporal. Deberas iniciar sesion con tu nombre de usuario y la clave temporal que te adjuntó el administrador en el correo, de esta forma podras entrar a un menu para introducir la nueva contraseña que usará tu cuenta.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 p-4 rounded-xl shadow-lg">
              <span className="text-2xl mt-0.5">🔄</span>
              <div>
                <h4 className="font-bold text-yellow-300 text-sm">3. Inicia sesión y cambia</h4>
                <p className="text-xs text-white/80 mt-1">
                  Inicia sesión usando esa clave temporal. El sistema te pedirá establecer una nueva de inmediato.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsForgot(false);
                setError('');
              }}
              className="w-full py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            >
              ⬅️ Volver al Inicio de Sesión
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ash_ketchum"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
                />
                {!isRegister && (
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        setError('');
                      }}
                      className="text-xs text-yellow-300 hover:text-yellow-200 underline font-semibold transition"
                    >
                      ¿Has olvidado tu contraseña?
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/30 border border-red-400/50 text-red-100 text-sm rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                onPointerDown={unlockAllAudio}
                className="w-full py-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-400/40"
              >
                {loading ? '...' : isRegister ? 'Crear cuenta' : 'Entrar'}
              </button>

              {!isRegister && (
                <button
                  type="button"
                  disabled={loading}
                  onPointerDown={unlockAllAudio}
                  onClick={handleGuestLogin}
                  className="w-full py-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                >
                  👀 Entrar como invitado
                </button>
              )}
            </form>

            <p className="text-center text-sm text-white/70 mt-6">
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-yellow-300 hover:text-yellow-200 font-semibold underline"
              >
                {isRegister ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
