import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, 
  ChevronRight, LogOut, Shield, Bell, 
  ChevronLeft, Loader2, Save, ToggleLeft as ToggleIcon,
  Navigation
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AvatarUpload from '../../components/common/AvatarUpload';
import { formatToTitleCase } from '../../lib/utils';

export default function Profile() {
  const { user, profile, fetchUserData, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp: '',
    birth_date: '',
    address: '',
    latitude: null,
    longitude: null,
    avatar_url: ''
  });

  const [settings, setSettings] = useState({
    notifications: true,
    privacy: false
  });

  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        whatsapp: profile.whatsapp || '',
        birth_date: profile.birth_date || '',
        address: profile.address || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        avatar_url: profile.avatar_url || ''
      });
      
      setSettings({
        notifications: profile.notifications_enabled ?? true,
        privacy: profile.privacy_enabled ?? false
      });
    }
    
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
        console.error("Erro ao carregar Google Places no Perfil:", err);
      }
    };
    initToken();
  }, [profile]);

  const updateSetting = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    try {
      const dbKey = key === 'notifications' ? 'notifications_enabled' : 'privacy_enabled';
      const { error } = await supabase
        .from('customers')
        .update({ [dbKey]: value })
        .eq('id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error(`Erro ao salvar ${key}:`, err);
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const formatWhatsApp = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.full_name,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: customerError } = await supabase
        .from('customers')
        .update({
          whatsapp: formData.whatsapp,
          birth_date: formData.birth_date,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude
        })
        .eq('id', user.id);

      if (customerError) throw customerError;

      await fetchUserData(user.id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      alert("Erro ao atualizar dados.");
    } finally {
      setLoading(false);
    }
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
        console.error("Erro na busca do Places New no Perfil:", err);
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
        console.error("Erro ao buscar coordenadas no Perfil:", err);
      }
    }
  };

  return (
    <div className="pb-20 space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Meu Perfil</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Personalize sua experiência</p>
        </div>
        <button 
          onClick={signOut}
          className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20 active:scale-95 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Avatar Section */}
        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <AvatarUpload 
             onUpload={(url) => setFormData(prev => ({...prev, avatar_url: url}))}
             initialUrl={formData.avatar_url}
           />
           <div className="mt-6 text-center relative z-10">
              <h2 className="text-white font-black text-xl italic uppercase tracking-tighter">{formData.full_name || 'Membro Z-Card'}</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">{user?.email}</p>
           </div>
        </div>

        {/* Basic Info */}
        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-xl">
          <div className="flex items-center space-x-3 text-brand-yellow font-black uppercase text-[10px] tracking-[0.2em]">
            <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span>Informações Pessoais</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({...prev, full_name: formatToTitleCase(e.target.value)}))}
                className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium shadow-inner"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
                 <input 
                   type="text"
                   value={formData.whatsapp}
                   onChange={(e) => setFormData(prev => ({...prev, whatsapp: formatWhatsApp(e.target.value)}))}
                   className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium shadow-inner"
                   placeholder="(00) 00000-0000"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nascimento</label>
                 <input 
                   type="date"
                   value={formData.birth_date}
                   onChange={(e) => setFormData(prev => ({...prev, birth_date: e.target.value}))}
                   className="w-full bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium shadow-inner"
                 />
               </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Endereço</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-yellow" />
                <input 
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                  className="w-full bg-black/40 border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-brand-yellow outline-none transition-all text-sm font-medium shadow-inner"
                />
              </div>
              {showPredictions && predictions.length > 0 && (
                <div className="absolute w-full mt-2 bg-brand-surface border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {predictions.map(p => (
                    <button
                      key={p.place_id}
                      type="button"
                      onClick={() => selectPrediction(p)}
                      className="w-full text-left px-4 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800 transition-colors"
                    >
                      <p className="text-white text-xs font-medium">{p.main_text}</p>
                      <p className="text-slate-500 text-[10px]">{p.secondary_text}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-brand-yellow text-brand-bg rounded-[1.5rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow-yellow disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <><Save className="w-5 h-5 mr-3" /> Salvar Alterações</>
          )}
        </button>

        {success && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-green-500 text-[10px] font-black uppercase tracking-widest">
            ✓ Perfil atualizado com sucesso!
          </motion.p>
        )}
      </form>

      {/* Preferences & Settings */}
      <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-4 divide-y divide-slate-800/50 shadow-xl overflow-hidden">
          <div 
            onClick={() => updateSetting('privacy', !settings.privacy)}
            className="flex items-center justify-between p-5 group cursor-pointer hover:bg-slate-800/30 transition-all rounded-t-2xl"
          >
             <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${settings.privacy ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-slate-800/50 text-slate-600'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">Privacidade & Segurança</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ocultar meus dados das lojas</p>
                </div>
             </div>
             <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.privacy ? 'bg-brand-yellow' : 'bg-slate-800'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${settings.privacy ? 'right-1' : 'left-1'}`}></div>
             </div>
          </div>

          <div 
            onClick={() => updateSetting('notifications', !settings.notifications)}
            className="flex items-center justify-between p-5 group cursor-pointer hover:bg-slate-800/30 transition-all rounded-b-2xl"
          >
             <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${settings.notifications ? 'bg-brand-yellow/10 text-brand-yellow' : 'bg-slate-800/50 text-slate-600'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-tight">Notificações Push</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Receber novidades e cashbacks</p>
                </div>
             </div>
             <div className={`w-10 h-6 rounded-full relative transition-colors ${settings.notifications ? 'bg-brand-yellow' : 'bg-slate-800'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${settings.notifications ? 'right-1' : 'left-1'}`}></div>
             </div>
          </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-8 border-t border-slate-800/50">
        <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Zona Crítica</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Exclusão de Conta Permanente</p>
            </div>
          </div>
          
          <div className="bg-red-500/10 p-4 rounded-2xl">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
              ⚠️ ATENÇÃO: Ao excluir sua conta, todas as suas Moedas Z acumuladas em TODAS as lojas serão perdidas permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>

          <button 
            onClick={() => {
              if (window.confirm("VOCÊ PERDERÁ TODAS AS SUAS MOEDAS Z. Tem certeza que deseja excluir sua conta permanentemente?")) {
                handleDeleteAccount();
              }
            }}
            className="w-full py-4 border border-red-500/20 text-red-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
          >
            Excluir Minha Conta
          </button>
        </div>
      </div>

    </div>
  );
}

// Helper para exclusão de conta
async function handleDeleteAccount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (error) throw error;
    
    await supabase.auth.signOut();
    window.location.href = '/';
  } catch (err) {
    console.error("Erro ao excluir conta:", err);
    alert("Erro ao excluir conta. Tente novamente.");
  }
}
