"use client"
import { useParams } from "next/navigation"
import type React from "react"

import useSWR from "swr"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { getAll } from "../../api/index"
import { ArrowLeft, Download, Loader2, Camera, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const ImageWithLoader = ({ src, alt, className, width, height, priority = false, onLoad, style = {}, ...props }) => {
  // Check if it's a Google Drive URL - if so, skip optimization for speed
  const isGoogleDrive = src && (src.includes('drive.google.com') || src.includes('googleusercontent.com'))
  
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onLoad={onLoad || undefined}
      quality={isGoogleDrive ? 100 : 70}
      unoptimized={isGoogleDrive}
      loading={priority ? "eager" : "lazy"}
      style={{
        imageRendering: "auto",
        ...style,
      }}
      {...props}
    />
  )
}

export default function PhotoAlbumPage() {
  const { albumId } = useParams()
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [lightboxImageLoading, setLightboxImageLoading] = useState(false)

  const shouldFetch = Boolean(albumId)
  const {
    data: photos,
    error,
    isLoading,
  } = useSWR(shouldFetch ? `photos/albums/${albumId}` : null, (url) => getAll(url))

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index)
    setLightboxImageLoading(true)
  }

  const closeLightbox = () => {
    setSelectedPhotoIndex(null)
    setLightboxImageLoading(false)
  }

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && photos && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
      setLightboxImageLoading(true)
    }
  }

  const goToNext = () => {
    if (selectedPhotoIndex !== null && photos && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1)
      setLightboxImageLoading(true)
    }
  }

  const handleLightboxImageLoad = () => {
    setLightboxImageLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious()
    if (e.key === "ArrowRight") goToNext()
    if (e.key === "Escape") closeLightbox()
  }

  if (!albumId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-mainAccent mx-auto mb-4" size={48} />
          <p className="text-gray-600">Album laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Link href="/photos">
              <Button variant="ghost" className="mb-8 hover:bg-gray-200">
                <ArrowLeft size={20} className="mr-2" />
                Terug naar Albums
              </Button>
            </Link>

            <div className="text-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Fout bij laden album</h2>
              <p className="text-gray-600">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !photos) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <Link href="/photos">
              <Button variant="ghost" className="mb-8 hover:bg-gray-200">
                <ArrowLeft size={20} className="mr-2" />
                Terug naar Albums
              </Button>
            </Link>

            <div className="text-center py-12">
              <Loader2 className="animate-spin text-mainAccent mx-auto mb-4" size={48} />
              <p className="text-gray-600">Foto&apos;s laden...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <Link href="/photos">
            <Button variant="ghost" className="mb-8 hover:bg-gray-200">
              <ArrowLeft size={20} className="mr-2" />
              Terug naar Albums
            </Button>
          </Link>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Camera className="text-mainAccent" size={40} />
              <h1 className="text-4xl font-bold text-textColor">Foto&apos;s in album</h1>
            </div>
            <p className="text-xl text-gray-600">{photos.length} foto&apos;s gevonden</p>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="text-gray-400 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Geen foto&apos;s gevonden</h3>
              <p className="text-gray-500">Dit album bevat momenteel geen foto&apos;s.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((p, index) => (
                <Card
                  key={p.id}
                  className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 shadow-md cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-200 rounded-t-lg overflow-hidden">
                      <ImageWithLoader
                        src={p.thumbnail || p.optimizedUrl || p.downloadUrl || "/placeholder.svg"}
                        alt={p.title}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        priority={index < 20}
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-gray-500">Klik om te vergroten</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Lightbox Modal */}
          <Dialog open={selectedPhotoIndex !== null} onOpenChange={closeLightbox}>
            <DialogContent
              className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 border-0 overflow-hidden"
              onKeyDown={handleKeyDown}
            >
              {selectedPhoto && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Loading Spinner for Lightbox */}
                  {lightboxImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-40">
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6">
                        <Loader2 className="animate-spin text-white mx-auto mb-2" size={32} />
                        <p className="text-white text-sm">Foto laden...</p>
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
                    onClick={closeLightbox}
                  >
                    <X size={24} />
                  </Button>

                  {/* Download Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-16 z-50 text-white hover:bg-white/20 rounded-full"
                    asChild
                  >
                    <a href={selectedPhoto.downloadUrl} target="_blank" rel="noreferrer" download>
                      <Download size={24} />
                    </a>
                  </Button>

                  {/* Previous Button */}
                  {selectedPhotoIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full"
                      onClick={goToPrevious}
                      disabled={lightboxImageLoading}
                    >
                      <ChevronLeft size={32} />
                    </Button>
                  )}

                  {/* Next Button */}
                  {selectedPhotoIndex < photos.length - 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full"
                      onClick={goToNext}
                      disabled={lightboxImageLoading}
                    >
                      <ChevronRight size={32} />
                    </Button>
                  )}

                  {/* Main Image */}
                  <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                      {/* Show thumbnail for instant display */}
                      <ImageWithLoader
                        src={selectedPhoto.thumbnail || "/placeholder.svg"}
                        alt={selectedPhoto.title}
                        width={1200}
                        height={800}
                        sizes="100vw"
                        className="max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] w-auto h-auto object-contain"
                        priority={true}
                        onLoad={handleLightboxImageLoad}
                        style={{
                          width: "auto",
                          height: "auto",
                          maxWidth: "100%",
                          maxHeight: "100%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="absolute bottom-4 left-4 right-4 z-50">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                      <p className="text-sm text-gray-300">
                        {selectedPhotoIndex + 1} van {photos.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
