import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Star, Clock, ChevronRight, Loader2, Wallet as WalletIcon, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateDistance } from '../../lib/utils';

export default function Wallet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMyCards();
      requestLocation();
    }
  }, [user]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn("Localização negada ou indisponível")
      );
    }
  };

  const fetchMyCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select(`
          id,
          stamps_accumulated,
          last_activity,
          stores!inner (
            id,
            name,
            category,
            logo_url,
            latitude,
            longitude,
            subscription_status,
            rewards (points_needed)
          )
        `)
        .eq('customer_id', user.id)
        .in('stores.subscription_status', ['ACTIVE', 'TRIAL'])
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-yellow space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Sincronizando Carteira...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Meus Cartões</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Você tem {cards.length} cartões ativos</p>
        </div>
      </div>

      {/* Meus Cartões (Listagem Real) */}
      <div className="grid grid-cols-1 gap-6">
        {cards.map((card, index) => {
          const distance = calculateDistance(
            userCoords?.lat, userCoords?.lng,
            card.stores?.latitude, card.stores?.longitude
          );

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/carteira/${card.id}`)}
              className="group relative bg-brand-surface border border-slate-800 rounded-3xl p-5 overflow-hidden active:scale-95 transition-transform cursor-pointer shadow-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-yellow/10 transition-colors"></div>

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-black rounded-2xl p-2 border border-slate-800 flex items-center justify-center overflow-hidden">
                    {card.stores?.logo_url ? (
                      <img src={card.stores.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-brand-yellow/10 flex items-center justify-center text-brand-yellow font-bold text-xl">
                        {card.stores?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">{card.stores?.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[9px] text-brand-yellow font-bold uppercase tracking-widest bg-brand-yellow/10 px-2 py-0.5 rounded-md">
                        {card.stores?.category || 'Loja'}
                      </span>
                      {distance && (
                        <span className="flex items-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                          <Navigation className="w-2.5 h-2.5 mr-1 text-brand-yellow fill-brand-yellow" />
                          {distance} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-brand-yellow leading-none">{card.stamps_accumulated}</div>
                  <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mt-1">Moedas Z</div>
                </div>
              </div>

              <div className="mt-6 space-y-2 relative z-10">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Falta pouco para o próximo prêmio</span>
                  <span className="text-white">
                    {(() => {
                      const minRewardPoints = card.stores?.rewards?.length > 0 
                        ? Math.min(...card.stores.rewards.map(r => r.points_needed)) 
                        : 10;
                      return Math.min(Math.round((card.stamps_accumulated / minRewardPoints) * 100), 100);
                    })()}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-slate-900">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(() => {
                        const minRewardPoints = card.stores?.rewards?.length > 0 
                          ? Math.min(...card.stores.rewards.map(r => r.points_needed)) 
                          : 10;
                        return Math.min(Math.round((card.stamps_accumulated / minRewardPoints) * 100), 100);
                      })()}%` 
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-yellow to-yellow-500 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                  ></motion.div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1 text-brand-yellow" />
                  Atividade: {new Date(card.last_activity).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center text-brand-yellow group-hover:translate-x-1 transition-transform italic">
                  Ver Carteira <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </motion.div>
          );
        })}

        {cards.length === 0 && (
          <div className="py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center mx-auto border border-slate-800">
              <WalletIcon className="w-10 h-10 text-slate-700" />
            </div>
            <div>
              <p className="text-white font-bold">Sua carteira está vazia</p>
              <p className="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">Escaneie o QR Code em um estabelecimento parceiro para começar.</p>
            </div>
            <button 
              onClick={() => navigate('/escanear')}
              className="px-8 py-3 bg-brand-yellow text-brand-bg rounded-full font-bold uppercase text-xs tracking-widest shadow-glow-yellow"
            >
              Escanear Agora
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
