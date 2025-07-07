
import { supabase } from "@/integrations/supabase/client";
import { sendNotificationForSignal } from "./notificationService";

export interface TestSignalData {
  strategyId: string;
  strategyName: string;
  targetAsset: string;
  price: number;
  signalType: 'entry' | 'exit';
  profitPercentage?: number;
}

export const generateTestSignal = async (testData: TestSignalData) => {
  try {
    console.log('Generating test signal:', testData);

    // Get current user
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed: ' + userError.message);
    }
    
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    console.log('Current user:', user.user.id);

    // Verify user owns the strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('id, name, target_asset, target_asset_name, user_id')
      .eq('id', testData.strategyId)
      .eq('user_id', user.user.id)
      .single();

    if (strategyError) {
      console.error('Strategy verification error:', strategyError);
      throw new Error('Failed to verify strategy ownership: ' + strategyError.message);
    }

    if (!strategy) {
      throw new Error('Strategy not found or you do not own this strategy');
    }

    console.log('Strategy verified:', strategy);

    // Create signal data that matches what the notification functions expect
    const signalData = {
      strategyId: testData.strategyId,
      strategyName: testData.strategyName,
      targetAsset: testData.targetAsset,
      price: testData.price,
      userId: user.user.id,
      timestamp: new Date().toISOString(),
      ...(testData.profitPercentage && { profitPercentage: testData.profitPercentage })
    };

    console.log('Creating signal with data:', signalData);

    // Create the trading signal record
    const { data: signal, error: signalError } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: testData.strategyId,
        signal_type: testData.signalType,
        signal_data: signalData,
        processed: false
      })
      .select()
      .single();

    if (signalError) {
      console.error('Error creating trading signal:', signalError);
      throw new Error('Failed to create signal: ' + signalError.message);
    }

    console.log('Trading signal created successfully:', signal);

    // Send notifications for this signal
    console.log('Sending notifications for signal:', signal.id);
    const notificationResults = await sendNotificationForSignal(
      signal.id,
      user.user.id,
      signalData,
      testData.signalType
    );

    console.log('Notification results:', notificationResults);

    // Mark signal as processed
    const { error: updateError } = await supabase
      .from('trading_signals')
      .update({ processed: true })
      .eq('id', signal.id);

    if (updateError) {
      console.warn('Warning: Failed to mark signal as processed:', updateError);
    }

    return {
      signal,
      notificationResults
    };
  } catch (error) {
    console.error('Error in generateTestSignal:', error);
    throw error;
  }
};

export const getTestStrategies = async () => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('id, name, target_asset, target_asset_name')
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .limit(10);

    if (error) {
      console.error('Error fetching strategies:', error);
      throw error;
    }

    console.log('Fetched strategies for test:', strategies);
    return strategies || [];
  } catch (error) {
    console.error('Error in getTestStrategies:', error);
    throw error;
  }
};
