import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MousePointerClick, Eye, Users, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, CartesianGrid } from 'recharts';
import { parseISO, subDays, startOfDay, endOfDay, format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PopupData {
    id: string;
    name: string;
    status: string;
}

interface PopupStats {
    views: number;
    leads: number;
    clicks: number;
    conversionRate: number;
}

export const PopupReport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [popup, setPopup] = useState<PopupData | null>(null);
    const [stats, setStats] = useState<PopupStats>({ views: 0, leads: 0, clicks: 0, conversionRate: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentLeads, setRecentLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('7d');

    useEffect(() => {
        const fetchPopupData = async () => {
            if (!user || !id) return;
            setIsLoading(true);
            try {
                // 1. Fetch Popup Details
                const { data: popupData, error: popupError } = await supabase
                    .from('popups')
                    .select('id, name, status')
                    .eq('id', id)
                    .single();

                if (popupError) throw popupError;
                if (popupData) setPopup(popupData);

                // 2. Fetch Stats based on date filter
                let startDate = new Date(0); // far past for 'all'
                if (dateFilter === '7d') startDate = startOfDay(subDays(new Date(), 6));
                else if (dateFilter === '30d') startDate = startOfDay(subDays(new Date(), 29));

                // Views & Clicks (from events)
                // Assuming events table has a JSONB generic `properties` column or `popup_id` column
                // Given previous architecture we used: properties->>'popup_id' = id OR we tracked views on the popup directly.
                // Let's assume we read from the popups table directly if we don't have events mapped strictly:
                // but since this is a dashboard, we need time-series. We'll query events table.
                const { data: eventsData, error: evError } = await supabase
                    .from('events')
                    .select('event, timestamp, properties')
                    .gte('timestamp', startDate.getTime())
                // Try to filter directly if popup_id is stored in properties
                // If this fails due to no index, we'll fetch all and filter in JS.
                // .contains('properties', { popup_id: id }); 

                if (evError) console.warn('No events found or error', evError);

                // Leads (from leads table)
                const { data: leadsData, error: ldError } = await supabase
                    .from('leads')
                    .select('id, name, email, created_at, source_url')
                    .eq('popup_id', id)
                    .gte('created_at', format(startDate, 'yyyy-MM-dd'))
                    .order('created_at', { ascending: false });

                if (ldError) console.warn('No leads found or error', ldError);

                setRecentLeads(leadsData?.slice(0, 5) || []);

                // Aggregate stats
                // We'll filter events client-side securely for this user's popup
                let totalViews = 0;
                let totalClicks = 0;
                let dailyStats: Record<string, { views: number, leads: number }> = {};

                // Initialize default days for the chart
                const daysToGen = dateFilter === '7d' ? 7 : (dateFilter === '30d' ? 30 : 0);
                if (daysToGen > 0) {
                    for (let i = daysToGen - 1; i >= 0; i--) {
                        const d = format(subDays(new Date(), i), 'dd MMM');
                        dailyStats[d] = { views: 0, leads: 0 };
                    }
                }

                if (eventsData) {
                    eventsData.forEach((ev: any) => {
                        // Fallback check if properties contains our popup_id
                        const pId = ev.properties?.popup_id;
                        if (pId === id) {
                            if (ev.event === 'popup_view') totalViews++;
                            if (ev.event === 'popup_click') totalClicks++;

                            if (ev.event === 'popup_view' && daysToGen > 0) {
                                const dayKey = format(new Date(parseInt(ev.timestamp) || ev.timestamp), 'dd MMM');
                                if (dailyStats[dayKey]) dailyStats[dayKey].views++;
                            }
                        }
                    });
                }

                const totalLeads = leadsData?.length || 0;
                if (leadsData && daysToGen > 0) {
                    leadsData.forEach((ld: any) => {
                        const dayKey = format(parseISO(ld.created_at), 'dd MMM');
                        if (dailyStats[dayKey]) dailyStats[dayKey].leads++;
                    });
                }

                // If daysToGen is 0 ('all' time), group dynamically
                if (daysToGen === 0 && eventsData) {
                    eventsData.forEach((ev: any) => {
                        if (ev.properties?.popup_id === id && ev.event === 'popup_view') {
                            const dayKey = format(new Date(parseInt(ev.timestamp)), 'dd MMM');
                            if (!dailyStats[dayKey]) dailyStats[dayKey] = { views: 0, leads: 0 };
                            dailyStats[dayKey].views++;
                        }
                    });
                    if (leadsData) {
                        leadsData.forEach((ld: any) => {
                            const dayKey = format(parseISO(ld.created_at), 'dd MMM');
                            if (!dailyStats[dayKey]) dailyStats[dayKey] = { views: 0, leads: 0 };
                            dailyStats[dayKey].leads++;
                        });
                    }
                }

                const cRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;
                setStats({ views: totalViews, leads: totalLeads, clicks: totalClicks, conversionRate: cRate });

                const formattedChartData = Object.entries(dailyStats).map(([date, data]) => ({
                    date,
                    views: data.views,
                    leads: data.leads
                }));
                setChartData(formattedChartData);

            } catch (error) {
                console.error('Error fetching popup details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPopupData();
    }, [id, user, dateFilter]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-zinc-50/50">
                <div className="flex flex-col items-center gap-3 text-zinc-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Carregando relatório...</span>
                </div>
            </div>
        );
    }

    if (!popup) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-zinc-50/50">
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">Popup não encontrado</h2>
                <p className="text-zinc-500 mb-6 font-medium">Os dados deste popup não estão disponíveis.</p>
                <button
                    onClick={() => navigate('/popups')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50"
                >
                    <ArrowLeft size={16} /> Voltar para Popups
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-zinc-50/50">
            {/* Header */}
            <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                        title="Voltar"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                            {popup.name}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${popup.status === 'ativo' ? 'bg-brand-50 text-brand-600' : 'bg-zinc-100 text-zinc-500'
                                }`}>
                                {popup.status}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="h-9 px-3 flex items-center border border-zinc-200 rounded-lg text-sm bg-white text-zinc-700 font-medium cursor-pointer outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow">
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="all">Todo o período</option>
                    </select>
                </div>
            </header>

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Exibições', value: stats.views.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Leads Capturados', value: stats.leads.toLocaleString(), icon: Users, color: 'text-brand-600', bg: 'bg-brand-50' },
                        { label: 'Taxa de Conversão', value: `${stats.conversionRate.toFixed(2)}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Cliques (Ações)', value: stats.clicks.toLocaleString(), icon: MousePointerClick, color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-zinc-600 tracking-tight">{stat.label}</span>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={16} />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-zinc-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Chart */}
                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                    <h3 className="text-base font-semibold text-zinc-900 mb-6">Desempenho de Captura</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C47A" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#00C47A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717A' }} dy={10} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4E4E7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                                    labelStyle={{ color: '#71717A', marginBottom: '4px', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="views" name="Exibições" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                                <Area type="monotone" dataKey="leads" name="Leads" stroke="#00C47A" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Leads Table */}
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-zinc-900">Leads Recentes (Deste Popup)</h3>
                        <button className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                            Ver todos os leads &rarr;
                        </button>
                    </div>
                    {recentLeads.length > 0 ? (
                        <div className="overflow-x-auto min-h-[150px]">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-zinc-50 border-b border-zinc-100 text-xs uppercase text-zinc-500 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Lead</th>
                                        <th className="px-6 py-4">Contato</th>
                                        <th className="px-6 py-4 text-right">Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentLeads.map((lead, i) => (
                                        <tr key={lead.id} className="border-b border-zinc-100/50 hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-900">{lead.name || 'Anônimo'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-zinc-600">{lead.email || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-zinc-500 font-mono text-xs">
                                                {format(parseISO(lead.created_at), "dd/MM 'às' HH:mm")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center justify-center bg-zinc-50/30">
                            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                                <Users className="w-5 h-5 text-zinc-400" />
                            </div>
                            <p className="text-sm font-semibold text-zinc-700">Nenhum lead ainda</p>
                            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                                Não foram encontrados leads capturados por este popup no período selecionado.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
