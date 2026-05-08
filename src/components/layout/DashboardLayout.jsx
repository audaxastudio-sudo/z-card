import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Gift, Megaphone, 
  LineChart, Settings, HelpCircle, Search, Bell, ShoppingCart, CreditCard, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import PushNotificationManager from '../PushNotificationManager';
import PWAInstallBanner from '../PWAInstallBanner';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Terminal PDV', icon: ShoppingCart, path: '/dashboard/terminal' },
  { name: 'Clientes', icon: Users, path: '/dashboard/members' },
  { name: 'Recompensas', icon: Gift, path: '/dashboard/rewards' },
  { name: 'Campanhas', icon: Megaphone, path: '/dashboard/campaigns' },
  { name: 'Relatórios', icon: LineChart, path: '/dashboard/analytics' },
  { name: 'Faturamento', icon: CreditCard, path: '/dashboard/billing' },
  { name: 'Configurações', icon: Settings, path: '/dashboard/settings' },
];

const mobileMainItems = [
  { name: 'Início', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Terminal', icon: ShoppingCart, path: '/dashboard/terminal' },
  { name: 'Clientes', icon: Users, path: '/dashboard/members' },
  { name: 'Prêmios', icon: Gift, path: '/dashboard/rewards' },
];

export default function DashboardLayout({ children }) {
  const { user, profile, store, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
          () => fetchNotifications()
        )
        .subscribe();

      if (profile?.role === 'admin') {
        navigate('/admin');
        return;
      }

      if (profile?.role === 'merchant' && store) {
        const isTrialActive = store.trial_until && new Date(store.trial_until) > new Date();
        const isActive = store.subscription_status === 'ACTIVE' || isTrialActive;
        const isSettingsPage = location.pathname === '/dashboard/settings';
        const isBillingPage = location.pathname === '/dashboard/billing';
        const isSupportPage = location.pathname === '/dashboard/support';

        if (!store.settings_completed && !isSettingsPage) {
          navigate('/dashboard/settings');
        } else if (store.settings_completed && !isActive && !isBillingPage && !isSupportPage && !isSettingsPage) {
          navigate('/dashboard/billing');
        }
      }

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile, store, location.pathname]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const storeName = store?.name || 'Carregando...';

  return (
    <div className="flex h-screen bg-brand-bg font-sans text-slate-200 overflow-hidden">
      <PushNotificationManager />
      <PWAInstallBanner />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-brand-surface border-r border-slate-800 flex-col shrink-0">
        <div className="p-8">
          <Link to="/dashboard" className="flex items-center justify-center group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-glow-yellow group-hover:scale-105 transition-transform">
              <img src="/Logo.png" alt="Z-Card Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Menu Principal</p>
          </div>
          {navItems.map((item) => {
            const isTrialActive = store?.trial_until && new Date(store.trial_until) > new Date();
            const isActive = store?.subscription_status === 'ACTIVE' || isTrialActive;
            const isSettingsCompleted = store?.settings_completed;
            const isDisabled = profile?.role === 'merchant' && (
              (!isSettingsCompleted && item.path !== '/dashboard/settings') ||
              (isSettingsCompleted && !isActive && !['/dashboard/billing', '/dashboard/settings'].includes(item.path))
            );

            return (
              <Link
                key={item.name}
                to={isDisabled ? '#' : item.path}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  location.pathname === item.path 
                    ? 'bg-brand-yellow text-brand-bg font-bold shadow-glow-yellow' 
                    : isDisabled ? 'opacity-20 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={(e) => {
                  if (isDisabled) e.preventDefault();
                }}
              >
                <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-brand-bg' : isDisabled ? 'text-slate-700' : 'group-hover:text-brand-yellow transition-colors'}`} />
                <span className="text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <Link to="/dashboard/support" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Suporte</span>
           </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-20 bg-brand-bg/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center flex-1">
            <Link to="/dashboard" className="lg:hidden w-10 h-10 rounded-xl overflow-hidden mr-4">
              <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
            </Link>
            <h2 className="text-lg font-bold text-white mr-10 hidden lg:block">Painel de Fidelidade</h2>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar clientes..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:border-brand-yellow outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/dashboard/members?search=${e.target.value}`);
                }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-6">
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markAsRead();
                }}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-yellow rounded-full"></span>}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-72 md:w-80 bg-brand-surface border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-800 font-bold text-white">Notificações</div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-800/30">
                            <p className="text-xs font-bold text-white">{n.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{n.message}</p>
                          </div>
                        )) : <div className="p-8 text-center text-slate-600 text-xs">Nenhuma notificação.</div>}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <div onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center cursor-pointer group">
                <div className="w-9 h-9 rounded-full bg-slate-800 p-[2px] overflow-hidden border border-slate-700">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-brand-yellow overflow-hidden">
                    {store?.logo_url ? <img src={store.logo_url} className="w-full h-full object-cover" /> : storeName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="hidden md:block ml-3">
                  <p className="text-sm font-bold text-white leading-none truncate max-w-[100px]">{storeName}</p>
                </div>
              </div>
              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 mt-4 w-56 bg-brand-surface border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Loja</p>
                        <p className="text-sm font-bold text-white truncate">{storeName}</p>
                      </div>
                      <div className="p-2">
                        <button onClick={() => { navigate('/dashboard/settings'); setShowProfileMenu(false); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                          <Settings className="w-4 h-4" /> <span>Configurações</span>
                        </button>
                        <button onClick={() => signOut()} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-1">
                          <LogOut className="w-4 h-4" /> <span className="font-bold">Sair</span>
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
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar pb-24 lg:pb-10">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-brand-surface/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-2 z-40">
          {mobileMainItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex flex-col items-center justify-center space-y-1 w-16 h-16 rounded-2xl transition-all ${location.pathname === item.path ? 'text-brand-yellow' : 'text-slate-500'}`}
            >
              <item.icon className={`w-6 h-6 ${location.pathname === item.path ? 'fill-brand-yellow/10' : ''}`} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.name}</span>
            </Link>
          ))}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center space-y-1 w-16 h-16 text-slate-500"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Menu</span>
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-80 bg-brand-surface border-l border-slate-800 z-[70] p-8 flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between mb-10">
                  <span className="text-xl font-black text-white italic tracking-tighter whitespace-nowrap">Z-CARD<span className="text-brand-yellow">.</span></span>
                  <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-slate-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all ${location.pathname === item.path ? 'bg-brand-yellow text-brand-bg font-bold shadow-glow-yellow' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-bold text-sm tracking-wide">{item.name}</span>
                    </Link>
                  ))}
                  <div className="pt-6 border-t border-slate-800 mt-6">
                    <Link
                      to="/dashboard/support"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-4 px-5 py-4 text-slate-400"
                    >
                      <HelpCircle className="w-5 h-5" />
                      <span className="font-bold text-sm">Suporte</span>
                    </Link>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <button 
                    onClick={() => signOut()}
                    className="w-full flex items-center space-x-4 px-5 py-4 text-red-500 font-black uppercase text-xs tracking-widest"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sair do Painel</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
