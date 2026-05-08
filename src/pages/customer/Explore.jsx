import React, { useState, useEffect } from 'react';
import { MapPin, Search, Filter, Navigation, ArrowRight, Loader2, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { calculateDistance } from '../../lib/utils';

const CATEGORIES = [
  "Todos",
  "Gastronomia",
  "Beleza & Estética",
  "Saúde & Bem-estar",
  "Moda & Acessórios",
  "Tecnologia",
  "Automotivo",
  "Pet Shop",
  "Educação",
  "Serviços",
  "Outros"
];

export default function Explore() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStores();
    
    // Tentar usar as coordenadas do perfil primeiro (mais rápido e persistente)
    if (profile?.latitude && profile?.longitude) {
      setUserCoords({ 
        lat: parseFloat(profile.latitude), 
        lng: parseFloat(profile.longitude) 
      });
    } else {
      requestLocation();
    }
  }, [profile]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocLoading(false);
        },
        (err) => {
          setLocLoading(false);
        }
      );
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('settings_completed', true)
        .in('subscription_status', ['ACTIVE', 'TRIAL']);

      if (error) throw error;
      setStores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores
    .filter(s => {
      const matchesFilter = filter === "Todos" || s.category === filter;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    })
    .map(s => ({
      ...s,
      distance: userCoords ? calculateDistance(userCoords.lat, userCoords.lng, s.latitude, s.longitude) : null
    }))
    .sort((a, b) => (a.distance || 9999) - (b.distance || 9999));

  return (
    <div className="space-y-8">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Explorar Parceiros</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Descubra novos lugares para ganhar moedas</p>
        </div>
        <button 
          onClick={requestLocation} 
          className={`w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center transition-colors ${locLoading ? 'text-brand-yellow animate-pulse bg-brand-yellow/10' : 'text-slate-500 hover:text-white bg-slate-800/50'}`}
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou categoria..."
            className="w-full bg-brand-surface border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-brand-yellow outline-none transition-all placeholder:text-slate-700 shadow-xl"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filter === cat ? 'bg-brand-yellow text-brand-bg shadow-glow-yellow' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Store List */}
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-brand-yellow mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Localizando parceiros...</p>
          </div>
        ) : filteredStores.length > 0 ? (
          filteredStores.map((store, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={store.id}
              onClick={() => navigate(`/loja/${store.id}`)}
              className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-6 flex items-center gap-5 group hover:border-brand-yellow/30 transition-all cursor-pointer relative overflow-hidden active:scale-95 shadow-xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-brand-yellow/10 transition-colors"></div>
              
              <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-brand-yellow font-black text-xl">{store.name.charAt(0)}</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-white truncate leading-tight tracking-tight italic">{store.name}</h3>
                <div className="flex items-center space-x-3 mt-1">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{store.category || 'Varejo'}</p>
                   {store.distance && (
                     <div className="flex items-center text-brand-yellow text-[10px] font-black">
                       <Navigation className="w-3 h-3 mr-1 fill-brand-yellow" />
                       {store.distance} km
                     </div>
                   )}
                </div>
                
                <div className="mt-3 flex items-center">
                  <div className="px-3 py-1 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full">
                    <p className="text-brand-yellow text-[8px] font-black uppercase tracking-widest">
                      {store.cashback_percent}% Cashback
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-brand-yellow group-hover:text-brand-bg transition-all shadow-xl border border-slate-800">
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20">
             <MapPin className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
             <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">Nenhum parceiro encontrado.</p>
          </div>
        )}
      </div>

      {/* Floating Info for non-logged users */}
      {!user && (
        <div className="fixed bottom-10 left-6 right-6 z-50">
          <div className="bg-brand-yellow p-6 rounded-[2rem] shadow-glow-yellow flex items-center justify-between">
            <div className="text-brand-bg">
              <p className="font-black text-xs uppercase tracking-widest italic">Ainda não é membro?</p>
              <p className="text-[9px] font-bold opacity-80 uppercase leading-tight mt-1">Cadastre-se e comece a ganhar!</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="bg-brand-bg text-brand-yellow px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
            >
              Criar Conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
