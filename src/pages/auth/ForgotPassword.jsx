import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      setError(err.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-white mb-8 transition-colors group">
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Voltar</span>
        </button>

        <div className="text-center mb-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-4 bg-brand-yellow/10 rounded-2xl flex items-center justify-center border border-brand-yellow/20">
              <ShieldCheck className="w-10 h-10 text-brand-yellow" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight italic">Recuperar Senha</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Z-Card Security Protocol</p>
        </div>

        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

          {message && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500 text-xs font-bold text-center uppercase tracking-widest">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-xs font-bold text-center uppercase tracking-widest">
              {error}
            </div>
          )}

          {!message ? (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">E-mail Cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-bg border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-brand-bg py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center hover:bg-brand-yellow hover:scale-[1.02] active:scale-95 transition-all shadow-glow-yellow disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>Enviar Link <ArrowRight className="w-5 h-5 ml-2" /></>
                )}
              </button>
            </form>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="w-full bg-slate-800 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all"
            >
              Voltar ao Início
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
