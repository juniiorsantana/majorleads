import React, { useState, useEffect } from 'react';
import {
    Globe, Plus, Copy, Check, ExternalLink, Code2,
    MoreVertical, Trash2, CheckCircle2, Clock, Loader2,
    Zap, ChevronRight, Lock, Pencil, AlertTriangle, X,
    Wifi, WifiOff
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

const FREE_PLAN_LIMIT = 1;

/* ─────────────────────────────────────────────
   DELETE CONFIRMATION MODAL
───────────────────────────────────────────── */
function DeleteSiteModal({
    site,
    onClose,
    onDeleted,
}: {
    site: Site;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            // FK order: events → popups → sites
            await supabase.from('events').delete().eq('site_id', site.id);
            await supabase.from('popups').delete().eq('site_id', site.id);
            const { error } = await supabase.from('sites').delete().eq('id', site.id);
            if (error) throw error;
            onDeleted();
        } catch (err) {
            console.error('Error deleting site:', err);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[scaleIn_0.2s_ease]"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 pt-6 pb-4 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-zinc-900 mb-1">Excluir site</h3>
                        <p className="text-sm text-zinc-500">
                            Tem certeza que deseja excluir <span className="font-semibold text-zinc-700">{site.name}</span> ({site.domain})?
                        </p>
                        <p className="text-xs text-red-500 mt-2">
                            Todos os popups e eventos vinculados serão removidos permanentemente.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {deleting ? <><Loader2 size={14} className="animate-spin" /> Excluindo...</> : <><Trash2 size={14} /> Confirmar exclusão</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   EDIT SITE MODAL
───────────────────────────────────────────── */
function EditSiteModal({
    site,
    userId,
    onClose,
    onUpdated,
}: {
    site: Site;
    userId: string;
    onClose: () => void;
    onUpdated: () => void;
}) {
    const [name, setName] = useState(site.name);
    const [domain, setDomain] = useState(site.domain);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (!name.trim() || !cleanDomain.trim()) {
            setError('Nome e domínio são obrigatórios.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Check if another site already has this domain
            if (cleanDomain !== site.domain) {
                const { data: existing } = await supabase
                    .from('sites')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('domain', cleanDomain)
                    .neq('id', site.id)
                    .maybeSingle();

                if (existing) {
                    setError('Você já tem um site cadastrado com esse domínio.');
                    setSaving(false);
                    return;
                }
            }

            const { error: updateError } = await supabase
                .from('sites')
                .update({ name: name.trim(), domain: cleanDomain })
                .eq('id', site.id);

            if (updateError) throw updateError;
            onUpdated();
        } catch (err) {
            console.error('Error updating site:', err);
            setError('Erro ao salvar. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[scaleIn_0.2s_ease]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-100">
                    <h3 className="text-base font-bold text-zinc-900">Editar site</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                            Nome do site
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 text-sm
                                focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent
                                placeholder:text-zinc-300 transition-all bg-zinc-50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                            Domínio
                        </label>
                        <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                                type="text"
                                value={domain}
                                onChange={e => { setDomain(e.target.value); setError(''); }}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-zinc-900 text-sm
                                    focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-300 bg-zinc-50
                                    ${error ? 'border-red-300 focus:ring-red-200' : 'border-zinc-200 focus:ring-zinc-900 focus:border-transparent'}`}
                            />
                        </div>
                        {error && (
                            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle size={12} />{error}
                            </p>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim() || !domain.trim()}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-700 text-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-40"
                    >
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   SITE CARD
───────────────────────────────────────────── */
function SiteCard({
    site,
    onEdit,
    onDelete,
}: {
    site: Site;
    key?: React.Key;
    onEdit: (s: Site) => void;
    onDelete: (s: Site) => void;
}) {
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
    const [testInfo, setTestInfo] = useState<{ count: number; lastAt: string } | null>(null);

    const copyToken = () => {
        navigator.clipboard.writeText(site.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const testConnection = async () => {
        setTestStatus('checking');
        setTestInfo(null);
        try {
            const { data, count, error } = await supabase
                .from('events')
                .select('created_at', { count: 'exact', head: false })
                .eq('site_id', site.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (count && count > 0 && data && data.length > 0) {
                setTestInfo({ count, lastAt: data[0].created_at });
                setTestStatus('success');
            } else {
                setTestStatus('error');
            }
        } catch (err) {
            console.error('Test connection error:', err);
            setTestStatus('error');
        }
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
                                    onClick={() => { setMenuOpen(false); onEdit(site); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                                >
                                    <Pencil size={14} /> Editar site
                                </button>
                                <button
                                    onClick={() => { setMenuOpen(false); onDelete(site); }}
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
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Conectado
                    </span>
                    <span className="text-xs text-zinc-400">
                        desde {new Date(site.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {/* Connection test */}
                {testStatus === 'idle' && (
                    <button
                        onClick={testConnection}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg transition-all active:scale-95 w-fit"
                    >
                        <Wifi size={13} /> Testar conexão
                    </button>
                )}
                {testStatus === 'checking' && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 px-3 py-1.5">
                        <Loader2 size={13} className="animate-spin" /> Verificando...
                    </div>
                )}
                {testStatus === 'success' && testInfo && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span>
                            <span className="font-semibold">{testInfo.count} evento{testInfo.count !== 1 ? 's' : ''}</span>
                            {' · Último: '}
                            {new Date(testInfo.lastAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
                {testStatus === 'error' && (
                    <div className="flex items-center justify-between gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-1.5">
                            <WifiOff size={13} className="shrink-0" />
                            Nenhum evento recebido ainda
                        </div>
                        <button onClick={() => setTestStatus('idle')} className="text-amber-500 hover:text-amber-700 underline underline-offset-2 font-medium">
                            Tentar de novo
                        </button>
                    </div>
                )}

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

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export const Sites: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);
    const [editTarget, setEditTarget] = useState<Site | null>(null);

    const fetchSites = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('sites')
            .select('id, name, domain, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
        setSites(data ?? []);
        setLoading(false);
    };

    useEffect(() => {
        fetchSites();
    }, [user]);

    const canAddMore = sites.length < FREE_PLAN_LIMIT;

    const handleAddSite = () => {
        localStorage.removeItem('onboarding_complete');
        navigate('/dashboard/onboarding');
    };

    return (
        <>
            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>

            {/* Delete modal */}
            {deleteTarget && (
                <DeleteSiteModal
                    site={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={() => { setDeleteTarget(null); fetchSites(); }}
                />
            )}

            {/* Edit modal */}
            {editTarget && user && (
                <EditSiteModal
                    site={editTarget}
                    userId={user.id}
                    onClose={() => setEditTarget(null)}
                    onUpdated={() => { setEditTarget(null); fetchSites(); }}
                />
            )}

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
                                <SiteCard
                                    key={site.id}
                                    site={site}
                                    onEdit={setEditTarget}
                                    onDelete={setDeleteTarget}
                                />
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
