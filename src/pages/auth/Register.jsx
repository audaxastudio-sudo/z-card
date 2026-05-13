import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Store, ArrowRight, Loader2, ChevronLeft, MapPin, Phone, FileText, Tag, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AvatarUpload from '../../components/common/AvatarUpload';
import { formatToTitleCase } from '../../lib/utils';

const CATEGORIES = [
  "Gastronomia", "Beleza & Estética", "Saúde & Bem-estar", 
  "Moda & Acessórios", "Tecnologia", "Automotivo", 
  "Pet Shop", "Educação", "Serviços", "Outros"
];

export default function Register() {
  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
    address: '',
    latitude: null,
    longitude: null,
    personType: 'PJ',
    corporateName: '',
    fullName: '',
    cnpj: '',
    cpf: '',
    whatsapp: '',
    category: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Autocomplete Logic
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const initPlaces = async () => {
      try {
        if (!window.google) {
           await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const { AutocompleteSessionToken } = await window.google.maps.importLibrary("places");
        setSessionToken(new AutocompleteSessionToken());
      } catch (err) {
        console.error("Erro ao inicializar Google Places:", err);
      }
    };
    initPlaces();
  }, []);

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
        console.error("Erro no Autocomplete:", err);
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
        console.error("Erro ao buscar coordenadas:", err);
      }
    }
  };

  const formatCPF = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').substring(0, 14);
  };

  const formatCNPJ = (value) => {
    return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
  };

  const formatWhatsApp = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15);
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

    try {
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      const cleanCnpj = formData.cnpj.replace(/\D/g, '');
      const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');

      const { data, error } = await signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            store_name: formData.storeName,
            logo_url: formData.avatarUrl,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude,
            whatsapp: cleanWhatsapp,
            category: formData.category,
            person_type: formData.personType,
            cnpj: formData.personType === 'PJ' ? cleanCnpj : null,
            cpf: formData.personType === 'PF' ? cleanCpf : null,
            corporate_name: formData.personType === 'PJ' ? formData.corporateName : null,
            full_name: formData.personType === 'PF' ? formData.fullName : null,
            role: 'merchant'
          }
        }
      });

      if (error) throw error;

      // Se o usuário já existe mas a confirmação está ativada, o Supabase retorna o usuário
      // mas com o array de identidades vazio.
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        throw new Error('Este e-mail já está em uso. Por favor, utilize outro e-mail ou faça login.');
      }
      
      alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      navigate('/login/parceiro');
    } catch (err) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 py-12 font-sans">
      <div className="max-w-2xl w-full">
        
        <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-white mb-8 transition-colors group">
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Voltar</span>
        </button>

        <div className="text-center mb-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Store className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Seja um Parceiro</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">Expanda seu negócio com o ecossistema Z-Card</p>
        </div>

        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full -mr-32 -mt-32 blur-[80px]"></div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Avatar & Nome */}
            <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-800/50">
              <AvatarUpload 
                onUpload={(url) => setFormData(prev => ({...prev, avatarUrl: url}))} 
                initialUrl={formData.avatarUrl}
              />
              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome Fantasia da Unidade</label>
                  <input 
                    type="text" 
                    value={formData.storeName}
                    onChange={(e) => setFormData(prev => ({...prev, storeName: formatToTitleCase(e.target.value)}))}
                    className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                    placeholder="Ex: Pizzaria Z-Card"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                    className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Selecione uma categoria...</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-brand-surface">{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Dados Jurídicos/Fiscais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tipo de Faturamento</label>
                <div className="flex p-1 bg-black/40 border border-slate-800 rounded-2xl">
                  <button type="button" onClick={() => setFormData(prev => ({...prev, personType: 'PJ'}))} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.personType === 'PJ' ? 'bg-brand-yellow text-brand-bg shadow-glow-yellow' : 'text-slate-500 hover:text-white'}`}>Pessoa Jurídica</button>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, personType: 'PF'}))} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.personType === 'PF' ? 'bg-brand-yellow text-brand-bg shadow-glow-yellow' : 'text-slate-500 hover:text-white'}`}>Pessoa Física</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{formData.personType === 'PJ' ? 'Razão Social' : 'Nome Completo'}</label>
                <input 
                  type="text" 
                  value={formData.personType === 'PJ' ? formData.corporateName : formData.fullName}
                  onChange={(e) => {
                    const val = formatToTitleCase(e.target.value);
                    setFormData(prev => ({...prev, [formData.personType === 'PJ' ? 'corporateName' : 'fullName']: val}));
                  }}
                  className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{formData.personType === 'PJ' ? 'CNPJ' : 'CPF'}</label>
                <input 
                  type="text" 
                  value={formData.personType === 'PJ' ? formData.cnpj : formData.cpf}
                  onChange={(e) => setFormData(prev => ({...prev, [formData.personType === 'PJ' ? 'cnpj' : 'cpf']: formData.personType === 'PJ' ? formatCNPJ(e.target.value) : formatCPF(e.target.value)}))}
                  className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                  placeholder={formData.personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                  required
                />
              </div>
            </div>

            {/* Contato e Endereço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">WhatsApp da Unidade</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="text" 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({...prev, whatsapp: formatWhatsApp(e.target.value)}))}
                    className="w-full bg-black/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Endereço da Unidade</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                    className="w-full bg-black/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                    placeholder="Cidade, Rua, Número..."
                    required
                  />
                </div>
                {showPredictions && predictions.length > 0 && (
                  <div className="absolute w-full mt-2 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                    {predictions.map(p => (
                      <button key={p.place_id} type="button" onClick={() => selectPrediction(p)} className="w-full text-left px-5 py-4 border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-colors">
                        <p className="text-white text-xs font-bold">{p.main_text}</p>
                        <p className="text-slate-500 text-[10px]">{p.secondary_text}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Credenciais */}
            <div className="pt-8 border-t border-slate-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      className="w-full bg-black/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                      className="w-full bg-black/40 border border-slate-800 rounded-2xl pl-12 pr-12 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
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
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                      className="w-full bg-black/40 border border-slate-800 rounded-2xl pl-12 pr-12 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium"
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
              className="w-full bg-white text-brand-bg py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center hover:bg-brand-yellow hover:text-brand-bg active:scale-95 transition-all shadow-glow-yellow disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>Finalizar Cadastro <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-slate-800/50">
            <button onClick={() => navigate('/login/parceiro')} className="text-slate-500 text-[10px] hover:text-white transition-colors font-bold uppercase tracking-widest">
              Já sou um Parceiro Z-Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
