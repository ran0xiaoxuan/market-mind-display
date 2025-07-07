
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
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Create a test trading signal in the database
    const signalData = {
      strategyId: testData.strategyId,
      strategyName: testData.strategyName,
      targetAsset: testData.targetAsset,
      price: testData.price,
      userId: user.user.id,
      timestamp: new Date().toISOString(),
      ...(testData.profitPercentage && { profitPercentage: testData.profitPercentage })
    };

    const { data: signal, error } = await supabase
      .from('trading_signals')
      .insert({
        strategy_id: testData.strategyId,
        signal_type: testData.signalType,
        signal_data: signalData,
        processed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test signal:', error);
      throw error;
    }

    console.log('Test signal created:', signal);

    // Send notifications for this signal
    await sendNotificationForSignal(
      signal.id,
      user.user.id,
      signalData,
      testData.signalType
    );

    // Mark signal as processed
    await supabase
      .from('trading_signals')
      .update({ processed: true })
      .eq('id', signal.id);

    return signal;
  } catch (error) {
    console.error('Error generating test signal:', error);
    throw error;
  }
};

export const getTestStrategies = async () => {
  try {
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select('id, name, target_asset, target_asset_name')
      .eq('is_active', true)
      .limit(5);

    if (error) {
      throw error;
    }

    return strategies || [];
  } catch (error) {
    console.error('Error fetching test strategies:', error);
    throw error;
  }
};
