import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { requestForToken, onMessageListener } from '../lib/firebase';

export default function PushNotificationManager() {
  const { user, profile } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (user && !profile?.push_token) {
      const hasAsked = localStorage.getItem('push_asked');
      if (!hasAsked) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    // Listener para mensagens enquanto o app está aberto (foreground)
    if (user) {
      const setupListener = async () => {
        const listener = await onMessageListener();
        if (listener) {
          listener.then(payload => {
            console.log('Mensagem recebida em primeiro plano:', payload);
          });
        }
      };
      setupListener();
    }
  }, [user, profile]);

  const handleRequestPermission = async () => {
    try {
      const token = await requestForToken();
      
      if (token) {
        const { error } = await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', user.id);

        if (!error) {
          setShowPrompt(false);
          localStorage.setItem('push_asked', 'true');
        }
      } else {
        // Usuário negou ou erro
        localStorage.setItem('push_asked', 'true');
        setShowPrompt(false);
      }
    } catch (err) {
      console.error("Erro ao solicitar push:", err);
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="w-full max-w-sm bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-center"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="w-16 h-16 bg-brand-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-yellow/20">
            <Bell className="w-8 h-8 text-brand-yellow animate-bounce" />
          </div>

          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Ativar Notificações?</h3>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed font-medium">
            Receba avisos de novos prêmios, moedas recebidas e ofertas exclusivas direto no seu celular.
          </p>

          <div className="mt-8 space-y-3">
            <button 
              onClick={handleRequestPermission}
              className="w-full bg-brand-yellow text-brand-bg py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow-yellow hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Sim, quero ser avisado
            </button>
            <button 
              onClick={() => {
                setShowPrompt(false);
                localStorage.setItem('push_asked', 'true');
              }}
              className="w-full text-slate-600 font-bold uppercase text-[9px] tracking-[0.2em] py-2"
            >
              Agora não
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
