import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, ShieldCheck, AlertTriangle, Loader2, CheckCircle, ExternalLink, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function Billing() {
  const { store, user, fetchUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pixInfo, setPixInfo] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherSuccess, setVoucherSuccess] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.from('platform_config').select('*').eq('key', 'subscription_plans').single();
      if (error) throw error;
      if (data) {
        setPlans(data.value);
        setSelectedPlan(data.value[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
      setError("Não foi possível carregar os planos. Verifique a tabela platform_config.");
    }
  };

  const handleCreateSubscription = async (billingType = 'PIX') => {
    if (!selectedPlan) return;
    if (!store?.id || !store?.name) {
      setError("Dados da loja ainda não carregados. Por favor, aguarde um momento.");
      return;
    }

    const hasTaxId = store.person_type === 'PF' ? store.cpf : store.cnpj;
    if (!hasTaxId || !store.address) {
      setError("Seu perfil está incompleto. Por favor, acesse 'Configurações' e preencha seu CPF/CNPJ e Endereço antes de assinar.");
      return;
    }
    
    setLoading(true);
    setError('');
    setPixInfo(null);
    setInvoiceUrl(null);

    try {
      let asaasCustomerId = store.asaas_customer_id;

      if (!asaasCustomerId) {
        const cleanCpfCnpj = (store.person_type === 'PF' ? store.cpf : store.cnpj)?.replace(/\D/g, '');
        const cleanPhone = store.whatsapp?.replace(/\D/g, '');
        const cleanPostalCode = store.postal_code?.replace(/\D/g, '');
        
        // Fallback robusto para o nome
        const merchantName = store.person_type === 'PF' 
          ? (store.full_name || store.name) 
          : (store.corporate_name || store.name);

        const { data: customerData, error: customerError } = await supabase.functions.invoke('asaas-create-customer', {
          body: { 
            store_id: store.id, 
            name: merchantName, 
            email: user.email,
            cpfCnpj: cleanCpfCnpj,
            address: store.address,
            addressNumber: store.address_number,
            complement: store.complement,
            province: store.neighborhood,
            postalCode: cleanPostalCode,
            phone: cleanPhone,
            mode: import.meta.env.VITE_ASAAS_MODE || 'sandbox'
          }
        });

        if (customerError) {
          let errorMessage = 'Erro ao criar cliente no Asaas';
          try {
            const body = await customerError.context?.json();
            errorMessage = body?.error || customerError.message || errorMessage;
          } catch (e) {
            errorMessage = customerError.message || errorMessage;
          }
          throw new Error(errorMessage);
        }
        asaasCustomerId = customerData.asaas_customer_id;
      }

      const { data: subData, error: subError } = await supabase.functions.invoke('asaas-create-subscription', {
        body: { 
          store_id: store.id, 
          asaas_customer_id: asaasCustomerId, 
          billingType: billingType, 
          value: selectedPlan.price,
          cycle: selectedPlan.cycle,
          mode: import.meta.env.VITE_ASAAS_MODE || 'sandbox'
        }
      });

      if (subError) {
        let subErrorMessage = 'Erro ao criar assinatura';
        try {
          const body = await subError.context?.json();
          subErrorMessage = body?.error || subError.message || subErrorMessage;
        } catch (e) {
          subErrorMessage = subError.message || subErrorMessage;
        }
        throw new Error(subErrorMessage);
      }

      // Armazenar link de pagamento como fallback
      if (subData.invoiceUrl) {
        setInvoiceUrl(subData.invoiceUrl);
      }

      if (billingType === 'PIX' && subData.pixData) {
        setPixInfo(subData.pixData);
        setShowPaymentModal(true);
      } else if (subData.invoiceUrl) {
        // Tentar abrir em nova aba
        const win = window.open(subData.invoiceUrl, '_blank');
        if (!win) {
          alert("O navegador bloqueou o popup de pagamento. Clique no botão 'Pagar Agora' que apareceu na tela.");
        } else {
          alert(`Assinatura ${selectedPlan.name} gerada! Complete o pagamento na aba aberta.`);
        }
      } else {
        alert(`Assinatura ${selectedPlan.name} gerada com sucesso!`);
      }
      
      if (user?.id) await fetchUserData(user.id);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao gerar assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    setVoucherLoading(true);
    setError('');
    setVoucherSuccess('');

    try {
      const { data, error: rpcError } = await supabase.rpc('apply_voucher', {
        voucher_code: voucherCode.toUpperCase().trim(),
        store_id: store.id
      });

      if (rpcError) throw rpcError;

      if (data.success) {
        setVoucherSuccess(data.message);
        setVoucherCode('');
        if (user?.id) await fetchUserData(user.id);
        setTimeout(() => setVoucherSuccess(''), 5000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao aplicar voucher. Tente novamente.");
    } finally {
      setVoucherLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'ACTIVE': return { text: 'Ativa', color: 'text-green-500', bg: 'bg-green-500/10', icon: <CheckCircle className="w-5 h-5 text-green-500" /> };
      case 'TRIAL': return { text: 'Período de Teste', color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', icon: <ShieldCheck className="w-5 h-5 text-brand-yellow" /> };
      case 'OVERDUE': return { text: 'Pagamento Atrasado', color: 'text-red-500', bg: 'bg-red-500/10', icon: <AlertTriangle className="w-5 h-5 text-red-500" /> };
      case 'AWAITING_PAYMENT': return { text: 'Aguardando Pagamento', color: 'text-brand-yellow', bg: 'bg-brand-yellow/10', icon: <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" /> };
      default: return { text: 'Cancelada', color: 'text-slate-500', bg: 'bg-slate-800', icon: <AlertTriangle className="w-5 h-5 text-slate-500" /> };
    }
  };

  const currentStatus = getStatusDisplay(store?.subscription_status || 'TRIAL');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center tracking-tight">
          <CreditCard className="w-8 h-8 mr-3 text-brand-yellow" /> Faturamento Z-Card
        </h1>
        <p className="text-slate-400 mt-1">Gerencie sua assinatura e escolha o melhor plano para seu negócio.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3" />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Card Status */}
        <div className="lg:col-span-1 bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl h-fit">
          <h3 className="text-white font-bold text-lg mb-6">Status Atual</h3>
          <div className="flex items-center space-x-4 mb-8">
            <div className={`p-4 rounded-2xl ${currentStatus.bg}`}>{currentStatus.icon}</div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Situação</p>
              <p className={`text-xl font-black ${currentStatus.color}`}>{currentStatus.text}</p>
            </div>
          </div>
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Loja</span>
              <span className="text-white font-bold">{store?.name}</span>
            </div>
            {store?.trial_until && store.subscription_status !== 'ACTIVE' && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expiração do Teste</span>
                <span className="text-brand-yellow font-bold">{new Date(store.trial_until).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
            {store?.subscription_expires_at && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Próximo Vencimento</span>
                <span className="text-white font-bold">{new Date(store.subscription_expires_at).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Seleção de Planos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`cursor-pointer bg-brand-surface border-2 rounded-[2rem] p-8 transition-all relative overflow-hidden ${selectedPlan?.id === plan.id ? 'border-brand-yellow shadow-glow-yellow/10' : 'border-slate-800 hover:border-slate-700'}`}
              >
                {selectedPlan?.id === plan.id && (
                  <div className="absolute top-4 right-4 text-brand-yellow"><CheckCircle className="w-6 h-6" /></div>
                )}
                <h4 className="text-white font-black text-xl mb-1">{plan.name}</h4>
                <p className="text-slate-500 text-xs font-bold uppercase mb-6 tracking-widest">{plan.cycle === 'YEARLY' ? 'Faturamento Anual' : 'Faturamento Mensal'}</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-white text-3xl font-black">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-slate-500 text-sm">{plan.cycle === 'YEARLY' ? '/ano' : '/mês'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-brand-surface border border-slate-800 rounded-[2rem] p-8 shadow-2xl">
            <h3 className="text-white font-bold mb-6">Forma de Pagamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleCreateSubscription('PIX')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-brand-yellow transition-all group"
              >
                <QrCode className="w-8 h-8 text-brand-yellow mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-white font-bold text-sm">PIX</span>
              </button>
              <button 
                onClick={() => handleCreateSubscription('CREDIT_CARD')}
                disabled={loading}
                className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-brand-yellow transition-all group"
              >
                <CreditCard className="w-8 h-8 text-brand-yellow mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-white font-bold text-sm">Cartão</span>
              </button>
            </div>
            {loading && <div className="mt-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /></div>}
            
            {invoiceUrl && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-brand-yellow/10 border border-brand-yellow/20 rounded-3xl text-center space-y-4"
              >
                <div className="flex items-center justify-center space-x-2 text-brand-yellow">
                  <ExternalLink className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-widest">Pagamento Gerado</span>
                </div>
                <p className="text-slate-400 text-xs">Se a página de pagamento não abriu, use o botão abaixo:</p>
                <a 
                  href={invoiceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block w-full py-4 bg-brand-yellow text-brand-bg rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow-yellow"
                >
                  Pagar Agora
                </a>
              </motion.div>
            )}
          </div>

          {/* Voucher Section */}
          <div className="bg-brand-surface border border-slate-800 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-yellow/10 transition-colors"></div>
            
            <h3 className="text-white font-bold mb-2 flex items-center">
              Possui um Cupom?
            </h3>
            <p className="text-slate-500 text-xs mb-6">Insira um código de desconto ou voucher de degustação.</p>
            
            <form onSubmit={handleApplyVoucher} className="flex gap-4">
              <input 
                type="text"
                placeholder="CÓDIGO AQUI"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="flex-1 bg-black/40 border border-slate-800 rounded-2xl px-5 py-4 text-sm text-white focus:border-brand-yellow outline-none transition-all uppercase font-mono tracking-widest"
              />
              <button 
                type="submit"
                disabled={voucherLoading || !voucherCode.trim()}
                className="bg-slate-800 hover:bg-brand-yellow hover:text-brand-bg text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
              >
                {voucherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
              </button>
            </form>

            {voucherSuccess && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-xs font-bold text-center"
              >
                ✓ {voucherSuccess}
              </motion.div>
            )}
          </div>
        </div>
        </div>

      </div>

      {/* Modal de Pagamento PIX */}
      {showPaymentModal && pixInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-surface border border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative"
          >
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <AlertTriangle className="w-6 h-6 rotate-45" />
            </button>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-brand-yellow/10 rounded-2xl flex items-center justify-center mx-auto">
                <QrCode className="w-8 h-8 text-brand-yellow" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Pagamento via PIX</h3>
                <p className="text-slate-400 text-sm mt-2">Escaneie o QR Code abaixo para ativar seu plano.</p>
              </div>

              <div className="bg-white p-4 rounded-3xl mx-auto w-fit shadow-glow-yellow/10">
                <img src={`data:image/png;base64,${pixInfo.encodedImage}`} alt="QR Code PIX" className="w-48 h-48" />
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-left ml-1">Código Copia e Cola</p>
                <div className="flex items-center space-x-2">
                  <input 
                    readOnly
                    value={pixInfo.payload}
                    className="flex-1 bg-transparent text-xs text-white font-mono outline-none truncate"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(pixInfo.payload);
                      alert("Código copiado!");
                    }}
                    className="bg-brand-yellow/10 text-brand-yellow p-2 rounded-lg hover:bg-brand-yellow/20 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-brand-yellow text-brand-bg rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                Já realizei o pagamento
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
