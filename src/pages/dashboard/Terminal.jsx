import React, { useState, useEffect } from 'react';
import { ShoppingCart, Coins, QrCode, ArrowRight, CheckCircle2, Loader2, X, Ticket, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';

export default function Terminal() {
  const { store } = useAuth();
  const [activeTab, setActiveTab] = useState('issue'); // 'issue' ou 'redeem'
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState(null); // { success: boolean, message: string, data?: any }
  
  const scannerId = "terminal-scanner-reader";

  // Regra de negócio: Cashback
  const percent = store?.cashback_percent || 10;
  const calculatedPoints = Math.floor(parseFloat(amount || 0) * (percent / 100));

  useEffect(() => {
    let html5QrCode = null;

    if (scanning && activeTab === 'redeem') {
      html5QrCode = new Html5Qrcode(scannerId);
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleScanRedeem(decodedText);
          if (html5QrCode) {
            html5QrCode.stop().catch(err => console.error(err));
          }
        },
        (errorMessage) => {
          // Apenas erros de leitura contínuos, não disparar alert
        }
      ).catch(err => {
        console.error("Erro ao iniciar câmera:", err);
        setScanning(false);
        alert("Erro ao acessar câmera. Verifique as permissões.");
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error(err));
      }
    };
  }, [scanning, activeTab]);

  const handleGeneratePoints = async (e) => {
    e.preventDefault();
    if (!amount || calculatedPoints <= 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('point_tokens')
        .insert([
          { 
            store_id: store.id, 
            points_amount: calculatedPoints,
            purchase_amount: parseFloat(amount)
          }
        ])
        .select()
        .single();

      if (error) throw error;
      setGeneratedToken(data);
    } catch (err) {
      console.error("Erro ao gerar pontos:", err);
      alert("Erro ao gerar QR Code. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleScanRedeem = async (transactionId) => {
    if (!transactionId || loading) return;

    setScanning(false);
    setLoading(true);
    setRedeemStatus(null);

    try {
      // 1. Buscar a transação para verificar se é válida e pertence a esta loja
      const { data: trans, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          loyalty_cards (store_id)
        `)
        .eq('id', transactionId)
        .single();

      if (fetchError || !trans) throw new Error("Ticket inválido ou não encontrado.");
      
      // Verificar se a transação é desta loja
      if (trans.loyalty_cards.store_id !== store.id) {
        throw new Error("Este ticket pertence a outra loja.");
      }

      // Verificar status
      if (trans.status === 'completed') {
        throw new Error("Este prêmio já foi entregue anteriormente.");
      }

      if (trans.type !== 'redeem') {
        throw new Error("Este código não é um ticket de resgate.");
      }

      // 2. Marcar como completada
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      setRedeemStatus({ 
        success: true, 
        message: "Resgate validado com sucesso! Entregue o prêmio ao cliente.",
        data: trans
      });

    } catch (err) {
      setRedeemStatus({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Terminal de Operações</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Gerencie cashback e resgates de prêmios.</p>
        </div>

        {/* Abas */}
        <div className="flex bg-brand-surface p-1 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('issue')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'issue' ? 'bg-brand-yellow text-brand-bg shadow-glow-yellow' : 'text-slate-500 hover:text-white'}`}
          >
            <Coins className="w-4 h-4" />
            <span>Emitir Moedas</span>
          </button>
          <button 
            onClick={() => setActiveTab('redeem')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'redeem' ? 'bg-brand-yellow text-brand-bg shadow-glow-yellow' : 'text-slate-500 hover:text-white'}`}
          >
            <Ticket className="w-4 h-4" />
            <span>Validar Resgate</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Lógica da Aba de Emissão */}
        {activeTab === 'issue' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-brand-surface border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl"
          >
            <div className="w-12 h-12 bg-brand-yellow/10 rounded-2xl flex items-center justify-center text-brand-yellow">
              <ShoppingCart className="w-6 h-6" />
            </div>
            
            <form onSubmit={handleGeneratePoints} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Valor da Compra (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-brand-bg border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-2xl font-black text-white focus:border-brand-yellow outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-black/40 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Coins className="w-5 h-5 text-brand-yellow" />
                  <span className="text-sm font-medium text-slate-300">Cashback Estimado:</span>
                </div>
                <span className="text-xl font-black text-brand-yellow">{calculatedPoints} Moedas Z</span>
              </div>

              <button 
                disabled={loading || calculatedPoints <= 0}
                className="w-full py-4 bg-brand-yellow text-brand-bg rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow-yellow disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><QrCode className="w-5 h-5" /><span>Gerar QR Code</span></>}
              </button>
            </form>
          </motion.div>
        )}

        {/* Lógica da Aba de Resgate */}
        {activeTab === 'redeem' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-brand-surface border border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-xl"
          >
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
              <Ticket className="w-6 h-6" />
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Validar Ticket do Cliente</h3>
              <p className="text-slate-500 text-sm">Escaneie o QR Code que o cliente apresenta no celular ao solicitar um prêmio.</p>
              
              {!scanning && !redeemStatus && (
                <button 
                  onClick={() => setScanning(true)}
                  className="w-full py-12 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-3 hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all group"
                >
                  <ScanLine className="w-10 h-10 text-slate-700 group-hover:text-brand-yellow" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Abrir Scanner</span>
                </button>
              )}

              {scanning && (
                <div className="rounded-3xl overflow-hidden border-2 border-brand-yellow shadow-glow-yellow/20 relative">
                  <div id={scannerId} className="w-full aspect-square bg-black"></div>
                  <button 
                    onClick={() => setScanning(false)}
                    className="absolute top-4 right-4 bg-black/80 p-2 rounded-full text-white z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {redeemStatus && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-6 rounded-3xl border ${redeemStatus.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {redeemStatus.success ? (
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    ) : (
                      <X className="w-12 h-12 text-red-500" />
                    )}
                    <div>
                      <p className={`font-black uppercase tracking-widest text-xs mb-1 ${redeemStatus.success ? 'text-green-500' : 'text-red-500'}`}>
                        {redeemStatus.success ? 'Sucesso!' : 'Erro na Validação'}
                      </p>
                      <p className="text-white text-sm font-medium">{redeemStatus.message}</p>
                    </div>
                    {redeemStatus.data && (
                      <div className="bg-black/40 p-4 rounded-2xl w-full">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Prêmio</p>
                        <p className="text-white font-bold">{redeemStatus.data.description.replace('Resgate: ', '')}</p>
                      </div>
                    )}
                    <button 
                      onClick={() => setRedeemStatus(null)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Dicas / Preview */}
        <div className="space-y-6">
          <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-[2rem] p-8">
            <h3 className="text-brand-yellow font-bold text-lg mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Dica do Z-Card
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {activeTab === 'issue' 
                ? "Sempre confira o valor total da compra antes de gerar o QR Code. O cashback incentiva o cliente a voltar mais vezes!"
                : "A validação do resgate é fundamental para garantir que o prêmio seja entregue apenas uma vez. Escaneie o ticket do cliente para dar baixa no sistema."}
            </p>
          </div>
        </div>
      </div>

      {/* Modal do QR Code Gerado (Aba Issue) */}
      <AnimatePresence>
        {generatedToken && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-brand-surface border border-brand-yellow/30 rounded-[3rem] p-10 max-w-sm w-full text-center relative shadow-2xl"
            >
              <button 
                onClick={() => setGeneratedToken(null)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <p className="text-brand-yellow font-black uppercase tracking-[0.2em] text-xs">Cashback Z-Card</p>
                <h2 className="text-3xl font-black text-white mt-2">{generatedToken.points_amount} Moedas Z</h2>
              </div>

              <div className="bg-white p-6 rounded-[2rem] inline-block shadow-glow-yellow/20">
                <QRCodeSVG 
                  value={`${window.location.origin}/escanear?token=${generatedToken.id}`} 
                  size={240}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="mt-8 space-y-2">
                <p className="text-white font-bold">Peça para o cliente escanear</p>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Este código expira em 24 horas</p>
              </div>

              <button 
                onClick={() => {
                  setGeneratedToken(null);
                  setAmount('');
                }}
                className="mt-10 w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all"
              >
                Concluir Venda
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
