-- Add constraints and indexes to ensure data integrity for trading_rules table

-- Add check constraints to ensure data consistency
ALTER TABLE trading_rules 
ADD CONSTRAINT check_left_type_data 
CHECK (
  (left_type = 'INDICATOR' AND left_indicator IS NOT NULL) OR
  (left_type = 'PRICE' AND left_value IS NOT NULL) OR
  (left_type = 'VALUE' AND left_value IS NOT NULL)
);

ALTER TABLE trading_rules 
ADD CONSTRAINT check_right_type_data 
CHECK (
  (right_type = 'INDICATOR' AND right_indicator IS NOT NULL) OR
  (right_type = 'PRICE' AND right_value IS NOT NULL) OR
  (right_type = 'VALUE' AND right_value IS NOT NULL)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_rules_rule_group_order 
ON trading_rules(rule_group_id, inequality_order);

-- Add a function to validate trading rule data before insert/update
CREATE OR REPLACE FUNCTION validate_trading_rule_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate left side data
  IF NEW.left_type = 'INDICATOR' AND (NEW.left_indicator IS NULL OR NEW.left_indicator = '') THEN
    RAISE EXCEPTION 'left_indicator cannot be null or empty when left_type is INDICATOR';
  END IF;
  
  IF NEW.left_type = 'PRICE' AND (NEW.left_value IS NULL OR NEW.left_value = '') THEN
    RAISE EXCEPTION 'left_value cannot be null or empty when left_type is PRICE';
  END IF;
  
  IF NEW.left_type = 'VALUE' AND (NEW.left_value IS NULL OR NEW.left_value = '') THEN
    RAISE EXCEPTION 'left_value cannot be null or empty when left_type is VALUE';
  END IF;
  
  -- Validate right side data
  IF NEW.right_type = 'INDICATOR' AND (NEW.right_indicator IS NULL OR NEW.right_indicator = '') THEN
    RAISE EXCEPTION 'right_indicator cannot be null or empty when right_type is INDICATOR';
  END IF;
  
  IF NEW.right_type = 'PRICE' AND (NEW.right_value IS NULL OR NEW.right_value = '') THEN
    RAISE EXCEPTION 'right_value cannot be null or empty when right_type is PRICE';
  END IF;
  
  IF NEW.right_type = 'VALUE' AND (NEW.right_value IS NULL OR NEW.right_value = '') THEN
    RAISE EXCEPTION 'right_value cannot be null or empty when right_type is VALUE';
  END IF;
  
  -- Ensure condition is not empty
  IF NEW.condition IS NULL OR NEW.condition = '' THEN
    RAISE EXCEPTION 'condition cannot be null or empty';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate data before insert/update
CREATE TRIGGER validate_trading_rule_before_insert_update
  BEFORE INSERT OR UPDATE ON trading_rules
  FOR EACH ROW
  EXECUTE FUNCTION validate_trading_rule_data();