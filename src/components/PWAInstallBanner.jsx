import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // No iOS, mostramos o banner se não estiver em modo standalone
    if (ios && !window.navigator.standalone) {
      const hasDismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!hasDismissed) {
        setIsVisible(true);
      }
    }

    // No Android/Windows, capturamos o evento de instalação
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!hasDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismissBanner = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:bottom-6 md:left-auto md:right-6 md:w-96"
        >
          <div className="bg-brand-surface border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-brand-yellow/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow"></div>
            
            <button 
              onClick={dismissBanner}
              className="absolute top-3 right-3 text-slate-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-brand-yellow rounded-2xl flex items-center justify-center shrink-0">
                <Download className="w-6 h-6 text-brand-bg" />
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="text-white font-bold text-sm">Instalar Z-Card</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Tenha acesso rápido e receba notificações de prêmios direto no seu celular.
                </p>

                {isIOS ? (
                  <div className="mt-4 flex flex-col space-y-2 bg-brand-bg/50 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                      <Share className="w-3 h-3 mr-2 text-brand-yellow" /> 1. Toque em Compartilhar
                    </div>
                    <div className="flex items-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                      <PlusSquare className="w-3 h-3 mr-2 text-brand-yellow" /> 2. Adicionar à Tela de Início
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleInstall}
                    className="mt-4 w-full bg-brand-yellow text-brand-bg py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-glow-yellow"
                  >
                    Instalar Agora <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
