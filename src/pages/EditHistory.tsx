
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Inequality, RuleGroupData } from "@/components/strategy-detail/types";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { getStrategyById, getTradingRulesForStrategy, getRiskManagementForStrategy } from "@/services/strategyService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RuleData {
  id: number;
  type: string;
  condition: string;
  value: string;
  inequalities?: Inequality[];
  requiredConditions?: number;
  logic?: string;
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
  entryRules?: RuleGroupData[];
  exitRules?: RuleGroupData[];
}

interface ComparisonMode {
  active: boolean;
  selectedVersions: string[];
}

const convertToRuleGroupData = (rules: any): RuleGroupData[] => {
  if (!rules) return [];
  return rules.map((rule: any) => ({
    id: rule.id,
    logic: rule.logic,
    inequalities: rule.inequalities || [],
    requiredConditions: rule.requiredConditions
  }));
};

const EditHistory = () => {
  const { strategyId } = useParams<{ strategyId: string; }>();
  const [strategyName, setStrategyName] = useState<string>("");
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>({
    active: false,
    selectedVersions: []
  });
  const [openVersions, setOpenVersions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchVersionHistory = async () => {
      if (!strategyId) return;

      try {
        setLoading(true);

        // Fetch strategy details
        const strategy = await getStrategyById(strategyId);
        if (!strategy) {
          toast.error("Strategy not found");
          return;
        }

        setStrategyName(strategy.name);

        // Fetch strategy versions
        const { data: versionData, error: versionError } = await supabase
          .from("strategy_versions")
          .select("*")
          .eq("strategy_id", strategyId)
          .order("version_number", { ascending: false });

        if (versionError) {
          console.error("Error fetching versions:", versionError);
          toast.error("Failed to fetch version history");
          return;
        }

        // Fetch current strategy rules and risk management
        const [currentRules, currentRiskManagement] = await Promise.all([
          getTradingRulesForStrategy(strategyId),
          getRiskManagementForStrategy(strategyId)
        ]);

        // Create versions array starting with current version
        const versionsArray: VersionData[] = [];

        // Add current version as v0 (latest)
        const currentVersion: VersionData = {
          version: "Current",
          date: new Date(strategy.updatedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          time: new Date(strategy.updatedAt).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          name: strategy.name,
          description: strategy.description || "Current active version",
          parameters: {
            timeframe: strategy.timeframe,
            targetAsset: strategy.targetAsset || "",
          },
          riskManagement: currentRiskManagement ? {
            stopLoss: currentRiskManagement.stopLoss,
            takeProfit: currentRiskManagement.takeProfit,
            singleBuyVolume: currentRiskManagement.singleBuyVolume,
            maxBuyVolume: currentRiskManagement.maxBuyVolume
          } : undefined,
          entryRules: currentRules?.entryRules || [],
          exitRules: currentRules?.exitRules || [],
          status: strategy.isActive ? "active" : "inactive",
          isLatest: true,
          isSelected: true
        };

        versionsArray.push(currentVersion);

        // Add historical versions
        if (versionData && versionData.length > 0) {
          for (const version of versionData) {
            const versionItem: VersionData = {
              version: `v${version.version_number}`,
              date: new Date(version.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }),
              time: new Date(version.created_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              name: strategy.name,
              description: version.changes || "Historical version",
              parameters: {
                timeframe: strategy.timeframe,
                targetAsset: strategy.targetAsset || "",
              },
              status: "inactive",
              isLatest: false,
              isSelected: false
            };

            versionsArray.push(versionItem);
          }
        }

        setVersions(versionsArray);
        
        // Set first version as open by default
        if (versionsArray.length > 0) {
          setOpenVersions({ [versionsArray[0].version]: true });
          setComparisonMode(prev => ({
            ...prev,
            selectedVersions: [versionsArray[0].version]
          }));
        }

      } catch (error) {
        console.error("Error fetching version history:", error);
        toast.error("Failed to load version history");
      } finally {
        setLoading(false);
      }
    };

    fetchVersionHistory();
  }, [strategyId]);

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
    toast.info(`Revert to ${version} functionality coming soon`);
  };

  const comparisonVersions = versions.filter(v => comparisonMode.selectedVersions.includes(v.version)).sort((a, b) => {
    return comparisonMode.selectedVersions.indexOf(a.version) - comparisonMode.selectedVersions.indexOf(b.version);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Link to={`/strategy/${strategyId}`} className="text-sm flex items-center mb-4 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
              <h1 className="text-3xl font-bold">Edit History</h1>
              <p className="text-muted-foreground">Loading version history...</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
              
              {!comparisonMode.active && comparisonMode.selectedVersions.length === 2 && (
                <Button onClick={handleCompareSelectedVersions}>
                  Compare Selected Versions
                </Button>
              )}
              
              {comparisonMode.active && (
                <Button variant="outline" onClick={handleExitCompareMode}>
                  Exit Compare Mode
                </Button>
              )}
            </div>
          </div>
          
          {comparisonMode.active ? (
            <Card className="p-6">
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
                  <h3 className="text-lg font-medium mb-2">Trading Rules</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        {comparisonVersions[0]?.version}
                      </div>
                      <TradingRules 
                        entryRules={comparisonVersions[0]?.entryRules || []} 
                        exitRules={comparisonVersions[0]?.exitRules || []} 
                      />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        {comparisonVersions[1]?.version}
                      </div>
                      <TradingRules 
                        entryRules={comparisonVersions[1]?.entryRules || []} 
                        exitRules={comparisonVersions[1]?.exitRules || []} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {versions.map(version => (
                <Card key={version.version} className="overflow-hidden">
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-semibold flex items-center">
                            {version.version}
                            {version.isLatest && <Badge variant="outline" className="ml-2 text-xs">Latest</Badge>}
                            {version.isLatest && version.status === "active" && <Badge className="ml-2 bg-green-500 hover:bg-green-600">Current</Badge>}
                          </h2>
                        </div>
                        <div className="text-sm text-muted-foreground">{version.date}, {version.time}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {version.isSelected ? (
                          <Button variant="default" size="sm" className="bg-black hover:bg-black/90">Selected</Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={comparisonMode.selectedVersions.length >= 2 && !comparisonMode.selectedVersions.includes(version.version)} 
                            onClick={() => handleSelectForComparison(version.version)}
                          >
                            Select for Comparison
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleRevert(version.version)}>
                          <RotateCcw className="h-4 w-4" />
                          <span className="ml-1">Revert</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        className="flex justify-between items-center py-2 w-full md:w-auto" 
                        onClick={() => toggleVersionDetails(version.version)}
                      >
                        <div className="font-medium">
                          {openVersions[version.version] ? "Close Version Details" : "View Version Details"}
                        </div>
                        <div>
                          {openVersions[version.version] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </Button>
                      
                      {openVersions[version.version] && (
                        <div className="mt-4 space-y-6">
                          <div>
                            <div className="text-sm font-medium mb-1">Name</div>
                            <div>{version.name}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-1">Description</div>
                            <div>{version.description}</div>
                          </div>
                          
                          {version.riskManagement && (
                            <div>
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
                            </div>
                          )}
                          
                          {(version.entryRules || version.exitRules) && (
                            <div>
                              <div className="text-sm font-medium mb-2">Trading Rules</div>
                              <TradingRules 
                                entryRules={version.entryRules || []} 
                                exitRules={version.exitRules || []} 
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EditHistory;
