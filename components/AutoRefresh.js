'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * A client helper that triggers Next.js router data refresh at a periodic interval.
 * Re-runs server side data queries without full page reload.
 */
export default function AutoRefresh({ interval = 10000 }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh()
    }, interval)
    return () => clearInterval(timer)
  }, [router, interval])

  return null
}
