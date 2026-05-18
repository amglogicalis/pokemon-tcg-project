import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Shop from './pages/Shop';
import Album from './pages/Album';
import Mural from './pages/Mural';
import Trades from './pages/Trades';
import api from './services/api';
import { getLevelTextStyle } from './constants/levels';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const updateUserStats = useAuthStore((s) => s.updateUserStats);
  const [view, setView] = useState<'shop' | 'album' | 'mural' | 'trades'>('shop');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            updateUserStats(res.data.level, res.data.xp);
          }
          if (res.data.packsAvailable !== undefined) {
            useAuthStore.getState().updatePacksAvailable(res.data.packsAvailable, res.data.lastPackClaimedAt);
          }
        })
        .catch((err) => {
          console.error("Error sincronizando nivel y XP en inicio:", err);
        });
    }
  }, [isAuthenticated, updateUserStats]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white w-full font-sans">
      {/* Navbar con estilo mejorado para resaltar la navegación */}
      <nav className="bg-gray-800/50 backdrop-blur-md sticky top-0 z-50 p-4 border-b border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
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
              ? 'bg-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Tienda
          </button>
          <button 
            onClick={() => { playSelect(); setView('album')} } 
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              view === 'album' 
              ? 'bg-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Mi Álbum
          </button>
          <button 
            onClick={() => { playSelect(); setView('mural')} } 
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              view === 'mural' 
              ? 'bg-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Mural
          </button>
          <button 
            onClick={() => { playSelect(); setView('trades')} } 
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              view === 'trades' 
              ? 'bg-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            Intercambios
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          {user && (
            <div className="hidden sm:flex flex-col items-end gap-1.5 min-w-[140px]">
              <span 
                style={getLevelTextStyle(user.level ?? 1)}
                className="text-sm font-black uppercase tracking-wider leading-none animate-text-shimmer"
              >
                Nivel {user.level ?? 1}
              </span>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                <div 
                  style={{ width: `${Math.min(100, Math.max(0, ((user.xp ?? 0) / (100 + ((user.level ?? 1) - 1) * 50)) * 100))}%` }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)] transition-all duration-500 ease-out"
                />
              </div>
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                {user.xp ?? 0} / {100 + ((user.level ?? 1) - 1) * 50} XP
              </span>
            </div>
          )}

          {/* Botón de Notificaciones */}
          {user && (
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

              {/* Dropdown Notificaciones (Glassmorphism) */}
              {showNotifDropdown && (
                <div className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] max-w-[320px] sm:w-80 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 flex flex-col gap-3 origin-top-right">
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
            {user && (
              <div className="flex flex-col items-center gap-2 mb-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <span 
                  style={getLevelTextStyle(user.level ?? 1)}
                  className="text-base font-black uppercase tracking-wider leading-none animate-text-shimmer"
                >
                  Nivel {user.level ?? 1}
                </span>
                <div className="w-full max-w-[200px] h-2 bg-gray-700 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                  <div 
                    style={{ width: `${Math.min(100, Math.max(0, ((user.xp ?? 0) / (100 + ((user.level ?? 1) - 1) * 50)) * 100))}%` }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)] transition-all duration-500 ease-out"
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                  {user.xp ?? 0} / {100 + ((user.level ?? 1) - 1) * 50} XP
                </span>
              </div>
            )}
            
            <button 
              onClick={() => { playSelect(); setView('shop'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'shop' ? 'bg-yellow-500/20 text-yellow-500 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Tienda
            </button>
            <button 
              onClick={() => { playSelect(); setView('album'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'album' ? 'bg-yellow-500/20 text-yellow-500 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Mi Álbum
            </button>
            <button 
              onClick={() => { playSelect(); setView('mural'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'mural' ? 'bg-yellow-500/20 text-yellow-500 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Mural
            </button>
            <button 
              onClick={() => { playSelect(); setView('trades'); setIsMobileMenuOpen(false); }} 
              className={`px-4 py-2 rounded-lg text-left transition-colors ${
                view === 'trades' ? 'bg-yellow-500/20 text-yellow-500 font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              Intercambios
            </button>
          </div>
        )}
      </nav>

      <main className="container mx-auto p-4 animate-fadeIn">
        {view === 'shop' 
          ? <Shop /> 
          : view === 'album' 
            ? <Album /> 
            : view === 'mural' 
              ? <Mural /> 
              : <Trades />
        }
      </main>
    </div>
  );
}