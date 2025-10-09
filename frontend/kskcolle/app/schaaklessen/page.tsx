"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock, MapPin, Users, BookOpen, GraduationCap, X } from "lucide-react"
import Image from "next/image"
import { getAll } from "../api/index"

interface CalendarEvent {
  event_id: number
  title: string
  date: string
  startuur: string
  type: string
  description?: string
  is_youth: boolean
  instructors?: string
  begeleider?: string
}

export default function SchaaklessenPage() {
  const [lessons, setLessons] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const events = await getAll("calendar")
        // Filter events with type "Les" and is_youth = false (volwassen lessen)
        const lessonEvents = events.filter((event: CalendarEvent) => 
          event.type === "Les" && event.is_youth === false
        )
        setLessons(lessonEvents)
      } catch (error) {
        console.error("Error fetching lessons:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInstructorInfo = (lesson: CalendarEvent) => {
    // Check if instructors field contains specific names
    const instructors = lesson.instructors ? JSON.parse(lesson.instructors) : []
    const begeleider = lesson.begeleider ? JSON.parse(lesson.begeleider) : []
    
    // Check for Bruno De Jonghe
    if (instructors.some((inst: string) => inst.toLowerCase().includes('bruno') || inst.toLowerCase().includes('jonghe')) ||
        begeleider.some((bg: string) => bg.toLowerCase().includes('bruno') || bg.toLowerCase().includes('jonghe')) ||
        lesson.title.toLowerCase().includes('bruno') || lesson.title.toLowerCase().includes('jonghe')) {
      return {
        name: 'Bruno De Jonghe',
        type: 'bruno',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-400',
        textColor: 'text-green-800',
        accentColor: 'text-green-700'
      }
    }
    
    // Check for Tom Piceu
    if (instructors.some((inst: string) => inst.toLowerCase().includes('tom') || inst.toLowerCase().includes('piceu')) ||
        begeleider.some((bg: string) => bg.toLowerCase().includes('tom') || bg.toLowerCase().includes('piceu')) ||
        lesson.title.toLowerCase().includes('tom') || lesson.title.toLowerCase().includes('piceu')) {
      return {
        name: 'Tom Piceu',
        type: 'tom',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-400',
        textColor: 'text-blue-800',
        accentColor: 'text-blue-700'
      }
    }
    
    // Check if there are any instructors or begeleiders specified
    if (instructors.length > 0) {
      return {
        name: instructors.join(', '),
        type: 'other',
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-400',
        textColor: 'text-gray-800',
        accentColor: 'text-gray-700'
      }
    }
    
    if (begeleider.length > 0) {
      return {
        name: begeleider.join(', '),
        type: 'other',
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-400',
        textColor: 'text-gray-800',
        accentColor: 'text-gray-700'
      }
    }
    
    // Default fallback - no instructor specified
    return {
      name: 'Lesgever niet opgegeven',
      type: 'general',
      color: 'gray',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-400',
      textColor: 'text-gray-800',
      accentColor: 'text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            SCHAAKLESSEN
          </h1>
          <div className="flex items-center justify-center text-xl text-mainAccent font-semibold mb-4">
            <Clock className="mr-2" size={24} />
            Maandagavond om 20:00u
          </div>
          <p className="text-lg text-gray-600">
            Organiseert de club schaaklessen in De Graanmaat
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Instructors Card */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <GraduationCap className="mr-2" size={24} />
                  Lesgevers
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-6">
                   {/* Tom Piceu */}
                   <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                     <div className="space-y-4">
                       <div>
                         <h3 className="font-bold text-blue-800 text-lg mb-2">IM Tom Piceu</h3>
                         <p className="text-blue-700">
                           Tom Piceu is een Internationaal Meester afkomstig uit Oostkamp bij Brugge. Als topspeler in België is hij een zeer ervaren en sterke speler die regelmatig terug te vinden is op internationale toernooien als in de Belgische, Nederlandse en Duitse interclubcompetities. Daarnaast is lesgeven zijn passie waar hij zijn beroep van heeft kunnen maken. Je mag je verwachten aan doorgedreven thematische lessen die toch voor zowel nieuwkomers als sterkere spelers zeer leerrijk zijn. Deze lessen zijn vrij toegankelijk en gratis voor clubleden.
                         </p>
                       </div>
                       <div className="flex justify-center">
                         <div 
                           className="relative h-64 w-80 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                           onClick={() => setSelectedImage("/images/lessen/lessen1.jpg")}
                         >
                           <Image
                             src="/images/lessen/lessen1.jpg"
                             alt="Tom Piceu schaakles"
                             fill
                             className="object-cover"
                             quality={60}
                             sizes="(max-width: 768px) 100vw, 320px"
                             onError={(e) => {
                               console.error('Error loading lessen1.jpg:', e)
                               // Fallback to placeholder if image fails to load
                               e.currentTarget.src = '/images/image_placeholder.png'
                             }}
                           />
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Bruno De Jonghe */}
                   <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                     <div className="space-y-4">
                       <div>
                         <h3 className="font-bold text-green-800 text-lg mb-2">FM Bruno De Jonghe</h3>
                         <p className="text-green-700">
                           Bruno De Jonghe is een Belgische top 100 speler die aangesloten is bij schaakclub Boey in Temse. Hij geeft al vele jaren les aan zowel jongere als minder jongere schakers in de jeugdwerkingen van Temse en andere clubs. Daarnaast heeft hij ook ervaring als schaakcoach van Belgische talenten op internationale jeugdtoernooien. Deze lessen zijn gericht op schakers met al enige ervaring en werken steeds rond een bepaald thema. Voor deze lessen dien je op voorhand in te schrijven. De groep bestaat uit maximum 12 personen. De lessen van Bruno De Jonghe vinden plaats op vijf maandagen in het najaar en vijf maandagen in het voorjaar en kosten €20 per deelnemer per lessenreeks 5.
                         </p>
                       </div>
                       <div className="flex justify-center">
                         <div 
                           className="relative h-64 w-80 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                           onClick={() => setSelectedImage("/images/lessen/lessen2.jpg")}
                         >
                           <Image
                             src="/images/lessen/lessen2.jpg"
                             alt="Bruno De Jonghe schaakles"
                             fill
                             className="object-cover"
                             quality={60}
                             sizes="(max-width: 768px) 100vw, 320px"
                             onError={(e) => {
                               console.error('Error loading lessen2.jpg:', e)
                               // Fallback to placeholder if image fails to load
                               e.currentTarget.src = '/images/image_placeholder.png'
                             }}
                           />
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
              </CardContent>
            </Card>


            {/* Calendar Events */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <CalendarDays className="mr-2" size={24} />
                  Aankomende Schaaklessen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto"></div>
                    <p className="mt-2 text-gray-600">Lessen laden...</p>
                  </div>
                ) : lessons.length > 0 ? (
                   <div className="space-y-3">
                     {lessons.map((lesson) => {
                       const instructorInfo = getInstructorInfo(lesson)
                       
                       return (
                         <div key={lesson.event_id} className={`bg-white border-t border-r border-b border-gray-200 rounded-lg p-3 hover:shadow-md transition-all ${
                           instructorInfo.type === 'tom' ? 'border-l-4 border-l-blue-400' :
                           instructorInfo.type === 'bruno' ? 'border-l-4 border-l-green-400' :
                           'border-l-4 border-l-gray-400'
                         }`}>
                           <div className="flex items-center justify-between mb-2">
                             <h3 className="font-semibold text-base text-gray-900">{lesson.title}</h3>
                             <span className={`text-xs px-2 py-1 rounded-full ${instructorInfo.bgColor} ${instructorInfo.textColor} border ${instructorInfo.borderColor}`}>
                               {instructorInfo.name}
                             </span>
                           </div>
                           <div className="space-y-1">
                             <p className="text-mainAccent text-sm font-medium">
                               {formatDate(lesson.date)} om {lesson.startuur}
                             </p>
                             {lesson.description && (
                               <p className={`${instructorInfo.accentColor} text-xs`}>{lesson.description}</p>
                             )}
                           </div>
                         </div>
                       )
                     })}
                   </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Er zijn momenteel geen schaaklessen gepland.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Card */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <MapPin className="mr-2" size={24} />
                  Locatie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">De Graanmaat</p>
                  <p className="text-gray-600">Maandagavond om 20:00u</p>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Info Card */}
            <Card className="border-yellow-400/30 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <Users className="mr-2" size={24} />
                  Lesinformatie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-800 mb-1">Tom Piceu</p>
                    <p className="text-xs text-green-700">Gratis voor clubleden</p>
                    <p className="text-xs text-green-700">Vrij toegankelijk</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Bruno De Jonghe</p>
                    <p className="text-xs text-blue-700">€20 per lessenreeks</p>
                    <p className="text-xs text-blue-700">Max. 12 personen</p>
                    <p className="text-xs text-blue-700">Inschrijven vereist</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Info */}
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-mainAccent">
                  <CalendarDays className="mr-2" size={24} />
                  Kalender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  De kalender kan je hieronder terugvinden met alle geplande schaaklessen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
            <Image
              src={selectedImage}
              alt="Schaakles - vergroot"
              width={800}
              height={600}
              className="rounded-lg shadow-2xl"
              style={{ maxHeight: '90vh', width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
