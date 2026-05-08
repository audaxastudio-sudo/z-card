import { Routes, Route } from 'react-router-dom'
import { Gift } from 'lucide-react'
import Welcome from './pages/auth/Welcome'
import LandingPage from './pages/LandingPage'
import PartnerLogin from './pages/auth/PartnerLogin'
import MemberLogin from './pages/auth/MemberLogin'
import Register from './pages/auth/Register'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/dashboard/Dashboard'
import Rewards from './pages/dashboard/Rewards'
import Terminal from './pages/dashboard/Terminal'
import Members from './pages/dashboard/Members'
import Analytics from './pages/dashboard/Analytics'
import Settings from './pages/dashboard/Settings'
import Billing from './pages/dashboard/Billing'
import Campaigns from './pages/dashboard/Campaigns'
import Support from './pages/dashboard/Support'
import CustomerDisplay from './pages/display/CustomerDisplay'
import CustomerLayout from './components/layout/CustomerLayout'
import Wallet from './pages/customer/Wallet'
import Explore from './pages/customer/Explore'
import Profile from './pages/customer/Profile'
import CardDetails from './pages/customer/CardDetails'
import CustomerScanner from './pages/customer/Scanner'
import StoreFront from './pages/customer/StoreFront'
import AdminPanel from './pages/AdminPanel'
import AdminLogin from './pages/auth/AdminLogin'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CustomerRegister from './pages/auth/CustomerRegister'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/welcome" element={<Welcome />} />
        
        {/* Fluxo do Parceiro */}
        <Route path="/login/parceiro" element={<PartnerLogin />} />
        <Route path="/register/parceiro" element={<Register />} />
        
        {/* Fluxo do Membro */}
        <Route path="/login/membro" element={<MemberLogin />} />
        <Route path="/register/membro" element={<CustomerRegister />} />
        
        {/* Fluxo do Admin */}
        <Route path="/login/admin" element={<AdminLogin />} />
        
        {/* Rotas Protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/rewards" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Rewards />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/campaigns" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Campaigns />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/support" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Support />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/members" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Members />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/analytics" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/billing" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Billing />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/terminal" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Terminal />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/settings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Display de Balcão */}
        <Route path="/display" element={<CustomerDisplay />} />
        
        {/* Telas do Membro */}
        <Route path="/carteira" element={
          <ProtectedRoute>
            <CustomerLayout>
              <Wallet />
            </CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/carteira/:id" element={
          <ProtectedRoute>
            <CustomerLayout>
              <CardDetails />
            </CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/perfil" element={
          <ProtectedRoute>
            <CustomerLayout>
              <Profile />
            </CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/escanear" element={
          <ProtectedRoute>
            <CustomerLayout>
              <CustomerScanner />
            </CustomerLayout>
          </ProtectedRoute>
        } />
        <Route path="/premios" element={
          <ProtectedRoute>
            <CustomerLayout>
              <div className="py-20 text-center space-y-4">
                <Gift className="w-16 h-16 text-slate-800 mx-auto" />
                <h2 className="text-xl font-bold text-white">Meus Prêmios</h2>
                <p className="text-slate-500 text-sm">Você ainda não tem prêmios disponíveis para resgate.</p>
              </div>
            </CustomerLayout>
          </ProtectedRoute>
        } />

        {/* Telas Públicas */}
        <Route path="/explorar" element={
          <CustomerLayout>
            <Explore />
          </CustomerLayout>
        } />
        <Route path="/loja/:id" element={
          <CustomerLayout>
            <StoreFront />
          </CustomerLayout>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default App
