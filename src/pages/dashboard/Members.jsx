import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Clock, Wallet, User as UserIcon, Loader2, MinusCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Formatadores de data nativos do JS
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' });
const monthYearFormatter = new Intl.DateTimeFormat('pt-BR', { month: '2-digit', year: 'numeric' });

export default function Members() {
  const { store } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, totalCoins: 0, activeLast7Days: 0 });
  const location = useLocation();
  
  // Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    // Verificar se há uma busca vinda do header global
    const params = new URLSearchParams(location.search);
    const query = params.get('search');
    if (query) {
      setSearchTerm(query);
    }
    
    if (store) {
      fetchMembers();
      fetchRewards();

      // [INÍCIO REALTIME]
      const channel = supabase
        .channel('members_realtime')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'loyalty_cards',
          filter: `store_id=eq.${store.id}`
        }, () => {
          fetchMembers(); 
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
      // [FIM REALTIME]
    }
  }, [store, location.search]);

  const fetchRewards = async () => {
    const { data } = await supabase.from('rewards').select('*').eq('store_id', store.id).eq('is_active', true);
    if (data) setRewards(data);
  };

  const fetchMembers = async () => {
    try {
      if (members.length === 0) setLoading(true);
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select(`*, profiles:customer_id (full_name, avatar_url)`)
        .eq('store_id', store.id)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
      const totalCoins = data.reduce((acc, curr) => acc + (curr.stamps_accumulated || 0), 0);
      const activeLast7Days = data.filter(m => new Date(m.last_activity) >= sevenDaysAgo).length;

      setStats({ total: data.length, totalCoins, activeLast7Days });
    } catch (err) {
      console.error("Erro ao buscar membros:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward) => {
    if (!selectedMember) return;
    
    if (selectedMember.stamps_accumulated < reward.points_needed) {
      alert('O cliente não tem saldo suficiente para esta recompensa.');
      return;
    }

    const confirm = window.confirm(`Deseja resgatar "${reward.name}" debitando ${reward.points_needed} Moedas Z do cliente ${selectedMember.profiles?.full_name}?`);
    if (!confirm) return;

    setRedeemLoading(true);
    try {
      // 1. Criar transação
      const { error: txError } = await supabase.from('transactions').insert([{
        card_id: selectedMember.id,
        type: 'redeem',
        amount: reward.points_needed,
        description: `Resgate: ${reward.name}`
      }]);

      if (txError) throw txError;

      // 2. Atualizar saldo
      const novoSaldo = selectedMember.stamps_accumulated - reward.points_needed;
      const { error: updateError } = await supabase.from('loyalty_cards')
        .update({ stamps_accumulated: novoSaldo, last_activity: new Date().toISOString() })
        .eq('id', selectedMember.id);

      if (updateError) throw updateError;

      alert('Resgate realizado com sucesso!');
      setSelectedMember(null);
      fetchMembers(); // recarrega a lista
    } catch (err) {
      console.error(err);
      alert('Erro ao realizar o resgate.');
    } finally {
      setRedeemLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && members.length === 0) {
    return <div className="flex justify-center h-64 items-center"><Loader2 className="w-8 h-8 text-brand-yellow animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center">
            <Users className="w-8 h-8 mr-3 text-brand-yellow" /> Clientes
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-brand-surface border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
            <Users className="w-8 h-8 text-brand-yellow" />
            <div><p className="text-[10px] text-slate-500 uppercase">Clientes</p><p className="text-xl text-white font-black">{stats.total}</p></div>
          </div>
          <div className="bg-brand-surface border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
            <Wallet className="w-8 h-8 text-brand-yellow" />
            <div><p className="text-[10px] text-slate-500 uppercase">Moedas Z Circulando</p><p className="text-xl text-white font-black">{stats.totalCoins}</p></div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-3 text-slate-500 w-5 h-5" />
        <input 
          type="text" placeholder="Buscar por nome do cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-brand-surface border border-slate-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:border-brand-yellow outline-none"
        />
      </div>

      {/* Tabela */}
      <div className="bg-brand-surface border border-slate-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800"><th className="px-8 py-4 text-xs text-slate-500">Cliente</th><th className="px-8 py-4 text-xs text-slate-500">Saldo Atual</th><th className="px-8 py-4 text-xs text-slate-500 text-right">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-slate-800/30">
                <td className="px-8 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                      {member.profiles?.avatar_url ? <img src={member.profiles.avatar_url} className="w-full h-full object-cover"/> : <UserIcon className="text-slate-600"/>}
                    </div>
                    <div><p className="text-white font-bold">{member.profiles?.full_name}</p><p className="text-[10px] text-slate-500">
                      {member.last_activity ? `Ativo ${dateFormatter.format(new Date(member.last_activity))}` : 'Novo Membro'}
                    </p></div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className="text-xl font-black text-brand-yellow">{member.stamps_accumulated}</span> <span className="text-xs text-brand-yellow/50">Moedas Z</span>
                </td>
                <td className="px-8 py-4 text-right">
                  <button onClick={() => setSelectedMember(member)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center inline-flex">
                    <MinusCircle className="w-4 h-4 mr-2 text-brand-yellow" /> Dar Baixa (Resgate)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Resgate */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-slate-800 rounded-[2rem] w-full max-w-lg p-8 relative">
            <button onClick={() => setSelectedMember(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6"/></button>
            <h2 className="text-2xl font-black text-white mb-2">Resgatar Prêmio</h2>
            <p className="text-slate-400 text-sm mb-6">Cliente: <strong className="text-brand-yellow">{selectedMember.profiles?.full_name}</strong> (Saldo: {selectedMember.stamps_accumulated} Moedas Z)</p>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {rewards.map(reward => {
                const canRedeem = selectedMember.stamps_accumulated >= reward.points_needed;
                return (
                  <div key={reward.id} className={`p-4 border rounded-2xl flex items-center justify-between ${canRedeem ? 'border-slate-700 bg-slate-800/50' : 'border-slate-800/50 bg-slate-900/50 opacity-60'}`}>
                    <div>
                      <h4 className="text-white font-bold">{reward.name}</h4>
                      <p className="text-xs text-brand-yellow font-bold mt-1">Custa: {reward.points_needed} Moedas Z</p>
                    </div>
                    <button 
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem || redeemLoading}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${canRedeem ? 'bg-brand-yellow text-brand-bg hover:scale-105' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                    >
                      {redeemLoading ? '...' : 'Confirmar'}
                    </button>
                  </div>
                )
              })}
              {rewards.length === 0 && <p className="text-center text-slate-500">Esta loja ainda não cadastrou prêmios.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
