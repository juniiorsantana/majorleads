'use strict';

import { LeadProfile } from './types';

const COOKIE_VID = '_ls_vid';
const COOKIE_SID = '_ls_sid';
const LS_VID_KEY = 'leadsense_vid';
const LS_SID_KEY = 'leadsense_sid';
const LS_PROFILE_KEY = 'leadsense_profile';

// ─── UUID v4 (sem dependências externas) ─────────────────────────
function uuidv4(): string {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    buf[6] = (buf[6] & 0x0f) | 0x40;
    buf[8] = (buf[8] & 0x3f) | 0x80;

    const hex = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ─── Cookies ─────────────────────────────────────────────────────
function setCookie(name: string, value: string, days: number): void {
    const expires = days > 0
        ? `; expires=${new Date(Date.now() + days * 86400000).toUTCString()}`
        : '';
    document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

// ─── localStorage (com fallback seguro) ─────────────────────────
function setStorage(key: string, value: string): void {
    try { localStorage.setItem(key, value); } catch (_) { /* sem suporte */ }
}

function getStorage(key: string): string | null {
    try { return localStorage.getItem(key); } catch (_) { return null; }
}

// ─── Visitor ID ──────────────────────────────────────────────────
function getOrCreateVisitorId(): string {
    const fromCookie = getCookie(COOKIE_VID);
    if (fromCookie) return fromCookie;

    const fromLS = getStorage(LS_VID_KEY);
    if (fromLS) {
        setCookie(COOKIE_VID, fromLS, 365);
        return fromLS;
    }

    const newId = uuidv4();
    setCookie(COOKIE_VID, newId, 365);
    setStorage(LS_VID_KEY, newId);
    return newId;
}

// ─── Session ID ──────────────────────────────────────────────────
function getOrCreateSessionId(): string {
    const fromCookie = getCookie(COOKIE_SID);
    if (fromCookie) return fromCookie;

    const fromLS = getStorage(LS_SID_KEY);
    if (fromLS) {
        setCookie(COOKIE_SID, fromLS, 0); // session cookie
        return fromLS;
    }

    const newId = uuidv4();
    setCookie(COOKIE_SID, newId, 0); // session cookie
    setStorage(LS_SID_KEY, newId);
    return newId;
}

// ─── Profile ─────────────────────────────────────────────────────
export function loadProfile(visitorId: string, sessionId: string): LeadProfile {
    const raw = getStorage(LS_PROFILE_KEY);
    if (raw) {
        try {
            const existing: LeadProfile = JSON.parse(raw);
            // Atualiza last_seen e session quando o session_id mudou
            if (existing.session_id !== sessionId) {
                existing.session_id = sessionId;
                existing.session_count += 1;
                existing.is_returning = true;
                existing.last_seen = new Date().toISOString();
                saveProfile(existing);
            }
            return existing;
        } catch (_) { /* JSON inválido, recria */ }
    }

    const profile: LeadProfile = {
        visitor_id: visitorId,
        session_id: sessionId,
        is_returning: false,
        session_count: 1,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        identified: false,
        lead: { name: null, email: null, whatsapp: null },
    };
    saveProfile(profile);
    return profile;
}

export function saveProfile(profile: LeadProfile): void {
    setStorage(LS_PROFILE_KEY, JSON.stringify(profile));
}

export function isOptedOut(): boolean {
    return getCookie('_ls_optout') === '1' || getStorage('_ls_optout') === '1';
}

export function setOptOut(): void {
    setCookie('_ls_optout', '1', 365 * 10);
    setStorage('_ls_optout', '1');
}

export function clearOptOut(): void {
    setCookie('_ls_optout', '', -1);
    try { localStorage.removeItem('_ls_optout'); } catch (_) { /* noop */ }
}

// ─── Entry Point ─────────────────────────────────────────────────
export function initIdentity(): { visitorId: string; sessionId: string; profile: LeadProfile } {
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const profile = loadProfile(visitorId, sessionId);
    return { visitorId, sessionId, profile };
}
