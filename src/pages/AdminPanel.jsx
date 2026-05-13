import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Store, Activity, Database, CheckCircle, 
  AlertTriangle, DollarSign, TrendingUp, Calendar, ArrowUpRight, 
  CreditCard, Bell, Send, Loader2, Megaphone, Smartphone, UserPlus, Filter, LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, stores, leads, config, notifications, vouchers
  const [stats, setStats] = useState({
    stores: 0,
    customers: 0,
    activeSubscriptions: 0,
    realRevenueMonth: 0,
    projectedRevenueMonth: 0,
    annualRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentStores, setRecentStores] = useState([]);
  const [plans, setPlans] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [leads, setLeads] = useState([]);
  const [notification, setNotification] = useState({ target: 'all', storeId: '', title: '', message: '' });
  const [sending, setSending] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [newVoucher, setNewVoucher] = useState({ code: '', benefit_days: 30, max_uses: 1 });
  const [allCustomers, setAllCustomers] = useState([]);
  const [allMerchants, setAllMerchants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchGlobalStats();
    fetchPlans();
    fetchAllStores();
    fetchLeads();
    fetchVouchers();
    fetchAllCustomers();
    fetchAllMerchants();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (!error) {
      fetchLeads();
    }
  };

  const fetchAllStores = async () => {
    const { data } = await supabase
      .from('stores')
      .select(`
        *,
        owner:profiles(full_name, avatar_url)
      `)
      .order('name');
    
    if (data) setAllStores(data);
  };

  const fetchAllCustomers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('full_name');
    if (data) setAllCustomers(data);
  };

  const fetchAllMerchants = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'merchant')
      .order('full_name');
    if (data) setAllMerchants(data);
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from('platform_config').select('*').eq('key', 'subscription_plans').single();
    if (data) setPlans(data.value);
  };

  const fetchVouchers = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setVouchers(data);
  };

  const createVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucher.code) return;
    
    try {
      const { error } = await supabase
        .from('vouchers')
        .insert([{
          code: newVoucher.code.toUpperCase().trim(),
          benefit_days: parseInt(newVoucher.benefit_days),
          max_uses: parseInt(newVoucher.max_uses)
        }]);

      if (error) throw error;
      
      alert("Voucher criado com sucesso!");
      setNewVoucher({ code: '', benefit_days: 30, max_uses: 1 });
      fetchVouchers();
    } catch (err) {
      alert("Erro ao criar voucher: " + err.message);
    }
  };

  const deleteVoucher = async (id) => {
    if (!confirm("Excluir este voucher?")) return;
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (!error) fetchVouchers();
  };

  const savePlans = async () => {
    const { error } = await supabase
      .from('platform_config')
      .upsert({ 
        key: 'subscription_plans', 
        value: plans, 
        updated_at: new Date() 
      }, { onConflict: 'key' });
    
    if (!error) alert("Planos atualizados com sucesso!");
    else alert("Erro ao atualizar planos: " + error.message);
  };

  const grantAccess = async (storeId) => {
    try {
      const store = allStores.find(s => s.id === storeId);
      if (!store) throw new Error("Loja não encontrada.");

      const now = new Date();
      const currentExpiry = store.subscription_expires_at ? new Date(store.subscription_expires_at) : now;
      const baseDate = currentExpiry > now ? new Date(currentExpiry) : new Date(now);
      
      baseDate.setMonth(baseDate.getMonth() + 1);
      const newExpiry = baseDate.toISOString();
      
      const { data, error } = await supabase
        .from('stores')
        .update({ 
          subscription_expires_at: newExpiry,
          subscription_status: 'ACTIVE'
        })
        .eq('id', storeId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Nenhuma alteração realizada. Verifique as permissões de RLS no banco de dados.");
      }

      alert(`Acesso liberado! Nova expiração: ${new Date(newExpiry).toLocaleDateString()}`);
      fetchAllStores();
      fetchGlobalStats();
      
    } catch (err) {
      console.error(err);
      alert("Erro ao liberar acesso: " + err.message);
    }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!notification.title || !notification.message) return;
    if ((notification.target === 'individual_merchant' || notification.target === 'individual_customer') && !selectedUser) {
      alert("Por favor, selecione um usuário.");
      return;
    }

    setSending(true);
    try {
      let targets = [];
      
      if (notification.target === 'all_merchants') {
        targets = allStores.map(s => s.owner_id);
      } else if (notification.target === 'all_customers') {
        targets = allCustomers.map(c => c.id);
      } else if (notification.target === 'individual_merchant' || notification.target === 'individual_customer') {
        targets = [selectedUser.id];
      }

      if (targets.length === 0) {
        alert("Nenhum destinatário encontrado.");
        return;
      }

      // 1. Verificar quem tem token de push
      const { data: profilesWithToken } = await supabase
        .from('profiles')
        .select('id')
        .in('id', targets)
        .not('push_token', 'is', null);

      const tokensCount = profilesWithToken?.length || 0;

      // 2. Gravar no banco de dados para notificações internas
      const notificationsData = targets.map(userId => ({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: 'info'
      }));

      const { error } = await supabase.from('notifications').insert(notificationsData);
      if (error) throw error;

      // 3. Disparar Push real via Edge Function
      let pushResult = "Push não disparado (nenhum token encontrado).";
      if (tokensCount > 0) {
        try {
          const { data: result } = await supabase.functions.invoke('send-push', {
            body: { 
              user_ids: targets, 
              title: notification.title, 
              message: notification.message 
            }
          });
          pushResult = `Push enviado para ${tokensCount} dispositivos.`;
        } catch (pushErr) {
          pushResult = `Erro ao disparar push: ${pushErr.message}`;
        }
      }

      alert(`Notificações internas gravadas.\n${pushResult}`);
      setNotification({ ...notification, title: '', message: '' });
      setSelectedUser(null);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar notificação.");
    } finally {
      setSending(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      setLoading(true);
      const { data: stores } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
      const storesCount = stores?.length || 0;
      const { count: customersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer');
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: monthPayments } = await supabase.from('payments').select('amount').gte('payment_date', firstDayOfMonth);
      const realRevenue = monthPayments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      const { data: config } = await supabase.from('platform_config').select('value').eq('key', 'subscription_plans').single();
      const plansPrices = config?.value || [];
      const monthlyPlan = plansPrices.find(p => p.id?.toLowerCase().includes('mensal') || p.id === 'monthly');
      const monthlyPrice = monthlyPlan?.price || 99.90;

      const activeSubs = stores?.filter(s => s.subscription_status === 'ACTIVE') || [];
      const projectedRevenue = activeSubs.length * monthlyPrice;

      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();
      const { data: yearPayments } = await supabase.from('payments').select('amount').gte('payment_date', oneYearAgo);
      const annualRev = yearPayments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      setStats({
        stores: storesCount,
        customers: customersCount || 0,
        activeSubscriptions: activeSubs.length,
        realRevenueMonth: realRevenue,
        projectedRevenueMonth: projectedRevenue,
        annualRevenue: annualRev
      });
      setRecentStores(stores?.slice(0, 10) || []);
    } catch (error) {
      console.error("Erro ao carregar admin stats", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-slate-200 p-6 lg:p-10 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shadow-glow-blue border border-blue-500/20">
              <ShieldAlert className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Admin<span className="text-blue-500">Center</span></h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão Central Audaxa Z-Card</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acesso Root</p>
              <p className="text-xs font-bold text-white">Administrador</p>
            </div>
            <button 
              onClick={async () => {
                await signOut();
                navigate('/login/admin');
              }}
              className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-glow-red/10"
              title="Sair do Sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-800 pb-10">
          <div className="flex flex-wrap bg-brand-surface p-1.5 rounded-2xl border border-slate-800 gap-1.5">
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Activity} label="Painel" />
            <TabButton active={activeTab === 'customers_management'} onClick={() => setActiveTab('customers_management')} icon={Users} label="Membros" />
            <TabButton active={activeTab === 'stores'} onClick={() => setActiveTab('stores')} icon={Store} label="Lojas" />
            <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={UserPlus} label="Leads" />
            <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={Bell} label="Avisos" />
            <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={Database} label="Planos" />
            <TabButton active={activeTab === 'vouchers'} onClick={() => setActiveTab('vouchers')} icon={CreditCard} label="Vouchers" />
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Lojas Totais" value={stats.stores} icon={Store} color="yellow" />
              <StatCard label="Membros Ativos" value={stats.customers} icon={Users} color="blue" />
              <StatCard label="Faturamento Real" value={`R$ ${stats.realRevenueMonth.toLocaleString()}`} icon={DollarSign} color="green" />
              <StatCard label="Projetado" value={`R$ ${stats.projectedRevenueMonth.toLocaleString()}`} icon={TrendingUp} color="purple" />
            </div>

            {/* Quick View Table */}
            <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-brand-yellow" /> Atividade Recente
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="pb-5 px-4">Loja</th>
                      <th className="pb-5 px-4">Status</th>
                      <th className="pb-5 px-4">Vencimento</th>
                      <th className="pb-5 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recentStores.map(store => (
                      <tr key={store.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="py-6 px-4">
                          <p className="text-white font-bold group-hover:text-brand-yellow transition-colors">{store.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{store.category || 'Varejo'}</p>
                        </td>
                        <td className="py-6 px-4">
                          <StatusBadge status={store.subscription_status} />
                        </td>
                        <td className="py-6 px-4">
                          <span className="text-xs font-bold text-slate-300">{store.subscription_expires_at ? new Date(store.subscription_expires_at).toLocaleDateString() : '---'}</span>
                        </td>
                        <td className="py-6 px-4 text-right">
                          <button onClick={() => setActiveTab('stores')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Detalhes</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center">
              <Store className="w-6 h-6 mr-3 text-brand-yellow" /> Todas as Lojas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="pb-5 px-4">Loja / Categoria</th>
                    <th className="pb-5 px-4">Proprietário (ID)</th>
                    <th className="pb-5 px-4">Status</th>
                    <th className="pb-5 px-4">Expira em</th>
                    <th className="pb-5 px-4 text-right">Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allStores.map(store => (
                    <tr key={store.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-6 px-4">
                        <p className="text-white font-bold">{store.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{store.category || 'Varejo'}</p>
                      </td>
                      <td className="py-6 px-4 font-mono text-[10px] text-slate-500">
                        {store.owner_id}
                      </td>
                      <td className="py-6 px-4">
                        <StatusBadge status={store.subscription_status} />
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-xs font-bold text-slate-300">{store.subscription_expires_at ? new Date(store.subscription_expires_at).toLocaleDateString() : 'Sem data'}</span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <button 
                          onClick={() => grantAccess(store.id)}
                          className="bg-brand-yellow/10 text-brand-yellow px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-brand-yellow hover:text-brand-bg transition-all"
                        >
                          +30 Dias (Grátis)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <UserPlus className="w-6 h-6 mr-3 text-blue-500" /> Leads da Landing Page
                </h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Prospectos de Lançamento (3 meses grátis)</p>
              </div>
              <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-xl">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Todos os Canais</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="pb-5 px-4">Empresa / Contato</th>
                    <th className="pb-5 px-4">Interesse</th>
                    <th className="pb-5 px-4">Status</th>
                    <th className="pb-5 px-4">Data</th>
                    <th className="pb-5 px-4 text-right">Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-6 px-4">
                        <p className="text-white font-bold">{lead.business_name}</p>
                        <p className="text-xs text-slate-500">{lead.full_name} • {lead.whatsapp}</p>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg">
                          {lead.category || 'Geral'}
                        </span>
                      </td>
                      <td className="py-6 px-4">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-slate-800 outline-none transition-all ${
                            lead.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                            lead.status === 'contacted' ? 'bg-orange-500/10 text-orange-500' :
                            'bg-green-500/10 text-green-500'
                          }`}
                        >
                          <option value="new">Novo</option>
                          <option value="contacted">Em Contato</option>
                          <option value="converted">Convertido</option>
                        </select>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <a 
                          href={`https://wa.me/55${lead.whatsapp.replace(/\D/g,'')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-green-500/10 text-green-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-500 hover:text-white transition-all"
                        >
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-slate-600 italic text-sm">
                        Nenhum lead capturado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-10 flex items-center">
              <Megaphone className="w-6 h-6 mr-3 text-brand-yellow" /> Comunicados da Plataforma
            </h3>
            
            <form onSubmit={sendNotification} className="space-y-8 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Público Alvo</label>
                  <select 
                    value={notification.target}
                    onChange={(e) => {
                      setNotification({...notification, target: e.target.value});
                      setSelectedUser(null);
                      setSearchQuery('');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all"
                  >
                    <option value="all_merchants">Todos os Parceiros</option>
                    <option value="individual_merchant">Parceiro Individual</option>
                    <option value="all_customers">Todos os Membros</option>
                    <option value="individual_customer">Membro Individual</option>
                  </select>
                </div>

                {(notification.target === 'individual_merchant' || notification.target === 'individual_customer') && (
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      {notification.target === 'individual_merchant' ? 'Buscar Parceiro' : 'Buscar Membro'}
                    </label>
                    <input 
                      type="text"
                      placeholder="Digite nome ou e-mail..."
                      value={selectedUser ? selectedUser.full_name : searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedUser(null);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all"
                    />
                    
                    {searchQuery && !selectedUser && (
                      <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                        {(notification.target === 'individual_merchant' ? allStores : allCustomers)
                          .filter(item => {
                            const name = notification.target === 'individual_merchant' ? item.name : item.full_name;
                            return name?.toLowerCase().includes(searchQuery.toLowerCase());
                          })
                          .map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                if (notification.target === 'individual_merchant') {
                                  setSelectedUser({ id: item.owner_id, full_name: item.name });
                                } else {
                                  setSelectedUser(item);
                                }
                                setSearchQuery('');
                              }}
                              className="w-full text-left px-5 py-4 hover:bg-slate-800 transition-colors flex items-center space-x-3"
                            >
                              <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center text-brand-yellow text-xs font-black">
                                {(notification.target === 'individual_merchant' ? item.name : item.full_name).charAt(0)}
                              </div>
                              <span className="text-sm text-white">{notification.target === 'individual_merchant' ? item.name : item.full_name}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Comunicado</label>
                <input 
                  type="text"
                  value={notification.title}
                  onChange={(e) => setNotification({...notification, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mensagem</label>
                <textarea 
                  rows="4"
                  value={notification.message}
                  onChange={(e) => setNotification({...notification, message: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={sending}
                className="bg-brand-yellow text-brand-bg px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow-yellow hover:scale-105 active:scale-95 transition-all flex items-center"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Send className="w-5 h-5 mr-3" />}
                Disparar Aviso
              </button>
            </form>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-bold text-white flex items-center">
                <Database className="w-6 h-6 mr-3 text-brand-yellow" /> Configuração de Planos
              </h3>
              <button 
                onClick={savePlans}
                className="bg-brand-yellow text-brand-bg px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-glow-yellow"
              >
                Salvar Alterações
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div key={index} className="bg-black/20 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">{plan.id}</span>
                    <TrendingUp className="w-4 h-4 text-slate-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Plano</label>
                    <input 
                      type="text"
                      value={plan.name}
                      onChange={(e) => {
                        const newPlans = [...plans];
                        newPlans[index].name = e.target.value;
                        setPlans(newPlans);
                      }}
                      className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-brand-yellow outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço (R$)</label>
                    <input 
                      type="number"
                      value={plan.price}
                      onChange={(e) => {
                        const newPlans = [...plans];
                        newPlans[index].price = Number(e.target.value);
                        setPlans(newPlans);
                      }}
                      className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-brand-yellow outline-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Recursos Inclusos: {plan.features?.length || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div className="space-y-10">
            <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-10 flex items-center">
                <CreditCard className="w-6 h-6 mr-3 text-brand-yellow" /> Criar Novo Voucher
              </h3>
              
              <form onSubmit={createVoucher} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código do Cupom</label>
                  <input 
                    type="text"
                    placeholder="EX: ZCARD30"
                    value={newVoucher.code}
                    onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dias de Benefício</label>
                  <input 
                    type="number"
                    value={newVoucher.benefit_days}
                    onChange={(e) => setNewVoucher({...newVoucher, benefit_days: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Limite de Usos</label>
                  <input 
                    type="number"
                    value={newVoucher.max_uses}
                    onChange={(e) => setNewVoucher({...newVoucher, max_uses: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-brand-yellow text-brand-bg h-[58px] rounded-2xl font-black uppercase text-xs tracking-widest shadow-glow-yellow hover:scale-105 active:scale-95 transition-all"
                >
                  Gerar Voucher
                </button>
              </form>
            </div>

            <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-8">Cupons Ativos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="pb-5 px-4">Código</th>
                      <th className="pb-5 px-4">Benefício</th>
                      <th className="pb-5 px-4">Usos</th>
                      <th className="pb-5 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {vouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-6 px-4">
                          <span className="bg-brand-yellow/10 text-brand-yellow px-3 py-1 rounded-lg font-mono font-bold">{v.code}</span>
                        </td>
                        <td className="py-6 px-4">
                          <p className="text-white font-bold">{v.benefit_days} Dias Grátis</p>
                        </td>
                        <td className="py-6 px-4">
                          <p className="text-xs text-slate-400">{v.current_uses} de {v.max_uses}</p>
                          <div className="w-24 h-1 bg-slate-800 rounded-full mt-2">
                            <div 
                              className="h-full bg-brand-yellow rounded-full" 
                              style={{ width: `${Math.min((v.current_uses / v.max_uses) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-right">
                          <button 
                            onClick={() => deleteVoucher(v.id)}
                            className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                    {vouchers.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-slate-500 italic">Nenhum voucher criado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers_management' && (
          <div className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Users className="w-6 h-6 mr-3 text-brand-yellow" /> Gestão de Membros
                </h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Controle e visualização de todos os clientes</p>
              </div>
              <div className="flex items-center space-x-2 bg-black/20 p-3 rounded-2xl border border-slate-800">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{allCustomers.length} Membros</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="pb-5 px-4">Membro</th>
                    <th className="pb-5 px-4">ID do Usuário</th>
                    <th className="pb-5 px-4">Cadastro em</th>
                    <th className="pb-5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-6 px-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800 group-hover:border-brand-yellow/30 transition-all shadow-inner">
                            {customer.avatar_url ? (
                              <img src={customer.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-slate-700" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-bold group-hover:text-brand-yellow transition-colors">{customer.full_name || 'Sem Nome'}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Membro / Cliente</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 font-mono text-[10px] text-slate-500">
                        {customer.id}
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-xs font-bold text-slate-300">{new Date(customer.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="py-6 px-4 text-right">
                        <button 
                          onClick={() => {
                            setNotification({ target: 'individual_customer', title: '', message: '' });
                            setSelectedUser({ id: customer.id, full_name: customer.full_name });
                            setActiveTab('notifications');
                          }}
                          className="bg-brand-yellow/10 text-brand-yellow px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-brand-yellow hover:text-brand-bg transition-all shadow-glow-yellow/5"
                        >
                          Enviar Push
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allCustomers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-20 text-center text-slate-600 italic text-sm">
                        Nenhum membro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 sm:px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
        active ? 'bg-blue-500 text-white shadow-glow-blue' : 'text-slate-500 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    yellow: 'text-brand-yellow bg-brand-yellow/10 shadow-glow-yellow/10',
    blue: 'text-blue-500 bg-blue-500/10 shadow-glow-blue/10',
    green: 'text-green-500 bg-green-500/10 shadow-glow-green/10',
    purple: 'text-purple-500 bg-purple-500/10 shadow-glow-purple/10'
  };

  return (
    <div className="bg-brand-surface border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
      <p className="text-3xl font-black text-white mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    ACTIVE: { label: 'Ativo', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    TRIAL: { label: 'Teste', color: 'text-brand-yellow bg-brand-yellow/10 border-brand-yellow/20' },
    OVERDUE: { label: 'Atrasado', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
    default: { label: 'Inativo', color: 'text-slate-600 bg-slate-800' }
  };
  const config = configs[status] || configs.default;
  return (
    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.color}`}>
      {config.label}
    </span>
  );
}
