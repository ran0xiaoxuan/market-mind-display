-- Migration to backfill target_asset_name for existing strategies
-- This updates strategies that have a target_asset but no target_asset_name

-- Note: This migration creates a temporary function to lookup asset names
-- In a production environment, you would need to populate this with actual data
-- or use an external API to fetch the names

-- Create a temporary lookup function
CREATE OR REPLACE FUNCTION get_asset_name(symbol TEXT) RETURNS TEXT AS $$
BEGIN
  -- Common stock name mappings
  RETURN CASE 
    WHEN symbol = 'AAPL' THEN 'Apple Inc.'
    WHEN symbol = 'MSFT' THEN 'Microsoft Corporation'
    WHEN symbol = 'GOOGL' THEN 'Alphabet Inc.'
    WHEN symbol = 'AMZN' THEN 'Amazon.com Inc.'
    WHEN symbol = 'TSLA' THEN 'Tesla Inc.'
    WHEN symbol = 'META' THEN 'Meta Platforms Inc.'
    WHEN symbol = 'NVDA' THEN 'NVIDIA Corporation'
    WHEN symbol = 'JPM' THEN 'JPMorgan Chase & Co.'
    WHEN symbol = 'V' THEN 'Visa Inc.'
    WHEN symbol = 'WMT' THEN 'Walmart Inc.'
    WHEN symbol = 'JNJ' THEN 'Johnson & Johnson'
    WHEN symbol = 'PG' THEN 'Procter & Gamble Company'
    WHEN symbol = 'MA' THEN 'Mastercard Incorporated'
    WHEN symbol = 'HD' THEN 'The Home Depot Inc.'
    WHEN symbol = 'BAC' THEN 'Bank of America Corporation'
    WHEN symbol = 'DIS' THEN 'The Walt Disney Company'
    WHEN symbol = 'ADBE' THEN 'Adobe Inc.'
    WHEN symbol = 'NFLX' THEN 'Netflix Inc.'
    WHEN symbol = 'CSCO' THEN 'Cisco Systems Inc.'
    WHEN symbol = 'PFE' THEN 'Pfizer Inc.'
    WHEN symbol = 'INTC' THEN 'Intel Corporation'
    WHEN symbol = 'AMD' THEN 'Advanced Micro Devices Inc.'
    WHEN symbol = 'PYPL' THEN 'PayPal Holdings Inc.'
    WHEN symbol = 'T' THEN 'AT&T Inc.'
    WHEN symbol = 'VZ' THEN 'Verizon Communications Inc.'
    WHEN symbol = 'KO' THEN 'The Coca-Cola Company'
    WHEN symbol = 'PEP' THEN 'PepsiCo Inc.'
    WHEN symbol = 'MCD' THEN 'McDonald''s Corporation'
    WHEN symbol = 'BA' THEN 'The Boeing Company'
    WHEN symbol = 'GE' THEN 'General Electric Company'
    WHEN symbol = 'IBM' THEN 'International Business Machines Corporation'
    WHEN symbol = 'XOM' THEN 'Exxon Mobil Corporation'
    WHEN symbol = 'CVX' THEN 'Chevron Corporation'
    WHEN symbol = 'QCOM' THEN 'QUALCOMM Incorporated'
    WHEN symbol = 'SBUX' THEN 'Starbucks Corporation'
    WHEN symbol = 'NKE' THEN 'NIKE Inc.'
    WHEN symbol = 'CRM' THEN 'Salesforce Inc.'
    WHEN symbol = 'ORCL' THEN 'Oracle Corporation'
    WHEN symbol = 'TXN' THEN 'Texas Instruments Incorporated'
    WHEN symbol = 'AVGO' THEN 'Broadcom Inc.'
    WHEN symbol = 'TMO' THEN 'Thermo Fisher Scientific Inc.'
    WHEN symbol = 'COST' THEN 'Costco Wholesale Corporation'
    WHEN symbol = 'ABT' THEN 'Abbott Laboratories'
    WHEN symbol = 'DHR' THEN 'Danaher Corporation'
    WHEN symbol = 'UNH' THEN 'UnitedHealth Group Incorporated'
    WHEN symbol = 'LLY' THEN 'Eli Lilly and Company'
    WHEN symbol = 'MRK' THEN 'Merck & Co. Inc.'
    WHEN symbol = 'UPS' THEN 'United Parcel Service Inc.'
    WHEN symbol = 'NEE' THEN 'NextEra Energy Inc.'
    WHEN symbol = 'PM' THEN 'Philip Morris International Inc.'
    WHEN symbol = 'LOW' THEN 'Lowe''s Companies Inc.'
    WHEN symbol = 'HON' THEN 'Honeywell International Inc.'
    WHEN symbol = 'UNP' THEN 'Union Pacific Corporation'
    WHEN symbol = 'RTX' THEN 'RTX Corporation'
    WHEN symbol = 'SPGI' THEN 'S&P Global Inc.'
    WHEN symbol = 'BLK' THEN 'BlackRock Inc.'
    WHEN symbol = 'CAT' THEN 'Caterpillar Inc.'
    WHEN symbol = 'DE' THEN 'Deere & Company'
    WHEN symbol = 'INTU' THEN 'Intuit Inc.'
    WHEN symbol = 'AXP' THEN 'American Express Company'
    WHEN symbol = 'GS' THEN 'The Goldman Sachs Group Inc.'
    WHEN symbol = 'MS' THEN 'Morgan Stanley'
    WHEN symbol = 'C' THEN 'Citigroup Inc.'
    WHEN symbol = 'WFC' THEN 'Wells Fargo & Company'
    WHEN symbol = 'SCHW' THEN 'The Charles Schwab Corporation'
    WHEN symbol = 'BMY' THEN 'Bristol-Myers Squibb Company'
    WHEN symbol = 'GILD' THEN 'Gilead Sciences Inc.'
    WHEN symbol = 'AMGN' THEN 'Amgen Inc.'
    WHEN symbol = 'MDT' THEN 'Medtronic plc'
    WHEN symbol = 'CVS' THEN 'CVS Health Corporation'
    WHEN symbol = 'CI' THEN 'The Cigna Group'
    ELSE NULL -- Return NULL for unknown symbols
  END;
END;
$$ LANGUAGE plpgsql;

-- Update strategies that have target_asset but no target_asset_name
UPDATE public.strategies
SET target_asset_name = get_asset_name(target_asset)
WHERE target_asset IS NOT NULL 
  AND (target_asset_name IS NULL OR target_asset_name = '')
  AND get_asset_name(target_asset) IS NOT NULL;

-- Drop the temporary function
DROP FUNCTION IF EXISTS get_asset_name(TEXT);

-- Log the number of rows updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.strategies
  WHERE target_asset IS NOT NULL 
    AND target_asset_name IS NOT NULL;
  
  RAISE NOTICE 'Backfill complete. % strategies now have target_asset_name populated.', updated_count;
END $$;

