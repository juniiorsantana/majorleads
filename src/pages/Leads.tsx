import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  device_type: string | null;
  utm_source: string | null;
  created_at: string;
}

const getSourceIcon = (source: string | null) => {
  if (!source) return null;
  const s = source.toLowerCase();

  if (s.includes('google')) return 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg';
  if (s.includes('facebook') || s.includes('fb')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg';
  if (s.includes('instagram') || s.includes('ig')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg';

  return null;
}

export const Leads: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // 1. First get the user's site
        const { data: sites, error: siteError } = await supabase
          .from('sites')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (siteError) throw siteError;

        if (!sites || sites.length === 0) {
          setLeads([]);
          return;
        }

        const siteId = sites[0].id;

        // 2. Fetch leads for this site
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('id, name, email, whatsapp, device_type, utm_source, created_at')
          .eq('site_id', siteId)
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        setLeads(leadsData || []);
      } catch (err: any) {
        console.error('Error fetching leads:', err);
        setError('Ocorreu um erro ao carregar os leads.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                placeholder="Buscar por nome, email ou telefone..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-zinc-400"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Carregando leads...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 flex flex-col items-center justify-center h-full">
              <p>{error}</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Nenhum lead capturado ainda.</h3>
              <p className="text-zinc-500 max-w-sm mb-6">Seus leads aparecerão aqui assim que começarem a ser identificados pelo seu site.</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="py-3 px-6 w-[40px]">
                        <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500" />
                      </th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Lead</th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Contato</th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Dispositivo</th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Origem</th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 uppercase tracking-wider">Data</th>
                      <th className="py-3 px-6 w-[60px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {leads.map((lead) => (
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
                              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold border border-brand-200">
                                {lead.name ? lead.name.substring(0, 2).toUpperCase() : '?'}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-900">{lead.name || 'Visitante Desconhecido'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            {lead.email && <div className="text-sm text-zinc-600 flex items-center gap-2"><Mail size={14} className="text-zinc-400" /> {lead.email}</div>}
                            {lead.whatsapp && <div className="text-sm text-zinc-600 flex items-center gap-2"><Smartphone size={14} className="text-zinc-400" /> {lead.whatsapp}</div>}
                            {!lead.email && !lead.whatsapp && <span className="text-xs text-zinc-400">-</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-600">
                          {lead.device_type ? (
                            <span className="capitalize">{lead.device_type}</span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-zinc-700">
                            {getSourceIcon(lead.utm_source) ? (
                              <img src={getSourceIcon(lead.utm_source) || ''} alt={lead.utm_source || ''} className="w-4 h-4" />
                            ) : lead.utm_source ? (
                              <MapPin size={16} className="text-zinc-400" />
                            ) : null}
                            {lead.utm_source ? <span className="capitalize">{lead.utm_source}</span> : <span className="text-zinc-400">-</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-500">{formatDate(lead.created_at)}</td>
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
                  Mostrando <span className="font-medium text-zinc-900">{leads.length > 0 ? 1 : 0}-{leads.length}</span> de <span className="font-medium text-zinc-900">{leads.length}</span> leads
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-600 transition-colors" disabled>
                    <ChevronLeft size={18} />
                  </button>
                  <button className="p-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 text-zinc-600 transition-colors" disabled>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};