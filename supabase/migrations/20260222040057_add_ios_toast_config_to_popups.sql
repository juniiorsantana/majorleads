/*
  # Add ios_toast_config to popups table

  1. Changes
    - Adds `ios_toast_config` column to `popups` table with jsonb type
    - Default value is a basic configuration to prevent null errors
*/

ALTER TABLE popups
ADD COLUMN IF NOT EXISTS ios_toast_config jsonb DEFAULT '{
  "messages": [],
  "intervalMs": 7000,
  "autoHideMs": 4500,
  "loopCount": 0
}'::jsonb;
