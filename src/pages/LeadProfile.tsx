import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Share,
    MessageCircle,
    History,
    Eye,
    Clock,
    Flag,
    Smartphone,
    Globe,
    PlusCircle,
    X
} from 'lucide-react';

export const LeadProfile: React.FC = () => {
    const navigate = useNavigate();

    return (
        <>
            <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/leads')}
                        className="text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <ArrowLeft size={20} />
                        Voltar para Leads
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {/* Actions */}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold border-2 border-white shadow-sm">
                                    JS
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-bold text-zinc-900">João Silva</h1>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                            Hot
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500">
                                        <div className="flex items-center gap-1.5 hover:text-brand-600 transition-colors cursor-pointer">
                                            <span className="text-lg">✉️</span>
                                            joao.silva@exemplo.com
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
                                        <div className="flex items-center gap-1.5 hover:text-brand-600 transition-colors cursor-pointer">
                                            <span className="text-lg">📞</span>
                                            (11) 99876-5432
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-lg">📍</span>
                                            São Paulo, SP
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none items-center justify-center gap-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex">
                                    <Share size={18} />
                                    Exportar
                                </button>
                                <button className="flex-1 md:flex-none items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex">
                                    <MessageCircle size={18} />
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Sessões', value: '12', icon: History },
                            { label: 'Páginas Vistas', value: '48', icon: Eye },
                            { label: 'Tempo Total', value: '32m 15s', icon: Clock },
                            { label: 'Conversões', value: '3', icon: Flag, highlight: true }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-1">
                                <span className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                                    <stat.icon size={18} />
                                    {stat.label}
                                </span>
                                <span className={`text-2xl font-bold ${stat.highlight ? 'text-green-600' : 'text-zinc-900'}`}>
                                    {stat.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Timeline */}
                        <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
                            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-zinc-900">Timeline de Atividade</h2>
                                <select className="text-sm border-zinc-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 py-1.5 pl-2 pr-8 bg-zinc-50">
                                    <option>Tudo</option>
                                    <option>Sessões</option>
                                    <option>Conversões</option>
                                </select>
                            </div>
                            <div className="p-6">
                                <div className="mb-8 relative">
                                    <div className="sticky top-0 bg-white z-10 py-2 mb-4 border-b border-zinc-100 flex items-center">
                                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50 px-2 py-1 rounded">Hoje, 24 Fev</span>
                                    </div>
                                    <div className="relative space-y-8 pl-3">
                                        <div className="absolute top-2 bottom-0 left-[11px] w-0.5 bg-zinc-200"></div>
                                        {/* Event 1 */}
                                        <div className="relative flex gap-4 group">
                                            <div className="absolute left-[-5px] top-1.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm z-10"></div>
                                            <div className="flex-1 bg-zinc-50 rounded-lg p-4 border border-zinc-200 hover:border-brand-200 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-zinc-900 text-sm">Formulário Enviado</span>
                                                    <span className="text-xs text-zinc-400 font-mono">14:32</span>
                                                </div>
                                                <p className="text-sm text-zinc-600 mb-2">Preencheu o formulário de "Solicitar Orçamento"</p>
                                                <div className="text-xs text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200 inline-block">
                                                    Capturado: nome, email, telefone, empresa
                                                </div>
                                            </div>
                                        </div>
                                        {/* Event 2 */}
                                        <div className="relative flex gap-4 group">
                                            <div className="absolute left-[-5px] top-1.5 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-white shadow-sm z-10"></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium text-zinc-900 text-sm">Clicou no Popup</span>
                                                    <span className="text-xs text-zinc-400 font-mono">14:30</span>
                                                </div>
                                                <p className="text-sm text-zinc-500">Interagiu com o popup "Oferta Relâmpago" (CTA: Ver Preços)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Technical Data */}
                            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50">
                                    <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Dados Técnicos</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-zinc-500 block mb-1">Primeira Origem (UTM)</label>
                                        <div className="text-sm text-zinc-900 font-medium break-all">
                                            google / cpc / campanha-verao-24
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-zinc-500 block mb-1">Dispositivo</label>
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-900">
                                                <Smartphone size={16} className="text-zinc-400" />
                                                iPhone 14
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-500 block mb-1">Navegador</label>
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-900">
                                                <Globe size={16} className="text-zinc-400" />
                                                Safari 17.2
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Tags</h3>
                                    <button className="text-zinc-400 hover:text-brand-600 transition-colors">
                                        <PlusCircle size={18} />
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                                            decisor
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 group cursor-pointer hover:bg-zinc-200">
                                            newsletter
                                            <X size={12} className="ml-1.5 text-zinc-400 hover:text-zinc-600" />
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 group cursor-pointer hover:bg-zinc-200">
                                            saas
                                            <X size={12} className="ml-1.5 text-zinc-400 hover:text-zinc-600" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};