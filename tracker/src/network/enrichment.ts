import { IpData } from '../core/types';

// URL base for Supabase Edge Functions. Since we don't have the exact supabase URL on the client,
// the tracker usually relies on the domain where the tracker was loaded from, or a predefined constant.
// We'll construct the URL securely based on the same origin or configuration.

// According to SPEC, the endpoint is GET https://<SUPABASE_ID>.supabase.co/functions/v1/enrich-ip
// Since the tracker might not know the `<SUPABASE_ID>`, in a production environment this is either
// injected during build time or the endpoint is proxied through the CDN.
// Based on init.ts, it seems there's a convention. Let's look at config.ts.

const ENRICH_IP_ENDPOINT = 'https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1/enrich-ip';

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
                'Authorization': `Bearer ${token}`, // or X-LS-Token depending on backend spec
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
