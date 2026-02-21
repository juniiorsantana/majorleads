import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Link2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UTMAnalytics {
    campaign: string;
    source: string;
    medium: string;
    visits: number;
    leads: number;
    convRate: string;
}

export const UTMReportTab: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [campaignsData, setCampaignsData] = useState<UTMAnalytics[]>([]);

    useEffect(() => {
        async function fetchUTMData() {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_utm_analytics');
                if (error) throw error;

                const formatted = (data || []).map((row: any) => {
                    const visits = Number(row.visits);
                    const leads = Number(row.leads);
                    return {
                        campaign: row.campaign,
                        source: row.source,
                        medium: row.medium,
                        visits,
                        leads,
                        convRate: visits > 0 ? ((leads / visits) * 100).toFixed(1) + '%' : '0%'
                    };
                });

                setCampaignsData(formatted);
            } catch (err) {
                console.error("Error fetching UTM analytics:", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUTMData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex bg-white items-center justify-center p-12 mt-6 rounded-xl border border-zinc-200">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 flex-1">
                    <Filter className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-700">Filtros UTM:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select className="h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                        <option value="">Source (Todas)</option>
                    </select>
                    <select className="h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                        <option value="">Medium (Todos)</option>
                    </select>
                    <select className="h-9 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                        <option value="">Campaign (Todas)</option>
                    </select>
                </div>
                <button className="h-9 px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 bg-transparent hover:bg-zinc-100 rounded-md transition-colors ml-auto">
                    Limpar filtros
                </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-violet-500" />
                        <h3 className="text-base font-semibold text-zinc-900">Performance de Campanhas</h3>
                    </div>
                    <button className="hidden sm:inline-flex h-9 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-md transition-colors">Exportar CSV</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                            <tr>
                                <th className="px-5 py-4 font-medium">Campanha</th>
                                <th className="px-5 py-4 font-medium">Source</th>
                                <th className="px-5 py-4 font-medium">Medium</th>
                                <th className="px-5 py-4 font-medium text-right">Visitas</th>
                                <th className="px-5 py-4 font-medium text-right">Leads</th>
                                <th className="px-5 py-4 font-medium text-right">Conversão</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {campaignsData.length > 0 ? campaignsData.map((data, index) => (
                                <tr key={index} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                                    <td className="px-5 py-4 font-medium text-violet-600 group-hover:underline decoration-violet-500/30 underline-offset-4">
                                        {data.campaign}
                                    </td>
                                    <td className="px-5 py-4 text-zinc-600">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            {data.source}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-zinc-600">
                                        {data.medium}
                                    </td>
                                    <td className="px-5 py-4 text-right text-zinc-600">
                                        {data.visits.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-4 text-right font-medium text-zinc-900">
                                        {data.leads.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-5 py-4 text-right font-medium text-emerald-600">
                                        {data.convRate}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                                        Nenhum dado de campanha (UTM) registrado no período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100/50 text-violet-500 mb-4">
                    <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 mb-2">Heatmap de UTM × Dispositivo</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                    A visualização em grade das suas campanhas por dispositivo e horários estará disponível em breve.
                </p>
                <button className="mt-6 h-10 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-md transition-colors">Saiba mais sobre relatórios Pro</button>
            </div>
        </div>
    );
};
