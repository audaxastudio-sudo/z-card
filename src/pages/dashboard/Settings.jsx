import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Store, Percent, MapPin, Save, Loader2, CheckCircle, FileText, Phone, User, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import AvatarUpload from '../../components/common/AvatarUpload';

const CATEGORIES = [
  "Gastronomia",
  "Beleza & Estética",
  "Saúde & Bem-estar",
  "Moda & Acessórios",
  "Tecnologia",
  "Automotivo",
  "Pet Shop",
  "Educação",
  "Serviços",
  "Outros"
];

export default function Settings() {
  const { user, profile, store, fetchUserData, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const addressRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    cnpj: '',
    cashback_percent: 10,
    person_type: 'PJ',
    full_name: '',
    corporate_name: '',
    cpf: '',
    whatsapp: '',
    logo_url: '',
    latitude: null,
    longitude: null
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        category: store.category || '',
        address: store.address || '',
        cnpj: store.cnpj || '',
        cashback_percent: store.cashback_percent || 10,
        person_type: store.person_type || 'PJ',
        full_name: store.full_name || '',
        corporate_name: store.corporate_name || '',
        cpf: store.cpf || '',
        whatsapp: store.whatsapp || '',
        logo_url: store.logo_url || '',
        latitude: store.latitude || null,
        longitude: store.longitude || null
      });
    }
  }, [store]);

  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    const initToken = async () => {
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
        console.error("Erro ao carregar Google Maps:", err);
      }
    };
    initToken();
  }, []);

  const handleAddressChange = async (val) => {
    setFormData({ ...formData, address: val });
    
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
        console.error("Erro na busca do Places New:", err);
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
      } catch (err) {
        console.error("Erro ao buscar coordenadas:", err);
      }
      setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
    }
  };

  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatWhatsApp = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { data, error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          category: formData.category,
          address: formData.address,
          cnpj: formData.person_type === 'PJ' ? formData.cnpj : null,
          cpf: formData.person_type === 'PF' ? formData.cpf : null,
          full_name: formData.person_type === 'PF' ? formData.full_name : null,
          corporate_name: formData.person_type === 'PJ' ? formData.corporate_name : null,
          person_type: formData.person_type,
          cashback_percent: parseInt(formData.cashback_percent) || 10,
          whatsapp: formData.whatsapp,
          logo_url: formData.logo_url,
          latitude: formData.latitude,
          longitude: formData.longitude,
          settings_completed: true
        })
        .eq('id', store.id)
        .select();

      if (error) {
        console.error("ERRO DETALHADO DO SUPABASE:", error);
        throw error;
      }

      console.log("Dados salvos com sucesso:", data);
      if (user?.id) await fetchUserData(user.id);
      setSuccess(true);
      
      // Se for o primeiro preenchimento, redirecionar para faturamento
      if (!store.settings_completed) {
        setTimeout(() => {
          navigate('/dashboard/billing');
        }, 1500);
      } else {
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Erro completo capturado:", err);
      alert(`Erro ao salvar: ${err.message || "Verifique sua conexão"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', store.id);

      if (error) throw error;
      
      await signOut();
      navigate('/');
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      alert("Erro ao excluir conta. Verifique sua conexão.");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-brand-yellow" /> Configurações
          </h1>
          <p className="text-brand-text-secondary mt-1">Identidade e regras de negócio da sua unidade.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Lado Esquerdo: Dados da Loja */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative">
            
            <div className="flex justify-center border-b border-slate-800/50 pb-8">
              <AvatarUpload 
                onUpload={(url) => setFormData({...formData, logo_url: url})} 
                initialUrl={formData.logo_url}
              />
            </div>

            {/* Seção 1: Informações Básicas */}
            <div className={`space-y-6 relative ${showPredictions ? 'z-[100]' : 'z-10'}`}>
              <div className="flex items-center space-x-2 text-brand-yellow font-black uppercase text-[10px] tracking-widest">
                <Store className="w-4 h-4" />
                <span>Dados da Unidade</span>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Fantasia da Unidade</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/40 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Pessoa (Faturamento)</label>
                    <div className="flex space-x-4 p-1 bg-black/40 border border-slate-700 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, person_type: 'PJ'})}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.person_type === 'PJ' ? 'bg-brand-yellow text-brand-bg shadow-glow-yellow' : 'text-slate-500 hover:text-white'}`}
                      >
                        Pessoa Jurídica
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, person_type: 'PF'})}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.person_type === 'PF' ? 'bg-brand-yellow text-brand-bg shadow-glow-yellow' : 'text-slate-500 hover:text-white'}`}
                      >
                        Pessoa Física
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-black/40 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all font-medium appearance-none cursor-pointer"
                      required
                    >
                      <option value="" disabled>Selecione uma categoria</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-brand-surface">{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input 
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: formatWhatsApp(e.target.value)})}
                        className="w-full bg-black/40 border border-slate-700 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-brand-yellow outline-none transition-all font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    {formData.person_type === 'PJ' ? 'Razão Social' : 'Nome Completo'}
                  </label>
                  <input 
                    type="text"
                    value={formData.person_type === 'PJ' ? formData.corporate_name : formData.full_name}
                    onChange={(e) => setFormData({...formData, [formData.person_type === 'PJ' ? 'corporate_name' : 'full_name']: e.target.value})}
                    className="w-full bg-black/40 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all font-medium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    {formData.person_type === 'PJ' ? 'CNPJ' : 'CPF'}
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      type="text"
                      placeholder={formData.person_type === 'PJ' ? "00.000.000/0000-00" : "000.000.000-00"}
                      value={formData.person_type === 'PJ' ? formData.cnpj : formData.cpf}
                      onChange={(e) => setFormData({
                        ...formData, 
                        [formData.person_type === 'PJ' ? 'cnpj' : 'cpf']: formData.person_type === 'PJ' ? formatCNPJ(e.target.value) : formatCPF(e.target.value)
                      })}
                      className="w-full bg-black/40 border border-slate-700 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-brand-yellow outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={`space-y-2 relative ${showPredictions ? 'z-[100]' : 'z-0'}`}>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Endereço do Estabelecimento</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow w-4 h-4 z-10" />
                  <input 
                    type="text"
                    placeholder="Digite o endereço e selecione..."
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                    className="w-full bg-black/40 border border-slate-700 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-brand-yellow outline-none transition-all font-medium"
                  />
                  
                  {/* Lista de Sugestões Customizada */}
                  {showPredictions && predictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-slate-700 rounded-2xl overflow-hidden z-[1000] shadow-2xl">
                      {predictions.map((p) => (
                        <div 
                          key={p.place_id}
                          onClick={() => selectPrediction(p)}
                          className="px-5 py-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0 transition-colors"
                        >
                          <p className="text-white text-sm font-medium">{p.main_text}</p>
                          <p className="text-slate-500 text-[11px]">{p.secondary_text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-brand-yellow text-brand-bg rounded-[1.5rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow-yellow disabled:opacity-50 flex items-center justify-center relative z-0"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Save className="w-5 h-5 mr-3" />
                  Salvar Alterações
                </>
              )}
            </button>

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-green-400 font-bold text-sm"
              >
                ✓ Dados atualizados com sucesso!
              </motion.div>
            )}
          </div>
        </div>

        {/* Lado Direito: Regras de Fidelidade */}
        <div className="space-y-6">
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center space-x-2 text-brand-yellow font-black uppercase text-[10px] tracking-widest">
              <Percent className="w-4 h-4" />
              <span>Regras de Cashback</span>
            </div>

            <div className="bg-black/40 border border-slate-800 rounded-3xl p-6 text-center">
              <div className="relative inline-block mb-4">
                <input 
                  type="number"
                  min="1"
                  max="100"
                  value={formData.cashback_percent}
                  onChange={(e) => setFormData({...formData, cashback_percent: e.target.value})}
                  className="w-32 bg-transparent text-5xl font-black text-brand-yellow text-center outline-none focus:scale-110 transition-transform"
                />
                <span className="absolute -top-1 -right-4 text-brand-yellow font-black text-xl">%</span>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Taxa de Recompensa</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-brand-yellow/5 rounded-2xl border border-brand-yellow/10">
                <p className="text-white font-bold text-xs">Exemplo de Ganho:</p>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  Numa compra de **R$ 150,00**, seu cliente receberá **{Math.floor(150 * (formData.cashback_percent / 100))} moedas**.
                </p>
              </div>
              <p className="text-slate-500 text-[10px] leading-relaxed italic">
                * Dica: Taxas entre 10% e 15% são as que mais geram recorrência em comércios locais.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-[2rem] p-6">
             <h4 className="text-white font-bold text-xs mb-3 flex items-center">
               <CheckCircle className="w-4 h-4 mr-2 text-slate-500" /> Checklist de Qualidade
             </h4>
             <ul className="space-y-2">
               <li className={`text-[10px] font-bold uppercase tracking-widest flex items-center ${formData.address ? 'text-green-500' : 'text-slate-600'}`}>
                 {formData.address ? '●' : '○'} Endereço verificado
               </li>
               <li className={`text-[10px] font-bold uppercase tracking-widest flex items-center ${formData.category ? 'text-green-500' : 'text-slate-600'}`}>
                 {formData.category ? '●' : '○'} Categoria Padronizada
               </li>
             </ul>
          </div>
        </div>

      </form>

      {/* Zona de Perigo */}
      <div className="mt-12 pt-8 border-t border-slate-800/50">
        <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Zona Crítica</h3>
              <p className="text-slate-500 text-sm max-w-md mt-1">
                Ao excluir sua conta, todos os dados da loja, recompensas e histórico de clientes serão apagados permanentemente. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="px-8 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-bold text-sm transition-all border border-red-500/20"
          >
            Excluir Minha Conta
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Tem certeza absoluta?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Esta ação apagará a loja <strong className="text-white">{store?.name}</strong> e todos os registros de fidelidade. Não há como recuperar estes dados depois.
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all"
                >
                  Sim, Excluir Tudo
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all"
                >
                  Cancelar e Voltar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
