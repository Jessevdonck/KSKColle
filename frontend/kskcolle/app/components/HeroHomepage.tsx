import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

const HeroHomepage = () => {
  return (
    <div className="text-white relative h-screen flex items-center overflow-hidden">
      {/* Background Image WITHOUT blur for better performance */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center transform-gpu"
        style={{
          backgroundImage: "url('/images/background_hero.jpg')",
          transform: "translateZ(0)", // Force GPU acceleration
        }}
      ></div>

      {/* Stronger Gradient Overlay for Better Contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/50"></div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 flex items-center justify-center h-full">
        <div className="flex flex-col items-center text-center max-w-4xl">
          {/* Main Content */}
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-7xl tracking-tight leading-tight drop-shadow-2xl">
              Welkom bij{" "}
              <span
                className="block mt-4 text-mainAccent font-black"
                style={{ textShadow: "3px 3px 6px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.8)" }}
              >
                KSK Colle
              </span>
            </h1>
            <p className="mt-8 text-xl sm:text-2xl text-white font-medium drop-shadow-lg">
              De beste schaakclub van het Waasland!
            </p>
          </div>

          {/* Action Buttons - Optimized for performance */}
          <div className="mb-12 flex flex-col sm:flex-row justify-center gap-4">
            <Link href={"#contact"}>
              <Button
                size="lg"
                className="bg-mainAccent text-white hover:bg-mainAccentDark font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform-gpu"
                data-cy="contact"
              >
                Contact
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href={"/about"}>
              <Button
                variant="outline"
                size="lg"
                className="bg-black/50 border-2 border-white/60 hover:border-mainAccent text-white hover:bg-mainAccent hover:text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform-gpu"
                data-cy="about"
              >
                Over ons
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroHomepage
