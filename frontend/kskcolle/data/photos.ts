export interface PhotoCategory {
  id: string
  name: string
  description: string
  coverImage: string
  photos: Photo[]
}

export interface Photo {
  id: string
  url: string
  title: string
  description?: string
  date: string
}

export const photoCategories: PhotoCategory[] = [
  {
    id: "tournaments",
    name: "Toernooien",
    description: "Foto's van onze toernooien en competities",
    coverImage: "/placeholder.svg?height=300&width=400",
    photos: [
      {
        id: "1",
        url: "/placeholder.svg?height=400&width=600",
        title: "Clubkampioenschap 2024",
        description: "De finale van het clubkampioenschap",
        date: "2024-03-15",
      },
      {
        id: "2",
        url: "/placeholder.svg?height=400&width=600",
        title: "Interclub wedstrijd",
        description: "Wedstrijd tegen SK Temse",
        date: "2024-02-20",
      },
    ],
  },
  {
    id: "events",
    name: "Evenementen",
    description: "Clubfeesten en speciale gelegenheden",
    coverImage: "/placeholder.svg?height=300&width=400",
    photos: [
      {
        id: "3",
        url: "/placeholder.svg?height=400&width=600",
        title: "Nieuwjaarsreceptie 2024",
        description: "Gezellige nieuwjaarsreceptie met alle leden",
        date: "2024-01-10",
      },
      {
        id: "4",
        url: "/placeholder.svg?height=400&width=600",
        title: "Kampioenenviering",
        description: "Viering van onze kampioenen",
        date: "2023-12-15",
      },
    ],
  },
  {
    id: "club-life",
    name: "Clubleven",
    description: "Sfeerbeelden van onze wekelijkse clubavonden",
    coverImage: "/placeholder.svg?height=300&width=400",
    photos: [
      {
        id: "5",
        url: "/placeholder.svg?height=400&width=600",
        title: "Donderdagavond in De Graanmaat",
        description: "Geconcentreerd schaken tijdens de clubavond",
        date: "2024-01-25",
      },
      {
        id: "6",
        url: "/placeholder.svg?height=400&width=600",
        title: "Analyse na de partij",
        description: "Spelers bespreken hun partij",
        date: "2024-01-18",
      },
    ],
  },
  {
    id: "history",
    name: "Geschiedenis",
    description: "Historische foto's van onze club",
    coverImage: "/placeholder.svg?height=300&width=400",
    photos: [
      {
        id: "7",
        url: "/placeholder.svg?height=400&width=600",
        title: "Oprichting KSK Colle",
        description: "De oprichters van onze club in 1944",
        date: "1944-01-01",
      },
      {
        id: "8",
        url: "/placeholder.svg?height=400&width=600",
        title: "25-jarig bestaan",
        description: "Viering van het 25-jarig bestaan",
        date: "1969-01-01",
      },
    ],
  },
]
