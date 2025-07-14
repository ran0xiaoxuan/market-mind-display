import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
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
import { getStrategyById, getTradingRulesForStrategy } from "@/services/strategyService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";

// Define standard timeframe options to ensure consistency across the application
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

const EditStrategy = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Form state
  const [strategyName, setStrategyName] = useState("");
  const [description, setDescription] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [targetAsset, setTargetAsset] = useState("");
  const [targetAssetName, setTargetAssetName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [dailySignalLimit, setDailySignalLimit] = useState(5);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Trading rules state
  const [entryRules, setEntryRules] = useState<RuleGroupData[]>([]);
  const [exitRules, setExitRules] = useState<RuleGroupData[]>([]);

  // Add subscription hook
  const { tier, isLoading: subscriptionLoading } = useUserSubscription();
  const userIsPro = isPro(tier);

  // Enhanced validation functions
  const validateBasicInfo = () => {
    const errors = [];
    if (!strategyName.trim()) errors.push("Strategy Name is required");
    if (!description.trim()) errors.push("Description is required");
    if (!timeframe) errors.push("Timeframe is required");
    if (!targetAsset.trim()) errors.push("Target Asset is required");
    if (dailySignalLimit < 1 || dailySignalLimit > 390) {
      errors.push("Daily signal limit must be between 1 and 390");
    }
    return errors;
  };

  const validateTradingRules = () => {
    const errors = [];
    
    // Remove the validation checks for entry and exit rules
    // Users can now save strategies with 0 entry or exit rules
    
    return errors;
  };

  const basicInfoErrors = showValidation ? validateBasicInfo() : [];
  const tradingRulesErrors = showValidation ? validateTradingRules() : [];

  // Function to normalize timeframe from database format to TIMEFRAME_OPTIONS value
  const normalizeTimeframe = (dbTimeframe: string): string => {
    if (!dbTimeframe) return "Daily";
    
    // Create comprehensive mapping from database formats to TIMEFRAME_OPTIONS values
    const timeframeMappings: { [key: string]: string } = {
      // Direct matches (already correct)
      "1m": "1m",
      "5m": "5m", 
      "15m": "15m",
      "30m": "30m",
      "1h": "1h",
      "4h": "4h",
      "Daily": "Daily",
      "Weekly": "Weekly",
      "Monthly": "Monthly",
      
      // Common variations that need mapping
      "1 minute": "1m",
      "1minute": "1m",
      "1-minute": "1m",
      "1 min": "1m",
      "1min": "1m",
      
      "5 minutes": "5m",
      "5minutes": "5m", 
      "5-minutes": "5m",
      "5 mins": "5m",
      "5mins": "5m",
      
      "15 minutes": "15m",
      "15minutes": "15m",
      "15-minutes": "15m", 
      "15 mins": "15m",
      "15mins": "15m",
      
      "30 minutes": "30m",
      "30minutes": "30m",
      "30-minutes": "30m",
      "30 mins": "30m", 
      "30mins": "30m",
      
      "1 hour": "1h",
      "1hour": "1h",
      "1-hour": "1h",
      "1 hr": "1h",
      "1hr": "1h",
      
      "4 hours": "4h",
      "4hours": "4h",
      "4-hours": "4h", 
      "4 hrs": "4h",
      "4hrs": "4h",
      
      // Legacy formats
      "1d": "Daily",
      "1day": "Daily",
      "1-day": "Daily", 
      "daily": "Daily",
      
      "1w": "Weekly",
      "1week": "Weekly",
      "1-week": "Weekly",
      "weekly": "Weekly",
      
      "1M": "Monthly",
      "1month": "Monthly", 
      "1-month": "Monthly",
      "monthly": "Monthly"
    };
    
    // Try direct mapping first (case-insensitive)
    const lowerTimeframe = dbTimeframe.toLowerCase();
    if (timeframeMappings[lowerTimeframe]) {
      console.log(`Mapped timeframe "${dbTimeframe}" to "${timeframeMappings[lowerTimeframe]}"`);
      return timeframeMappings[lowerTimeframe];
    }
    
    // If no mapping found, check if it's already a valid TIMEFRAME_OPTIONS value
    const validOption = TIMEFRAME_OPTIONS.find(option => option.value === dbTimeframe);
    if (validOption) {
      console.log(`Timeframe "${dbTimeframe}" is already valid`);
      return dbTimeframe;
    }
    
    // Log unmapped timeframe and return default
    console.warn(`Unmapped timeframe "${dbTimeframe}" - defaulting to Daily`);
    return "Daily";
  };

  // Fetch strategy data when component mounts
  useEffect(() => {
    const fetchStrategyData = async () => {
      if (!id) {
        toast.error("No strategy ID provided");
        navigate('/strategies');
        return;
      }
      try {
        setLoading(true);
        console.log(`Fetching strategy with ID: ${id}`);

        // Fetch strategy basic data
        const strategy = await getStrategyById(id);
        if (!strategy) {
          toast.error("The requested strategy could not be found");
          navigate('/strategies');
          return;
        }

        // Set basic strategy data to state
        setStrategyName(strategy.name);
        setDescription(strategy.description || "");

        // Process timeframe using the new normalization function
        const normalizedTimeframe = normalizeTimeframe(strategy.timeframe);
        console.log(`Original timeframe: "${strategy.timeframe}" -> Normalized: "${normalizedTimeframe}"`);
        setTimeframe(normalizedTimeframe);

        setTargetAsset(strategy.targetAsset || "");
        setTargetAssetName(strategy.targetAssetName || "");
        setIsActive(strategy.isActive);

        // Set daily signal limit from the strategy data
        setDailySignalLimit(strategy.dailySignalLimit || 5);

        // Fetch trading rules
        const rulesData = await getTradingRulesForStrategy(id);

        // Check if we have valid rules
        if (rulesData) {
          console.log("Loaded trading rules:", rulesData);
          if (rulesData.entryRules && rulesData.entryRules.length > 0) {
            setEntryRules(rulesData.entryRules);
          } else {
            // Set empty entry rules structure
            setEntryRules([{
              id: 1,
              logic: "AND",
              inequalities: []
            }, {
              id: 2,
              logic: "OR",
              inequalities: []
            }]);
          }
          if (rulesData.exitRules && rulesData.exitRules.length > 0) {
            setExitRules(rulesData.exitRules);
          } else {
            // Set empty exit rules structure
            setExitRules([{
              id: 1,
              logic: "AND",
              inequalities: []
            }, {
              id: 2,
              logic: "OR",
              inequalities: []
            }]);
          }
        } else {
          // Set empty rules structure if no rules are found
          setEntryRules([{
            id: 1,
            logic: "AND",
            inequalities: []
          }, {
            id: 2,
            logic: "OR",
            inequalities: []
          }]);
          setExitRules([{
            id: 1,
            logic: "AND",
            inequalities: []
          }, {
            id: 2,
            logic: "OR",
            inequalities: []
          }]);
        }
        console.log("Strategy data loaded successfully");
      } catch (error) {
        console.error("Error fetching strategy data:", error);
        toast.error("Failed to load strategy details");
      } finally {
        setLoading(false);
      }
    };
    fetchStrategyData();
  }, [id, navigate]);

  // Fetch API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        const key = await getFmpApiKey();
        if (key) {
          setApiKey(key);
          console.log("API key retrieved successfully for EditStrategy");
        } else {
          console.error("API key not found in EditStrategy");
          toast.error("Unable to connect to financial data service");
        }
      } catch (error) {
        console.error("Error fetching API key in EditStrategy:", error);
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
    // Navigate to the strategy detail page instead of going back in history
    if (id) {
      navigate(`/strategy/${id}`);
    } else {
      navigate('/strategies');
    }
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

    if (!id) return;
    try {
      setIsSaving(true);
      console.log('Starting strategy save process...');

      // Enhanced logging for trading rules data
      console.log('Current entry rules before save:', JSON.stringify(entryRules, null, 2));
      console.log('Current exit rules before save:', JSON.stringify(exitRules, null, 2));

      // Update strategy information (now includes daily_signal_limit)
      console.log('Updating basic strategy information...');
      const { error: strategyError } = await supabase.from('strategies').update({
        name: strategyName,
        description: description,
        timeframe: timeframe, 
        target_asset: targetAsset,
        target_asset_name: targetAssetName,
        is_active: isActive,
        daily_signal_limit: dailySignalLimit,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      
      if (strategyError) {
        console.error('Error updating strategy:', strategyError);
        throw new Error(`Error updating strategy: ${strategyError.message}`);
      }
      console.log('Basic strategy information updated successfully');

      // Get all existing rule groups for this strategy
      console.log('Fetching existing rule groups...');
      const {
        data: existingRuleGroups,
        error: ruleGroupsError
      } = await supabase.from('rule_groups').select('id, rule_type').eq('strategy_id', id);
      
      if (ruleGroupsError) {
        console.error('Error fetching rule groups:', ruleGroupsError);
        throw new Error(`Error fetching rule groups: ${ruleGroupsError.message}`);
      }
      console.log('Existing rule groups:', existingRuleGroups);

      // Delete existing rule groups and their associated trading rules
      if (existingRuleGroups && existingRuleGroups.length > 0) {
        const ruleGroupIds = existingRuleGroups.map(group => group.id);
        console.log('Deleting existing trading rules for groups:', ruleGroupIds);

        // Delete trading rules first (foreign key constraint)
        const {
          error: deleteRulesError
        } = await supabase.from('trading_rules').delete().in('rule_group_id', ruleGroupIds);
        if (deleteRulesError) {
          console.error('Error deleting trading rules:', deleteRulesError);
          throw new Error(`Error deleting trading rules: ${deleteRulesError.message}`);
        }
        console.log('Existing trading rules deleted');

        // Delete rule groups
        console.log('Deleting existing rule groups...');
        const {
          error: deleteGroupsError
        } = await supabase.from('rule_groups').delete().eq('strategy_id', id);
        if (deleteGroupsError) {
          console.error('Error deleting rule groups:', deleteGroupsError);
          throw new Error(`Error deleting rule groups: ${deleteGroupsError.message}`);
        }
        console.log('Existing rule groups deleted');
      }

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
          strategy_id: id,
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
          
          // Fixed data mapping to preserve actual price values
          const tradingRuleData = {
            rule_group_id: entryGroup.id,
            inequality_order: i + 1,
            left_type: inequality.left?.type || '',
            left_indicator: inequality.left?.type === 'INDICATOR' ? (inequality.left?.indicator || null) : null,
            left_parameters: inequality.left?.type === 'INDICATOR' && inequality.left?.parameters ? 
              JSON.parse(JSON.stringify(inequality.left.parameters)) : null,
            left_value: (inequality.left?.type === 'PRICE' || inequality.left?.type === 'VALUE') ? 
              inequality.left?.value : null, // Preserve actual price option or value
            left_value_type: inequality.left?.type === 'INDICATOR' ? (inequality.left?.valueType || null) : null,
            condition: inequality.condition || '',
            right_type: inequality.right?.type || '',
            right_indicator: inequality.right?.type === 'INDICATOR' ? (inequality.right?.indicator || null) : null,
            right_parameters: inequality.right?.type === 'INDICATOR' && inequality.right?.parameters ? 
              JSON.parse(JSON.stringify(inequality.right.parameters)) : null,
            right_value: (inequality.right?.type === 'PRICE' || inequality.right?.type === 'VALUE') ? 
              inequality.right?.value : null, // Preserve actual price option or value
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
          strategy_id: id,
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
          
          // Fixed data mapping to preserve actual price values
          const tradingRuleData = {
            rule_group_id: exitGroup.id,
            inequality_order: i + 1,
            left_type: inequality.left?.type || '',
            left_indicator: inequality.left?.type === 'INDICATOR' ? (inequality.left?.indicator || null) : null,
            left_parameters: inequality.left?.type === 'INDICATOR' && inequality.left?.parameters ? 
              JSON.parse(JSON.stringify(inequality.left.parameters)) : null,
            left_value: (inequality.left?.type === 'PRICE' || inequality.left?.type === 'VALUE') ? 
              inequality.left?.value : null, // Preserve actual price option or value
            left_value_type: inequality.left?.type === 'INDICATOR' ? (inequality.left?.valueType || null) : null,
            condition: inequality.condition || '',
            right_type: inequality.right?.type || '',
            right_indicator: inequality.right?.type === 'INDICATOR' ? (inequality.right?.indicator || null) : null,
            right_parameters: inequality.right?.type === 'INDICATOR' && inequality.right?.parameters ? 
              JSON.parse(JSON.stringify(inequality.right.parameters)) : null,
            right_value: (inequality.right?.type === 'PRICE' || inequality.right?.type === 'VALUE') ? 
              inequality.right?.value : null, // Preserve actual price option or value
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
      
      console.log('All strategy data saved successfully');
      toast.success("Your strategy has been successfully updated.");
      navigate(`/strategy/${id}`);
    } catch (error) {
      console.error("Error saving strategy:", error);
      if (error instanceof Error) {
        toast.error(`Failed to save strategy: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while saving the strategy");
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold">Loading strategy...</h2>
            <p className="text-muted-foreground">Please wait while we fetch the strategy details</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-2">
            <Link to={`/strategy/${id}`} className="text-sm flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Strategy</h1>
            
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
              </Button>
            </div>
          </div>
          
          <Card className={`p-6 mb-6 ${basicInfoErrors.length > 0 ? 'border-red-500' : ''}`}>
            <h2 className="text-xl font-semibold mb-1">Basic Information</h2>
            <p className="text-sm text-muted-foreground mb-4">Edit the basic details of your strategy</p>
            
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
                      {searchResults.map(asset => <CommandItem key={asset.symbol} value={`${asset.symbol} ${asset.name}`} onSelect={() => handleSelectAsset(asset)}>
                          <div className="flex flex-col">
                            <span>{asset.symbol}</span>
                            <span className="text-xs text-muted-foreground">{asset.name}</span>
                          </div>
                        </CommandItem>)}
                    </CommandGroup>
                  </CommandList>
                </CommandDialog>
              </div>

              {/* Daily Signal Limit Setting - Updated for better FREE vs PRO distinction */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="daily-signal-limit">Daily Signal Limit</Label>
                  {userIsPro && <Crown className="h-4 w-4 text-amber-600" />}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">
                          {userIsPro 
                            ? "All signals are recorded in the app. For PRO users, this limits external notifications (Email/Discord/Telegram) per trading day."
                            : "All signals are recorded in the app. FREE users don't receive external notifications - upgrade to PRO to enable Email/Discord/Telegram alerts."
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
                    value={dailySignalLimit}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 390) {
                        setDailySignalLimit(value);
                      }
                    }}
                    className={`w-32 ${(dailySignalLimit < 1 || dailySignalLimit > 390) && showValidation ? 'border-red-500' : ''}`}
                  />
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="daily-signal-limit"
                      type="number"
                      value={dailySignalLimit}
                      disabled
                      className="w-32 bg-muted"
                    />
                    <Alert className="border-amber-200 bg-amber-50">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700">
                        <div className="font-medium mb-1">FREE Plan: App-Only Signals</div>
                        <p className="text-sm">
                          All signals are recorded in the app for FREE users. External notifications (Email/Discord/Telegram) are available with PRO upgrade.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  {userIsPro 
                    ? "Set the maximum number of external notifications per trading day (1-390)"
                    : "Signals are recorded in the app - external notifications require PRO upgrade"
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

export default EditStrategy;
