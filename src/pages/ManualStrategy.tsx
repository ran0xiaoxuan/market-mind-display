
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, AlertCircle, Info, Crown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RuleGroupData } from "@/components/strategy-detail/types";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { getFmpApiKey, searchStocks, Asset } from "@/services/assetApiService";
import { debounce } from "lodash";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";
import { useEffect } from "react";
import { useOptimizedStrategies } from "@/hooks/useOptimizedStrategies";

// Define standard timeframe options
export const TIMEFRAME_OPTIONS = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

const ManualStrategy = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Form state - all empty for new strategy
  const [strategyName, setStrategyName] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [targetAsset, setTargetAsset] = useState("");
  const [targetAssetName, setTargetAssetName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [dailySignalLimit, setDailySignalLimit] = useState<number | null>(null);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Trading rules state - empty structure for new strategy
  const [entryRules, setEntryRules] = useState<RuleGroupData[]>([
    {
      id: 1,
      logic: "AND",
      inequalities: []
    },
    {
      id: 2,
      logic: "OR",
      inequalities: []
    }
  ]);
  const [exitRules, setExitRules] = useState<RuleGroupData[]>([
    {
      id: 1,
      logic: "AND",
      inequalities: []
    },
    {
      id: 2,
      logic: "OR",
      inequalities: []
    }
  ]);

  // Add subscription hook
  const { tier, isLoading: subscriptionLoading } = useUserSubscription();
  const userIsPro = isPro(tier);
  const { data: strategies = [], isLoading: strategiesLoading } = useOptimizedStrategies();
  const currentStrategyCount = strategies.length;
  const shouldShowUpgradePrompt = !userIsPro && !subscriptionLoading && !strategiesLoading && currentStrategyCount >= 1;

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Please log in again");
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-site-url': window.location.origin,
        },
        body: { plan }
      });
      if (error) {
        const contextBody = (error as any)?.context?.body;
        try {
          const parsed = typeof contextBody === 'string' ? JSON.parse(contextBody) : contextBody;
          if (parsed?.error) {
            throw new Error(parsed.error);
          }
        } catch (_) {}
        throw error as any;
      }
      if (data?.url) {
        window.location.href = data.url as string;
      } else {
        toast.error("Failed to start checkout");
      }
    } catch (err: any) {
      console.error('Upgrade error:', err);
      toast.error(err?.message || "Failed to start checkout");
    }
  };

  // Enhanced validation functions
  const validateBasicInfo = () => {
    const errors = [];
    if (!strategyName.trim()) errors.push("Strategy Name is required");
    if (!description.trim()) errors.push("Description is required");
    if (!timeframe) errors.push("Timeframe is required");
    if (!targetAsset.trim()) errors.push("Target Asset is required");
    if (dailySignalLimit !== null && dailySignalLimit !== undefined && (dailySignalLimit < 1 || dailySignalLimit > 390)) {
      errors.push("Daily signal limit must be between 1 and 390");
    }
    return errors;
  };

  const validateTradingRules = () => {
    const errors = [];
    // Users can save strategies with 0 entry or exit rules
    return errors;
  };

  const basicInfoErrors = showValidation ? validateBasicInfo() : [];
  const tradingRulesErrors = showValidation ? validateTradingRules() : [];

  // Fetch API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        const key = await getFmpApiKey();
        if (key) {
          setApiKey(key);
          console.log("API key retrieved successfully for ManualStrategy");
        } else {
          console.error("API key not found in ManualStrategy");
          toast.error("Unable to connect to financial data service");
        }
      } catch (error) {
        console.error("Error fetching API key in ManualStrategy:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiKey();
  }, []);

  // Search for assets with debounce
  const searchAssets = debounce(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // If no API key, try to fetch it
      if (!apiKey) {
        const key = await getFmpApiKey();
        if (key) {
          setApiKey(key);
        } else {
          throw new Error("No API key available");
        }
      }

      // Search stocks only
      const stockResults = await searchStocks(query, apiKey || "");
      setSearchResults(stockResults);
      if (stockResults.length === 0 && query.length > 0) {
        toast.info(`No assets found matching "${query}"`);
      }
    } catch (error) {
      console.error(`Error searching assets:`, error);
      toast.error("Could not connect to financial data service");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // Trigger search when query changes
  useEffect(() => {
    if (isSearchOpen && searchQuery) {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets]);

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSelectAsset = (asset: Asset) => {
    setTargetAsset(asset.symbol);
    setTargetAssetName(asset.name || "");
    setIsSearchOpen(false);
  };

  const handleCancel = () => {
    navigate('/strategies');
  };

  const handleSave = async () => {
    setShowValidation(true);
    
    const basicErrors = validateBasicInfo();
    const rulesErrors = validateTradingRules();
    
    const allErrors = [...basicErrors, ...rulesErrors];
    
    if (allErrors.length > 0) {
      toast.error("Please complete all required fields before saving", {
        description: `${allErrors.length} field(s) need to be completed`
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log('Starting new strategy creation...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Create new strategy
      console.log('Creating new strategy...');
      const { data: strategy, error: strategyError } = await supabase.from('strategies').insert({
        name: strategyName,
        description: description,
        timeframe: timeframe, 
        target_asset: targetAsset,
        target_asset_name: targetAssetName,
        is_active: isActive,
        daily_signal_limit: dailySignalLimit,
        user_id: user.id
      }).select().single();
      
      if (strategyError) {
        console.error('Error creating strategy:', strategyError);
        throw new Error(`Error creating strategy: ${strategyError.message}`);
      }
      console.log('New strategy created successfully:', strategy);

      // Create new entry rule groups and rules
      console.log('Creating entry rules:', entryRules);
      for (let groupIndex = 0; groupIndex < entryRules.length; groupIndex++) {
        const group = entryRules[groupIndex];
        console.log(`Processing entry group ${groupIndex + 1}:`, group);

        // Skip groups with no inequalities
        if (!group.inequalities || group.inequalities.length === 0) {
          console.log(`Skipping entry group ${groupIndex + 1} - no inequalities`);
          continue;
        }

        // Insert the rule group
        const {
          data: entryGroup,
          error: entryGroupError
        } = await supabase.from('rule_groups').insert({
          strategy_id: strategy.id,
          rule_type: 'entry',
          group_order: groupIndex + 1,
          logic: group.logic || 'AND',
          required_conditions: group.logic === 'OR' ? group.requiredConditions : null
        }).select().single();
        
        if (entryGroupError) {
          console.error('Error creating entry rule group:', entryGroupError);
          throw new Error(`Error creating entry rule group: ${entryGroupError.message}`);
        }
        console.log('Created entry rule group:', entryGroup);

        // Add each inequality as a trading rule
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          console.log(`Processing entry inequality ${i + 1}:`, inequality);
          
          const tradingRuleData = {
            rule_group_id: entryGroup.id,
            inequality_order: i + 1,
            left_type: inequality.left?.type || '',
            left_indicator: inequality.left?.type === 'INDICATOR' ? (inequality.left?.indicator || null) : null,
            left_parameters: inequality.left?.type === 'INDICATOR' && inequality.left?.parameters ? 
              JSON.parse(JSON.stringify(inequality.left.parameters)) : null,
            left_value: (inequality.left?.type === 'PRICE' || inequality.left?.type === 'VALUE') ? 
              inequality.left?.value : null,
            left_value_type: inequality.left?.type === 'INDICATOR' ? (inequality.left?.valueType || null) : null,
            condition: inequality.condition || '',
            right_type: inequality.right?.type || '',
            right_indicator: inequality.right?.type === 'INDICATOR' ? (inequality.right?.indicator || null) : null,
            right_parameters: inequality.right?.type === 'INDICATOR' && inequality.right?.parameters ? 
              JSON.parse(JSON.stringify(inequality.right.parameters)) : null,
            right_value: (inequality.right?.type === 'PRICE' || inequality.right?.type === 'VALUE') ? 
              inequality.right?.value : null,
            right_value_type: inequality.right?.type === 'INDICATOR' ? (inequality.right?.valueType || null) : null,
            explanation: inequality.explanation || null
          };
          
          console.log('Inserting trading rule data:', JSON.stringify(tradingRuleData, null, 2));
          
          const {
            error: ruleError
          } = await supabase.from('trading_rules').insert(tradingRuleData);
          
          if (ruleError) {
            console.error('Error saving entry rule:', ruleError);
            console.error('Failed rule data:', tradingRuleData);
            throw new Error(`Error saving entry rule: ${ruleError.message}`);
          }
          console.log(`Entry rule ${i + 1} saved successfully`);
        }
      }

      // Create new exit rule groups and rules
      console.log('Creating exit rules:', exitRules);
      for (let groupIndex = 0; groupIndex < exitRules.length; groupIndex++) {
        const group = exitRules[groupIndex];
        console.log(`Processing exit group ${groupIndex + 1}:`, group);

        // Skip groups with no inequalities
        if (!group.inequalities || group.inequalities.length === 0) {
          console.log(`Skipping exit group ${groupIndex + 1} - no inequalities`);
          continue;
        }

        // Insert the rule group
        const {
          data: exitGroup,
          error: exitGroupError
        } = await supabase.from('rule_groups').insert({
          strategy_id: strategy.id,
          rule_type: 'exit',
          group_order: groupIndex + 1,
          logic: group.logic || 'AND',
          required_conditions: group.logic === 'OR' ? group.requiredConditions : null
        }).select().single();
        
        if (exitGroupError) {
          console.error('Error creating exit rule group:', exitGroupError);
          throw new Error(`Error creating exit rule group: ${exitGroupError.message}`);
        }
        console.log('Created exit rule group:', exitGroup);

        // Add each inequality as a trading rule
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          console.log(`Processing exit inequality ${i + 1}:`, inequality);
          
          const tradingRuleData = {
            rule_group_id: exitGroup.id,
            inequality_order: i + 1,
            left_type: inequality.left?.type || '',
            left_indicator: inequality.left?.type === 'INDICATOR' ? (inequality.left?.indicator || null) : null,
            left_parameters: inequality.left?.type === 'INDICATOR' && inequality.left?.parameters ? 
              JSON.parse(JSON.stringify(inequality.left.parameters)) : null,
            left_value: (inequality.left?.type === 'PRICE' || inequality.left?.type === 'VALUE') ? 
              inequality.left?.value : null,
            left_value_type: inequality.left?.type === 'INDICATOR' ? (inequality.left?.valueType || null) : null,
            condition: inequality.condition || '',
            right_type: inequality.right?.type || '',
            right_indicator: inequality.right?.type === 'INDICATOR' ? (inequality.right?.indicator || null) : null,
            right_parameters: inequality.right?.type === 'INDICATOR' && inequality.right?.parameters ? 
              JSON.parse(JSON.stringify(inequality.right.parameters)) : null,
            right_value: (inequality.right?.type === 'PRICE' || inequality.right?.type === 'VALUE') ? 
              inequality.right?.value : null,
            right_value_type: inequality.right?.type === 'INDICATOR' ? (inequality.right?.valueType || null) : null,
            explanation: inequality.explanation || null
          };
          
          console.log('Inserting trading rule data:', JSON.stringify(tradingRuleData, null, 2));
          
          const {
            error: ruleError
          } = await supabase.from('trading_rules').insert(tradingRuleData);
          
          if (ruleError) {
            console.error('Error saving exit rule:', ruleError);
            console.error('Failed rule data:', tradingRuleData);
            throw new Error(`Error saving exit rule: ${ruleError.message}`);
          }
          console.log(`Exit rule ${i + 1} saved successfully`);
        }
      }
      
      console.log('New strategy created successfully');
      toast.success("Your strategy has been created successfully.");
      navigate(`/strategy/${strategy.id}`);
    } catch (error) {
      console.error("Error creating strategy:", error);
      if (error instanceof Error) {
        toast.error(`Failed to create strategy: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while creating the strategy");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEntryRulesChange = (rules: RuleGroupData[]) => {
    setEntryRules(rules);
  };

  const handleExitRulesChange = (rules: RuleGroupData[]) => {
    setExitRules(rules);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-2">
            <Link to="/strategies" className="text-sm flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </div>

          {shouldShowUpgradePrompt && (
            <Alert className="my-4 border-amber-200 bg-amber-50">
              <AlertTitle className="text-amber-800 dark:text-amber-800">Strategy Limit Reached</AlertTitle>
              <AlertDescription>
                <p className="text-amber-800">Free plan allows up to 1 strategy. Upgrade to create more strategies.</p>
                <div className="mt-3 flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => handleUpgrade('yearly')} size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3" aria-label="Upgrade to Pro Yearly">
                    Upgrade to Pro — Yearly
                  </Button>
                  <Button onClick={() => handleUpgrade('monthly')} size="lg" variant="outline" className="bg-white border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-500 px-6 py-3" aria-label="Upgrade to Pro Monthly">
                    Upgrade to Pro — Monthly
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Create New Strategy</h1>
            
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Create Strategy
              </Button>
            </div>
          </div>
          
          <Card className={`p-6 mb-6 ${basicInfoErrors.length > 0 ? 'border-red-500' : ''}`}>
            <h2 className="text-xl font-semibold mb-1">Basic Information</h2>
            <p className="text-sm text-muted-foreground mb-4">Enter the basic details of your strategy</p>
            
            {basicInfoErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Please complete the following fields:</div>
                  <ul className="list-disc pl-4">
                    {basicInfoErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Strategy Name</Label>
                <Input 
                  id="name" 
                  value={strategyName} 
                  onChange={e => setStrategyName(e.target.value)} 
                  className={`mt-1 ${!strategyName.trim() && showValidation ? 'border-red-500' : ''}`}
                  placeholder="Enter strategy name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className={`mt-1 resize-none ${!description.trim() && showValidation ? 'border-red-500' : ''}`} 
                  rows={3}
                  placeholder="Describe your trading strategy"
                />
              </div>
              
              <div>
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger id="timeframe" className={`mt-1 ${!timeframe && showValidation ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="asset" className="block text-sm font-medium mb-2">Target Asset</Label>
                <Button 
                  variant="outline" 
                  className={`w-full justify-start text-left font-normal h-10 ${!targetAsset.trim() && showValidation ? 'border-red-500' : ''}`} 
                  onClick={handleSearchOpen}
                >
                  <span className="mr-2">🔍</span>
                  {targetAsset ? `${targetAsset}${targetAssetName ? ` - ${targetAssetName}` : ''}` : "Search for stocks..."}
                </Button>
                
                <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogTitle className="sr-only">
                    Search Assets
                  </DialogTitle>
                  <CommandInput placeholder="Search for stocks..." value={searchQuery} onValueChange={setSearchQuery} autoFocus={true} />
                  <CommandList>
                    <CommandEmpty>
                      {isLoading ? <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div> : <p className="p-4 text-center text-sm text-muted-foreground">
                          No assets found.
                        </p>}
                    </CommandEmpty>
                    <CommandGroup heading="Search Results">
                      {searchResults.map(asset => (
                        <CommandItem key={asset.symbol} value={`${asset.symbol} ${asset.name}`} onSelect={() => handleSelectAsset(asset)}>
                          <div className="flex flex-col">
                            <span>{asset.symbol}</span>
                            <span className="text-xs text-muted-foreground">{asset.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </CommandDialog>
              </div>

              {/* Daily Signal Limit Setting - PRO only */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="daily-signal-limit">Maximum Notifications Per Trading Day</Label>
                  {userIsPro && <Crown className="h-4 w-4 text-amber-600" />}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">
                          {userIsPro 
                            ? "Limits the number of signal notifications sent to your external channels per trading day. All signals are still recorded in the app regardless of this limit."
                            : "This is a PRO feature. Upgrade to customize your daily notification limit. FREE users are limited to 5 notifications per day."
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {userIsPro ? (
                  <Input
                    id="daily-signal-limit"
                    type="number"
                    min="1"
                    max="390"
                    value={dailySignalLimit !== null && dailySignalLimit !== undefined ? String(dailySignalLimit) : ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseInt(e.target.value);
                      if (value === null || (value >= 1 && value <= 390)) {
                        setDailySignalLimit(value);
                      }
                    }}
                    className={`w-32 ${dailySignalLimit !== null && dailySignalLimit !== undefined && (dailySignalLimit < 1 || dailySignalLimit > 390) && showValidation ? 'border-red-500' : ''}`}
                    placeholder="Leave empty for no limit"
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="daily-signal-limit"
                      type="number"
                      value={dailySignalLimit !== null && dailySignalLimit !== undefined ? String(dailySignalLimit) : ""}
                      disabled
                      className="w-32 bg-muted"
                      placeholder="PRO feature"
                    />
                    <Alert className="border-amber-200 bg-amber-50">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700">
                        <div className="font-medium mb-1">PRO Feature Required</div>
                        <p className="text-sm">
                          Upgrade to PRO to customize your daily notification limit. FREE users are limited to 5 notifications per day.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {userIsPro 
                    ? "Set the maximum number of notifications per trading day (1-390)"
                    : "FREE users are limited to 5 notifications per day"
                  }
                </p>
              </div>
            </div>
          </Card>
          
          <Card className={`p-6 mb-6 ${tradingRulesErrors.length > 0 ? 'border-red-500' : ''}`}>
            <h2 className="text-xl font-semibold mb-1">Trading Rules</h2>
            <p className="text-sm text-muted-foreground mb-4">Define the entry and exit conditions for your strategy</p>
            
            {tradingRulesErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Please complete the following:</div>
                  <ul className="list-disc pl-4">
                    {tradingRulesErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <TradingRules 
              entryRules={entryRules} 
              exitRules={exitRules} 
              editable={true} 
              onEntryRulesChange={handleEntryRulesChange} 
              onExitRulesChange={handleExitRulesChange}
              showValidation={showValidation}
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ManualStrategy;