
import { Badge } from "@/components/Badge";
import { IndicatorParameter } from "./IndicatorParameter";
import { Inequality, InequalitySide } from "./types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check, X, Info, Search, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSupportedIndicators } from "@/services/taapiService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface RuleInequalityProps {
  inequality: Inequality;
  editable?: boolean;
  onChange?: (inequality: Inequality) => void;
  onDelete?: () => void;
  showValidation?: boolean;
  isNewlyAdded?: boolean;
  onEditingComplete?: () => void;
}

export const RuleInequality = ({ 
  inequality, 
  editable = false,
  onChange,
  onDelete,
  showValidation,
  isNewlyAdded = false,
  onEditingComplete
}: RuleInequalityProps) => {
  const [isEditing, setIsEditing] = useState(isNewlyAdded);
  const [showExplanation, setShowExplanation] = useState(false);
  const [editedInequality, setEditedInequality] = useState<Inequality>(inequality);
  const [availableIndicators, setAvailableIndicators] = useState<string[]>([]);
  const [indicatorSearch, setIndicatorSearch] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Set editing mode when isNewlyAdded changes
  useEffect(() => {
    if (isNewlyAdded) {
      setIsEditing(true);
      setEditedInequality({...inequality});
    }
  }, [isNewlyAdded, inequality]);
  
  // Fetch available indicators from TAAPI
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const indicators = await getSupportedIndicators();
        // Convert to proper case and sort
        const formattedIndicators = indicators
          .map(ind => ind.charAt(0).toUpperCase() + ind.slice(1))
          .sort();
        
        // Add our standard set of indicators as well
        const standardIndicators = [
          "SMA", "EMA", "RSI", "MACD", "Volume", "Volume MA", 
          "Bollinger Bands", "ATR", "Stochastic", "Ichimoku Cloud",
          "CCI", "Williams %R", "OBV", "DMI", "Parabolic SAR",
          "SuperTrend", "Keltner Channel", "Donchian Channel",
          "MFI", "Stochastic RSI", "ADX", "Awesome Oscillator"
        ];
        
        const allIndicators = Array.from(new Set([...standardIndicators, ...formattedIndicators])).sort();
        setAvailableIndicators(allIndicators);
      } catch (error) {
        console.error("Failed to fetch indicators:", error);
        // Fallback to standard indicators
        setAvailableIndicators([
          "SMA", "EMA", "RSI", "MACD", "Volume", "Volume MA", 
          "Bollinger Bands", "ATR", "Stochastic", "Ichimoku Cloud",
          "CCI", "Williams %R", "OBV", "DMI", "Parabolic SAR",
          "SuperTrend", "Keltner Channel", "Donchian Channel",
          "MFI", "Stochastic RSI", "ADX", "Awesome Oscillator"
        ]);
      }
    };
    
    fetchIndicators();
  }, []);
  
  // Filter indicators based on search query
  const filteredIndicators = indicatorSearch
    ? availableIndicators.filter(indicator => 
        indicator.toLowerCase().includes(indicatorSearch.toLowerCase())
      )
    : availableIndicators;
  
  const conditions = [
    "Greater Than", "Less Than", 
    "Crosses Above", "Crosses Below",
    "Equal To", "Not Equal To",
    "Multiplied By"
  ];
  const valueTypes = ["indicator", "price", "value"];
  const priceValues = ["Open", "High", "Low", "Close", "Volume"];
  
  // Get value type options based on the selected indicator
  const getValueTypeOptions = (indicator: string | undefined) => {
    if (!indicator) return [];
    
    switch (indicator) {
      case "MACD":
        return ["MACD Line", "Signal", "Histogram"];
      case "Bollinger Bands":
        return ["Upper Band", "Middle Band", "Lower Band"];
      case "Stochastic":
      case "Stochastic RSI":
        return ["K Line", "D Line"];
      case "Ichimoku Cloud":
        return ["Conversion Line", "Base Line", "Leading Span A", "Leading Span B", "Lagging Span", "Cloud"];
      case "Keltner Channel":
      case "Donchian Channel":
        return ["Upper Band", "Middle Line", "Lower Band"];
      case "DMI":
        return ["DI+", "DI-", "ADX"];
      case "SuperTrend":
        return ["Trend Line", "Direction"];
      default:
        return [];
    }
  };
  
  const validateInequality = (): string[] => {
    const errors: string[] = [];
    
    // Validate left side
    if (!editedInequality.left.type) {
      errors.push("Left side type is required");
    } else if (editedInequality.left.type === "indicator" && !editedInequality.left.indicator) {
      errors.push("Left side indicator is required");
    } else if (editedInequality.left.type === "price" && !editedInequality.left.value) {
      errors.push("Left side price value is required");
    }
    
    // Validate condition
    if (!editedInequality.condition) {
      errors.push("Condition is required");
    }
    
    // Validate right side
    if (!editedInequality.right.type) {
      errors.push("Right side type is required");
    } else if (editedInequality.right.type === "indicator" && !editedInequality.right.indicator) {
      errors.push("Right side indicator is required");
    } else if (editedInequality.right.type === "price" && !editedInequality.right.value) {
      errors.push("Right side price value is required");
    } else if (editedInequality.right.type === "value" && !editedInequality.right.value) {
      errors.push("Right side value is required");
    }
    
    return errors;
  };
  
  const startEditing = () => {
    setEditedInequality({...inequality});
    setIsEditing(true);
    setValidationErrors([]);
  };
  
  const cancelEditing = () => {
    setIsEditing(false);
    setIndicatorSearch('');
    setValidationErrors([]);
    
    // Always delete the inequality when canceling a newly added one
    if (isNewlyAdded && onDelete) {
      onDelete();
      return;
    } 
    
    // If it's not a new inequality and we're canceling edit, just notify parent editing is done
    if (onEditingComplete) {
      onEditingComplete();
    }
  };
  
  const saveChanges = () => {
    const errors = validateInequality();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast.error("Please fix all errors before saving");
      return;
    }
    
    if (onChange) {
      onChange(editedInequality);
    }
    
    setIsEditing(false);
    setIndicatorSearch('');
    
    if (onEditingComplete) {
      onEditingComplete();
    }
  };
  
  const updateLeft = (field: string, value: string) => {
    setEditedInequality(prev => ({
      ...prev,
      left: {
        ...prev.left,
        [field]: value
      }
    }));
  };
  
  const updateRight = (field: string, value: string) => {
    setEditedInequality(prev => ({
      ...prev,
      right: {
        ...prev.right,
        [field]: value
      }
    }));
  };
  
  const updateExplanation = (value: string) => {
    setEditedInequality(prev => ({
      ...prev,
      explanation: value
    }));
  };
  
  const updateLeftParameter = (key: string, value: string) => {
    setEditedInequality(prev => ({
      ...prev,
      left: {
        ...prev.left,
        parameters: {
          ...prev.left.parameters,
          [key]: value
        }
      }
    }));
  };
  
  const updateRightParameter = (key: string, value: string) => {
    setEditedInequality(prev => ({
      ...prev,
      right: {
        ...prev.right,
        parameters: {
          ...prev.right.parameters,
          [key]: value
        }
      }
    }));
  };
  
  const renderReadOnlySide = (side: InequalitySide) => {
    if (side.type === "indicator") {
      return (
        <IndicatorParameter 
          indicator={side.indicator || ""} 
          parameters={side.parameters || {}} 
          valueType={side.valueType}
        />
      );
    } else if (side.type === "price") {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{side.value}</span>
          <span className="text-xs text-muted-foreground">
            Price value
          </span>
        </div>
      );
    } else if (side.type === "value") {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{side.value}</span>
          <span className="text-xs text-muted-foreground">
            Constant value
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col">
        <span className="font-medium">Unknown type</span>
      </div>
    );
  };
  
  const renderEditableSide = (side: InequalitySide, isLeft: boolean) => {
    const updateSide = isLeft ? updateLeft : updateRight;
    const updateParameter = isLeft ? updateLeftParameter : updateRightParameter;
    
    return (
      <div className="space-y-2 p-2">
        {isLeft ? (
          <Select value={side.type} onValueChange={(val) => updateSide("type", val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indicator">Indicator</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Select value={side.type} onValueChange={(val) => updateSide("type", val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {valueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {side.type === "indicator" && (
          <>
            <div className="relative">
              <Select value={side.indicator} onValueChange={(val) => updateSide("indicator", val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Indicator" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center px-2 pb-1 sticky top-0 bg-white z-10">
                    <Search className="h-4 w-4 mr-2 opacity-50" />
                    <Input
                      placeholder="Search indicators..."
                      value={indicatorSearch}
                      onChange={(e) => setIndicatorSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <ScrollArea className="h-60">
                    {filteredIndicators.length > 0 ? (
                      filteredIndicators.map(indicator => (
                        <SelectItem key={indicator} value={indicator}>
                          {indicator}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-center py-2 text-muted-foreground">
                        No indicators found
                      </div>
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            
            {getValueTypeOptions(side.indicator).length > 0 && (
              <Select 
                value={side.valueType || getValueTypeOptions(side.indicator)[0]} 
                onValueChange={(val) => updateSide("valueType", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Component" />
                </SelectTrigger>
                <SelectContent>
                  {getValueTypeOptions(side.indicator).map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {side.indicator === "MACD" && (
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <span className="text-xs">Fast</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.fast || '12'} 
                    onChange={(e) => updateParameter("fast", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">Slow</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.slow || '26'} 
                    onChange={(e) => updateParameter("slow", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">Signal</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.signal || '9'} 
                    onChange={(e) => updateParameter("signal", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {side.indicator === "Bollinger Bands" && (
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-xs">Period</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.period || '20'} 
                    onChange={(e) => updateParameter("period", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">Deviation</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.deviation || '2'} 
                    onChange={(e) => updateParameter("deviation", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {(side.indicator === "Stochastic" || side.indicator === "Stochastic RSI") && (
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-xs">K</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.k || '14'} 
                    onChange={(e) => updateParameter("k", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">D</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.d || '3'} 
                    onChange={(e) => updateParameter("d", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
            
            {side.indicator === "Ichimoku Cloud" && (
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-xs">Conversion</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.conversionPeriod || '9'} 
                    onChange={(e) => updateParameter("conversionPeriod", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">Base</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.basePeriod || '26'} 
                    onChange={(e) => updateParameter("basePeriod", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">Lagging</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.laggingSpan || '52'} 
                    onChange={(e) => updateParameter("laggingSpan", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">Displacement</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.displacement || '26'} 
                    onChange={(e) => updateParameter("displacement", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
            
            {(side.indicator === "ATR" || side.indicator === "SuperTrend") && (
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-xs">Period</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.period || '14'} 
                    onChange={(e) => updateParameter("period", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {side.indicator === "SuperTrend" && (
                  <div>
                    <span className="text-xs">Multiplier</span>
                    <Input 
                      type="text" 
                      value={side.parameters?.multiplier || '3'} 
                      onChange={(e) => updateParameter("multiplier", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            )}
            
            {(side.indicator === "Keltner Channel" || side.indicator === "Donchian Channel") && (
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-xs">Period</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.period || '20'} 
                    onChange={(e) => updateParameter("period", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {side.indicator === "Keltner Channel" && (
                  <>
                    <div>
                      <span className="text-xs">ATR Period</span>
                      <Input 
                        type="text" 
                        value={side.parameters?.atrPeriod || '10'} 
                        onChange={(e) => updateParameter("atrPeriod", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-xs">Multiplier</span>
                      <Input 
                        type="text" 
                        value={side.parameters?.multiplier || '2'} 
                        onChange={(e) => updateParameter("multiplier", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            
            {["Awesome Oscillator", "AccelerationOscillator"].includes(side.indicator || "") && (
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <span className="text-xs">Fast</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.fast || '5'} 
                    onChange={(e) => updateParameter("fast", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs">Slow</span>
                  <Input 
                    type="text" 
                    value={side.parameters?.slow || '34'} 
                    onChange={(e) => updateParameter("slow", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
            
            {side.indicator !== "MACD" && side.indicator !== "Bollinger Bands" && 
             side.indicator !== "Stochastic" && side.indicator !== "Stochastic RSI" && 
             side.indicator !== "Ichimoku Cloud" && side.indicator !== "ATR" && 
             side.indicator !== "SuperTrend" && side.indicator !== "Keltner Channel" && 
             side.indicator !== "Donchian Channel" && side.indicator !== "Awesome Oscillator" && 
             side.indicator !== "AccelerationOscillator" && (
              <div>
                <span className="text-xs">Period</span>
                <Input 
                  type="text" 
                  value={side.parameters?.period || ''} 
                  onChange={(e) => updateParameter("period", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </>
        )}
        
        {side.type === "price" && (
          <Select value={side.value} onValueChange={(val) => updateSide("value", val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent>
              {priceValues.map(price => (
                <SelectItem key={price} value={price}>
                  {price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {!isLeft && side.type === "value" && (
          <div>
            <span className="text-xs">Value</span>
            <Input 
              type="text" 
              value={side.value || ''} 
              onChange={(e) => updateSide("value", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-slate-50 p-3 rounded-lg relative">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        {isEditing ? (
          <>
            <div className="bg-white rounded border">
              {renderEditableSide(editedInequality.left, true)}
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <Select value={editedInequality.condition} onValueChange={(val) => setEditedInequality({...editedInequality, condition: val})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map(condition => (
                    <SelectItem key={condition} value={condition}>
                      {condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Explanation Field */}
              <div className="w-full px-1">
                <label className="text-xs text-muted-foreground">Explanation (optional)</label>
                <textarea
                  value={editedInequality.explanation || ""}
                  onChange={(e) => updateExplanation(e.target.value)}
                  className="w-full h-20 text-xs p-2 border rounded-md resize-none"
                  placeholder="Enter explanation for this rule..."
                />
              </div>
              
              {/* Validation errors */}
              {validationErrors.length > 0 && (
                <div className="w-full bg-red-50 border border-red-200 rounded-md p-2 text-sm">
                  <div className="flex items-center gap-1 text-red-600 font-medium mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Please fix these errors:</span>
                  </div>
                  <ul className="list-disc pl-5 text-xs text-red-600">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" onClick={cancelEditing}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                <Button size="sm" variant="default" onClick={saveChanges}><Check className="h-4 w-4 mr-1" /> Save</Button>
              </div>
            </div>
            <div className="bg-white rounded border">
              {renderEditableSide(editedInequality.right, false)}
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-white rounded border">
              {renderReadOnlySide(inequality.left)}
            </div>
            <div className="flex flex-col justify-center items-center">
              <Badge variant="outline" className="bg-white font-medium text-center mb-2">
                {inequality.condition}
              </Badge>
              
              <div className="flex space-x-1 mt-1">
                {inequality.explanation && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 text-blue-500"
                          onClick={() => setShowExplanation(!showExplanation)}
                        >
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs">{inequality.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {editable && !isEditing && (
                  <>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={startEditing}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {onDelete && (
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={onDelete}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="p-2 bg-white rounded border">
              {renderReadOnlySide(inequality.right)}
            </div>
            
            {/* Explanation panel that can be toggled */}
            {showExplanation && inequality.explanation && (
              <div className="col-span-3 mt-2 bg-blue-50 p-3 rounded-md text-sm">
                <h5 className="font-medium mb-1 text-blue-800">Rule Explanation</h5>
                <p className="text-blue-700">{inequality.explanation}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
