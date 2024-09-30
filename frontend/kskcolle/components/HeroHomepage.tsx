import React from 'react'
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

const heroHomepage = () => {
  return (
    <div className="text-[#f7f7f7] relative">
      <div
        className="absolute inset-0 bg-cover bg-no-repeat bg-center filter blur-sm"
        style={{
          backgroundImage: "url('/images/background_hero.jpg')", 
        }}
      ></div>

      
      <div className="absolute inset-0 bg-[#292625] bg-opacity-30"></div>

      <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32 relative z-10">
        <div className="flex flex-col justify-center items-center lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
              Welkom bij <br /> <span className="text-[#B17457]">KSK Colle</span>
            </h1>
            <p className="mt-4 text-xl text-[#ffffff]">
              Welkom bij schaakclub KSK COLLE Sint-Niklaas!
            </p>
            <div className="mt-8 flex flex-col justify-center sm:flex-row gap-4">
              <Button className="bg-[#B17457] text-[#FAF7F0] hover:bg-[#D8D2C2] hover:text-[#4A4947]">
                Contact
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-[#B17457] text-[#B17457] hover:bg-[#B17457] hover:text-[#FAF7F0]"
              >
                Over ons
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default heroHomepage
