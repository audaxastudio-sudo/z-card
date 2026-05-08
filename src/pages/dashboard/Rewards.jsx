import React, { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, Edit2, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Rewards() {
  const { store, loading: authLoading } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [newReward, setNewReward] = useState({ name: '', points_needed: 10 });

  useEffect(() => {
    if (!authLoading) {
      if (store?.id) {
        fetchRewards();
      } else {
        setLoading(false);
      }
    }
  }, [store, authLoading]);

  const fetchRewards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });
    
    if (data) setRewards(data);
    setLoading(false);
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    if (!newReward.name || !store?.id) {
      console.error("Nome da recompensa ou ID da loja ausente.");
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('rewards')
        .insert([
          { 
            store_id: store.id, 
            name: newReward.name, 
            points_needed: newReward.points_needed 
          }
        ]);

      if (error) throw error;

      setNewReward({ name: '', points_needed: 10 });
      await fetchRewards();
    } catch (err) {
      console.error("Erro ao adicionar recompensa:", err);
      alert("Erro ao adicionar recompensa. Verifique se você é o dono desta loja.");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateReward = async (e) => {
    e.preventDefault();
    if (!editingReward.name || !store?.id) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ 
          name: editingReward.name, 
          points_needed: editingReward.points_needed 
        })
        .eq('id', editingReward.id);

      if (error) throw error;

      setEditingReward(null);
      await fetchRewards();
    } catch (err) {
      console.error("Erro ao atualizar recompensa:", err);
      alert("Erro ao atualizar recompensa.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteReward = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta recompensa?")) return;
    
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setRewards(rewards.filter(r => r.id !== id));
    } else {
      console.error("Erro ao deletar:", error);
      alert("Não foi possível excluir a recompensa. Verifique se há resgates vinculados a ela.");
    }
  };

  if (!loading && !store) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Gift className="w-16 h-16 text-slate-800 mb-4" />
        <h2 className="text-xl font-bold text-white">Loja não encontrada</h2>
        <p className="text-slate-500 max-w-sm mt-2">
          Não conseguimos encontrar uma loja vinculada à sua conta. 
          Tente sair e entrar novamente ou verifique se o seu cadastro foi concluído.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Configuração de Recompensas</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gerencie os prêmios que seus clientes podem resgatar.</p>
        </div>
      </div>

      {/* Formulário de Adição Rápida */}
      <form onSubmit={handleAddReward} className="bg-brand-surface border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Prêmio</label>
          <input 
            type="text" 
            placeholder="Ex: Café Expresso Grátis"
            value={newReward.name}
            onChange={(e) => setNewReward({...newReward, name: e.target.value})}
            className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-yellow outline-none transition-all"
            required
          />
        </div>
        <div className="w-full md:w-32 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Moedas Z</label>
          <input 
            type="number" 
            value={newReward.points_needed}
            onChange={(e) => setNewReward({...newReward, points_needed: parseInt(e.target.value)})}
            className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-yellow outline-none transition-all"
            required
          />
        </div>
        <button 
          disabled={adding}
          className="w-full md:w-auto px-6 py-2.5 bg-brand-yellow text-brand-bg rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-glow-yellow disabled:opacity-50 flex items-center justify-center min-w-[140px]"
        >
          {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Prêmio'}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-brand-yellow" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-brand-surface border ${reward.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'} rounded-2xl p-6 relative overflow-hidden group`}
            >
              <div className="w-12 h-12 bg-brand-yellow/10 rounded-xl flex items-center justify-center text-brand-yellow mb-4">
                <Gift className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{reward.name}</h3>
              <div className="flex items-center text-brand-yellow font-bold text-[10px] mb-4 uppercase tracking-widest">
                <span className="bg-brand-yellow/10 px-2 py-0.5 rounded-md mr-2">
                  {reward.points_needed} Moedas Z
                </span>
                <span className="text-slate-500 font-medium">• Requisito</span>
              </div>
              
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setEditingReward(reward)}
                  className="flex-1 flex items-center justify-center py-2 px-3 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-2" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteReward(reward.id)}
                  className="flex items-center justify-center p-2 rounded-lg border border-slate-700 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}

          {rewards.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
              Nenhuma recompensa configurada ainda. Comece criando uma acima!
            </div>
          )}
        </div>
      )}

      {/* Dica do Especialista */}
      <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-[2.5rem] p-8 flex items-start shadow-xl">
        <div className="w-12 h-12 bg-brand-yellow/20 rounded-2xl flex items-center justify-center text-brand-yellow mr-6 shrink-0">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-brand-yellow font-black uppercase tracking-[0.2em] mb-2 italic">Dica do Especialista</h4>
          <p className="text-slate-400 text-xs leading-relaxed font-medium">
            Mantenha as primeiras recompensas fáceis de alcançar (ex: 5 a 10 Moedas Z). Isso cria o hábito de resgate no seu cliente e aumenta drasticamente a retenção a longo prazo!
          </p>
        </div>
      </div>
      {/* Modal de Edição */}
      <AnimatePresence>
        {editingReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-black text-white mb-6">Editar Prêmio</h3>
              <form onSubmit={handleUpdateReward} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Prêmio</label>
                  <input 
                    type="text" 
                    value={editingReward.name}
                    onChange={(e) => setEditingReward({...editingReward, name: e.target.value})}
                    className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-yellow outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Moedas Z Necessárias</label>
                  <input 
                    type="number" 
                    value={editingReward.points_needed}
                    onChange={(e) => setEditingReward({...editingReward, points_needed: parseInt(e.target.value)})}
                    className="w-full bg-brand-bg border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-yellow outline-none transition-all"
                    required
                  />
                </div>
                <div className="flex space-x-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingReward(null)}
                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={adding}
                    className="flex-1 py-3 bg-brand-yellow text-brand-bg rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-glow-yellow disabled:opacity-50"
                  >
                    {adding ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
