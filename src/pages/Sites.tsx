import React, { useState, useEffect } from 'react';
import {
    Globe, Plus, Copy, Check, ExternalLink, Code2,
    MoreVertical, Trash2, CheckCircle2, Clock, Loader2,
    Zap, ChevronRight, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Site {
    id: string;
    name: string;
    domain: string;
    created_at: string;
}

// For now, until plan management is implemented, allow up to this many sites
const FREE_PLAN_LIMIT = 1;

function SiteCard({ site }: { site: Site; key?: React.Key }) {
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const copyToken = () => {
        navigator.clipboard.writeText(site.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const snippet = `<script src="https://tracker.majorhub.com.br/tracker.js" data-token="${site.id}" async></script>`;

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            {/* Card header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                        <Globe size={18} className="text-brand-600" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-900 text-sm truncate">{site.name}</h3>
                        <a
                            href={`https://${site.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-zinc-400 hover:text-brand-600 flex items-center gap-1 mt-0.5 transition-colors w-fit"
                        >
                            {site.domain}
                            <ExternalLink size={10} />
                        </a>
                    </div>
                </div>

                <div className="relative shrink-0">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                        <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-8 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 w-44">
                                <button
                                    onClick={() => { setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={14} /> Remover site
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Status + token */}
            <div className="px-6 py-4 space-y-3">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Conectado
                    </span>
                    <span className="text-xs text-zinc-400">
                        desde {new Date(site.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {/* Token row */}
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                    <code className="text-xs font-mono text-zinc-500 flex-1 truncate">{site.id}</code>
                    <button
                        onClick={copyToken}
                        title="Copiar token"
                        className="shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            {/* Footer CTA */}
            <div className="px-6 pb-5">
                <details className="group/details">
                    <summary className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 cursor-pointer transition-colors list-none select-none">
                        <Code2 size={13} />
                        Ver código de instalação
                        <ChevronRight size={12} className="ml-auto group-open/details:rotate-90 transition-transform" />
                    </summary>
                    <pre className="mt-3 bg-zinc-900 text-green-400 text-[10px] p-3 rounded-xl overflow-x-auto leading-5 font-mono whitespace-pre-wrap break-all">
                        {snippet}
                    </pre>
                </details>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-5">
                <Globe size={28} className="text-brand-500" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Nenhum site conectado</h2>
            <p className="text-sm text-zinc-500 max-w-xs mb-6">
                Adicione seu primeiro site para começar a capturar leads e rastrear visitantes.
            </p>
            <button
                onClick={onAdd}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/20 active:scale-95"
            >
                <Plus size={16} /> Adicionar primeiro site
            </button>
        </div>
    );
}

export const Sites: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        supabase
            .from('sites')
            .select('id, name, domain, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .then(({ data }) => {
                setSites(data ?? []);
                setLoading(false);
            });
    }, [user]);

    const canAddMore = sites.length < FREE_PLAN_LIMIT;
    // Once plan management exists, replace FREE_PLAN_LIMIT with actual plan limit

    const handleAddSite = () => {
        // Clear so onboarding doesn't immediately redirect back
        localStorage.removeItem('onboarding_complete');
        navigate('/dashboard/onboarding');
    };

    return (
        <>
            {/* Header */}
            <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div>
                    <h1 className="text-lg font-semibold text-zinc-900">Sites Conectados</h1>
                </div>

                {canAddMore ? (
                    <button
                        onClick={handleAddSite}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={16} /> Adicionar site
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            disabled
                            title="Faça upgrade do plano para adicionar mais sites"
                            className="flex items-center gap-2 bg-zinc-100 text-zinc-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed border border-zinc-200"
                        >
                            <Lock size={14} /> Adicionar site
                        </button>
                        <span className="text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <Zap size={12} className="text-brand-500" />
                            Limite do plano atingido
                        </span>
                    </div>
                )}
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-zinc-50">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 size={32} className="animate-spin text-zinc-400" />
                    </div>
                ) : sites.length === 0 ? (
                    <EmptyState onAdd={handleAddSite} />
                ) : (
                    <>
                        {/* Stats summary */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-2 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 shadow-sm">
                                <CheckCircle2 size={15} className="text-green-500" />
                                <span className="font-semibold text-zinc-900">{sites.length}</span>
                                site{sites.length !== 1 ? 's' : ''} conectado{sites.length !== 1 ? 's' : ''}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 shadow-sm">
                                <Clock size={15} />
                                Plano atual: <span className="font-medium text-zinc-600">{FREE_PLAN_LIMIT} site{FREE_PLAN_LIMIT !== 1 ? 's' : ''} incluído{FREE_PLAN_LIMIT !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Site cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {sites.map(site => (
                                <SiteCard key={site.id} site={site} />
                            ))}

                            {/* "Add more" slot — disabled/locked when at limit */}
                            {!canAddMore && (
                                <div className="bg-white border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center py-10 gap-3 text-center opacity-60">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                                        <Lock size={18} className="text-zinc-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-600">Novo site</p>
                                        <p className="text-xs text-zinc-400 mt-1">Disponível em planos superiores</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
