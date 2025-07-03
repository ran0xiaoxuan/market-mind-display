
-- Enable notifications for the TQQQ strategy (currently active but notifications disabled)
UPDATE strategies 
SET signal_notifications_enabled = true, updated_at = now()
WHERE name = 'Buy TQQQ when RSI is under 30' AND user_id = '88b9aa6e-eb6c-42d4-870c-d7ba1cb52193';

-- Also reactivate and enable notifications for the INTC strategy if desired
UPDATE strategies 
SET is_active = true, signal_notifications_enabled = true, updated_at = now()
WHERE name = 'Buy INTC when RSI is under 99' AND user_id = '88b9aa6e-eb6c-42d4-870c-d7ba1cb52193';

-- Update any other strategies that might have notifications disabled
UPDATE strategies 
SET signal_notifications_enabled = true, updated_at = now()
WHERE user_id = '88b9aa6e-eb6c-42d4-870c-d7ba1cb52193' 
AND is_active = true 
AND signal_notifications_enabled = false;
