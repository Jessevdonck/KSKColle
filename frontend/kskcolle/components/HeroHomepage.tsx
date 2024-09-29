import React from 'react'
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

const heroHomepage = () => {
  return (
    <div className="bg-[#FAF7F0] text-[#4A4947]">
      <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="flex flex-col justify-center items-center lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
              Welkom bij <span className="text-[#B17457]">KSK Colle</span>
            </h1>
            <p className="mt-4 text-xl text-[#4a4747]">
              Welkom bij schaakclub KSK COLLE Sint-Niklaas!
            </p>
            <div className="mt-8 flex flex-col  justify-center sm:flex-row gap-4">
              <Button className="bg-[#B17457] text-[#FAF7F0] hover:bg-[#D8D2C2] hover:text-[#4A4947]">
                Contact
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-[#B17457] text-[#B17457] hover:bg-[#B17457] hover:text-[#FAF7F0]">
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