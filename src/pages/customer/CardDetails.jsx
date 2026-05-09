import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Share2, Info, Star, Gift, Clock, Loader2, CheckCircle2, Ticket, QrCode as QrIcon, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { calculateDistance } from '../../lib/utils';

export default function CardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [showTicket, setShowTicket] = useState(null); 
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCardDetails();
      requestLocation();
    }
  }, [id]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Localização indisponível")
      );
    }
  };

  const fetchCardDetails = async () => {
    setLoading(true);
    try {
      const { data: cardData, error: cardError } = await supabase
        .from('loyalty_cards')
        .select(`
          id,
          stamps_accumulated,
          store_id,
          stores (*)
        `)
        .eq('id', id)
        .single();

      if (cardError) throw cardError;
      setData(cardData);

      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('store_id', cardData.store_id)
        .eq('is_active', true)
        .order('points_needed', { ascending: true });
      
      setRewards(rewardsData || []);

      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('card_id', id)
        .order('created_at', { ascending: false });
      
      setTransactions(transData || []);

    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
      navigate('/carteira');
    } finally {
      setLoading(false);
    }
  };

  const [successRedeem, setSuccessRedeem] = useState(false);

  // Monitorar Resgate em Tempo Real
  useEffect(() => {
    if (showTicket?.transaction?.id) {
      console.log("Monitorando transação:", showTicket.transaction.id);
      
      const channel = supabase
        .channel(`redeem-${showTicket.transaction.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${showTicket.transaction.id}`
        }, (payload) => {
          console.log("Mudança detectada na transação:", payload.new);
          if (payload.new.status === 'completed') {
            handleRedeemSuccess();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [showTicket]);

  const handleRedeemSuccess = () => {
    setSuccessRedeem(true);
    
    // Feedback tátil se disponível
    if (window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
      setShowTicket(null);
      setSuccessRedeem(false);
      navigate('/carteira');
    }, 3500);
  };

  const handleRedeem = async (reward) => {
    const stamps = data?.stamps_accumulated || 0;
    if (stamps < reward.points_needed) return;
    
    const confirm = window.confirm(`Deseja resgatar "${reward.name}" por ${reward.points_needed} Moedas Z?`);
    if (!confirm) return;

    setRedeeming(true);
    try {
      // 1. Subtrair os pontos
      const { error: updateError } = await supabase
        .from('loyalty_cards')
        .update({ stamps_accumulated: stamps - reward.points_needed })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Registrar a transação de resgate
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .insert([
          { 
            card_id: id, 
            type: 'redeem', 
            amount: reward.points_needed, 
            description: `Resgate: ${reward.name}`,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (transError) throw transError;

      setShowTicket({ reward, transaction: transData }); 
      fetchCardDetails();
    } catch (err) {
      console.error("Erro ao resgatar:", err);
      alert("Erro ao processar o resgate. Tente novamente.");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-yellow space-y-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Sincronizando Cartão...</p>
      </div>
    );
  }

  const { stores: store, stamps_accumulated: stamps } = data;
  const nextReward = rewards.find(r => r.points_needed > stamps);
  const availableRewardsCount = rewards.filter(r => stamps >= r.points_needed).length;
  const distance = calculateDistance(userCoords?.lat, userCoords?.lng, store?.latitude, store?.longitude);

  return (
    <div className="pb-20">
      {/* Header Fixo */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/carteira')}
          className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center text-white border border-slate-800"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-white font-bold uppercase tracking-[0.2em] text-[10px]">Detalhes do Cartão</h2>
        <div className="w-10 h-10"></div>
      </div>

      {/* Card Principal de Progresso */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden mb-10 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-yellow/5 rounded-full blur-[60px] -mr-20 -mt-20"></div>
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 bg-black rounded-3xl p-3 border border-slate-800 mb-6 shadow-glow-yellow/10">
            {store?.logo_url ? (
              <img src={store.logo_url} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-yellow font-black text-4xl">
                {store?.name?.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tight">{store?.name}</h1>
          <div className="flex flex-col items-center space-y-1 mt-3">
            <p className="text-slate-500 text-[10px] font-black flex items-center uppercase tracking-widest opacity-60">
              <MapPin className="w-3 h-3 mr-1 text-brand-yellow" /> {store?.address}
            </p>
            {distance && (
              <p className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.2em] flex items-center">
                <Navigation className="w-3 h-3 mr-1 fill-brand-yellow" /> {distance} km de você
              </p>
            )}
          </div>

          <div className="mt-12 mb-8 relative">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl font-black text-white tracking-tighter italic leading-none"
            >
              {stamps}
            </motion.div>
            <div className="text-[10px] text-brand-yellow font-black uppercase tracking-[0.4em] mt-4">Moedas Z Acumuladas</div>
          </div>

          {nextReward && (
            <div className="w-full space-y-3">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                <span>Próximo Nível: {nextReward.name}</span>
                <span className="text-brand-yellow">{stamps}/{nextReward.points_needed}</span>
              </div>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-slate-900">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stamps / nextReward.points_needed) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-brand-yellow via-yellow-400 to-brand-yellow rounded-full shadow-glow-yellow"
                ></motion.div>
              </div>
            </div>
          )}
          
          {availableRewardsCount > 0 && (
            <div className="mt-6 flex items-center space-x-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
              <Gift className="w-4 h-4 text-green-500" />
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">
                {availableRewardsCount} prêmio(s) pronto(s) para resgate!
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recompensas */}
      <div className="space-y-6 mb-12">
        <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center px-2">
          <Star className="w-4 h-4 mr-2 text-brand-yellow fill-brand-yellow" /> Catálogo de Prêmios
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {rewards.map((reward) => {
            const canRedeem = stamps >= reward.points_needed;
            return (
              <div 
                key={reward.id}
                className={`p-5 rounded-[2rem] border transition-all flex items-center justify-between ${
                  canRedeem 
                    ? 'bg-brand-surface border-brand-yellow/30 shadow-glow-yellow/5' 
                    : 'bg-brand-surface border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    canRedeem ? 'bg-brand-yellow text-brand-bg' : 'bg-slate-900 text-slate-700'
                  }`}>
                    <Gift className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm leading-tight">{reward.name}</h4>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${canRedeem ? 'text-brand-yellow' : 'text-slate-600'}`}>
                      {reward.points_needed} Moedas Z
                    </p>
                  </div>
                </div>
                {canRedeem && (
                  <button 
                    onClick={() => handleRedeem(reward)}
                    disabled={redeeming}
                    className="bg-brand-yellow text-brand-bg px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-glow-yellow"
                  >
                    {redeeming ? '...' : 'Resgatar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Histórico */}
      <div className="space-y-6">
        <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px] flex items-center px-2">
          <Clock className="w-4 h-4 mr-2 text-slate-500" /> Extrato de Moedas Z
        </h3>
        <div className="bg-brand-surface border border-slate-800 rounded-[2rem] overflow-hidden">
          <div className="divide-y divide-slate-800/50">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors relative">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    t.type === 'earn' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-bold text-xs">{t.description}</p>
                      {t.status === 'pending' && (
                        <span className="text-[7px] bg-brand-yellow/10 text-brand-yellow px-1 py-0.5 rounded uppercase font-black">Aguardando Entrega</span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                      {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={`font-black text-sm italic ${t.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.type === 'earn' ? '+' : '-'}{t.amount}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Ticket de Resgate */}
      <AnimatePresence>
        {showTicket && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col overflow-y-auto py-10 px-6">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-sm mx-auto relative mb-10"
            >
              <div className="bg-white rounded-t-[2.5rem] p-10 flex flex-col items-center text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-2 bg-brand-yellow"></div>
                 
                 {/* Camada de Sucesso */}
                 <AnimatePresence>
                   {successRedeem && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center p-6"
                     >
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 12 }}
                          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-glow-yellow"
                        >
                          <CheckCircle2 className="w-12 h-12" />
                        </motion.div>
                        <h3 className="text-2xl font-black text-brand-bg uppercase italic tracking-tighter">Prêmio Entregue!</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Aproveite sua recompensa</p>
                        
                        <div className="mt-8 flex space-x-1">
                          {[1,2,3].map(i => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                              className="w-2 h-2 bg-brand-yellow rounded-full"
                            />
                          ))}
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-brand-yellow" />
                 </div>
                 <h2 className="text-2xl font-black text-brand-bg uppercase italic tracking-tighter mb-2">Prêmio Solicitado!</h2>
                 <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Apresente este ticket ao lojista</p>
                 
                 <div className="my-8 py-8 border-y-2 border-dashed border-slate-100 w-full">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Item para resgate</p>
                    <h3 className="text-xl font-black text-brand-bg uppercase tracking-tight">{showTicket.reward.name}</h3>
                    <p className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.3em] mt-2">{store?.name}</p>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl w-full flex flex-col items-center">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                      <QRCodeSVG 
                        value={showTicket.transaction.id}
                        size={128}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                          src: "/Logo.png",
                          x: undefined,
                          y: undefined,
                          height: 24,
                          width: 24,
                          excavate: true,
                        }}
                      />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID do Resgate</p>
                    <p className="text-[11px] font-black text-brand-bg font-mono">{showTicket.transaction.id.split('-')[0].toUpperCase()}</p>
                 </div>
              </div>

              <div className="flex justify-between px-1 bg-white">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-black/95 -mb-2"></div>
                ))}
              </div>

              <div className="bg-white rounded-b-[2.5rem] p-8 pt-10">
                 <button 
                  onClick={() => setShowTicket(null)}
                  disabled={successRedeem}
                  className="w-full bg-brand-bg text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                 >
                  {successRedeem ? 'Finalizando...' : 'Cancelar e Voltar'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
