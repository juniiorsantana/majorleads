import React, { useState, useEffect } from 'react';
import {
    User, Code2, Webhook, CreditCard, Lock,
    Copy, Check, ExternalLink, Sparkles, Clock,
    Globe, Mail, Building2, Shield, Eye, EyeOff,
    Zap, CheckCircle2, ArrowUpRight, Loader2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'perfil' | 'tracker' | 'integracoes' | 'plano' | 'seguranca';



const integrations = [
    { name: 'Webhook Universal', icon: <Webhook size={22} className="text-brand-600" />, bg: 'bg-brand-50', desc: 'Envie eventos em tempo real para qualquer URL via POST JSON.', action: true, route: '/settings/webhook' },
    { name: 'ActiveCampaign', logo: 'https://cdn.worldvectorlogo.com/logos/activecampaign-1.svg', desc: 'Sincronize contatos e adicione tags automaticamente.', locked: true },
    { name: 'RD Station', logo: 'https://cdn.worldvectorlogo.com/logos/rd-station.svg', desc: 'Envie conversões como novos leads direto ao RD.', locked: true },
    { name: 'HubSpot CRM', logo: 'https://cdn.worldvectorlogo.com/logos/hubspot-1.svg', desc: 'Crie contatos e negócios automaticamente.', locked: true },
    { name: 'Zapier', logo: 'https://cdn.worldvectorlogo.com/logos/zapier-1.svg', desc: 'Conecte com mais de 5.000 apps via automação.', locked: true },
    { name: 'Slack', logo: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg', desc: 'Receba notificações de leads em canais específicos.', locked: true },
    { name: 'Google Sheets', logo: 'https://cdn.worldvectorlogo.com/logos/google-sheets.svg', desc: 'Adicione uma linha por lead em uma planilha.', locked: true },
];

// ─── Sub-sections ───────────────────────────────────────────────

const PerfilTab = () => {
    const [saved, setSaved] = useState(false);
    const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-zinc-900 mb-5">Dados da Conta</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                                <input type="text" defaultValue="João Silva" className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Empresa</label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                                <input type="text" defaultValue="MajorHub Ltda." className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">E-mail</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                            <input type="email" defaultValue="joao@majorhub.com.br" className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Site monitorado</label>
                        <div className="relative">
                            <Globe size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                            <input type="url" defaultValue="https://meusite.com.br" className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                    >
                        {saved ? <><Check size={16} /> Salvo!</> : 'Salvar alterações'}
                    </button>
                </div>
            </div>

            {/* Avatar */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl border-2 border-brand-200">JS</div>
                <div>
                    <p className="text-sm font-semibold text-zinc-900">Avatar</p>
                    <p className="text-xs text-zinc-500 mt-0.5">JPG ou PNG, máximo 2MB</p>
                    <button className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">Alterar foto</button>
                </div>
            </div>
        </div>
    );
};

const TrackerTab = () => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [siteId, setSiteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        supabase
            .from('sites')
            .select('id, name, domain')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setSiteId(data.id);
                setLoading(false);
            });
    }, [user]);

    const token = siteId ?? '';
    const snippet = `<!-- MajorLeads Tracker -->\n<script\n  src="https://tracker.majorhub.com.br/tracker.js"\n  data-token="${token}"\n  async>\n</script>`;

    const copySnippet = () => {
        navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyToken = () => {
        navigator.clipboard.writeText(token);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-zinc-400" />
            </div>
        );
    }

    if (!siteId) {
        return (
            <div className="max-w-xl">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
                    <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900">Nenhum site cadastrado</p>
                        <p className="text-xs text-amber-700 mt-1 mb-3">Complete o fluxo de instalação para obter seu código de rastreamento.</p>
                        <a href="#/dashboard/onboarding"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 border border-amber-300 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
                            Ir para Instalação <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Token */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-zinc-900 mb-1">Token do Site</h3>
                <p className="text-sm text-zinc-500 mb-4">Use este token para autenticar o tracker no seu site.</p>
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 font-mono text-sm text-zinc-700 gap-2">
                        <Shield size={14} className="text-green-500 shrink-0" />
                        <span className="flex-1 truncate">{showToken ? token : token.replace(/[a-z0-9]/gi, '•')}</span>
                    </div>
                    <button onClick={() => setShowToken(!showToken)} className="p-2.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-500 transition-colors">
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={copyToken} className="p-2.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors" title="Copiar token">
                        {copiedToken ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-zinc-500" />}
                    </button>
                </div>
            </div>

            {/* Snippet */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900">Código de Instalação</h3>
                        <p className="text-sm text-zinc-500 mt-0.5">Cole antes do <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">&lt;/head&gt;</code> do seu site.</p>
                    </div>
                    <button
                        onClick={copySnippet}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'}`}
                    >
                        {copied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar código</>}
                    </button>
                </div>
                <div className="p-0">
                    <pre className="bg-zinc-900 text-green-400 text-xs p-6 overflow-x-auto leading-relaxed font-mono whitespace-pre">{snippet}</pre>
                </div>
            </div>

            {/* Verification status */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap size={16} className="text-amber-600" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber-900">Aguardando verificação</p>
                    <p className="text-xs text-amber-700 mt-1">Instale o snippet no seu site. Assim que recebermos o primeiro evento, o status será atualizado automaticamente.</p>
                    <a href="#" className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 mt-2 hover:underline">
                        Ver guia de instalação <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
};

const IntegracoesTab = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {integrations.map((app: any) => (
                    <div key={app.name} className={`relative bg-white rounded-xl border border-zinc-200 p-5 flex flex-col shadow-sm overflow-hidden group ${app.locked ? '' : 'hover:shadow-md transition-shadow'}`}>
                        {app.locked && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[2px]">
                                <div className="bg-white/90 border border-zinc-200 shadow-md px-3 py-1.5 rounded-full flex items-center gap-1.5 group-hover:scale-105 transition-transform">
                                    <Sparkles size={14} className="text-brand-500" />
                                    <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Em Breve</span>
                                </div>
                            </div>
                        )}
                        <div className={`flex flex-col h-full ${app.locked ? 'filter blur-[2px] opacity-60 select-none pointer-events-none' : ''}`}>
                            <div className={`w-11 h-11 rounded-lg ${app.bg || 'border border-zinc-100'} flex items-center justify-center mb-4 p-2`}>
                                {app.icon ? app.icon : <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />}
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-900">{app.name}</h3>
                            <p className="text-xs text-zinc-500 mt-1 mb-4 flex-1">{app.desc}</p>
                            <div className="mt-auto pt-4 border-t border-zinc-100">
                                {app.action ? (
                                    <button
                                        onClick={() => navigate(app.route)}
                                        className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        Configurar <ArrowUpRight size={12} />
                                    </button>
                                ) : (
                                    <button disabled className="w-full py-2 border border-zinc-200 text-xs font-medium rounded-lg text-zinc-400 bg-zinc-50 cursor-not-allowed flex items-center justify-center gap-1.5">
                                        <Clock size={12} /> Aguarde
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PlanoTab = () => (
    <div className="space-y-6 max-w-3xl">
        {/* Current Plan */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-zinc-900">Plano Pro</h3>
                        <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded-full">Ativo</span>
                    </div>
                    <p className="text-sm text-zinc-500">Próxima cobrança em <span className="font-medium text-zinc-700">15/03/2026</span></p>
                </div>
                <p className="text-2xl font-bold text-zinc-900">R$ 97<span className="text-sm font-normal text-zinc-500">/mês</span></p>
            </div>
            <div className="mt-6 pt-5 border-t border-zinc-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Visitantes/mês', val: '50.000', used: '12.483', pct: 25 },
                    { label: 'Popups ativos', val: '20', used: '6', pct: 30 },
                    { label: 'Leads capturados', val: '5.000', used: '1.832', pct: 37 },
                    { label: 'Domínios', val: '5', used: '1', pct: 20 },
                ].map((item) => (
                    <div key={item.label}>
                        <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-zinc-900">{item.used} <span className="text-zinc-400 font-normal">/ {item.val}</span></p>
                        <div className="h-1.5 bg-zinc-100 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-5 flex gap-3">
                <button className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">Fazer upgrade</button>
                <button className="px-4 py-2 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-sm font-medium rounded-lg transition-colors">Gerenciar assinatura</button>
            </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="text-sm font-semibold text-zinc-900">Histórico de faturas</h3>
            </div>
            <div className="divide-y divide-zinc-50">
                {[
                    { date: '15 Fev 2026', val: 'R$ 97,00', status: 'Pago' },
                    { date: '15 Jan 2026', val: 'R$ 97,00', status: 'Pago' },
                    { date: '15 Dez 2025', val: 'R$ 97,00', status: 'Pago' },
                ].map((inv) => (
                    <div key={inv.date} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors">
                        <span className="text-sm text-zinc-700">{inv.date}</span>
                        <span className="text-sm font-medium text-zinc-900">{inv.val}</span>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle2 size={12} /> {inv.status}</span>
                            <button className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">PDF <ExternalLink size={11} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const SegurancaTab = () => {
    const [showPass, setShowPass] = useState(false);

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-zinc-900 mb-5">Trocar senha</h3>
                <div className="space-y-4">
                    {[
                        { label: 'Senha atual', placeholder: '••••••••' },
                        { label: 'Nova senha', placeholder: 'Mínimo 8 caracteres' },
                        { label: 'Confirmar nova senha', placeholder: '••••••••' },
                    ].map((f) => (
                        <div key={f.label}>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5">{f.label}</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-2.5 text-zinc-400" />
                                <input type={showPass ? 'text' : 'password'} placeholder={f.placeholder} className="w-full pl-9 pr-10 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors">Atualizar senha</button>
                </div>
            </div>

            {/* 2FA placeholder */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-zinc-900">Autenticação em 2 fatores</h3>
                        <p className="text-sm text-zinc-500 mt-1">Adicione uma camada extra de segurança à sua conta.</p>
                    </div>
                    <span className="bg-zinc-100 text-zinc-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><Sparkles size={12} />Em Breve</span>
                </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-red-700 mb-1">Zona de Perigo</h3>
                <p className="text-sm text-zinc-500 mb-4">Estas ações são irreversíveis. Tenha cuidado.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
                        Limpar todos os dados
                    </button>
                    <button className="px-4 py-2 border border-red-300 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">
                        Excluir conta permanentemente
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Settings Component ─────────────────────────────────────

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'perfil', label: 'Perfil', icon: <User size={16} /> },
    { id: 'tracker', label: 'Rastreamento', icon: <Code2 size={16} /> },
    { id: 'integracoes', label: 'Integrações', icon: <Webhook size={16} /> },
    { id: 'plano', label: 'Plano & Faturamento', icon: <CreditCard size={16} /> },
    { id: 'seguranca', label: 'Segurança', icon: <Shield size={16} /> },
];

export const Settings: React.FC = () => {
    const [active, setActive] = useState<Tab>('tracker');

    return (
        <>
            <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center sticky top-0 z-10 shrink-0">
                <h1 className="text-lg font-semibold text-zinc-900">Configurações</h1>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar tabs */}
                <aside className="w-56 bg-white border-r border-zinc-100 flex flex-col py-4 px-3 shrink-0">
                    <nav className="space-y-0.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActive(tab.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${active === tab.id
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                    }`}
                            >
                                <span className={active === tab.id ? 'text-brand-600' : 'text-zinc-400'}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-zinc-50">
                    {active === 'perfil' && <PerfilTab />}
                    {active === 'tracker' && <TrackerTab />}
                    {active === 'integracoes' && <IntegracoesTab />}
                    {active === 'plano' && <PlanoTab />}
                    {active === 'seguranca' && <SegurancaTab />}
                </main>
            </div>
        </>
    );
};