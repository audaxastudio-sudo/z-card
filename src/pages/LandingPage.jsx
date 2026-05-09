import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, ShieldCheck, Zap, Users, ArrowRight, 
  CheckCircle2, Store, Gift, Coins, Smartphone,
  Star, MessageCircle, BarChart3, Clock, Loader2, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PWAInstallBanner from '../components/PWAInstallBanner';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    businessName: '',
    category: ''
  });
  const { user, profile, store, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && profile?.role === 'merchant' && store) {
      const isTrialActive = store.trial_until && new Date(store.trial_until) > new Date();
      const isActive = store.subscription_status === 'ACTIVE' || isTrialActive;
      
      if (isActive) {
        navigate('/dashboard');
      }
    }
  }, [user, profile, store, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert([{
        full_name: formData.fullName,
        email: formData.email,
        whatsapp: formData.whatsapp,
        business_name: formData.businessName,
        category: formData.category
      }]);

      if (error) throw error;
      setSuccess(true);
      setFormData({ fullName: '', email: '', whatsapp: '', businessName: '', category: '' });
    } catch (err) {
      alert("Erro ao enviar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-200 font-sans selection:bg-brand-yellow selection:text-brand-bg overflow-x-hidden">
      <PWAInstallBanner />
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-brand-bg/80 backdrop-blur-xl border-b border-slate-900 z-50 px-6 lg:px-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-brand-surface border border-slate-800 rounded-xl p-1.5 shadow-glow-yellow/10">
            <img src="/Logo.png" alt="Z-Card" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg lg:text-xl font-black text-white italic uppercase tracking-tighter whitespace-nowrap">Z-CARD<span className="text-brand-yellow">.</span></span>
        </div>
        
        <div className="hidden md:flex items-center space-x-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <a href="#beneficios" className="hover:text-brand-yellow transition-colors">Benefícios</a>
          <a href="#como-funciona" className="hover:text-brand-yellow transition-colors">Como Funciona</a>
          <a href="#oferta" className="hover:text-brand-yellow transition-colors text-brand-yellow">Oferta Especial</a>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/login/membro')}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors px-4 py-2"
          >
            Entrar como Membro
          </button>
          <button 
            onClick={() => navigate('/login/parceiro')}
            className="bg-brand-yellow text-brand-bg px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-glow-yellow/20"
          >
            Acesso Parceiro
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 lg:px-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-yellow/5 rounded-full blur-[150px] -mr-96 -mt-96 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center space-x-2 bg-brand-yellow/10 border border-brand-yellow/20 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-brand-yellow fill-brand-yellow" />
              <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">O Futuro da Fidelização Chegou</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter leading-[0.95]">
              Transforme clientes em <span className="text-brand-yellow">fãs apaixonados.</span>
            </h1>
            
            <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
              Substitua os cartões fidelidade de papel por uma experiência digital premium. Aumente sua recorrência em até 40% com o ecossistema Z-Card.
            </p>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a 
                href="#oferta"
                className="w-full sm:w-auto bg-brand-yellow text-brand-bg px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-glow-yellow hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              >
                Garantir 3 Meses Grátis <ArrowRight className="w-5 h-5 ml-3" />
              </a>
              <button 
                onClick={() => navigate('/explorar')}
                className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center"
              >
                Ver demonstração <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="pt-8 border-t border-slate-900">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                <span className="text-brand-yellow font-black">Lançamento Exclusivo</span> • Vagas limitadas para os primeiros parceiros.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-brand-yellow/10 blur-[100px] rounded-full"></div>
            <img 
              src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1200" 
              alt="Dashboard Preview" 
              className="relative z-10 rounded-[3rem] border border-slate-800 shadow-2xl skew-y-2 hover:skew-y-0 transition-transform duration-700"
            />
            {/* Float Stats */}
            <div className="absolute -left-10 top-1/4 bg-brand-surface border border-slate-800 p-6 rounded-3xl z-20 shadow-2xl animate-bounce-slow">
              <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Recorrência</p>
              <p className="text-2xl font-black text-white">+42%</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-32 px-6 lg:px-20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.4em]">Simplicidade em 3 Passos</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter">Como o Z-Card funciona?</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <StepCard 
              number="01"
              title="Cadastre-se"
              description="Crie sua conta em 2 minutos e configure suas recompensas e taxa de cashback."
            />
            <StepCard 
              number="02"
              title="Pontue Clientes"
              description="Apresente seu QR Code de balcão ou use o terminal para emitir moedas em cada venda."
            />
            <StepCard 
              number="03"
              title="Fidelize"
              description="Acompanhe o crescimento, envie campanhas e veja seus clientes voltarem sempre."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-32 px-6 lg:px-20 bg-black/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.4em]">Por que o Z-Card?</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter">Vantagens que o papel não oferece.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BenefitCard 
              icon={Smartphone} 
              title="100% Digital" 
              description="Seu cliente não perde, não rasga e não esquece o cartão em casa. Está sempre no celular."
            />
            <BenefitCard 
              icon={BarChart3} 
              title="Dados de Valor" 
              description="Saiba quem são seus melhores clientes, com que frequência compram e o que preferem."
            />
            <BenefitCard 
              icon={Zap} 
              title="Notificações Push" 
              description="Mande uma oferta direto para o celular do seu cliente e traga-o de volta na mesma hora."
            />
            <BenefitCard 
              icon={ShieldCheck} 
              title="Antifraude" 
              description="Esqueça os carimbos falsificados. Nosso sistema de QR Code é seguro e auditável."
            />
            <BenefitCard 
              icon={Users} 
              title="Segmentação" 
              description="Crie campanhas específicas para aniversariantes ou clientes que não voltam há 30 dias."
            />
            <BenefitCard 
              icon={Clock} 
              title="Agilidade" 
              description="Pontue o cliente em segundos via QR Code. Rápido para você, mágico para o cliente."
            />
          </div>
        </div>
      </section>

      {/* Capture Section */}
      <section id="oferta" className="py-32 px-6 lg:px-20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto bg-brand-surface border border-slate-800 rounded-[4rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-12 lg:p-20 space-y-8">
              <h3 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter leading-none">
                Oferta Exclusiva de <span className="text-brand-yellow underline decoration-brand-yellow/30 underline-offset-8">Lançamento.</span>
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Estamos selecionando os 100 primeiros parceiros para o ecossistema Z-Card. Cadastre-se agora e ganhe **3 meses de mensalidade grátis** e acesso antecipado às novas ferramentas.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-brand-yellow mr-3" /> Tutoriais em Vídeo de Alta Performance
                </li>
                <li className="flex items-center text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-brand-yellow mr-3" /> Expositores de Mesa (Opcional)
                </li>
                <li className="flex items-center text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-brand-yellow mr-3" /> Assistente IA de Treinamento 24h
                </li>
              </ul>
            </div>

            <div className="bg-brand-bg/50 p-12 lg:p-20 border-l border-slate-800">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center shadow-glow-yellow">
                      <CheckCircle2 className="w-10 h-10 text-brand-bg" />
                    </div>
                    <h4 className="text-2xl font-black text-white uppercase italic">Inscrição Confirmada!</h4>
                    <p className="text-slate-500 text-sm">Nossa equipe entrará em contato via WhatsApp em até 24h para ativar seu benefício.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome</label>
                        <input 
                          type="text" 
                          required
                          value={formData.fullName}
                          onChange={e => setFormData({...formData, fullName: e.target.value})}
                          placeholder="Ex: Ricardo Silva"
                          className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          placeholder="ricardo@loja.com"
                          className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Empresa</label>
                      <input 
                        type="text" 
                        required
                        value={formData.businessName}
                        onChange={e => setFormData({...formData, businessName: e.target.value})}
                        placeholder="Ex: Café Central"
                        className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                        <input 
                          type="tel" 
                          required
                          value={formData.whatsapp}
                          onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                          placeholder="(00) 00000-0000"
                          className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                        <select 
                          required
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                          className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all shadow-inner appearance-none cursor-pointer"
                        >
                          <option value="">Selecione...</option>
                          <option value="Gastronomia">Gastronomia</option>
                          <option value="Beleza & Estética">Beleza & Estética</option>
                          <option value="Saúde & Bem-estar">Saúde & Bem-estar</option>
                          <option value="Moda & Acessórios">Moda & Acessórios</option>
                          <option value="Tecnologia">Tecnologia</option>
                          <option value="Automotivo">Automotivo</option>
                          <option value="Pet Shop">Pet Shop</option>
                          <option value="Educação">Educação</option>
                          <option value="Serviços">Serviços</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-yellow text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-glow-yellow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Quero ser um Parceiro VIP"}
                    </button>
                    <p className="text-[8px] text-slate-600 text-center uppercase font-bold tracking-widest">
                      Ao se inscrever, você concorda com nossos Termos e Política de Privacidade.
                    </p>
                  </form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 lg:px-20 border-t border-slate-900 bg-brand-surface/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-surface border border-slate-800 rounded-xl p-1.5">
                <img src="/Logo.png" alt="Z-Card" className="w-full h-full object-contain" />
              </div>
          <span className="text-lg lg:text-xl font-black text-white italic uppercase tracking-tighter whitespace-nowrap">Z-CARD<span className="text-brand-yellow">.</span></span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              O ecossistema definitivo para fidelização e engajamento de clientes. Tecnologia Audaxa para transformar o varejo físico.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 hover:text-brand-yellow transition-colors"><MessageCircle className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 hover:text-brand-yellow transition-colors"><Star className="w-5 h-5" /></a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Links Úteis</h4>
            <ul className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <li><Link to="/login/membro" className="hover:text-brand-yellow transition-colors">Área do Membro</Link></li>
              <li><Link to="/login/parceiro" className="hover:text-brand-yellow transition-colors">Área do Parceiro</Link></li>
              <li><Link to="/explorar" className="hover:text-brand-yellow transition-colors">Descobrir Lojas</Link></li>
              <li><Link to="/login/admin" className="hover:text-brand-yellow transition-colors">Painel Admin</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Audaxa Tech</h4>
            <p className="text-[10px] text-slate-600 leading-relaxed font-bold uppercase">
              Audaxa Tecnologia Ltda.<br/>
              Z-Card Ecosystem © 2026<br/>
              Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="relative p-8 bg-brand-surface border border-slate-800 rounded-[2.5rem] space-y-4">
      <span className="absolute -top-6 -left-4 text-7xl font-black text-white/5 italic">{number}</span>
      <h4 className="text-xl font-bold text-white italic tracking-tight relative z-10">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed relative z-10">{description}</p>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-brand-surface border border-slate-800 p-8 rounded-[2.5rem] space-y-4 hover:border-brand-yellow/30 transition-all group">
      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-brand-yellow group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-xl font-bold text-white italic tracking-tight">{title}</h4>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function TrendingUp({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );
}
