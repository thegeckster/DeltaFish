interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < currentStep
                  ? 'bg-blue-600 text-white'
                  : i === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-full min-w-[20px] mx-1 ${
                  i < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm font-medium text-slate-700 text-center">{steps[currentStep]}</p>
    </div>
  );
}
