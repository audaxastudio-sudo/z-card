import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Ticket, 
  TrendingUp, 
  Clock, 
  ArrowUpRight, 
  ChevronRight,
  Wallet,
  QrCode
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, store } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalStamps: 0,
    monthlyRevenue: 0,
    activeCampaigns: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store?.id) {
      fetchDashboardData();

      const loyaltyCardsChannel = supabase
        .channel('dashboard_loyalty_cards')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'loyalty_cards',
          filter: `store_id=eq.${store.id}`
        }, () => {
          fetchDashboardData();
        })
        .subscribe();

      const transactionsChannel = supabase
        .channel('dashboard_transactions')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'transactions'
        }, () => {
          fetchDashboardData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(loyaltyCardsChannel);
        supabase.removeChannel(transactionsChannel);
      };
    }
  }, [store]);

  const fetchDashboardData = async () => {
    if (!store?.id) return;
    
    try {
      // 1. Total de Clientes
      const { count: customerCount } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id);

      // 2. Transações Recentes
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          type,
          created_at,
          loyalty_cards!inner(id, store_id, profiles(full_name))
        `)
        .eq('loyalty_cards.store_id', store.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transError) console.error("Erro nas transações:", transError);

      // 3. Total de Moedas Z
      const { data: cardsData } = await supabase
        .from('loyalty_cards')
        .select('stamps_accumulated')
        .eq('store_id', store.id);
      
      const totalStamps = cardsData?.reduce((acc, curr) => acc + (curr.stamps_accumulated || 0), 0) || 0;

      // 4. Faturamento Mensal (Vendas Validadas)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Usamos * para evitar erro 400 se a coluna purchase_amount não for reconhecida em algum cache
      const { data: revenueData, error: revError } = await supabase
        .from('transactions')
        .select('*, loyalty_cards!inner(store_id)')
        .eq('loyalty_cards.store_id', store.id)
        .eq('type', 'earn')
        .gte('created_at', startOfMonth.toISOString());
      
      const monthlyRevenue = (!revError && revenueData) 
        ? revenueData.reduce((acc, curr) => acc + (parseFloat(curr.purchase_amount) || 0), 0) 
        : 0;

      setStats({
        totalCustomers: customerCount || 0,
        totalStamps: totalStamps,
        monthlyRevenue: monthlyRevenue,
        activeCampaigns: 1,
        recentActivity: transactions || []
      });
    } catch (err) {
      console.error("Erro geral no dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Olá, {profile?.full_name?.split(' ')[0]} • Unidade <span className="text-brand-yellow">{store?.name}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center text-brand-yellow mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Clientes Ativos</p>
          <h2 className="text-3xl font-black text-white">{stats.totalCustomers}</h2>
        </div>

        <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Vendas (Mês)</p>
          <h2 className="text-3xl font-black text-white">
            <span className="text-sm font-bold text-slate-500 mr-1">R$</span>
            {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center text-brand-yellow mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Moedas Emitidas</p>
          <h2 className="text-3xl font-black text-white">{stats.totalStamps}</h2>
        </div>

        <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center text-brand-yellow mb-4">
            <Ticket className="w-5 h-5" />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Campanhas</p>
          <h2 className="text-3xl font-black text-white">{stats.activeCampaigns}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Atividade Recente */}
        <div className="lg:col-span-2 bg-brand-surface border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center">
              <Clock className="w-5 h-5 mr-3 text-brand-yellow" /> Atividade Recente
            </h3>
          </div>

          <div className="space-y-6">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b border-slate-800/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.type === 'earn' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <ArrowUpRight className={`w-5 h-5 ${activity.type === 'redeem' ? 'rotate-180' : ''}`} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{activity.loyalty_cards?.profiles?.full_name}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{activity.type === 'earn' ? 'Recebeu Moedas' : 'Resgatou Prêmio'}</p>
                      {activity.status === 'pending' && (
                        <span className="bg-brand-yellow/10 text-brand-yellow text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase">Pendente</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-black ${activity.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>
                      {activity.type === 'earn' ? '+' : '-'}{activity.amount}
                    </p>
                  </div>
                  {activity.status === 'pending' && activity.type === 'redeem' && (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={async () => {
                          if (window.confirm("Deseja recusar este resgate? As moedas serão devolvidas ao cliente.")) {
                            try {
                              // 1. Marcar como cancelado
                              await supabase
                                .from('transactions')
                                .update({ status: 'cancelled' })
                                .eq('id', activity.id);
                              
                              // 2. Devolver moedas
                              const { data: card } = await supabase
                                .from('loyalty_cards')
                                .select('stamps_accumulated')
                                .eq('id', activity.loyalty_cards.id)
                                .single();
                              
                              await supabase
                                .from('loyalty_cards')
                                .update({ stamps_accumulated: (card?.stamps_accumulated || 0) + activity.amount })
                                .eq('id', activity.loyalty_cards.id);

                              fetchDashboardData();
                            } catch (err) {
                              console.error("Erro ao recusar resgate:", err);
                            }
                          }
                        }}
                        className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                      >
                        Recusar
                      </button>
                      <button 
                        onClick={async () => {
                          const { error } = await supabase
                            .from('transactions')
                            .update({ status: 'completed' })
                            .eq('id', activity.id);
                          if (!error) fetchDashboardData();
                        }}
                        className="bg-brand-yellow text-brand-bg px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-glow-yellow active:scale-95 transition-all"
                      >
                        Entregar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <div className="py-10 text-center text-slate-600 text-xs uppercase font-bold tracking-widest">
                Nenhuma atividade registrada
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="space-y-6">
          <div 
            onClick={() => window.open('/display', '_blank')}
            className="bg-brand-yellow text-brand-bg rounded-3xl p-8 cursor-pointer hover:scale-[1.02] transition-all group"
          >
            <QrCode className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-2">Exibir QR Code</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Para capturar novos membros</p>
            <div className="mt-6 flex justify-end">
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={() => navigate('/dashboard/rewards')}
            className="bg-brand-surface border border-slate-800 rounded-3xl p-8 cursor-pointer hover:border-slate-600 transition-all group"
          >
            <h3 className="text-xl font-bold uppercase tracking-tight leading-none mb-2 text-white">Novo Prêmio</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Impulsione suas vendas</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function PlusIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
