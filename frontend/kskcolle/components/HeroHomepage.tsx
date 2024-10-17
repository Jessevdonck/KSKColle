import React from 'react'
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import Link from 'next/link'

const HeroHomepage = () => {
  return (
    <div className="text-[#f7f7f7] relative h-screen flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center filter blur-[2px]"
        style={{
          backgroundImage: "url('/images/background_hero.jpg')" 
        }}
      ></div>

      <div className="absolute inset-0 bg-[#292625] bg-opacity-30"></div>

      <div className="container mx-auto px-4 relative z-10 flex items-center justify-center h-full">
        <div className="flex flex-col items-center text-center">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
              Welkom bij <br/> 
              <span className="text-white relative" style={{
                textShadow: '-2px -2px 0 #065f46, 2px -2px 0 #065f46, -2px 2px 0 #065f46, 2px 2px 0 #065f46'
              }}>
                KSK Colle
              </span>
            </h1>
            <p className="mt-4 text-xl text-[#ffffff]">
              De beste schaakclub van het Waasland!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href={"#contact"}>
                <Button className="bg-emerald-800 text-neutral-50 hover:bg-emerald-900 hover:text-white font-semibold">
                  Contact
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link href={"/about"}>
                <Button
                  variant="outline"
                  className="border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white font-semibold"
                >
                  Over ons
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroHomepage