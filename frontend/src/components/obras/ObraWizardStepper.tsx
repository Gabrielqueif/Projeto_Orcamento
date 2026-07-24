"use client";

import React from "react";
import { Check } from "@phosphor-icons/react";

export interface StepItem {
  num: number;
  label: string;
}

interface ObraWizardStepperProps {
  currentStep: number;
  totalSteps?: number;
  nextStepLabel?: string;
}

const DEFAULT_STEPS: StepItem[] = [
  { num: 1, label: "Informações Básicas" },
  { num: 2, label: "Equipe & Acessos" },
  { num: 3, label: "Financeiro Inicial" },
];

export function ObraWizardStepper({
  currentStep,
  totalSteps = 3,
  nextStepLabel,
}: ObraWizardStepperProps) {
  const progressPercent = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className="bg-white border-b border-[#d1d5db] px-8 lg:px-16 py-6 shadow-sm">
      <div className="max-w-[1152px] mx-auto flex flex-col gap-4">
        {/* Header Text */}
        <div className="flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] font-medium text-[10px] text-[#00bcd4] uppercase tracking-[0.5px]">
            Etapa {currentStep} de {totalSteps}
          </span>
          {nextStepLabel && (
            <span className="font-['Inter'] font-bold text-[12px] text-[#001b3c]/60">
              Próximo: {nextStepLabel}
            </span>
          )}
        </div>

        {/* Dynamic Progress Bar */}
        <div className="bg-[#f1f5f9] h-2 rounded-full w-full overflow-hidden">
          <div
            className="bg-[#9fd300] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps Indicator Badges */}
        <div className="flex items-center justify-between pt-2">
          {DEFAULT_STEPS.map((step) => {
            const isCompleted = step.num < currentStep;
            const isActive = step.num === currentStep;

            return (
              <div
                key={step.num}
                className={`flex items-center gap-2 transition-opacity ${
                  isActive || isCompleted ? "opacity-100" : "opacity-40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-['Inter'] font-bold text-[12px] transition-colors ${
                    isActive
                      ? "bg-[#9fd300] text-[#001b3c]"
                      : isCompleted
                      ? "bg-[#9fd300]/30 text-[#001b3c]"
                      : "bg-[#f1f5f9] text-[#94a3b8]"
                  }`}
                >
                  {isCompleted ? <Check size={14} weight="bold" /> : `0${step.num}`}
                </div>
                <span
                  className={`font-['Inter'] font-bold text-[12px] uppercase tracking-[-0.3px] ${
                    isActive ? "text-[#001b3c]" : isCompleted ? "text-[#001b3c]" : "text-[#94a3b8]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
