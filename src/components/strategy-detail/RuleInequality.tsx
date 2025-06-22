
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
      // Immediately call onChange to update parent state
      onChange(localInequality);
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

  // Use the current inequality data (not local) for display to ensure fresh data
  const displayInequality = isOpen ? localInequality : inequality;

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
