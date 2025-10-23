import * as React from 'react';
import { cn } from '../lib/utils';

export interface Step {
  label: string;
  description?: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                    {
                      'border-primary bg-primary text-primary-foreground':
                        isActive,
                      'border-primary bg-primary/10 text-primary':
                        isCompleted,
                      'border-muted bg-background text-muted-foreground':
                        !isActive && !isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn('text-sm font-medium', {
                      'text-foreground': isActive || isCompleted,
                      'text-muted-foreground': !isActive && !isCompleted,
                    })}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 transition-all',
                    {
                      'bg-primary': isCompleted,
                      'bg-muted': !isCompleted,
                    }
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
