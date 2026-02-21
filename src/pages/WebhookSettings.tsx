import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Webhook,
  Save,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Plus
} from 'lucide-react';

interface WebhookData {
  id: string;
  url: string;
  secret: string | null;
  is_active: boolean;
  events: string[];
}

export const WebhookSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [siteId, setSiteId] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [eventsForm, setEventsForm] = useState({
    lead_identified: true,
    form_submit: true,
    popup_clicked: false,
    popup_converted: false,
    session_end: false
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showDisconnectModal, setShowDisconnectModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadConfig() {
      if (!user) return;
      try {
        const { data: site } = await supabase
          .from('sites')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (site) {
          setSiteId(site.id);
          const { data: hooks } = await supabase
            .from('webhooks')
            .select('*')
            .eq('site_id', site.id)
            .order('created_at', { ascending: false });

          if (hooks) setWebhooks(hooks);
        }
      } catch (err) {
        console.error("Error loading webhooks:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [user]);

  const resetForm = () => {
    setUrl('');
    setSecret('');
    setEditingId(null);
    setEventsForm({
      lead_identified: true,
      form_submit: true,
      popup_clicked: false,
      popup_converted: false,
      session_end: false
    });
    setIsEditing(false);
    setShowSecret(false);
    setTestStatus('idle');
  };

  const handleAddNew = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleEdit = (hook: WebhookData) => {
    setUrl(hook.url);
    setSecret(hook.secret || '');
    setEditingId(hook.id);

    // Set events
    const newEvents = { ...eventsForm };
    Object.keys(newEvents).forEach(key => {
      newEvents[key as keyof typeof eventsForm] = hook.events?.includes(key) || false;
    });
    setEventsForm(newEvents);

    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!url) {
      showToast("A URL de destino é obrigatória", "error");
      return;
    }

    if (!siteId) return;
    setIsSaving(true);

    try {
      const selectedEvents = Object.keys(eventsForm).filter(k => eventsForm[k as keyof typeof eventsForm]);

      if (editingId) {
        // Update
        const { error } = await supabase
          .from('webhooks')
          .update({
            url,
            secret: secret || null,
            events: selectedEvents
          })
          .eq('id', editingId);

        if (error) throw error;

        setWebhooks(prev => prev.map(w => w.id === editingId ? { ...w, url, secret, events: selectedEvents } : w));
        showToast("Webhook atualizado!");
      } else {
        // Insert
        const { data, error } = await supabase
          .from('webhooks')
          .insert({
            site_id: siteId,
            url,
            secret: secret || null,
            events: selectedEvents,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        if (data) setWebhooks(prev => [data, ...prev]);
        showToast("Webhook criado com sucesso!");
      }

      resetForm();
    } catch (err) {
      console.error("Error saving webhook:", err);
      showToast("Erro ao salvar webhook.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWebhooks(prev => prev.filter(w => w.id !== id));
      setShowDisconnectModal(null);
      showToast("Webhook removido!");
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Error deleting webhook:", err);
      showToast("Erro ao remover.", "error");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setWebhooks(prev => prev.map(w => w.id === id ? { ...w, is_active: !currentStatus } : w));
      showToast(`Webhook ${!currentStatus ? 'ativado' : 'desativado'}.`);
    } catch (err) {
      showToast("Erro ao alterar status.", "error");
    }
  };

  const generateSecret = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = 'sk_live_';
    for (let i = 0; i < 24; i++) token += chars[Math.floor(Math.random() * chars.length)];
    setSecret(token);
  };

  const activeEvent = Object.keys(eventsForm).find(k => eventsForm[k as keyof typeof eventsForm]) || 'lead_identified';

  const payload = {
    event: activeEvent,
    visitor_id: "uuid-v4",
    ts: Date.now(),
    lead: {
      name: "João Silva",
      email: "joao@email.com",
      whatsapp: "5511999999999"
    },
    session: {
      utm_source: "facebook",
      utm_campaign: "promo-fevereiro",
      city: "São Paulo",
      device_type: "mobile"
    }
  };

  const handleTest = async () => {
    if (!url) return;
    setTestStatus('loading');

    try {
      // Direct call or trigger edge function? We can simulate direct call for now
      // This might fail due to CORS, but we handle it gracefully
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-zinc-50 items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-600 mb-4" />
        <p className="text-sm font-medium text-zinc-600">Carregando webhooks...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 relative">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
              <Webhook size={24} />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 text-center mb-2">Excluir Webhook?</h3>
            <p className="text-zinc-500 text-center text-sm mb-6">
              Você deixará de receber eventos em tempo real neste endpoint. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectModal(null)}
                className="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDisconnectModal)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center gap-4 shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500 font-medium">Configurações</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900 font-semibold">Integrações</span>
            <span className="text-zinc-300">/</span>
            <span className="text-brand-600 font-semibold">Webhooks</span>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Adicionar Webhook
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">

          {!isEditing ? (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-1">Seus Webhooks</h2>
                <p className="text-sm text-zinc-500">Gerencie para onde os eventos do seu site serão enviados automaticamente.</p>
              </div>

              {webhooks.length === 0 ? (
                <div className="bg-white border text-center border-dashed border-zinc-300 rounded-xl p-12">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                    <Webhook size={32} />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2">Nenhum webhook configurado</h3>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
                    Você ainda não adicionou nenhum endpoint de destino. Configure seu primeiro webhook para receber eventos em tempo real.
                  </p>
                  <button
                    onClick={handleAddNew}
                    className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 inline-flex items-center gap-2"
                  >
                    <Plus size={18} /> Adicionar primeiro webhook
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {webhooks.map(hook => (
                    <div key={hook.id} className={`bg-white rounded-xl border p-5 shadow-sm flex items-center justify-between transition-all ${hook.is_active ? 'border-zinc-200' : 'border-zinc-200 bg-zinc-50 opacity-75'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hook.is_active ? 'bg-brand-50 text-brand-600' : 'bg-zinc-200 text-zinc-500'}`}>
                          <Webhook size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-zinc-900 truncate max-w-sm">{hook.url}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${hook.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'}`}>
                              {hook.is_active ? 'Ativo' : 'Pausado'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 flex items-center gap-3">
                            <span>{hook.events?.length || 0} eventos configurados</span>
                            {hook.secret && <span className="flex items-center gap-1"><Shield size={12} className="text-green-500" /> Protegido via Secret</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer mr-2">
                          <input type="checkbox" className="sr-only peer" checked={hook.is_active} onChange={() => handleToggleActive(hook.id, hook.is_active)} />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                        <button onClick={() => handleEdit(hook)} className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                          Editar
                        </button>
                        <button onClick={() => setShowDisconnectModal(hook.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Form Edition */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-zinc-100 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center">
                        <Webhook size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-zinc-900">{editingId ? 'Editar Webhook' : 'Novo Webhook'}</h2>
                        <p className="text-sm text-zinc-500">Receba notificações de eventos em tempo real</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* URL Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">URL de Destino <span className="text-red-500">*</span></label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.suaempresa.com/v1/webhook"
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 text-sm transition-all focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      />
                      <p className="text-xs text-zinc-500">O endpoint deve aceitar requisições POST com JSON payload.</p>
                    </div>

                    {/* Events Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-zinc-700">Eventos para escutar</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(eventsForm).map(([key, value]) => (
                          <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${value ? 'bg-brand-50 border-brand-200' : 'bg-white border-zinc-200 hover:bg-zinc-50'}`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${value ? 'bg-brand-600 border-brand-600' : 'bg-white border-zinc-300'}`}>
                              {value && <Check size={14} className="text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={value}
                              onChange={() => setEventsForm(prev => ({ ...prev, [key]: !prev[key as keyof typeof eventsForm] }))}
                            />
                            <span className="text-sm font-medium text-zinc-700 font-mono">
                              {key}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Secret Token */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-zinc-700">Secret Token (Opcional)</label>
                        <button
                          onClick={generateSecret}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> Gerar novo
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showSecret ? "text" : "password"}
                          value={secret}
                          onChange={(e) => setSecret(e.target.value)}
                          placeholder="sk_..."
                          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 font-mono text-zinc-600"
                        />
                        <button
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
                        >
                          {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500">Usado para assinar os payloads (HMAC SHA-256 no header x-majorleads-signature).</p>
                    </div>

                  </div>

                  <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
                    {editingId ? (
                      <button
                        onClick={() => setShowDisconnectModal(editingId)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={18} />
                        Excluir
                      </button>
                    ) : (
                      <div></div>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={resetForm}
                        className="px-4 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-70"
                      >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar Webhook
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payload Tester */}
              <div className="lg:col-span-1 border border-zinc-200 bg-white rounded-xl shadow-sm flex flex-col overflow-hidden max-h-[600px]">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Testador de Endpoint</h3>
                </div>

                <div className="p-5 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-zinc-500 mb-4">
                    Simule um evento de <span className="font-mono text-zinc-700 bg-zinc-100 px-1 rounded">{activeEvent}</span> para testar sua URL.
                  </p>

                  <div className="bg-zinc-900 rounded-lg p-4 mb-4 relative group">
                    <pre className="text-xs font-mono text-zinc-300">
                      <code>{JSON.stringify(payload, null, 2)}</code>
                    </pre>
                  </div>

                  <div className="mt-auto pt-4">
                    {testStatus === 'success' && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-green-700">Enviado (Simulação Opaque)</p>
                          <p className="text-xs text-green-600">Confirme o recebimento no destino.</p>
                        </div>
                      </div>
                    )}

                    {testStatus === 'error' && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle size={16} className="text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-red-700">Falha na rede</p>
                          <p className="text-xs text-red-600">Verifique a URL e tente novamente.</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleTest}
                      disabled={!url || testStatus === 'loading'}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${!url
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 shadow-sm'
                        }`}
                    >
                      {testStatus === 'loading' ? (
                        <Loader2 size={18} className="animate-spin text-brand-600" />
                      ) : (
                        <Play size={18} className={url ? "text-brand-600" : ""} />
                      )}
                      Testar Endpoint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};