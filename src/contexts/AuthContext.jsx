import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [store, setStore] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId) => {
    if (!userId) return;
    try {
      // Buscar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Usar maybeSingle para não disparar erro se não existir
      
      // Se não encontrar o perfil, mas o usuário estiver logado, temos uma sessão zumbi
      if (!profileData && !profileError) {
        console.warn("Perfil não encontrado para a sessão atual. Limpando sessão...");
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setStore(null);
        return;
      }

      if (profileData) setProfile(profileData);

      // Se for lojista, buscar a loja
      if (profileData?.role === 'merchant') {
        let { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', userId)
          .maybeSingle();
        
        // Se não encontrar de primeira (delay do trigger), tenta mais uma vez em 1s
        if (!storeData) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const { data: retryData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', userId)
            .maybeSingle();
          storeData = retryData;
        }

        if (storeData) setStore(storeData);
      }

      // Se for cliente, buscar dados do cliente
      if (profileData?.role === 'customer') {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (customerData) {
          // Podemos mesclar os dados do cliente no profile ou criar um novo estado
          // Para manter compatibilidade, vamos colocar no profile o que for relevante
          setProfile(prev => ({ ...prev, ...customerData }));
        }
      }
    } catch (error) {
      console.warn("Aviso: Erro ao buscar dados do usuário:", error);
    }
  };

  useEffect(() => {
    // 1. Inicialização Rápida: Apenas a sessão
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        // Disparar busca de dados e AGUARDAR (importante para o F5)
        if (initialSession?.user) {
          await fetchUserData(initialSession.user.id);
        }
      } catch (err) {
        console.error("Erro na inicialização rápida:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Ouvinte de mudanças
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          fetchUserData(currentSession.user.id);
        } else {
          setProfile(null);
          setStore(null);
        }
        
        setLoading(false);
      }
    );

    // 3. Seguro contra travamentos: Timeout de 6 segundos
    const emergencyTimer = setTimeout(() => {
      setLoading(false);
    }, 6000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(emergencyTimer);
    };
  }, []);

  const value = {
    user,
    profile,
    store,
    session,
    loading,
    isDataLoaded: !!profile && (profile.role !== 'customer' || profile.whatsapp !== undefined),
    isProfileComplete: profile?.role === 'customer' 
      ? !!(profile.full_name && profile.whatsapp && profile.birth_date && profile.address)
      : true,
    fetchUserData,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut()
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-xs uppercase tracking-widest animate-pulse">Carregando Z-Card...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
