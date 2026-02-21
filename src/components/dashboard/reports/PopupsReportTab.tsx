import React, { useState, useEffect } from 'react';
import { Eye, MousePointerClick, TrendingUp, Filter, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay } from 'date-fns';

interface PopupAnalytics {
    popup_id: string;
    popup_name: string;
    popup_status: string;
    views: number;
    clicks: number;
    conversions: number;
    ctr: string;
    convRate: string;
}

interface TimeSeriesData {
    name: string;
    views: number;
    convs: number;
}

interface PopupsReportTabProps {
    dateRange: string;
}

export const PopupsReportTab: React.FC<PopupsReportTabProps> = ({ dateRange }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [popupsData, setPopupsData] = useState<PopupAnalytics[]>([]);
    const [chartData, setChartData] = useState<TimeSeriesData[]>([]);
    const [totals, setTotals] = useState({ views: 0, clicks: 0, conversions: 0, ctr: '0%' });

    useEffect(() => {
        async function fetchAnalytics() {
            if (!user) return;
            setIsLoading(true);

            try {
                const { data: site } = await supabase.from('sites').select('id').eq('user_id', user.id).single();
                if (!site) return;

                const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
                const startDate = startOfDay(subDays(new Date(), days - 1));

                // 1. Fetch Popups
                const { data: popups } = await supabase.from('popups').select('id, name, status').eq('site_id', site.id);
                const popupsMap = new Map(popups?.map(p => [p.id, { ...p, views: 0, clicks: 0, conversions: 0 }]));

                // 2. Fetch Events for these popups
                const { data: events } = await supabase
                    .from('events')
                    .select('event, timestamp, properties')
                    .gte('timestamp', startDate.getTime());

                // 3. Fetch Leads
                const { data: leads } = await supabase
                    .from('leads')
                    .select('id, created_at, popup_id')
                    .eq('site_id', site.id)
                    .gte('created_at', format(startDate, 'yyyy-MM-dd'));

                const timeSeriesMap: Record<string, { views: number, convs: number }> = {};
                for (let i = days - 1; i >= 0; i--) {
                    timeSeriesMap[format(subDays(new Date(), i), 'dd MMM')] = { views: 0, convs: 0 };
                }

                let totalV = 0, totalC = 0, totalConv = 0;

                // Process Events
                if (events) {
                    events.forEach(ev => {
                        const popup_id = ev.properties?.popup_id;
                        if (!popup_id || !popupsMap.has(popup_id)) return;

                        const ts = parseInt(ev.timestamp) || 0;
                        const dayKey = ts > 0 ? format(new Date(ts), 'dd MMM') : null;

                        const p = popupsMap.get(popup_id)!;
                        if (ev.event === 'popup_view') {
                            p.views++; totalV++;
                            if (dayKey && timeSeriesMap[dayKey]) timeSeriesMap[dayKey].views++;
                        }
                        if (['popup_click'].includes(ev.event)) {
                            p.clicks++; totalC++;
                        }
                    });
                }

                // Process Leads
                if (leads) {
                    leads.forEach(lead => {
                        const popup_id = lead.popup_id;
                        if (popup_id && popupsMap.has(popup_id)) {
                            popupsMap.get(popup_id)!.conversions++;
                        }
                        totalConv++; // Count all leads for total conversions

                        const dayKey = format(new Date(lead.created_at), 'dd MMM');
                        if (timeSeriesMap[dayKey]) timeSeriesMap[dayKey].convs++;
                    });
                }

                const formattedPopups = Array.from(popupsMap.values()).map(row => ({
                    popup_id: row.id,
                    popup_name: row.name,
                    popup_status: row.status,
                    views: row.views,
                    clicks: row.clicks,
                    conversions: row.conversions,
                    ctr: row.views > 0 ? ((row.clicks / row.views) * 100).toFixed(1) + '%' : '0%',
                    convRate: row.views > 0 ? ((row.conversions / row.views) * 100).toFixed(1) + '%' : '0%'
                })).sort((a, b) => b.views - a.views);

                setPopupsData(formattedPopups);
                setTotals({
                    views: totalV,
                    clicks: totalC,
                    conversions: totalConv,
                    ctr: totalV > 0 ? ((totalC / totalV) * 100).toFixed(1) + '%' : '0%'
                });

                setChartData(Object.entries(timeSeriesMap).map(([k, v]) => ({ name: k, views: v.views, convs: v.convs })));

            } catch (err) {
                console.error("Error processing popup analytics:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAnalytics();
    }, [user, dateRange]);

    const metrics = [
        { label: 'Exibições Totais', value: totals.views.toLocaleString('pt-BR'), icon: Eye, trend: '', isPositive: true },
        { label: 'Cliques Totais', value: totals.clicks.toLocaleString('pt-BR'), icon: MousePointerClick, trend: '', isPositive: true },
        { label: 'CTR Médio', value: totals.ctr, icon: TrendingUp, trend: '', isPositive: true },
        { label: 'Conversões', value: totals.conversions.toLocaleString('pt-BR'), icon: Filter, trend: '', isPositive: true },
    ];

    if (isLoading) {
        return (
            <div className="flex bg-white items-center justify-center p-12 mt-6 rounded-xl border border-zinc-200">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm transition-all">
                            <div className="flex items-center gap-3 text-zinc-500 mb-3">
                                <div className="p-2 bg-zinc-50 rounded-lg">
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{kpi.label}</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-zinc-900">{kpi.value}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900">Desempenho no Tempo</h3>
                    </div>
                </div>
                <div className="h-[300px] p-6">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Area type="monotone" dataKey="views" stroke="#7C3AED" strokeWidth={2} fill="url(#colorViews)" />
                                <Area type="monotone" dataKey="convs" stroke="#C4B5FD" strokeDasharray="5 5" fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                            <p className="text-sm">Nenhum dado de exibição no período selecionado.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900">Performance por Popup</h3>
                        <p className="text-sm text-zinc-500">Compare os resultados e conversões de cada campanha.</p>
                    </div>
                    <button className="h-9 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-md transition-colors">Ver todos</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                            <tr>
                                <th className="px-5 py-4 font-medium">Nome do Popup</th>
                                <th className="px-5 py-4 font-medium text-right">Exibições</th>
                                <th className="px-5 py-4 font-medium text-right">Cliques</th>
                                <th className="px-5 py-4 font-medium text-right">CTR</th>
                                <th className="px-5 py-4 font-medium text-right">Leads</th>
                                <th className="px-5 py-4 font-medium text-right">Conversão</th>
                                <th className="px-5 py-4 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {popupsData.length > 0 ? popupsData.map((popup) => (
                                <tr key={popup.popup_id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-5 py-4 font-medium text-zinc-900">{popup.popup_name}</td>
                                    <td className="px-5 py-4 text-right text-zinc-600">
                                        {popup.views.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-4 text-right text-zinc-600">
                                        {popup.clicks.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-4 text-right font-medium text-zinc-900">
                                        {popup.ctr}
                                    </td>
                                    <td className="px-5 py-4 text-right text-zinc-600">
                                        {popup.conversions.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-4 text-right font-medium text-violet-600">
                                        {popup.convRate}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        {popup.status === 'active' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Ativo</span>}
                                        {popup.status === 'draft' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700"><span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span> Rascunho</span>}
                                        {popup.status === 'inactive' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700"><span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span> Inativo</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-zinc-500">
                                        Nenhum dado de popup encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
