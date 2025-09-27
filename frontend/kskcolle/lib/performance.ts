// Performance monitoring utilities

export interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

// Web Vitals measurement
export function measureWebVitals(onPerfEntry?: (metric: any) => void) {
  if (typeof window !== 'undefined' && onPerfEntry) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
  }
}

// Performance observer for custom metrics
export function observePerformance() {
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Log performance entries for debugging
      console.log('Performance entry:', {
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        entryType: entry.entryType
      })
    }
  })

  try {
    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
  } catch (e) {
    console.warn('Performance Observer not supported')
  }

  return observer
}

// Resource timing analysis
export function analyzeResourceTiming() {
  if (typeof window === 'undefined') return null

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  const analysis = {
    totalResources: resources.length,
    totalSize: 0,
    totalTime: 0,
    byType: {} as Record<string, { count: number; size: number; time: number }>
  }

  resources.forEach(resource => {
    const type = resource.name.split('.').pop() || 'unknown'
    const size = resource.transferSize || 0
    const time = resource.duration || 0

    analysis.totalSize += size
    analysis.totalTime += time

    if (!analysis.byType[type]) {
      analysis.byType[type] = { count: 0, size: 0, time: 0 }
    }

    analysis.byType[type].count++
    analysis.byType[type].size += size
    analysis.byType[type].time += time
  })

  return analysis
}

// Bundle size monitoring
export function monitorBundleSize() {
  if (typeof window === 'undefined') return

  const scripts = Array.from(document.querySelectorAll('script[src]'))
  let totalSize = 0

  scripts.forEach(script => {
    const src = script.getAttribute('src')
    if (src && src.includes('_next/static')) {
      // This is a Next.js chunk
      fetch(src, { method: 'HEAD' })
        .then(response => {
          const contentLength = response.headers.get('content-length')
          if (contentLength) {
            totalSize += parseInt(contentLength)
            console.log(`Bundle chunk: ${src} - ${(parseInt(contentLength) / 1024).toFixed(2)} KB`)
          }
        })
        .catch(() => {
          // Ignore errors for monitoring
        })
    }
  })

  return totalSize
}
