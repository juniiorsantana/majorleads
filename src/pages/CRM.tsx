import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  MessageCircle,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type CrmStatus = 'novo' | 'contactado' | 'agendado' | 'compareceu' | 'fechado' | 'perdido';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  device_type: string | null;
  created_at: string;
  crm_status: CrmStatus;
  source: string | null;
  extra_data: Record<string, unknown> | null;
}

interface KanbanColumn {
  id: CrmStatus;
  title: string;
  colorDot: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
}

interface ClosingModalState {
  lead: Lead;
  value: string;
  procedure: string;
  notes: string;
  saving: boolean;
}

// ─── Definição das colunas ───────────────────────────────────────────────────

const COLUMNS: KanbanColumn[] = [
  { id: 'novo',       title: 'Novo',          colorDot: 'bg-blue-500',   colorBorder: 'border-blue-200',   colorBg: 'bg-blue-50',   colorText: 'text-blue-700' },
  { id: 'contactado', title: 'Contactado',    colorDot: 'bg-amber-500',  colorBorder: 'border-amber-200',  colorBg: 'bg-amber-50',  colorText: 'text-amber-700' },
  { id: 'agendado',   title: 'Ag. Consulta',  colorDot: 'bg-purple-500', colorBorder: 'border-purple-200', colorBg: 'bg-purple-50', colorText: 'text-purple-700' },
  { id: 'compareceu', title: 'Compareceu',    colorDot: 'bg-teal-500',   colorBorder: 'border-teal-200',   colorBg: 'bg-teal-50',   colorText: 'text-teal-700' },
  { id: 'fechado',    title: 'Fechado',       colorDot: 'bg-green-500',  colorBorder: 'border-green-200',  colorBg: 'bg-green-50',  colorText: 'text-green-700' },
  { id: 'perdido',    title: 'Perdido',       colorDot: 'bg-red-500',    colorBorder: 'border-red-200',    colorBg: 'bg-red-50',    colorText: 'text-red-700' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'ontem';
  return `${days} dias atrás`;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildWhatsAppMessage(name: string | null): string {
  const nome = name ?? 'você';
  return encodeURIComponent(`Olá ${nome}! Vi que você demonstrou interesse. Posso te ajudar?`);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm animate-pulse space-y-3">
    <div className="h-3 bg-zinc-200 rounded w-2/3" />
    <div className="h-2 bg-zinc-100 rounded w-1/2" />
    <div className="h-2 bg-zinc-100 rounded w-1/3" />
    <div className="flex justify-between pt-2 border-t border-zinc-100">
      <div className="h-5 w-16 bg-zinc-100 rounded" />
      <div className="h-5 w-10 bg-zinc-100 rounded" />
    </div>
  </div>
);

// ─── Modal de Fechamento ──────────────────────────────────────────────────────

interface ClosingModalProps {
  state: ClosingModalState;
  onConfirm: (value: string, procedure: string, notes: string) => void;
  onCancel: () => void;
  onChange: (patch: Partial<ClosingModalState>) => void;
}

const ClosingModal: React.FC<ClosingModalProps> = ({ state, onConfirm, onCancel, onChange }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Fechar negócio</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{state.lead.name ?? 'Visitante anônimo'}</p>
        </div>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Valor do procedimento <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={state.value}
              onChange={e => onChange({ value: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Tipo de procedimento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Implante, Clareamento..."
            value={state.procedure}
            onChange={e => onChange({ procedure: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">Observações</label>
          <textarea
            placeholder="Anotações internas..."
            value={state.notes}
            onChange={e => onChange({ notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 bg-zinc-50 border-t border-zinc-100">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          disabled={!state.value || !state.procedure || state.saving}
          onClick={() => onConfirm(state.value, state.procedure, state.notes)}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {state.saving ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <><CheckCircle size={15} /> Confirmar</>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ─── Card do Lead ─────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  columnId: CrmStatus;
  onDragStart: (e: React.DragEvent, leadId: string, colId: CrmStatus) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onWhatsApp: (lead: Lead) => void;
  onClose: (lead: Lead) => void;
  isDragging: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, columnId, onDragStart, onDragEnd, onWhatsApp, onClose, isDragging }) => {
  const displayName = lead.name ?? 'Visitante anônimo';
  const isMetaAds = lead.source === 'meta_ads';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lead.id, columnId)}
      onDragEnd={onDragEnd}
      className={`bg-white p-4 rounded-lg border border-zinc-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-grab active:cursor-grabbing group select-none ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      {/* Badges de origem e campanha */}
      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${isMetaAds ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-zinc-50 text-zinc-500 border-zinc-100'}`}>
          {isMetaAds ? 'Meta Ads' : 'Site'}
        </span>
        {lead.utm_campaign && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-100">
            {lead.utm_campaign}
          </span>
        )}
      </div>

      {/* Nome */}
      <h4 className="font-semibold text-zinc-900 text-sm leading-tight">{displayName}</h4>
      {lead.email && <p className="text-xs text-zinc-400 mt-0.5 truncate">{lead.email}</p>}

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-3">
        <div className="flex items-center gap-2">
          {/* Avatar inicial */}
          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials}
          </div>

          {/* Botão WhatsApp */}
          {lead.whatsapp ? (
            <button
              onClick={e => { e.stopPropagation(); onWhatsApp(lead); }}
              className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100 hover:bg-green-100 transition-colors"
              title={`Abrir WhatsApp para ${displayName}`}
            >
              <MessageCircle size={12} />
              <span className="text-[10px] font-medium">WhatsApp</span>
            </button>
          ) : (
            <span className="text-[10px] text-zinc-300 italic">sem número</span>
          )}

          {/* Botão Fechar (visível no hover, só fora da coluna fechado) */}
          {columnId !== 'fechado' && (
            <button
              onClick={e => { e.stopPropagation(); onClose(lead); }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200 hover:bg-green-100 transition-all text-[10px] font-medium"
              title="Fechar negócio"
            >
              <CheckCircle size={11} /> Fechar
            </button>
          )}
        </div>

        {/* Valor (se fechado) */}
        {lead.crm_status === 'fechado' && lead.extra_data?.crm_value && (
          <span className="text-xs font-semibold text-green-700">
            {formatBRL(Number(lead.extra_data.crm_value))}
          </span>
        )}
      </div>

      {/* Tempo */}
      <div className="mt-2 text-[10px] text-zinc-400">
        {timeAgo(lead.created_at)}
      </div>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export const CRM: React.FC = () => {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [sourceColId, setSourceColId] = useState<CrmStatus | null>(null);
  const [dragOverColId, setDragOverColId] = useState<CrmStatus | null>(null);

  const [closingModal, setClosingModal] = useState<ClosingModalState | null>(null);

  // ── Buscar leads reais do Supabase ────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: sites, error: sitesErr } = await supabase
        .from('sites')
        .select('id')
        .eq('user_id', user.id);

      if (sitesErr) throw sitesErr;

      const siteIds = (sites ?? []).map(s => s.id);
      if (siteIds.length === 0) { setLeads([]); return; }

      const { data: leadsData, error: leadsErr } = await supabase
        .from('leads')
        .select('id, name, email, whatsapp, utm_source, utm_campaign, device_type, created_at, crm_status, source, extra_data')
        .in('site_id', siteIds)
        .order('created_at', { ascending: false });

      if (leadsErr) throw leadsErr;
      setLeads((leadsData as Lead[]) ?? []);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar leads. Tente recarregar a página.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = {
    total: leads.length,
    contactadosHoje: leads.filter(l => l.crm_status === 'contactado' && isToday(l.created_at)).length,
    fechadosMes: leads.filter(l => l.crm_status === 'fechado' && isThisMonth(l.created_at)).length,
    receitaMes: leads
      .filter(l => l.crm_status === 'fechado' && isThisMonth(l.created_at))
      .reduce((sum, l) => sum + Number(l.extra_data?.crm_value ?? 0), 0),
  };

  // ── Filtro de busca ───────────────────────────────────────────────────────
  const filteredLeads = search.trim()
    ? leads.filter(l =>
        (l.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.whatsapp ?? '').includes(search)
      )
    : leads;

  // ── Agrupar por coluna ────────────────────────────────────────────────────
  const leadsByCol = (colId: CrmStatus) => filteredLeads.filter(l => l.crm_status === colId);

  // ── Update otimista de status ─────────────────────────────────────────────
  const updateLeadStatus = async (leadId: string, newStatus: CrmStatus, extraPatch?: Record<string, unknown>) => {
    const prev = leads.find(l => l.id === leadId);
    if (!prev) return;

    // Otimista
    setLeads(ls => ls.map(l => l.id === leadId ? { ...l, crm_status: newStatus, ...(extraPatch ? { extra_data: { ...l.extra_data, ...extraPatch } } : {}) } : l));

    try {
      const updatePayload: Record<string, unknown> = { crm_status: newStatus };
      if (extraPatch) {
        updatePayload.extra_data = { ...prev.extra_data, ...extraPatch };
      }
      const { error } = await supabase.from('leads').update(updatePayload).eq('id', leadId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Reverter
      setLeads(ls => ls.map(l => l.id === leadId ? prev : l));
      addToast('Erro ao salvar. Mudança revertida.', 'error');
    }
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, leadId: string, colId: CrmStatus) => {
    setDraggedId(leadId);
    setSourceColId(colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-50', 'scale-95');
    setDraggedId(null);
    setSourceColId(null);
    setDragOverColId(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: CrmStatus) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDrop = (e: React.DragEvent, destColId: CrmStatus) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggedId || !sourceColId || sourceColId === destColId) return;

    const lead = leads.find(l => l.id === draggedId);
    if (!lead) return;

    if (destColId === 'fechado') {
      // Primeiro muda otimisticamente, depois abre modal
      setLeads(ls => ls.map(l => l.id === draggedId ? { ...l, crm_status: 'fechado' } : l));
      setClosingModal({ lead: { ...lead, crm_status: 'fechado' }, value: '', procedure: '', notes: '', saving: false });
    } else {
      updateLeadStatus(draggedId, destColId);
    }

    setDraggedId(null);
    setSourceColId(null);
  };

  // ── Botão WhatsApp do card ────────────────────────────────────────────────
  const handleWhatsApp = async (lead: Lead) => {
    if (!lead.whatsapp) return;
    const msg = buildWhatsAppMessage(lead.name);
    window.open(`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');

    const now = new Date().toISOString();
    const extra = { crm_whatsapp_opened_at: now };

    if (lead.crm_status === 'novo') {
      await updateLeadStatus(lead.id, 'contactado', extra);
    } else {
      setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, extra_data: { ...l.extra_data, ...extra } } : l));
      await supabase.from('leads').update({ extra_data: { ...lead.extra_data, ...extra } }).eq('id', lead.id);
    }
  };

  // ── Modal de fechamento ───────────────────────────────────────────────────
  const handleOpenClosingModal = (lead: Lead) => {
    setClosingModal({ lead, value: '', procedure: '', notes: '', saving: false });
  };

  const handleConfirmClosing = async (value: string, procedure: string, notes: string) => {
    if (!closingModal) return;
    setClosingModal(m => m ? { ...m, saving: true } : null);

    const lead = closingModal.lead;
    const updatedExtraData = {
      ...lead.extra_data,
      crm_value: parseFloat(value),
      crm_procedure: procedure,
      crm_notes: notes,
    };

    try {
      const { error } = await supabase.from('leads')
        .update({ crm_status: 'fechado', extra_data: updatedExtraData })
        .eq('id', lead.id);
      if (error) throw error;

      setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, crm_status: 'fechado', extra_data: updatedExtraData } : l));
      setClosingModal(null);
    } catch (err) {
      console.error(err);
      addToast('Erro ao fechar negócio. Tente novamente.', 'error');
      // Reverter status se veio de drag
      setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, crm_status: lead.crm_status } : l));
      setClosingModal(null);
    }
  };

  const handleCancelClosing = () => {
    if (closingModal) {
      // Reverter status otimista se veio do drag
      const original = leads.find(l => l.id === closingModal.lead.id);
      if (original && original.crm_status === 'fechado') {
        // Foi setado no drop, reverter para status anterior
        const prevStatus = closingModal.lead.crm_status === 'fechado' ? sourceColId ?? 'novo' : closingModal.lead.crm_status;
        setLeads(ls => ls.map(l => l.id === closingModal.lead.id ? { ...l, crm_status: prevStatus as CrmStatus } : l));
      }
    }
    setClosingModal(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-zinc-50 overflow-hidden">
      {/* Toast */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Modal */}
      {closingModal && (
        <ClosingModal
          state={closingModal}
          onChange={patch => setClosingModal(m => m ? { ...m, ...patch } : null)}
          onConfirm={handleConfirmClosing}
          onCancel={handleCancelClosing}
        />
      )}

      {/* Header */}
      <header className="h-auto bg-white border-b border-zinc-200 px-6 py-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-zinc-900">Pipeline CRM</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Buscar lead..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
              <Filter size={16} />
              Filtros
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <Users size={14} />, label: 'Total no CRM', value: String(kpis.total), color: 'text-blue-600 bg-blue-50' },
            { icon: <MessageCircle size={14} />, label: 'Contactados hoje', value: String(kpis.contactadosHoje), color: 'text-amber-600 bg-amber-50' },
            { icon: <CheckCircle size={14} />, label: 'Fechados no mês', value: String(kpis.fechadosMes), color: 'text-green-600 bg-green-50' },
            { icon: <TrendingUp size={14} />, label: 'Receita do mês', value: formatBRL(kpis.receitaMes), color: 'text-emerald-600 bg-emerald-50' },
          ].map(kpi => (
            <div key={kpi.label} className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
              <span className={`${kpi.color} p-1.5 rounded-lg`}>{kpi.icon}</span>
              <div>
                <p className="text-[10px] text-zinc-500">{kpi.label}</p>
                <p className="text-sm font-bold text-zinc-900">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(col => {
            const colLeads = leadsByCol(col.id);
            const isOver = dragOverColId === col.id && sourceColId !== col.id;

            return (
              <div key={col.id} className="w-[300px] flex flex-col h-full">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.colorDot}`} />
                    <h3 className="font-semibold text-zinc-700 text-sm">{col.title}</h3>
                    <span className="bg-zinc-100 text-zinc-500 text-[10px] font-medium px-2 py-0.5 rounded-full border border-zinc-200">
                      {loading ? '…' : colLeads.length}
                    </span>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  className={`flex-1 rounded-xl border p-2 overflow-y-auto space-y-2 transition-colors ${
                    isOver ? `${col.colorBorder} ${col.colorBg}` : 'border-zinc-200/50 bg-zinc-100/50'
                  }`}
                  onDragOver={e => handleDragOver(e, col.id)}
                  onDrop={e => handleDrop(e, col.id)}
                  onDragLeave={() => setDragOverColId(null)}
                >
                  {loading ? (
                    // Skeletons
                    Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
                  ) : colLeads.length === 0 ? (
                    // Empty state
                    <div className="flex-1 flex items-center justify-center h-24">
                      <p className="text-xs text-zinc-400 text-center">Nenhum lead aqui ainda</p>
                    </div>
                  ) : (
                    colLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        columnId={col.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onWhatsApp={handleWhatsApp}
                        onClose={handleOpenClosingModal}
                        isDragging={draggedId === lead.id}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};