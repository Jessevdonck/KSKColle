"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface FilterOption {
  value: string
  label: string
  color?: string
}

interface CalendarFiltersProps {
  eventTypes: FilterOption[]
  categories: FilterOption[]
  selectedTypes: string[]
  selectedCategories: string[]
  onTypesChange: (types: string[]) => void
  onCategoriesChange: (categories: string[]) => void
  onClearAll: () => void
  isYouth?: boolean
}

export default function CalendarFilters({
  eventTypes,
  categories,
  selectedTypes,
  selectedCategories,
  onTypesChange,
  onCategoriesChange,
  onClearAll,
  isYouth = false
}: CalendarFiltersProps) {
  const [showTypesDropdown, setShowTypesDropdown] = useState(false)
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false)
  const typesDropdownRef = useRef<HTMLDivElement>(null)
  const categoriesDropdownRef = useRef<HTMLDivElement>(null)

  const hasActiveFilters = selectedTypes.length > 0 || selectedCategories.length > 0

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typesDropdownRef.current && !typesDropdownRef.current.contains(event.target as Node)) {
        setShowTypesDropdown(false)
      }
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target as Node)) {
        setShowCategoriesDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
    // Keep dropdown open for multi-select
  }

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category))
    } else {
      onCategoriesChange([...selectedCategories, category])
    }
    // Keep dropdown open for multi-select
  }

  const getFilterColor = (option: FilterOption) => {
    if (option.color) return option.color
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-3">
      {/* Filter Header */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-mainAccent/10 text-mainAccent text-xs px-1.5 py-0.5">
              {selectedTypes.length + selectedCategories.length} geselecteerd
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
          >
            <X className="h-2.5 w-2.5 mr-1" />
            Wis alles
          </Button>
        </div>
      )}

      {/* Filter Content - Always Visible */}
      <div className={`flex flex-col sm:flex-row gap-3 ${hasActiveFilters ? '' : 'mt-0'}`}>
        {/* Event Types Dropdown */}
        <div className="relative flex-1" ref={typesDropdownRef}>
          <button
            onClick={() => setShowTypesDropdown(!showTypesDropdown)}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-textColor bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="truncate">
              {selectedTypes.length === 0 
                ? `${isYouth ? "Types" : "Types"}` 
                : `${selectedTypes.length}`
              }
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform flex-shrink-0 ml-2 ${showTypesDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showTypesDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {eventTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeToggle(type.value)}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2 ${
                    selectedTypes.includes(type.value) ? 'bg-mainAccent/5' : ''
                  }`}
                >
                  <div className={`rounded border ${
                    selectedTypes.includes(type.value) 
                      ? 'bg-mainAccent border-mainAccent' 
                      : 'border-gray-300'
                  }`} style={{width: '10px', height: '10px'}} />
                  <span className={`truncate ${selectedTypes.includes(type.value) ? 'font-medium' : ''}`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categories Dropdown - Only show if categories exist */}
        {categories.length > 0 && (
          <div className="relative flex-1" ref={categoriesDropdownRef}>
            <button
              onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-textColor bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="truncate">
                {selectedCategories.length === 0 
                  ? `${isYouth ? "Stappen" : "Categorieën"}` 
                  : `${selectedCategories.length}`
                }
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform flex-shrink-0 ml-2 ${showCategoriesDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showCategoriesDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryToggle(category.value)}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2 ${
                      selectedCategories.includes(category.value) ? 'bg-mainAccent/5' : ''
                    }`}
                  >
                    <div className={`rounded border ${
                      selectedCategories.includes(category.value) 
                        ? 'bg-mainAccent border-mainAccent' 
                        : 'border-gray-300'
                    }`} style={{width: '10px', height: '10px'}} />
                    <span className={`truncate ${selectedCategories.includes(category.value) ? 'font-medium' : ''}`}>
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 pt-2 border-t border-neutral-200">
          <div className="flex flex-wrap gap-1">
            {selectedTypes.map((type) => {
              const typeOption = eventTypes.find(t => t.value === type)
              return (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-xs bg-mainAccent/10 text-mainAccent px-2 py-0.5"
                >
                  {typeOption?.label || type}
                  <button
                    onClick={() => handleTypeToggle(type)}
                    className="ml-1 hover:bg-mainAccent/20 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )
            })}
            {categories.length > 0 && selectedCategories.map((category) => {
              const categoryOption = categories.find(c => c.value === category)
              return (
                <Badge
                  key={category}
                  variant="secondary"
                  className="text-xs bg-mainAccent/10 text-mainAccent px-2 py-0.5"
                >
                  {categoryOption?.label || category}
                  <button
                    onClick={() => handleCategoryToggle(category)}
                    className="ml-1 hover:bg-mainAccent/20 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
