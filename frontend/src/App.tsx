import React, { useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Shop from './pages/Shop';
import Album from './pages/Album';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [view, setView] = useState<'shop' | 'album'>('shop');

  const playSelect = () => {
    const audio = new Audio('/sounds/select.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

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
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Rango</span>
            <span className="text-sm font-medium text-yellow-500/80">Entrenador Pro</span>
          </div>
          <button 
            onClick={() => { playSelect(); logout(); }} 
            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-4 animate-fadeIn">
        {view === 'shop' ? <Shop /> : <Album />}
      </main>
    </div>
  );
}