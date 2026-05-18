import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Shop from './pages/Shop';
import Album from './pages/Album';
import Mural from './pages/Mural';
import api from './services/api';
import { getLevelTextStyle } from './constants/levels';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const updateUserStats = useAuthStore((s) => s.updateUserStats);
  const [view, setView] = useState<'shop' | 'album' | 'mural'>('shop');

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
      <nav className="bg-gray-800/50 backdrop-blur-md sticky top-0 z-50 p-4 flex justify-between items-center border-b border-white/10 shadow-2xl">
        <div className="flex gap-4">
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
          <button 
            onClick={() => { playSelect(); logout(); }} 
            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-4 animate-fadeIn">
        {view === 'shop' ? <Shop /> : view === 'album' ? <Album /> : <Mural />}
      </main>
    </div>
  );
}