import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Calendar,
  ChevronDown,
  Users,
  UserPlus,
  Percent,
  Layers,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Smartphone,
  Monitor,
  FileText,
  Inbox
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d';

interface KPIData {
  totalLeads: number;
  activePopups: number;
  conversionRate: number;
  leadsThisPeriod: number;
  leadsPreviousPeriod: number;
}

interface ChartPoint {
  name: string;
  leads: number;
}

interface RecentLead {
  id: string;
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  utm_source: string | null;
  device_type: string | null;
  created_at: string;
  popup_name?: string | null;
}

interface UTMSource {
  source: string;
  count: number;
  pct: string;
  w: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dateRangeLabel: Record<DateRange, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
};

function getDaysBack(range: DateRange): number {
  return range === '7d' ? 7 : range === '30d' ? 30 : 90;
}

function formatDateLabel(dateStr: string, range: DateRange): string {
  const d = new Date(dateStr);
  if (range === '7d') {
    return d.toLocaleDateString('pt-BR', { weekday: 'short' });
  }
  return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleDateString('pt-BR', { month: 'short' })}`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function pctChange(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? '+100%' : '0%';
  const ch = ((curr - prev) / prev) * 100;
  return `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-zinc-100 rounded ${className}`} />
);

const KPICard = ({
  title, value, subtitle, icon: Icon, bgClass, iconColorClass, trendPositive, loading
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  bgClass: string;
  iconColorClass: string;
  trendPositive?: boolean | null;
  loading?: boolean;
}) => (
  <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col gap-2 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-zinc-500 font-medium">{title}</span>
      <div className={`p-1.5 rounded-md ${bgClass} ${iconColorClass}`}>
        <Icon size={20} />
      </div>
    </div>
    {loading ? (
      <>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32 mt-1" />
      </>
    ) : (
      <>
        <span className="text-3xl font-bold text-zinc-900">{value}</span>
        <div className={`text-sm mt-1 flex items-center gap-1 font-medium ${trendPositive === true ? 'text-green-600' :
            trendPositive === false ? 'text-red-500' :
              'text-zinc-500 font-normal'
          }`}>
          {trendPositive !== null && trendPositive !== undefined && <TrendingUp size={16} />}
          {subtitle}
        </div>
      </>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-zinc-500 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400 gap-2">
    <Inbox size={28} />
    <p className="text-sm">{message}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [kpi, setKpi] = useState<KPIData>({
    totalLeads: 0,
    activePopups: 0,
    conversionRate: 0,
    leadsThisPeriod: 0,
    leadsPreviousPeriod: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [utmSources, setUtmSources] = useState<UTMSource[]>([]);
  const [deviceData, setDeviceData] = useState<{ name: string; value: number; color: string }[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const days = getDaysBack(dateRange);
      const now = new Date();
      const startCurrent = new Date(now.getTime() - days * 86400000).toISOString();
      const startPrevious = new Date(now.getTime() - days * 2 * 86400000).toISOString();

      // Get user's site
      const { data: site } = await supabase
        .from('sites')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!site) {
        setLoading(false);
        return;
      }

      const siteId = site.id;

      // Parallel queries
      const [
        { count: totalLeads },
        { count: leadsThisPeriod },
        { count: leadsPreviousPeriod },
        { count: activePopups },
        { data: allLeads },
        { data: recentLeadsData },
      ] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('site_id', siteId),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('site_id', siteId).gte('created_at', startCurrent),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('site_id', siteId).gte('created_at', startPrevious).lt('created_at', startCurrent),
        supabase.from('popups').select('id', { count: 'exact', head: true }).eq('site_id', siteId).eq('status', 'active'),
        supabase.from('leads').select('created_at, utm_source, device_type').eq('site_id', siteId).gte('created_at', startCurrent),
        supabase.from('leads')
          .select('id, name, email, whatsapp, utm_source, device_type, created_at, popup_id')
          .eq('site_id', siteId)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      // KPI
      setKpi({
        totalLeads: totalLeads ?? 0,
        activePopups: activePopups ?? 0,
        conversionRate: 0, // Requer eventos de pageview — ainda não disponível
        leadsThisPeriod: leadsThisPeriod ?? 0,
        leadsPreviousPeriod: leadsPreviousPeriod ?? 0,
      });

      // Chart: group leads by day
      const pointsMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        pointsMap[key] = 0;
      }
      (allLeads ?? []).forEach((lead) => {
        const key = lead.created_at.slice(0, 10);
        if (key in pointsMap) pointsMap[key]++;
      });

      // For 30/90 days, group every N days to avoid crowding
      const groupEvery = days === 7 ? 1 : days === 30 ? 3 : 10;
      const keys = Object.keys(pointsMap).sort();
      const grouped: ChartPoint[] = [];
      for (let i = 0; i < keys.length; i += groupEvery) {
        const chunk = keys.slice(i, i + groupEvery);
        const leadsSum = chunk.reduce((s, k) => s + pointsMap[k], 0);
        grouped.push({
          name: formatDateLabel(chunk[0], dateRange),
          leads: leadsSum,
        });
      }
      setChartData(grouped);

      // Recent leads — join popup name if available
      const enrichedLeads: RecentLead[] = await Promise.all(
        (recentLeadsData ?? []).map(async (lead: any) => {
          let popup_name: string | null = null;
          if (lead.popup_id) {
            const { data: popup } = await supabase
              .from('popups')
              .select('name')
              .eq('id', lead.popup_id)
              .single();
            popup_name = popup?.name ?? null;
          }
          return { ...lead, popup_name };
        })
      );
      setRecentLeads(enrichedLeads);

      // UTM Sources
      const utmCounts: Record<string, number> = {};
      (allLeads ?? []).forEach((lead) => {
        const src = lead.utm_source || 'direto';
        utmCounts[src] = (utmCounts[src] ?? 0) + 1;
      });
      const totalUtm = Object.values(utmCounts).reduce((a, b) => a + b, 0);
      const sorted = Object.entries(utmCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([source, count]) => {
          const pct = totalUtm > 0 ? ((count / totalUtm) * 100).toFixed(1) : '0';
          const maxCount = Math.max(...Object.values(utmCounts));
          const w = maxCount > 0 ? `${Math.round((count / maxCount) * 100)}%` : '0%';
          return { source, count, pct: `${pct}%`, w };
        });
      setUtmSources(sorted);

      // Devices
      const devCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
      (allLeads ?? []).forEach((lead) => {
        const dev = lead.device_type;
        if (dev === 'mobile') devCounts['Mobile']++;
        else if (dev === 'tablet') devCounts['Tablet']++;
        else devCounts['Desktop']++;
      });
      const totalDevs = Object.values(devCounts).reduce((a, b) => a + b, 0);
      const COLORS = { Mobile: '#7C3AED', Desktop: '#A78BFA', Tablet: '#DDD6FE' };
      setDeviceData(
        Object.entries(devCounts).map(([name, count]) => ({
          name,
          value: totalDevs > 0 ? Math.round((count / totalDevs) * 100) : 0,
          color: COLORS[name as keyof typeof COLORS],
        }))
      );
    } catch (err) {
      console.error('Overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodChange = pctChange(kpi.leadsThisPeriod, kpi.leadsPreviousPeriod);
  const periodPositive = kpi.leadsThisPeriod >= kpi.leadsPreviousPeriod;

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold text-zinc-900">Overview</h1>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors">
            <Bell size={20} />
          </button>

          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => setShowDateMenu((v) => !v)}
              className="flex items-center bg-white border border-zinc-200 rounded-lg px-3 py-1.5 shadow-sm hover:border-zinc-300 transition-colors cursor-pointer text-sm"
            >
              <Calendar size={16} className="text-zinc-500 mr-2" />
              <span className="text-zinc-700 font-medium">{dateRangeLabel[dateRange]}</span>
              <ChevronDown size={16} className="text-zinc-400 ml-2" />
            </button>
            {showDateMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 w-44 overflow-hidden">
                {(Object.keys(dateRangeLabel) as DateRange[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setDateRange(key); setShowDateMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-zinc-50 ${dateRange === key ? 'text-brand-600 font-semibold bg-brand-50' : 'text-zinc-700'
                      }`}
                  >
                    {dateRangeLabel[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Leads"
            value={loading ? '—' : kpi.totalLeads.toLocaleString('pt-BR')}
            subtitle={loading ? '' : `${kpi.leadsThisPeriod.toLocaleString('pt-BR')} neste período`}
            icon={Users}
            bgClass="bg-zinc-50"
            iconColorClass="text-zinc-500"
            trendPositive={null}
            loading={loading}
          />
          <KPICard
            title="Leads no Período"
            value={loading ? '—' : kpi.leadsThisPeriod.toLocaleString('pt-BR')}
            subtitle={loading ? '' : `${periodChange} vs período anterior`}
            icon={UserPlus}
            bgClass="bg-violet-50"
            iconColorClass="text-brand-600"
            trendPositive={periodPositive}
            loading={loading}
          />
          <KPICard
            title="Taxa de Conversão"
            value="—"
            subtitle="Disponível com Tracker.js ativo"
            icon={Percent}
            bgClass="bg-green-50"
            iconColorClass="text-green-600"
            trendPositive={null}
            loading={false}
          />
          <KPICard
            title="Popups Ativos"
            value={loading ? '—' : String(kpi.activePopups)}
            subtitle="Rodando agora"
            icon={Layers}
            bgClass="bg-amber-50"
            iconColorClass="text-amber-600"
            trendPositive={null}
            loading={loading}
          />
        </div>

        {/* Chart & UTM Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Area Chart */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Leads Capturados</h3>
                <p className="text-sm text-zinc-500">Evolução no período selecionado</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span> Leads
              </div>
            </div>
            <div className="h-[280px] w-full">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : chartData.length === 0 ? (
                <EmptyState message="Nenhum lead capturado neste período" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="leads" name="Leads" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* UTM Sources */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 flex flex-col shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h3 className="text-base font-semibold text-zinc-900">Top UTM Sources</h3>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : utmSources.length === 0 ? (
              <EmptyState message="Sem dados de UTM neste período" />
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50/50 text-xs text-zinc-500 uppercase font-medium">
                    <tr>
                      <th className="px-5 py-3 w-1/2">Source</th>
                      <th className="px-5 py-3 text-right">Leads</th>
                      <th className="px-5 py-3 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-zinc-50">
                    {utmSources.map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-zinc-900 truncate max-w-[120px]">{row.source}</td>
                        <td className="px-5 py-3 text-right text-zinc-600">
                          {row.count.toLocaleString('pt-BR')}
                          <div className="h-1 w-full bg-zinc-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: row.w }}></div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-green-600">{row.pct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Devices + Recent leads */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Devices donut */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900 mb-1">Dispositivos</h3>
            <p className="text-sm text-zinc-500 mb-4">Leads por tipo de dispositivo</p>
            {loading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : deviceData.every((d) => d.value === 0) ? (
              <EmptyState message="Sem dados de dispositivo ainda" />
            ) : (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Leads']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-around mt-2">
                  {deviceData.map((dev) => (
                    <div key={dev.name} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dev.color }}></span>
                      <span className="text-zinc-600">{dev.name}</span>
                      <span className="font-semibold text-zinc-900">{dev.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent leads activity */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Leads Recentes</h3>
                <p className="text-sm text-zinc-500">Últimas capturas do seu site</p>
              </div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>

            <div className="flex-1 divide-y divide-zinc-50">
              {loading ? (
                <div className="p-5 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-3 w-8" />
                    </div>
                  ))}
                </div>
              ) : recentLeads.length === 0 ? (
                <div className="p-6">
                  <EmptyState message="Nenhum lead capturado ainda. Instale o script no seu site para começar." />
                </div>
              ) : (
                recentLeads.map((lead) => {
                  const displayName = lead.name || lead.email || lead.whatsapp || 'Visitante anônimo';
                  const isEmail = !lead.name && lead.email;
                  const DevIcon = lead.device_type === 'mobile' ? Smartphone : Monitor;

                  return (
                    <div key={lead.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 shrink-0 mt-0.5">
                        <UserPlus size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-900 font-medium truncate">
                          <span className="text-brand-700">{displayName}</span>
                          {lead.popup_name && (
                            <> via popup <span className="font-semibold">"{lead.popup_name}"</span></>
                          )}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                          <DevIcon size={11} />
                          {lead.utm_source ? `via ${lead.utm_source}` : 'Fonte desconhecida'}
                          {isEmail && (
                            <span className="font-mono text-zinc-400">{lead.email}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-400 font-medium shrink-0">{timeAgo(lead.created_at)}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 text-center">
              <a href="#/leads" className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors inline-flex items-center gap-1">
                Ver todos os leads <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};