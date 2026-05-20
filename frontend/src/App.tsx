import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Shop from './pages/Shop';
import Album from './pages/Album';
import Mural from './pages/Mural';
import Trades from './pages/Trades';
import api from './services/api';
import { getLevelTextStyle, getXpNeededForLevel } from './constants/levels';
import { themes } from './constants/themes';
import { getGlobalMute, setGlobalMute } from './services/soundManager';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const updateUserStats = useAuthStore((s) => s.updateUserStats);
  const [view, setView] = useState<'shop' | 'album' | 'mural' | 'trades'>('shop');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Control Global de Silenciado (Mute) ---
  const [isMuted, setIsMuted] = useState(getGlobalMute());

  useEffect(() => {
    const handleMuteChange = (e: any) => {
      setIsMuted(e.detail.mute);
    };
    window.addEventListener('globalMuteChange', handleMuteChange);
    return () => {
      window.removeEventListener('globalMuteChange', handleMuteChange);
    };
  }, []);

  const MuteButton = () => {
    const handleToggleMute = () => {
      const nextMute = !isMuted;
      setGlobalMute(nextMute);
      
      // Reproducir sonido de selección si des-silenciamos
      if (!nextMute) {
        const audio = new Audio('/sounds/select.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
      }
    };

    return (
      <button
        onClick={handleToggleMute}
        title={isMuted ? "Activar Sonido" : "Desactivar Sonido"}
        aria-label={isMuted ? "Activar Sonido" : "Desactivar Sonido"}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className="fixed bottom-6 right-6 z-[9999] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-950/90 backdrop-blur-xl border border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-white/20 active:scale-90 hover:scale-105 transition-all duration-300 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] select-none"
      >
        {isMuted ? (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-200 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    );
  };

  // --- Sistema de Notificaciones ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Error al obtener notificaciones:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling cada 15 segundos
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    } catch (err) {
      console.error("Error al marcar como leídas:", err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await api.post('/notifications/clear');
      setNotifications([]);
      setShowNotifDropdown(false);
    } catch (err) {
      console.error("Error al borrar notificaciones:", err);
    }
  };
  // ---------------------------------

  const playSelect = () => {
    const audio = new Audio('/sounds/select.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  // Sincronizar estadísticas de nivel, XP y sobres desde la base de datos al arrancar
  useEffect(() => {
    if (isAuthenticated) {
      api.get('/user/album')
        .then((res) => {
          if (res.data.level !== undefined && res.data.xp !== undefined) {
            updateUserStats(res.data.level, res.data.xp, res.data.completedExpansions);
          }
          if (res.data.packsAvailable !== undefined) {
            useAuthStore.getState().updatePacksAvailable(res.data.packsAvailable, res.data.lastPackClaimedAt);
          }
          if (res.data.activeTheme) {
            useAuthStore.getState().updateActiveTheme(res.data.activeTheme);
          }
        })
        .catch((err) => {
          console.error("Error sincronizando nivel y XP en inicio:", err);
        });
    }
  }, [isAuthenticated, updateUserStats]);

  // --- Aplicar clases de tema dinámico al body del documento ---
  useEffect(() => {
    const activeThemeId = user?.activeTheme || 'default';
    const currentTheme = themes[activeThemeId] || themes.default;
    const bodyEl = document.body;
    
    // Forzar fondo transparente para que se muestre el gradiente de Tailwind
    bodyEl.style.backgroundColor = 'transparent';
    bodyEl.style.transition = 'background-color 500ms ease, background-image 500ms ease, color 500ms ease';
    
    // Limpiar clases de fondo anteriores
    const classesToRemove: string[] = [];
    bodyEl.classList.forEach((cls) => {
      if (
        cls.startsWith('bg-') || 
        cls.startsWith('text-') || 
        cls.startsWith('from-') || 
        cls.startsWith('via-') || 
        cls.startsWith('to-')
      ) {
        classesToRemove.push(cls);
      }
    });
    classesToRemove.forEach((cls) => bodyEl.classList.remove(cls));

    // Agregar las clases del tema actual
    const classesToAdd = currentTheme.bgClass.split(' ');
    classesToAdd.forEach((cls) => bodyEl.classList.add(cls));
  }, [user?.activeTheme]);

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        <MuteButton />
      </>
    );
  }

  const activeThemeId = user?.activeTheme || 'default';
  const currentTheme = themes[activeThemeId] || themes.default;

  return (
    <div className={`min-h-screen ${currentTheme.bgClass} w-full font-sans transition-colors duration-500`}>
      {/* Navbar con estilo mejorado para resaltar la navegación */}
      <nav className={`backdrop-blur-md sticky top-0 z-50 p-4 border-b shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 ${currentTheme.navClass} transition-colors duration-500`}>
        <div className="flex justify-between items-center w-full md:w-auto">
          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => { playSelect(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} /></svg>
          </button>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-4">
          <button 
            onClick={() => { playSelect(); setView('shop'); }} 
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              view === 'shop' 
              ? `${currentTheme.accentClass} font-bold ${currentTheme.glowClass}` 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Tienda
          </button>
          <button 
            onClick={() => { playSelect(); setView('album')} } 
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              view === 'album' 
              ? `${currentTheme.accentClass} font-bold ${currentTheme.glowClass}` 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Mi Álbum
          </button>
          <button 
            onClick={() => { playSelect(); setView('mural')} } 
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              view === 'mural' 
              ? `${currentTheme.accentClass} font-bold ${currentTheme.glowClass}` 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Mural
          </button>
          <button 
            onClick={() => { playSelect(); setView('trades')} } 
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              view === 'trades' 
              ? `${currentTheme.accentClass} font-bold ${currentTheme.glowClass}` 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Intercambios
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          {user && !user.isGuest && (
            <div className="flex flex-col items-end gap-1 sm:gap-1.5 min-w-[100px] sm:min-w-[140px]">
              <span 
                style={getLevelTextStyle(user.level ?? 1)}
                className="text-sm font-black uppercase tracking-wider leading-none animate-text-shimmer"
              >
                Nivel {user.level ?? 1}
              </span>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, Math.max(0, ((user.xp ?? 0) / getXpNeededForLevel(user.level ?? 1)) * 100))}%` }}
                  className={`h-full ${currentTheme.progressBarClass} transition-all duration-500 ease-out`}
                />
              </div>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                {user.xp ?? 0} / {getXpNeededForLevel(user.level ?? 1)} XP
              </span>
            </div>
          )}

          {user && user.isGuest && (
            <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md select-none text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <span>👁️</span> Invitado
            </div>
          )}

          {/* Botón de Notificaciones */}
          {user && !user.isGuest && (
            <div className="relative">
              <button
                onClick={() => {
                  playSelect();
                  setShowNotifDropdown(!showNotifDropdown);
                  if (unreadCount > 0 && !showNotifDropdown) {
                    handleMarkAllAsRead();
                  }
                }}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border border-gray-900 text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Overlay para cerrar notificaciones al hacer click fuera */}
              {showNotifDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifDropdown(false)}
                />
              )}

              {/* Dropdown Notificaciones (Glassmorphism) */}
              {showNotifDropdown && (
                <div className="absolute top-full right-[-80px] sm:right-0 mt-3 w-[85vw] max-w-[320px] sm:w-80 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1 border-b border-white/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Notificaciones</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleClearNotifications}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase transition-colors"
                      >
                        Limpiar todo
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <span className="text-2xl mb-2 block">📭</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider">No hay notificaciones</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id} 
                          className={`p-3 rounded-xl text-xs leading-relaxed border ${
                            notif.status === 'unread' 
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100' 
                            : 'bg-white/5 border-white/5 text-gray-300'
                          }`}
                        >
                          {notif.message}
                          <div className="text-[9px] text-gray-500 mt-1 uppercase font-bold text-right">
                            {new Date(notif.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => { playSelect(); logout(); }} 
            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>

        {/* Mobile Nav Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden w-full flex flex-col gap-2 mt-2 pt-4 border-t border-white/10 animate-fadeIn">
            {/* User Level for Mobile */}
            {user && !user.isGuest && (
              <div className="flex flex-col items-center gap-2 mb-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <span 
                  style={getLevelTextStyle(user.level ?? 1)}
                  className="text-base font-black uppercase tracking-wider leading-none animate-text-shimmer"
                >
                  Nivel {user.level ?? 1}
                </span>
                <div className="w-full max-w-[200px] h-2 bg-gray-700 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                  <div 
                    style={{ width: `${Math.min(100, Math.max(0, ((user.xp ?? 0) / getXpNeededForLevel(user.level ?? 1)) * 100))}%` }}
                    className={`h-full ${currentTheme.progressBarClass} transition-all duration-500 ease-out`}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                  {user.xp ?? 0} / {getXpNeededForLevel(user.level ?? 1)} XP
                </span>
              </div>
            )}
            {user && user.isGuest && (
              <div className="flex flex-col items-center gap-2 mb-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md select-none text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <span>👁️</span> Invitado
                </div>
              </div>
            )}
            
            <button 
              onClick={() => { playSelect(); setView('shop'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'shop' ? `${currentTheme.mobileActiveNavClass}` : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Tienda
            </button>
            <button 
              onClick={() => { playSelect(); setView('album'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'album' ? `${currentTheme.mobileActiveNavClass}` : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Mi Álbum
            </button>
            <button 
              onClick={() => { playSelect(); setView('mural'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'mural' ? `${currentTheme.mobileActiveNavClass}` : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Mural
            </button>
            <button 
              onClick={() => { playSelect(); setView('trades'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'trades' ? `${currentTheme.mobileActiveNavClass}` : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Intercambios
            </button>
          </div>
        )}
      </nav>

      <main className="container mx-auto p-4 animate-fadeIn">
        {user?.isGuest && (
          <div className="mb-6 p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-lg flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left shadow-lg select-none">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👀</span>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400">Modo Invitado Activo</h4>
                <p className="text-xs text-gray-300 mt-0.5">Estás navegando en modo de lectura. Registra una cuenta para guardar progresos, abrir sobres e intercambiar cartas.</p>
              </div>
            </div>
            <button
              onClick={() => { playSelect(); logout(); }}
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              Registrarse / Entrar
            </button>
          </div>
        )}
        {view === 'shop' 
          ? <Shop /> 
          : view === 'album' 
            ? <Album /> 
            : view === 'mural' 
              ? <Mural /> 
              : <Trades />
        }
      </main>
      <MuteButton />
    </div>
  );
}