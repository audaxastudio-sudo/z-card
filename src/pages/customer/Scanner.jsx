import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, Loader2, CheckCircle2, AlertCircle, RefreshCw, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

export default function Scanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('idle'); // idle, success, error, processing
  const [pointsEarned, setPointsEarned] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [storeName, setStoreName] = useState('');
  
  const fileInputRef = useRef(null);
  const readerId = "reader-hidden";

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('processing');
    
    // Técnica Profissional: Redimensionar e pré-processar a imagem via Canvas
    // Isso resolve o problema de fotos gigantes de 12MP que travam o leitor JS
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Redimensionamos para um tamanho ideal de processamento (800px)
        const scale = 800 / Math.max(img.width, img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convertemos o canvas de volta para um Blob/Arquivo
        canvas.toBlob(async (blob) => {
          const processedFile = new File([blob], "processed.png", { type: "image/png" });
          
          try {
            const html5QrCode = new Html5Qrcode(readerId);
            const decodedText = await html5QrCode.scanFile(processedFile, true);
            handleScanSuccess(decodedText);
          } catch (err) {
            // Segunda tentativa sem pré-processamento interno da lib
            try {
              const html5QrCode = new Html5Qrcode(readerId);
              const decodedText = await html5QrCode.scanFile(processedFile, false);
              handleScanSuccess(decodedText);
            } catch (err2) {
              setStatus('error');
              setErrorMessage("Não lemos o código. Dica: Em telas de computador, tire a foto de uma distância de uns 20cm para evitar o brilho excessivo.");
            }
          }
        }, 'image/png');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleScanSuccess = (decodedText) => {
    try {
      console.log("Detectado:", decodedText);
      const url = new URL(decodedText);
      const token = url.searchParams.get('token');
      
      if (token) {
        processToken(token);
      } else {
        const parts = url.pathname.split('/');
        const storeIdx = parts.indexOf('loja');
        if (storeIdx !== -1 && parts[storeIdx + 1]) {
          navigate(`/loja/${parts[storeIdx + 1]}`);
        } else {
          throw new Error("QR Code não reconhecido.");
        }
      }
    } catch (err) {
      // Se não for URL, tenta ler o texto puro como token
      if (decodedText.length > 20) {
        processToken(decodedText);
      } else {
        setStatus('error');
        setErrorMessage("Este código não pertence ao sistema Z-Card.");
      }
    }
  };

  const processToken = async (tokenId) => {
    if (!user) return;
    try {
      const { data: token, error: tokenError } = await supabase.from('point_tokens').select('*, stores(name)').eq('id', tokenId).single();
      if (tokenError || !token) throw new Error("QR Code inválido ou expirado.");
      if (token.is_used) throw new Error("Este código já foi utilizado.");

      const { data: card } = await supabase.from('loyalty_cards').select('*').eq('customer_id', user.id).eq('store_id', token.store_id).maybeSingle();
      let cardId = card?.id;

      if (!card) {
        const { data: nc } = await supabase.from('loyalty_cards').insert({ customer_id: user.id, store_id: token.store_id, stamps_accumulated: 0 }).select().single();
        cardId = nc.id;
      }

      await supabase.from('loyalty_cards').update({ stamps_accumulated: (card?.stamps_accumulated || 0) + token.points_amount }).eq('id', cardId);
      await supabase.from('point_tokens').update({ is_used: true }).eq('id', tokenId);
      await supabase.from('transactions').insert([{ 
        card_id: cardId, 
        type: 'earn', 
        amount: token.points_amount, 
        purchase_amount: token.purchase_amount,
        description: `Cashback: ${token.stores?.name}` 
      }]);

      setPointsEarned(token.points_amount);
      setStoreName(token.stores?.name);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg flex flex-col items-center justify-center p-8 z-[9999]">
      <div id={readerId} className="hidden"></div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm flex flex-col items-center text-center space-y-12">
            <div className="w-32 h-32 bg-brand-yellow/10 rounded-[3rem] flex items-center justify-center border border-brand-yellow/20">
              <QrCode className="w-16 h-16 text-brand-yellow" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Ganhar Moedas</h1>
              <p className="text-slate-500 text-xs font-medium px-4">Tire uma foto nítida do QR Code gerado pelo lojista.</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-brand-yellow text-brand-bg py-6 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-glow-yellow flex items-center justify-center"
            >
              <Camera className="w-6 h-6 mr-3" /> Capturar QR Code
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            <button onClick={() => navigate('/carteira')} className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">Voltar</button>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div className="flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-brand-yellow animate-spin mb-6" />
            <p className="text-white font-black uppercase tracking-widest text-xs italic">Otimizando Imagem...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div className="w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-brand-yellow rounded-full flex items-center justify-center text-brand-bg mb-8 shadow-glow-yellow"><CheckCircle2 className="w-12 h-12" /></div>
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Moedas<br/>Recebidas!</h3>
            <p className="text-brand-yellow font-black text-6xl mt-6">+{pointsEarned}</p>
            <div className="mt-8 p-6 bg-brand-surface border border-slate-800 rounded-[2rem] w-full text-white font-black text-lg">{storeName}</div>
            <button onClick={() => navigate('/carteira')} className="mt-12 w-full bg-brand-yellow text-brand-bg py-5 rounded-2xl font-black uppercase text-xs">Continuar</button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div className="w-full max-w-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6"><AlertCircle className="w-10 h-10" /></div>
            <h3 className="text-xl font-black text-white uppercase italic">Falha na Leitura</h3>
            <p className="text-slate-500 text-xs mt-4 px-6">{errorMessage}</p>
            <button onClick={() => setStatus('idle')} className="mt-10 w-full bg-white/10 text-white py-5 rounded-2xl font-black uppercase text-xs">Tentar Novamente</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
