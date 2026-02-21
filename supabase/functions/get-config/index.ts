import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, handleCors } from "../shared/cors.ts"

serve(async (req) => {
    const corsResponse = handleCors(req)
    if (corsResponse) return corsResponse

    try {
        const url = new URL(req.url)
        const token = url.searchParams.get('token')

        if (!token) {
            return new Response(JSON.stringify({ error: 'Token is required' }), {
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
            .select('id')
            .eq('id', token)
            .single()

        if (siteError || !site) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        // Fetch active popups for this site
        const { data: popups, error } = await supabase
            .from('popups')
            .select('id, name, status, type, trigger_config, actions_config, layers')
            .eq('site_id', site.id)
            .in('status', ['Active', 'active'])

        if (error) throw error

        return new Response(JSON.stringify({ popups: popups || [] }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // 5 min cache
            },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
