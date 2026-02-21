// Tipos globais do LeadSense Tracker

export interface LeadProfile {
    visitor_id: string;
    session_id: string;
    is_returning: boolean;
    session_count: number;
    first_seen: string;
    last_seen: string;
    identified: boolean;
    lead: {
        name: string | null;
        email: string | null;
        whatsapp: string | null;
    };
}

export interface SessionData {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    referrer: string;
    referrer_domain: string;
    url: string;
    path: string;
    title: string;
    device_type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    screen_width: number;
    screen_height: number;
    language: string;
    timezone: string;
    created_at: string;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    is_bot?: boolean;
}

export interface IpData {
    ip: string;
    ip_anonymized: string;
    country: string;
    state: string;
    city: string;
    isp: string;
    connection_type: string;
    is_vpn: boolean;
    is_proxy: boolean;
    is_bot: boolean;
}

export interface LeadSenseEvent {
    event: string;
    visitor_id: string;
    session_id: string;
    token: string;
    timestamp: number;
    url: string;
    path: string;
    properties: Record<string, unknown>;
}

export interface Layer {
    id: string;
    type: 'hero_image' | 'heading' | 'text' | 'button' | 'avatar_image' | 'input_field';
    label: string;
    props: Record<string, any>;
}

export interface TriggerConfig {
    type: 'exit_intent' | 'time_on_page' | 'scroll_depth' | 'inactivity';
    value?: number;
    frequency: 'session' | 'visitor' | 'always' | 'daily';
    delay?: number;
    targetAudience: {
        device: 'all' | 'desktop' | 'mobile';
        visitorType: 'all' | 'new' | 'returning';
    };
    urlRules: Array<{
        id: string;
        condition: 'contains' | 'equals' | 'starts_with';
        value: string;
    }>;
}

export interface ActionsConfig {
    type: 'whatsapp' | 'redirect' | 'webhook' | 'success_message' | 'close';
    whatsapp?: { number: string; message: string };
    redirect?: {
        url: string;
        openInNewTab: boolean;
        utms?: {
            source: string;
            medium: string;
            campaign: string;
            term?: string;
            content?: string;
        }
    };
    webhook?: { url: string; method: string };
    successMessage?: { text: string; autoCloseDuration: number };
}

export interface Popup {
    id: string;
    name: string;
    status: string;
    type: 'modal' | 'slide-in' | 'top-bar' | 'toast';
    trigger_config: TriggerConfig;
    actions_config: ActionsConfig;
    layers: Layer[];
}

export interface RemoteConfig {
    popups: Popup[];
}

export interface LeadSenseSDK {
    _token: string;
    _queue: unknown[];
    _ready: boolean;
    track: (event: string, props?: Record<string, unknown>) => void;
    identify: (data: Record<string, unknown>) => void;
    showPopup: (id: string) => void;
    isIdentified: () => boolean;
    getProfile: () => LeadProfile | null;
    optOut: () => void;
    optIn: () => void;
    onIdentify: (cb: (lead: LeadProfile['lead']) => void) => void;
}
