import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { unlockAllAudio } from '../services/music';

export default function ForceChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  // Validaciones en tiempo real
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = hasMinLength && hasLetter && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/change-password-force', { newPassword });
      setSuccess(true);
      
      // Esperar un segundo con animación de éxito antes de desbloquear
      setTimeout(() => {
        updateUser({ mustChangePassword: false });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.response?.data?.message ?? 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative overflow-hidden">
        
        {/* Glow Decorativo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/30 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="text-6xl mb-3 animate-bounce">🔑</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Restablecer Clave
          </h1>
          <p className="text-white/80 mt-2 text-sm leading-relaxed">
            Has accedido con una contraseña temporal. Por seguridad, debes configurar una contraseña nueva definitiva para continuar.
          </p>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4 animate-fadeIn">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold text-yellow-300">¡Contraseña restablecida!</h2>
            <p className="text-sm text-white/90">Iniciando sesión de forma segura...</p>
            <div className="w-12 h-12 border-4 border-yellow-300 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Contraseña Nueva */}
            <div>
              <label className="block text-sm font-medium text-white/95 mb-1.5 flex justify-between items-center">
                <span>Nueva Contraseña</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-yellow-300 hover:text-yellow-200 transition font-bold"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                className="w-full px-4 py-2.5 rounded-lg bg-white/25 border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition shadow-inner font-mono"
              />
            </div>

            {/* Campo Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-white/95 mb-1.5">
                Confirmar Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="w-full px-4 py-2.5 rounded-lg bg-white/25 border border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition shadow-inner font-mono"
              />
            </div>

            {/* Panel de Validaciones Interactivas */}
            <div className="bg-black/25 border border-white/10 rounded-xl p-4 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-white/70 mb-1">Requisitos de Seguridad</h4>
              
              <div className="flex items-center gap-2.5 text-xs">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${hasMinLength ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                  {hasMinLength ? '✓' : '•'}
                </span>
                <span className={hasMinLength ? 'text-green-300 font-medium' : 'text-white/60'}>Mínimo 8 caracteres</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${hasLetter ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                  {hasLetter ? '✓' : '•'}
                </span>
                <span className={hasLetter ? 'text-green-300 font-medium' : 'text-white/60'}>Al menos una letra</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${hasNumber ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                  {hasNumber ? '✓' : '•'}
                </span>
                <span className={hasNumber ? 'text-green-300 font-medium' : 'text-white/60'}>Al menos un número</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] ${passwordsMatch ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                  {passwordsMatch ? '✓' : '•'}
                </span>
                <span className={passwordsMatch ? 'text-green-300 font-medium' : 'text-white/60'}>Las contraseñas coinciden</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/30 border border-red-400/50 text-red-100 text-xs rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              onPointerDown={unlockAllAudio}
              className="w-full py-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black text-sm tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-400/40 uppercase active:scale-95"
            >
              {loading ? 'Procesando...' : 'Restablecer y Entrar'}
            </button>

            {/* Cancelar / Salir */}
            <button
              type="button"
              onClick={() => logout()}
              className="w-full py-2.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
            >
              Salir de la sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
