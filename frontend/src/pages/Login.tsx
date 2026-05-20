import React from 'react';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { unlockAllAudio } from '../services/music';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⚡</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Pokémon TCG
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            {isRegister ? 'Crea tu cuenta de entrenador' : 'Inicia sesión para continuar'}
          </p>
        </div>

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
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-yellow-300 hover:text-yellow-200 font-semibold underline"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  );
}
