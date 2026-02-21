import { IpData } from '../core/types';

// URL base for Supabase Edge Functions. Since we don't have the exact supabase URL on the client,
// the tracker usually relies on the domain where the tracker was loaded from, or a predefined constant.
// We'll construct the URL securely based on the same origin or configuration.

// According to SPEC, the endpoint is GET https://<SUPABASE_ID>.supabase.co/functions/v1/enrich-ip
// Since the tracker might not know the `<SUPABASE_ID>`, in a production environment this is either
// injected during build time or the endpoint is proxied through the CDN.
// Based on init.ts, it seems there's a convention. Let's look at config.ts.

const ENRICH_IP_ENDPOINT = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1/enrich-ip';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheHF1bWVwamZiZmF4a2xla3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTM1MDIsImV4cCI6MjA4NzA4OTUwMn0.GxpK2m9OGYxGOZZOLDOT6DIqoyGSHRRVqPjnGxQTRm4';

/**
 * Fetches IP enrichment data from the LeadSense backend
 * @param token Custom API token for authentication
 * @returns Parsed IP Data or null if request fails
 */
export async function fetchIpEnrichment(token: string): Promise<IpData | null> {
    try {
        const response = await fetch(ENRICH_IP_ENDPOINT, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'X-LS-Token': token,
            },
        });

        if (!response.ok) {
            console.warn('[LeadSense] Failed to fetch IP enrichment data', response.status);
            return null;
        }

        const data: IpData = await response.json();
        return data;
    } catch (error) {
        console.warn('[LeadSense] Error fetching IP enrichment data', error);
        return null;
    }
}
