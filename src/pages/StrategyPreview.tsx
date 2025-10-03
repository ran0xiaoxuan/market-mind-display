
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { saveGeneratedStrategy, GeneratedStrategy } from "@/services/strategyService";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";

const StrategyPreview = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the generated strategy from location state
  const generatedStrategy = location.state?.generatedStrategy as GeneratedStrategy;

  if (!generatedStrategy) {
    // If no strategy data, redirect back to AI strategy page
    navigate('/ai-strategy');
    return null;
  }

  const handleSaveStrategy = async () => {
    if (!generatedStrategy) return;
    
    if (!user) {
      toast.error("Please log in to save your strategy");
      navigate(`/auth/login`);
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log("Saving strategy:", generatedStrategy);
      
      const strategyId = await saveGeneratedStrategy(generatedStrategy, user.id);
      console.log("Strategy saved with ID:", strategyId);
      
      toast.success("Your strategy has been saved successfully");
      navigate(`/strategy/${strategyId}`);
    } catch (error: any) {
      console.error("Error saving strategy:", error);
      
      if (error.message?.includes("authentication") || error.code === 'PGRST301') {
        toast.error("Please log in to save your strategy");
        navigate(`/auth/login`);
      } else if (error.message?.includes("row-level security") || error.code === 'PGRST204') {
        toast.error("You don't have permission to save this strategy. Please log out and log back in.");
      } else {
        toast.error(error.message || "Failed to save strategy. Please try again later");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAnother = () => {
    navigate('/ai-strategy');
  };

  // Convert GeneratedStrategy format to RuleGroupData format for display
  const formatRulesForDisplay = (rules: GeneratedStrategy['entryRules'] | GeneratedStrategy['exitRules']) => {
    return rules.map((rule, index) => ({
      id: index + 1,
      logic: rule.logic,
      requiredConditions: rule.requiredConditions,
      inequalities: rule.inequalities.map((inequality, inequalityIndex) => ({
        id: inequalityIndex + 1,
        left: inequality.left,
        condition: inequality.condition,
        right: inequality.right,
        explanation: inequality.explanation
      }))
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          <div className="flex flex-col mb-6">
            <Button variant="outline" onClick={handleGenerateAnother} className="mb-4 self-start">
              Generate Another Strategy
            </Button>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">{generatedStrategy.name}</h1>
                  <Button onClick={handleSaveStrategy} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Strategy"}
                  </Button>
                </div>
                
                <div className="mt-2 rounded-md bg-muted/50 p-4">
                  <p className="whitespace-pre-line text-sm">
                    {generatedStrategy.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 mt-6">
              <h2 className="text-xl font-semibold mb-6">Strategy Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Timeframe</p>
                  <p className="font-medium">{generatedStrategy.timeframe}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Asset</p>
                  <p className="font-medium">{generatedStrategy.targetAsset || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strategy Capital</p>
                  <p className="font-medium">${(generatedStrategy.accountCapital || 10000).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Tolerance</p>
                  <p className="font-medium capitalize">
                    {generatedStrategy.riskTolerance || 'moderate'}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({generatedStrategy.riskTolerance === 'conservative' ? '5-10% per trade' : 
                        generatedStrategy.riskTolerance === 'aggressive' ? '15-25% per trade' : 
                        '10-15% per trade'})
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <TradingRules 
            entryRules={formatRulesForDisplay(generatedStrategy.entryRules)} 
            exitRules={formatRulesForDisplay(generatedStrategy.exitRules)} 
          />
        </div>
      </main>
    </div>
  );
};

export default StrategyPreview;
