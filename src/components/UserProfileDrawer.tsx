import React from 'react';
import {
  X,
  Camera,
  User,
  Mail,
  Shield,
  Bell,
  LogOut,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    onClose();
  };

  const currentPlan = profile?.plan === 'pro' ? 'Plano Pro' : 'Plano Gratuito';
  const planColor = profile?.plan === 'pro'
    ? 'bg-brand-100 text-brand-700 border-brand-200'
    : 'bg-zinc-100 text-zinc-700 border-zinc-200';

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const displayName = profile?.full_name || 'Usuário';
  const displayEmail = user?.email || 'email@exemplo.com';
  const initials = getInitials(displayName);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
          <h2 className="text-xl font-semibold text-zinc-900">Meu Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-2xl font-bold border-4 border-white shadow-lg">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900">{displayName}</h3>
            <p className="text-sm text-zinc-500">{displayEmail}</p>
            <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${planColor}`}>
              {currentPlan}
            </span>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Informações Pessoais</h4>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Nome Completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  defaultValue={displayName}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 focus:outline-none text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="email"
                  defaultValue={displayEmail}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 focus:outline-none text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <hr className="border-zinc-100" />

          {/* Settings Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Configurações da Conta</h4>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Shield size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900">Segurança</p>
                  <p className="text-xs text-zinc-500">Alterar senha e 2FA</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Bell size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900">Notificações</p>
                  <p className="text-xs text-zinc-500">Email e Push</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <CreditCard size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-zinc-900">Assinatura</p>
                  <p className="text-xs text-zinc-500">Gerenciar plano Pro</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50 shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-100 transition-colors"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};