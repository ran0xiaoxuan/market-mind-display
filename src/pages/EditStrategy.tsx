
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/Badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const EditStrategy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("parameters");
  
  // Form state
  const [strategyName, setStrategyName] = useState("Moving Average Crossover");
  const [description, setDescription] = useState("A strategy that generates signals based on when a faster moving average crosses a slower moving average.");
  const [market, setMarket] = useState("Stocks");
  const [timeframe, setTimeframe] = useState("Daily");
  const [targetAsset, setTargetAsset] = useState("AAPL - Apple Inc.");
  const [isActive, setIsActive] = useState(true);
  
  // Parameters
  const [fastPeriod, setFastPeriod] = useState("20");
  const [slowPeriod, setSlowPeriod] = useState("50");
  const [signalPeriod, setSignalPeriod] = useState("9");
  
  // Entry & exit rules
  const [entryRules, setEntryRules] = useState([
    {
      id: 1,
      indicator: "SMA",
      condition: "Crosses Above",
      value: "SMA",
      indicatorPeriod: "20",
      valuePeriod: "50",
    }
  ]);
  
  const [exitRules, setExitRules] = useState([
    {
      id: 1,
      indicator: "SMA",
      condition: "Crosses Below",
      value: "SMA",
      indicatorPeriod: "20",
      valuePeriod: "50",
    }
  ]);

  // Handlers
  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = () => {
    toast({
      title: "Strategy updated",
      description: "Your strategy has been successfully updated.",
    });
    navigate(-1);
  };
  
  const addEntryRule = () => {
    setEntryRules([...entryRules, {
      id: entryRules.length + 1,
      indicator: "SMA",
      condition: "Crosses Above",
      value: "SMA",
      indicatorPeriod: "20",
      valuePeriod: "50",
    }]);
  };
  
  const addExitRule = () => {
    setExitRules([...exitRules, {
      id: exitRules.length + 1,
      indicator: "SMA",
      condition: "Crosses Below",
      value: "SMA",
      indicatorPeriod: "20",
      valuePeriod: "50",
    }]);
  };
  
  const removeEntryRule = (id) => {
    setEntryRules(entryRules.filter(rule => rule.id !== id));
  };
  
  const removeExitRule = (id) => {
    setExitRules(exitRules.filter(rule => rule.id !== id));
  };
  
  const updateEntryRule = (id, field, value) => {
    setEntryRules(entryRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };
  
  const updateExitRule = (id, field, value) => {
    setExitRules(exitRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header section */}
          <div className="flex items-center mb-6">
            <Link to="/strategies" className="text-sm flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            <h1 className="text-2xl font-bold ml-4">Edit Strategy</h1>
          </div>
          
          <p className="text-muted-foreground mb-6">Modify your trading strategy settings</p>
          
          {/* Action Buttons */}
          <div className="flex justify-end mb-6 gap-2">
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
          
          {/* Basic Information */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-1">Basic Information</h2>
            <p className="text-sm text-muted-foreground mb-4">Edit the basic details of your strategy</p>
            
            <div className="space-y-4">
              <div>
                <FormLabel htmlFor="name">Strategy Name</FormLabel>
                <Input 
                  id="name" 
                  value={strategyName} 
                  onChange={(e) => setStrategyName(e.target.value)} 
                  className="mt-1"
                />
              </div>
              
              <div>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="market">Market</FormLabel>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger id="market" className="mt-1">
                      <SelectValue placeholder="Select Market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stocks">Stocks</SelectItem>
                      <SelectItem value="Forex">Forex</SelectItem>
                      <SelectItem value="Crypto">Crypto</SelectItem>
                      <SelectItem value="Futures">Futures</SelectItem>
                      <SelectItem value="Options">Options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <FormLabel htmlFor="timeframe">Timeframe</FormLabel>
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
                <FormLabel htmlFor="asset">Target Asset</FormLabel>
                <Input 
                  id="asset" 
                  value={targetAsset} 
                  onChange={(e) => setTargetAsset(e.target.value)} 
                  className="mt-1"
                />
              </div>
              
              <div>
                <FormLabel>Strategy Status</FormLabel>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className={isActive ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                  <p className="text-sm text-muted-foreground ml-2">
                    This strategy is currently {isActive ? "active" : "inactive"} and will {isActive ? "" : "not"} generate trading signals.
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Tabs for Parameters and Rules */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="trading-rules">Trading Rules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="parameters" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-1">Strategy Parameters</h2>
                <p className="text-sm text-muted-foreground mb-4">Configure the parameters for this strategy</p>
                
                <div className="space-y-4">
                  <div>
                    <FormLabel htmlFor="fast-period">Fast Period</FormLabel>
                    <Input 
                      id="fast-period" 
                      type="number" 
                      value={fastPeriod} 
                      onChange={(e) => setFastPeriod(e.target.value)} 
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <FormLabel htmlFor="slow-period">Slow Period</FormLabel>
                    <Input 
                      id="slow-period" 
                      type="number" 
                      value={slowPeriod} 
                      onChange={(e) => setSlowPeriod(e.target.value)} 
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <FormLabel htmlFor="signal-period">Signal Period</FormLabel>
                    <Input 
                      id="signal-period" 
                      type="number" 
                      value={signalPeriod} 
                      onChange={(e) => setSignalPeriod(e.target.value)} 
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="trading-rules" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-1">Trading Rules</h2>
                <p className="text-sm text-muted-foreground mb-4">Define the entry and exit conditions for your strategy</p>
                
                {/* Entry Rules */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Entry Rules</h3>
                  
                  {entryRules.map((rule) => (
                    <div key={rule.id} className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Inequality {rule.id}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEntryRule(rule.id)}
                          disabled={entryRules.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                          <FormLabel>Indicator</FormLabel>
                          <Select 
                            value={rule.indicator} 
                            onValueChange={(value) => updateEntryRule(rule.id, "indicator", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SMA">SMA</SelectItem>
                              <SelectItem value="EMA">EMA</SelectItem>
                              <SelectItem value="RSI">RSI</SelectItem>
                              <SelectItem value="MACD">MACD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <FormLabel>Condition</FormLabel>
                          <Select 
                            value={rule.condition} 
                            onValueChange={(value) => updateEntryRule(rule.id, "condition", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Crosses Above">Crosses Above</SelectItem>
                              <SelectItem value="Crosses Below">Crosses Below</SelectItem>
                              <SelectItem value="Greater Than">Greater Than</SelectItem>
                              <SelectItem value="Less Than">Less Than</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <FormLabel>Value</FormLabel>
                          <Select 
                            value={rule.value} 
                            onValueChange={(value) => updateEntryRule(rule.id, "value", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SMA">SMA</SelectItem>
                              <SelectItem value="EMA">EMA</SelectItem>
                              <SelectItem value="Price">Price</SelectItem>
                              <SelectItem value="Level">Level</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Parameters Period</FormLabel>
                          <Input 
                            type="number"
                            value={rule.indicatorPeriod}
                            onChange={(e) => updateEntryRule(rule.id, "indicatorPeriod", e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <FormLabel>Value Parameters Period</FormLabel>
                          <Input 
                            type="number"
                            value={rule.valuePeriod}
                            onChange={(e) => updateEntryRule(rule.id, "valuePeriod", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={addEntryRule}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Inequality
                  </Button>
                </div>
                
                {/* Exit Rules */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Exit Rules</h3>
                  
                  {exitRules.map((rule) => (
                    <div key={rule.id} className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Inequality {rule.id}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExitRule(rule.id)}
                          disabled={exitRules.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                          <FormLabel>Indicator</FormLabel>
                          <Select 
                            value={rule.indicator} 
                            onValueChange={(value) => updateExitRule(rule.id, "indicator", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SMA">SMA</SelectItem>
                              <SelectItem value="EMA">EMA</SelectItem>
                              <SelectItem value="RSI">RSI</SelectItem>
                              <SelectItem value="MACD">MACD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <FormLabel>Condition</FormLabel>
                          <Select 
                            value={rule.condition} 
                            onValueChange={(value) => updateExitRule(rule.id, "condition", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Crosses Above">Crosses Above</SelectItem>
                              <SelectItem value="Crosses Below">Crosses Below</SelectItem>
                              <SelectItem value="Greater Than">Greater Than</SelectItem>
                              <SelectItem value="Less Than">Less Than</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <FormLabel>Value</FormLabel>
                          <Select 
                            value={rule.value} 
                            onValueChange={(value) => updateExitRule(rule.id, "value", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SMA">SMA</SelectItem>
                              <SelectItem value="EMA">EMA</SelectItem>
                              <SelectItem value="Price">Price</SelectItem>
                              <SelectItem value="Level">Level</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Parameters Period</FormLabel>
                          <Input 
                            type="number"
                            value={rule.indicatorPeriod}
                            onChange={(e) => updateExitRule(rule.id, "indicatorPeriod", e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <FormLabel>Value Parameters Period</FormLabel>
                          <Input 
                            type="number"
                            value={rule.valuePeriod}
                            onChange={(e) => updateExitRule(rule.id, "valuePeriod", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={addExitRule}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Inequality
                  </Button>
                </div>
                
                <div className="flex justify-end">
                  <Button className="gap-2">
                    <Save className="h-4 w-4" /> Save Rules
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EditStrategy;
