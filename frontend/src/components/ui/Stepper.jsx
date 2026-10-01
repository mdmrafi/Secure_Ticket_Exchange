import React from 'react';
import { Check } from 'lucide-react';

export const Stepper = ({ steps = [], currentStep = 0, onStepClick, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop & Tablet Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isClickable = onStepClick && idx <= currentStep;

          return (
            <React.Fragment key={idx}>
              <div
                onClick={() => isClickable && onStepClick(idx)}
                className={`flex flex-col items-center gap-2 group ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Step Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 select-none ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                </div>

                {/* Step Label */}
                <div className="text-center max-w-[110px]">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      isActive ? 'text-blue-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.subtitle && (
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {step.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting Line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-6 transition-all duration-300 ${
                    idx < currentStep ? 'bg-emerald-500/80' : 'bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Compact Stepper */}
      <div className="sm:hidden flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div>
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            Step {currentStep + 1} of {steps.length}
          </span>
          <p className="text-sm font-bold text-white mt-0.5">{steps[currentStep]?.title}</p>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-200 ${
                idx === currentStep
                  ? 'w-6 bg-blue-500'
                  : idx < currentStep
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
