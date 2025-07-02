-- Add enhanced data cleaning trigger for trading_rules table
-- This trigger will ensure proper cleanup when changing between INDICATOR, PRICE, and VALUE types

CREATE OR REPLACE FUNCTION clean_trading_rule_data_on_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean left side data based on type
  IF NEW.left_type = 'INDICATOR' THEN
    -- For INDICATOR: keep indicator, parameters, value_type; clear value
    NEW.left_value := NULL;
  ELSIF NEW.left_type = 'PRICE' THEN
    -- For PRICE: keep value; clear indicator, parameters, value_type  
    NEW.left_indicator := NULL;
    NEW.left_parameters := NULL;
    NEW.left_value_type := NULL;
  ELSIF NEW.left_type = 'VALUE' THEN
    -- For VALUE: keep value; clear indicator, parameters, value_type
    NEW.left_indicator := NULL;
    NEW.left_parameters := NULL; 
    NEW.left_value_type := NULL;
  END IF;
  
  -- Clean right side data based on type
  IF NEW.right_type = 'INDICATOR' THEN
    -- For INDICATOR: keep indicator, parameters, value_type; clear value
    NEW.right_value := NULL;
  ELSIF NEW.right_type = 'PRICE' THEN
    -- For PRICE: keep value; clear indicator, parameters, value_type
    NEW.right_indicator := NULL;
    NEW.right_parameters := NULL;
    NEW.right_value_type := NULL;
  ELSIF NEW.right_type = 'VALUE' THEN
    -- For VALUE: keep value; clear indicator, parameters, value_type
    NEW.right_indicator := NULL;
    NEW.right_parameters := NULL;
    NEW.right_value_type := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean data before insert/update (runs after validation)
DROP TRIGGER IF EXISTS clean_trading_rule_data_before_save ON trading_rules;
CREATE TRIGGER clean_trading_rule_data_before_save
  BEFORE INSERT OR UPDATE ON trading_rules
  FOR EACH ROW
  EXECUTE FUNCTION clean_trading_rule_data_on_change();