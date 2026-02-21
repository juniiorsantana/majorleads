'use strict';

import { RemoteConfig } from './types';

const BASE_URL = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1';
const CACHE_KEY = '_ls_config';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

let cachedConfig: RemoteConfig | null = null;

interface CachedConfigEntry {
    timestamp: number;
    data: RemoteConfig;
}

function loadFromCache(token: string): RemoteConfig | null {
    try {
        const raw = localStorage.getItem(`${CACHE_KEY}_${token}`);
        if (!raw) return null;
        const entry: CachedConfigEntry = JSON.parse(raw);
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
        return entry.data;
    } catch {
        return null;
    }
}

function saveToCache(token: string, data: RemoteConfig): void {
    try {
        const entry: CachedConfigEntry = { timestamp: Date.now(), data };
        localStorage.setItem(`${CACHE_KEY}_${token}`, JSON.stringify(entry));
    } catch { /* sem storage */ }
}

export async function fetchConfig(token: string): Promise<RemoteConfig> {
    // Retorna cache em memória se válido
    if (cachedConfig) return cachedConfig;

    // Tenta localStorage
    const cached = loadFromCache(token);
    if (cached) {
        cachedConfig = cached;
        return cached;
    }

    try {
        const res = await fetch(`${BASE_URL}/get-config?token=${token}`, {
            headers: { 'X-LS-Token': token },
        });
        if (!res.ok) throw new Error(`Config fetch error: ${res.status}`);
        const data: RemoteConfig = await res.json();
        cachedConfig = data;
        saveToCache(token, data);
        return data;
    } catch {
        // Se falhar, retorna config vazia (não bloqueia o visitante)
        return { popups: [] };
    }
}

export function getConfig(): RemoteConfig | null {
    return cachedConfig;
}

export function invalidateConfig(): void {
    cachedConfig = null;
}
