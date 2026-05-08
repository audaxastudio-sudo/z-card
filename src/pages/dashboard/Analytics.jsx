import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Wallet, ShoppingBag, Gift, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Analytics() {
  const { store } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalSales: 0,
      totalCoinsIssued: 0,
      totalRedemptions: 0,
      avgTicket: 0
    },
    chartData: []
  });

  useEffect(() => {
    if (store) {
      fetchAnalytics();
    }
  }, [store]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar transações vinculadas à loja via card_id
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          loyalty_cards!inner(store_id)
        `)
        .eq('loyalty_cards.store_id', store.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 2. Processar estatísticas
      const earnTransactions = transactions.filter(t => t.type === 'earn');
      const redeemTransactions = transactions.filter(t => t.type === 'redeem');
      
      const totalCoinsIssued = earnTransactions.reduce((acc, t) => acc + t.amount, 0);
      const totalRedemptions = redeemTransactions.reduce((acc, t) => acc + t.amount, 0);
      
      // Ticket médio estimado (assumindo 10% de cashback se não houver valor bruto salvo)
      const estimatedTotalSales = totalCoinsIssued * (100 / (store.cashback_percent || 10));
      const avgTicket = earnTransactions.length > 0 ? estimatedTotalSales / earnTransactions.length : 0;

      // 3. Processar dados para o gráfico de 7 dias
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const chartData = last7Days.map(date => {
        const dailyTransactions = earnTransactions.filter(t => t.created_at.startsWith(date));
        const amount = dailyTransactions.reduce((acc, t) => acc + t.amount, 0);
        return {
          date: date.split('-')[2], // Apenas o dia
          value: amount
        };
      });

      setData({
        stats: {
          totalSales: estimatedTotalSales,
          totalCoinsIssued,
          totalRedemptions,
          avgTicket
        },
        chartData
      });

    } catch (err) {
      console.error("Erro ao carregar analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  // Máximo para o gráfico (para escala)
  const maxValue = Math.max(...data.chartData.map(d => d.value), 10);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-brand-yellow" /> Relatórios
        </h1>
        <p className="text-slate-400 mt-1">Acompanhe a saúde financeira e o engajamento da sua loja.</p>
      </div>

      {/* Grid de Stats de Alto Impacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Vendas Brutas (Est.)" 
          value={`R$ ${data.stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<ShoppingBag className="w-5 h-5" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="Moedas Emitidas" 
          value={data.stats.totalCoinsIssued.toString()}
          icon={<Wallet className="w-5 h-5" />}
          trend="+5%"
          trendUp={true}
        />
        <StatCard 
          title="Resgates Realizados" 
          value={data.stats.totalRedemptions.toString()}
          icon={<Gift className="w-5 h-5" />}
          trend="-2%"
          trendUp={false}
        />
        <StatCard 
          title="Ticket Médio" 
          value={`R$ ${data.stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="+8%"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico Principal (Custom SVG) */}
        <div className="lg:col-span-2 bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-bold text-lg">Fluxo de Cashback</h3>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Últimos 7 dias</p>
            </div>
            <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800">
              <Calendar className="w-4 h-4 text-brand-yellow" />
              <span className="text-white text-xs font-bold">Abril 2024</span>
            </div>
          </div>

          {/* Área do Gráfico */}
          <div className="h-64 flex items-end justify-between gap-2 px-2 relative">
             {/* Linhas de fundo */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                {[...Array(5)].map((_, i) => <div key={i} className="w-full border-t border-slate-700" />)}
             </div>

             {data.chartData.map((d, i) => (
               <div key={i} className="flex-1 flex flex-col items-center group relative">
                 <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-brand-yellow text-brand-bg text-[10px] font-black px-2 py-1 rounded-md shadow-glow-yellow mb-2 z-10">
                   {d.value} pts
                 </div>
                 <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${(d.value / maxValue) * 100}%` }}
                   transition={{ duration: 1, delay: i * 0.1 }}
                   className="w-full max-w-[40px] bg-gradient-to-t from-brand-yellow/20 to-brand-yellow rounded-t-xl relative shadow-glow-yellow group-hover:to-white transition-colors"
                 >
                   <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 rounded-t-xl" />
                 </motion.div>
                 <span className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{d.date}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Lado Direito: Top Clientes / Insights */}
        <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
          <h3 className="text-white font-bold mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-brand-yellow" /> Insights Rápidos
          </h3>
          
          <div className="space-y-6 flex-1">
            <InsightItem 
              label="Taxa de Retorno" 
              value="64%" 
              desc="Clientes que voltaram este mês." 
              color="text-green-400"
            />
            <InsightItem 
              label="Engajamento" 
              value="Alto" 
              desc="Sua taxa de resgate está acima da média." 
              color="text-blue-400"
            />
            <InsightItem 
              label="Previsão de Gastos" 
              value="R$ 4.2k" 
              desc="Estimado para os próximos 15 dias." 
              color="text-brand-yellow"
            />
          </div>

          <button className="w-full mt-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center group">
            Ver Relatório Completo 
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }) {
  return (
    <div className="bg-brand-surface border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-yellow/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center text-brand-yellow">
          {icon}
        </div>
        <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
}

function InsightItem({ label, value, desc, color }) {
  return (
    <div className="p-4 bg-black/20 rounded-2xl border border-slate-800/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-black ${color}`}>{value}</span>
      </div>
      <p className="text-[11px] text-slate-400">{desc}</p>
    </div>
  );
}
