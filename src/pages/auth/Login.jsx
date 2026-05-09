import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const alertMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
      // O ProtectedRoute cuidará do redirecionamento baseado no role
    } catch (err) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-10 flex flex-col items-center">
            <div className="w-24 h-24 mb-4 rounded-[2rem] overflow-hidden shadow-glow-yellow bg-brand-surface flex items-center justify-center p-1 border border-slate-800">
              <img src="/Logo.png" alt="Z-Card Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase whitespace-nowrap">Z-Card</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Wallet & Fidelity</p>
        </div>

        {/* Card Principal */}
        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Bem-vindo</h1>
            <p className="text-slate-500 text-sm">Acesse sua carteira digital Z-Card</p>
          </div>

          {alertMessage && (
            <div className="mb-6 p-4 bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl text-brand-yellow text-xs font-bold text-center leading-relaxed">
              {alertMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl pl-12 pr-12 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-brand-yellow transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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

          <div className="mt-12 pt-8 border-t border-slate-800/50 text-center space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Ainda não tem o Z-Card?</p>
              <p className="text-slate-400 text-[11px] leading-relaxed px-4">
                Para se cadastrar, você precisa escanear o QR Code físico em uma de nossas **lojas parceiras**.
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/explorar')}
              className="w-full bg-slate-900 border border-slate-800 text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center hover:bg-slate-800 transition-all"
            >
              <MapPin className="w-4 h-4 mr-2 text-brand-yellow" /> Descobrir Lojas Próximas
            </button>

            <div className="pt-2">
              <Link to="/register" className="text-slate-600 text-[10px] hover:text-brand-yellow transition-colors font-bold uppercase tracking-widest">
                Sou lojista e quero participar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
