(function () {
    'use strict';

    const COOKIE_VID = '_ls_vid';
    const COOKIE_SID = '_ls_sid';
    const LS_VID_KEY = 'leadsense_vid';
    const LS_SID_KEY = 'leadsense_sid';
    const LS_PROFILE_KEY = 'leadsense_profile';
    function uuidv4() {
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf);
        buf[6] = (buf[6] & 0x0f) | 0x40;
        buf[8] = (buf[8] & 0x3f) | 0x80;
        const hex = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    function setCookie(name, value, days) {
        const expires = days > 0
            ? `; expires=${new Date(Date.now() + days * 86400000).toUTCString()}`
            : '';
        document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
    }
    function getCookie(name) {
        const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
        return match ? decodeURIComponent(match[1]) : null;
    }
    function setStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch (_) { }
    }
    function getStorage(key) {
        try {
            return localStorage.getItem(key);
        }
        catch (_) {
            return null;
        }
    }
    function getOrCreateVisitorId() {
        const fromCookie = getCookie(COOKIE_VID);
        if (fromCookie)
            return fromCookie;
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
    function getOrCreateSessionId() {
        const fromCookie = getCookie(COOKIE_SID);
        if (fromCookie)
            return fromCookie;
        const fromLS = getStorage(LS_SID_KEY);
        if (fromLS) {
            setCookie(COOKIE_SID, fromLS, 0);
            return fromLS;
        }
        const newId = uuidv4();
        setCookie(COOKIE_SID, newId, 0);
        setStorage(LS_SID_KEY, newId);
        return newId;
    }
    function loadProfile(visitorId, sessionId) {
        const raw = getStorage(LS_PROFILE_KEY);
        if (raw) {
            try {
                const existing = JSON.parse(raw);
                if (existing.session_id !== sessionId) {
                    existing.session_id = sessionId;
                    existing.session_count += 1;
                    existing.is_returning = true;
                    existing.last_seen = new Date().toISOString();
                    saveProfile(existing);
                }
                return existing;
            }
            catch (_) { }
        }
        const profile = {
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
    function saveProfile(profile) {
        setStorage(LS_PROFILE_KEY, JSON.stringify(profile));
    }
    function isOptedOut() {
        return getCookie('_ls_optout') === '1' || getStorage('_ls_optout') === '1';
    }
    function setOptOut() {
        setCookie('_ls_optout', '1', 365 * 10);
        setStorage('_ls_optout', '1');
    }
    function clearOptOut() {
        setCookie('_ls_optout', '', -1);
        try {
            localStorage.removeItem('_ls_optout');
        }
        catch (_) { }
    }
    function initIdentity() {
        const visitorId = getOrCreateVisitorId();
        const sessionId = getOrCreateSessionId();
        const profile = loadProfile(visitorId, sessionId);
        return { visitorId, sessionId, profile };
    }

    function parseUA() {
        const ua = navigator.userAgent;
        let os = 'Unknown';
        if (/Windows/.test(ua))
            os = 'Windows';
        else if (/Mac OS X/.test(ua))
            os = 'macOS';
        else if (/Android/.test(ua))
            os = 'Android';
        else if (/iPhone|iPad/.test(ua))
            os = 'iOS';
        else if (/Linux/.test(ua))
            os = 'Linux';
        let browser = 'Unknown';
        if (/Edg\//.test(ua))
            browser = 'Edge';
        else if (/Chrome\//.test(ua))
            browser = 'Chrome';
        else if (/Firefox\//.test(ua))
            browser = 'Firefox';
        else if (/Safari\//.test(ua))
            browser = 'Safari';
        return { os, browser };
    }
    function getDeviceType() {
        if (/Mobi|Android/i.test(navigator.userAgent))
            return 'mobile';
        if (/Tablet|iPad/i.test(navigator.userAgent))
            return 'tablet';
        return 'desktop';
    }
    function getUTM(param) {
        return new URLSearchParams(location.search).get(param);
    }
    function getReferrerDomain() {
        try {
            return document.referrer ? new URL(document.referrer).hostname : '';
        }
        catch (_a) {
            return '';
        }
    }
    function collectSession() {
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

    const BASE_URL$1 = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1';
    const CACHE_KEY = '_ls_config';
    const CACHE_TTL_MS = 5 * 60 * 1000;
    let cachedConfig = null;
    function loadFromCache(token) {
        try {
            const raw = localStorage.getItem(`${CACHE_KEY}_${token}`);
            if (!raw)
                return null;
            const entry = JSON.parse(raw);
            if (Date.now() - entry.timestamp > CACHE_TTL_MS)
                return null;
            return entry.data;
        }
        catch (_a) {
            return null;
        }
    }
    function saveToCache(token, data) {
        try {
            const entry = { timestamp: Date.now(), data };
            localStorage.setItem(`${CACHE_KEY}_${token}`, JSON.stringify(entry));
        }
        catch (_a) { }
    }
    async function fetchConfig(token) {
        if (cachedConfig)
            return cachedConfig;
        const cached = loadFromCache(token);
        if (cached) {
            cachedConfig = cached;
            return cached;
        }
        try {
            const res = await fetch(`${BASE_URL$1}/get-config?token=${token}`, {
                headers: { 'X-LS-Token': token },
            });
            if (!res.ok)
                throw new Error(`Config fetch error: ${res.status}`);
            const data = await res.json();
            cachedConfig = data;
            saveToCache(token, data);
            return data;
        }
        catch (_a) {
            return { popups: [] };
        }
    }
    function invalidateConfig() {
        cachedConfig = null;
    }

    const BATCH_SIZE = 10;
    const FLUSH_INTERVAL_MS = 5000;
    const BASE_URL = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1';
    let queue = [];
    let flushTimer = null;
    function enqueue(event) {
        queue.push(event);
        if (queue.length >= BATCH_SIZE) {
            flush();
        }
        else if (!flushTimer) {
            flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
        }
    }
    function flush() {
        if (!queue.length)
            return;
        const batch = queue.splice(0, queue.length);
        clearTimer();
        if (navigator.sendBeacon) {
            const success = navigator.sendBeacon(`${BASE_URL}/track-events`, JSON.stringify({ events: batch }));
            if (success)
                return;
        }
        sendWithRetry(batch);
    }
    async function sendWithRetry(events, attempt = 0) {
        const MAX_ATTEMPTS = 3;
        const backoff = [1000, 2000, 4000];
        try {
            await fetch(`${BASE_URL}/track-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events }),
                keepalive: true,
            });
        }
        catch (_a) {
            if (attempt < MAX_ATTEMPTS - 1) {
                setTimeout(() => sendWithRetry(events, attempt + 1), backoff[attempt]);
            }
        }
    }
    function clearTimer() {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }
    }
    function setupBeforeUnloadFlush() {
        window.addEventListener('beforeunload', () => flush(), { once: true });
    }

    const ENRICH_IP_ENDPOINT = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1/enrich-ip';
    async function fetchIpEnrichment(token) {
        try {
            const response = await fetch(ENRICH_IP_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-LS-Token': token,
                },
            });
            if (!response.ok) {
                console.warn('[LeadSense] Failed to fetch IP enrichment data', response.status);
                return null;
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.warn('[LeadSense] Error fetching IP enrichment data', error);
            return null;
        }
    }

    const THRESHOLDS = [25, 50, 75, 90, 100];
    function initScrollCollector(track) {
        let maxScroll = 0;
        const fired = new Set();
        let ticking = false;
        function getScrollPercent() {
            const scrolled = window.scrollY;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            if (height <= 0)
                return 100;
            return Math.min(Math.round((scrolled / height) * 100), 100);
        }
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const pct = getScrollPercent();
                    if (pct > maxScroll)
                        maxScroll = pct;
                    for (const threshold of THRESHOLDS) {
                        if (pct >= threshold && !fired.has(threshold)) {
                            fired.add(threshold);
                            track('scroll_depth', { depth: threshold });
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        return {
            cleanup: () => window.removeEventListener('scroll', onScroll),
            getMaxScroll: () => maxScroll,
        };
    }

    function getSelector(el) {
        if (el.id)
            return `#${el.id}`;
        if (el.className && typeof el.className === 'string') {
            const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
            return `${el.tagName.toLowerCase()}.${cls}`;
        }
        return el.tagName.toLowerCase();
    }
    function getTextContent(el) {
        return (el.textContent || '').trim().slice(0, 100);
    }
    function initClickCollector(track) {
        function onDocumentClick(e) {
            const target = e.target.closest('a, button, [role="button"], input[type="submit"]');
            if (!target)
                return;
            const tag = target.tagName.toUpperCase();
            const href = tag === 'A' ? target.href : undefined;
            const text = getTextContent(target);
            const selector = getSelector(target);
            const classes = Array.from(target.classList).slice(0, 5);
            track('click', {
                tag,
                text,
                href: href || null,
                selector,
                classes,
            });
        }
        document.addEventListener('click', onDocumentClick, { capture: true, passive: true });
        return () => document.removeEventListener('click', onDocumentClick, { capture: true });
    }

    const TIME_THRESHOLDS = [15, 30, 60, 120, 300];
    const IDLE_THRESHOLD = 30000;
    function initTimeCollector(track) {
        const startTime = Date.now();
        const fired = new Set();
        let idleTimer = null;
        let idleFired = false;
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            for (const threshold of TIME_THRESHOLDS) {
                if (elapsed >= threshold && !fired.has(threshold)) {
                    fired.add(threshold);
                    track('time_on_page', { seconds: threshold });
                }
            }
        }, 5000);
        function resetIdle() {
            idleFired = false;
            if (idleTimer)
                clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (!idleFired) {
                    idleFired = true;
                    track('idle', { idle_seconds: 30 });
                }
            }, IDLE_THRESHOLD);
        }
        ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(evt => window.addEventListener(evt, resetIdle, { passive: true }));
        resetIdle();
        return {
            getElapsed: () => Math.floor((Date.now() - startTime) / 1000),
        };
    }

    const MIN_TIME_BEFORE_EXIT = 5;
    function initExitIntentCollector(track, getElapsed, evaluateTriggers) {
        let exitFired = false;
        document.addEventListener('mouseleave', (e) => {
            if (exitFired)
                return;
            if (e.clientY > 0)
                return;
            if (e.relatedTarget !== null)
                return;
            if (getElapsed() < MIN_TIME_BEFORE_EXIT)
                return;
            exitFired = true;
            track('exit_intent', {
                scroll_at_exit: getScrollPercent(),
                time_on_page: getElapsed(),
            });
            evaluateTriggers({ type: 'exit_intent' });
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                track('tab_hidden', { visible_for_seconds: getElapsed() });
                evaluateTriggers({ type: 'tab_hidden' });
            }
            else {
                track('tab_visible', {});
            }
        });
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const delta = lastScrollY - window.scrollY;
            if (delta > 80 && !exitFired) {
                evaluateTriggers({ type: 'scroll_up_fast' });
            }
            lastScrollY = window.scrollY;
        }, { passive: true });
        history.pushState({ _ls_sentinel: true }, '', location.href);
        window.addEventListener('popstate', (e) => {
            var _a;
            if ((_a = e.state) === null || _a === void 0 ? void 0 : _a._ls_sentinel) {
                track('back_button', { from_url: location.href });
                evaluateTriggers({ type: 'back_button' });
                history.pushState({ _ls_sentinel: true }, '', location.href);
            }
        });
    }
    function getScrollPercent() {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        if (h <= 0)
            return 100;
        return Math.min(Math.round((window.scrollY / h) * 100), 100);
    }

    const ALLOWED_MATCHERS = ['name', 'email', 'tel', 'phone', 'whatsapp', 'first', 'last', 'fname', 'lname'];
    const BLOCKED_MATCHERS = ['card', 'cvv', 'cc', 'cpf', 'ssn', 'pan'];
    const IGNORED_TYPES = new Set(['password', 'hidden', 'submit', 'button', 'file', 'image', 'reset']);
    function detectFieldType(input) {
        if (input.hasAttribute('data-ls-ignore') || IGNORED_TYPES.has(input.type))
            return null;
        const attrs = [
            input.name,
            input.id,
            input.autocomplete
        ].filter(Boolean).map(v => v.toLowerCase());
        for (const attr of attrs) {
            for (const block of BLOCKED_MATCHERS) {
                if (attr.includes(block))
                    return null;
            }
        }
        for (const attr of attrs) {
            for (const allowed of ALLOWED_MATCHERS) {
                if (attr.includes(allowed)) {
                    return allowed === 'email' ? 'email'
                        : (allowed === 'tel' || allowed === 'phone' || allowed === 'whatsapp') ? 'whatsapp'
                            : 'name';
                }
            }
        }
        return null;
    }
    function getFormId(form) {
        var _a;
        return form.id || form.getAttribute('name') || ((_a = form.action) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || 'unknown';
    }
    function attachFormListener(form, track) {
        if (form._lsAttached)
            return;
        form._lsAttached = true;
        const formId = getFormId(form);
        const capturedTypes = new Set();
        let started = false;
        form.addEventListener('focusin', (e) => {
            const input = e.target;
            if (IGNORED_TYPES.has(input.type) || input.hasAttribute('data-ls-ignore'))
                return;
            if (!detectFieldType(input))
                return;
            if (!started) {
                started = true;
                track('form_start', {
                    form_id: formId,
                    form_action: form.action,
                    field_name: input.name || input.id,
                });
            }
        });
        form.addEventListener('blur', (e) => {
            const input = e.target;
            if (IGNORED_TYPES.has(input.type) || input.hasAttribute('data-ls-ignore'))
                return;
            const fieldType = detectFieldType(input);
            if (!fieldType)
                return;
            track('form_field_blur', {
                form_id: formId,
                field_name: input.name || input.id,
                field_type: fieldType,
                has_value: !!input.value,
            });
            capturedTypes.add(fieldType);
        }, true);
        form.addEventListener('submit', () => {
            var _a;
            const leadData = {};
            form.querySelectorAll('input, select, textarea').forEach(input => {
                if (IGNORED_TYPES.has(input.type) || input.hasAttribute('data-ls-ignore') || !input.value)
                    return;
                const fieldType = detectFieldType(input);
                if (fieldType) {
                    capturedTypes.add(fieldType);
                    if (['name', 'email', 'whatsapp', 'company'].includes(fieldType)) {
                        leadData[fieldType] = input.value.trim();
                    }
                }
            });
            track('form_submit', {
                form_id: formId,
                form_action: form.action,
                captured_fields: Array.from(capturedTypes),
            });
            if (Object.keys(leadData).length > 0) {
                if (typeof window !== 'undefined' && ((_a = window.LeadSense) === null || _a === void 0 ? void 0 : _a.identify)) {
                    window.LeadSense.identify(leadData);
                }
            }
        });
    }
    function initFormCollector(track) {
        document.querySelectorAll('form').forEach(f => attachFormListener(f, track));
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node instanceof Element) {
                        node.querySelectorAll('form').forEach(f => attachFormListener(f, track));
                        if (node instanceof HTMLFormElement)
                            attachFormListener(node, track);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function initSpaCollector(track, onRouteChange) {
        let currentPath = location.pathname;
        function handleRouteChange(newUrl) {
            const newPath = new URL(newUrl, location.origin).pathname;
            if (newPath === currentPath)
                return;
            const from = currentPath;
            currentPath = newPath;
            track('spa_navigation', { from_path: from, to_path: newPath });
            track('page_view', { url: newUrl, title: document.title });
            onRouteChange();
        }
        const originalPush = history.pushState.bind(history);
        history.pushState = function (...args) {
            originalPush(...args);
            handleRouteChange(location.href);
        };
        const originalReplace = history.replaceState.bind(history);
        history.replaceState = function (...args) {
            originalReplace(...args);
            handleRouteChange(location.href);
        };
        window.addEventListener('popstate', () => {
            handleRouteChange(location.href);
        });
    }

    function evalTriggerType(config, ctx) {
        const { type, value } = config;
        const evtType = ctx.triggerType;
        switch (type) {
            case 'exit_intent':
                return evtType === 'exit_intent' || evtType === 'back_button' || evtType === 'tab_hidden';
            case 'time_on_page':
                return ctx.timeOnPage >= (value || 0);
            case 'scroll_depth':
                return ctx.scrollDepth >= (value || 0);
            case 'inactivity':
                return evtType === 'idle';
            default:
                return false;
        }
    }
    function evalTargetAudience(config, ctx) {
        const { device, visitorType } = config.targetAudience;
        if (device !== 'all') {
            const isMobile = ctx.session.screen_width < 768;
            if (device === 'mobile' && !isMobile)
                return false;
            if (device === 'desktop' && isMobile)
                return false;
        }
        if (visitorType !== 'all') {
            const isReturning = ctx.profile.is_returning;
            if (visitorType === 'new' && isReturning)
                return false;
            if (visitorType === 'returning' && !isReturning)
                return false;
        }
        return true;
    }
    function evalUrlRules(config, ctx) {
        const { urlRules } = config;
        if (!urlRules || urlRules.length === 0)
            return true;
        const currentUrl = ctx.session.url || '';
        const currentPath = ctx.session.path || '';
        for (const rule of urlRules) {
            let matches = false;
            const target = rule.value.toLowerCase();
            const urlLower = currentUrl.toLowerCase();
            const pathLower = currentPath.toLowerCase();
            switch (rule.condition) {
                case 'equals':
                    matches = urlLower === target || pathLower === target || pathLower === `/${target}`;
                    break;
                case 'contains':
                    matches = urlLower.includes(target);
                    break;
                case 'starts_with':
                    matches = pathLower.startsWith(target.startsWith('/') ? target : `/${target}`);
                    break;
            }
            if (matches)
                return true;
        }
        return false;
    }
    function shouldShowPopup(popup, ctx) {
        const config = popup.trigger_config;
        if (!config)
            return false;
        if (!evalTriggerType(config, ctx))
            return false;
        if (!evalTargetAudience(config, ctx))
            return false;
        if (!evalUrlRules(config, ctx))
            return false;
        return true;
    }

    const PREFIX = '_ls_pop_';
    function storageKey(popupId) {
        return `${PREFIX}${popupId}`;
    }
    function loadRecord(popupId) {
        try {
            const raw = localStorage.getItem(storageKey(popupId));
            return raw ? JSON.parse(raw) : null;
        }
        catch (_a) {
            return null;
        }
    }
    function saveRecord(popupId, record) {
        try {
            localStorage.setItem(storageKey(popupId), JSON.stringify(record));
        }
        catch (_a) { }
    }
    function canShow(popupId, rule, sessionId) {
        if (rule === 'always')
            return true;
        const rec = loadRecord(popupId);
        if (!rec)
            return true;
        const now = Date.now();
        if (rule === 'session') {
            return rec.session_id !== sessionId;
        }
        if (rule === 'day') {
            return now - rec.last_shown > 86400000;
        }
        if (rule === 'week') {
            return now - rec.last_shown > 7 * 86400000;
        }
        return true;
    }
    function markShown(popupId, sessionId) {
        const existing = loadRecord(popupId);
        const record = {
            count: ((existing === null || existing === void 0 ? void 0 : existing.count) || 0) + 1,
            last_shown: Date.now(),
            session_id: sessionId,
        };
        saveRecord(popupId, record);
    }

    function executeActions(popup, track, profile) {
        var _a, _b, _c;
        const action = popup.actions_config;
        if (!action)
            return;
        switch (action.type) {
            case 'redirect':
                if ((_a = action.redirect) === null || _a === void 0 ? void 0 : _a.url) {
                    let finalUrl = action.redirect.url;
                    const utms = action.redirect.utms;
                    if (utms && (utms.source || utms.medium || utms.campaign)) {
                        const urlObj = new URL(finalUrl, window.location.origin);
                        if (utms.source)
                            urlObj.searchParams.set('utm_source', utms.source);
                        if (utms.medium)
                            urlObj.searchParams.set('utm_medium', utms.medium);
                        if (utms.campaign)
                            urlObj.searchParams.set('utm_campaign', utms.campaign);
                        if (utms.term)
                            urlObj.searchParams.set('utm_term', utms.term);
                        if (utms.content)
                            urlObj.searchParams.set('utm_content', utms.content);
                        finalUrl = urlObj.toString();
                    }
                    track('popup_redirect', { popup_id: popup.id, url: finalUrl });
                    if (action.redirect.openInNewTab) {
                        window.open(finalUrl, '_blank', 'noopener noreferrer');
                    }
                    else {
                        window.location.href = finalUrl;
                    }
                }
                break;
            case 'whatsapp': {
                if ((_b = action.whatsapp) === null || _b === void 0 ? void 0 : _b.number) {
                    const phone = action.whatsapp.number.replace(/\D/g, '');
                    let url = `https://wa.me/${phone}`;
                    if (action.whatsapp.message) {
                        url += `?text=${encodeURIComponent(action.whatsapp.message)}`;
                    }
                    track('popup_whatsapp', { popup_id: popup.id, phone });
                    window.open(url, '_blank', 'noopener noreferrer');
                }
                break;
            }
            case 'webhook':
                if ((_c = action.webhook) === null || _c === void 0 ? void 0 : _c.url) {
                    fetch(action.webhook.url, {
                        method: action.webhook.method || 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            popup_id: popup.id,
                            timestamp: Date.now(),
                            lead: (profile === null || profile === void 0 ? void 0 : profile.lead) || null,
                            visitor_id: (profile === null || profile === void 0 ? void 0 : profile.visitor_id) || null,
                            session_id: (profile === null || profile === void 0 ? void 0 : profile.session_id) || null
                        }),
                        keepalive: true,
                    }).catch(() => { });
                    track('popup_webhook', { popup_id: popup.id, url: action.webhook.url });
                }
                break;
            case 'success_message':
                track('popup_success', { popup_id: popup.id });
                break;
        }
    }

    const HOST_ID = '__ls_popup_host__';
    function interpolate(html, profile) {
        const lead = profile.lead;
        return html
            .replace(/\{\{\s*name\s*\}\}/gi, lead.name || '')
            .replace(/\{\{\s*email\s*\}\}/gi, lead.email || '')
            .replace(/\{\{\s*first_name\s*\}\}/gi, (lead.name || '').split(' ')[0])
            .replace(/\{\{\s*city\s*\}\}/gi, '')
            .replace(/\{\{\s*session_count\s*\}\}/gi, String(profile.session_count));
    }
    function getAnimationCSS(type) {
        const base = `
    @keyframes ls-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ls-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ls-slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ls-slide-right { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
  `;
        const anim = type === 'modal' ? 'ls-fade-in'
            : type === 'top-bar' ? 'ls-slide-down'
                : type === 'slide-in' ? 'ls-slide-right'
                    : 'ls-slide-up';
        return `${base}\n.__ls-popup-inner { animation: ${anim} 0.35s ease forwards; }`;
    }
    function toInlineStyle(props, isContainer = false) {
        const styleString = Object.entries(props)
            .filter(([k, v]) => v !== undefined && v !== '' && !['text', 'src', 'alt', 'placeholder', 'fieldType', 'name', 'required'].includes(k))
            .map(([k, v]) => {
            let cssKey = k.replace(/([A-Z])/g, "-$1").toLowerCase();
            let cssVal = v;
            if (typeof v === 'number' && !['opacity', 'zIndex', 'fontWeight', 'lineHeight'].includes(k)) {
                cssVal = `${v}px`;
            }
            return `${cssKey}: ${cssVal}`;
        })
            .join('; ');
        if (!isContainer)
            return styleString;
        return `${styleString}; max-width: 100%; word-break: break-word;`;
    }
    function generateLayerHTML(layer, profile) {
        const { type, props = {} } = layer;
        let html = '';
        switch (type) {
            case 'heading':
            case 'text': {
                const tag = type === 'heading' ? 'h2' : 'p';
                const text = interpolate(props.text || '', profile);
                const style = toInlineStyle(Object.assign(Object.assign({}, props), { marginBottom: 12 }), true);
                html = `<${tag} style="margin: 0; ${style}">${text}</${tag}>`;
                break;
            }
            case 'hero_image':
            case 'avatar_image': {
                const src = props.src || '';
                const alt = props.alt || '';
                const defaultAvatarStyle = type === 'avatar_image' ? { borderRadius: '50%', objectFit: 'cover', width: 64, height: 64 } : { maxWidth: '100%', objectFit: 'cover', borderRadius: 8 };
                const style = toInlineStyle(Object.assign(Object.assign(Object.assign({}, defaultAvatarStyle), props), { marginBottom: 16 }), true);
                html = `<img src="${src}" alt="${alt}" style="${style}" />`;
                break;
            }
            case 'button': {
                const text = interpolate(props.text || 'Submit', profile);
                const style = toInlineStyle(Object.assign({ padding: '12px 24px', border: 'none', cursor: 'pointer', width: '100%', fontWeight: 'bold', transition: 'opacity 0.2s' }, props));
                html = `<button data-ls-submit style="${style}">${text}</button>`;
                break;
            }
            case 'input_field': {
                const placeholder = interpolate(props.placeholder || '', profile);
                const fieldType = props.fieldType || 'text';
                const name = props.name || fieldType;
                const required = props.required ? 'required' : '';
                const style = toInlineStyle(Object.assign({ padding: '12px', border: '1px solid #e5e7eb', borderRadius: 6, width: '100%', marginBottom: 12, outline: 'none' }, props));
                html = `<input type="${fieldType}" name="${name}" placeholder="${placeholder}" ${required} style="${style}" />`;
                break;
            }
            default:
                console.warn('Unknown layer type:', type);
        }
        return html;
    }
    function buildWrapper(popup) {
        const { type } = popup;
        const baseOverlay = `position: fixed; inset: 0; z-index: 2147483640; display: flex; box-sizing: border-box;`;
        if (type === 'top-bar') {
            return `<div class="__ls-popup-overlay" style="${baseOverlay} align-items: flex-start; pointer-events: none; bottom: auto;">`;
        }
        if (type === 'toast' || type === 'slide-in') {
            return `<div class="__ls-popup-overlay" style="${baseOverlay} align-items: flex-end; justify-content: flex-end; padding: 20px; pointer-events: none;">`;
        }
        return `<div class="__ls-popup-overlay" style="${baseOverlay} align-items: center; justify-content: center; background: rgba(0,0,0,0.5); padding: 16px;" data-ls-close-overlay>`;
    }
    function getContainerStyle(type) {
        const base = `background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); padding: 24px; position: relative; pointer-events: auto; display: flex; flex-direction: column; width: 100%;`;
        if (type === 'top-bar')
            return `background: white; width: 100%; padding: 12px 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative; pointer-events: auto; display: flex; align-items: center; justify-content: center; gap: 16px;`;
        if (type === 'toast' || type === 'slide-in')
            return `${base} max-width: 360px;`;
        return `${base} max-width: 450px;`;
    }
    const CLOSE_BTN_HTML = `
<button data-ls-close style="
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; cursor: pointer;
  color: #71717a; font-size: 20px; line-height: 1;
  opacity: 0.7; padding: 4px;
" aria-label="Fechar">✕</button>
`;
    function renderPopup(popup, profile, track, onClose) {
        var _a, _b;
        closeActivePopup();
        const { type, layers = [] } = popup;
        const host = document.createElement('div');
        host.id = HOST_ID;
        document.body.appendChild(host);
        let shadow;
        try {
            shadow = host.attachShadow({ mode: 'open' });
        }
        catch (_c) {
            shadow = host;
        }
        const css = `
    ${getAnimationCSS(type)}
    .__ls-popup-inner * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    .__ls-popup-inner input::placeholder { color: #a1a1aa; }
    .__ls-popup-inner button:hover { opacity: 0.9; }
  `;
        const contentHtml = layers.map(layer => generateLayerHTML(layer, profile)).join('');
        const wrapper = buildWrapper(popup);
        const containerStyle = getContainerStyle(type);
        shadow.innerHTML = `
    <style>${css}</style>
    ${wrapper}
      <div class="__ls-popup-inner" style="${containerStyle}">
        ${type !== 'top-bar' ? CLOSE_BTN_HTML : ''}
        ${type === 'top-bar' ? `<div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1200px;">${contentHtml}${CLOSE_BTN_HTML.replace('absolute; top: 12px; right: 12px;', 'relative; top: 0; right: 0;')}</div>` : contentHtml}
      </div>
    </div>
  `;
        function scheduleClose() {
            track('popup_closed', { popup_id: popup.id });
            closeActivePopup();
            onClose();
        }
        (_a = shadow.querySelector('[data-ls-close]')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', scheduleClose);
        (_b = shadow.querySelector('[data-ls-close-overlay]')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', (e) => {
            if (e.target === e.currentTarget)
                scheduleClose();
        });
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                scheduleClose();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        shadow.querySelectorAll('[data-ls-action="submit"], [data-ls-submit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                var _a;
                e.preventDefault();
                const leadData = { popup_id: popup.id };
                let hasData = false;
                shadow.querySelectorAll('input, select, textarea').forEach(input => {
                    const name = input.name || input.id;
                    if (!name || input.type === 'submit' || input.type === 'button')
                        return;
                    const isEmail = name.toLowerCase().includes('email');
                    const isPhone = name.toLowerCase().includes('phone') || name.toLowerCase().includes('tel') || name.toLowerCase().includes('whatsapp');
                    const isName = name.toLowerCase().includes('name') || name.toLowerCase().includes('first') || name.toLowerCase().includes('last');
                    if (isEmail && input.value) {
                        leadData.email = input.value.trim();
                        hasData = true;
                    }
                    else if (isPhone && input.value) {
                        leadData.whatsapp = input.value.trim();
                        hasData = true;
                    }
                    else if (isName && input.value) {
                        leadData.name = input.value.trim();
                        hasData = true;
                    }
                    else if (input.value) {
                        leadData[name] = input.value.trim();
                    }
                });
                if (hasData && typeof window !== 'undefined' && ((_a = window.LeadSense) === null || _a === void 0 ? void 0 : _a.identify)) {
                    window.LeadSense.identify(leadData);
                }
                track('popup_cta_click', { popup_id: popup.id });
                track('popup_converted', { popup_id: popup.id });
                executeActions(popup, track, profile);
                scheduleClose();
            });
        });
        track('popup_shown', { popup_id: popup.id, popup_name: popup.name, type });
    }
    function closeActivePopup() {
        var _a;
        (_a = document.getElementById(HOST_ID)) === null || _a === void 0 ? void 0 : _a.remove();
    }

    let token = '';
    let profile = null;
    let sessionData = null;
    let onIdentifyCallback = null;
    let isDebug = false;
    let activePopups = [];
    let scrollDepth = 0;
    let getElapsedFn = () => 0;
    let popupLocked = false;
    function log(...args) {
        if (isDebug)
            console.log('[LeadSense]', ...args);
    }
    function safe(fn, context) {
        try {
            return fn();
        }
        catch (e) {
            log('Error in', context, e);
            return undefined;
        }
    }
    function track(event, props = {}) {
        if (isOptedOut() || !profile)
            return;
        const lsEvent = {
            event,
            visitor_id: profile.visitor_id,
            session_id: profile.session_id,
            token,
            timestamp: Date.now(),
            url: location.href,
            path: location.pathname,
            properties: props,
        };
        log('Track:', event, props);
        enqueue(lsEvent);
    }
    function evaluateTriggers(triggerEvent) {
        var _a;
        if (!profile || !sessionData || popupLocked)
            return;
        if (!activePopups.length)
            return;
        const ctx = {
            triggerType: triggerEvent.type,
            session: sessionData,
            profile,
            scrollDepth,
            timeOnPage: getElapsedFn(),
        };
        for (const popup of activePopups) {
            const freqRule = ((_a = popup.trigger_config) === null || _a === void 0 ? void 0 : _a.frequency) || 'session';
            if (!canShow(popup.id, freqRule, profile.session_id)) {
                log('Popup bloqueado por frequência:', popup.name);
                continue;
            }
            if (shouldShowPopup(popup, ctx)) {
                popupLocked = true;
                markShown(popup.id, profile.session_id);
                renderPopup(popup, profile, track, () => {
                    setTimeout(() => { popupLocked = false; }, 2000);
                });
                log('Popup exibido:', popup.name);
                break;
            }
        }
    }
    function identify(data) {
        if (!profile)
            return;
        profile.lead = {
            name: data.name || profile.lead.name,
            email: data.email || profile.lead.email,
            whatsapp: data.whatsapp || profile.lead.whatsapp,
        };
        profile.identified = true;
        saveProfile(profile);
        track('lead_identified', Object.assign({}, data));
        const payload = Object.assign({ token, visitor_id: profile.visitor_id, session_id: profile.session_id, lead: profile.lead }, data);
        fetch('https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1/identify-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch(err => log('Failed to identify-lead', err));
        onIdentifyCallback === null || onIdentifyCallback === void 0 ? void 0 : onIdentifyCallback(profile.lead);
    }
    function buildSDK() {
        var _a;
        const preQueue = (((_a = window.LeadSense) === null || _a === void 0 ? void 0 : _a._queue) || []);
        const sdk = {
            _token: token,
            _queue: [],
            _ready: false,
            track,
            identify,
            showPopup: (id) => {
                const popup = activePopups.find(p => p.id === id);
                if (popup && profile) {
                    renderPopup(popup, profile, track, () => { popupLocked = false; });
                }
            },
            isIdentified: () => { var _a; return (_a = profile === null || profile === void 0 ? void 0 : profile.identified) !== null && _a !== void 0 ? _a : false; },
            getProfile: () => profile,
            optOut: () => { setOptOut(); flush(); log('Opt-out ativado'); },
            optIn: () => { clearOptOut(); localStorage.setItem('_ls_optin', '1'); log('Opt-in ativado'); initIdentity(); },
            onIdentify: (cb) => { onIdentifyCallback = cb; },
        };
        preQueue.forEach(args => {
            if (Array.isArray(args)) {
                const [method, ...rest] = args;
                if (method === 'identify')
                    sdk.identify(rest[0]);
                else if (method === 'track')
                    sdk.track(rest[0], rest[1]);
            }
        });
        return sdk;
    }
    async function init() {
        var _a;
        const scriptEl = (document.currentScript || document.querySelector('script[src*="tracker.js"]'));
        token = (scriptEl === null || scriptEl === void 0 ? void 0 : scriptEl.getAttribute('data-token')) || ((_a = window.LeadSense) === null || _a === void 0 ? void 0 : _a._token) || '';
        if (!token) {
            console.warn('[LeadSense] Token não encontrado. Adicione data-token ao script.');
            return;
        }
        const privacyMode = (scriptEl === null || scriptEl === void 0 ? void 0 : scriptEl.getAttribute('data-privacy')) || 'standard';
        if (privacyMode === 'strict' && !isOptedOut() && localStorage.getItem('_ls_optin') !== '1') {
            log('Modo de privacidade Strict: Iniciando em opt-out. Aguardando LeadSense.optIn().');
            setOptOut();
        }
        if (isOptedOut()) {
            log('Opt-out ativo. Nenhum dado coletado.');
            return;
        }
        if (/bot|crawler|spider|prerender/i.test(navigator.userAgent)) {
            log('Bot — modo silencioso.');
            return;
        }
        isDebug = new URLSearchParams(location.search).has('ls_debug');
        log('Inicializando... Token:', token.slice(0, 8) + '...');
        const { profile: p } = initIdentity();
        profile = p;
        window.LeadSense = buildSDK();
        window.LeadSense._ready = true;
        safe(() => {
            const session = collectSession();
            sessionData = session;
            track('page_view', {
                title: session.title,
                referrer: session.referrer,
                utm_source: session.utm_source,
                utm_medium: session.utm_medium,
                utm_campaign: session.utm_campaign,
                device_type: session.device_type,
                os: session.os,
                browser: session.browser,
            });
            fetchIpEnrichment(token).then((ipData) => {
                if (ipData) {
                    if (sessionData) {
                        sessionData.country = ipData.country;
                        sessionData.state = ipData.state;
                        sessionData.city = ipData.city;
                        sessionData.is_bot = ipData.is_bot;
                    }
                    if (ipData.is_bot) {
                        log('Bot detectado via IP — desativando popups.');
                        activePopups = [];
                    }
                    else {
                        evaluateTriggers({ type: 'page_view' });
                    }
                }
                else {
                    evaluateTriggers({ type: 'page_view' });
                }
            });
        }, 'collectSession');
        let getMaxScrollFn = () => 0;
        safe(() => {
            const { cleanup, getMaxScroll } = initScrollCollector((evt, props) => {
                if (evt === 'scroll_depth')
                    scrollDepth = props.depth;
                track(evt, props);
                evaluateTriggers({ type: 'scroll_depth', depth: props.depth });
            });
            getMaxScrollFn = getMaxScroll;
            window.addEventListener('beforeunload', cleanup, { once: true });
        }, 'scroll');
        safe(() => initClickCollector(track), 'clicks');
        const { getElapsed } = initTimeCollector((evt, props) => {
            track(evt, props);
            if (evt === 'time_on_page')
                evaluateTriggers({ type: 'time_on_page', seconds: props.seconds });
            if (evt === 'idle')
                evaluateTriggers({ type: 'idle' });
        });
        getElapsedFn = getElapsed;
        safe(() => initFormCollector(track), 'forms');
        safe(() => initExitIntentCollector(track, getElapsed, evaluateTriggers), 'exit-intent');
        safe(() => initSpaCollector(track, () => {
            invalidateConfig();
            fetchConfig(token).then(cfg => {
                activePopups = cfg.popups.filter(p => p.status.toLowerCase() === 'active');
                sessionData = collectSession();
                evaluateTriggers({ type: 'page_view' });
            });
        }), 'spa');
        window.addEventListener('beforeunload', () => {
            track('page_leave', {
                time_on_page: getElapsedFn(),
                scroll_percentage: getMaxScrollFn(),
            });
        }, { once: true });
        setupBeforeUnloadFlush();
        safe(async () => {
            const cfg = await fetchConfig(token);
            activePopups = cfg.popups.filter(p => p.status.toLowerCase() === 'active');
            log('Config carregada:', activePopups.length, 'popups ativos');
        }, 'fetchConfig');
        log('✅ Tracker pronto. visitor_id:', profile.visitor_id);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => safe(() => init(), 'init'));
    }
    else {
        safe(() => init(), 'init');
    }

})();
