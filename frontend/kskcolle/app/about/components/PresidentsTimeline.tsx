'use client'

import React, { useRef, useState, useEffect } from 'react'

const presidents = [
  { name: "Robert Pauwels", period: "1944 - 1969" },
  { name: "Leon Coppens", period: "1969 - 1994" },
  { name: "Marc Weyns", period: "1994 - 2001" },
  { name: "Wim Weyers", period: "2001 - 2019" },
  { name: "Bart Schittekat", period: "2019 - 2023" },
  { name: "Niels Ongena", period: "2023 - heden" },
]

export default function Presidents() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [itemWidth, setItemWidth] = useState(0)

  useEffect(() => {
    const updateItemWidth = () => {
      if (scrollRef.current) {
        const containerWidth = scrollRef.current.offsetWidth
        setItemWidth(containerWidth / 4) 
      }
    }

    updateItemWidth()
    window.addEventListener('resize', updateItemWidth)
    return () => window.removeEventListener('resize', updateItemWidth)
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current!.offsetLeft)
    setScrollLeft(scrollRef.current!.scrollLeft)
  }

  const onMouseUp = () => {
    setIsDragging(false)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current!.offsetLeft
    const walk = (x - startX) * 2
    scrollRef.current!.scrollLeft = scrollLeft - walk
  }

  return (
    <section className="mb-16 px-4 ">
      <h2 className="text-3xl font-bold text-[#4A4947] mb-6">Onze Voorzitters</h2>
      <div className="relative overflow-hidden">
        <div className="absolute left-0 right-0 h-1 bg-mainAccent top-4"></div>
        <div 
          ref={scrollRef}
          className="flex items-start pb-8 pt-8 cursor-grab active:cursor-grabbing"
          style={{ 
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseUp}
        >
          {presidents.map((president, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center flex-shrink-0 scroll-snap-align-start px-4"
              style={{ width: `${itemWidth}px` }}
            >
              <div className="w-3 h-3 bg-mainAccent rounded-full mb-4 z-10"></div>
              <time className="mb-2 text-sm font-normal text-center leading-none text-mainAccent">{president.period}</time>
              <h3 className="text-lg font-semibold text-[#4A4947] text-center">{president.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}