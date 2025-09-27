"use client"

import { useEffect } from 'react'
import { measureWebVitals, observePerformance, analyzeResourceTiming } from '@/lib/performance'

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') return

    // Measure Web Vitals
    measureWebVitals((metric) => {
      // Send to analytics service (replace with your preferred service)
      // Example: gtag('event', metric.name, { value: metric.value })
    })

    // Observe performance entries
    const observer = observePerformance()

    // Analyze resource timing after page load
    const analyzeResources = () => {
      setTimeout(() => {
        const analysis = analyzeResourceTiming()
        // Analysis is performed but not logged
      }, 2000)
    }

    if (document.readyState === 'complete') {
      analyzeResources()
    } else {
      window.addEventListener('load', analyzeResources)
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener('load', analyzeResources)
    }
  }, [])

  return null
}
