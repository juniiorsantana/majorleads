import { supabase } from './supabase';

export interface Site {
    id: string;
    user_id: string;
    domain: string | null;
    name: string | null;
}

export const getAllSites = async (userId: string): Promise<Site[]> => {
    try {
        const { data, error } = await supabase
            .from('sites')
            .select('id, user_id, domain, name')
            .eq('user_id', userId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching sites:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Exception in getAllSites:', err);
        return [];
    }
};

export const getOrCreateDefaultSite = async (userId: string): Promise<Site | null> => {
    try {
        // 1. Try to find an existing site
        const { data: sites, error } = await supabase
            .from('sites')
            .select('*')
            .eq('user_id', userId)
            .limit(1);

        if (error) {
            console.error('Error fetching sites:', error);
            return null;
        }

        if (sites && sites.length > 0) {
            return sites[0];
        }

        // 2. If no site exists, create one
        const { data: newSite, error: createError } = await supabase
            .from('sites')
            .insert([
                {
                    user_id: userId,
                    name: 'Meu Site',
                    domain: 'meusite.com.br' // Default domain
                }
            ])
            .select()
            .single();

        if (createError) {
            console.error('Error creating default site:', createError);
            return null;
        }

        return newSite;
    } catch (err) {
        console.error('Exception in getOrCreateDefaultSite:', err);
        return null;
    }
};
