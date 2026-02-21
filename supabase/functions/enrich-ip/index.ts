import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from "../shared/cors.ts"

serve(async (req) => {
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    try {
        // Extract IP from various headers (Cloudflare, proxy, Supabase Edge)
        const ip =
            req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-real-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            'unknown'

        // Country from Cloudflare header (available on edge)
        const country = req.headers.get('cf-ipcountry') || 'unknown'

        // Detect bots via User-Agent
        const ua = req.headers.get('user-agent') || ''
        const isBot = /bot|crawler|spider|prerender|headless|phantom/i.test(ua)

        // Anonymize IP (zero last two octets for IPv4)
        const parts = ip.split('.')
        const ipAnonymized = parts.length === 4
            ? `${parts[0]}.${parts[1]}.0.0`
            : ip

        const response = {
            ip,
            ip_anonymized: ipAnonymized,
            country,
            state: null,
            city: null,
            isp: null,
            connection_type: null,
            is_vpn: false,
            is_proxy: false,
            is_datacenter: false,
            is_bot: isBot,
        }

        return new Response(JSON.stringify(response), {
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
