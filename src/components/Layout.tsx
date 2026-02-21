import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  BarChart3,
  Settings,
  Code2,
  Hexagon,
  ChevronDown,
  MoreVertical,
  KanbanSquare
} from 'lucide-react';
import { UserProfileDrawer } from './UserProfileDrawer';

import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { profile, user } = useAuth(); // Hook useAuth

  // Determine if we are on a page that needs the layout (Onboarding and Editor usually don't)
  const isFullScreen = location.pathname === '/onboarding' || location.pathname === '/popups/editor';

  if (isFullScreen) {
    return <>{children}</>;
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: Users, label: 'Leads', path: '/dashboard/leads', badge: 12 },
    { icon: KanbanSquare, label: 'CRM', path: '/dashboard/crm' },
    { icon: Layers, label: 'Popups', path: '/dashboard/popups' },
    { icon: BarChart3, label: 'Relatórios', path: '/dashboard/reports' },
  ];

  const accountItems = [
    { icon: Settings, label: 'Configurações', path: '/dashboard/settings' },
    { icon: Code2, label: 'Instalação', path: '/dashboard/sites' },
  ];

  const displayName = profile?.full_name || 'Usuário';
  const displayPlan = profile?.plan === 'pro' ? 'Plano Pro' : 'Plano Gratuito';

  // Initials logic
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  const initials = getInitials(displayName);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-gray-400 flex flex-col border-r border-zinc-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
            <Hexagon className="text-brand-600 fill-brand-600" size={24} />
            MajorLeads
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-6">
          <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-between transition-colors">
            <span className="truncate">meusite.com.br</span>
            <ChevronDown size={16} className="text-zinc-400" />
          </button>

          <div>
            <div className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Principal</div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div>
            <div className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Conta</div>
            <nav className="space-y-1">
              {accountItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 hover:bg-zinc-800 p-2 rounded-lg cursor-pointer transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm border border-violet-200 group-hover:border-violet-400 transition-colors bg-cover bg-center shrink-0"
              style={profile?.avatar_url ? { backgroundImage: `url(${profile.avatar_url})` } : {}}
            >
              {!profile?.avatar_url && initials}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-white truncate group-hover:text-brand-300 transition-colors">
                {displayName}
              </span>
              <span className="text-xs text-zinc-500 truncate">{displayPlan}</span>
            </div>
            <MoreVertical size={16} className="text-zinc-500 group-hover:text-zinc-300" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {children}
      </main>

      {/* Profile Drawer */}
      <UserProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};