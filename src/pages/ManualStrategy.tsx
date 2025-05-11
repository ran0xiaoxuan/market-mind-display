import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TradingRules } from "@/components/strategy-detail/TradingRules";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AssetTypeSelector } from "@/components/strategy/AssetTypeSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveGeneratedStrategy } from "@/services/strategyService";
import { RuleGroupData } from "@/components/strategy-detail/types";
import { useAuth } from "@/contexts/AuthContext";
import { StrategyDescription } from "@/components/strategy/StrategyDescription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Strategy name is required"),
  description: z.string().min(1, "Strategy description is required"),
  timeframe: z.string().min(1, "Timeframe selection is required"),
  targetAsset: z.string().min(1, "Please select a target asset"),
  stopLoss: z.string().min(1, "Stop loss is required"),
  takeProfit: z.string().min(1, "Take profit is required"),
  singleBuyVolume: z.string().min(1, "Single buy volume is required"),
  maxBuyVolume: z.string().min(1, "Maximum buy volume is required")
});
type FormValues = z.infer<typeof formSchema>;
const ManualStrategy = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize with empty entry and exit rule groups
  const [entryRules, setEntryRules] = useState<RuleGroupData[]>([{
    id: 1,
    logic: "AND",
    inequalities: []
  }, {
    id: 2,
    logic: "OR",
    inequalities: []
  }]);
  const [exitRules, setExitRules] = useState<RuleGroupData[]>([{
    id: 1,
    logic: "AND",
    inequalities: []
  }, {
    id: 2,
    logic: "OR",
    inequalities: []
  }]);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      timeframe: "",
      targetAsset: "",
      stopLoss: "",
      takeProfit: "",
      singleBuyVolume: "",
      maxBuyVolume: ""
    },
    mode: "onSubmit"
  });
  const handleAssetSelect = (symbol: string) => {
    setSelectedAsset(symbol);
    form.setValue("targetAsset", symbol);
    form.clearErrors("targetAsset");
  };

  // Validate trading rules
  const validateTradingRules = () => {
    const errors: string[] = [];

    // Check if at least one entry rule exists
    const hasEntryRules = entryRules.some(group => Array.isArray(group.inequalities) && group.inequalities.length > 0);
    if (!hasEntryRules) {
      errors.push("At least one entry rule is required");
    }

    // Check if at least one exit rule exists
    const hasExitRules = exitRules.some(group => Array.isArray(group.inequalities) && group.inequalities.length > 0);
    if (!hasExitRules) {
      errors.push("At least one exit rule is required");
    }

    // Check OR groups
    entryRules.forEach(group => {
      if (group.logic === "OR" && Array.isArray(group.inequalities) && group.inequalities.length === 1) {
        errors.push("OR groups must have at least 2 conditions");
      }
    });
    exitRules.forEach(group => {
      if (group.logic === "OR" && Array.isArray(group.inequalities) && group.inequalities.length === 1) {
        errors.push("OR groups must have at least 2 conditions");
      }
    });
    return errors;
  };
  const onSubmit = async (values: FormValues) => {
    setIsFormSubmitted(true);
    if (!user) {
      toast.error("Authentication required", {
        description: "Please log in to save your strategy"
      });
      return;
    }

    // Validate trading rules
    const ruleErrors = validateTradingRules();
    setValidationErrors(ruleErrors);
    if (ruleErrors.length > 0) {
      // Display errors on the page
      toast.error("Strategy validation failed", {
        description: "Please check and correct all highlighted errors"
      });
      return;
    }
    setIsSaving(true);
    try {
      // Format strategy in the same structure as the AI-generated one
      const strategy = {
        name: values.name,
        description: values.description,
        timeframe: values.timeframe,
        targetAsset: values.targetAsset,
        entryRules: entryRules,
        exitRules: exitRules,
        riskManagement: {
          stopLoss: values.stopLoss,
          takeProfit: values.takeProfit,
          singleBuyVolume: values.singleBuyVolume,
          maxBuyVolume: values.maxBuyVolume
        }
      };
      const strategyId = await saveGeneratedStrategy(strategy);
      toast.success("Strategy saved", {
        description: "Your strategy has been saved successfully"
      });

      // Navigate to the strategy details page
      navigate(`/strategy/${strategyId}`);
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast.error("Failed to save strategy", {
        description: "Please try again later"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Clear validation errors if they were shown and form is edited
  useEffect(() => {
    if (isFormSubmitted) {
      setValidationErrors([]); // Clear errors when form is edited after submission
      setIsFormSubmitted(false);
    }
  }, [form.formState.isDirty]);
  return <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">New Strategy</h1>
          <p className="text-muted-foreground">
            Create your own trading strategy by defining rules and parameters
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Strategy Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({
                field
              }) => <FormItem>
                      <FormLabel>Strategy Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Trading Strategy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="timeframe" render={({
                field
              }) => <FormItem>
                      <FormLabel>Timeframe</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a timeframe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1min">1 Minute</SelectItem>
                          <SelectItem value="5min">5 Minutes</SelectItem>
                          <SelectItem value="15min">15 Minutes</SelectItem>
                          <SelectItem value="30min">30 Minutes</SelectItem>
                          <SelectItem value="1hour">1 Hour</SelectItem>
                          <SelectItem value="4hour">4 Hours</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />

                <div className="col-span-1 md:col-span-2">
                  <FormField control={form.control} name="description" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Strategy Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your trading strategy..." className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>
              </div>
            </Card>

            <div className="mb-6">
              <FormField control={form.control} name="targetAsset" render={({
              field
            }) => <FormItem>
                    <FormLabel>Target Asset</FormLabel>
                    <FormControl>
                      <AssetTypeSelector selectedAsset={selectedAsset} onAssetSelect={handleAssetSelect} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Risk Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="stopLoss" render={({
                field
              }) => <FormItem>
                      <FormLabel>Stop Loss (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter stop loss percentage" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum percentage loss per trade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="takeProfit" render={({
                field
              }) => <FormItem>
                      <FormLabel>Take Profit (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter take profit percentage" {...field} />
                      </FormControl>
                      <FormDescription>
                        Target percentage gain per trade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="singleBuyVolume" render={({
                field
              }) => <FormItem>
                      <FormLabel>Single Buy Volume ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter single buy amount" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum amount to spend on a single purchase
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="maxBuyVolume" render={({
                field
              }) => <FormItem>
                      <FormLabel>Maximum Buy Volume ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter maximum buy amount" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum total investment amount
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />
              </div>
            </Card>

            {validationErrors.length > 0 && <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>}

            <TradingRules entryRules={entryRules} exitRules={exitRules} onEntryRulesChange={setEntryRules} onExitRulesChange={setExitRules} editable={true} showValidation={isFormSubmitted} />

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Strategy"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>;
};
export default ManualStrategy;
