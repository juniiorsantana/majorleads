import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Leads } from './pages/Leads';
import { LeadProfile } from './pages/LeadProfile';
import { Popups } from './pages/Popups';
import { Reports } from './pages/Reports';
import { PopupReport } from './pages/PopupReport';
import { Settings } from './pages/Settings';
import { WebhookSettings } from './pages/WebhookSettings';
import { Onboarding } from './pages/Onboarding';
import { Sites } from './pages/Sites';
import { CRM } from './pages/CRM';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { RecuperarSenha } from './pages/RecuperarSenha';
import { NovaSenha } from './pages/NovaSenha';
import { LandingPage } from './pages/LandingPage';
import { PopupEditor } from './pages/PopupEditor';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/nova-senha" element={<NovaSenha />} />

          {/* Protected routes inside Layout */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/leads/:id" element={<LeadProfile />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/popups" element={<Popups />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/popups/:id" element={<PopupReport />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/webhook" element={<WebhookSettings />} />
                    <Route path="/sites" element={<Sites />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Full-screen editor routes (no Layout) */}
          <Route
            path="/popups/new"
            element={<ProtectedRoute><PopupEditor /></ProtectedRoute>}
          />
          <Route
            path="/popups/editor"
            element={<ProtectedRoute><PopupEditor /></ProtectedRoute>}
          />
          <Route
            path="/popups/editor/:id"
            element={<ProtectedRoute><PopupEditor /></ProtectedRoute>}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;