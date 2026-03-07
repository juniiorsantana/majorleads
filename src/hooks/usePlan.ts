import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getPlanLimits, PlanId, PlanLimits } from '../lib/plans';

export interface PlanUsage {
    sites: number;
    activePopups: number;
    leads: number;
}

export interface UsePlanReturn {
    plan: PlanId;
    limits: PlanLimits;
    usage: PlanUsage;
    canAddSite: boolean;
    canAddPopup: boolean;
    loading: boolean;
    refresh: () => void;
}

export function usePlan(): UsePlanReturn {
    const { user, profile } = useAuth();
    const [usage, setUsage] = useState<PlanUsage>({ sites: 0, activePopups: 0, leads: 0 });
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    const planId = (profile?.plan || 'starter') as PlanId;
    const limits = getPlanLimits(planId);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchUsage = async () => {
            setLoading(true);
            try {
                // Count user's sites
                const { count: sitesCount } = await supabase
                    .from('sites')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                // Count active popups across all user's sites
                const { data: userSites } = await supabase
                    .from('sites')
                    .select('id')
                    .eq('user_id', user.id);

                let activePopupsCount = 0;
                if (userSites && userSites.length > 0) {
                    const siteIds = userSites.map(s => s.id);
                    const { count } = await supabase
                        .from('popups')
                        .select('id', { count: 'exact', head: true })
                        .in('site_id', siteIds)
                        .eq('status', 'active');
                    activePopupsCount = count ?? 0;
                }

                // Count leads this month
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                let leadsCount = 0;
                if (userSites && userSites.length > 0) {
                    const siteIds = userSites.map(s => s.id);
                    const { count } = await supabase
                        .from('leads')
                        .select('id', { count: 'exact', head: true })
                        .in('site_id', siteIds)
                        .gte('created_at', startOfMonth.toISOString());
                    leadsCount = count ?? 0;
                }

                setUsage({
                    sites: sitesCount ?? 0,
                    activePopups: activePopupsCount,
                    leads: leadsCount,
                });
            } catch (err) {
                console.error('Error fetching plan usage:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, [user, tick]);

    return {
        plan: planId,
        limits,
        usage,
        canAddSite: usage.sites < limits.max_sites,
        canAddPopup: usage.activePopups < limits.max_active_popups,
        loading,
        refresh: () => setTick(t => t + 1),
    };
}
