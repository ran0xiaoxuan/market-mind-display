
import React from "react";
import { Inequality } from "../types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { InequalitySide } from "./InequalitySide";

interface EditModeInequalityProps {
  localInequality: Inequality;
  setLocalInequality: (inequality: Inequality) => void;
  isIncomplete: boolean;
  showValidation: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const EditModeInequality: React.FC<EditModeInequalityProps> = ({
  localInequality,
  setLocalInequality,
  isIncomplete,
  showValidation,
  onSave,
  onCancel
}) => {
  const updateInequality = (side: 'left' | 'right', field: string, value: any) => {
    const updatedInequality = {
      ...localInequality,
      [side]: {
        ...localInequality[side],
        [field]: value
      }
    };
    setLocalInequality(updatedInequality);
  };
  
  const updateParameters = (side: 'left' | 'right', paramName: string, paramValue: string) => {
    const currentParams = localInequality[side].parameters || {};
    const updatedParams = {
      ...currentParams,
      [paramName]: paramValue
    };
    const updatedInequality = {
      ...localInequality,
      [side]: {
        ...localInequality[side],
        parameters: updatedParams
      }
    };
    setLocalInequality(updatedInequality);
  };
  
  return (
    <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-4">
      <h3 className="text-lg font-semibold text-center mb-2">Define Inequality Condition</h3>
      
      <div className="flex flex-col md:flex-row items-start justify-start gap-4 p-3 bg-white rounded-lg border border-gray-100">
        {/* Left side */}
        <div className="w-full md:w-1/3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Select 
            value={localInequality.left.type} 
            onValueChange={value => updateInequality('left', 'type', value)}
          >
            <SelectTrigger className={`${!localInequality.left.type && showValidation ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="INDICATOR">Indicator</SelectItem>
                <SelectItem value="PRICE">Price</SelectItem>
                {/* Removed "VALUE" option for left side */}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <InequalitySide
            side="left"
            sideObj={localInequality.left}
            updateInequality={updateInequality}
            updateParameters={updateParameters}
            showValidation={showValidation}
          />
        </div>
        
        {/* Condition operator */}
        <div className="w-full md:w-1/5">
          <div className="text-center mb-2 font-medium text-sm">Operator</div>
          <Select 
            value={localInequality.condition} 
            onValueChange={value => setLocalInequality({
              ...localInequality,
              condition: value
            })}
          >
            <SelectTrigger className={`${!localInequality.condition && showValidation ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="CROSSES_ABOVE">Crosses Above</SelectItem>
                <SelectItem value="CROSSES_BELOW">Crosses Below</SelectItem>
                <SelectItem value="GREATER_THAN">&gt;</SelectItem>
                <SelectItem value="LESS_THAN">&lt;</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        {/* Right side */}
        <div className="w-full md:w-1/3 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <Select 
            value={localInequality.right.type} 
            onValueChange={value => updateInequality('right', 'type', value)}
          >
            <SelectTrigger className={`${!localInequality.right.type && showValidation ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="INDICATOR">Indicator</SelectItem>
                <SelectItem value="PRICE">Price</SelectItem>
                <SelectItem value="VALUE">Value</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <InequalitySide
            side="right"
            sideObj={localInequality.right}
            updateInequality={updateInequality}
            updateParameters={updateParameters}
            showValidation={showValidation}
          />
        </div>
      </div>
      
      {/* Explanation field */}
      <div>
        <label className="text-sm font-medium">Explanation (optional)</label>
        <Input 
          type="text" 
          value={localInequality.explanation || ''} 
          onChange={e => setLocalInequality({
            ...localInequality,
            explanation: e.target.value
          })} 
          placeholder="Explain this rule (optional)" 
        />
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} disabled={isIncomplete && showValidation}>
          Save
        </Button>
      </div>
    </div>
  );
};
