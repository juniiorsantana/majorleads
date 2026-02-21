import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
    MapPin,
    Calendar,
    MousePointerClick,
    Mail,
    ArrowDown,
    X,
    Filter
} from 'lucide-react';

interface LeadData {
    id: string;
    visitor_id: string | null;
    site_id: string | null;
    name: string | null;
    email: string | null;
    whatsapp: string | null;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    created_at: string;
}

interface EventData {
    id: string;
    session_id: string;
    event: string;
    url: string | null;
    path: string | null;
    properties: any;
    timestamp: number;
    created_at: string;
}

export const LeadProfile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    const [lead, setLead] = useState<LeadData | null>(null);
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllEvents, setShowAllEvents] = useState(false);

    useEffect(() => {
        const fetchLeadAndEvents = async () => {
            if (!user || !id) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch Lead
                const { data: leadData, error: leadError } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (leadError) throw leadError;
                if (!leadData) {
                    setError('Lead não encontrado.');
                    return;
                }
                setLead(leadData);

                if (leadData.visitor_id && leadData.site_id) {
                    // Fetch Events for this visitor and site
                    const { data: eventsData, error: eventsError } = await supabase
                        .from('events')
                        .select('*')
                        .eq('visitor_id', leadData.visitor_id)
                        .eq('site_id', leadData.site_id)
                        .order('timestamp', { ascending: false });

                    if (eventsError) throw eventsError;
                    setEvents(eventsData || []);
                }
            } catch (err: any) {
                console.error("Error fetching lead data:", err);
                setError("Não foi possível carregar os dados do lead.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeadAndEvents();
    }, [user, id]);

    // Metrics calculations
    const uniqueSessions = new Set(events.map(e => e.session_id)).size;
    const pageViews = events.filter(e => e.event === 'page_view').length;

    // Calculate total time (sum of time_on_page events)
    let totalTimeSeconds = 0;
    events.filter(e => e.event === 'time_on_page').forEach(e => {
        const timeSpent = e.properties?.timeSpent || 0;
        totalTimeSeconds += timeSpent;
    });

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.floor(seconds)}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    };

    const conversions = events.filter(e => e.event === 'popup_clicked' || e.event === 'form_submit').length;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatEventTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Process events for timeline
    const processedEvents = useMemo(() => {
        const consolidated: EventData[] = [];
        const seenTimeOnPage = new Set<string>();
        const seenScrollDepth = new Set<string>();

        // We assume events are already sorted by timestamp DESC
        for (const event of events) {
            const key = `${event.session_id}_${event.path}`;
            if (event.event === 'time_on_page') {
                if (!seenTimeOnPage.has(key)) {
                    seenTimeOnPage.add(key);
                    consolidated.push(event); // keep max
                }
            } else if (event.event === 'scroll_depth') {
                if (!seenScrollDepth.has(key)) {
                    seenScrollDepth.add(key);
                    consolidated.push(event); // keep max
                }
            } else {
                consolidated.push(event);
            }
        }

        const technicalEvents = ['tab_hidden', 'tab_visible', 'idle'];
        return consolidated.filter(e => showAllEvents || !technicalEvents.includes(e.event));
    }, [events, showAllEvents]);

    if (loading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="flex-1 p-8">
                <button onClick={() => navigate('/dashboard/leads')} className="mb-4 flex items-center gap-2 text-zinc-500 hover:text-zinc-800">
                    <ArrowLeft size={20} /> Voltar
                </button>
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error || 'Lead não encontrado.'}</div>
            </div>
        );
    }

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
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold border-2 border-white shadow-sm">
                                    {lead.name ? lead.name.substring(0, 2).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-bold text-zinc-900">{lead.name || 'Visitante Desconhecido'}</h1>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 mt-2">
                                        {lead.email && (
                                            <div className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
                                                <Mail size={16} /> {lead.email}
                                            </div>
                                        )}
                                        {lead.whatsapp && (
                                            <div className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
                                                <Smartphone size={16} /> {lead.whatsapp}
                                            </div>
                                        )}
                                        {(lead.city || lead.state) && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={16} /> {lead.city}{lead.city && lead.state ? ', ' : ''}{lead.state}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                {lead.whatsapp && (
                                    <a
                                        href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 md:flex-none items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex"
                                    >
                                        <MessageCircle size={18} /> WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-1">
                            <span className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                                <History size={18} /> Sessões Únicas
                            </span>
                            <span className="text-2xl font-bold text-zinc-900">{uniqueSessions}</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-1">
                            <span className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                                <Eye size={18} /> Páginas Vistas
                            </span>
                            <span className="text-2xl font-bold text-zinc-900">{pageViews}</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-1">
                            <span className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                                <Clock size={18} /> Tempo Total
                            </span>
                            <span className="text-2xl font-bold text-zinc-900">{formatTime(totalTimeSeconds)}</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-1">
                            <span className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                                <Flag size={18} /> Conversões
                            </span>
                            <span className="text-2xl font-bold text-green-600">{conversions}</span>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Timeline */}
                        <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col">
                            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-zinc-900">Timeline de Eventos</h2>
                                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer hover:text-zinc-900 transition-colors">
                                    <div className="relative inline-block w-8 h-4 rounded-full transition-colors ease-in-out duration-200 bg-zinc-200">
                                        <input
                                            type="checkbox"
                                            className="opacity-0 w-0 h-0"
                                            checked={showAllEvents}
                                            onChange={(e) => setShowAllEvents(e.target.checked)}
                                        />
                                        <span className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out ${showAllEvents ? 'transform translate-x-4 bg-brand-500' : ''} shadow-sm border border-zinc-300`}></span>
                                    </div>
                                    Mostrar todos os eventos
                                </label>
                            </div>
                            <div className="p-6">
                                {processedEvents.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-500 flex flex-col items-center justify-center gap-2">
                                        <Filter size={24} className="text-zinc-300" />
                                        Nenhum evento para exibir.
                                    </div>
                                ) : (
                                    <div className="relative space-y-8 pl-3">
                                        <div className="absolute top-2 bottom-0 left-[11px] w-0.5 bg-zinc-200"></div>
                                        {processedEvents.map((event, idx) => {

                                            let icon = <MousePointerClick className="w-full h-full p-0.5 text-white" />;
                                            let bgColor = "bg-zinc-400";
                                            let title = event.event;
                                            let description = event.path || event.url || '';

                                            const formatTimeSpent = (seconds: number) => {
                                                if (!seconds) return '0s';
                                                if (seconds < 60) return `${Math.floor(seconds)}s`;
                                                const m = Math.floor(seconds / 60);
                                                const s = Math.floor(seconds % 60);
                                                return `${m}min ${s}s`;
                                            };

                                            switch (event.event) {
                                                case 'tab_hidden':
                                                    title = 'Saiu da aba';
                                                    icon = <Clock className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-zinc-300";
                                                    break;
                                                case 'tab_visible':
                                                    title = 'Voltou para a aba';
                                                    icon = <Eye className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-zinc-300";
                                                    break;
                                                case 'idle':
                                                    title = 'Ficou inativo';
                                                    icon = <Clock className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-zinc-300";
                                                    break;
                                                case 'scroll_depth':
                                                    title = `Rolou até ${event.properties?.depth || 0}% da página`;
                                                    icon = <ArrowDown className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-zinc-400";
                                                    break;
                                                case 'time_on_page':
                                                    title = `${formatTimeSpent(event.properties?.timeSpent || 0)} na página`;
                                                    icon = <Clock className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-purple-500";
                                                    break;
                                                case 'lead_identified':
                                                    title = 'Preencheu formulário';
                                                    icon = <Flag className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-green-500";
                                                    break;
                                                case 'form_submit':
                                                    title = 'Enviou formulário';
                                                    icon = <Flag className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-green-500";
                                                    break;
                                                case 'popup_shown':
                                                    title = `Viu o popup: ${event.properties?.popup_name || 'Desconhecido'}`;
                                                    icon = <Eye className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-brand-400";
                                                    break;
                                                case 'popup_cta_click':
                                                case 'popup_clicked':
                                                    title = 'Clicou no botão do popup';
                                                    icon = <MousePointerClick className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-brand-600";
                                                    break;
                                                case 'popup_closed':
                                                    title = 'Fechou o popup';
                                                    icon = <X className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-zinc-400";
                                                    break;
                                                case 'page_view':
                                                    title = 'Visitou a página';
                                                    icon = <Eye className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-blue-500";
                                                    break;
                                                case 'click':
                                                    title = `Clicou em: ${event.properties?.text || 'Elemento'}`;
                                                    icon = <MousePointerClick className="w-full h-full p-0.5 text-white" />;
                                                    bgColor = "bg-zinc-500";
                                                    break;
                                                default:
                                                    title = event.event;
                                            }

                                            // Show date separator if day changes
                                            const eventDate = new Date(event.timestamp).toLocaleDateString();
                                            const prevDate = idx < processedEvents.length - 1 ? new Date(processedEvents[idx + 1].timestamp).toLocaleDateString() : null;
                                            const isDateChange = idx === processedEvents.length - 1 || eventDate !== prevDate;

                                            // Handle properties formatting
                                            const propKeys = Object.keys(event.properties || {}).filter(k => !['timeSpent', 'depth', 'popup_name', 'text'].includes(k));

                                            return (
                                                <div key={event.id} className="relative">
                                                    {isDateChange && (
                                                        <div className="sticky top-0 bg-white z-10 py-2 mb-4 -ml-3 border-b border-zinc-100">
                                                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-50 px-2 py-1 rounded">
                                                                {formatDate(event.created_at)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="relative flex gap-4 group mt-4">
                                                        <div className={`absolute left-[-5px] top-1.5 w-6 h-6 rounded-full border-2 border-white shadow-sm z-10 flex items-center justify-center -ml-[5px] ${bgColor}`}>
                                                            {icon}
                                                        </div>
                                                        <div className="flex-1 bg-zinc-50 rounded-lg p-4 border border-zinc-200 hover:border-brand-200 transition-colors ml-2">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="font-medium text-zinc-900 text-sm">{title}</span>
                                                                <span className="text-xs text-zinc-400 font-mono">{formatEventTime(event.timestamp)}</span>
                                                            </div>
                                                            <p className="text-sm text-zinc-600 mb-2">{description}</p>

                                                            {propKeys.length > 0 && (
                                                                <div className="text-xs text-zinc-500 bg-white px-2 py-1.5 rounded border border-zinc-200 inline-block overflow-hidden max-w-full">
                                                                    <div className="flex flex-wrap text-[11px] gap-x-3 gap-y-1">
                                                                        {propKeys.map(k => (
                                                                            <span key={k} className="mr-1">
                                                                                <span className="font-medium text-zinc-700">{k}:</span> {JSON.stringify(event.properties[k])}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Technical Data */}
                            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50">
                                    <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">Origem e Dispositivo</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    {lead.utm_source && (
                                        <div>
                                            <label className="text-xs font-medium text-zinc-500 block mb-1">UTM Source / Medium / Campaign</label>
                                            <div className="text-sm text-zinc-900 font-medium break-all">
                                                {lead.utm_source} {lead.utm_medium ? ` / ${lead.utm_medium}` : ''} {lead.utm_campaign ? ` / ${lead.utm_campaign}` : ''}
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-zinc-500 block mb-1">Dispositivo</label>
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-900 capitalize">
                                                <Smartphone size={16} className="text-zinc-400" />
                                                {lead.device_type || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-500 block mb-1">Navegador / SO</label>
                                            <div className="flex flex-col gap-1 text-sm text-zinc-900 pt-1">
                                                <div className="flex items-center gap-1.5"><Globe size={16} className="text-zinc-400" /> {lead.browser || '-'}</div>
                                                {lead.os && <span className="text-xs text-zinc-500 pl-5">{lead.os}</span>}
                                            </div>
                                        </div>
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