import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Users, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Campaigns() {
  const { store, fetchUserData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [customerCount, setCustomerCount] = useState(0);
  const [canSend, setCanSend] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (store?.id) {
      fetchCustomerCount();
      checkLimit();
    }
  }, [store]);

  const fetchCustomerCount = async () => {
    const { count } = await supabase
      .from('loyalty_cards')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id);
    setCustomerCount(count || 0);
  };

  const checkLimit = () => {
    if (!store?.last_notification_sent_at) return;

    const lastSent = new Date(store.last_notification_sent_at);
    const now = new Date();
    const diff = now.getTime() - lastSent.getTime();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (diff < dayInMs) {
      setCanSend(false);
      const remaining = dayInMs - diff;
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      setTimeLeft(`${hours}h ${minutes}m`);
    } else {
      setCanSend(true);
    }
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!canSend || !message || loading) return;

    setLoading(true);
    try {
      // 1. Buscar todos os clientes da loja
      const { data: customers, error: fetchError } = await supabase
        .from('loyalty_cards')
        .select('customer_id')
        .eq('store_id', store.id);

      if (fetchError) throw fetchError;
      if (!customers || customers.length === 0) {
        alert("Você ainda não tem clientes para receber esta campanha.");
        return;
      }

      // 2. Criar as notificações
      const notifications = customers.map(c => ({
        user_id: c.customer_id,
        title: `Novidade de ${store.name}`,
        message: message,
        type: 'info'
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      // 3. Atualizar a data de último envio na loja
      const { error: updateError } = await supabase
        .from('stores')
        .update({ last_notification_sent_at: new Date() })
        .eq('id', store.id);

      if (updateError) throw updateError;

      // 4. Disparar o envio real via Edge Function (Push)
      const userIds = customers.map(c => c.customer_id);
      try {
        await supabase.functions.invoke('send-push', {
          body: { 
            user_ids: userIds, 
            title: `Novidade de ${store.name}`, 
            message: message 
          }
        });
      } catch (pushErr) {
        console.error("Erro no disparo de push (continuando):", pushErr);
        // Não barramos o sucesso se o push falhar, pois a notificação interna já foi gravada
      }

      setSuccess(true);
      setMessage('');
      if (user?.id) await fetchUserData(user.id); // Atualizar estado global da loja
      setTimeout(() => setSuccess(false), 5000);
      checkLimit();

    } catch (err) {
      console.error("Erro ao disparar campanha:", err);
      alert("Erro ao enviar campanha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
          <Megaphone className="w-8 h-8 mr-3 text-brand-yellow" /> Campanhas
        </h1>
        <p className="text-slate-400 mt-1">Engaje sua base de clientes com notificações diretas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSendCampaign} className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full -mr-10 -mt-10 blur-2xl" />
            <h3 className="text-white font-bold text-lg mb-6 flex items-center">
              <Send className="w-5 h-5 mr-2 text-brand-yellow" /> Nova Mensagem (Push)
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Público Alvo</label>
                <select 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-yellow outline-none transition-all"
                >
                  <option value="all">Todos os Clientes ({customerCount} membros)</option>
                  <option value="inactive" disabled>Clientes Inativos (Em breve)</option>
                  <option value="vip" disabled>Clientes VIP (Em breve)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mensagem</label>
                <textarea 
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-brand-yellow outline-none transition-all resize-none font-medium"
                  placeholder="Ex: Oferta especial! Ganhe pontos em dobro nas compras de hoje..."
                  required
                ></textarea>
                <p className="text-[10px] text-slate-500 mt-2 italic">A mensagem aparecerá como uma notificação no app do seu cliente.</p>
              </div>

              {!canSend && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-3 shrink-0" />
                  <p className="text-xs text-orange-200 font-medium leading-relaxed">
                    Você já enviou uma campanha hoje. Aguarde **{timeLeft}** para enviar a próxima.
                    O limite é de 1 envio por dia para evitar spam.
                  </p>
                </div>
              )}

              <button 
                type="submit"
                disabled={!canSend || loading || !message}
                className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-glow-yellow flex items-center justify-center ${
                  canSend && !loading && message 
                    ? 'bg-brand-yellow text-brand-bg hover:scale-[1.02] active:scale-95' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Disparar Campanha
                  </>
                )}
              </button>
            </div>
          </form>
          
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Campanha Enviada!</h4>
                  <p className="text-sm text-green-400">Seus clientes receberão a notificação em instantes.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-500">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-white font-black text-xl mb-3">Fidelização Automática</h4>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Mande campanhas de Aniversário e recupere clientes inativos automaticamente sem precisar fazer nada.
            </p>
            <div className="px-4 py-2 bg-brand-yellow/10 text-brand-yellow text-[10px] font-black rounded-lg inline-block uppercase tracking-widest border border-brand-yellow/20">
              Em Desenvolvimento
            </div>
          </div>
          
          <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-3xl p-8">
            <h4 className="text-brand-yellow font-black text-xs uppercase tracking-[0.2em] mb-4">Dica do Especialista</h4>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "Campanhas com perguntas (ex: 'Que tal um café hoje?') geram 40% mais cliques do que apenas anúncios diretos."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
