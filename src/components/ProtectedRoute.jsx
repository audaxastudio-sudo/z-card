import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, store, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Verificando Credenciais...</p>
      </div>
    );
  }

  // Se não tem usuário, manda para a home
  if (!user) {
    return <Navigate to="/" state={{ from: location, message: 'Por favor, faça login para acessar esta área.' }} replace />;
  }

  // Se tem usuário mas o perfil ainda não carregou, esperamos o loading (que já é tratado acima)
  // Mas se o loading terminou e não temos profile, a sessão é inválida
  if (!loading && !profile) {
    return <Navigate to="/" replace />;
  }

  // Verificação de Cargo (Role)
  if (requiredRole && profile?.role !== requiredRole) {
    console.warn(`Acesso negado: Cargo ${requiredRole} necessário. Usuário é ${profile?.role}`);
    
    // Se for admin tentando entrar no dashboard de lojista, permitimos (opcional) ou mandamos para /admin
    if (profile?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  // Verificação de Inadimplência Asaas (apenas para lojistas)
  if (profile?.role === 'merchant' && store?.subscription_status === 'OVERDUE' && location.pathname !== '/dashboard/billing') {
    return <Navigate to="/dashboard/billing" replace />;
  }

  // Se houver usuário e cargo/assinatura OK, renderiza o conteúdo protegido
  return children;
}
