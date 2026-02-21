import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, PieChart, Pie, Cell } from 'recharts';
import { DownloadCloud } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sub-tabs
import { PopupsReportTab } from '@/components/dashboard/reports/PopupsReportTab';
import { UTMReportTab } from '@/components/dashboard/reports/UTMReportTab';

const trafficData = [
    { name: '01 Fev', visitors: 850, leads: 120 },
    { name: '05 Fev', visitors: 1100, leads: 200 },
    { name: '10 Fev', visitors: 950, leads: 160 },
    { name: '15 Fev', visitors: 2430, leads: 312 }, // Spike
    { name: '20 Fev', visitors: 1400, leads: 310 },
    { name: '25 Fev', visitors: 1900, leads: 380 },
    { name: '28 Fev', visitors: 1600, leads: 320 },
];

const trafficSources = [
    { name: 'Facebook', value: 45, color: '#7C3AED' },
    { name: 'Google Ads', value: 20, color: '#3B82F6' },
    { name: 'Organic', value: 15, color: '#10B981' },
    { name: 'Direct', value: 12, color: '#F59E0B' },
    { name: 'Outros', value: 8, color: '#EF4444' },
];

export const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <>
            <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-900">Relatórios</h1>

                <div className="flex items-center gap-2">
                    <div className="h-9 px-3 py-1 flex items-center border border-zinc-200 rounded-lg text-sm bg-white text-zinc-600 cursor-not-allowed opacity-50">
                        Últimos 30 dias ▼
                    </div>

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
                                { label: 'Total Visitas', value: '42,892', change: '+12.5%', isPos: true },
                                { label: 'Leads Capturados', value: '3,450', change: '+8.2%', isPos: true },
                                { label: 'Taxa Conv.', value: '8.04%', change: '-1.2%', isPos: false },
                                { label: 'Receita Est.', value: 'R$ 152k', change: '+24.5%', isPos: true },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                                    <p className="text-sm font-medium text-zinc-500 mb-2">{stat.label}</p>
                                    <p className="text-3xl font-bold text-zinc-900">{stat.value}</p>
                                    <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${stat.isPos ? 'text-green-600' : 'text-red-600'}`}>
                                        {stat.change} vs período anterior
                                    </p>
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
                                    <AreaChart data={trafficData}>
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
                                    {[
                                        { label: 'Visitantes', val: '42,892', pct: 100, color: 'bg-brand-900' },
                                        { label: 'Engajados', val: '18,443', pct: 43, color: 'bg-brand-600' },
                                        { label: 'Leads', val: '3,450', pct: 8, color: 'bg-brand-400' },
                                        { label: 'Convertidos', val: '892', pct: 2.1, color: 'bg-brand-300' },
                                    ].map((step, i) => (
                                        <div key={i} className="relative">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-zinc-700">{step.label}</span>
                                                <span className="font-bold text-zinc-900">{step.val}</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                                                <div className={`h-full rounded-full ${step.color}`} style={{ width: `${Math.max(step.pct, 5)}%` }}></div>
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
                                            <Pie data={trafficSources} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {trafficSources.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-bold text-zinc-900">Top 5</span>
                                        <span className="text-xs text-zinc-500">Canais</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                                    {trafficSources.map((s) => (
                                        <div key={s.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                                                <span className="text-zinc-600">{s.name}</span>
                                            </div>
                                            <span className="font-medium">{s.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- Popups Específicos --- */}
                    <TabsContent value="popups" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <PopupsReportTab />
                    </TabsContent>

                    {/* --- UTM / Campanhas --- */}
                    <TabsContent value="utm" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <UTMReportTab />
                    </TabsContent>

                </Tabs>
            </div>
        </>
    );
};