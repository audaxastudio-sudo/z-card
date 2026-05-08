import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { ShoppingBag, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerDisplay() {
  const { store, user } = useAuth();
  const navigate = useNavigate();
  
  // URL dinâmica para o QR Code (usa o domínio atual, seja localhost, IP ou produção)
  const baseUrl = window.location.origin;
  const storeUrl = store ? `${baseUrl}/loja/${store.id}?qr=1` : `${baseUrl}/loading`;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-between p-4 md:p-6 relative overflow-x-hidden">
      
      {/* Botão de Voltar (Aparece apenas se o lojista estiver logado) */}
      {user && (
        <button 
          onClick={() => navigate('/dashboard')}
          className="absolute top-6 right-6 z-50 flex items-center space-x-2 bg-brand-surface/50 hover:bg-brand-surface border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl transition-all group backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Painel de Controle</span>
        </button>
      )}

      {/* Background Decorativo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow rounded-full mix-blend-screen filter blur-[150px] opacity-5 -z-10 pointer-events-none"></div>
      
      {/* Container Principal */}
      <div className="flex-1 w-full max-w-7xl flex flex-col justify-center py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Lado Esquerdo: Info e Call to Action */}
          <div className="text-center lg:text-left flex flex-col justify-center space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-surface border border-slate-800 rounded-xl p-1.5 flex items-center justify-center shadow-glow-yellow">
                  <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white tracking-widest uppercase opacity-80">Z-Card App</h2>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-4">
                ESCANEIE PARA <br />
                <span className="text-brand-yellow drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] uppercase">GANHAR PONTOS</span>
              </h1>
              
              <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto lg:mx-0">
                Transforme suas compras em experiências incríveis. Escaneie e comece a pontuar agora!
              </p>
            </motion.div>

            {/* Pedido Atual (Compacto) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-brand-surface border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden max-w-md mx-auto lg:mx-0 w-full"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-yellow"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2 text-slate-300">
                  <ShoppingBag className="w-4 h-4 text-brand-yellow" />
                  <span className="font-bold uppercase tracking-widest text-xs">Seu Pedido</span>
                </div>
                <span className="text-slate-500 text-[10px]">#9842-X</span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-white text-sm font-medium">
                  <span>Café Expresso x1</span>
                  <span>R$ 8,00</span>
                </div>
                <div className="flex justify-between text-white text-sm font-medium">
                  <span>Bolo de Cenoura x1</span>
                  <span>R$ 12,00</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-0.5">Você vai ganhar</p>
                  <p className="text-xl md:text-2xl font-bold text-brand-yellow">+20 pontos</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-0.5">Total</p>
                  <p className="text-xl md:text-2xl font-bold text-white">R$ 20,00</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Lado Direito: QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex flex-col items-center justify-center py-4 lg:py-0"
          >
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_0_80px_rgba(255,215,0,0.2)] relative group transition-transform hover:scale-105 duration-500">
              <QRCodeSVG 
                value={storeUrl} 
                size={220} // Tamanho reduzido para telas menores
                className="md:w-[280px] md:h-[280px] lg:w-[320px] lg:h-[320px]"
                level={"H"} 
                includeMargin={false}
                imageSettings={{
                  src: "/Logo.png",
                  x: undefined,
                  y: undefined,
                  height: 50,
                  width: 50,
                  excavate: true,
                }}
              />
              
              {/* Cantoneiras Decorativas */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-brand-yellow rounded-tl-2xl"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-brand-yellow rounded-tr-2xl"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-brand-yellow rounded-bl-2xl"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-brand-yellow rounded-br-2xl"></div>
            </div>
            
            <div className="mt-8 flex items-center space-x-3 text-slate-500">
              <span className="h-px w-6 bg-slate-800"></span>
              <p className="text-xs tracking-[0.3em] uppercase text-center">Abra sua câmera para escanear</p>
              <span className="h-px w-6 bg-slate-800"></span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Footer / Branding */}
      <div className="w-full text-center py-4 text-slate-700 text-[10px] tracking-[0.2em] uppercase mt-auto">
        Sistema Audaxa de Fidelização Digital © 2026
      </div>
    </div>
  );
}
