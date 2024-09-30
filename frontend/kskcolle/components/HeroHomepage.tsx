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
          backgroundImage: "url('/images/background_hero.jpg')", 
        }}
      ></div>

      <div className="absolute inset-0 bg-[#292625] bg-opacity-30"></div>

      <div className="container mx-auto px-4 relative z-10 flex items-center justify-center h-full">
        <div className="flex flex-col items-center text-center">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
              Welkom bij <br/> <span className="text-[#B17457]">KSK Colle</span>
            </h1>
            <p className="mt-4 text-xl text-[#ffffff]">
              De beste schaakclub van het Waasland!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Link href={"#contact"}>
                <Button className="bg-[#B17457] text-[#FAF7F0] hover:bg-[#D8D2C2] hover:text-[#4A4947]">
                  Contact
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link href={"/about"}>
                <Button
                  variant="outline"
                  className="border-[#B17457] text-[#B17457] hover:bg-[#B17457] hover:text-[#FAF7F0]"
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