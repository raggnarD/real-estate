import { useEffect, useRef } from 'react'

/**
 * Hook to automatically scroll to results section when results are available
 * @param hasResults - Boolean indicating if results should be displayed
 * @param scrollOffset - Optional offset in pixels from the top (default: 20)
 * @param isLoading - Optional boolean indicating if a request is in progress. When this transitions from true to false with results, scroll will trigger.
 */
export function useScrollToResults(
  hasResults: boolean, 
  scrollOffset: number = 20,
  isLoading?: boolean
) {
  const resultsRef = useRef<HTMLDivElement>(null)
  const previousHasResultsRef = useRef(false)
  const previousIsLoadingRef = useRef(isLoading)

  useEffect(() => {
    // Scroll when:
    // 1. Results transition from false to true (first appearance)
    // 2. Or when isLoading transitions from true to false and results exist (form submission completed)
    const loadingJustCompleted = 
      previousIsLoadingRef.current === true && 
      isLoading === false && 
      hasResults

    const shouldScroll = 
      (hasResults && !previousHasResultsRef.current) || // First appearance
      loadingJustCompleted // Loading just completed with results

    if (shouldScroll && resultsRef.current) {
      // Use setTimeout to ensure DOM has fully updated and rendered
      setTimeout(() => {
        if (resultsRef.current) {
          const elementPosition = resultsRef.current.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - scrollOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 150)
    }

    // Update the previous values
    previousHasResultsRef.current = hasResults
    previousIsLoadingRef.current = isLoading
  }, [hasResults, scrollOffset, isLoading])

  return resultsRef
}

