
import { Badge } from "@/components/Badge";
import { IndicatorParameter } from "./IndicatorParameter";
import { Inequality, InequalitySide } from "./types";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RuleInequalityProps {
  inequality: Inequality;
  editable?: boolean;
  onChange?: (inequality: Inequality) => void;
  onDelete?: () => void;
}

export const RuleInequality = ({ 
  inequality, 
  editable = false,
  onChange,
  onDelete
}: RuleInequalityProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedInequality, setEditedInequality] = useState<Inequality>(inequality);
  
  const indicators = ["SMA", "EMA", "RSI", "MACD", "Volume", "Volume MA"];
  const conditions = ["Greater Than", "Less Than", "Crosses Above", "Crosses Below"];
  const valueTypes = ["indicator", "price", "value"];
  const priceValues = ["Open", "High", "Low", "Close"];
  const macdValueTypes = ["MACD Line", "Signal", "Histogram"];
  
  const startEditing = () => {
    setEditedInequality({...inequality});
    setIsEditing(true);
  };
  
  const cancelEditing = () => {
    setIsEditing(false);
  };
  
  const saveChanges = () => {
    if (onChange) {
      onChange(editedInequality);
    }
    setIsEditing(false);
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
            <Select value={side.indicator} onValueChange={(val) => updateSide("indicator", val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Indicator" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map(indicator => (
                  <SelectItem key={indicator} value={indicator}>
                    {indicator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {side.indicator === "MACD" && (
              <>
                <Select 
                  value={side.valueType || "MACD Line"} 
                  onValueChange={(val) => updateSide("valueType", val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="MACD Value" />
                  </SelectTrigger>
                  <SelectContent>
                    {macdValueTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </>
            )}
            
            {side.indicator !== "MACD" && (
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
              
              {editable && !isEditing && (
                <div className="flex space-x-1 mt-1">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={startEditing}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {onDelete && (
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500" onClick={onDelete}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="p-2 bg-white rounded border">
              {renderReadOnlySide(inequality.right)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
