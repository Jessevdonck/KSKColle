"use client"

import React, { useState, useEffect, useRef } from "react"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useSWR from "swr"
import { getAll } from "@/app/api"
import type { User as UserType } from "../../../data/types"

interface InstructorAutocompleteProps {
  value: string[]
  onChange: (instructors: string[]) => void
  label?: string
}

const InstructorAutocomplete: React.FC<InstructorAutocompleteProps> = ({
  value,
  onChange,
  label = "Lesgevers"
}) => {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const { data: users } = useSWR<UserType[]>("users", getAll)

  useEffect(() => {
    if (inputValue.length > 1 && users) {
      const filtered = users.filter(user => 
        `${user.voornaam} ${user.achternaam}`.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(`${user.voornaam} ${user.achternaam}`)
      )
      setFilteredUsers(filtered)
      setShowSuggestions(true)
    } else {
      setFilteredUsers([])
      setShowSuggestions(false)
    }
  }, [inputValue, users, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddInstructor = (instructor: string) => {
    if (!value.includes(instructor)) {
      onChange([...value, instructor])
    }
    setInputValue("")
    setShowSuggestions(false)
  }

  const handleRemoveInstructor = (instructor: string) => {
    onChange(value.filter(i => i !== instructor))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filteredUsers.length > 0) {
      e.preventDefault()
      handleAddInstructor(`${filteredUsers[0].voornaam} ${filteredUsers[0].achternaam}`)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      
      {/* Selected Instructors */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((instructor, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-mainAccent/10 text-gray-800 rounded-full text-sm font-medium"
            >
              {instructor}
              <button
                type="button"
                onClick={() => handleRemoveInstructor(instructor)}
                className="ml-1 hover:bg-mainAccent/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input with Suggestions */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 1 && setShowSuggestions(true)}
          placeholder="Typ naam van lesgever..."
          className="w-full"
        />
        
        {showSuggestions && filteredUsers.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredUsers.map((user) => (
              <button
                key={user.user_id}
                type="button"
                onClick={() => handleAddInstructor(`${user.voornaam} ${user.achternaam}`)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{user.voornaam} {user.achternaam}</span>
                {user.email && (
                  <span className="text-xs text-gray-500 ml-auto">{user.email}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-gray-500 italic">Geen lesgevers toegevoegd</p>
      )}
    </div>
  )
}

export default InstructorAutocomplete
