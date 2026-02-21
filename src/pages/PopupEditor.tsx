import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateDefaultSite } from '../lib/sites';
import {
  ArrowLeft,
  Cloud,
  ChevronDown,
  Monitor,
  Smartphone,
  X,
  Image as ImageIcon,
  Type,
  AlignLeft,
  MousePointer2,
  Settings,
  Plus,
  Trash2,
  Lightbulb,
  Clock,
  MousePointerClick,
  LogOut,
  Scroll,
  Link,
  MessageCircle,
  Webhook,
  CheckCircle,
  GripVertical,
  LayoutTemplate,
  Bell,
  Layers,
  Check,
  AlertTriangle,
  Phone,
  Mail,
  User
} from 'lucide-react';

// --- Types ---

type TriggerType = 'exit_intent' | 'time_on_page' | 'scroll_depth' | 'inactivity';
type ActionType = 'whatsapp' | 'redirect' | 'webhook' | 'close' | 'success_message';
type PopupType = 'modal' | 'slide-in' | 'top-bar' | 'toast';
type LayerType = 'hero_image' | 'heading' | 'text' | 'button' | 'avatar_image' | 'input_field';

interface Layer {
  id: string;
  type: LayerType;
  label: string;
  icon: any;
  props: Record<string, any>;
}

interface UrlRule {
  id: string;
  condition: 'contains' | 'equals' | 'starts_with';
  value: string;
}

interface TriggerConfig {
  type: TriggerType;
  value?: number; // seconds or percentage
  frequency: 'session' | 'visitor' | 'always' | 'daily'; // 1x per session, 1x per visitor, always, 1x per day
  delay?: number; // additional delay
  targetAudience: {
    device: 'all' | 'desktop' | 'mobile';
    visitorType: 'all' | 'new' | 'returning';
  };
  urlRules: UrlRule[];
}


interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

interface ActionConfig {
  type: 'whatsapp' | 'redirect' | 'webhook' | 'success_message' | 'close';
  whatsapp?: { number: string; message: string };
  redirect?: { url: string; openInNewTab: boolean; utms?: UtmParams };
  webhook?: { url: string; method: string };
  successMessage?: { text: string; autoCloseDuration: number };
}

// --- Initial Data ---

const initialLayers: Layer[] = [
  {
    id: 'layer-1',
    type: 'hero_image',
    label: 'Imagem Hero',
    icon: ImageIcon,
    props: {
      src: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      height: 200,
      objectFit: 'cover'
    }
  },
  {
    id: 'layer-2',
    type: 'heading',
    label: 'Título Principal',
    icon: Type,
    props: {
      text: 'Não vá embora sem seu presente! 🎁 ',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#18181b',
      align: 'left'
    }
  },
  {
    id: 'layer-3',
    type: 'text',
    label: 'Texto Descritivo',
    icon: AlignLeft,
    props: {
      text: 'Inscreva-se agora e receba um cupom de 20% de desconto na sua primeira compra.',
      fontSize: 14,
      color: '#52525b',
      align: 'left'
    }
  },
  {
    id: 'layer-4',
    type: 'button',
    label: 'Botão CTA',
    icon: MousePointer2,
    props: {
      text: 'QUERO MEU DESCONTO',
      backgroundColor: '#7C3AED',
      color: '#FFFFFF',
      borderRadius: 8
    }
  }
];

const initialTopBarLayers: Layer[] = [
  {
    id: 'tb-layer-1',
    type: 'avatar_image',
    label: 'Avatar / Ãcone',
    icon: ImageIcon,
    props: {
      src: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=200&auto=format&fit=crop&q=60',
      size: 44
    }
  },
  {
    id: 'tb-layer-2',
    type: 'heading',
    label: 'Título',
    icon: Type,
    props: {
      text: 'Não vá embora sem seu presente! 🎁 ',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#18181b',
      align: 'left'
    }
  },
  {
    id: 'tb-layer-3',
    type: 'text',
    label: 'Mensagem',
    icon: AlignLeft,
    props: {
      text: 'Cupom exclusivo de 20% na sua primeira compra â€” sÃ³ hoje!',
      fontSize: 12,
      color: '#71717a',
      align: 'left'
    }
  },
  {
    id: 'tb-layer-4',
    type: 'button',
    label: 'BotÃ£o CTA',
    icon: MousePointer2,
    props: {
      text: 'Resgatar',
      backgroundColor: '#18181b',
      color: '#FFFFFF',
      borderRadius: 20
    }
  }
];

export const PopupEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [popupId, setPopupId] = useState<string | null>(id || null);
  const [isLoading, setIsLoading] = useState(true);
  const [siteId, setSiteId] = useState<string | null>(null);

  // --- State Management ---
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);
  const [popupName, setPopupName] = useState("Oferta de SaÃ­da - Mobile");
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [popupType, setPopupType] = useState<PopupType>('modal');

  // Layers & Selection
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('layer-4');
  const [showAddLayerMenu, setShowAddLayerMenu] = useState(false);

  // Saving & Status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('14:32');
  const [showToast, setShowToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Drag & Drop State
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  // Triggers & Actions (Simplified for this view)
  // Triggers & Actions
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({
    type: 'exit_intent',
    frequency: 'session',
    delay: 0,
    targetAudience: { device: 'all', visitorType: 'all' },
    urlRules: []
  });
  const [actions, setActions] = useState<ActionConfig>({ type: 'close' });

  // --- Action Handlers ---
  const handleActionChange = (updates: Partial<ActionConfig>) => {
    setActions(prev => ({ ...prev, ...updates }));
    setSaveStatus('unsaved');
  };

  const handleUtmChange = (updates: Partial<UtmParams>) => {
    setActions(prev => ({
      ...prev,
      redirect: {
        url: prev.redirect?.url || '',
        openInNewTab: prev.redirect?.openInNewTab || false,
        utms: { ...prev.redirect?.utms, ...updates } as UtmParams
      }
    }));
    setSaveStatus('unsaved');
  };

  // Helper to generate final URL with UTMs
  const getFinalUrl = () => {
    if (!actions.redirect?.url) return '';
    try {
      const url = new URL(actions.redirect.url);
      const utms = actions.redirect.utms;
      if (utms) {
        if (utms.source) url.searchParams.set('utm_source', utms.source);
        if (utms.medium) url.searchParams.set('utm_medium', utms.medium);
        if (utms.campaign) url.searchParams.set('utm_campaign', utms.campaign);
        if (utms.term) url.searchParams.set('utm_term', utms.term);
        if (utms.content) url.searchParams.set('utm_content', utms.content);
      }
      return url.toString();
    } catch (e) {
      return actions.redirect.url;
    }
  };

  // --- Trigger Handlers ---
  const handleTriggerChange = (updates: Partial<TriggerConfig>) => {
    setTriggerConfig(prev => ({ ...prev, ...updates }));
    setSaveStatus('unsaved');
  };

  const handleAudienceChange = (updates: Partial<TriggerConfig['targetAudience']>) => {
    setTriggerConfig(prev => ({ ...prev, targetAudience: { ...prev.targetAudience, ...updates } }));
    setSaveStatus('unsaved');
  };

  const addUrlRule = () => {
    const newRule: UrlRule = { id: `rule-${Date.now()}`, condition: 'contains', value: '' };
    setTriggerConfig(prev => ({ ...prev, urlRules: [...prev.urlRules, newRule] }));
    setSaveStatus('unsaved');
  };

  const updateUrlRule = (id: string, updates: Partial<UrlRule>) => {
    setTriggerConfig(prev => ({
      ...prev,
      urlRules: prev.urlRules.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
    setSaveStatus('unsaved');
  };

  const removeUrlRule = (id: string) => {
    setTriggerConfig(prev => ({ ...prev, urlRules: prev.urlRules.filter(r => r.id !== id) }));
    setSaveStatus('unsaved');
  };

  // --- Icon Rehydration (icons cannot be serialized to JSON) ---
  const rehydrateLayerIcons = (rawLayers: any[]): Layer[] => {
    const iconMap: Record<LayerType, any> = {
      hero_image: ImageIcon,
      heading: Type,
      text: AlignLeft,
      button: MousePointer2,
      avatar_image: ImageIcon,
      input_field: User,
    };
    return rawLayers.map(l => ({
      ...l,
      icon: iconMap[l.type as LayerType] || ImageIcon,
    }));
  };

  // --- Initialization & Auto-Save Logic ---

  // 1. Initialize: Fetch or Create
  useEffect(() => {
    const initPopup = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Ensure we have a site
        const site = await getOrCreateDefaultSite(user.id);
        if (!site) {
          setShowToast({ message: 'Erro ao identificar o site. Tente novamente.', type: 'error' });
          return;
        }
        setSiteId(site.id);

        if (popupId) {
          // Load existing
          const { data, error } = await supabase
            .from('popups')
            .select('*')
            .eq('id', popupId)
            .single();

          if (error) throw error;

          if (data) {
            setPopupName(data.name);
            setPopupType(data.type as PopupType);
            if (data.layers) setLayers(rehydrateLayerIcons(data.layers));
            if (data.trigger_config) setTriggerConfig(data.trigger_config);
            if (data.actions_config) setActions(data.actions_config);
            setIsPublished(data.status === 'active');
          }
        } else {
          setSiteId(site.id); // apenas guarda o siteId, nada é criado no banco
        }
      } catch (err) {
        console.error('Error initializing popup:', err);
        setShowToast({ message: 'Erro ao carregar dados.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    initPopup();
  }, [user]); // Run once on mount when user is ready (and id/popupId handled inside)


  // 2. Auto-Save
  useEffect(() => {
    if (!popupId || isLoading) return;

    const saveToSupabase = async () => {
      if (saveStatus === 'unsaved') {
        setSaveStatus('saving');

        try {
          const { error } = await supabase
            .from('popups')
            .update({
              name: popupName,
              type: popupType,
              layers: layers,
              trigger_config: triggerConfig,
              actions_config: actions,
              updated_at: new Date().toISOString()
            })
            .eq('id', popupId);

          if (error) throw error;

          const now = new Date();
          setLastSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
          setSaveStatus('saved');
        } catch (err) {
          console.error('Auto-save error:', err);
          setSaveStatus('unsaved'); // Retry next time
        }
      }
    };

    const interval = setInterval(saveToSupabase, 30000); // Check every 30s
    // Also debounce save on unmount/change? For now stick to interval + manual triggers to match request

    return () => clearInterval(interval);
  }, [saveStatus, layers, popupName, popupType, triggerConfig, actions, popupId, isLoading]);


  // Mark as unsaved on changes
  const handleLayerChange = (id: string, newProps: Record<string, any>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, props: { ...l.props, ...newProps } } : l));
    setSaveStatus('unsaved');
  };

  const handleTypeChange = (type: PopupType) => {
    setPopupType(type);
    setSaveStatus('unsaved');
    // Swap layers to match popup type
    if (type === 'top-bar') {
      setLayers(initialTopBarLayers);
      setSelectedLayerId('tb-layer-1');
    } else if (popupType === 'top-bar') {
      setLayers(initialLayers);
      setSelectedLayerId('layer-4');
    }
  }

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLayerId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image if needed, but default is usually fine
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedLayerId) return;

    const draggedIndex = layers.findIndex(l => l.id === draggedLayerId);
    if (draggedIndex === index) return;

    // Reorder array
    const newLayers = [...layers];
    const [removed] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(index, 0, removed);

    setLayers(newLayers);
    setSaveStatus('unsaved');
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
  };

  // --- Layer Management ---
  const addLayer = (type: LayerType) => {
    const id = `layer-${Date.now()}`;
    const newLayer: Layer = (() => {
      switch (type) {
        case 'heading':
          return { id, type, label: 'TÃ­tulo', icon: Type, props: { text: 'Novo TÃ­tulo', fontSize: 22, fontWeight: 'bold', color: '#18181b', align: 'left' } };
        case 'text':
          return { id, type, label: 'ParÃ¡grafo', icon: AlignLeft, props: { text: 'Insira seu texto aqui.', fontSize: 14, color: '#52525b', align: 'left' } };
        case 'button':
          return { id, type, label: 'BotÃ£o', icon: MousePointer2, props: { text: 'Clique Aqui', backgroundColor: '#18181b', color: '#FFFFFF', borderRadius: 8 } };
        case 'hero_image':
          return { id, type, label: 'Imagem Hero', icon: ImageIcon, props: { src: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop', height: 200, objectFit: 'cover' } };
        case 'input_field':
          return { id, type, label: 'Campo: Nome', icon: User, props: { fieldType: 'name', placeholder: 'Seu nome completo', label: 'Nome', required: true } };
        default:
          return { id, type: 'text', label: 'Texto', icon: AlignLeft, props: { text: 'Novo texto.', fontSize: 14, color: '#52525b', align: 'left' } };
      }
    })();
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(id);
    setShowAddLayerMenu(false);
    setSaveStatus('unsaved');
  };

  const deleteLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
    setSaveStatus('unsaved');
  };


  const handleSaveDraft = async () => {
    setSaveStatus('saving');

    try {
      if (!popupId) {
        // Primeira vez: criar no banco
        const { data, error } = await supabase
          .from('popups')
          .insert([{
            site_id: siteId,
            name: popupName,
            status: 'draft',
            type: popupType,
            layers,
            trigger_config: triggerConfig,
            actions_config: actions,
          }])
          .select()
          .single();

        if (error) throw error;
        setPopupId(data.id);
        navigate(`/dashboard/popups/editor/${data.id}`, { replace: true });
      } else {
        // Já existe: apenas atualizar
        const { error } = await supabase
          .from('popups')
          .update({
            name: popupName,
            type: popupType,
            layers: layers,
            trigger_config: triggerConfig,
            actions_config: actions,
            updated_at: new Date().toISOString()
          })
          .eq('id', popupId);

        if (error) throw error;
      }

      const now = new Date();
      setLastSavedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      setSaveStatus('saved');
      setShowToast({ message: 'Rascunho salvo!', type: 'success' });
      setTimeout(() => setShowToast(null), 4000);
    } catch (err) {
      console.error('Manual save error:', err);
      setShowToast({ message: 'Erro ao salvar.', type: 'error' });
      setSaveStatus('unsaved');
    }
  };

  const handlePublish = () => {
    // Basic validation
    if (triggerConfig.type === 'time_on_page' && !triggerConfig.value) {
      setShowToast({ message: 'Defina o tempo para o gatilho de Tempo na Página', type: 'error' });
      return;
    }
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!popupId) return;
    setShowPublishModal(false);

    try {
      // First save everything to ensure latest state
      await supabase
        .from('popups')
        .update({
          name: popupName,
          type: popupType,
          layers: layers,
          trigger_config: triggerConfig,
          actions_config: actions,
          status: 'active',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', popupId);

      setIsPublished(true);
      setShowToast({ message: 'Popup publicado!✅', type: 'success' });
      setTimeout(() => setShowToast(null), 4000);
    } catch (err) {
      console.error('Publish error:', err);
      setShowToast({ message: 'Erro ao publicar.', type: 'error' });
    }
  };


  // --- Render Helpers ---
  const renderLayerProperties = () => {
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer) return <div className="p-5 text-sm text-zinc-500">Selecione uma camada para editar</div>;

    switch (layer.type) {
      case 'button':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 mb-3">CONTEÚDO</h3>
              <div>
                <label className="text-xs font-medium text-zinc-900 mb-1 block">Texto do Botão</label>
                <input
                  type="text"
                  value={layer.props.text}
                  onChange={(e) => handleLayerChange(layer.id, { text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="h-px bg-zinc-100"></div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 mb-3">ESTILO</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-zinc-900 mb-1 block">Cor de Fundo</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-zinc-200 shadow-sm" style={{ backgroundColor: layer.props.backgroundColor }}></div>
                    <input
                      type="text"
                      value={layer.props.backgroundColor}
                      onChange={(e) => handleLayerChange(layer.id, { backgroundColor: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-900 mb-1 block">Cor do Texto</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-zinc-200 shadow-sm" style={{ backgroundColor: layer.props.color }}></div>
                    <input
                      type="text"
                      value={layer.props.color}
                      onChange={(e) => handleLayerChange(layer.id, { color: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-900">Border Radius</label>
                  <span className="text-xs text-zinc-500">{layer.props.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={layer.props.borderRadius}
                  onChange={(e) => handleLayerChange(layer.id, { borderRadius: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>
            <div className="h-px bg-zinc-100"></div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <div className="flex gap-2">
                <Lightbulb size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Dica Pro</p>
                  <p className="leading-relaxed opacity-90">Use variÃ¡veis dinÃ¢micas no texto do botÃ£o, como <code className="bg-amber-100 px-1 rounded text-amber-900">{"{{lead.first_name}}"}</code>.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'heading':
      case 'text':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1 block">Conteúdo</label>
              <textarea
                rows={3}
                value={layer.props.text}
                onChange={(e) => handleLayerChange(layer.id, { text: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="h-px bg-zinc-100"></div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 mb-3">TIPOGRAFIA</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-900">Tamanho da Fonte</label>
                    <span className="text-xs text-zinc-500">{layer.props.fontSize}px</span>
                  </div>
                  <input
                    type="range" min="12" max={layer.type === 'heading' ? 48 : 24}
                    value={layer.props.fontSize}
                    onChange={(e) => handleLayerChange(layer.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                </div>

                {layer.type === 'heading' && (
                  <div>
                    <label className="text-xs font-medium text-zinc-900 mb-2 block">Peso</label>
                    <div className="flex gap-2">
                      {['normal', 'semibold', 'bold'].map(w => (
                        <button
                          key={w}
                          onClick={() => handleLayerChange(layer.id, { fontWeight: w })}
                          className={`flex-1 py-1.5 text-xs border rounded capitalize ${layer.props.fontWeight === w ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-zinc-200 text-zinc-600'}`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-zinc-900 mb-2 block">Alinhamento</label>
                  <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg w-max">
                    {['left', 'center', 'right'].map(a => (
                      <button
                        key={a}
                        onClick={() => handleLayerChange(layer.id, { align: a })}
                        className={`p-1.5 rounded ${layer.props.align === a ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                      >
                        <AlignLeft size={14} className={a === 'center' ? 'mx-auto' : a === 'right' ? 'ml-auto' : ''} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-900 mb-1 block">Cor</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-zinc-200 shadow-sm" style={{ backgroundColor: layer.props.color }}></div>
                    <input
                      type="text"
                      value={layer.props.color}
                      onChange={(e) => handleLayerChange(layer.id, { color: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'hero_image':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1 block">URL da Imagem</label>
              <input
                type="text"
                value={layer.props.src}
                onChange={(e) => handleLayerChange(layer.id, { src: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-zinc-600"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-900">Altura</label>
                <span className="text-xs text-zinc-500">{layer.props.height}px</span>
              </div>
              <input
                type="range" min="80" max="300"
                value={layer.props.height}
                onChange={(e) => handleLayerChange(layer.id, { height: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-2 block">Ajuste (Object Fit)</label>
              <div className="grid grid-cols-3 gap-2">
                {['cover', 'contain', 'fill'].map(fit => (
                  <button
                    key={fit}
                    onClick={() => handleLayerChange(layer.id, { objectFit: fit })}
                    className={`py-1.5 text-xs border rounded capitalize ${layer.props.objectFit === fit ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-zinc-200 text-zinc-600'}`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'input_field':
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-2 block">Tipo de Campo</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'name', icon: User, label: 'Nome' },
                  { id: 'email', icon: Mail, label: 'E-mail' },
                  { id: 'phone', icon: Phone, label: 'WhatsApp' },
                ].map(ft => (
                  <button
                    key={ft.id}
                    onClick={() => handleLayerChange(layer.id, {
                      fieldType: ft.id,
                      placeholder: ft.id === 'name' ? 'Seu nome completo' : ft.id === 'email' ? 'seu@email.com' : '(11) 99999-9999',
                      label: ft.label
                    })}
                    className={`flex flex-col items-center gap-1.5 p-2 border rounded-lg transition-all ${layer.props.fieldType === ft.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                  >
                    {React.createElement(ft.icon, { size: 15 })}
                    <span className="text-[10px] font-medium">{ft.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-zinc-100" />
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1 block">Label do Campo</label>
              <input
                type="text"
                value={layer.props.label}
                onChange={(e) => handleLayerChange(layer.id, { label: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1 block">Placeholder</label>
              <input
                type="text"
                value={layer.props.placeholder}
                onChange={(e) => handleLayerChange(layer.id, { placeholder: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-900">Campo obrigatÃ³rio</label>
              <button
                onClick={() => handleLayerChange(layer.id, { required: !layer.props.required })}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${layer.props.required ? 'bg-brand-600' : 'bg-zinc-200'
                  }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${layer.props.required ? 'translate-x-4' : 'translate-x-0'
                  }`} />
              </button>
            </div>
          </div>
        );

      case 'avatar_image':
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="text-xs font-medium text-zinc-900 mb-1 block">URL da Imagem</label>
              <input
                type="text"
                value={layer.props.src}
                onChange={(e) => handleLayerChange(layer.id, { src: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-zinc-600"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-900">Tamanho do Avatar</label>
                <span className="text-xs text-zinc-500">{layer.props.size}px</span>
              </div>
              <input
                type="range" min="32" max="72"
                value={layer.props.size}
                onChange={(e) => handleLayerChange(layer.id, { size: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>
            <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center" style={{ height: 80 }}>
              <img src={layer.props.src} alt="Preview" className="h-full w-full object-cover" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getPopupTypeStyles = () => {
    switch (popupType) {
      case 'modal':
        return 'absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 z-50 animate-in fade-in duration-300';
      case 'slide-in':
        return 'absolute bottom-6 right-6 z-50 shadow-2xl animate-in slide-in-from-right-10 duration-500';
      case 'top-bar':
        return 'absolute top-0 left-0 w-full z-50 shadow-lg animate-in slide-in-from-top-full duration-300';
      case 'toast':
        return 'absolute top-6 right-6 z-50 shadow-xl animate-in slide-in-from-top-5 fade-in duration-300';
    }
  };

  const getContainerWidth = () => {
    if (popupType === 'top-bar') return '100%';
    if (popupType === 'toast') return '320px';
    if (popupType === 'slide-in') return viewMode === 'mobile' ? '100%' : '380px';
    return viewMode === 'mobile' ? '100%' : '500px';
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-50 relative">

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-8 right-8 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-5 fade-in duration-300 ${showToast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {showToast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {showToast.message}
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Publicar popup?</h3>
            <p className="text-zinc-500 text-sm mb-6">O popup "{popupName}" ficará ativo imediatamente no seu site.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPublish}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
              >
                Publicar agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/popups')}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={18} />
            Sair
          </button>
          <div className="h-6 w-px bg-zinc-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Nome do popup:</span>
            <input
              type="text"
              value={popupName}
              onChange={(e) => { setPopupName(e.target.value); setSaveStatus('unsaved'); }}
              className="border-none bg-transparent hover:bg-zinc-50 focus:bg-white focus:ring-1 focus:ring-brand-500 rounded px-2 py-1 text-sm font-medium text-zinc-900 w-64 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isPublished && (
            <div className="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-full border border-green-200 mr-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Publicado</span>
            </div>
          )}
          <span className={`text-xs flex items-center gap-1 transition-colors ${saveStatus === 'unsaved' ? 'text-amber-600 font-medium' : 'text-zinc-400'}`}>
            <Cloud size={16} className={saveStatus === 'saving' ? 'animate-pulse' : ''} />
            {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'unsaved' ? 'Alterações não salvas' : `Salvo às ${lastSavedTime}`}
          </span>
          <div className="h-6 w-px bg-zinc-200 mx-1"></div>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Salvar Rascunho
          </button>
          <div className="relative group">
            <button
              onClick={handlePublish}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors flex items-center gap-2"
            >
              Publicar
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Steps & Layers */}
        <aside className="w-[220px] bg-white border-r border-zinc-200 flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-zinc-200">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Etapas</h3>
            <nav className="flex flex-col gap-1">
              {[
                { id: 1, label: 'Gatilhos e Condições' },
                { id: 2, label: 'Design do Popup' },
                { id: 3, label: 'Ação ao Converter' }
              ].map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id as 1 | 2 | 3)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${activeStep === step.id ? 'bg-brand-600 text-white font-medium' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${activeStep === step.id ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    {step.id}
                  </span>
                  {step.label}
                </button>
              ))}
            </nav>
          </div>

          {activeStep === 2 && (
            <div className="flex-1 overflow-y-auto p-4 animate-in slide-in-from-left-2 duration-300">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Tipo de Popup</h3>
                <div className="space-y-2">
                  {[
                    { id: 'modal', label: 'Modal Central', icon: LayoutTemplate, desc: 'Clássico, alta conversão' },
                    { id: 'slide-in', label: 'Slide-in', icon: Layers, desc: 'Discreto, canto inferior' },
                    { id: 'top-bar', label: 'Barra Superior', icon: Monitor, desc: 'Avisos e promoções' },
                    { id: 'toast', label: 'Notificação', icon: Bell, desc: 'Sugestão sutil' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeChange(type.id as any)}
                      className={`w-full flex items-center gap-3 p-3 border rounded-xl text-left transition-all duration-200 group ${popupType === type.id
                        ? 'border-brand-500 bg-brand-50 shadow-sm ring-1 ring-brand-200'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                    >
                      <div className={`p-2 rounded-lg ${popupType === type.id ? 'bg-white text-brand-600 shadow-sm' : 'bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                        <type.icon size={18} />
                      </div>
                      <div>
                        <span className={`block text-xs font-bold ${popupType === type.id ? 'text-brand-900' : 'text-zinc-700'}`}>{type.label}</span>
                        <span className="text-[10px] text-zinc-500 leading-tight block">{type.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Camadas</h3>
                  <div className="relative">
                    <button
                      onClick={() => setShowAddLayerMenu(prev => !prev)}
                      className="text-brand-600 hover:text-brand-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md hover:bg-brand-50 transition-colors"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                    {showAddLayerMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-1">
                          {[
                            { type: 'heading' as LayerType, icon: Type, label: 'TÃ­tulo' },
                            { type: 'text' as LayerType, icon: AlignLeft, label: 'ParÃ¡grafo' },
                            { type: 'button' as LayerType, icon: MousePointer2, label: 'BotÃ£o CTA' },
                            { type: 'hero_image' as LayerType, icon: ImageIcon, label: 'Imagem' },
                            { type: 'input_field' as LayerType, icon: User, label: 'Campo: Nome' },
                            { type: 'input_field' as LayerType, icon: Mail, label: 'Campo: E-mail', fieldType: 'email' },
                            { type: 'input_field' as LayerType, icon: Phone, label: 'Campo: WhatsApp', fieldType: 'phone' },
                          ].map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                if (item.fieldType) {
                                  const id = `layer-${Date.now()}`;
                                  const ph = item.fieldType === 'email' ? 'seu@email.com' : '(11) 99999-9999';
                                  const lb = item.fieldType === 'email' ? 'E-mail' : 'WhatsApp';
                                  setLayers(prev => [...prev, { id, type: 'input_field', label: `Campo: ${lb}`, icon: item.icon, props: { fieldType: item.fieldType, placeholder: ph, label: lb, required: true } }]);
                                  setSelectedLayerId(id);
                                  setShowAddLayerMenu(false);
                                  setSaveStatus('unsaved');
                                } else {
                                  addLayer(item.type);
                                }
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
                            >
                              <item.icon size={14} className="text-zinc-400" /> {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {layers.map((layer, index) => (
                    <div
                      key={layer.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, layer.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`group flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${selectedLayerId === layer.id
                        ? 'bg-brand-50 border-brand-200 shadow-sm border-l-4 border-l-brand-600'
                        : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                    >
                      <span className="text-zinc-300 cursor-grab active:cursor-grabbing hover:text-zinc-500">
                        <GripVertical size={14} />
                      </span>
                      {layer.icon && React.createElement(layer.icon, { size: 16, className: selectedLayerId === layer.id ? 'text-brand-500' : 'text-zinc-400' })}
                      <span className={`text-sm flex-1 truncate ${selectedLayerId === layer.id ? 'text-brand-700 font-medium' : 'text-zinc-700'}`}>
                        {layer.label}
                      </span>
                      <button
                        onClick={(e) => deleteLayer(layer.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity p-0.5 rounded hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Center Canvas */}
        <section className="flex-1 bg-zinc-100 flex flex-col relative overflow-hidden">
          {/* Canvas Toolbar */}
          <div className="h-12 bg-white border-b border-zinc-200 flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-100 p-1 rounded-lg flex items-center">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'desktop' ? 'bg-white shadow-sm text-brand-600' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  <Monitor size={18} />
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm text-brand-600' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  <Smartphone size={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md font-mono">
                {viewMode === 'desktop' ? '1280px' : '390px'}
              </span>
              <div className="h-4 w-px bg-zinc-200"></div>
              <span className="text-xs text-zinc-500">Preview ao vivo</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>

          {/* Canvas Scrollable Area */}
          <div
            className={`flex-1 overflow-auto bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:20px_20px] relative flex items-start justify-center pt-8 pb-10 px-6`}
            style={{ background: 'linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%)' }}
            onClick={() => setSelectedLayerId(null)}
          >
            {/* Dotted pattern overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#c4c4cc 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>

            {/* Browser / Device Frame */}
            <div
              className={`relative flex flex-col shadow-2xl transition-all duration-500 rounded-xl overflow-hidden`}
              style={{
                width: viewMode === 'mobile' ? '390px' : 'min(900px, 100%)',
                minWidth: viewMode === 'mobile' ? '390px' : '600px',
                flex: '0 0 auto',
              }}
            >
              {/* Browser Chrome */}
              {viewMode === 'desktop' ? (
                <div className="bg-[#2a2a2e] px-3 pt-3 pb-0 flex flex-col gap-2 shrink-0">
                  {/* Traffic lights */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                    <div className="flex-1 mx-3">
                      <div className="bg-[#3a3a40] rounded-md px-3 py-1 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-zinc-600 shrink-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500"></div>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono truncate">https://seu-site.com.br/pagina</span>
                      </div>
                    </div>
                  </div>
                  {/* Tab */}
                  <div className="flex items-end gap-1 -mb-px">
                    <div className="bg-white text-[10px] text-zinc-700 px-4 py-1.5 rounded-t-lg flex items-center gap-1.5 font-medium">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                      Sua Página
                    </div>
                    <div className="bg-[#3a3a40] text-[10px] text-zinc-500 px-3 py-1.5 rounded-t-lg">+</div>
                  </div>
                </div>
              ) : (
                /* Mobile Frame - notch + status bar */
                <div className="bg-[#1c1c1e] px-4 pt-2 pb-1 flex items-center justify-between shrink-0">
                  <span className="text-[10px] text-white font-semibold">9:41</span>
                  <div className="w-20 h-4 bg-[#1c1c1e] rounded-full border border-zinc-700 mx-auto absolute left-1/2 -translate-x-1/2"></div>
                  <div className="flex items-center gap-1">
                    <div className="text-white" style={{ fontSize: 9 }}>●●●</div>
                    <div className="w-5 h-2.5 border border-white/40 rounded-sm relative"><div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0.5 h-1.5 bg-white/40 rounded-r-sm"></div><div className="absolute inset-0.5 left-0.5 bg-white rounded-sm" style={{ width: '70%' }}></div></div>
                  </div>
                </div>
              )}

              {/* Visual Representation of the Viewport Frame */}
              <div
                className={`relative bg-zinc-50 overflow-hidden transition-all duration-300`}
                style={{
                  height: viewMode === 'mobile' ? '680px' : '600px',
                }}
              >

                {/* Fake Page Content (Skeleton) - gives context to the popup preview */}
                <div className="absolute inset-0 bg-white overflow-hidden pointer-events-none select-none">
                  {/* Fake nav */}
                  <div className="flex items-center gap-4 px-6 py-3 border-b border-zinc-100">
                    <div className="w-20 h-5 bg-zinc-200 rounded-md"></div>
                    <div className="flex gap-3 ml-4">
                      <div className="w-12 h-3.5 bg-zinc-100 rounded"></div>
                      <div className="w-16 h-3.5 bg-zinc-100 rounded"></div>
                      <div className="w-10 h-3.5 bg-zinc-100 rounded"></div>
                      <div className="w-14 h-3.5 bg-zinc-100 rounded"></div>
                    </div>
                    <div className="ml-auto w-20 h-6 bg-zinc-900 rounded-md opacity-20"></div>
                  </div>
                  {/* Fake hero */}
                  <div className="px-8 pt-6 pb-4">
                    <div className="w-2/3 h-7 bg-zinc-200 rounded-lg mb-3"></div>
                    <div className="w-1/2 h-5 bg-zinc-100 rounded-lg mb-2"></div>
                    <div className="w-3/5 h-4 bg-zinc-100 rounded-lg mb-5"></div>
                    <div className="flex gap-3 mb-6">
                      <div className="w-28 h-8 bg-zinc-900 rounded-lg opacity-20"></div>
                      <div className="w-24 h-8 bg-zinc-200 rounded-lg"></div>
                    </div>
                    <div className="w-full h-36 bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-xl"></div>
                  </div>
                  {/* Fake content blocks */}
                  <div className="px-8 pt-2 grid grid-cols-3 gap-3">
                    <div className="h-16 bg-zinc-100 rounded-lg"></div>
                    <div className="h-16 bg-zinc-100 rounded-lg"></div>
                    <div className="h-16 bg-zinc-100 rounded-lg"></div>
                  </div>
                  <div className="px-8 pt-4 space-y-2">
                    <div className="w-full h-3 bg-zinc-100 rounded"></div>
                    <div className="w-5/6 h-3 bg-zinc-100 rounded"></div>
                    <div className="w-4/6 h-3 bg-zinc-100 rounded"></div>
                  </div>
                  {/* Overlay tint so the popup pops */}
                  <div className="absolute inset-0 bg-zinc-900/5"></div>
                </div>

                {/* The Popup Container Logic */}
                <div className={`${getPopupTypeStyles()}`}>
                  {/* The Popup Itself */}
                  <div
                    className={`bg-white relative overflow-hidden transition-all duration-200 ${popupType === 'modal'
                      ? 'rounded-xl shadow-2xl ring-1 ring-black/5'
                      : popupType === 'top-bar'
                        ? 'shadow-md border-b border-zinc-200/80'
                        : 'rounded-lg border border-zinc-200'
                      }`}
                    style={{
                      width: popupType === 'modal' ? getContainerWidth() : '100%',
                      height: popupType === 'top-bar' ? '72px' : 'auto',
                      display: popupType === 'top-bar' ? 'flex' : 'block',
                      alignItems: popupType === 'top-bar' ? 'center' : 'unset'
                    }}
                  >
                    {/* Close Button */}
                    <div className="absolute top-2 right-2 z-20">
                      <button className="text-zinc-400 hover:text-zinc-600 transition-colors bg-white/50 rounded-full p-1">
                        <X size={16} />
                      </button>
                    </div>

                    {/* Render Layers */}
                    {/* === TOP-BAR: iPhone Notification Layout === */}
                    {popupType === 'top-bar' ? (
                      <div className="flex items-center gap-3 px-4 w-full h-full">
                        {/* Avatar */}
                        {layers.find(l => l.type === 'avatar_image') && (() => {
                          const avatarLayer = layers.find(l => l.type === 'avatar_image')!;
                          const isSelected = selectedLayerId === avatarLayer.id;
                          return (
                            <div
                              onClick={(e) => { e.stopPropagation(); setSelectedLayerId(avatarLayer.id); }}
                              className={`cursor-pointer shrink-0 rounded-xl overflow-hidden transition-all ${isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : 'hover:ring-2 hover:ring-brand-300'}`}
                              style={{ width: avatarLayer.props.size, height: avatarLayer.props.size }}
                            >
                              <img src={avatarLayer.props.src} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                          );
                        })()}

                        {/* Title + Message stack */}
                        <div className="flex-1 min-w-0">
                          {layers.filter(l => l.type === 'heading').map(layer => {
                            const isSelected = selectedLayerId === layer.id;
                            return (
                              <div
                                key={layer.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                className={`cursor-pointer transition-all rounded ${isSelected ? 'ring-2 ring-brand-500 ring-offset-1' : 'hover:ring-2 hover:ring-brand-300'}`}
                              >
                                <p style={{ fontSize: `${layer.props.fontSize}px`, fontWeight: layer.props.fontWeight, color: layer.props.color }} className="truncate leading-tight">
                                  {layer.props.text}
                                </p>
                              </div>
                            );
                          })}
                          {layers.filter(l => l.type === 'text').map(layer => {
                            const isSelected = selectedLayerId === layer.id;
                            return (
                              <div
                                key={layer.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                className={`cursor-pointer transition-all rounded ${isSelected ? 'ring-2 ring-brand-500 ring-offset-1' : 'hover:ring-2 hover:ring-brand-300'}`}
                              >
                                <p style={{ fontSize: `${layer.props.fontSize}px`, color: layer.props.color }} className="truncate leading-tight">
                                  {layer.props.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* CTA Button */}
                        {layers.filter(l => l.type === 'button').map(layer => {
                          const isSelected = selectedLayerId === layer.id;
                          return (
                            <div
                              key={layer.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                              className={`cursor-pointer shrink-0 transition-all rounded-full ${isSelected ? 'ring-2 ring-brand-500 ring-offset-1' : 'hover:ring-2 hover:ring-brand-300'}`}
                            >
                              <button
                                style={{
                                  backgroundColor: layer.props.backgroundColor,
                                  color: layer.props.color,
                                  borderRadius: `${layer.props.borderRadius}px`,
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {layer.props.text}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                    ) : (
                      /* === OTHER TYPES: Standard vertical layout === */
                      <div className="flex flex-col">
                        {layers.map((layer) => {
                          const isSelected = selectedLayerId === layer.id;
                          const selectionStyle = isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : 'hover:ring-2 hover:ring-brand-500/30 hover:ring-offset-1';

                          if (layer.type === 'input_field') {
                            const FieldIcon = layer.props.fieldType === 'email' ? Mail : layer.props.fieldType === 'phone' ? Phone : User;
                            const inputType = layer.props.fieldType === 'email' ? 'email' : layer.props.fieldType === 'phone' ? 'tel' : 'text';
                            const isSelected = selectedLayerId === layer.id;
                            return (
                              <div
                                key={layer.id}
                                className={`px-6 py-2 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-brand-500 ring-offset-2' : 'hover:ring-2 hover:ring-brand-500/30 hover:ring-offset-1'} rounded-lg mx-2`}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                              >
                                <label className="text-xs font-medium text-zinc-600 mb-1.5 flex items-center gap-1.5">
                                  <FieldIcon size={12} />
                                  {layer.props.label}
                                  {layer.props.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                    <FieldIcon size={16} />
                                  </div>
                                  <input
                                    type={inputType}
                                    placeholder={layer.props.placeholder}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 text-sm bg-white text-zinc-500 pointer-events-none"
                                    readOnly
                                  />
                                </div>
                              </div>
                            );
                          }

                          if (layer.type === 'hero_image') {
                            return (
                              <div
                                key={layer.id}
                                className={`relative group cursor-pointer transition-all ${selectionStyle}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                style={{ height: `${layer.props.height}px` }}
                              >
                                <img src={layer.props.src} alt="Hero" className="w-full h-full" style={{ objectFit: layer.props.objectFit }} />
                              </div>
                            );
                          }

                          if (layer.type === 'heading') {
                            return (
                              <div
                                key={layer.id}
                                className={`px-8 pt-6 pb-2 cursor-pointer transition-all ${selectionStyle} rounded-lg mx-2 mt-2`}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                style={{ textAlign: layer.props.align }}
                              >
                                <h2 style={{ fontSize: `${layer.props.fontSize}px`, fontWeight: layer.props.fontWeight, color: layer.props.color }}>
                                  {layer.props.text}
                                </h2>
                              </div>
                            );
                          }

                          if (layer.type === 'text') {
                            return (
                              <div
                                key={layer.id}
                                className={`px-8 pb-6 cursor-pointer transition-all ${selectionStyle} rounded-lg mx-2`}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                                style={{ textAlign: layer.props.align }}
                              >
                                <p style={{ fontSize: `${layer.props.fontSize}px`, color: layer.props.color }}>
                                  {layer.props.text}
                                </p>
                              </div>
                            );
                          }

                          if (layer.type === 'button') {
                            return (
                              <div
                                key={layer.id}
                                className={`px-8 pb-8 cursor-pointer transition-all ${selectionStyle} rounded-lg mx-2 mb-2`}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                              >
                                <button style={{
                                  width: '100%',
                                  backgroundColor: layer.props.backgroundColor,
                                  color: layer.props.color,
                                  borderRadius: `${layer.props.borderRadius}px`,
                                  padding: '12px',
                                  fontWeight: 600,
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                  {layer.props.text}
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div> {/* End browser/device frame */}
          </div>
        </section>

        {/* Right Sidebar - Dynamic Properties */}
        <aside className="w-[320px] bg-white border-l border-zinc-200 flex flex-col shrink-0 z-10 overflow-y-auto transition-all duration-300">

          {/* ETAPA 1: GATILHOS E CONDIÃ‡Ã•ES */}
          {activeStep === 1 && (
            <>
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-sm font-bold text-zinc-900">Gatilhos e CondiÃ§Ãµes</h2>
              </div>
              <div className="p-5 space-y-6">
                {/* Trigger Type */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Gatilho principal</h3>
                  <div className="space-y-2">
                    {[
                      { type: 'exit_intent', icon: <LogOut size={16} />, label: 'Exit Intent', desc: 'Quando o cursor sai da janela' },
                      { type: 'time_on_page', icon: <Clock size={16} />, label: 'Tempo na Página', desc: 'Após X segundos na página' },
                      { type: 'scroll_depth', icon: <Scroll size={16} />, label: 'Profundidade de Scroll', desc: 'Ao rolar X% da página' },
                      { type: 'inactivity', icon: <MousePointerClick size={16} />, label: 'Inatividade', desc: 'Sem interação por X segundos' },
                    ].map((t) => (
                      <div key={t.type}>
                        <button
                          onClick={() => handleTriggerChange({ type: t.type as TriggerType })}
                          className={`w-full flex items-start gap-3 p-3 border rounded-lg text-left transition-all ${triggerConfig.type === t.type
                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                            }`}
                        >
                          <div className={`p-1.5 rounded-md shrink-0 ${triggerConfig.type === t.type ? 'text-brand-600 bg-brand-100' : 'text-zinc-400 bg-zinc-100'}`}>
                            {t.icon}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${triggerConfig.type === t.type ? 'text-brand-700' : 'text-zinc-900'}`}>{t.label}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{t.desc}</p>
                          </div>
                        </button>

                        {/* Conditional Inputs for Trigger Values */}
                        {triggerConfig.type === t.type && (
                          <div className="mt-2 pl-12 pr-1 animate-in slide-in-from-top-2 duration-200">
                            {t.type === 'time_on_page' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-700">Mostrar após:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={triggerConfig.value || ''}
                                  onChange={(e) => handleTriggerChange({ value: parseInt(e.target.value) })}
                                  placeholder="5"
                                  className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                />
                                <span className="text-xs text-zinc-500">segundos</span>
                              </div>
                            )}
                            {t.type === 'scroll_depth' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-700">Ao rolar:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={triggerConfig.value || ''}
                                  onChange={(e) => handleTriggerChange({ value: parseInt(e.target.value) })}
                                  placeholder="50"
                                  className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                />
                                <span className="text-xs text-zinc-500">% da pÃ¡gina</span>
                              </div>
                            )}
                            {t.type === 'inactivity' && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-700">Inativo por:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={triggerConfig.value || ''}
                                  onChange={(e) => handleTriggerChange({ value: parseInt(e.target.value) })}
                                  placeholder="10"
                                  className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none"
                                />
                                <span className="text-xs text-zinc-500">segundos</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-zinc-100"></div>

                {/* Delay */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-900">Delay adicional (opcional)</label>
                    <span className="text-xs text-zinc-500">{triggerConfig.delay}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={triggerConfig.delay || 0}
                    onChange={(e) => handleTriggerChange({ delay: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                </div>

                <div className="h-px bg-zinc-100"></div>

                {/* Target Audience */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Público-alvo</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Dispositivo</label>
                      <div className="flex gap-2">
                        {[
                          { id: 'all', label: 'Todos' },
                          { id: 'desktop', label: 'Desktop' },
                          { id: 'mobile', label: 'Mobile' }
                        ].map((d) => (
                          <button
                            key={d.id}
                            onClick={() => handleAudienceChange({ device: d.id as any })}
                            className={`flex-1 py-2 text-xs border rounded-lg font-medium transition-colors ${triggerConfig.targetAudience?.device === d.id
                              ? 'bg-brand-50 border-brand-500 text-brand-700'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                              }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Visitante</label>
                      <select
                        value={triggerConfig.targetAudience?.visitorType}
                        onChange={(e) => handleAudienceChange({ visitorType: e.target.value as any })}
                        className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="all">Todos os visitantes</option>
                        <option value="new">Novos visitantes</option>
                        <option value="returning">Visitantes recorrentes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-100"></div>

                {/* URL Rules */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Regras de URL</h3>
                  {triggerConfig.urlRules.map((rule, idx) => (
                    <div key={rule.id} className="bg-zinc-50 border border-zinc-200 rounded-lg p-2 mb-2 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                      <select
                        value={rule.condition}
                        onChange={(e) => updateUrlRule(rule.id, { condition: e.target.value as any })}
                        className="text-xs border border-zinc-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="contains">ContÃ©m</option>
                        <option value="equals">Ã‰ igual a</option>
                        <option value="starts_with">ComeÃ§a com</option>
                      </select>
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => updateUrlRule(rule.id, { value: e.target.value })}
                        placeholder="/oferta"
                        className="flex-1 text-xs border border-zinc-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => removeUrlRule(rule.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addUrlRule}
                    className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700 px-1 py-0.5 rounded hover:bg-brand-50 transition-colors"
                  >
                    <Plus size={12} /> Adicionar regra
                  </button>
                </div>

                <div className="h-px bg-zinc-100"></div>

                {/* Frequency */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Frequência</h3>
                  <select
                    value={triggerConfig.frequency}
                    onChange={(e) => handleTriggerChange({ frequency: e.target.value as any })}
                    className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="session">1x por sessão</option>
                    <option value="visitor">1x por visitante</option>
                    <option value="always">Sempre exibir</option>
                    <option value="daily">1x por dia</option>
                  </select>
                </div>
              </div>
            </>
          )}


          {/* ETAPA 2: DESIGN - Dynamic Properties */}
          {activeStep === 2 && (
            <>
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-sm font-bold text-zinc-900">Propriedades</h2>
                {selectedLayerId && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wide">
                    {layers.find(l => l.id === selectedLayerId)?.label}
                  </span>
                )}
              </div>

              <div className="p-5">
                {renderLayerProperties()}
              </div>
            </>
          )}

          {/* ETAPA 3: AÃ‡ÃƒO AO CONVERTER */}
          {activeStep === 3 && (
            <>
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-sm font-bold text-zinc-900">Ação ao Converter</h2>
              </div>
              <div className="p-5 space-y-6">
                {/* Action Type */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">O que acontece ao clicar no CTA?</h3>
                  <div className="space-y-2">
                    {[
                      { type: 'whatsapp', icon: <MessageCircle size={16} />, label: 'Abrir WhatsApp', desc: 'Redirecionar para conversa no WhatsApp', color: 'text-green-600 bg-green-50' },
                      { type: 'redirect', icon: <Link size={16} />, label: 'Redirecionar para URL', desc: 'Abrir uma página de oferta ou landing page', color: 'text-blue-600 bg-blue-50' },
                      { type: 'webhook', icon: <Webhook size={16} />, label: 'Enviar Webhook', desc: 'Disparar evento para uma URL externa', color: 'text-brand-600 bg-brand-50' },
                      { type: 'success_message', icon: <CheckCircle size={16} />, label: 'Mensagem de Sucesso', desc: 'Exibir uma mensagem de confirmação', color: 'text-amber-600 bg-amber-50' },
                      { type: 'close', icon: <X size={16} />, label: 'Apenas Fechar', desc: 'Fechar o popup sem ação adicional', color: 'text-zinc-500 bg-zinc-100' },
                    ].map((a) => (
                      <button
                        key={a.type}
                        onClick={() => handleActionChange({ type: a.type as any })}
                        className={`w-full flex items-start gap-3 p-3 border rounded-lg text-left transition-all ${actions.type === a.type
                          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                          }`}
                      >
                        <div className={`p-1.5 rounded-md shrink-0 ${a.color}`}>
                          {a.icon}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${actions.type === a.type ? 'text-brand-700' : 'text-zinc-900'}`}>{a.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{a.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-zinc-100"></div>

                {/* --- Conditional Inputs based on Action Type --- */}

                {/* WhatsApp Config */}
                {actions.type === 'whatsapp' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">ConfiguraÃ§Ã£o WhatsApp</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 mb-1.5 block">NÃºmero WhatsApp <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          value={actions.whatsapp?.number || ''}
                          onChange={(e) => handleActionChange({ whatsapp: { ...actions.whatsapp, number: e.target.value } as any })}
                          placeholder="+55 11 99999-9999"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Mensagem prÃ©-definida</label>
                        <textarea
                          rows={3}
                          value={actions.whatsapp?.message || ''}
                          onChange={(e) => handleActionChange({ whatsapp: { ...actions.whatsapp, message: e.target.value } as any })}
                          placeholder="OlÃ¡! Vi a oferta e quero saber mais."
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Redirect Config + UTM Builder */}
                {actions.type === 'redirect' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Redirecionamento</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 mb-1.5 block">URL de destino <span className="text-red-500">*</span></label>
                        <input
                          type="url"
                          value={actions.redirect?.url || ''}
                          onChange={(e) => handleActionChange({ redirect: { ...actions.redirect, url: e.target.value } as any })}
                          placeholder="https://seu-site.com/oferta"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="newTab"
                          checked={actions.redirect?.openInNewTab || false}
                          onChange={(e) => handleActionChange({ redirect: { ...actions.redirect, openInNewTab: e.target.checked } as any })}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="newTab" className="text-xs text-zinc-700">Abrir em nova guia</label>
                      </div>

                      {/* UTM Builder */}
                      <div className="pt-2 border-t border-zinc-100 mt-2">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-zinc-800">Construtor de UTMs</h4>
                          <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">Opcional</span>
                        </div>
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-medium text-zinc-500 mb-1 block">Source (origem)</label>
                              <input
                                type="text"
                                placeholder="google, facebook"
                                value={actions.redirect?.utms?.source || ''}
                                onChange={(e) => handleUtmChange({ source: e.target.value })}
                                className="w-full px-2 py-1.5 rounded border border-zinc-200 text-xs focus:ring-1 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-medium text-zinc-500 mb-1 block">Medium (meio)</label>
                              <input
                                type="text"
                                placeholder="cpc, banner"
                                value={actions.redirect?.utms?.medium || ''}
                                onChange={(e) => handleUtmChange({ medium: e.target.value })}
                                className="w-full px-2 py-1.5 rounded border border-zinc-200 text-xs focus:ring-1 focus:ring-brand-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-zinc-500 mb-1 block">Campaign (nome da campanha)</label>
                            <input
                              type="text"
                              placeholder="oferta_verao"
                              value={actions.redirect?.utms?.campaign || ''}
                              onChange={(e) => handleUtmChange({ campaign: e.target.value })}
                              className="w-full px-2 py-1.5 rounded border border-zinc-200 text-xs focus:ring-1 focus:ring-brand-500"
                            />
                          </div>

                          {/* URL Preview */}
                          {actions.redirect?.url && (
                            <div className="bg-zinc-50 p-2 rounded border border-zinc-200 mt-2">
                              <p className="text-[10px] font-semibold text-zinc-500 mb-0.5">Preview da URL final:</p>
                              <p className="text-[10px] text-zinc-600 break-all font-mono leading-tight bg-white p-1 rounded border border-zinc-100">
                                {getFinalUrl()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Webhook Config */}
                {actions.type === 'webhook' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">ConfiguraÃ§Ã£o Webhook</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 mb-1.5 block">URL do Webhook <span className="text-red-500">*</span></label>
                        <input
                          type="url"
                          value={actions.webhook?.url || ''}
                          onChange={(e) => handleActionChange({ webhook: { ...actions.webhook, url: e.target.value } as any })}
                          placeholder="https://webhook.site/..."
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-zinc-700 mb-1.5 block">MÃ©todo HTTP</label>
                        <select
                          value={actions.webhook?.method || 'POST'}
                          onChange={(e) => handleActionChange({ webhook: { ...actions.webhook, method: e.target.value } as any })}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                          <option value="PUT">PUT</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message Config */}
                {actions.type === 'success_message' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Após conversão</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 mb-1.5 block">Mensagem de sucesso</label>
                        <input
                          type="text"
                          value={actions.successMessage?.text || 'Obrigado! Cadastro realizado com sucesso.'}
                          onChange={(e) => handleActionChange({ successMessage: { ...actions.successMessage, text: e.target.value } as any })}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-700">Fechar apÃ³s</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={actions.successMessage?.autoCloseDuration || 5}
                            onChange={(e) => handleActionChange({ successMessage: { ...actions.successMessage, autoCloseDuration: parseInt(e.target.value) } as any })}
                            min="1"
                            max="30"
                            className="w-14 text-center px-2 py-1 rounded border border-zinc-300 text-xs"
                          />
                          <span className="text-xs text-zinc-500">segundos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Tracking Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <Lightbulb size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-green-800">
                      <p className="font-medium mb-1">Rastreamento automático</p>
                      <p className="leading-relaxed opacity-90">O evento de conversão será automaticamente capturado pelo tracker e visível no dashboard.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </aside>
      </div>
    </div>
  );
};