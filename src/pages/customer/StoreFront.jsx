import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Star, Gift, ChevronRight, Award, Loader2, QrCode, X, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function StoreFront() {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const isFromQR = searchParams.get('qr') === '1';

  useEffect(() => {
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStore(data);
    } catch (err) {
      console.error("Erro ao carregar loja:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (user) {
      setActionLoading(true);
      try {
        // Garantir que o cartão fidelidade existe
        const { data: card, error: fetchError } = await supabase
          .from('loyalty_cards')
          .select('id')
          .eq('customer_id', user.id)
          .eq('store_id', id)
          .maybeSingle();

        if (!card) {
          // Criar novo cartão
          const { data: newCard, error: createError } = await supabase
            .from('loyalty_cards')
            .insert({
              customer_id: user.id,
              store_id: id,
              stamps_accumulated: 0,
              last_activity: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) throw createError;
          navigate(`/carteira/${newCard.id}`);
        } else {
          navigate(`/carteira/${card.id}`);
        }
      } catch (err) {
        console.error("Erro ao iniciar fidelidade:", err);
        navigate('/carteira');
      } finally {
        setActionLoading(false);
      }
    } else if (isFromQR) {
      navigate(`/register/membro?storeId=${id}`);
    } else {
      setShowQRModal(true);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-brand-yellow">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sincronizando Unidade...</p>
      </div>
    );
  }

  if (!store || !['ACTIVE', 'TRIAL'].includes(store.subscription_status)) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-800">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2 italic uppercase">Loja Indisponível</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">
          Esta unidade não está aceitando novos pontos Z no momento.
        </p>
        <button onClick={() => navigate('/explorar')} className="bg-brand-yellow text-brand-bg px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-8 shadow-glow-yellow active:scale-95 transition-all">
          Explorar Outros Parceiros
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans overflow-x-hidden pb-20">
      
      {/* Banner & Logo */}
      <div className="relative h-64 w-full bg-gradient-to-br from-brand-yellow/20 to-brand-bg">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-bg"></div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
          <div className="w-24 h-24 bg-brand-surface border-4 border-brand-bg rounded-[2rem] p-1 shadow-2xl overflow-hidden flex items-center justify-center">
             {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" /> : <Award className="w-10 h-10 text-slate-700" />}
          </div>
        </motion.div>
      </div>

      {/* Info */}
      <div className="mt-14 px-6 text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tight italic uppercase">{store.name}</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{store.category || 'Varejo'}</p>
        <div className="flex items-center justify-center text-brand-yellow text-[10px] font-black pt-4 uppercase tracking-widest opacity-60">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="truncate max-w-[250px]">{store.address || 'Endereço não informado'}</span>
        </div>
      </div>

      {/* Action Card */}
      <div className="p-6">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl flex items-center justify-center">
              <Award className="w-7 h-7 text-brand-yellow" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight italic uppercase tracking-tighter text-white">Ecossistema Z-Card</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Acumule Moedas Z agora</p>
            </div>
          </div>

          <div className="space-y-6 mb-10 text-xs font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-start space-x-4">
              <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-black text-brand-yellow shrink-0 border border-slate-800">1</div>
              <p>Escaneie o QR Code no balcão ao pagar.</p>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-black text-brand-yellow shrink-0 border border-slate-800">2</div>
              <p>Acumule moedas e troque por prêmios.</p>
            </div>
          </div>

          <button 
            onClick={handleAction}
            disabled={actionLoading}
            className="w-full bg-brand-yellow text-brand-bg py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center shadow-glow-yellow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {user ? 'Ver Minhas Moedas Z' : 'Começar a Ganhar'} <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQRModal(false)} className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md relative z-10 shadow-2xl">
              <button onClick={() => setShowQRModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
              
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-brand-yellow/10 rounded-[2rem] flex items-center justify-center mx-auto border border-brand-yellow/20">
                  <QrCode className="w-10 h-10 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white leading-tight italic uppercase tracking-tighter">Visite a Unidade</h3>
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed font-medium">
                    Para entrar neste programa de fidelidade, você precisa escanear o **QR Code oficial** localizado no balcão da loja física.
                  </p>
                </div>
                <div className="pt-4">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 italic">Onde encontrar?</p>
                   <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-left flex items-center">
                     <MapPin className="w-5 h-5 text-brand-yellow mr-3 shrink-0" />
                     <p className="text-[11px] text-slate-400 font-bold leading-tight">{store.address}</p>
                   </div>
                </div>
                <button onClick={() => setShowQRModal(false)} className="w-full py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Entendi, vou até a loja</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
