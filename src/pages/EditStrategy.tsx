
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Save, X, Plus, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { Inequality, RuleGroupData } from "@/components/strategy-detail/types";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { getFmpApiKey, searchStocks, searchCryptocurrencies, Asset } from "@/services/assetApiService";
import { debounce } from "lodash";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { getStrategyById, getRiskManagementForStrategy, getTradingRulesForStrategy, Strategy } from "@/services/strategyService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const marketAssets = {
  Stocks: ["AAPL - Apple Inc.", "MSFT - Microsoft Corporation", "GOOGL - Alphabet Inc.", "AMZN - Amazon.com Inc.", "META - Meta Platforms Inc.", "TSLA - Tesla Inc.", "NVDA - NVIDIA Corporation", "JPM - JPMorgan Chase & Co."],
  Crypto: ["BTC/USD - Bitcoin / US Dollar", "ETH/USD - Ethereum / US Dollar", "XRP/USD - Ripple / US Dollar", "SOL/USD - Solana / US Dollar", "ADA/USD - Cardano / US Dollar", "DOT/USD - Polkadot / US Dollar", "LINK/USD - Chainlink / US Dollar"]
};

const EditStrategy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { strategyId } = useParams<{ strategyId: string }>();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [activeTab, setActiveTab] = useState("trading-rules");
  const [strategyName, setStrategyName] = useState("");
  const [description, setDescription] = useState("");
  const [market, setMarket] = useState("");
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
  
  // Define form with React Hook Form
  const form = useForm({
    defaultValues: {
      strategyName: "",
      description: "",
      market: "",
      timeframe: "",
      targetAsset: "",
      isActive: true,
      stopLoss: "",
      takeProfit: "",
      singleBuyVolume: "",
      maxBuyVolume: ""
    }
  });
  
  // Trading rules state
  const [entryRules, setEntryRules] = useState<RuleGroupData[]>([]);
  const [exitRules, setExitRules] = useState<RuleGroupData[]>([]);

  // Fetch strategy data when component mounts
  useEffect(() => {
    const fetchStrategyData = async () => {
      if (!strategyId) {
        toast({
          title: "Error",
          description: "No strategy ID provided",
          variant: "destructive"
        });
        navigate('/strategies');
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Fetching strategy with ID: ${strategyId}`);
        
        // Fetch strategy basic data (now including risk management data)
        const strategy = await getStrategyById(strategyId);
        if (!strategy) {
          toast({
            title: "Strategy Not Found",
            description: "The requested strategy could not be found",
            variant: "destructive"
          });
          navigate('/strategies');
          return;
        }
        
        // Set basic strategy data to state
        setStrategyName(strategy.name);
        setDescription(strategy.description || "");
        setMarket(strategy.market || "");
        setTimeframe(strategy.timeframe || "");
        setTargetAsset(strategy.targetAsset || "");
        setIsActive(strategy.isActive);
        
        // Set risk management data directly from strategy object
        setStopLoss(strategy.stopLoss || "5");
        setTakeProfit(strategy.takeProfit || "15");
        setSingleBuyVolume(strategy.singleBuyVolume || "1000");
        setMaxBuyVolume(strategy.maxBuyVolume || "5000");
        
        // Update form default values
        form.reset({
          strategyName: strategy.name,
          description: strategy.description || "",
          market: strategy.market,
          timeframe: strategy.timeframe,
          targetAsset: strategy.targetAsset || "",
          isActive: strategy.isActive,
          stopLoss: strategy.stopLoss || "5",
          takeProfit: strategy.takeProfit || "15",
          singleBuyVolume: strategy.singleBuyVolume || "1000",
          maxBuyVolume: strategy.maxBuyVolume || "5000"
        });
        
        // Fetch trading rules
        const rulesData = await getTradingRulesForStrategy(strategyId);
        if (rulesData) {
          setEntryRules(rulesData.entryRules);
          setExitRules(rulesData.exitRules);
        } else {
          // Set default rules if none exist
          setEntryRules([{
            id: 1,
            logic: "AND",
            inequalities: [{
              id: 1,
              left: {
                type: "indicator",
                indicator: "SMA",
                parameters: {
                  period: "20"
                }
              },
              condition: "Crosses Above",
              right: {
                type: "indicator",
                indicator: "SMA",
                parameters: {
                  period: "50"
                }
              }
            }]
          }]);
          
          setExitRules([{
            id: 1,
            logic: "AND",
            inequalities: [{
              id: 1,
              left: {
                type: "indicator",
                indicator: "SMA",
                parameters: {
                  period: "20"
                }
              },
              condition: "Crosses Below",
              right: {
                type: "indicator",
                indicator: "SMA",
                parameters: {
                  period: "50"
                }
              }
            }]
          }]);
        }
        
        console.log("Strategy data loaded successfully");
      } catch (error) {
        console.error("Error fetching strategy data:", error);
        toast({
          title: "Error Loading Strategy",
          description: "Failed to load strategy details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStrategyData();
  }, [strategyId, navigate, toast, form]);

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
            title: "API Connection Issue",
            description: "Unable to connect to financial data service",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching API key in EditStrategy:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, [toast]);

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
          console.log("Retrieved API key during search");
        } else {
          throw new Error("No API key available");
        }
      }
      
      let results: Asset[] = [];
      
      if (market === "Stocks") {
        results = await searchStocks(query, apiKey || "");
      } else {
        results = await searchCryptocurrencies(query, apiKey || "");
      }
      
      console.log(`Search returned ${results.length} results for "${query}"`);
      setSearchResults(results);
      
      if (results.length === 0 && query.length > 0) {
        toast({
          title: "No Results Found",
          description: `No ${market.toLowerCase()} found matching "${query}"`
        });
      }
    } catch (error) {
      console.error(`Error searching ${market}:`, error);
      
      // Attempt to get a fresh API key and retry
      try {
        console.log("Attempting to refresh API key and retry search");
        const newKey = await getFmpApiKey();
        if (newKey && newKey !== apiKey) {
          setApiKey(newKey);
          
          // Retry the search with the new key
          let retryResults: Asset[] = [];
          if (market === "Stocks") {
            retryResults = await searchStocks(query, newKey);
          } else {
            retryResults = await searchCryptocurrencies(query, newKey);
          }
          
          setSearchResults(retryResults);
          console.log(`Retry search returned ${retryResults.length} results for "${query}"`);
          
          if (retryResults.length === 0 && query.length > 0) {
            toast({
              title: "No Results Found",
              description: `No ${market.toLowerCase()} found matching "${query}"`
            });
          }
        }
      } catch (retryError) {
        console.error("Retry search failed:", retryError);
        
        // Show error toast only if we have a query
        if (query.length > 0) {
          toast({
            title: "Search Failed",
            description: "Could not connect to financial data service",
            variant: "destructive"
          });
        }
        
        // Set empty results
        setSearchResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // Trigger search when query changes or search dialog opens
  useEffect(() => {
    if (isSearchOpen && searchQuery) {
      searchAssets(searchQuery);
    }
  }, [searchQuery, isSearchOpen, searchAssets]);

  // Handle search dialog open
  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  // Select asset and close dialog
  const handleSelectAsset = (asset: Asset) => {
    setTargetAsset(asset.symbol);
    setTargetAssetName(asset.name || "");
    setIsSearchOpen(false);
  };

  const handleCancel = () => {
    navigate(-1);
  };
  
  const handleSave = async () => {
    if (!strategyId) return;
    
    try {
      setIsSaving(true);
      
      // Update strategy information including risk management data
      const { error: strategyError } = await supabase
        .from('strategies')
        .update({
          name: strategyName,
          description: description,
          market: market,
          timeframe: timeframe,
          target_asset: targetAsset,
          is_active: isActive,
          stop_loss: stopLoss,
          take_profit: takeProfit,
          single_buy_volume: singleBuyVolume,
          max_buy_volume: maxBuyVolume,
          updated_at: new Date().toISOString()
        })
        .eq('id', strategyId);

      if (strategyError) {
        throw new Error(`Error updating strategy: ${strategyError.message}`);
      }

      // For trading rules, we'll delete existing ones and insert the new ones
      // Delete existing entry rules for this strategy
      const { error: deleteEntryError } = await supabase
        .from('trading_rules')
        .delete()
        .eq('strategy_id', strategyId)
        .eq('rule_type', 'entry');

      if (deleteEntryError) {
        throw new Error(`Error deleting entry rules: ${deleteEntryError.message}`);
      }

      // Delete existing exit rules for this strategy
      const { error: deleteExitError } = await supabase
        .from('trading_rules')
        .delete()
        .eq('strategy_id', strategyId)
        .eq('rule_type', 'exit');

      if (deleteExitError) {
        throw new Error(`Error deleting exit rules: ${deleteExitError.message}`);
      }

      // Insert new entry rules
      for (const group of entryRules) {
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
              strategy_id: strategyId,
              rule_group: group.id,
              rule_type: 'entry',
              left_type: inequality.left.type,
              left_indicator: inequality.left.indicator,
              left_parameters: inequality.left.parameters,
              condition: inequality.condition,
              right_type: inequality.right.type,
              right_indicator: inequality.right.indicator,
              right_parameters: inequality.right.parameters,
              right_value: inequality.right.value,
              logic: i === 0 ? group.logic : 'and'
            });
            
          if (ruleError) {
            throw new Error(`Error saving entry rule: ${ruleError.message}`);
          }
        }
      }

      // Insert new exit rules
      for (const group of exitRules) {
        for (let i = 0; i < group.inequalities.length; i++) {
          const inequality = group.inequalities[i];
          
          const { error: ruleError } = await supabase
            .from('trading_rules')
            .insert({
              strategy_id: strategyId,
              rule_group: group.id,
              rule_type: 'exit',
              left_type: inequality.left.type,
              left_indicator: inequality.left.indicator,
              left_parameters: inequality.left.parameters,
              condition: inequality.condition,
              right_type: inequality.right.type,
              right_indicator: inequality.right.indicator,
              right_parameters: inequality.right.parameters,
              right_value: inequality.right.value,
              logic: i === 0 ? group.logic : 'and'
            });
            
          if (ruleError) {
            throw new Error(`Error saving exit rule: ${ruleError.message}`);
          }
        }
      }

      toast({
        title: "Strategy updated",
        description: "Your strategy has been successfully updated."
      });
      navigate(`/strategy/${strategyId}`);
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast({
        title: "Error saving strategy",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleStatusChange = (checked: boolean) => {
    setIsActive(checked);
    toast({
      title: checked ? "Strategy activated" : "Strategy deactivated",
      description: `The strategy is now ${checked ? "active" : "inactive"} and will ${checked ? "" : "not"} generate trading signals.`
    });
  };
  
  const addEntryRule = () => {
    const updatedRules = [...entryRules];
    if (updatedRules[0] && updatedRules[0].inequalities) {
      const ruleIndex = updatedRules[0].inequalities.length;
      const newRule: Inequality = {
        id: ruleIndex + 1,
        left: {
          type: "indicator",
          indicator: "SMA",
          parameters: {
            period: "20"
          }
        },
        condition: "Crosses Above",
        right: {
          type: "indicator",
          indicator: "SMA",
          parameters: {
            period: "50"
          }
        }
      };
      updatedRules[0].inequalities.push(newRule);
      setEntryRules(updatedRules);
    }
  };
  
  const addExitRule = () => {
    const updatedRules = [...exitRules];
    if (updatedRules[0] && updatedRules[0].inequalities) {
      const ruleIndex = updatedRules[0].inequalities.length;
      const newRule: Inequality = {
        id: ruleIndex + 1,
        left: {
          type: "indicator",
          indicator: "SMA",
          parameters: {
            period: "20"
          }
        },
        condition: "Crosses Below",
        right: {
          type: "indicator",
          indicator: "SMA",
          parameters: {
            period: "50"
          }
        }
      };
      updatedRules[0].inequalities.push(newRule);
      setExitRules(updatedRules);
    }
  };
  
  const removeEntryRule = (id: number) => {
    const updatedRules = entryRules.map(group => ({
      ...group,
      inequalities: group.inequalities.filter(rule => rule.id !== id)
    }));
    setEntryRules(updatedRules);
  };
  
  const removeExitRule = (id: number) => {
    const updatedRules = exitRules.map(group => ({
      ...group,
      inequalities: group.inequalities.filter(rule => rule.id !== id)
    }));
    setExitRules(updatedRules);
  };
  
  const updateEntryRule = (id: number, field: string, value: string) => {
    const updatedRules = entryRules.map(group => ({
      ...group,
      inequalities: group.inequalities.map(rule => rule.id === id ? {
        ...rule,
        [field]: value
      } : rule)
    }));
    setEntryRules(updatedRules);
  };
  
  const updateExitRule = (id: number, field: string, value: string) => {
    const updatedRules = exitRules.map(group => ({
      ...group,
      inequalities: group.inequalities.map(rule => rule.id === id ? {
        ...rule,
        [field]: value
      } : rule)
    }));
    setExitRules(updatedRules);
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
            
            <Form {...form}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Strategy Name</Label>
                  <Input id="name" value={strategyName} onChange={e => setStrategyName(e.target.value)} className="mt-1" />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 resize-none" rows={3} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="market">Market</Label>
                    <Select value={market} onValueChange={setMarket}>
                      <SelectTrigger id="market" className="mt-1">
                        <SelectValue placeholder="Select Market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stocks">Stocks</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                      </SelectContent>
                    </Select>
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
                      : market === "Stocks" 
                        ? "Search for a stock..."
                        : "Search for a cryptocurrency..."
                    }
                  </Button>
                  
                  <CommandDialog 
                    open={isSearchOpen} 
                    onOpenChange={(open) => {
                      setIsSearchOpen(open);
                      if (!open) {
                        // Clear the search query when closing the dialog
                        setTimeout(() => {
                          setSearchQuery("");
                        }, 100);
                      }
                    }}
                  >
                    <DialogTitle className="sr-only">
                      {market === "Stocks" ? "Search Stocks" : "Search Cryptocurrencies"}
                    </DialogTitle>
                    <CommandInput 
                      placeholder={market === "Stocks" ? "Search all US stocks..." : "Search cryptocurrencies..."} 
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
            </Form>
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
            
            <TradingRules entryRules={entryRules} exitRules={exitRules} editable={true} onEntryRulesChange={handleEntryRulesChange} onExitRulesChange={handleExitRulesChange} />
            
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditStrategy;
