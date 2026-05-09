import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wallet, Search, User, QrCode, Gift, Bell, X, Check, LogOut, Settings, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import PushNotificationManager from '../PushNotificationManager';
import PWAInstallBanner from '../PWAInstallBanner';

const navItemsLeft = [
  { name: 'Carteira', icon: Wallet, path: '/carteira' },
  { name: 'Explorar', icon: Search, path: '/explorar' },
];

const navItemsRight = [
  { name: 'Prêmios', icon: Gift, path: '/premios' },
  { name: 'Perfil', icon: User, path: '/perfil' },
];

export default function CustomerLayout({ children }) {
  const { user, profile, isProfileComplete, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      // Bloqueio se o perfil estiver incompleto (Exceto na própria tela de perfil)
      // Bloqueio se o perfil estiver incompleto (Apenas se os dados já carregaram e não estiver na própria tela de perfil)
      if (profile && (profile.role !== 'customer' || profile.whatsapp !== undefined) && !isProfileComplete && location.pathname !== '/perfil') {
        navigate('/perfil');
      }

      fetchNotifications();

      const channel = supabase
        .channel('realtime_notifications')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isProfileComplete, location.pathname]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
    }
  };

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col relative">
      <PushNotificationManager />
      <PWAInstallBanner />
      <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto bg-brand-bg shadow-2xl relative min-h-screen border-x border-slate-900/50">
        
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 bg-brand-bg/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-900">
          <div className="flex items-center space-x-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-bg p-2 border border-slate-800 shadow-inner cursor-pointer" onClick={() => navigate('/carteira')}>
              <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Botão de Notificações */}
            <button 
              onClick={() => setShowNotifications(true)}
              className="w-11 h-11 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-brand-yellow transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-yellow rounded-full border-2 border-brand-bg shadow-glow-yellow"></span>
              )}
            </button>

            {/* Perfil Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-11 h-11 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center text-sm font-bold text-brand-yellow overflow-hidden transition-all active:scale-90"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.charAt(0).toUpperCase()
                )}
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40 bg-black/20" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-52 bg-brand-surface border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Membro</p>
                        <p className="text-xs font-bold text-white truncate">{profile?.full_name || user?.email}</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => { navigate('/perfil'); setShowProfileMenu(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <User className="w-4 h-4 text-brand-yellow" />
                          <span className="font-bold uppercase tracking-widest">Meu Perfil</span>
                        </button>
                        <button 
                          onClick={() => { navigate('/perfil'); setShowProfileMenu(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <Settings className="w-4 h-4 text-brand-yellow" />
                          <span className="font-bold uppercase tracking-widest">Configurações</span>
                        </button>
                      </div>
                      <div className="p-2 border-t border-slate-800">
                        <button 
                          onClick={() => { signOut(); setShowProfileMenu(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-bold uppercase tracking-widest">Sair da Conta</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-28 p-6">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-brand-surface/90 backdrop-blur-xl border-t border-slate-800/50 px-8 py-4 z-40 rounded-t-[2rem]">
          <div className="flex items-center justify-between relative max-w-md mx-auto">
            
            <div className="flex space-x-8">
              {navItemsLeft.map((item) => {
                const isActive = location.pathname === item.path;
                const isDisabled = !isProfileComplete && item.path !== '/perfil';
                return (
                  <Link
                    key={item.name}
                    to={isDisabled ? '#' : item.path}
                    className={`flex flex-col items-center space-y-1 transition-all ${
                      isActive ? 'text-brand-yellow scale-110' : isDisabled ? 'text-slate-800 opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    onClick={(e) => {
                      if (isDisabled) e.preventDefault();
                    }}
                  >
                    <item.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-glow-yellow' : ''}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 -top-14">
              <Link 
                to={!isProfileComplete ? '#' : "/escanear"}
                className={`w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(255,215,0,0.4)] border-4 border-brand-bg active:scale-90 transition-transform hover:rotate-12 ${!isProfileComplete ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                onClick={(e) => {
                  if (!isProfileComplete) e.preventDefault();
                }}
              >
                <QrCode className="w-8 h-8 text-brand-bg" />
              </Link>
            </div>

            <div className="flex space-x-8">
              {navItemsRight.map((item) => {
                const isActive = location.pathname === item.path;
                const isDisabled = !isProfileComplete && item.path !== '/perfil';
                return (
                  <Link
                    key={item.name}
                    to={isDisabled ? '#' : item.path}
                    className={`flex flex-col items-center space-y-1 transition-all ${
                      isActive ? 'text-brand-yellow scale-110' : isDisabled ? 'text-slate-800 opacity-50 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    onClick={(e) => {
                      if (isDisabled) e.preventDefault();
                    }}
                  >
                    <item.icon className={`w-6 h-6 ${isActive ? 'drop-shadow-glow-yellow' : ''}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Panel de Notificações */}
        <AnimatePresence>
          {showNotifications && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-brand-surface border-l border-slate-800 z-[70] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Notificações</h2>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      {unreadCount} novas mensagens
                    </p>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="p-3 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer relative group ${
                        notif.is_read ? 'bg-brand-bg/50 border-slate-900 opacity-60' : 'bg-brand-bg border-slate-800 shadow-xl border-l-brand-yellow border-l-4'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-bold text-sm leading-tight pr-4">{notif.title}</h4>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-brand-yellow rounded-full shadow-glow-yellow shrink-0"></div>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{notif.message}</p>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {!notif.is_read && (
                          <div className="flex items-center text-brand-yellow text-[9px] font-black uppercase tracking-widest group-hover:opacity-100 opacity-0 transition-opacity">
                            <Check className="w-3 h-3 mr-1" /> Marcar como lida
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-20 text-center space-y-4 opacity-20">
                      <Bell className="w-12 h-12 mx-auto text-slate-700" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nenhuma notificação</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
