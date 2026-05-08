import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, ChevronLeft, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MemberLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirecionamento Automático se já estiver logado
  useEffect(() => {
    if (!authLoading && user && profile?.role === 'customer') {
      navigate('/carteira', { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
      
      navigate('/carteira');
    } catch (err) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        
        <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-white mb-8 transition-colors group">
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Início</span>
        </button>

        <div className="text-center mb-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-4 bg-brand-yellow/10 rounded-2xl flex items-center justify-center border border-brand-yellow/20">
              <User className="w-10 h-10 text-brand-yellow" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight italic">Área do Membro</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Acesse sua carteira digital</p>
        </div>

        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">E-mail</label>
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

            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Senha</label>
                <button 
                  type="button" 
                  onClick={() => navigate('/forgot-password')}
                  className="text-[10px] font-black text-slate-600 hover:text-brand-yellow uppercase tracking-widest transition-colors"
                >
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-yellow text-brand-bg py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center shadow-glow-yellow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>Entrar na Carteira <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-slate-800/50">
            <p className="text-slate-500 text-xs font-bold mb-4">Ainda não tem o Z-Card?</p>
            <button onClick={() => navigate('/explorar')} className="w-full py-4 border border-slate-800 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-brand-yellow/50 hover:text-white transition-all">
              Descobrir Lojas Próximas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
