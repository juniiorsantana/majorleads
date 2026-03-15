Implement the popup_stats daily aggregation table (Option 2).

## Goal
Replace the broken events-table queries in the analytics pages with a clean,
fast popup_stats table that stores pre-aggregated daily counters per popup.

---

## Step 1 — Supabase migration

Run this SQL in the Supabase SQL editor:

CREATE TABLE IF NOT EXISTS popup_stats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id    uuid NOT NULL REFERENCES popups(id) ON DELETE CASCADE,
  site_id     uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date        date NOT NULL,
  views       integer NOT NULL DEFAULT 0,
  clicks      integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  UNIQUE (popup_id, date)
);

CREATE INDEX IF NOT EXISTS idx_popup_stats_site_date ON popup_stats(site_id, date);
CREATE INDEX IF NOT EXISTS idx_popup_stats_popup_date ON popup_stats(popup_id, date);

ALTER TABLE popup_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own popup stats"
  ON popup_stats FOR SELECT
  USING (
    site_id IN (
      SELECT id FROM sites WHERE user_id = auth.uid()
    )
  );

---

## Step 2 — Update the track-events Edge Function

File: supabase/functions/track-events/index.ts

Inside the event processing loop, after saving to the events table, add logic
to upsert into popup_stats for popup-related events.

The tracker already sends these events with popup_id in properties:
  - popup_shown      → increment views
  - popup_clicked    → increment clicks  
  - popup_converted  → increment conversions

Add this upsert logic after the existing event insert:

for (const event of events) {
  // existing events insert (keep as-is)

  // NEW: aggregate popup stats
  const popupId = event.properties?.popup_id;
  if (popupId && ['popup_shown', 'popup_clicked', 'popup_converted'].includes(event.event)) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // resolve site_id from token (already available in this function)
    const col =
      event.event === 'popup_shown'     ? 'views' :
      event.event === 'popup_clicked'   ? 'clicks' :
      'conversions';

    await supabaseAdmin
      .from('popup_stats')
      .upsert(
        { popup_id: popupId, site_id: siteId, date: today, [col]: 1 },
        {
          onConflict: 'popup_id,date',
          ignoreDuplicates: false,
        }
      )
      .then(() => {}) // fire-and-forget, don't block response
      
    // Use raw SQL increment to avoid race conditions:
    await supabaseAdmin.rpc('increment_popup_stat', {
      p_popup_id: popupId,
      p_site_id: siteId,
      p_date: today,
      p_col: col,
    });
  }
}

Also create this Postgres function in Supabase SQL editor (needed for atomic increment):

CREATE OR REPLACE FUNCTION increment_popup_stat(
  p_popup_id uuid,
  p_site_id  uuid,
  p_date     date,
  p_col      text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO popup_stats (popup_id, site_id, date, views, clicks, conversions)
  VALUES (
    p_popup_id, p_site_id, p_date,
    CASE WHEN p_col = 'views'       THEN 1 ELSE 0 END,
    CASE WHEN p_col = 'clicks'      THEN 1 ELSE 0 END,
    CASE WHEN p_col = 'conversions' THEN 1 ELSE 0 END
  )
  ON CONFLICT (popup_id, date) DO UPDATE SET
    views       = popup_stats.views       + CASE WHEN p_col = 'views'       THEN 1 ELSE 0 END,
    clicks      = popup_stats.clicks      + CASE WHEN p_col = 'clicks'      THEN 1 ELSE 0 END,
    conversions = popup_stats.conversions + CASE WHEN p_col = 'conversions' THEN 1 ELSE 0 END;
END;
$$;

---

## Step 3 — Update frontend pages to read from popup_stats

### PopupsReportTab.tsx and PopupReport.tsx

Replace the broken events table queries entirely. Use popup_stats instead.

Pattern for fetching stats with date range:

  const { data: stats } = await supabase
    .from('popup_stats')
    .select('popup_id, date, views, clicks, conversions')
    .in('site_id', siteIds)
    .gte('date', startDate.toISOString().slice(0, 10))
    .order('date', { ascending: true });

To compute totals per popup, group by popup_id in JS:
  const totalsMap: Record<string, { views: number, clicks: number, conversions: number }> = {};
  for (const row of stats ?? []) {
    if (!totalsMap[row.popup_id]) totalsMap[row.popup_id] = { views: 0, clicks: 0, conversions: 0 };
    totalsMap[row.popup_id].views       += row.views;
    totalsMap[row.popup_id].clicks      += row.clicks;
    totalsMap[row.popup_id].conversions += row.conversions;
  }

To build the time-series chart, group by date:
  const chartMap: Record<string, { views: number, convs: number }> = {};
  for (const row of stats ?? []) {
    if (!chartMap[row.date]) chartMap[row.date] = { views: 0, convs: 0 };
    chartMap[row.date].views += row.views;
    chartMap[row.date].convs += row.conversions;
  }

CTR formula: (clicks / views * 100).toFixed(1) + '%'  — guard: views > 0 ? ... : '0%'
Conv formula: (conversions / views * 100).toFixed(1) + '%'

### Popups.tsx (cards with Views/CTR/Conversão per popup)

Same query — join popup_stats into the popup list to show per-card metrics.

  const { data: statsRows } = await supabase
    .from('popup_stats')
    .select('popup_id, views, clicks, conversions')
    .in('popup_id', popupIds);  // popupIds = ids of loaded popups

  const statsMap = Object.fromEntries(
    (statsRows ?? []).reduce((acc, row) => {
      if (!acc[row.popup_id]) acc[row.popup_id] = { views: 0, clicks: 0, conversions: 0 };
      acc[row.popup_id].views       += row.views;
      acc[row.popup_id].clicks      += row.clicks;
      acc[row.popup_id].conversions += row.conversions;
      return acc;
    }, {} as Record<string, any>)
  );

---

## Rules
- Do NOT remove or change the existing events table inserts in track-events
- Do NOT touch tracker.js — it already fires the right events
- The .single() → .in() fix still applies to any site query in these files
- Keep existing UI layout exactly as-is — only replace the data source