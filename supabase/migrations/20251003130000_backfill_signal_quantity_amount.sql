-- Migration to backfill quantity and amount for existing trading signals
-- This updates signals that have price data but no quantity/amount

-- Create a function to calculate position size based on risk tolerance
CREATE OR REPLACE FUNCTION calculate_position_size(
  account_capital NUMERIC,
  risk_tolerance TEXT,
  asset_price NUMERIC
) RETURNS TABLE(quantity INTEGER, amount NUMERIC, position_percentage NUMERIC) AS $$
DECLARE
  risk_min NUMERIC;
  risk_max NUMERIC;
  position_pct NUMERIC;
  calculated_amount NUMERIC;
  calculated_quantity INTEGER;
BEGIN
  -- Determine risk percentage range based on tolerance
  CASE risk_tolerance
    WHEN 'conservative' THEN
      risk_min := 0.05;
      risk_max := 0.10;
    WHEN 'aggressive' THEN
      risk_min := 0.15;
      risk_max := 0.25;
    ELSE -- 'moderate' or default
      risk_min := 0.10;
      risk_max := 0.15;
  END CASE;
  
  -- Calculate random position percentage within range
  position_pct := risk_min + (risk_max - risk_min) * random();
  
  -- Calculate position amount
  calculated_amount := account_capital * position_pct;
  
  -- Calculate quantity (number of shares)
  IF asset_price > 0 THEN
    calculated_quantity := FLOOR(calculated_amount / asset_price);
    -- Ensure at least 1 share if amount is sufficient
    IF calculated_quantity = 0 AND calculated_amount >= asset_price THEN
      calculated_quantity := 1;
    END IF;
    -- Recalculate actual amount based on whole shares
    calculated_amount := calculated_quantity * asset_price;
  ELSE
    calculated_quantity := 0;
    calculated_amount := 0;
  END IF;
  
  RETURN QUERY SELECT calculated_quantity, calculated_amount, position_pct;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update existing signals with quantity and amount
DO $$
DECLARE
  signal_record RECORD;
  strategy_record RECORD;
  current_price NUMERIC;
  account_cap NUMERIC;
  risk_tol TEXT;
  pos_size RECORD;
  updated_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- Loop through all trading signals that don't have quantity/amount
  FOR signal_record IN 
    SELECT id, strategy_id, signal_data, signal_type
    FROM public.trading_signals
    WHERE 
      signal_data IS NOT NULL
      AND (
        signal_data->>'quantity' IS NULL 
        OR signal_data->>'amount' IS NULL
      )
  LOOP
    BEGIN
      -- Get strategy information
      SELECT account_capital, risk_tolerance
      INTO strategy_record
      FROM public.strategies
      WHERE id = signal_record.strategy_id;
      
      -- Skip if strategy not found
      IF NOT FOUND THEN
        skipped_count := skipped_count + 1;
        CONTINUE;
      END IF;
      
      -- Get price from signal_data
      current_price := COALESCE(
        (signal_record.signal_data->>'current_price')::NUMERIC,
        (signal_record.signal_data->>'price')::NUMERIC,
        0
      );
      
      -- Skip if no valid price
      IF current_price <= 0 THEN
        skipped_count := skipped_count + 1;
        CONTINUE;
      END IF;
      
      -- Use strategy values or defaults
      account_cap := COALESCE(strategy_record.account_capital, 10000);
      risk_tol := COALESCE(strategy_record.risk_tolerance, 'moderate');
      
      -- Calculate position size
      SELECT * INTO pos_size
      FROM calculate_position_size(account_cap, risk_tol, current_price);
      
      -- Update signal_data with calculated values
      UPDATE public.trading_signals
      SET signal_data = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              signal_data,
              '{quantity}',
              to_jsonb(pos_size.quantity)
            ),
            '{amount}',
            to_jsonb(pos_size.amount)
          ),
          '{position_percentage}',
          to_jsonb(pos_size.position_percentage)
        ),
        '{account_capital}',
        to_jsonb(account_cap)
      )
      WHERE id = signal_record.id;
      
      updated_count := updated_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next signal
      RAISE NOTICE 'Error processing signal %: %', signal_record.id, SQLERRM;
      skipped_count := skipped_count + 1;
    END;
  END LOOP;
  
  -- Report results
  RAISE NOTICE 'Backfill complete. Updated % signals, skipped % signals.', updated_count, skipped_count;
END $$;

-- Drop the temporary function
DROP FUNCTION IF EXISTS calculate_position_size(NUMERIC, TEXT, NUMERIC);

-- Verify the update
DO $$
DECLARE
  total_signals INTEGER;
  signals_with_data INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_signals
  FROM public.trading_signals;
  
  SELECT COUNT(*) INTO signals_with_data
  FROM public.trading_signals
  WHERE 
    signal_data->>'quantity' IS NOT NULL 
    AND signal_data->>'amount' IS NOT NULL;
  
  RAISE NOTICE 'Total signals: %, Signals with quantity/amount: %', total_signals, signals_with_data;
END $$;

