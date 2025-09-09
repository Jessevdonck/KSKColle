"use client"

import React, { useState } from "react"
import { Tag, X, Check } from "lucide-react"
import { Label } from "@/components/ui/label"

interface StepMultiSelectProps {
  value: string[]
  onChange: (steps: string[]) => void
  label?: string
}

const StepMultiSelect: React.FC<StepMultiSelectProps> = ({
  value,
  onChange,
  label = "Jeugd Stappen"
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const availableSteps = [
    { id: "Stap 1", label: "Stap 1", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { id: "Stap 2", label: "Stap 2", color: "bg-orange-100 text-orange-800 border-orange-200" },
    { id: "Stap 3+4", label: "Stap 3+4", color: "bg-red-100 text-red-800 border-red-200" },
  ]

  const toggleStep = (stepId: string) => {
    if (value.includes(stepId)) {
      onChange(value.filter(step => step !== stepId))
    } else {
      onChange([...value, stepId])
    }
  }

  const removeStep = (stepId: string) => {
    onChange(value.filter(step => step !== stepId))
  }

  const getStepColor = (stepId: string) => {
    const step = availableSteps.find(s => s.id === stepId)
    return step?.color || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Tag className="h-4 w-4" />
        {label}
      </Label>
      
      {/* Selected Steps */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((stepId) => (
            <div
              key={stepId}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium border ${getStepColor(stepId)}`}
            >
              {stepId}
              <button
                type="button"
                onClick={() => removeStep(stepId)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-mainAccent focus:border-mainAccent text-left flex items-center justify-between"
        >
          <span className="text-gray-700">
            {value.length === 0 ? "Selecteer stappen..." : `${value.length} stap${value.length !== 1 ? 'pen' : ''} geselecteerd`}
          </span>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {availableSteps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleStep(step.id)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  value.includes(step.id) 
                    ? 'bg-mainAccent border-mainAccent' 
                    : 'border-gray-300'
                }`}>
                  {value.includes(step.id) && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="text-sm">{step.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-gray-500 italic">Geen stappen geselecteerd</p>
      )}
    </div>
  )
}

export default StepMultiSelect
