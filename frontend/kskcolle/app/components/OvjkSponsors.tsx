import Image from "next/image"
import { Handshake } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sponsors = [
  { src: "/images/sponsoring/Sponsor6.png", alt: "Sponsor 6" },
  { src: "/images/sponsoring/Sponsor1.png", alt: "Sponsor 1" },
  { src: "/images/sponsoring/Sponsor2.png", alt: "Sponsor 2" },
  { src: "/images/sponsoring/Sponsor3.png", alt: "Sponsor 3" },
  { src: "/images/sponsoring/Sponsor4.png", alt: "Sponsor 4" },
  { src: "/images/sponsoring/Sponsor5.jpg", alt: "Sponsor 5" },
  { src: "/images/sponsoring/Sponsor7.jpg", alt: "Sponsor 7" },
  { src: "/images/sponsoring/Sponsor8.png", alt: "Sponsor 8" },
]

/** Sponsors van het OVJK-weekend (jeugdkampioenschap + rapidtoernooi), getoond naast de flyer. */
export default function OvjkSponsors({ onSelect }: { onSelect: (src: string) => void }) {
  return (
    <Card className="border-mainAccent/20 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-mainAccent text-base">
          <Handshake className="mr-2" size={20} />
          Onze Sponsors
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center justify-items-center">
          {sponsors.map((sponsor) => (
            <button
              key={sponsor.src}
              type="button"
              onClick={() => onSelect(sponsor.src)}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <Image
                src={sponsor.src}
                alt={sponsor.alt}
                width={120}
                height={80}
                className="object-contain max-h-20"
              />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
