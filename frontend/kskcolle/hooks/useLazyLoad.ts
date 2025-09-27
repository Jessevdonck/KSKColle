"use client"

import { useState, useEffect } from 'react'
import { useIntersectionObserver } from './useIntersectionObserver'

interface UseLazyLoadOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useLazyLoad(options: UseLazyLoadOptions = {}) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
    ...options
  })

  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (isIntersecting && !shouldLoad) {
      setShouldLoad(true)
    }
  }, [isIntersecting, shouldLoad])

  return {
    ref,
    shouldLoad
  }
}
