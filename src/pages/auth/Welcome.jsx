import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, User, ChevronRight, Coins, Wallet, Search, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirecionamento Automático
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'merchant') {
        navigate('/dashboard', { replace: true });
      } else if (profile.role === 'customer') {
        navigate('/carteira', { replace: true });
      } else if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center p-6 font-sans overflow-x-hidden">
      
      {/* Background Decorativo Sutil */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-lg pt-12 pb-20">
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-brand-surface border border-slate-800 rounded-[2rem] p-1.5 mb-6 shadow-2xl">
            <img src="/Logo.png" alt="Z-Card" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Z-CARD<span className="text-brand-yellow">.</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Fidelidade Digital de Nova Geração</p>
        </motion.div>

        {/* Access Buttons */}
        <div className="grid grid-cols-1 gap-4 mb-16">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login/membro')}
            className="w-full bg-brand-yellow text-brand-bg py-6 rounded-[2rem] flex items-center justify-between px-8 shadow-glow-yellow group transition-all"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-brand-bg/10 rounded-xl flex items-center justify-center mr-4">
                <User className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="block font-black uppercase text-sm leading-none">Sou Membro</span>
                <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-1">Acessar minha Carteira</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login/parceiro')}
            className="w-full bg-brand-surface border border-slate-800 text-white py-6 rounded-[2rem] flex items-center justify-between px-8 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mr-4">
                <Store className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-left">
                <span className="block font-black uppercase text-sm leading-none">Sou Parceiro</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Gestão do Negócio</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Info Section - Benefits */}
        <div className="space-y-12">
          
          {/* For Members */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="h-px flex-1 bg-slate-800"></span>
              <span className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.3em]">Para Membros</span>
              <span className="h-px flex-1 bg-slate-800"></span>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center shrink-0 border border-brand-yellow/20">
                  <Coins className="w-6 h-6 text-brand-yellow" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase italic tracking-tight">Ganhe Moedas Z</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Acumule moedas em todas as suas compras nas lojas parceiras e troque por prêmios reais.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center shrink-0 border border-brand-yellow/20">
                  <Wallet className="w-6 h-6 text-brand-yellow" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase italic tracking-tight">Carteira Única Digital</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Diga adeus aos cartões de papel. Todos os seus programas de fidelidade em um só lugar.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-yellow/10 flex items-center justify-center shrink-0 border border-brand-yellow/20">
                  <Search className="w-6 h-6 text-brand-yellow" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase italic tracking-tight">Descubra Novas Lojas</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Encontre parceiros próximos a você e aproveite ofertas exclusivas do ecossistema Z-Card.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* For Partners */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="h-px flex-1 bg-slate-800"></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Para Parceiros</span>
              <span className="h-px flex-1 bg-slate-800"></span>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <TrendingUp className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase italic tracking-tight">Aumente sua Recorrência</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Transforme clientes eventuais em fãs fiéis através de um sistema de recompensas gamificado.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Zap className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase italic tracking-tight">Controle Real-time</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Dashboard completo para acompanhar vendas, emissão de selos e engajamento da sua base.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <ShieldCheck className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase italic tracking-tight">Segurança & Rapidez</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">Emissão de pontos via QR Code em segundos, sem burocracia e com total segurança antifraude.</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Footer Branding */}
        <div className="mt-20 pt-8 border-t border-slate-900 text-center">
            <button 
              onClick={() => navigate('/explorar')}
              className="text-brand-yellow hover:scale-105 transition-all text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center mx-auto"
            >
              Começar a Explorar <ChevronRight className="w-4 h-4 ml-1" />
            </button>
            <p className="mt-6 text-slate-700 text-[8px] uppercase tracking-widest font-bold">
              Z-Card Digital Ecosystem © 2026 • Audaxa Tecnologia
            </p>
        </div>
      </div>
    </div>
  );
}
