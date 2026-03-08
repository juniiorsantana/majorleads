import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, MoreHorizontal, Eye, MousePointerClick, TrendingUp,
  Monitor, Smartphone, Layers, Zap, PauseCircle, Copy, Trash2,
  BarChart3, ArrowUpRight, Sparkles, Filter, Search,
  AlertCircle, CheckCircle, Lock, Globe
} from 'lucide-react';
import { Popup } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateDefaultSite, getAllSites, Site } from '../lib/sites';
import { usePlan } from '../hooks/usePlan';

// Removed mockPopups

// ─── Micro-components ────────────────────────────────────────────

const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    Active: 'bg-emerald-500',
    Paused: 'bg-amber-500',
    Draft: 'bg-zinc-400',
  };
  return (
    <span className="relative flex h-2 w-2">
      {status === 'Active' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status]}`} />
    </span>
  );
};

const MetricBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform === 'Mobile') return <Smartphone size={13} className="text-zinc-400" />;
  if (platform === 'Desktop') return <Monitor size={13} className="text-zinc-400" />;
  return <Layers size={13} className="text-zinc-400" />;
};

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-[110] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 duration-300 ${type === 'success' ? 'bg-white border-emerald-100 text-zinc-800' : 'bg-white border-red-100 text-zinc-800'
      }`}>
      <div className={`p-1 rounded-full ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

const statusLabel: Record<string, string> = {
  Active: 'Ativo',
  Paused: 'Pausado',
  Draft: 'Rascunho',
};

// ─── Main Component ─────────────────────────────────────────────

export const Popups: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAddPopup, limits, usage } = usePlan();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (deleteModal) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [deleteModal]);

  React.useEffect(() => {
    const loadSites = async () => {
      if (!user) return;
      setIsLoadingSites(true);
      let userSites = await getAllSites(user.id);
      if (userSites.length === 0) {
        const defaultSite = await getOrCreateDefaultSite(user.id);
        if (defaultSite) {
          userSites = [defaultSite];
        }
      }
      setSites(userSites);
      setIsLoadingSites(false);
    };
    loadSites();
  }, [user]);

  React.useEffect(() => {
    const fetchPopups = async () => {
      if (!user || isLoadingSites) return;
      setIsLoading(true);
      try {
        let query = supabase
          .from('popups')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedSiteId === 'all') {
          const siteIds = sites.map(s => s.id);
          if (siteIds.length > 0) {
            query = query.in('site_id', siteIds);
          } else {
            setPopups([]);
            setIsLoading(false);
            return;
          }
        } else {
          query = query.eq('site_id', selectedSiteId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data) {
          const mappedPopups: Popup[] = data.map(p => ({
            id: p.id,
            name: p.name,
            trigger: p.trigger_config?.type || 'Not configured',
            views: 0, // Placeholder
            ctr: 0, // Placeholder
            conversion: 0, // Placeholder
            status: (p.status === 'active' ? 'Active' : p.status === 'paused' ? 'Paused' : 'Draft') as any,
            platform: 'All', // Placeholder or derive from config
            thumbnail: ''
          }));
          setPopups(mappedPopups);
        }
      } catch (err) {
        console.error('Error fetching popups:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopups();
  }, [user, isLoadingSites, sites, selectedSiteId]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', deleteModal.id);

      if (error) throw error;

      // Remove da lista local sem precisar refetch
      setPopups(prev => prev.filter(p => p.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (err: any) {
      console.error('Erro ao excluir popup:', err);
      setShowToast({ message: `Erro ao excluir: ${err.message || 'Erro desconhecido'}`, type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPopups = popups.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary stats
  const totalViews = popups.reduce((s, p) => s + p.views, 0);
  const avgCtr = (popups.filter(p => p.status === 'Active').reduce((s, p) => s + p.ctr, 0) / Math.max(popups.filter(p => p.status === 'Active').length, 1)).toFixed(1);
  const avgConv = (popups.filter(p => p.status === 'Active').reduce((s, p) => s + p.conversion, 0) / Math.max(popups.filter(p => p.status === 'Active').length, 1)).toFixed(1);

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-900">Popups</h1>
          <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {isLoading ? '—' : `${popups.length} / ${limits.max_active_popups}`}
          </span>
        </div>
        {canAddPopup ? (
          <button
            onClick={() => navigate('/popups/editor')}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            Criar Popup
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              disabled
              className="flex items-center gap-2 bg-zinc-100 text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed border border-zinc-200"
            >
              <Lock size={14} /> Criar Popup
            </button>
            <span className="text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Zap size={12} className="text-brand-500" />
              Limite do plano atingido
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Summary Strip */}
        <div className="bg-white border-b border-zinc-100 px-8 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Eye size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Total Views</p>
                <p className="text-lg font-bold text-zinc-900 tabular-nums">{totalViews.toLocaleString()}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-100" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <MousePointerClick size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">CTR Médio</p>
                <p className="text-lg font-bold text-zinc-900">{avgCtr}%</p>
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-100" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">Conversão Média</p>
                <p className="text-lg font-bold text-zinc-900">{avgConv}%</p>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="ml-auto flex items-center gap-3">
              <div className="relative min-w-[200px]">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 z-10 pointer-events-none" />
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="pl-8 pr-10 py-2 text-sm font-medium text-zinc-900 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none outline-none w-full relative z-0"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
                >
                  <option value="all" className="text-zinc-900 font-medium">Todos os Sites</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id} className="text-zinc-900 font-medium">
                      {site.domain || site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar popup..."
                  className="pl-8 pr-3 py-2 text-sm text-zinc-900 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-48 transition-all"
                />
              </div>
              <div className="flex bg-zinc-100 rounded-lg p-0.5">
                {['all', 'Active', 'Paused', 'Draft'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === s
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                  >
                    {s === 'all' ? 'Todos' : statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {/* Create Card */}
            <button
              onClick={() => navigate('/popups/editor')}
              className="group min-h-[400px] rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-900 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer p-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.02),transparent_70%)]" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Plus size={24} className="text-zinc-400 group-hover:text-white transition-colors" strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-zinc-900 mb-1.5 group-hover:text-zinc-900">Criar novo popup</h3>
                <p className="text-xs text-zinc-500 max-w-[180px] leading-relaxed">
                  Crie do zero ou escolha um template de alta conversão
                </p>
              </div>
            </button>

            {/* Popup Cards — skeleton durante loading, reais depois */}
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col shadow-sm animate-pulse">
                  <div className="h-40 bg-zinc-200" />
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <div className="h-4 bg-zinc-200 rounded-md w-3/4" />
                    <div className="h-3 bg-zinc-100 rounded w-1/3" />
                    <div className="h-px bg-zinc-100 my-1" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-3 bg-zinc-100 rounded w-1/4" />
                        <div className="h-3 bg-zinc-100 rounded w-1/6" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-zinc-100 rounded w-1/4" />
                        <div className="h-3 bg-zinc-100 rounded w-1/6" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-zinc-100 rounded w-1/4" />
                        <div className="h-3 bg-zinc-100 rounded w-1/6" />
                      </div>
                    </div>
                    <div className="h-px bg-zinc-100 mt-auto" />
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-5 bg-zinc-100 rounded-full w-12" />
                      <div className="h-3 bg-zinc-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))
              : filteredPopups.map((popup) => {
                const isHovered = hoveredCard === popup.id;
                const isMenuShown = menuOpen === popup.id;
                const isDraft = popup.status === 'Draft';

                return (
                  <div
                    key={popup.id}
                    onMouseEnter={() => setHoveredCard(popup.id)}
                    onMouseLeave={() => { setHoveredCard(null); setMenuOpen(null); }}
                    className={`group bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col transition-all duration-300 relative ${isHovered ? 'shadow-lg shadow-zinc-200/60 border-zinc-300 -translate-y-0.5' : 'shadow-sm'
                      }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-40 relative overflow-hidden bg-zinc-100">
                      {popup.thumbnail ? (
                        <img
                          src={popup.thumbnail}
                          alt={popup.name}
                          className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'scale-105 brightness-[0.85]' : 'scale-100'
                            }`}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-zinc-300">
                          <Sparkles size={32} />
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Status pill on image */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${popup.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30'
                          : popup.status === 'Paused'
                            ? 'bg-amber-500/20 text-amber-100 border border-amber-400/30'
                            : 'bg-white/20 text-white/80 border border-white/20'
                          }`}>
                          <StatusDot status={popup.status} />
                          {statusLabel[popup.status]}
                        </div>
                      </div>

                      {/* Platform badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white/80">
                          <PlatformIcon platform={popup.platform} />
                          <span className="text-[10px] font-medium">{popup.platform}</span>
                        </div>
                      </div>

                      {/* Hover action strip */}
                      <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 p-3 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                        }`}>
                        <button
                          onClick={() => navigate(`/popups/editor/${popup.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-zinc-900 shadow-lg hover:bg-zinc-50 transition-colors"
                        >
                          Editar <ArrowUpRight size={12} />
                        </button>
                        <button
                          onClick={() => navigate(`/reports/popups/${popup.id}`)}
                          className="p-1.5 bg-white/90 rounded-lg text-zinc-600 shadow-lg hover:bg-white hover:text-brand-600 transition-colors"
                          title="Ver Relatório"
                        >
                          <BarChart3 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteModal({ id: popup.id, name: popup.name }); }}
                          className="p-1.5 bg-white/90 rounded-lg text-zinc-600 shadow-lg hover:bg-white hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col">
                      {/* Title row */}
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-zinc-900 text-sm leading-tight">{popup.name}</h3>
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(isMenuShown ? null : popup.id); }}
                            className="text-zinc-300 hover:text-zinc-600 transition-colors p-0.5"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {isMenuShown && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                              <button className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-medium">
                                <Copy size={12} /> Duplicar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/reports/popups/${popup.id}`); }}
                                className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-medium"
                              >
                                <BarChart3 size={12} /> Ver relatório
                              </button>
                              <button className="w-full px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 font-medium">
                                {popup.status === 'Active' ? <><PauseCircle size={12} /> Pausar</> : <><Zap size={12} /> Ativar</>}
                              </button>
                              <div className="h-px bg-zinc-100 my-1" />
                              <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(null); setDeleteModal({ id: popup.id, name: popup.name }); }}
                                className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                              >
                                <Trash2 size={12} /> Excluir
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mb-4 font-mono">{popup.trigger}</p>

                      {/* Stats */}
                      <div className={`space-y-3 ${isDraft ? 'opacity-40' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye size={13} className="text-zinc-400" />
                            <span className="text-xs text-zinc-500">Views</span>
                          </div>
                          <span className="text-xs font-bold text-zinc-900 tabular-nums">{popup.views.toLocaleString()}</span>
                        </div>
                        <MetricBar value={popup.views} max={10000} color="bg-zinc-900" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MousePointerClick size={13} className="text-emerald-500" />
                            <span className="text-xs text-zinc-500">CTR</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 tabular-nums">{popup.ctr}%</span>
                        </div>
                        <MetricBar value={popup.ctr} max={15} color="bg-emerald-500" />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={13} className="text-brand-500" />
                            <span className="text-xs text-zinc-500">Conversão</span>
                          </div>
                          <span className="text-xs font-bold text-brand-600 tabular-nums">{popup.conversion}%</span>
                        </div>
                        <MetricBar value={popup.conversion} max={10} color="bg-brand-500" />
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                        <div className={`flex items-center gap-2 ${isDraft ? 'opacity-40 pointer-events-none' : ''}`}>
                          <button className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${popup.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-300'
                            }`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${popup.status === 'Active' ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                          </button>
                          <span className={`text-[11px] font-semibold uppercase tracking-wider ${popup.status === 'Active' ? 'text-emerald-600' : 'text-zinc-400'
                            }`}>
                            {popup.status === 'Active' ? 'Ativo' : 'Off'}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/popups/editor/${popup.id}`)}
                          className="flex items-center justify-center p-2 text-zinc-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Editar Popup"
                        >
                          {isDraft ? 'Continuar' : 'Editar'}
                          <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícone */}
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>

            {/* Texto */}
            <h3 className="text-base font-bold text-zinc-900 mb-1">Excluir popup?</h3>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              O popup <span className="font-semibold text-zinc-700">"{deleteModal.name}"</span> será
              excluído permanentemente. Essa ação não pode ser desfeita.
            </p>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Sim, excluir'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </>
  );
};