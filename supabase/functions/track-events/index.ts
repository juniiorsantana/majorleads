import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, handleCors } from "../shared/cors.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

// Define the expected event schema
const EventSchema = z.object({
    event: z.string().max(100).regex(/^[a-zA-Z0-9_]+$/),
    visitor_id: z.string().uuid(),
    session_id: z.string().uuid(),
    timestamp: z.number().refine(ts => {
        const now = Date.now();
        return Math.abs(now - ts) <= 300000; // ± 5 minutes
    }, "Timestamp must be within 5 minutes of current time"),
    url: z.string().url().max(2000).optional().or(z.literal('')),
    path: z.string().max(2000).optional(),
    properties: z.record(z.unknown()).optional().superRefine((val, ctx) => {
        if (!val) return;

        const getDepth = (obj: any): number => {
            if (obj === null || typeof obj !== 'object') return 0;
            let depth = 0;
            for (const key in obj) {
                depth = Math.max(depth, getDepth(obj[key]));
            }
            return 1 + depth;
        };

        if (getDepth(val) > 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Properties depth max 3" });
        }

        const checkStrings = (obj: any): boolean => {
            if (typeof obj === 'string' && obj.length > 500) return false;
            if (obj !== null && typeof obj === 'object') {
                for (const key in obj) {
                    if (!checkStrings(obj[key])) return false;
                }
            }
            return true;
        };

        if (!checkStrings(val)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "String values max 500 chars" });
        }
    })
});

serve(async (req) => {
    try {
        const corsResponse = handleCors(req)
        if (corsResponse) return corsResponse

        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Rate Limiting por IP (200 req/minuto)
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (clientIp !== 'unknown') {
            const { data: rlData } = await supabase
                .from('rate_limits')
                .select('count, window_start')
                .eq('ip', clientIp)
                .single();

            const now = new Date();
            if (rlData) {
                const windowStart = new Date(rlData.window_start);
                const diffMs = now.getTime() - windowStart.getTime();
                if (diffMs > 60000) {
                    // Reset window
                    await supabase.from('rate_limits').update({ count: 1, window_start: now.toISOString() }).eq('ip', clientIp);
                } else if (rlData.count >= 200) {
                    return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
                        status: 429,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
                    });
                } else {
                    // Increment
                    await supabase.from('rate_limits').update({ count: rlData.count + 1 }).eq('ip', clientIp);
                }
            } else {
                await supabase.from('rate_limits').insert({ ip: clientIp, count: 1, window_start: now.toISOString() });
            }
        }

        // Parse Payload
        let raw: string;
        try {
            raw = await req.text()
            if (!raw) {
                return new Response(JSON.stringify({ error: 'Empty request body' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                })
            }
        } catch (error: any) {
            return new Response(JSON.stringify({ error: 'Failed to read request body' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        let payload: { events?: any[]; token?: string }
        try {
            payload = JSON.parse(raw)
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        if (!payload || typeof payload !== 'object') {
            return new Response(JSON.stringify({ error: 'Payload must be a JSON object' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const { events } = payload

        if (!Array.isArray(events) || events.length === 0) {
            return new Response(JSON.stringify({ error: 'No events in payload' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Token: try payload root first, then fallback to events[0].token
        const token = payload.token || events[0]?.token
        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 2. Proteção contra site_id forjado (resolve pelo token EXCLUSIVAMENTE)
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('id, domain')
            .eq('id', token)
            .single()

        if (siteError || !site) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        // Validação de Origin (Ignorando requisições sem origin, focando no CORS browser base)
        const origin = req.headers.get('Origin');
        if (origin && site.domain) {
            try {
                const originHost = new URL(origin).hostname;
                const siteDomain = site.domain;
                if (originHost !== siteDomain && !originHost.endsWith('.' + siteDomain) && originHost !== 'localhost' && originHost !== '127.0.0.1') {
                    console.warn(`[Origin Mismatch] Origin: ${originHost}, Expected: ${siteDomain}`)
                    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    })
                }
            } catch (e) {
                // Invalid origin format
                return new Response(JSON.stringify({ error: 'Invalid Origin header' }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        }

        // 3. Validação de schema (Descarte de eventos inválidos isoladamente)
        const validRows: any[] = [];
        const invalidEvents: any[] = [];
        for (const evt of events) {
            // Se vier com site_id hackeado no array, será ignorado/sobrescrito.
            const validation = EventSchema.safeParse(evt);
            if (validation.success) {
                validRows.push({
                    session_id: evt.session_id,
                    visitor_id: evt.visitor_id,
                    site_id: site.id, // ID FORCADO RECOGNIZED BY TOKEN
                    event: evt.event,
                    url: evt.url || null,
                    path: evt.path || null,
                    properties: evt.properties || {},
                    timestamp: evt.timestamp,
                });
            } else {
                invalidEvents.push({ event: evt, issues: validation.error.issues })
                console.warn('[Validation Error] Discarding invalid event:', validation.error.issues);
            }
        }

        if (validRows.length === 0) {
            return new Response(JSON.stringify({ error: "All events failed validation", invalidEvents }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const { error: insertError } = await supabase
            .from('events')
            .insert(validRows)

        if (insertError) {
            console.error("[PostgREST Insert Error]:", JSON.stringify(insertError, null, 2))
            throw new Error(`Database error: ${insertError.message || JSON.stringify(insertError)}`)
        }

        // 4. Webhook Dispatch
        try {
            const { data: webhooks } = await supabase
                .from('webhooks')
                .select('url, secret, events')
                .eq('site_id', site.id)
                .eq('is_active', true)

            if (webhooks && webhooks.length > 0) {
                for (const row of validRows) {
                    for (const wh of webhooks) {
                        const whEvents: string[] = wh.events || [];
                        if (whEvents.includes(row.event)) {
                            // Fire and forget to not block the tracking response
                            supabase.functions.invoke('dispatch-webhook', {
                                body: { webhookUrl: wh.url, secret: wh.secret, payload: row }
                            }).catch(err => console.error("Error invoking dispatch-webhook", err));
                        }
                    }
                }
            }
        } catch (webhookError) {
            console.error("Error processing webhooks", webhookError)
        }

        return new Response(JSON.stringify({ success: true, count: validRows.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error("Stack error", error)
        return new Response(JSON.stringify({ error: "exception", message: error?.message || "Unknown error" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
