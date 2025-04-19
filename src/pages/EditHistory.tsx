import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
interface RuleData {
  id: number;
  type: string;
  condition: string;
  value: string;
}
interface RiskManagementData {
  stopLoss: string;
  takeProfit: string;
  singleBuyVolume: string;
  maxBuyVolume: string;
}
interface VersionData {
  version: string;
  date: string;
  time: string;
  name: string;
  description: string;
  parameters: {
    [key: string]: string | number;
  };
  rules?: {
    entry: RuleData[];
    exit: RuleData[];
  };
  status: "active" | "inactive";
  isLatest?: boolean;
  isSelected?: boolean;
  riskManagement?: RiskManagementData;
}
interface ComparisonMode {
  active: boolean;
  selectedVersions: string[];
}
const EditHistory = () => {
  const {
    strategyId
  } = useParams<{
    strategyId: string;
  }>();
  const strategyName = strategyId ? strategyId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "RSI Strategy v2";
  const [versions, setVersions] = useState<VersionData[]>([{
    version: "v1.2",
    date: "Mar 28, 2024",
    time: "10:30 PM",
    name: "RSI Strategy v2",
    description: "Uses the Relative Strength Index to identify overbought and oversold conditions in the market.",
    parameters: {
      "period": 14,
      "overbought": 70,
      "oversold": 30
    },
    riskManagement: {
      stopLoss: "2.5",
      takeProfit: "5.0",
      singleBuyVolume: "1000",
      maxBuyVolume: "5000"
    },
    rules: {
      entry: [{
        id: 1,
        type: "RSI",
        condition: "Crosses Below",
        value: "30"
      }, {
        id: 2,
        type: "Price",
        condition: "Above",
        value: "SMA(20)"
      }],
      exit: [{
        id: 1,
        type: "RSI",
        condition: "Crosses Above",
        value: "70"
      }, {
        id: 2,
        type: "Stop Loss",
        condition: "Below",
        value: "2%"
      }]
    },
    status: "active",
    isLatest: true,
    isSelected: true
  }, {
    version: "v1.1",
    date: "Mar 25, 2024",
    time: "06:15 PM",
    name: "RSI Strategy",
    description: "Uses the Relative Strength Index to identify overbought and oversold conditions in the market.",
    parameters: {
      "period": 12,
      "overbought": 75,
      "oversold": 30
    },
    riskManagement: {
      stopLoss: "3.0",
      takeProfit: "4.5",
      singleBuyVolume: "800",
      maxBuyVolume: "4000"
    },
    rules: {
      entry: [{
        id: 1,
        type: "RSI",
        condition: "Crosses Below",
        value: "30"
      }],
      exit: [{
        id: 1,
        type: "RSI",
        condition: "Crosses Above",
        value: "75"
      }]
    },
    status: "active",
    isSelected: true
  }, {
    version: "v1.0",
    date: "Mar 20, 2024",
    time: "05:45 PM",
    name: "RSI Strategy Initial",
    description: "Initial implementation of RSI strategy.",
    parameters: {
      "period": 14,
      "overbought": 70,
      "oversold": 30
    },
    rules: {
      entry: [{
        id: 1,
        type: "RSI",
        condition: "Below",
        value: "30"
      }],
      exit: [{
        id: 1,
        type: "RSI",
        condition: "Above",
        value: "70"
      }]
    },
    status: "inactive"
  }, {
    version: "v0.1",
    date: "Mar 16, 2024",
    time: "12:20 AM",
    name: "RSI Draft",
    description: "Draft version of RSI strategy.",
    parameters: {
      "period": 10,
      "overbought": 80,
      "oversold": 20
    },
    rules: {
      entry: [{
        id: 1,
        type: "RSI",
        condition: "Below",
        value: "20"
      }],
      exit: [{
        id: 1,
        type: "RSI",
        condition: "Above",
        value: "80"
      }]
    },
    status: "inactive"
  }]);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>({
    active: false,
    selectedVersions: ["v1.2", "v1.1"]
  });
  const [openVersions, setOpenVersions] = useState<Record<string, boolean>>({
    "v1.2": true
  });
  const toggleVersionDetails = (version: string) => {
    setOpenVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }));
  };
  const handleSelectForComparison = (version: string) => {
    setComparisonMode(prev => {
      if (prev.selectedVersions.includes(version)) {
        return {
          ...prev,
          selectedVersions: prev.selectedVersions.filter(v => v !== version)
        };
      }
      if (prev.selectedVersions.length < 2) {
        return {
          ...prev,
          selectedVersions: [...prev.selectedVersions, version]
        };
      }
      return {
        ...prev,
        selectedVersions: [prev.selectedVersions[0], version]
      };
    });
  };
  const handleCompareSelectedVersions = () => {
    setComparisonMode(prev => ({
      ...prev,
      active: true
    }));
  };
  const handleExitCompareMode = () => {
    setComparisonMode(prev => ({
      ...prev,
      active: false
    }));
  };
  const handleRevert = (version: string) => {
    console.log(`Reverting to version ${version}`);
  };
  const comparisonVersions = versions.filter(v => comparisonMode.selectedVersions.includes(v.version)).sort((a, b) => {
    return comparisonMode.selectedVersions.indexOf(a.version) - comparisonMode.selectedVersions.indexOf(b.version);
  });
  return <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to={`/strategy/${strategyId}`} className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Edit History</h1>
                <p className="text-muted-foreground">View and manage the edit history for {strategyName}</p>
              </div>
              
              {!comparisonMode.active && comparisonMode.selectedVersions.length === 2 && <Button onClick={handleCompareSelectedVersions}>
                  Compare Selected Versions
                </Button>}
              
              {comparisonMode.active && <Button variant="outline" onClick={handleExitCompareMode}>
                  Exit Compare Mode
                </Button>}
            </div>
          </div>
          
          {comparisonMode.active ? <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-semibold">Version Comparison</h2>
                <p className="text-muted-foreground">
                  Comparing versions {comparisonVersions[0]?.version} and {comparisonVersions[1]?.version}
                </p>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-2">Name</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">{comparisonVersions[0]?.version}</div>
                      <div>{comparisonVersions[0]?.name}</div>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">{comparisonVersions[1]?.version}</div>
                      <div>{comparisonVersions[1]?.name}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">{comparisonVersions[0]?.version}</div>
                      <div>{comparisonVersions[0]?.description}</div>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground mb-1">{comparisonVersions[1]?.version}</div>
                      <div>{comparisonVersions[1]?.description}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Parameters</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>{comparisonVersions[0]?.version}</TableHead>
                        <TableHead>{comparisonVersions[1]?.version}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys({
                    ...comparisonVersions[0]?.parameters,
                    ...comparisonVersions[1]?.parameters
                  }).map(param => <TableRow key={param}>
                          <TableCell className="font-medium">{param}</TableCell>
                          <TableCell>{comparisonVersions[0]?.parameters[param]}</TableCell>
                          <TableCell>{comparisonVersions[1]?.parameters[param]}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Trading Rules</h3>
                  
                  {/* Entry Rules Comparison */}
                  <div className="mb-6">
                    <h4 className="text-base font-medium mb-2">Entry Rules</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Math.max(comparisonVersions[0]?.rules?.entry?.length || 0, comparisonVersions[1]?.rules?.entry?.length || 0) > 0 ? Array.from({
                      length: Math.max(comparisonVersions[0]?.rules?.entry?.length || 0, comparisonVersions[1]?.rules?.entry?.length || 0)
                    }).map((_, index) => <TableRow key={`entry-${index}`}>
                              <TableCell>{comparisonVersions[0]?.rules?.entry[index]?.type || "-"}</TableCell>
                              <TableCell>{comparisonVersions[0]?.rules?.entry[index]?.condition || "-"}</TableCell>
                              <TableCell>{comparisonVersions[0]?.rules?.entry[index]?.value || "-"}</TableCell>
                              <TableCell>{comparisonVersions[1]?.rules?.entry[index]?.type || "-"}</TableCell>
                              <TableCell>{comparisonVersions[1]?.rules?.entry[index]?.condition || "-"}</TableCell>
                              <TableCell>{comparisonVersions[1]?.rules?.entry[index]?.value || "-"}</TableCell>
                            </TableRow>) : <TableRow>
                            <TableCell colSpan={6} className="text-center">No entry rules defined</TableCell>
                          </TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Exit Rules Comparison */}
                  <div>
                    <h4 className="text-base font-medium mb-2">Exit Rules</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Math.max(comparisonVersions[0]?.rules?.exit?.length || 0, comparisonVersions[1]?.rules?.exit?.length || 0) > 0 ? Array.from({
                      length: Math.max(comparisonVersions[0]?.rules?.exit?.length || 0, comparisonVersions[1]?.rules?.exit?.length || 0)
                    }).map((_, index) => <TableRow key={`exit-${index}`}>
                              <TableCell>{comparisonVersions[0]?.rules?.exit[index]?.type || "-"}</TableCell>
                              <TableCell>{comparisonVersions[0]?.rules?.exit[index]?.condition || "-"}</TableCell>
                              <TableCell>{comparisonVersions[0]?.rules?.exit[index]?.value || "-"}</TableCell>
                              <TableCell>{comparisonVersions[1]?.rules?.exit[index]?.type || "-"}</TableCell>
                              <TableCell>{comparisonVersions[1]?.rules?.exit[index]?.condition || "-"}</TableCell>
                              <TableCell>{comparisonVersions[1]?.rules?.exit[index]?.value || "-"}</TableCell>
                            </TableRow>) : <TableRow>
                            <TableCell colSpan={6} className="text-center">No exit rules defined</TableCell>
                          </TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
              </div>
            </Card> : <div className="space-y-4">
              {versions.map(version => <Card key={version.version} className="overflow-hidden">
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-semibold flex items-center">
                            {version.version} 
                            {version.isLatest && <Badge variant="outline" className="ml-2 text-xs">Latest</Badge>}
                          </h2>
                        </div>
                        <div className="text-sm text-muted-foreground">{version.date}, {version.time}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {version.isSelected ? <Button variant="default" size="sm" className="bg-black hover:bg-black/90">Selected</Button> : <Button variant="outline" size="sm" disabled={comparisonMode.selectedVersions.length >= 2 && !comparisonMode.selectedVersions.includes(version.version)} onClick={() => handleSelectForComparison(version.version)}>
                            Select for Comparison
                          </Button>}
                        <Button variant="outline" size="sm" onClick={() => handleRevert(version.version)}>
                          <RotateCcw className="h-4 w-4" />
                          <span className="ml-1">Revert</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline" className="flex justify-between items-center py-2 w-full md:w-auto" onClick={() => toggleVersionDetails(version.version)}>
                        <div className="font-medium">
                          {openVersions[version.version] ? "Close Version Details" : "View Version Details"}
                        </div>
                        <div>
                          {openVersions[version.version] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </Button>
                      
                      {openVersions[version.version] && <div className="mt-4 space-y-6">
                          <div>
                            <div className="text-sm font-medium mb-1">Name</div>
                            <div>{version.name}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-1">Description</div>
                            <div>{version.description}</div>
                          </div>
                          
                          {version.riskManagement && <div>
                              <div className="text-sm font-medium mb-2">Risk Management</div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Stop Loss</p>
                                  <p className="font-medium text-red-500">{version.riskManagement.stopLoss}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Take Profit</p>
                                  <p className="font-medium text-green-500">{version.riskManagement.takeProfit}%</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Single Buy Volume</p>
                                  <p className="font-medium">${version.riskManagement.singleBuyVolume}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Max Buy Volume</p>
                                  <p className="font-medium">${version.riskManagement.maxBuyVolume}</p>
                                </div>
                              </div>
                            </div>}
                          
                          {version.rules && <div>
                              <div className="text-sm font-medium mb-2">Trading Rules</div>
                              
                              {/* Entry Rules */}
                              <div className="mb-4">
                                <h4 className="text-sm mb-2 font-medium">Entry Rules</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Condition</TableHead>
                                      <TableHead>Value</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {version.rules.entry.length > 0 ? version.rules.entry.map(rule => <TableRow key={rule.id}>
                                          <TableCell>{rule.type}</TableCell>
                                          <TableCell>{rule.condition}</TableCell>
                                          <TableCell>{rule.value}</TableCell>
                                        </TableRow>) : <TableRow>
                                        <TableCell colSpan={3} className="text-center">No entry rules defined</TableCell>
                                      </TableRow>}
                                  </TableBody>
                                </Table>
                              </div>
                              
                              {/* Exit Rules */}
                              <div>
                                <h4 className="text-sm font-medium mb-2">Exit Rules</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Condition</TableHead>
                                      <TableHead>Value</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {version.rules.exit.length > 0 ? version.rules.exit.map(rule => <TableRow key={rule.id}>
                                          <TableCell>{rule.type}</TableCell>
                                          <TableCell>{rule.condition}</TableCell>
                                          <TableCell>{rule.value}</TableCell>
                                        </TableRow>) : <TableRow>
                                        <TableCell colSpan={3} className="text-center">No exit rules defined</TableCell>
                                      </TableRow>}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>}
                        </div>}
                    </div>
                  </div>
                </Card>)}
            </div>}
        </div>
      </main>
    </div>;
};
export default EditHistory;