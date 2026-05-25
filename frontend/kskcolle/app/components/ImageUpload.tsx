"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void
  onClose: () => void
}

const MAX_INLINE_IMAGE_SIZE_BYTES = 500 * 1024

export default function ImageUpload({ onImageSelect, onClose }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      setError("")
      onImageSelect(imageUrl.trim())
      onClose()
    }
  }

  const selectInlineFile = (file?: File) => {
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Selecteer een geldig afbeeldingsbestand.")
      return
    }

    if (file.size > MAX_INLINE_IMAGE_SIZE_BYTES) {
      setError("Deze afbeelding is te groot. Gebruik voor grote afbeeldingen een externe URL.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onImageSelect(result)
      onClose()
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    selectInlineFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    selectInlineFile(e.dataTransfer.files[0])
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Afbeelding toevoegen</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Afbeelding URL</label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                setError("")
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button type="button" onClick={handleUrlSubmit} disabled={!imageUrl.trim()}>
              Toevoegen
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Of</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bestand uploaden</label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Sleep een afbeelding hierheen of klik om te selecteren
            </p>
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecteer bestand
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Ondersteunde formaten: JPG, PNG, GIF, WebP. Lokale bestanden worden inline opgeslagen en mogen maximaal 500KB zijn.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  )
}
