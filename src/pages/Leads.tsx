import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Smartphone,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import { Lead } from '../types';

const mockLeads: Lead[] = [
  { id: '1', name: 'João Silva', email: 'joao.silva@empresa.com.br', location: 'São Paulo, SP', segment: 'Quente', source: 'Facebook', lastSeen: '2 min atrás', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
  { id: '2', name: 'Maria Rodrigues', email: 'maria.rod@gmail.com', location: 'Curitiba, PR', segment: 'Morno', source: 'Google', lastSeen: '1 hora atrás' },
  { id: '3', name: 'Visitante Anônimo #9281', email: '---', location: 'Rio de Janeiro, RJ', segment: 'Frio', source: 'Direct', lastSeen: '3 horas atrás', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { id: '4', name: 'Carlos Eduardo', email: 'carlos.edu@techmail.com', location: 'Belo Horizonte, MG', segment: 'Em saída', source: 'Email Mkt', lastSeen: 'Ontem', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
  { id: '5', name: 'Ana Nogueira', email: 'ananogueira@advocacia.com', location: 'Porto Alegre, RS', segment: 'Quente', source: 'Instagram', lastSeen: '2 dias atrás' },
];

const getSegmentColor = (segment: string) => {
  switch (segment) {
    case 'Quente': return 'bg-red-100 text-red-700 border-red-200';
    case 'Morno': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Frio': return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    case 'Em saída': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-zinc-100 text-zinc-600';
  }
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'Google': return 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg';
    case 'Facebook': return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg';
    case 'Instagram': return 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg';
    default: return null;
  }
}

export const Leads: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-500 font-medium">Dashboard</span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-semibold text-lg">Leads</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Header actions could go here */}
        </div>
      </header>

      <div className="p-8 flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Gerenciar Leads</h1>
            <p className="text-sm text-zinc-500 mt-1">Visualize e organize os visitantes identificados do seu site.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm">
              <Download size={18} />
              Exportar CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
              <Plus size={18} />
              Adicionar Lead
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome, email ou empresa..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-zinc-400"
              />
            </div>
            <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
              <select className="appearance-none bg-white border border-zinc-300 text-zinc-700 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-[160px]">
                <option>Todos Segmentos</option>
                <option>Quente</option>
                <option>Morno</option>
                <option>Frio</option>
              </select>
              <select className="appearance-none bg-white border border-zinc-300 text-zinc-700 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-[160px]">
                <option>Todas Origens</option>
                <option>Google</option>
                <option>Facebook</option>
              </select>
              <button className="text-sm text-zinc-500 hover:text-zinc-900 font-medium px-2 whitespace-nowrap transition-colors">
                Limpar filtros
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100">
            <span className="text-xs text-zinc-500 font-medium uppercase mr-1">Filtros ativos:</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200">
              Segmento: Quente
              <button className="hover:text-red-500 flex items-center"><X size={12} /></button>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200">
              Origem: Google
              <button className="hover:text-red-500 flex items-center"><X size={12} /></button>
            </span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="py-3 px-6 w-[40px]">
                    <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500" />
                  </th>
                  <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Lead</th>
                  <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Segmento</th>
                  <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Origem</th>
                  <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Visto</th>
                  <th className="py-3 px-6 w-[60px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {mockLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-50 group transition-colors cursor-pointer"
                    onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                  >
                    <td className="py-4 px-6 align-middle" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {lead.avatar ? (
                            <img src={lead.avatar} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-zinc-200" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold border border-brand-200">
                              {lead.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-900">{lead.name}</div>
                          <div className="text-xs text-zinc-500">{lead.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-600">{lead.email}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSegmentColor(lead.segment)}`}>
                        {lead.segment}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-zinc-700">
                        {getSourceIcon(lead.source) ? (
                          <img src={getSourceIcon(lead.source) || ''} alt={lead.source} className="w-4 h-4" />
                        ) : (
                          <MapPin size={16} className="text-zinc-400" />
                        )}
                        {lead.source}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-zinc-500">{lead.lastSeen}</td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded p-1 transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white border-t border-zinc-200 px-6 py-4 flex items-center justify-between mt-auto shrink-0">
            <div className="text-sm text-zinc-500">
              Mostrando <span className="font-medium text-zinc-900">1-5</span> de <span className="font-medium text-zinc-900">1,483</span> leads
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-600 transition-colors" disabled>
                <ChevronLeft size={18} />
              </button>
              <button className="p-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-zinc-600 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};