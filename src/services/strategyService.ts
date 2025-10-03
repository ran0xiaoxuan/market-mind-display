import { supabase } from "@/integrations/supabase/client";
import { sendChatCompletion, createSystemMessage, createUserMessage, extractAssistantMessage } from "./moonshotService";
import { searchStocks } from "./assetApiService";

// Type definitions for Supabase tables
export interface Strategy {
  id: string;
  name: string;
  description: string | null;
  timeframe: string;
  targetAsset: string | null;
  targetAssetName?: string | null;
  dailySignalLimit?: number | null;
  accountCapital?: number | null;
  riskTolerance?: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  signalNotificationsEnabled?: boolean;
}

export interface TradingRule {
  id: string;
  ruleGroupId: string;
  leftType: string;
  leftIndicator: string | null;
  leftParameters: Record<string, any> | null;
  leftValueType: string | null;
  leftValue: string | null;
  condition: string;
  rightType: string;
  rightIndicator: string | null;
  rightParameters: Record<string, any> | null;
  rightValueType: string | null;
  rightValue: string | null;
  explanation: string | null;
  inequalityOrder: number;
}

export interface RuleGroup {
  id: string;
  strategyId: string;
  ruleType: string;
  logic: string;
  requiredConditions: number | null;
  groupOrder: number;
  explanation: string | null;
  tradingRules?: TradingRule[];
}

// Types for AI-generated strategies
export interface GeneratedRuleGroup {
  logic: "AND" | "OR";
  requiredConditions: number;
  inequalities: Inequality[];
}

export interface GeneratedStrategy {
  name: string;
  description: string;
  timeframe: string;
  targetAsset?: string;
  accountCapital?: number;
  riskTolerance?: string;
  entryRules: GeneratedRuleGroup[];
  exitRules: GeneratedRuleGroup[];
}

// Types for rule display
export interface RuleGroupData {
  id: number;
  logic: "AND" | "OR";
  requiredConditions: number;
  inequalities: Inequality[];
}

export interface Inequality {
  id: number;
  left: InequalitySide;
  condition: string;
  right: InequalitySide;
  explanation?: string;
}

export interface InequalitySide {
  type: "INDICATOR" | "PRICE" | "VALUE";
  indicator?: string;
  parameters?: Record<string, any>;
  valueType?: string;
  value?: string;
}

export class ServiceError extends Error {
  public type: string;
  public retryable: boolean;
  public details?: string[];

  constructor(message: string, type: string, retryable = false, details?: string[]) {
    super(message);
    this.name = 'ServiceError';
    this.type = type;
    this.retryable = retryable;
    this.details = details;
  }
}

export const getStrategies = async (): Promise<Strategy[]> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategies:', error);
      throw new ServiceError(error.message, 'database_error', true);
    }

    return data.map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      timeframe: strategy.timeframe,
      targetAsset: strategy.target_asset,
      targetAssetName: strategy.target_asset_name,
      isActive: strategy.is_active,
      userId: strategy.user_id,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
      signalNotificationsEnabled: strategy.signal_notifications_enabled,
      dailySignalLimit: strategy.daily_signal_limit
    }));
  } catch (error) {
    console.error('Error in getStrategies:', error);
    throw error instanceof ServiceError ? error : new ServiceError('Failed to fetch strategies', 'unknown_error', true);
  }
};

export const getStrategyById = async (id: string): Promise<Strategy | null> => {
  try {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Strategy not found
      }
      console.error('Error fetching strategy:', error);
      throw new ServiceError(error.message, 'database_error', true);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      timeframe: data.timeframe,
      targetAsset: data.target_asset,
      targetAssetName: data.target_asset_name,
      isActive: data.is_active,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      signalNotificationsEnabled: data.signal_notifications_enabled,
      dailySignalLimit: data.daily_signal_limit
    };
  } catch (error) {
    console.error('Error in getStrategyById:', error);
    throw error instanceof ServiceError ? error : new ServiceError('Failed to fetch strategy', 'unknown_error', true);
  }
};

export const getTradingRulesForStrategy = async (strategyId: string): Promise<{ entryRules: RuleGroupData[]; exitRules: RuleGroupData[] }> => {
  try {
    const { data: ruleGroups, error: groupsError } = await supabase
      .from('rule_groups')
      .select(`
        *,
        trading_rules (*)
      `)
      .eq('strategy_id', strategyId)
      .order('group_order');

    if (groupsError) {
      console.error('Error fetching rule groups:', groupsError);
      throw new ServiceError(groupsError.message, 'database_error', true);
    }

    const entryRules: RuleGroupData[] = [];
    const exitRules: RuleGroupData[] = [];

    ruleGroups.forEach((group, index) => {
      const ruleGroupData: RuleGroupData = {
        id: index + 1,
        logic: group.logic as "AND" | "OR",
        requiredConditions: group.required_conditions || 1,
        inequalities: group.trading_rules.map((rule: any, ruleIndex: number) => ({
          id: ruleIndex + 1,
          left: {
            type: rule.left_type as "INDICATOR" | "PRICE" | "VALUE",
            indicator: rule.left_indicator || undefined,
            parameters: rule.left_parameters || undefined,
            valueType: rule.left_value_type || undefined,
            value: rule.left_value || undefined
          },
          condition: rule.condition,
          right: {
            type: rule.right_type as "INDICATOR" | "PRICE" | "VALUE",
            indicator: rule.right_indicator || undefined,
            parameters: rule.right_parameters || undefined,
            valueType: rule.right_value_type || undefined,
            value: rule.right_value || undefined
          },
          explanation: rule.explanation || ''
        }))
      };

      if (group.rule_type === 'entry') {
        entryRules.push(ruleGroupData);
      } else if (group.rule_type === 'exit') {
        exitRules.push(ruleGroupData);
      }
    });

    return { entryRules, exitRules };
  } catch (error) {
    console.error('Error in getTradingRulesForStrategy:', error);
    throw error instanceof ServiceError ? error : new ServiceError('Failed to fetch trading rules', 'unknown_error', true);
  }
};

export const deleteStrategy = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('delete_strategy_cascade', {
      strategy_uuid: id
    });

    if (error) {
      console.error('Error deleting strategy:', error);
      throw new ServiceError(error.message, 'database_error', true);
    }
  } catch (error) {
    console.error('Error in deleteStrategy:', error);
    throw error instanceof ServiceError ? error : new ServiceError('Failed to delete strategy', 'unknown_error', true);
  }
};

export const generateStrategy = async (
  assetType: string,
  asset: string,
  description: string,
  accountCapital?: number
): Promise<GeneratedStrategy> => {
  try {
    console.log('=== Strategy generation started ===');
    console.log('Asset:', asset, 'Type:', assetType, 'Description:', description);

    // First try the primary generate-strategy function
    try {
      const { data, error } = await supabase.functions.invoke("generate-strategy", {
        body: {
          assetType,
          asset,
          description,
          accountCapital: accountCapital || 10000
        }
      });

      if (error) {
        console.error('Generate strategy function error:', error);
        throw new ServiceError(
          error.message || 'Strategy generation failed',
          'api_error',
          true
        );
      }

      if (data) {
        console.log('Strategy generated successfully via primary service');
        return data;
      }
    } catch (primaryError) {
      console.warn('Primary strategy service failed, trying fallback AI service:', primaryError);
      
      // Fallback to Moonshot AI service
      try {
        const systemPrompt = createSystemMessage(`You are an expert trading strategy generator. Generate a comprehensive trading strategy based on the user's requirements.

You must respond with a valid JSON object that follows this exact structure:
{
  "name": "Strategy Name",
  "description": "Detailed strategy description",
  "timeframe": "1d",
  "targetAsset": "ASSET_SYMBOL",
  "entryRules": [
    {
      "logic": "AND",
      "requiredConditions": 1,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR",
            "indicator": "RSI",
            "parameters": {"period": "14"},
            "valueType": "Value"
          },
          "condition": "LESS_THAN",
          "right": {
            "type": "VALUE",
            "value": "30"
          },
          "explanation": "RSI indicates oversold condition"
        }
      ]
    }
  ],
  "exitRules": [
    {
      "logic": "OR",
      "requiredConditions": 1,
      "inequalities": [
        {
          "id": 1,
          "left": {
            "type": "INDICATOR",
            "indicator": "RSI", 
            "parameters": {"period": "14"},
            "valueType": "Value"
          },
          "condition": "GREATER_THAN",
          "right": {
            "type": "VALUE",
            "value": "70"
          },
          "explanation": "RSI indicates overbought condition"
        }
      ]
    }
  ]
}

CRITICAL RULE GROUP REQUIREMENTS (in order of priority):
1. If you would create an OR group with only 1 condition, place that condition in the AND group instead.
2. OR groups MUST always contain at least 2 conditions
3. Never create an OR group with just a single inequality

Available indicators: RSI, MACD, Moving Average, SMA, EMA, Bollinger Bands, Stochastic, ADX, VWAP, ATR
Available conditions: GREATER_THAN, LESS_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL, EQUAL, NOT_EQUAL
Available timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
Available side types: INDICATOR, PRICE, VALUE

Make sure all indicators have proper parameters and valueType when needed.`);

        const userPrompt = createUserMessage(`Create a trading strategy for ${asset} (${assetType}) based on this description: ${description}

Requirements:
- Generate realistic entry and exit conditions
- Use appropriate technical indicators
- Include clear explanations for each rule
- Make the strategy suitable for the specified asset type
- Ensure the JSON is valid and follows the exact structure provided
- REMEMBER: OR groups must contain at least 2 conditions - if you have only 1 condition, use AND logic instead`);

        const response = await sendChatCompletion({
          messages: [systemPrompt, userPrompt],
          model: "moonshot-v1-8k",
          temperature: 0.7,
          max_tokens: 2000
        });

        const content = extractAssistantMessage(response);
        console.log('AI response content:', content);

        // Parse the JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in AI response');
        }

        const strategy = JSON.parse(jsonMatch[0]);
        
        // Validate strategy structure
        if (!strategy.name || !strategy.description || !strategy.entryRules || !strategy.exitRules) {
          throw new Error('Generated strategy has invalid structure');
        }

        console.log('Strategy generated successfully via fallback AI service');
        return strategy;

      } catch (aiError) {
        console.error('Fallback AI service also failed:', aiError);
        throw new ServiceError(
          'AI service is temporarily unavailable. Please try the template strategy instead.',
          'service_unavailable',
          true
        );
      }
    }

    throw new ServiceError('No strategy generated', 'unknown_error', false);

  } catch (error) {
    console.error('Strategy generation error:', error);
    
    if (error instanceof ServiceError) {
      throw error;
    }
    
    throw new ServiceError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'unknown_error',
      false
    );
  }
};

export const checkAIServiceHealth = async (): Promise<{ healthy: boolean; details?: any; error?: string }> => {
  try {
    console.log('Checking AI service health...');
    
    // Check primary service first
    const { data, error } = await supabase.functions.invoke("generate-strategy", {
      body: {
        healthCheck: true
      }
    });

    if (!error && data) {
      return { healthy: true, details: data };
    }

    // Check fallback AI service
    const { checkAIServiceHealth } = await import("./moonshotService");
    return await checkAIServiceHealth();

  } catch (error) {
    console.error('Health check failed:', error);
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Health check failed' 
    };
  }
};

export const saveGeneratedStrategy = async (
  strategy: GeneratedStrategy,
  userId: string
): Promise<string> => {
  try {
    console.log('Saving generated strategy:', strategy.name);

    // Try to get the asset name if we have a target asset
    let targetAssetName: string | null = null;
    if (strategy.targetAsset) {
      try {
        const searchResults = await searchStocks(strategy.targetAsset);
        const matchedAsset = searchResults.find(
          asset => asset.symbol.toLowerCase() === strategy.targetAsset?.toLowerCase()
        );
        if (matchedAsset) {
          targetAssetName = matchedAsset.name;
          console.log(`Found asset name for ${strategy.targetAsset}: ${targetAssetName}`);
        }
      } catch (error) {
        console.warn('Could not fetch asset name:', error);
        // Continue without the name - it's not critical
      }
    }

    // Create the strategy record
    const { data: strategyData, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        name: strategy.name,
        description: strategy.description,
        timeframe: strategy.timeframe,
        target_asset: strategy.targetAsset,
        target_asset_name: targetAssetName,
        account_capital: strategy.accountCapital || 10000,
        risk_tolerance: strategy.riskTolerance || 'moderate',
        user_id: userId,
        is_active: true
      })
      .select()
      .single();

    if (strategyError) {
      console.error('Error saving strategy:', strategyError);
      throw new Error(`Failed to save strategy: ${strategyError.message}`);
    }

    const strategyId = strategyData.id;

    // Save entry rules
    for (let groupIndex = 0; groupIndex < strategy.entryRules.length; groupIndex++) {
      const ruleGroup = strategy.entryRules[groupIndex];
      
      const { data: groupData, error: groupError } = await supabase
        .from('rule_groups')
        .insert({
          strategy_id: strategyId,
          rule_type: 'entry',
          logic: ruleGroup.logic,
          required_conditions: ruleGroup.requiredConditions,
          group_order: groupIndex + 1
        })
        .select()
        .single();

      if (groupError) {
        throw new Error(`Failed to save entry rule group: ${groupError.message}`);
      }

      // Save inequalities for this group
      for (let inequalityIndex = 0; inequalityIndex < ruleGroup.inequalities.length; inequalityIndex++) {
        const inequality = ruleGroup.inequalities[inequalityIndex];
        
        const { error: ruleError } = await supabase
          .from('trading_rules')
          .insert({
            rule_group_id: groupData.id,
            left_type: inequality.left.type,
            left_indicator: inequality.left.indicator,
            left_parameters: inequality.left.parameters,
            left_value_type: inequality.left.valueType,
            left_value: inequality.left.value,
            condition: inequality.condition,
            right_type: inequality.right.type,
            right_indicator: inequality.right.indicator,
            right_parameters: inequality.right.parameters,
            right_value_type: inequality.right.valueType,
            right_value: inequality.right.value,
            explanation: inequality.explanation,
            inequality_order: inequalityIndex + 1
          });

        if (ruleError) {
          throw new Error(`Failed to save entry rule: ${ruleError.message}`);
        }
      }
    }

    // Save exit rules
    for (let groupIndex = 0; groupIndex < strategy.exitRules.length; groupIndex++) {
      const ruleGroup = strategy.exitRules[groupIndex];
      
      const { data: groupData, error: groupError } = await supabase
        .from('rule_groups')
        .insert({
          strategy_id: strategyId,
          rule_type: 'exit',
          logic: ruleGroup.logic,
          required_conditions: ruleGroup.requiredConditions,
          group_order: groupIndex + 1
        })
        .select()
        .single();

      if (groupError) {
        throw new Error(`Failed to save exit rule group: ${groupError.message}`);
      }

      // Save inequalities for this group
      for (let inequalityIndex = 0; inequalityIndex < ruleGroup.inequalities.length; inequalityIndex++) {
        const inequality = ruleGroup.inequalities[inequalityIndex];
        
        const { error: ruleError } = await supabase
          .from('trading_rules')
          .insert({
            rule_group_id: groupData.id,
            left_type: inequality.left.type,
            left_indicator: inequality.left.indicator,
            left_parameters: inequality.left.parameters,
            left_value_type: inequality.left.valueType,
            left_value: inequality.left.value,
            condition: inequality.condition,
            right_type: inequality.right.type,
            right_indicator: inequality.right.indicator,
            right_parameters: inequality.right.parameters,
            right_value_type: inequality.right.valueType,
            right_value: inequality.right.value,
            explanation: inequality.explanation,
            inequality_order: inequalityIndex + 1
          });

        if (ruleError) {
          throw new Error(`Failed to save exit rule: ${ruleError.message}`);
        }
      }
    }

    console.log('Strategy saved successfully with ID:', strategyId);
    return strategyId;

  } catch (error) {
    console.error('Error in saveGeneratedStrategy:', error);
    throw error;
  }
};

export const generateFallbackStrategy = (
  assetType: string,
  asset: string,
  description: string
): GeneratedStrategy => {
  return {
    name: `Template Strategy for ${asset}`,
    description: `A basic template strategy for ${asset} based on RSI indicators. This is a fallback strategy created when AI services are unavailable. Description: ${description}`,
    timeframe: "1d",
    targetAsset: asset,
    entryRules: [
      {
        logic: "AND",
        requiredConditions: 1,
        inequalities: [
          {
            id: 1,
            left: {
              type: "INDICATOR",
              indicator: "RSI",
              parameters: { period: "14" },
              valueType: "Value"
            },
            condition: "LESS_THAN",
            right: {
              type: "VALUE",
              value: "30"
            },
            explanation: "RSI indicates oversold condition (good entry point)"
          }
        ]
      }
    ],
    exitRules: [
      {
        logic: "AND",
        requiredConditions: 1,
        inequalities: [
          {
            id: 1,
            left: {
              type: "INDICATOR",
              indicator: "RSI",
              parameters: { period: "14" },
              valueType: "Value"
            },
            condition: "GREATER_THAN",
            right: {
              type: "VALUE",
              value: "70"
            },
            explanation: "RSI indicates overbought condition (good exit point)"
          }
        ]
      }
    ]
  };
};
