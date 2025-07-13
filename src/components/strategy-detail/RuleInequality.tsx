
import { useState, useEffect } from "react";
import { Inequality } from "./types";
import { CompactInequalityDisplay } from "./components/CompactInequalityDisplay";
import { EditModeInequality } from "./components/EditModeInequality";
import { Toaster } from "@/components/ui/toaster";

interface RuleInequalityProps {
  inequality: Inequality;
  editable?: boolean;
  onChange?: (updatedInequality: Inequality) => void;
  onDelete?: () => void;
  showValidation?: boolean;
  isNewlyAdded?: boolean;
  onEditingComplete?: () => void;
}

// Main Rule Inequality component
export const RuleInequality = ({
  inequality,
  editable = false,
  onChange,
  onDelete,
  showValidation = false,
  isNewlyAdded = false,
  onEditingComplete
}: RuleInequalityProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(isNewlyAdded);
  const [localInequality, setLocalInequality] = useState<Inequality>(inequality);
  
  // Update local state when parent inequality changes
  useEffect(() => {
    console.log('RuleInequality: Parent inequality changed, updating local state:', inequality);
    setLocalInequality(inequality);
  }, [inequality]);
  
  useEffect(() => {
    // When newly added, auto-open the editor
    if (isNewlyAdded) {
      setIsOpen(true);
    }
  }, [isNewlyAdded]);
  
  const handleSaveChanges = () => {
    console.log('RuleInequality: Saving changes, local inequality:', localInequality);
    if (onChange) {
      // Create a deep copy to ensure all data is properly propagated
      const updatedInequality = {
        ...localInequality,
        left: {
          ...localInequality.left,
          // Ensure all properties are included
          parameters: localInequality.left.parameters || {},
          valueType: localInequality.left.valueType || undefined
        },
        right: {
          ...localInequality.right,
          // Ensure all properties are included
          parameters: localInequality.right.parameters || {},
          valueType: localInequality.right.valueType || undefined
        }
      };
      
      console.log('RuleInequality: Updated inequality being passed to parent:', updatedInequality);
      
      // Immediately call onChange to update parent state
      onChange(updatedInequality);
    }
    setIsOpen(false);
    if (onEditingComplete) {
      onEditingComplete();
    }
  };
  
  const handleCancelChanges = () => {
    // Reset local inequality to the original
    setLocalInequality(inequality);
    setIsOpen(false);
    
    // If this is a newly added condition, we want to delete it entirely
    if (isNewlyAdded && onDelete) {
      onDelete();
    }
    
    if (onEditingComplete) {
      onEditingComplete();
    }
  };

  // Check if the inequality has empty/missing required fields
  const hasEmptyRequiredFields = (side: 'left' | 'right') => {
    const sideObj = side === 'left' ? localInequality.left : localInequality.right;
    if (!sideObj.type) {
      return true;
    }
    if (sideObj.type === 'INDICATOR' && !sideObj.indicator) {
      return true;
    }
    if (sideObj.type === 'PRICE' && !sideObj.value) {
      return true;
    }
    if (sideObj.type === 'VALUE' && sideObj.value === undefined) {
      return true;
    }
    return false;
  };
  
  const isIncomplete = !localInequality.condition || hasEmptyRequiredFields('left') || hasEmptyRequiredFields('right');

  // Always use the parent inequality for display to ensure we show the most current saved data
  // Only use localInequality when in edit mode
  const displayInequality = isOpen ? localInequality : inequality;

  // Create a unique key that includes all relevant data to force re-render when any part changes
  const inequalityKey = JSON.stringify({
    id: inequality.id,
    left: {
      type: inequality.left?.type,
      indicator: inequality.left?.indicator,
      parameters: inequality.left?.parameters,
      valueType: inequality.left?.valueType,
      value: inequality.left?.value
    },
    right: {
      type: inequality.right?.type,
      indicator: inequality.right?.indicator,
      parameters: inequality.right?.parameters,
      valueType: inequality.right?.valueType,
      value: inequality.right?.value
    },
    condition: inequality.condition,
    explanation: inequality.explanation
  });

  // Render appropriate view based on mode
  return (
    <>
      {isOpen && editable ? (
        <EditModeInequality
          localInequality={localInequality}
          setLocalInequality={setLocalInequality}
          isIncomplete={isIncomplete}
          showValidation={showValidation}
          onSave={handleSaveChanges}
          onCancel={handleCancelChanges}
        />
      ) : (
        <CompactInequalityDisplay
          key={inequalityKey}
          inequality={displayInequality}
          editable={editable}
          isIncomplete={isIncomplete}
          showValidation={showValidation}
          onEdit={() => setIsOpen(true)}
          onDelete={onDelete}
        />
      )}
      <Toaster />
    </>
  );
};
