import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, X, Search, Loader2, AlertCircle } from "lucide-react";
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
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [singleBuyVolume, setSingleBuyVolume] = useState("");
  const [maxBuyVolume, setMaxBuyVolume] = useState("");

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Trading rules state
  const [entryRules, setEntryRules] = useState<RuleGroupData[]>([]);
  const [exitRules, setExitRules] = useState<RuleGroupData[]>([]);

  // More lenient validation functions
  const validateBasicInfo = () => {
    const errors = [];
    if (!strategyName.trim()) errors.push("Strategy Name is required");
    if (!timeframe) errors.push("Timeframe is required");
    return errors;
  };

  const validateRiskManagement = () => {
    const errors = [];
    // Make risk management optional for now
    return errors;
  };

  const validateTradingRules = () => {
    const errors = [];
    // Make trading rules optional for now to allow saving drafts
    return errors;
  };

  const basicInfoErrors = showValidation ? validateBasicInfo() : [];
  const riskManagementErrors = showValidation ? validateRiskManagement() : [];
  const tradingRulesErrors = showValidation ? validateTradingRules() : [];

  // Fetch strategy data when component mounts
  useEffect(() => {
    const fetchStrategyData = async () => {
      if (!id) {
        toast("No strategy ID provided");
        navigate('/strategies');
        return;
      }
      try {
        setLoading(true);
        console.log(`Fetching strategy with ID: ${id}`);

        // Fetch strategy basic data
        const strategy = await getStrategyById(id);
        if (!strategy) {
          toast("The requested strategy could not be found");
          navigate('/strategies');
          return;
        }

        // Set basic strategy data to state
        setStrategyName(strategy.name);
        setDescription(strategy.description || "");

        // Process timeframe to ensure it matches our standard options format
        let normalizedTimeframe = strategy.timeframe;
        // Legacy conversion for any timeframe values not already standardized
        if (strategy.timeframe === "1d") {
          normalizedTimeframe = "Daily";
        }
        
        console.log("Setting timeframe from strategy data:", normalizedTimeframe);
        setTimeframe(normalizedTimeframe || "");
        setTargetAsset(strategy.targetAsset || "");
        setTargetAssetName(strategy.targetAssetName || "");
        setIsActive(strategy.isActive);

        // Set risk management data - strip any currency or percent symbols for form values
        const cleanStopLoss = strategy.stopLoss?.replace(/[%$]/g, '') || "";
        const cleanTakeProfit = strategy.takeProfit?.replace(/[%$]/g, '') || "";
        const cleanSingleBuyVolume = strategy.singleBuyVolume?.replace(/[$,]/g, '') || "";
        const cleanMaxBuyVolume = strategy.maxBuyVolume?.replace(/[$,]/g, '') || "";
        
        console.log("Setting risk management data:", {
          stopLoss: cleanStopLoss,
          takeProfit: cleanTakeProfit,
          singleBuyVolume: cleanSingleBuyVolume,
          maxBuyVolume: cleanMaxBuyVolume,
          timeframe: normalizedTimeframe
        });
        
        setStopLoss(cleanStopLoss);
        setTakeProfit(cleanTakeProfit);
        setSingleBuyVolume(cleanSingleBuyVolume);
        setMaxBuyVolume(cleanMaxBuyVolume);

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
            }]);
          }
        } else {
          // Set empty rules structure if no rules are found
          setEntryRules([{
            id: 1,
            logic: "AND",
            inequalities: []
          }]);
          setExitRules([{
            id: 1,
            logic: "AND",
            inequalities: []
          }]);
        }
        console.log("Strategy data loaded successfully");
      } catch (error) {
        console.error("Error fetching strategy data:", error);
        toast("Failed to load strategy details");
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
          toast("Unable to connect to financial data service");
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
        toast(`No assets found matching "${query}"`);
      }
    } catch (error) {
      console.error(`Error searching assets:`, error);
      toast("Could not connect to financial data service");
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
    
    if (basicErrors.length > 0) {
      toast.error("Please complete required fields before saving", {
        description: `${basicErrors.length} field(s) need to be completed`
      });
      return;
    }

    if (!id) return;
    try {
      setIsSaving(true);

      // Update strategy information with more flexible approach
      const { error: strategyError } = await supabase.from('strategies').update({
        name: strategyName,
        description: description || null,
        timeframe: timeframe, 
        target_asset: targetAsset || null,
        target_asset_name: targetAssetName || null,
        is_active: isActive,
        stop_loss: stopLoss || null,
        take_profit: takeProfit || null,
        single_buy_volume: singleBuyVolume || null,
        max_buy_volume: maxBuyVolume || null,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      
      if (strategyError) {
        throw new Error(`Error updating strategy: ${strategyError.message}`);
      }

      // Only update rules if they exist and have content
      if (entryRules.length > 0 || exitRules.length > 0) {
        // Get all existing rule groups for this strategy
        const {
          data: existingRuleGroups,
          error: ruleGroupsError
        } = await supabase.from('rule_groups').select('id, rule_type').eq('strategy_id', id);
        
        if (ruleGroupsError) {
          console.warn("Could not fetch existing rule groups:", ruleGroupsError);
        }

        // Delete existing rule groups and their associated trading rules
        if (existingRuleGroups && existingRuleGroups.length > 0) {
          // Get the IDs of all rule groups
          const ruleGroupIds = existingRuleGroups.map(group => group.id);

          // Delete trading rules first (foreign key constraint)
          const {
            error: deleteRulesError
          } = await supabase.from('trading_rules').delete().in('rule_group_id', ruleGroupIds);
          if (deleteRulesError) {
            console.warn("Could not delete existing trading rules:", deleteRulesError);
          }

          // Delete rule groups
          const {
            error: deleteGroupsError
          } = await supabase.from('rule_groups').delete().eq('strategy_id', id);
          if (deleteGroupsError) {
            console.warn("Could not delete existing rule groups:", deleteGroupsError);
          }
        }

        // Create new entry rule groups and rules only if they have content
        for (let groupIndex = 0; groupIndex < entryRules.length; groupIndex++) {
          const group = entryRules[groupIndex];
          if (!group.inequalities || group.inequalities.length === 0) continue;

          // Insert the rule group
          const {
            data: entryGroup,
            error: entryGroupError
          } = await supabase.from('rule_groups').insert({
            strategy_id: id,
            rule_type: 'entry',
            group_order: groupIndex + 1,
            logic: group.logic,
            required_conditions: group.logic === 'OR' ? group.requiredConditions : null
          }).select().single();
          
          if (entryGroupError) {
            console.warn("Could not create entry rule group:", entryGroupError);
            continue;
          }

          // Add each inequality as a trading rule
          for (let i = 0; i < group.inequalities.length; i++) {
            const inequality = group.inequalities[i];
            const {
              error: ruleError
            } = await supabase.from('trading_rules').insert({
              rule_group_id: entryGroup.id,
              inequality_order: i + 1,
              left_type: inequality.left.type,
              left_indicator: inequality.left.indicator,
              left_parameters: inequality.left.parameters,
              left_value: inequality.left.value,
              left_value_type: inequality.left.valueType,
              condition: inequality.condition,
              right_type: inequality.right.type,
              right_indicator: inequality.right.indicator,
              right_parameters: inequality.right.parameters,
              right_value: inequality.right.value,
              right_value_type: inequality.right.valueType,
              explanation: inequality.explanation
            });
            if (ruleError) {
              console.warn("Could not save entry rule:", ruleError);
            }
          }
        }

        // Create new exit rule groups and rules only if they have content
        for (let groupIndex = 0; groupIndex < exitRules.length; groupIndex++) {
          const group = exitRules[groupIndex];
          if (!group.inequalities || group.inequalities.length === 0) continue;

          // Insert the rule group
          const {
            data: exitGroup,
            error: exitGroupError
          } = await supabase.from('rule_groups').insert({
            strategy_id: id,
            rule_type: 'exit',
            group_order: groupIndex + 1,
            logic: group.logic,
            required_conditions: group.logic === 'OR' ? group.requiredConditions : null
          }).select().single();
          
          if (exitGroupError) {
            console.warn("Could not create exit rule group:", exitGroupError);
            continue;
          }

          // Add each inequality as a trading rule
          for (let i = 0; i < group.inequalities.length; i++) {
            const inequality = group.inequalities[i];
            const {
              error: ruleError
            } = await supabase.from('trading_rules').insert({
              rule_group_id: exitGroup.id,
              inequality_order: i + 1,
              left_type: inequality.left.type,
              left_indicator: inequality.left.indicator,
              left_parameters: inequality.left.parameters,
              left_value: inequality.left.value,
              left_value_type: inequality.left.valueType,
              condition: inequality.condition,
              right_type: inequality.right.type,
              right_indicator: inequality.right.indicator,
              right_parameters: inequality.right.parameters,
              right_value: inequality.right.value,
              right_value_type: inequality.right.valueType,
              explanation: inequality.explanation
            });
            if (ruleError) {
              console.warn("Could not save exit rule:", ruleError);
            }
          }
        }
      }

      toast.success("Your strategy has been successfully updated.");
      navigate(`/strategy/${id}`);
    } catch (error) {
      console.error("Error saving strategy:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
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
                  className="mt-1 resize-none" 
                  rows={3} 
                  placeholder="Optional description of your strategy"
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
                <Label htmlFor="asset" className="block text-sm font-medium mb-2">Target Asset (Optional)</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal h-10" 
                  onClick={handleSearchOpen}
                >
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  {targetAsset ? `${targetAsset}${targetAssetName ? ` - ${targetAssetName}` : ''}` : "Search for stocks..."}
                </Button>
                
                <CommandDialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogTitle className="sr-only">
                    Search Assets
                  </DialogTitle>
                  <CommandInput placeholder="Search for stocks..." value={searchQuery} onValueChange={setSearchQuery} autoFocus={true} />
                  <CommandList>
                    <CommandEmpty>
                      {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          No assets found.
                        </p>
                      )}
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
            </div>
          </Card>
          
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-1">Risk Management (Optional)</h2>
            <p className="text-sm text-muted-foreground mb-4">Define your risk parameters and investment limits</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                <Input 
                  id="stopLoss" 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  value={stopLoss} 
                  onChange={e => setStopLoss(e.target.value)} 
                  className="mt-1"
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <Label htmlFor="takeProfit">Take Profit (%)</Label>
                <Input 
                  id="takeProfit" 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  value={takeProfit} 
                  onChange={e => setTakeProfit(e.target.value)} 
                  className="mt-1"
                  placeholder="e.g., 10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <Label htmlFor="singleBuyVolume">Single Buy Volume ($)</Label>
                <Input 
                  id="singleBuyVolume" 
                  type="number" 
                  min="0" 
                  step="100" 
                  value={singleBuyVolume} 
                  onChange={e => setSingleBuyVolume(e.target.value)} 
                  className="mt-1"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <Label htmlFor="maxBuyVolume">Max Buy Volume ($)</Label>
                <Input 
                  id="maxBuyVolume" 
                  type="number" 
                  min="0" 
                  step="100" 
                  value={maxBuyVolume} 
                  onChange={e => setMaxBuyVolume(e.target.value)} 
                  className="mt-1"
                  placeholder="e.g., 5000"
                />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-1">Trading Rules (Optional)</h2>
            <p className="text-sm text-muted-foreground mb-4">Define the entry and exit conditions for your strategy</p>
            
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
