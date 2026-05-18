import React, { useEffect, useState, useMemo, useRef } from 'react';
import api from '../services/api';
import { rarityStyles } from '../constants/rarities';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  id: string;
  name: string;
  rarity: string;
  imageUrl: string;
  expansion: string;
}

interface Trade {
  _id: string;
  senderId: string;
  senderUsername: string;
  receiverId?: string;
  receiverUsername?: string;
  senderCardId: string;
  senderCardData: Card;
  receiverCardId: string;
  receiverCardData: Card;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

const EXPANSIONS_LIST = [ 
  { id: 'swsh12', name: 'SILVER TEMPEST' },
  { id: '', name: 'Todas las expansiones' },
  { id: 'sm3', name: 'BURNING SHADOWS' },
  { id: 'dp6', name: 'Legends Awakened' },
  { id: 'bw9', name: 'Plasma Blast' },
  { id: 'xyp', name: 'XY Black Star Promos' },
  { id: 'zsv10pt5', name: 'BLACK BOLT' }
];

const RARITIES_LIST = [
  { id: '', name: 'Todas las rarezas' },
  { id: 'common', name: 'Common' },
  { id: 'uncommon', name: 'Uncommon' },
  { id: 'rare', name: 'Rare' },
  { id: 'holographic', name: 'Holographic' },
  { id: 'ultra-rare', name: 'Ultra Rare' },
  { id: 'shiny', name: 'Shiny' },
  { id: 'secret', name: 'Secret' },
  { id: 'super-secret', name: 'Super Secret' },
  { id: 'ultra-secret', name: 'Ultra Secret' }
];

export default function Trades() {
  const user = useAuthStore((s) => s.user);
  const updatePacksAvailable = useAuthStore((s) => s.updatePacksAvailable);

  const [activeTab, setActiveTab] = useState<'public' | 'direct' | 'my-offers'>('public');
  const [offersTab, setOffersTab] = useState<'received' | 'sent'>('received');

  const tradesMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/sounds/trades-music.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    tradesMusicRef.current = audio;
    audio.play().catch((err) => console.log('Autoplay blocked:', err));

    return () => {
      if (tradesMusicRef.current) {
        tradesMusicRef.current.pause();
        tradesMusicRef.current = null;
      }
    };
  }, []);
  
  // Datos
  const [publicTrades, setPublicTrades] = useState<Trade[]>([]);
  const [myOffers, setMyOffers] = useState<{ received: Trade[]; sent: Trade[] }>({ received: [], sent: [] });
  const [userAlbum, setUserAlbum] = useState<any[]>([]);
  
  // Estados de carga e interfaz
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filtros Tablón Público
  const [publicFilters, setPublicFilters] = useState({ expansion: '', rarity: '', search: '' });

  // Modo A (Buscador & Propuestas Directas)
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardSearchResults, setCardSearchResults] = useState<Card[]>([]);
  const [selectedCardForDirect, setSelectedCardForDirect] = useState<Card | null>(null);
  const [usersWithDuplicate, setUsersWithDuplicate] = useState<{ userId: string; username: string }[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  
  // Wizard de Propuesta
  const [selectedReceiver, setSelectedReceiver] = useState<{ userId: string; username: string } | null>(null);
  const [selectedOfferCard, setSelectedOfferCard] = useState<any | null>(null);
  const [isPublicProposal, setIsPublicProposal] = useState(false);
  const [offerSearchQuery, setOfferSearchQuery] = useState('');

  // Auxiliares de Sonidos
  const playSfx = (path: string) => {
    const audio = new Audio(path);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Cargar datos al montar y al cambiar de pestaña
  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  // Carga reactiva de filtros en el tablón
  useEffect(() => {
    if (activeTab === 'public') {
      fetchPublicTrades();
    }
  }, [publicFilters]);

  // Buscar cartas reactivamente al escribir en Modo A
  useEffect(() => {
    if (cardSearchQuery.trim().length < 2) {
      setCardSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api.get(`/trades/search-cards?query=${encodeURIComponent(cardSearchQuery)}`)
        .then((res) => setCardSearchResults(res.data))
        .catch((err) => console.error("Error buscando cartas:", err));
    }, 300);

    return () => clearTimeout(timer);
  }, [cardSearchQuery]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Obtener álbum del propio usuario
      const albumRes = await api.get('/user/album');
      setUserAlbum(albumRes.data.album || []);

      if (activeTab === 'public') {
        await fetchPublicTrades();
      } else if (activeTab === 'my-offers') {
        const offersRes = await api.get('/trades/my-offers');
        setMyOffers(offersRes.data);
      }
    } catch (err) {
      console.error("Error cargando datos de intercambios:", err);
      showToast("⚠️ Error al sincronizar datos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicTrades = async () => {
    try {
      const { expansion, rarity, search } = publicFilters;
      let url = `/trades/public?`;
      if (expansion) url += `expansion=${expansion}&`;
      if (rarity) url += `rarity=${rarity}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      setPublicTrades(res.data);
    } catch (err) {
      console.error("Error cargando tablón público:", err);
    }
  };

  // Modo A: Buscar usuarios con la carta repetida
  const handleSelectCardForDirect = async (card: Card) => {
    playSfx('/sounds/select.mp3');
    setSelectedCardForDirect(card);
    setUsersWithDuplicate([]);
    setLoadingDuplicates(true);
    try {
      const res = await api.get(`/trades/users-with-duplicate/${card.id}`);
      setUsersWithDuplicate(res.data);
    } catch (err) {
      console.error("Error buscando duplicados:", err);
      showToast("⚠️ Error al buscar coleccionistas.");
    } finally {
      setLoadingDuplicates(false);
    }
  };

  // Crear propuesta de intercambio (Público o Directo)
  const handleSendProposal = async () => {
    if (!selectedOfferCard || (!selectedCardForDirect && !isPublicProposal)) return;
    setActionLoading(true);
    try {
      playSfx('/sounds/select.mp3');
      const payload = {
        receiverId: isPublicProposal ? undefined : selectedReceiver?.userId,
        senderCardId: selectedOfferCard.card.id,
        receiverCardId: selectedCardForDirect?.id
      };

      await api.post('/trades/propose', payload);
      
      playSfx('/sounds/shiny-pull.mp3');
      showToast("🎉 ¡Propuesta de intercambio publicada!");
      
      // Resetear estados del asistente
      setSelectedReceiver(null);
      setSelectedCardForDirect(null);
      setSelectedOfferCard(null);
      setCardSearchQuery('');
      setIsPublicProposal(false);
      
      // Mover a la vista de mis ofertas
      setActiveTab('my-offers');
      setOffersTab('sent');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Error al enviar la propuesta.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Aceptar propuesta (Atómico)
  const handleAcceptTrade = async (tradeId: string) => {
    setActionLoading(true);
    try {
      playSfx('/sounds/select.mp3');
      const res = await api.post(`/trades/${tradeId}/accept`);
      
      playSfx('/sounds/shiny-pull.mp3');
      showToast("🎉 ¡Intercambio completado con éxito!");
      
      // Recargar datos
      await fetchInitialData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Error al aceptar el intercambio.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar o Cancelar propuesta
  const handleRejectOrCancelTrade = async (tradeId: string) => {
    setActionLoading(true);
    try {
      playSfx('/sounds/select.mp3');
      await api.post(`/trades/${tradeId}/reject`);
      showToast("🗑️ Intercambio cancelado/rechazado.");
      await fetchInitialData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Error al procesar la acción.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper para validar si el usuario activo tiene la carta requerida por un intercambio público
  const hasRequestedCard = (requestedCardId: string) => {
    const entry = userAlbum.find(e => String(e.card.id).trim() === String(requestedCardId).trim());
    return entry && entry.quantity >= 1;
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-2">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-md">
            Centro de Intercambios
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
            Cambia tus cartas duplicadas con la comunidad Pokémon
          </p>
        </div>

        {/* Pestanas de Navegacion */}
        <div className="flex bg-black/40 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
          <button
            onClick={() => { playSfx('/sounds/select.mp3'); setActiveTab('public'); }}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'public'
                ? 'bg-yellow-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tablón Público
          </button>
          <button
            onClick={() => { playSfx('/sounds/select.mp3'); setActiveTab('direct'); }}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'direct'
                ? 'bg-yellow-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Buscar Coleccionistas
          </button>
          <button
            onClick={() => { playSfx('/sounds/select.mp3'); setActiveTab('my-offers'); }}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'my-offers'
                ? 'bg-yellow-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mis Ofertas
          </button>
        </div>
      </div>

      {/* VISTA A: TABLÓN PÚBLICO */}
      {activeTab === 'public' && (
        <div className="space-y-6">
          {/* Panel de Filtros */}
          <div className="bg-black/30 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
            
            {/* Buscador de Cartas */}
            <div className="w-full md:w-1/3 relative">
              <input
                type="text"
                placeholder="Buscar por nombre de carta..."
                value={publicFilters.search}
                onChange={(e) => setPublicFilters({ ...publicFilters, search: e.target.value })}
                className="w-full bg-gray-950/70 border border-white/10 p-3 px-4 rounded-xl text-xs font-bold focus:border-yellow-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Selector de Expansión */}
            <select
              value={publicFilters.expansion}
              onChange={(e) => setPublicFilters({ ...publicFilters, expansion: e.target.value })}
              className="w-full md:w-1/4 bg-gray-950/70 border border-white/10 p-3 px-4 rounded-xl text-xs font-bold focus:border-yellow-500 focus:outline-none transition-colors text-white"
            >
              {EXPANSIONS_LIST.map((exp) => (
                <option key={exp.id} value={exp.id} className="bg-gray-950">{exp.name}</option>
              ))}
            </select>

            {/* Selector de Rareza */}
            <select
              value={publicFilters.rarity}
              onChange={(e) => setPublicFilters({ ...publicFilters, rarity: e.target.value })}
              className="w-full md:w-1/4 bg-gray-950/70 border border-white/10 p-3 px-4 rounded-xl text-xs font-bold focus:border-yellow-500 focus:outline-none transition-colors text-white"
            >
              {RARITIES_LIST.map((rarity) => (
                <option key={rarity.id} value={rarity.id} className="bg-gray-950">{rarity.name}</option>
              ))}
            </select>

            {/* Botón publicar en tablón */}
            <button
              onClick={() => { playSfx('/sounds/select.mp3'); setIsPublicProposal(true); setSelectedCardForDirect(null); }}
              className="w-full md:w-auto ml-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 border border-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              + Publicar Oferta
            </button>
          </div>

          {/* Listado de Ofertas Públicas */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-white/20 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : publicTrades.length === 0 ? (
            <div className="text-center py-20 bg-black/20 border border-white/5 rounded-2xl">
              <span className="text-3xl">🎴</span>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-3">
                No hay ofertas públicas activas con estos filtros
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {publicTrades.map((trade) => {
                const canAccept = hasRequestedCard(trade.receiverCardId);
                const sStyle = rarityStyles[trade.senderCardData.rarity.toLowerCase()] || rarityStyles.common;
                const rStyle = rarityStyles[trade.receiverCardData.rarity.toLowerCase()] || rarityStyles.common;

                return (
                  <motion.div
                    key={trade._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/35 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-4 shadow-xl hover:border-white/10 transition-colors"
                  >
                    
                    {/* Encabezado del Anuncio */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gray-500">Ofrecido por:</span>
                        <span className="text-xs font-black text-yellow-500">{trade.senderUsername}</span>
                      </div>
                      <span className="text-[9px] text-gray-600 font-bold uppercase">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Comparador de Cartas (Ofrece / Busca) */}
                    <div className="flex items-center justify-between gap-2 py-2">
                      {/* Carta Ofrecida */}
                      <div className="flex items-center gap-3 w-[45%]">
                        <div className="w-16 aspect-[2/3] shrink-0 border rounded-md overflow-hidden relative border-white/10 bg-gray-950">
                          <img src={trade.senderCardData.imageUrl} alt={trade.senderCardData.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider block mb-0.5">Te Ofrece</span>
                          <h4 className="text-xs font-black text-white truncate">{trade.senderCardData.name}</h4>
                          <span className={`text-[7px] font-black uppercase inline-block mt-1 px-2 py-0.5 rounded-full bg-black/60 border ${sStyle.border} ${sStyle.text}`}>
                            {trade.senderCardData.rarity}
                          </span>
                        </div>
                      </div>

                      {/* Flecha de Intercambio */}
                      <div className="text-xl text-gray-600 font-black shrink-0">➡️</div>

                      {/* Carta Solicitada */}
                      <div className="flex items-center justify-end gap-3 w-[45%] text-right">
                        <div className="overflow-hidden">
                          <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider block mb-0.5">Te Pide</span>
                          <h4 className="text-xs font-black text-white truncate">{trade.receiverCardData.name}</h4>
                          <span className={`text-[7px] font-black uppercase inline-block mt-1 px-2 py-0.5 rounded-full bg-black/60 border ${rStyle.border} ${rStyle.text}`}>
                            {trade.receiverCardData.rarity}
                          </span>
                        </div>
                        <div className="w-16 aspect-[2/3] shrink-0 border rounded-md overflow-hidden relative border-white/10 bg-gray-950">
                          <img src={trade.receiverCardData.imageUrl} alt={trade.receiverCardData.name} className="w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>

                    {/* Botón de Acción */}
                    <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">
                        {canAccept ? "⚡ Tienes esta carta disponible" : "🔒 No tienes esta carta"}
                      </span>

                      <button
                        onClick={() => handleAcceptTrade(trade._id)}
                        disabled={actionLoading || !canAccept}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          canAccept
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95'
                            : 'bg-gray-800/40 text-gray-600 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        {actionLoading ? "Aceptando..." : "Completar Trato"}
                      </button>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA B: BÚSQUEDA DE COLECCIONISTAS (Modo A) */}
      {activeTab === 'direct' && (
        <div className="space-y-6">
          <div className="bg-black/35 backdrop-blur-xl border border-white/5 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-yellow-500 mb-2">
              1. Busca la carta que quieres obtener
            </h3>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el nombre del pokémon (ej: Charizard, Giratina, Thundurus...)"
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                className="w-full bg-gray-950/70 border border-white/10 p-4 px-5 rounded-xl text-xs font-bold focus:border-yellow-500 focus:outline-none transition-colors"
              />

              {/* Autocomplete de Resultados */}
              <AnimatePresence>
                {cardSearchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-gray-950 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-72 overflow-y-auto"
                  >
                    {cardSearchResults.map((card) => {
                      const style = rarityStyles[card.rarity.toLowerCase()] || rarityStyles.common;
                      return (
                        <div
                          key={card.id}
                          onClick={() => {
                            setCardSearchQuery('');
                            setCardSearchResults([]);
                            handleSelectCardForDirect(card);
                          }}
                          className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors"
                        >
                          <div className="w-10 aspect-[2/3] shrink-0 border rounded overflow-hidden border-white/10 bg-black">
                            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white">{card.name}</h4>
                            <div className="flex gap-1.5 mt-0.5">
                              <span className={`text-[7px] font-black uppercase inline-block px-2 py-0.5 rounded-full bg-black/60 border ${style.border} ${style.text}`}>
                                {card.rarity}
                              </span>
                              <span className="text-[7px] font-black uppercase inline-block px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                                {EXPANSIONS_LIST.find(e => e.id === card.expansion)?.name || card.expansion?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Carta Seleccionada & Resultados de Coleccionistas */}
          {selectedCardForDirect && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              
              {/* Carta Buscada */}
              <div className="bg-black/35 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-between text-center min-h-[350px]">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 block mb-1">Carta Solicitada</span>
                  <h4 className="text-sm font-black text-white">{selectedCardForDirect.name}</h4>
                </div>
                
                <div className="w-36 aspect-[2/3] my-4 border-2 rounded-xl overflow-hidden relative shadow-2xl border-white/10 bg-gray-950">
                  <img src={selectedCardForDirect.imageUrl} alt={selectedCardForDirect.name} className="w-full h-full object-contain" />
                </div>

                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">
                  Buscando coleccionistas con copias duplicadas
                </span>
              </div>

              {/* Coleccionistas Encontrados */}
              <div className="bg-black/35 backdrop-blur-xl border border-white/5 p-6 rounded-2xl md:col-span-2 flex flex-col">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b border-white/5">
                  Coleccionistas que tienen esta carta repetida
                </h4>

                {loadingDuplicates ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="w-6 h-6 border-3 border-white/20 border-t-yellow-500 rounded-full animate-spin" />
                  </div>
                ) : usersWithDuplicate.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                    <span className="text-2xl mb-2">🔍</span>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Ningún coleccionista tiene esta carta repetida actualmente
                    </p>
                    <button
                      onClick={() => { setIsPublicProposal(true); setSelectedReceiver(null); }}
                      className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black uppercase rounded-lg shadow transition-all"
                    >
                      Publicar como oferta abierta en el tablón
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {usersWithDuplicate.map((u) => (
                      <div
                        key={u.userId}
                        className="bg-gray-950/60 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center text-black font-black text-xs uppercase shadow">
                            {u.username[0]}
                          </div>
                          <span className="text-xs font-black text-white">{u.username}</span>
                        </div>

                        <button
                          onClick={() => { playSfx('/sounds/select.mp3'); setSelectedReceiver(u); }}
                          className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-black uppercase tracking-wider rounded-lg shadow transition-all active:scale-95"
                        >
                          Proponer Trato
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </div>
      )}

      {/* VISTA C: MIS OFERTAS */}
      {activeTab === 'my-offers' && (
        <div className="space-y-6">
          
          {/* Sub-Tabs: Recibidas / Enviadas */}
          <div className="flex gap-4 border-b border-white/5 pb-4">
            <button
              onClick={() => { playSfx('/sounds/select.mp3'); setOffersTab('received'); }}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                offersTab === 'received'
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Ofertas Recibidas ({myOffers.received.length})
            </button>
            <button
              onClick={() => { playSfx('/sounds/select.mp3'); setOffersTab('sent'); }}
              className={`pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                offersTab === 'sent'
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Ofertas Enviadas ({myOffers.sent.length})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-white/20 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : offersTab === 'received' ? (
            myOffers.received.length === 0 ? (
              <div className="text-center py-20 bg-black/20 border border-white/5 rounded-2xl">
                <span className="text-2xl">📥</span>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-3">
                  No tienes propuestas de intercambio pendientes
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myOffers.received.map((trade) => {
                  const sStyle = rarityStyles[trade.senderCardData.rarity.toLowerCase()] || rarityStyles.common;
                  const rStyle = rarityStyles[trade.receiverCardData.rarity.toLowerCase()] || rarityStyles.common;
                  return (
                    <motion.div
                      key={trade._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/35 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-4 shadow-xl"
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs font-black text-yellow-500">{trade.senderUsername} te propone:</span>
                        <span className="text-[9px] text-gray-600 font-bold uppercase">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 py-2">
                        {/* Carta Ofrecida */}
                        <div className="flex items-center gap-3 w-[45%]">
                          <div className="w-14 aspect-[2/3] shrink-0 border rounded overflow-hidden border-white/10 bg-gray-950">
                            <img src={trade.senderCardData.imageUrl} alt={trade.senderCardData.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-[7px] font-black uppercase text-emerald-400 block mb-0.5">Te regala</span>
                            <h4 className="text-xs font-black text-white truncate">{trade.senderCardData.name}</h4>
                            <span className={`text-[6px] font-black uppercase inline-block px-1.5 py-0.5 rounded-full bg-black/60 border ${sStyle.border} ${sStyle.text}`}>
                              {trade.senderCardData.rarity}
                            </span>
                          </div>
                        </div>

                        <div className="text-lg text-gray-600 shrink-0 font-bold">➡️</div>

                        {/* Carta Solicitada */}
                        <div className="flex items-center justify-end gap-3 w-[45%] text-right">
                          <div className="overflow-hidden">
                            <span className="text-[7px] font-black uppercase text-amber-400 block mb-0.5">A cambio de tu</span>
                            <h4 className="text-xs font-black text-white truncate">{trade.receiverCardData.name}</h4>
                            <span className={`text-[6px] font-black uppercase inline-block px-1.5 py-0.5 rounded-full bg-black/60 border ${rStyle.border} ${rStyle.text}`}>
                              {trade.receiverCardData.rarity}
                            </span>
                          </div>
                          <div className="w-14 aspect-[2/3] shrink-0 border rounded overflow-hidden border-white/10 bg-gray-950">
                            <img src={trade.receiverCardData.imageUrl} alt={trade.receiverCardData.name} className="w-full h-full object-contain" />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex gap-3 ml-auto">
                        <button
                          onClick={() => handleRejectOrCancelTrade(trade._id)}
                          disabled={actionLoading}
                          className="px-5 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAcceptTrade(trade._id)}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow"
                        >
                          Aceptar trato
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )
          ) : (
            myOffers.sent.length === 0 ? (
              <div className="text-center py-20 bg-black/20 border border-white/5 rounded-2xl">
                <span className="text-2xl">📤</span>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-3">
                  No has enviado ninguna propuesta de intercambio pendiente
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myOffers.sent.map((trade) => {
                  const sStyle = rarityStyles[trade.senderCardData.rarity.toLowerCase()] || rarityStyles.common;
                  const rStyle = rarityStyles[trade.receiverCardData.rarity.toLowerCase()] || rarityStyles.common;
                  return (
                    <motion.div
                      key={trade._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/35 backdrop-blur-xl border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-4 shadow-xl"
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs font-black text-gray-400">
                          {trade.receiverId 
                            ? `Propuesta directa enviada a: ${trade.receiverUsername}` 
                            : 'Anuncio publicado en el Tablón Público'
                          }
                        </span>
                        <span className="text-[9px] text-gray-600 font-bold uppercase">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 py-2">
                        {/* Carta Ofrecida */}
                        <div className="flex items-center gap-3 w-[45%]">
                          <div className="w-14 aspect-[2/3] shrink-0 border rounded overflow-hidden border-white/10 bg-gray-950">
                            <img src={trade.senderCardData.imageUrl} alt={trade.senderCardData.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-[7px] font-black uppercase text-emerald-400 block mb-0.5 font-bold">Ofreces</span>
                            <h4 className="text-xs font-black text-white truncate">{trade.senderCardData.name}</h4>
                            <span className={`text-[6px] font-black uppercase inline-block px-1.5 py-0.5 rounded-full bg-black/60 border ${sStyle.border} ${sStyle.text}`}>
                              {trade.senderCardData.rarity}
                            </span>
                          </div>
                        </div>

                        <div className="text-lg text-gray-600 shrink-0 font-bold">➡️</div>

                        {/* Carta Solicitada */}
                        <div className="flex items-center justify-end gap-3 w-[45%] text-right">
                          <div className="overflow-hidden">
                            <span className="text-[7px] font-black uppercase text-amber-400 block mb-0.5 font-bold">Buscas</span>
                            <h4 className="text-xs font-black text-white truncate">{trade.receiverCardData.name}</h4>
                            <span className={`text-[6px] font-black uppercase inline-block px-1.5 py-0.5 rounded-full bg-black/60 border ${rStyle.border} ${rStyle.text}`}>
                              {trade.receiverCardData.rarity}
                            </span>
                          </div>
                          <div className="w-14 aspect-[2/3] shrink-0 border rounded overflow-hidden border-white/10 bg-gray-950">
                            <img src={trade.receiverCardData.imageUrl} alt={trade.receiverCardData.name} className="w-full h-full object-contain" />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex ml-auto">
                        <button
                          onClick={() => handleRejectOrCancelTrade(trade._id)}
                          disabled={actionLoading}
                          className="px-5 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Cancelar Oferta
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* WIZARD DE PROPUESTA (MODAL OVERLAY) */}
      <AnimatePresence>
        {(selectedReceiver || isPublicProposal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Botón cerrar */}
              <button
                onClick={() => {
                  playSfx('/sounds/select.mp3');
                  setSelectedReceiver(null);
                  setIsPublicProposal(false);
                  setOfferSearchQuery('');
                }}
                className="absolute right-4 top-4 text-gray-500 hover:text-white font-black uppercase tracking-wider text-xs"
              >
                ✕ Cerrar
              </button>

              {/* Título */}
              <div className="border-b border-white/10 pb-3 mb-4">
                <h3 className="text-base font-black uppercase tracking-wider text-yellow-500">
                  {isPublicProposal 
                    ? "Crear propuesta para el tablón público" 
                    : `Proponer intercambio directo a: ${selectedReceiver?.username}`
                  }
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                  Elige qué carta de tu colección vas a ofrecer para este trato
                </p>
              </div>

              {/* Buscador de cartas a ofrecer */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Buscar carta para ofrecer por nombre..."
                  value={offerSearchQuery}
                  onChange={(e) => setOfferSearchQuery(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 p-2.5 px-4 rounded-xl text-xs font-bold focus:border-yellow-500 focus:outline-none transition-colors text-white"
                />
              </div>

              {/* Grid de Cartas Disponibles para Ofrecer */}
              <div className="flex-1 overflow-y-auto min-h-[300px] pr-2 space-y-4">
                {userAlbum.filter(entry => entry.card.name.toLowerCase().includes(offerSearchQuery.toLowerCase())).length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <p className="text-xs font-bold uppercase tracking-wider">No se encontraron cartas en tu álbum</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {userAlbum
                      .filter(entry => entry.card.name.toLowerCase().includes(offerSearchQuery.toLowerCase()))
                      .map((entry) => {
                        const card = entry.card;
                        const quantity = entry.quantity;
                        const style = rarityStyles[card.rarity.toLowerCase()] || rarityStyles.common;
                        const isSelected = selectedOfferCard?.card.id === card.id;

                        return (
                          <div
                            key={card.id}
                            onClick={() => { playSfx('/sounds/select.mp3'); setSelectedOfferCard(entry); }}
                            className={`relative aspect-[2/3] p-2 border-2 rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                              isSelected
                                ? 'border-yellow-500 bg-yellow-500/10 scale-105 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                                : 'border-white/5 hover:border-white/20 bg-black/40'
                            }`}
                          >
                            {/* Insignia de Cantidad */}
                            <span className="absolute top-1 right-1 px-2 py-0.5 rounded-full bg-black/80 text-[7px] font-black text-white uppercase border border-white/10 z-20">
                              x{quantity}
                            </span>

                            <div className="w-full aspect-[2/3] rounded overflow-hidden bg-black/60 relative border border-white/5">
                              <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain" />
                            </div>

                            <div className="mt-2 text-center">
                              <h4 className="text-[10px] font-black text-white truncate">{card.name}</h4>
                              <div className="flex flex-wrap justify-center gap-1 mt-1">
                                <span className={`text-[6px] font-black uppercase inline-block px-1.5 py-0.5 rounded-full bg-black/60 border ${style.border} ${style.text}`}>
                                  {card.rarity}
                                </span>
                                <span className="text-[6px] font-black uppercase inline-block px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                                  {EXPANSIONS_LIST.find(e => e.id === card.expansion)?.name || card.expansion?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Pie de Pantalla con Selección & Botón Enviar */}
              <div className="border-t border-white/10 pt-4 mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                
                {/* Resumen */}
                <div className="text-center sm:text-left">
                  {selectedOfferCard ? (
                    <div>
                      <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">Vas a ofrecer:</span>
                      <h4 className="text-xs font-black text-white">{selectedOfferCard.card.name}</h4>
                      {selectedOfferCard.quantity === 1 && (
                        <span className="text-[8px] text-red-400 font-bold block mt-0.5">
                          ⚠️ Nota: Te quedarás con 0 copias de esta carta
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      ⚠️ Selecciona una carta de arriba para continuar
                    </span>
                  )}
                </div>

                {/* Si es público, necesitamos seleccionar también la carta pedida en el asistente */}
                {isPublicProposal && !selectedCardForDirect && (
                  <div className="w-full sm:w-auto relative min-w-[240px]">
                    <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider block mb-1">Carta que buscas a cambio:</span>
                    <input
                      type="text"
                      placeholder="Escribe el pokémon que buscas..."
                      value={cardSearchQuery}
                      onChange={(e) => setCardSearchQuery(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2.5 px-4 rounded-xl text-xs font-bold focus:border-yellow-500 focus:outline-none transition-colors"
                    />

                    {/* Autocomplete en asistente público */}
                    <AnimatePresence>
                      {cardSearchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 right-0 bottom-full mb-2 bg-gray-950 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl max-h-48 overflow-y-auto"
                        >
                          {cardSearchResults.map((card) => (
                            <div
                              key={card.id}
                              onClick={() => {
                                setCardSearchQuery('');
                                setCardSearchResults([]);
                                setSelectedCardForDirect(card);
                              }}
                              className="p-2.5 hover:bg-white/5 cursor-pointer text-xs font-black text-white border-b border-white/5 truncate"
                            >
                              {card.name} <span className="text-gray-400 font-bold ml-1">({card.rarity}) - {EXPANSIONS_LIST.find(e => e.id === card.expansion)?.name || card.expansion?.toUpperCase()}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {isPublicProposal && selectedCardForDirect && (
                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider">Carta buscada:</span>
                    <h4 className="text-xs font-black text-white">{selectedCardForDirect.name}</h4>
                    <button
                      onClick={() => setSelectedCardForDirect(null)}
                      className="text-[8px] text-gray-500 hover:text-red-400 font-bold block mt-0.5 underline"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* Botón Acción Principal */}
                <button
                  onClick={handleSendProposal}
                  disabled={actionLoading || !selectedOfferCard || (!selectedCardForDirect && !isPublicProposal)}
                  className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                    selectedOfferCard && (selectedCardForDirect || (isPublicProposal && selectedCardForDirect))
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/10 hover:scale-[1.02] active:scale-95'
                      : 'bg-gray-800/40 text-gray-600 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {actionLoading ? "Procesando..." : "Publicar Intercambio"}
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-4 px-6 rounded-2xl border text-xs font-black uppercase tracking-wider backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] ${
              toastMsg.startsWith('⚠️')
                ? 'bg-red-950/80 border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
            }`}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
