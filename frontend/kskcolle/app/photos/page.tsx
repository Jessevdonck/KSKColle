"use client"
import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { getAll } from "../api/index"
import { Camera, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const AlbumCard = ({ album }: { album: { id: string; name: string } }) => {
  const [firstPhoto, setFirstPhoto] = useState(null)
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true)
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => {
    const fetchFirstPhoto = async () => {
      try {
        setIsLoadingPhoto(true)
        const photos = await getAll(`photos/albums/${album.id}`)
        if (photos && photos.length > 0) {
          setFirstPhoto(photos[0])
        }
      } catch (error) {
        setPhotoError(true)
      } finally {
        setIsLoadingPhoto(false)
      }
    }

    fetchFirstPhoto()
  }, [album.id])

  return (
    <Link href={`/photos/${album.id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-md">
        <CardContent className="p-0">
          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg overflow-hidden flex items-center justify-center relative">
            {isLoadingPhoto ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={32} />
              </div>
            ) : firstPhoto && !photoError ? (
              <Image
                src={firstPhoto.downloadUrl || firstPhoto.thumbnail || "/placeholder.svg"}
                alt={`${album.name} preview`}
                fill
                className="object-cover hover:scale-110 transition-transform duration-300"
                quality={70}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="eager"
                priority
                style={{
                  imageRendering: "auto",
                }}
              />
            ) : (
              <Camera className="text-gray-500" size={48} />
            )}
          </div>

          <div className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Camera size={20} className="text-mainAccent" />
              <h2 className="text-xl font-semibold text-textColor">{album.name}</h2>
            </div>
            <p className="text-gray-600">Klik om foto&apos;s te bekijken</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function PhotosPage() {
  const { data: albums = [], error, isLoading } = useSWR("photos/albums", () => getAll("photos/albums"))

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Fout bij laden albums</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-mainAccent mx-auto mb-4" size={48} />
          <p className="text-gray-600">Albums laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Camera className="text-mainAccent" size={40} />
              <h1 className="text-4xl font-bold text-textColor">Albums</h1>
            </div>
            <p className="text-xl text-gray-600">Bekijk onze fotocollectie georganiseerd per album</p>
          </div>

          {albums.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="text-gray-400 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Geen albums gevonden</h3>
              <p className="text-gray-500">Er zijn momenteel geen foto albums beschikbaar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {albums.map((album: { id: string; name: string }) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
