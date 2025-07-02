import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Lightbulb, XCircle } from "lucide-react";
import { useState } from "react";
import { RuleValidationResult } from "@/services/ruleValidationService";
interface RuleValidationDisplayProps {
  validationResult: RuleValidationResult;
  onFixRule?: (ruleId: string, suggestedFix: any) => void;
}
export const RuleValidationDisplay = ({
  validationResult,
  onFixRule
}: RuleValidationDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (validationResult.isValid && validationResult.warnings.length === 0 && validationResult.suggestions.length === 0) {
    return <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All trading rules look good! No issues detected.
        </AlertDescription>
      </Alert>;
  }
  return <div className="space-y-3">
      {validationResult.errors.length > 0 && <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Critical Issues Found:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationResult.errors.map((error, index) => <li key={index} className="text-sm">{error}</li>)}
            </ul>
          </AlertDescription>
        </Alert>}

      {validationResult.warnings.length > 0 && <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-medium mb-2 text-yellow-800">Warnings:</div>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              {validationResult.warnings.map((warning, index) => <li key={index} className="text-sm">{warning}</li>)}
            </ul>
          </AlertDescription>
        </Alert>}

      {validationResult.suggestions.length > 0}
    </div>;
};