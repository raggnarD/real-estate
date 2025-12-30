'use client'

import { useApiCallTrackerContext } from '@/contexts/ApiCallTrackerContext'
import ApiCallStatus from './ApiCallStatus'

/**
 * Client component wrapper that provides the tracker to ApiCallStatus
 * This is needed because hooks can only be called in client components
 */
export default function ApiCallStatusWrapper() {
  const tracker = useApiCallTrackerContext()
  return <ApiCallStatus tracker={tracker} />
}

