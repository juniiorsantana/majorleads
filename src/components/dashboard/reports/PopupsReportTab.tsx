import React, { useState, useEffect } from 'react';
import { Eye, MousePointerClick, TrendingUp, Filter, Loader2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { supabase } from '@/lib/supabase';

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

export const PopupsReportTab: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [popupsData, setPopupsData] = useState<PopupAnalytics[]>([]);
    const [chartData, setChartData] = useState<TimeSeriesData[]>([]);
    const [totals, setTotals] = useState({ views: 0, clicks: 0, conversions: 0, ctr: '0%' });

    useEffect(() => {
        async function fetchAnalytics() {
            setIsLoading(true);
            try {
                // 1. Fetch Aggregated Data per Popup
                const { data: analyticsData, error: analyticsError } = await supabase.rpc('get_popup_analytics');
                if (analyticsError) throw analyticsError;

                let totalV = 0, totalC = 0, totalConv = 0;

                const formattedPopups = (analyticsData || []).map((row: any) => {
                    totalV += Number(row.views);
                    totalC += Number(row.clicks);
                    totalConv += Number(row.conversions);

                    const views = Number(row.views);
                    const clicks = Number(row.clicks);
                    const conversions = Number(row.conversions);

                    return {
                        popup_id: row.popup_id,
                        name: row.popup_name,
                        status: row.popup_status,
                        views,
                        clicks,
                        conversions,
                        ctr: views > 0 ? ((clicks / views) * 100).toFixed(1) + '%' : '0%',
                        convRate: views > 0 ? ((conversions / views) * 100).toFixed(1) + '%' : '0%'
                    };
                });

                // Sort by views descending
                formattedPopups.sort((a, b) => b.views - a.views);

                setPopupsData(formattedPopups);
                setTotals({
                    views: totalV,
                    clicks: totalC,
                    conversions: totalConv,
                    ctr: totalV > 0 ? ((totalC / totalV) * 100).toFixed(1) + '%' : '0%'
                });

                // 2. Fetch Time Series Data
                const { data: timeSeries, error: timeError } = await supabase.rpc('get_popup_time_series');
                if (timeError) throw timeError;

                const formattedChart = (timeSeries || []).map((row: any) => ({
                    name: row.date,
                    views: Number(row.views),
                    convs: Number(row.conversions)
                }));

                setChartData(formattedChart);

            } catch (err) {
                console.error("Error fetching popup analytics:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

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
                                    <td className="px-5 py-4 font-medium text-zinc-900">{popup.name}</td>
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
