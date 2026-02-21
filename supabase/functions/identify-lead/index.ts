import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, handleCors } from "../shared/cors.ts"

serve(async (req) => {
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    try {
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders })
        }

        const payload = await req.json()
        const { token, visitor_id, session_id, lead, popup_id } = payload

        if (!token || !visitor_id) {
            return new Response(JSON.stringify({ error: 'Missing token or visitor_id' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Validate token (site_id)
        const { data: site, error: siteError } = await supabase
            .from('sites')
            .select('id, webhook_url, webhook_active')
            .eq('id', token)
            .single()

        if (siteError || !site) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        // Extract IP for enrichment
        const ip =
            req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-real-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            null

        // Check if lead with this visitor_id already exists for this site
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('visitor_id', visitor_id)
            .eq('site_id', site.id)
            .maybeSingle()

        const leadData: Record<string, unknown> = {
            site_id: site.id,
            visitor_id,
            session_id: session_id || null,
            name: lead?.name || null,
            email: lead?.email || null,
            whatsapp: lead?.whatsapp || null,
            extra_data: lead?.custom || {},
            utm_source: payload.utm_source || null,
            utm_medium: payload.utm_medium || null,
            utm_campaign: payload.utm_campaign || null,
            device_type: payload.device_type || null,
            popup_id: popup_id || null,
        }

        let result
        if (existing) {
            // Update existing lead (only non-null fields)
            const updates: Record<string, unknown> = {}
            if (lead?.name) updates.name = lead.name
            if (lead?.email) updates.email = lead.email
            if (lead?.whatsapp) updates.whatsapp = lead.whatsapp
            if (lead?.custom) updates.extra_data = lead.custom

            const { data, error } = await supabase
                .from('leads')
                .update(updates)
                .eq('id', existing.id)
                .select()
                .single()

            if (error) throw error
            result = data
        } else {
            // Insert new lead
            const { data, error } = await supabase
                .from('leads')
                .insert(leadData)
                .select()
                .single()

            if (error) throw error
            result = data
        }

        // ─── WEBHOOK OUTBOUND ──────────────────────────────────────
        if (site.webhook_active && site.webhook_url) {
            const webhookPayload = {
                event: 'lead_identified',
                visitor_id,
                session_id,
                timestamp: new Date().toISOString(),
                lead: result,
                metadata: {
                    ip: ip || null,
                    popup_id: popup_id || null
                }
            }

            // Fire and forget so we don't block the response
            fetch(site.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            }).catch(err => {
                console.error("[Webhook Error] Failed to send webhook", err)
            })
        }
        // ───────────────────────────────────────────────────────────

        return new Response(JSON.stringify({ success: true, lead: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
