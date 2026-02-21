'use strict';

import { SessionData } from './types';

function parseUA(): { os: string; browser: string } {
    const ua = navigator.userAgent;

    let os = 'Unknown';
    if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Linux/.test(ua)) os = 'Linux';

    let browser = 'Unknown';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/Chrome\//.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua)) browser = 'Safari';

    return { os, browser };
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (/Mobi|Android/i.test(navigator.userAgent)) return 'mobile';
    if (/Tablet|iPad/i.test(navigator.userAgent)) return 'tablet';
    return 'desktop';
}

function getUTM(param: string): string | null {
    return new URLSearchParams(location.search).get(param);
}

function getReferrerDomain(): string {
    try {
        return document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
        return '';
    }
}

export function collectSession(): SessionData {
    const { os, browser } = parseUA();

    return {
        utm_source: getUTM('utm_source'),
        utm_medium: getUTM('utm_medium'),
        utm_campaign: getUTM('utm_campaign'),
        utm_term: getUTM('utm_term'),
        utm_content: getUTM('utm_content'),
        referrer: document.referrer,
        referrer_domain: getReferrerDomain(),
        url: location.href,
        path: location.pathname,
        title: document.title,
        device_type: getDeviceType(),
        os,
        browser,
        screen_width: screen.width,
        screen_height: screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        created_at: new Date().toISOString(),
    };
}
