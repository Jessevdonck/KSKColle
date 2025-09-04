"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { uploadAvatar, deleteAvatar } from '../api'
import  useSWRMutation from 'swr/mutation'
import { toast } from 'sonner'
import Image from 'next/image'
import { useAuth } from '../contexts/auth'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  userId: number
  onAvatarChange?: (avatarUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
}

const AvatarUpload = ({ 
  currentAvatarUrl, 
  userId, 
  onAvatarChange, 
  size = 'md' 
}: AvatarUploadProps) => {
  const { mutateUser } = useAuth()
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 32
  }

  const { trigger: uploadTrigger } = useSWRMutation(
    '/avatar/upload',
    () => uploadAvatar(selectedFile!)
  )

  const { trigger: deleteTrigger } = useSWRMutation(
    '/avatar',
    () => deleteAvatar()
  )

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Alleen afbeeldingen zijn toegestaan')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bestand is te groot. Maximum grootte is 5MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const result = await uploadTrigger()
      
                   if (result.success) {
               const fullAvatarUrl = result.avatarUrl.startsWith('http') 
                 ? result.avatarUrl 
                 : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:9000' : 'https://kskcolle-production.up.railway.app')}${result.avatarUrl}`
               setPreviewUrl(fullAvatarUrl)
               onAvatarChange?.(fullAvatarUrl)
               // Update user data in auth context
               mutateUser((user) => user ? { ...user, avatar_url: fullAvatarUrl } : user, false)
               toast.success('Profielfoto succesvol geüpload!')
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(result.message || 'Upload mislukt')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Er is een fout opgetreden bij het uploaden')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    setIsUploading(true)
    try {
      const result = await deleteTrigger()
      
      if (result.success) {
        setPreviewUrl(null)
        onAvatarChange?.(null)
        // Update user data in auth context
        mutateUser((user) => user ? { ...user, avatar_url: null } : user, false)
        toast.success('Profielfoto verwijderd')
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        toast.error(result.message || 'Verwijderen mislukt')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Er is een fout opgetreden bij het verwijderen')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(currentAvatarUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="w-fit">
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Display */}
          <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200`}>
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profielfoto"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="text-gray-400" size={iconSizes[size]} />
              </div>
            )}
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 w-full">
            {!selectedFile ? (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
                size="sm"
              >
                <Upload className="mr-2" size={16} />
                {previewUrl ? 'Wijzig foto' : 'Upload foto'}
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                  size="sm"
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 animate-spin" size={16} />
                  ) : (
                    <Upload className="mr-2" size={16} />
                  )}
                  Uploaden
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isUploading}
                  variant="outline"
                  size="sm"
                >
                  <X size={16} />
                </Button>
              </div>
            )}

            {previewUrl && !selectedFile && (
              <Button
                onClick={handleDelete}
                disabled={isUploading}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                {isUploading ? (
                  <Loader2 className="mr-2 animate-spin" size={16} />
                ) : (
                  <X className="mr-2" size={16} />
                )}
                Verwijder
              </Button>
            )}
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="text-xs text-gray-500 text-center">
              <p className="font-medium">{selectedFile.name}</p>
              <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default AvatarUpload
