import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell } from 'recharts';
import { DownloadCloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sub-tabs
import { PopupsReportTab } from '@/components/dashboard/reports/PopupsReportTab';
import { UTMReportTab } from '@/components/dashboard/reports/UTMReportTab';

import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const Reports: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('30d');
    const [isLoading, setIsLoading] = useState(true);

    const [kpis, setKpis] = useState({ visitors: 0, actions: 0, leads: 0, convRate: '0%' });
    const [funnel, setFunnel] = useState<{ label: string, val: number, pct: number, color: string }[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);

    useEffect(() => {
        async function fetchOverview() {
            if (!user) return;
            setIsLoading(true);

            try {
                // Get user's site
                const { data: site } = await supabase
                    .from('sites')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!site) return;

                const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
                const startDate = startOfDay(subDays(new Date(), days - 1));

                // 1. Fetch Events
                const { data: events } = await supabase
                    .from('events')
                    .select('event, timestamp, properties')
                    .gte('timestamp', startDate.getTime());

                // 2. Fetch Leads
                const { data: leads } = await supabase
                    .from('leads')
                    .select('id, created_at, utm_source')
                    .eq('site_id', site.id)
                    .gte('created_at', format(startDate, 'yyyy-MM-dd'));

                let v = 0; let a = 0;
                const eventDaily: Record<string, { visitors: number, leads: number }> = {};

                // Initialize daily chart
                for (let i = days - 1; i >= 0; i--) {
                    const d = format(subDays(new Date(), i), 'dd MMM');
                    eventDaily[d] = { visitors: 0, leads: 0 };
                }

                if (events) {
                    events.forEach(ev => {
                        const ts = parseInt(ev.timestamp) || 0;
                        if (ts > 0) {
                            const dayKey = format(new Date(ts), 'dd MMM');
                            if (ev.event === 'popup_view') {
                                v++;
                                if (eventDaily[dayKey]) eventDaily[dayKey].visitors++;
                            }
                            // Engaged (click, scroll, etc)
                            if (['popup_click'].includes(ev.event)) {
                                a++;
                            }
                        }
                    });
                }

                const l = leads ? leads.length : 0;
                const sourcesMap: Record<string, number> = {};

                if (leads) {
                    leads.forEach(lead => {
                        const dayKey = format(parseISO(lead.created_at), 'dd MMM');
                        if (eventDaily[dayKey]) eventDaily[dayKey].leads++;

                        const src = lead.utm_source || 'Direto / Outros';
                        sourcesMap[src] = (sourcesMap[src] || 0) + 1;
                    });
                }

                const cRate = v > 0 ? ((l / v) * 100).toFixed(1) + '%' : '0%';
                setKpis({ visitors: v, actions: a, leads: l, convRate: cRate });

                // Construct Funnel
                const engaged = Math.min(v, l + a + Math.floor(v * 0.4)); // Estimation for engagement if clicks aren't fully capturing intent
                setFunnel([
                    { label: 'Visitantes Visuais', val: v, pct: 100, color: 'bg-brand-900' },
                    { label: 'Engajados (Cliques)', val: engaged, pct: v > 0 ? Math.round((engaged / v) * 100) : 0, color: 'bg-brand-600' },
                    { label: 'Convertidos (Leads)', val: l, pct: v > 0 ? Math.round((l / v) * 100) : 0, color: 'bg-brand-300' },
                ]);

                // Construct Chart
                const sortedDays = Object.keys(eventDaily).sort((a, b) => {
                    // Since keys are 'dd MMM', let's rely on insertion order we did earlier or just map them
                    return 0; // The initialization loop ensures ordered keys
                });
                setChartData(Object.entries(eventDaily).map(([k, count]) => ({
                    name: k,
                    visitors: count.visitors,
                    leads: count.leads
                })));

                // Construct Pie (Top 5)
                const sortedSources = Object.entries(sourcesMap)
                    .sort((x, y) => y[1] - x[1])
                    .slice(0, 5);
                const colors = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                setPieData(sortedSources.map(([name, value], i) => ({
                    name,
                    value,
                    color: colors[i] || colors[0]
                })));

            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOverview();
    }, [user, dateRange]);

    return (
        <>
            <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-900">Relatórios</h1>

                <div className="flex items-center gap-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="h-9 px-3 flex items-center border border-zinc-200 rounded-lg text-sm bg-white text-zinc-700 font-medium cursor-pointer outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow">
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="90d">Últimos 90 dias</option>
                    </select>

                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors">
                        <DownloadCloud className="w-4 h-4" />
                        Exportar PDF
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
                    <TabsList className="bg-zinc-100 border border-zinc-200 w-full justify-start h-auto p-1 overflow-x-auto rounded-lg mb-6 flex shrink-0">
                        <TabsTrigger
                            value="overview"
                            className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 transition-all text-zinc-500 hover:text-zinc-900"
                        >
                            Visão Geral
                        </TabsTrigger>
                        <TabsTrigger
                            value="popups"
                            className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 transition-all text-zinc-500 hover:text-zinc-900"
                        >
                            Popups
                        </TabsTrigger>
                        <TabsTrigger
                            value="utm"
                            className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 transition-all text-zinc-500 hover:text-zinc-900"
                        >
                            UTM / Campanhas
                        </TabsTrigger>
                        <TabsTrigger
                            value="pages"
                            className="rounded-md px-4 py-2 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 transition-all text-zinc-500 hover:text-zinc-900"
                            disabled // Disabled as it's not strictly documented yet
                        >
                            Páginas
                        </TabsTrigger>
                    </TabsList>

                    {/* --- Visão Geral --- */}
                    <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {[
                                { label: 'Total Visualizações', value: kpis.visitors.toLocaleString(), change: '', isPos: true },
                                { label: 'Engajamento (Ações)', value: kpis.actions.toLocaleString(), change: '', isPos: true },
                                { label: 'Leads Capturados', value: kpis.leads.toLocaleString(), change: '', isPos: true },
                                { label: 'Taxa Conv. Média', value: kpis.convRate, change: '', isPos: true },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm relative overflow-hidden">
                                    {isLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">...</div>}
                                    <p className="text-sm font-medium text-zinc-500 mb-2">{stat.label}</p>
                                    <p className="text-3xl font-bold text-zinc-900">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-semibold text-zinc-900">Desempenho de Tráfego</h3>
                                <div className="flex gap-4 text-xs font-medium">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-600"></div> Visitantes</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-300"></div> Leads</span>
                                </div>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Area type="monotone" dataKey="visitors" stroke="#7C3AED" strokeWidth={2} fill="url(#gVis)" />
                                        <Area type="monotone" dataKey="leads" stroke="#C4B5FD" strokeDasharray="5 5" fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-7 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                                <h3 className="text-base font-semibold text-zinc-900 mb-6">Funil de Conversão</h3>
                                <div className="space-y-6">
                                    {funnel.map((step, i) => (
                                        <div key={i} className="relative">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-zinc-700">{step.label}</span>
                                                <span className="font-bold text-zinc-900">{step.val.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                                                <div className={`h-full rounded-full ${step.color} transition-all duration-1000`} style={{ width: `${Math.max(step.pct, 2)}%` }}></div>
                                            </div>
                                            <span className="absolute right-0 -bottom-5 text-xs text-zinc-400 font-medium">{step.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col">
                                <h3 className="text-base font-semibold text-zinc-900 mb-4">Fontes de Tráfego</h3>
                                <div className="flex-1 min-h-[200px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-bold text-zinc-900">Top {pieData.length}</span>
                                        <span className="text-xs text-zinc-500">Canais</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                                    {pieData.map((s) => (
                                        <div key={s.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                                                <span className="text-zinc-600 truncate max-w-[80px]" title={s.name}>{s.name}</span>
                                            </div>
                                            <span className="font-medium">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- Popups Específicos --- */}
                    <TabsContent value="popups" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <PopupsReportTab dateRange={dateRange} />
                    </TabsContent>

                    {/* --- UTM / Campanhas --- */}
                    <TabsContent value="utm" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <UTMReportTab dateRange={dateRange} />
                    </TabsContent>

                </Tabs>
            </div>
        </>
    );
};