import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Phone, Calendar, MapPin, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AvatarUpload from '../../components/common/AvatarUpload';
import { formatToTitleCase } from '../../lib/utils';

export default function CustomerRegister() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const navigate = useNavigate();
  const { signUp, user, profile, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    birthDate: '',
    address: '',
    latitude: null,
    longitude: null,
    avatarUrl: ''
  });

  // Redirecionamento Automático se já estiver logado
  useEffect(() => {
    if (!authLoading && user && profile?.role === 'customer') {
      navigate('/carteira', { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const initPlaces = async () => {
      try {
        let retries = 0;
        // Tenta encontrar o objeto google por até 5 segundos (10x 500ms)
        while (!window.google && retries < 10) {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }

        if (!window.google) {
          console.error("Google Maps não carregou no tempo esperado.");
          return;
        }

        const { AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
        setSessionToken(new AutocompleteSessionToken());
      } catch (err) {
        console.error("Erro ao inicializar Google Places:", err);
      }
    };
    initPlaces();
  }, []);

  const formatWhatsApp = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleAddressChange = async (val) => {
    setFormData(prev => ({ ...prev, address: val }));
    if (val.length > 3 && window.google) {
      try {
        const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");
        const request = {
          input: val,
          includedRegionCodes: ['br'],
          sessionToken: sessionToken
        };
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        const formattedResults = suggestions.map(s => {
          const p = s.placePrediction;
          return {
            place_id: p.placeId,
            description: p.text?.text || '',
            main_text: p.structuredFormat?.mainText?.text || p.text?.text || 'Endereço encontrado',
            secondary_text: p.structuredFormat?.secondaryText?.text || ''
          };
        });
        setPredictions(formattedResults);
        setShowPredictions(true);
      } catch (err) {
        console.error("Erro no Autocomplete do Membro:", err);
      }
    } else {
      setShowPredictions(false);
    }
  };

  const selectPrediction = async (prediction) => {
    setFormData(prev => ({ ...prev, address: prediction.description }));
    setShowPredictions(false);
    if (window.google) {
      try {
        const { Place } = await window.google.maps.importLibrary("places");
        const place = new Place({ id: prediction.place_id });
        await place.fetchFields({ fields: ['location'] });
        if (place.location) {
          setFormData(prev => ({ 
            ...prev, 
            latitude: place.location.lat(),
            longitude: place.location.lng()
          }));
        }
        const { AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
        setSessionToken(new AutocompleteSessionToken());
      } catch (err) {
        console.error("Erro ao buscar coordenadas no Membro:", err);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const validatePassword = (pass) => {
      return pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass);
    };

    if (!validatePassword(formData.password)) {
      setError('A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.');
      return;
    }

    setLoading(true);

    const birthDate = new Date(formData.birthDate);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      setError('Você deve ter pelo menos 18 anos para se cadastrar.');
      setLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Por favor, selecione um endereço válido na lista de sugestões para calcularmos as lojas próximas.');
      setLoading(false);
      return;
    }

    try {
      const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');

      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            whatsapp: cleanWhatsapp,
            birth_date: formData.birthDate,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude,
            avatar_url: formData.avatarUrl,
            role: 'customer',
            initial_store_id: storeId
          }
        }
      });

      if (error) throw error;

      // Detectar e-mail já em uso (Supabase retorna user com identidades vazias se for duplicado e confirmação estiver ON)
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        throw new Error('Este e-mail já está em uso por outro membro ou parceiro. Por favor, utilize outro e-mail.');
      }

      alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
      navigate('/login/membro');
    } catch (err) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 py-12 font-sans">
      <div className="max-w-md w-full">
        
        <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-white mb-8 transition-colors group">
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Voltar</span>
        </button>

        <div className="text-center mb-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-4 bg-brand-yellow/10 rounded-2xl flex items-center justify-center border border-brand-yellow/20">
              <User className="w-10 h-10 text-brand-yellow" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Cadastro de Membro</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Sua nova carteira digital</p>
        </div>

        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </motion.div>
          )}

          <div className="flex justify-center mb-8">
            <AvatarUpload 
              onUpload={(url) => setFormData(prev => ({...prev, avatarUrl: url}))} 
              initialUrl={formData.avatarUrl}
            />
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({...prev, fullName: formatToTitleCase(e.target.value)}))}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                  placeholder="Como quer ser chamado?"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">WhatsApp</label>
                <input 
                  type="text" 
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({...prev, whatsapp: formatWhatsApp(e.target.value)}))}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nascimento</label>
                <input 
                  type="date" 
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({...prev, birthDate: e.target.value}))}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Endereço Residencial</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                  placeholder="Cidade, Rua, Bairro..."
                  required
                />
              </div>
              {showPredictions && predictions.length > 0 && (
                <div className="absolute w-full mt-2 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {predictions.map(p => (
                    <button key={p.place_id} type="button" onClick={() => selectPrediction(p)} className="w-full text-left px-5 py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-colors">
                      <p className="text-white text-xs font-bold">{p.main_text}</p>
                      <p className="text-slate-500 text-[10px]">{p.secondary_text}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5 pt-4">
              <div className="border-t border-slate-800/50 pt-6">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                  className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                      className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 pr-12 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-brand-yellow transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirmar</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                      className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 pr-12 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-brand-yellow transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-yellow text-brand-bg py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center shadow-glow-yellow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-6"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>Finalizar Cadastro <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-slate-800/50">
            <button onClick={() => navigate('/login/membro')} className="text-slate-600 text-[10px] hover:text-brand-yellow transition-colors font-bold uppercase tracking-widest">
              Já sou um Membro Z-Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
