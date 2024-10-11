import React from 'react'
import Link from "next/link"
import { SiFacebook } from "react-icons/si"


const Footer = () => {
  return (
    <footer className="bg-[#FAF7F0] text-[#4A4947]">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className='flex flex-col items-center'>
            <h3 className="text-2xl font-bold mb-4">KSK Colle</h3>
            
            <p className='text-center'>
            Taverne De Graanmaat <br/>
            Grote Markt 24 <br/>
            9100 Sint-Niklaas <br/>
            Tel 03/776.23.26
            </p>
          </div>

          <div className='flex flex-col items-center'>
            <h3 className="text-xl font-bold mb-4">Snelle Links</h3>
            <ul className="space-y-2 text-balance">
              <li><Link href="/" className="text-lg hover:text-[#B17457] transition-colors">Home</Link></li>
              <li><Link href="/over-ons" className="text-lg hover:text-[#B17457] transition-colors">Over Ons</Link></li>
              <li><Link href="/kalender" className="text-lg hover:text-[#B17457] transition-colors">Kalender</Link></li>
              <li><Link href="/toernooien" className="text-lg hover:text-[#B17457] transition-colors">Toernooien</Link></li>
              <li><Link href="/spelers" className="text-lg hover:text-[#B17457] transition-colors">Spelers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex justify-center items-center">Volg Ons</h3>
            <div className="flex space-x-4 justify-center">
              <a href="https://www.facebook.com/groups/KSKColleSintNiklaas" target="_blank" rel="noopener noreferrer" className="text-[#4A4947] hover:text-[#B17457] transition-colors">
                <SiFacebook size={24} />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#D8D2C2] flex justify-center items-center">
          <p className="text-lg">&copy; {new Date().getFullYear()} KSK Colle. Alle rechten voorbehouden.</p>
        </div>
      </div>

    </footer>
  )
}

export default Footer