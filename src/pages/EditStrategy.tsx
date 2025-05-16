
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, X, Search, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { RuleGroupData, Inequality } from "@/components/strategy-detail/types";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { getFmpApiKey, searchStocks, Asset } from "@/services/assetApiService";
import { debounce } from "lodash";
import { getStrategyById, getTradingRulesForStrategy } from "@/services/strategyService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EditStrategy = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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

  // Fetch strategy data when component mounts
  useEffect(() => {
    const fetchStrategyData = async () => {
      if (!id) {
        toast({
          description: "No strategy ID provided"
        });
        navigate('/strategies');
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Fetching strategy with ID: ${id}`);
        
        // Fetch strategy basic data
        const strategy = await getStrategyById(id);
        if (!strategy) {
          toast({
            description: "The requested strategy could not be found"
          });
          navigate('/strategies');
          return;
        }
        
        // Set basic strategy data to state
        setStrategyName(strategy.name);
        setDescription(strategy.description || "");
        setTimeframe(strategy.timeframe || "");
        setTargetAsset(strategy.targetAsset || "");
        setIsActive(strategy.isActive);
        
        // Set risk management data
        setStopLoss(strategy.stopLoss || "5");
        setTakeProfit(strategy.takeProfit || "15");
        setSingleBuyVolume(strategy.singleBuyVolume || "1000");
        setMaxBuyVolume(strategy.maxBuyVolume || "5000");
        
        // Fetch trading rules
        const rulesData = await getTradingRulesForStrategy(id);
        
        // Check if we have valid rules
        if (rulesData) {
          console.log("Loaded trading rules:", rulesData);
          if (rulesData.entryRules && rulesData.entryRules.length > 0) {
            setEntryRules(rulesData.entryRules);
          } else {
            // Set empty entry rules structure
            setEntryRules([
              { id: 1, logic: "AND", inequalities: [] },
              { id: 2, logic: "OR", inequalities: [] }
            ]);
          }
          
          if (rulesData.exitRules && rulesData.exitRules.length > 0) {
            setExitRules(rulesData.exitRules);
          } else {
            // Set empty exit rules structure
            setExitRules([
              { id: 1, logic: "AND", inequalities: [] },
              { id: 2, logic: "OR", inequalities: [] }
            ]);
          }
        } else {
          // Set empty rules structure if no rules are found
          setEntryRules([
            { id: 1, logic: "AND", inequalities: [] },
            { id: 2, logic: "OR", inequalities: [] }
          ]);
          
          setExitRules([
            { id: 1, logic: "AND", inequalities: [] },
            { id: 2, logic: "OR", inequalities: [] }
          ]);
        }
        
        console.log("Strategy data loaded successfully");
      } catch (error) {
        console.error("Error fetching strategy data:", error);
        toast({
          description: "Failed to load strategy details"
        });
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
          toast({
            description: "Unable to connect to financial data service"
          });
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
        toast({
          description: `No assets found matching "${query}"`
        });
      }
    } catch (error) {
      console.error(`Error searching assets:`, error);
      toast({
        description: "Could not connect to financial data service"
      });
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
    navigate(-1);
  };
  
  const handleSave = async () => {
    if (!id) return;
    
    try {
      setIsSaving(true);
      
      // Update strategy information
      const { error: strategyError } = await supabase
        .from('strategies')
        .update({
          name: strategyName,
          description: description,
          timeframe: timeframe,
          target_asset: targetAsset,
          is_active: isActive,
          stop_loss: stopLoss,
          take_profit: takeProfit,
          single_buy_volume: singleBuyVolume,
          max_buy_volume: maxBuyVolume,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (strategyError) {
        throw new Error(`Error updating strategy: ${strategyError.message}`);
      }

      // Get all existing rule groups for this strategy
      const { data: existingRuleGroups, error: ruleGroupsError } = await supabase
        .from('rule_groups')
        .select('id, rule_type')
        .eq('strategy_id', id);

      if (ruleGroupsError) {
        throw new Error(`Error fetching rule groups: ${ruleGroupsError.message}`);
      }

      // Delete existing rule groups and their associated trading rules
      if (existingRuleGroups && existingRuleGroups.length > 0) {
        // Get the IDs of all rule groups
        const ruleGroupIds = existingRuleGroups.map(group => group.id);

        // Delete trading rules first (foreign key constraint)
        const { error: deleteRulesError } = await supabase
          .from('trading_rules')
          .delete()
          .in('rule_group_id', ruleGroupIds);

        if (deleteRulesError) {
          throw new Error(`Error deleting trading rules: ${deleteRulesError.message}`);
        }

        // Delete rule groups
        const { error: deleteGroupsError } = await supabase
          .from('rule_groups')
          .delete()
          .eq('strategy_id', id);

        if (deleteGroupsError) {
          throw new Error(`Error deleting rule groups: ${deleteGroupsError.message}`);
        }
      }

      // Create new entry rule groups and rules
      for (let groupIndex = 0; groupIndex < entryRules.length; groupIndex++) {
        const group = entryRules[groupIndex];
        
        // Insert the rule group
        const { data: entryGroup, error: entryGroupError } = await supabase
          .from('rule_groups')
          .insert({
            strategy_id: id,
            rule_type: 'entry',
            group_order: groupIndex + 1,
            logic: group.logic,
            required_conditions: group.logic === 'OR' ? group.requiredConditions : null
          })
          .select()
          .single();
          
        if (entryGroupError) {
          throw new Error(`Error creating entry rule group: ${entryGroupError.message}`);
        }

        // Add each inequality as a trading rule
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
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
            throw new Error(`Error saving entry rule: ${ruleError.message}`);
          }
        }
      }

      // Create new exit rule groups and rules
      for (let groupIndex = 0; groupIndex < exitRules.length; groupIndex++) {
        const group = exitRules[groupIndex];
        
        // Insert the rule group
        const { data: exitGroup, error: exitGroupError } = await supabase
          .from('rule_groups')
          .insert({
            strategy_id: id,
            rule_type: 'exit',
            group_order: groupIndex + 1,
            logic: group.logic,
            required_conditions: group.logic === 'OR' ? group.requiredConditions : null
          })
          .select()
          .single();
          
        if (exitGroupError) {
          throw new Error(`Error creating exit rule group: ${exitGroupError.message}`);
        }

        // Add each inequality as a trading rule
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
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
            throw new Error(`Error saving exit rule: ${ruleError.message}`);
          }
        }
      }

      toast({
        description: "Your strategy has been successfully updated."
      });
      navigate(`/strategy/${id}`);
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast({
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
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
            <Link to="/strategies" className="text-sm flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Strategy</h1>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
              </Button>
            </div>
          </div>
          
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-1">Basic Information</h2>
            <p className="text-sm text-muted-foreground mb-4">Edit the basic details of your strategy</p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Strategy Name</Label>
                <Input id="name" value={strategyName} onChange={e => setStrategyName(e.target.value)} className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 resize-none" rows={3} />
              </div>
              
              <div>
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger id="timeframe" className="mt-1">
                    <SelectValue placeholder="Select Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="30m">30 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="asset" className="block text-sm font-medium mb-2">Target Asset</Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-10"
                  onClick={handleSearchOpen}
                >
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  {targetAsset 
                    ? `${targetAsset}${targetAssetName ? ` - ${targetAssetName}` : ''}`
                    : "Search for stocks..."
                  }
                </Button>
                
                <CommandDialog 
                  open={isSearchOpen} 
                  onOpenChange={setIsSearchOpen}
                >
                  <DialogTitle className="sr-only">
                    Search Assets
                  </DialogTitle>
                  <CommandInput 
                    placeholder="Search for stocks..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    autoFocus={true}
                  />
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
                      {searchResults.map((asset) => (
                        <CommandItem
                          key={asset.symbol}
                          value={`${asset.symbol} ${asset.name}`}
                          onSelect={() => handleSelectAsset(asset)}
                        >
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
            <h2 className="text-xl font-semibold mb-1">Risk Management</h2>
            <p className="text-sm text-muted-foreground mb-4">Define your risk parameters and investment limits</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                <Input id="stopLoss" type="number" min="0" step="0.1" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="takeProfit">Take Profit (%)</Label>
                <Input id="takeProfit" type="number" min="0" step="0.1" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="mt-1" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <Label htmlFor="singleBuyVolume">Single Buy Volume ($)</Label>
                <Input id="singleBuyVolume" type="number" min="0" step="100" value={singleBuyVolume} onChange={e => setSingleBuyVolume(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="maxBuyVolume">Max Buy Volume ($)</Label>
                <Input id="maxBuyVolume" type="number" min="0" step="100" value={maxBuyVolume} onChange={e => setMaxBuyVolume(e.target.value)} className="mt-1" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-1">Trading Rules</h2>
            <p className="text-sm text-muted-foreground mb-4">Define the entry and exit conditions for your strategy</p>
            
            <TradingRules 
              entryRules={entryRules} 
              exitRules={exitRules} 
              editable={true} 
              onEntryRulesChange={handleEntryRulesChange} 
              onExitRulesChange={handleExitRulesChange} 
            />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditStrategy;
