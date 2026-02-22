# 📱 iOS Toast Notification — Prompt para IA da IDE

Cole o texto abaixo diretamente no chat do Cursor / Windsurf / Copilot:

---

```
Preciso que você adicione um novo tipo de popup chamado "ios-toast" ao PopupEditor.tsx.
Siga EXATAMENTE o padrão existente do arquivo. Não quebre nenhum tipo existente.
Leia o arquivo inteiro antes de fazer qualquer alteração.

────────────────────────────────────────
1. TIPO
────────────────────────────────────────
Altere o type PopupType (linha ~44) de:
  type PopupType = 'modal' | 'slide-in' | 'top-bar' | 'toast';
Para:
  type PopupType = 'modal' | 'slide-in' | 'top-bar' | 'toast' | 'ios-toast';


────────────────────────────────────────
2. STATE — adicione esses 3 estados dentro do componente PopupEditor,
   junto dos outros useState existentes:
────────────────────────────────────────

const [iosToastMessages, setIosToastMessages] = useState<string[]>([
  'Olá! Posso te ajudar com alguma dúvida?',
  'Fale agora com um especialista.',
  'Atendimento rápido e personalizado.',
]);
const [iosToastIntervalMs, setIosToastIntervalMs] = useState<number>(7000);
const [iosToastAutoHideMs, setIosToastAutoHideMs] = useState<number>(4500);


────────────────────────────────────────
3. CAMADAS INICIAIS — adicione após as initialTopBarLayers existentes:
────────────────────────────────────────

const initialIosToastLayers: Layer[] = [
  {
    id: 'iot-layer-avatar',
    type: 'avatar_image',
    label: 'Foto do Atendente',
    icon: ImageIcon,
    props: { src: '', size: 44 }
  },
  {
    id: 'iot-layer-title',
    type: 'heading',
    label: 'Título Principal',
    icon: Type,
    props: { text: 'Atendimento Online', fontSize: 14, fontWeight: 'bold', color: '#0b1225', align: 'left' }
  },
  {
    id: 'iot-layer-desc',
    type: 'text',
    label: 'Texto Descrição',
    icon: AlignLeft,
    props: { text: 'Clique para falar com um especialista agora.', fontSize: 13, color: '#4a5568', align: 'left' }
  },
];


────────────────────────────────────────
4. handleTypeChange — adicione o caso 'ios-toast':
────────────────────────────────────────

Dentro do handleTypeChange existente, adicione:

  if (type === 'ios-toast') {
    setLayers(initialIosToastLayers);
    setSelectedLayerId('iot-layer-title');
  }


────────────────────────────────────────
5. SELETOR DE TIPO (painel esquerdo) — adicione o botão 'ios-toast'
   na lista onde estão modal, slide-in, top-bar, toast:
────────────────────────────────────────

Adicione este objeto no array de tipos:
  { id: 'ios-toast', label: 'iOS Toast', icon: Bell, desc: 'Notificação flutuante no topo' }


────────────────────────────────────────
6. LISTA DE CAMADAS (painel esquerdo) — BLOQUEIO de adição e exclusão:
────────────────────────────────────────

A) No botão "+ Adicionar" camada, oculte-o quando popupType === 'ios-toast':
   Envolva o botão com: {popupType !== 'ios-toast' && ( ... )}

B) No botão de deletar camada (ícone Trash2 dentro do map de layers),
   oculte-o quando popupType === 'ios-toast':
   Troque a condição do botão de lixeira para:
   {popupType !== 'ios-toast' && (
     <button onClick={(e) => deleteLayer(layer.id, e)} ...>
       <Trash2 size={14} />
     </button>
   )}

C) No map de layers, desabilite o drag quando popupType === 'ios-toast':
   No elemento draggable, altere para:
   draggable={popupType !== 'ios-toast'}
   e remova os handlers onDragStart/onDragOver/onDragEnd quando for ios-toast:
   onDragStart={popupType !== 'ios-toast' ? (e) => handleDragStart(e, layer.id) : undefined}
   onDragOver={popupType !== 'ios-toast' ? (e) => handleDragOver(e, index) : undefined}
   onDragEnd={popupType !== 'ios-toast' ? handleDragEnd : undefined}


────────────────────────────────────────
7. PAINEL DIREITO — propriedades especiais para ios-toast:
────────────────────────────────────────

No bloco "ETAPA 2: DESIGN - Dynamic Properties" (activeStep === 2),
ANTES do {renderLayerProperties()}, adicione:

{popupType === 'ios-toast' && (
  <div className="mb-6 space-y-5">

    {/* Foto do Atendente */}
    <div>
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
        Foto do Atendente
      </h3>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0"
        >
          {layers.find(l => l.id === 'iot-layer-avatar')?.props.src ? (
            <img
              src={layers.find(l => l.id === 'iot-layer-avatar')!.props.src}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium text-zinc-900 mb-1 block">URL da Foto</label>
          <input
            type="text"
            value={layers.find(l => l.id === 'iot-layer-avatar')?.props.src || ''}
            placeholder="https://..."
            onChange={(e) => handleLayerChange('iot-layer-avatar', { src: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-600"
          />
        </div>
      </div>
    </div>

    <div className="h-px bg-zinc-100" />

    {/* Mensagens rotativas */}
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Mensagens Rotativas
        </h3>
        <button
          onClick={() => setIosToastMessages(prev => [...prev, 'Nova mensagem...'])}
          className="text-brand-600 hover:text-brand-800 text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-md hover:bg-brand-50 transition-colors"
        >
          <Plus size={13} /> Adicionar
        </button>
      </div>
      <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
        Essas mensagens aparecem em sequência na notificação, em loop automático.
      </p>
      <div className="space-y-2">
        {iosToastMessages.map((msg, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-2 w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
              {idx + 1}
            </span>
            <input
              type="text"
              value={msg}
              onChange={(e) => {
                const updated = [...iosToastMessages];
                updated[idx] = e.target.value;
                setIosToastMessages(updated);
                setSaveStatus('unsaved');
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {iosToastMessages.length > 1 && (
              <button
                onClick={() => setIosToastMessages(prev => prev.filter((_, i) => i !== idx))}
                className="mt-1.5 text-zinc-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className="h-px bg-zinc-100" />

    {/* Temporização */}
    <div>
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
        Temporização
      </h3>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-zinc-900">Intervalo entre mensagens</label>
            <span className="text-xs text-zinc-500">{(iosToastIntervalMs / 1000).toFixed(0)}s</span>
          </div>
          <input
            type="range" min="3000" max="20000" step="500"
            value={iosToastIntervalMs}
            onChange={(e) => { setIosToastIntervalMs(Number(e.target.value)); setSaveStatus('unsaved'); }}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-zinc-900">Duração de cada notificação</label>
            <span className="text-xs text-zinc-500">{(iosToastAutoHideMs / 1000).toFixed(1)}s</span>
          </div>
          <input
            type="range" min="2000" max="10000" step="500"
            value={iosToastAutoHideMs}
            onChange={(e) => { setIosToastAutoHideMs(Number(e.target.value)); setSaveStatus('unsaved'); }}
            className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>
      </div>
    </div>

    <div className="h-px bg-zinc-100" />

  </div>
)}


────────────────────────────────────────
8. PREVIEW NO CANVAS (centro) — renderização do ios-toast:
────────────────────────────────────────

Ainda dentro da div do viewport (após o bloco de 'top-bar' e FORA da
div className={getPopupTypeStyles()}), adicione DIRETAMENTE dentro da
div branca do viewport (que tem className="relative bg-white shadow-2xl ..."):

{popupType === 'ios-toast' && (() => {
  const avatarLayer = layers.find(l => l.id === 'iot-layer-avatar');
  const titleLayer  = layers.find(l => l.id === 'iot-layer-title');
  const msgLayer    = layers.find(l => l.id === 'iot-layer-desc');

  return (
    <div
      style={{
        position: 'absolute', top: 12, left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(90%, 400px)', zIndex: 50,
      }}
    >
      <div style={{
        display: 'grid', gridTemplateColumns: '44px 1fr 28px',
        gap: 10, alignItems: 'center',
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'saturate(180%) blur(14px)',
        WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      }}>

        {/* Avatar */}
        <div
          onClick={(e) => { e.stopPropagation(); setSelectedLayerId('iot-layer-avatar'); }}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)',
            background: '#e9eefb', display: 'grid', placeItems: 'center',
            fontSize: 16, fontWeight: 700, color: '#0b1225', cursor: 'pointer',
            outline: selectedLayerId === 'iot-layer-avatar' ? '2px solid #6366f1' : undefined,
            outlineOffset: 2,
          }}
        >
          {avatarLayer?.props.src ? (
            <img src={avatarLayer.props.src} alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : <span>A</span>}
        </div>

        {/* Title + active message preview */}
        <div style={{ minWidth: 0 }}>
          <div
            onClick={(e) => { e.stopPropagation(); setSelectedLayerId('iot-layer-title'); }}
            style={{
              cursor: 'pointer',
              outline: selectedLayerId === 'iot-layer-title' ? '2px solid #6366f1' : undefined,
              outlineOffset: 2, borderRadius: 4,
            }}
          >
            <p style={{
              margin: 0, fontWeight: titleLayer?.props.fontWeight || 'bold',
              fontSize: titleLayer?.props.fontSize || 14,
              color: titleLayer?.props.color || '#0b1225',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {titleLayer?.props.text || 'Título'}
            </p>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); setSelectedLayerId('iot-layer-desc'); }}
            style={{
              cursor: 'pointer', marginTop: 2,
              outline: selectedLayerId === 'iot-layer-desc' ? '2px solid #6366f1' : undefined,
              outlineOffset: 2, borderRadius: 4,
            }}
          >
            <p style={{
              margin: 0, fontSize: msgLayer?.props.fontSize || 13,
              color: msgLayer?.props.color || '#4a5568',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {iosToastMessages[0] || msgLayer?.props.text || 'Mensagem...'}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          display: 'grid', placeItems: 'center', width: 28, height: 28,
          borderRadius: 9, border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(0,0,0,0.05)',
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14, opacity: 0.7 }}>
            <path d="M13.172 12L8.222 7.05l1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/>
          </svg>
        </div>

      </div>
      {/* Badge de preview */}
      <p style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: '#a1a1aa' }}>
        Preview — {iosToastMessages.length} mensagem{iosToastMessages.length !== 1 ? 's' : ''} configurada{iosToastMessages.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
})()}

IMPORTANTE: O ios-toast não deve usar getPopupTypeStyles() nem entrar
dentro da div que tem className={getPopupTypeStyles()}. Ele é renderizado
independentemente, diretamente dentro do viewport, sem overlay, sem blur
de fundo, sem bloquear scroll. O getPopupTypeStyles() deve retornar
undefined (ou uma string vazia) quando popupType === 'ios-toast',
para que a div container do popup fique invisível nesse caso:

  case 'ios-toast':
    return 'hidden'; // oculta o container padrão


────────────────────────────────────────
9. SALVAR/CARREGAR — inclua iosToastMessages, iosToastIntervalMs e
   iosToastAutoHideMs nas operações de save/load do Supabase:
────────────────────────────────────────

A) No insert (criação de novo popup) e no update (auto-save e manual save),
   adicione ao objeto enviado:
     ios_toast_config: {
       messages: iosToastMessages,
       intervalMs: iosToastIntervalMs,
       autoHideMs: iosToastAutoHideMs,
     }

B) Ao carregar um popup existente (data = resultado do .select()):
   if (data.ios_toast_config) {
     if (data.ios_toast_config.messages) setIosToastMessages(data.ios_toast_config.messages);
     if (data.ios_toast_config.intervalMs) setIosToastIntervalMs(data.ios_toast_config.intervalMs);
     if (data.ios_toast_config.autoHideMs) setIosToastAutoHideMs(data.ios_toast_config.autoHideMs);
   }


────────────────────────────────────────
RESUMO DO QUE NÃO PODE QUEBRAR:
────────────────────────────────────────
- modal, slide-in, top-bar, toast continuam funcionando igual
- getPopupTypeStyles() retorna 'hidden' APENAS para 'ios-toast'
- o botão "+ Adicionar camada" SOME quando popupType === 'ios-toast'
- o botão de lixeira nas camadas SOME quando popupType === 'ios-toast'
- drag-and-drop das camadas fica desabilitado quando popupType === 'ios-toast'
- no painel direito, quando popupType === 'ios-toast' e activeStep === 2,
  a seção especial (foto + mensagens + temporização) aparece ACIMA do
  renderLayerProperties() normal — assim o usuário ainda pode clicar
  numa camada e editar título/texto normalmente pelo painel
```

---

## Coluna de suporte — o que cada parte faz

| Parte | O que resolve |
|---|---|
| State `iosToastMessages` | Lista de mensagens rotativas editável pelo usuário |
| State `iosToastIntervalMs` | Intervalo entre cada toast aparecer |
| State `iosToastAutoHideMs` | Quanto tempo o toast fica visível |
| Bloqueio de "+ Adicionar" | Impede adicionar camadas que não existem no layout do toast |
| Bloqueio do Trash nas camadas | Impede deletar as 3 camadas fixas (avatar, título, descrição) |
| Bloqueio de drag | Evita reordenar camadas (a ordem é fixa no toast) |
| Painel direito especial | Controles dedicados: foto, mensagens, temporização |
| Preview no canvas | Mostra o toast real no topo do viewport sem overlay |
| `getPopupTypeStyles` → `'hidden'` | Oculta o container de popup padrão (que causaria overlay/scroll block) |
