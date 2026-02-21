'use strict';

/**
 * popup/frequency.ts
 * Controla quantas vezes um popup foi exibido ao visitante.
 * Respeita regras: session | day | week | always
 */

const PREFIX = '_ls_pop_';

function storageKey(popupId: string): string {
    return `${PREFIX}${popupId}`;
}

interface FrequencyRecord {
    count: number;
    last_shown: number; // timestamp ms
    session_id: string;
}

function loadRecord(popupId: string): FrequencyRecord | null {
    try {
        const raw = localStorage.getItem(storageKey(popupId));
        return raw ? (JSON.parse(raw) as FrequencyRecord) : null;
    } catch { return null; }
}

function saveRecord(popupId: string, record: FrequencyRecord): void {
    try { localStorage.setItem(storageKey(popupId), JSON.stringify(record)); }
    catch { /* sem storage */ }
}

/** Retorna true se o popup PODE ser exibido agora */
export function canShow(
    popupId: string,
    rule: 'session' | 'day' | 'week' | 'always',
    sessionId: string
): boolean {
    if (rule === 'always') return true;

    const rec = loadRecord(popupId);
    if (!rec) return true;

    const now = Date.now();

    if (rule === 'session') {
        return rec.session_id !== sessionId;
    }

    if (rule === 'day') {
        return now - rec.last_shown > 86_400_000; // 24h
    }

    if (rule === 'week') {
        return now - rec.last_shown > 7 * 86_400_000; // 7 dias
    }

    return true;
}

export function markShown(popupId: string, sessionId: string): void {
    const existing = loadRecord(popupId);
    const record: FrequencyRecord = {
        count: (existing?.count || 0) + 1,
        last_shown: Date.now(),
        session_id: sessionId,
    };
    saveRecord(popupId, record);
}

export function getShowCount(popupId: string): number {
    return loadRecord(popupId)?.count || 0;
}
