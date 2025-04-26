
interface ParametersProps {
  parameters: {
    [key: string]: string | number;
  };
}

export function BacktestParameters({ parameters }: ParametersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div>
        <h4 className="text-sm text-muted-foreground mb-2">Time Period</h4>
        <div className="flex items-center gap-2 mb-1">
          <p>From: {parameters["Start Date"]}</p>
        </div>
        <div className="flex items-center gap-2">
          <p>To: {parameters["End Date"]}</p>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm text-muted-foreground mb-2">Initial Capital</h4>
        <div className="flex items-center gap-2">
          <p>${parameters["Initial Capital"].toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
