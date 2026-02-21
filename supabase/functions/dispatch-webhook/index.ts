import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

serve(async (req) => {
    try {
        const { webhookUrl, secret, payload } = await req.json()

        if (!webhookUrl || !payload) {
            return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 })
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'MajorLeads-Webhook/1.0',
        };

        if (secret) {
            // Generate HMAC SHA256 signature
            const encoder = new TextEncoder()
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(secret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            )

            const signatureBuffer = await crypto.subtle.sign(
                'HMAC',
                key,
                encoder.encode(JSON.stringify(payload))
            )

            // Convert buffer to hex string
            const signatureArray = Array.from(new Uint8Array(signatureBuffer))
            const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

            headers['x-majorleads-signature'] = signatureHex
        }

        console.log(`Dispatching webhook to ${webhookUrl}...`)

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            // Timeout after 10 seconds to prevent hanging
            signal: AbortSignal.timeout(10000)
        })

        const responseText = await response.text()
        console.log(`Webhook response (${response.status}):`, responseText.substring(0, 100))

        if (!response.ok) {
            throw new Error(`Endpoint responded with status ${response.status}`)
        }

        return new Response(
            JSON.stringify({ success: true, status: response.status }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
        )
    } catch (error: any) {
        console.error("Webhook dispatch error:", error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { "Content-Type": "application/json" }, status: 500 }
        )
    }
})
