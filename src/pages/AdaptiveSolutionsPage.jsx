import { useSyncExternalStore } from 'react'
import SolutionsPage from './SolutionsPage.jsx'
import TestSol2Page from './TestSol2Page.jsx'

// This boundary intentionally matches the mobile layout and animation
// boundary used by TestSol2Page.css and TestSol2Page.jsx. Keeping one shared
// value prevents a tablet from mounting the mobile page with desktop styles.
const MOBILE_SOLUTIONS_QUERY = '(max-width: 700px)'

function getMobileQuery() {
  if (typeof window === 'undefined' || !window.matchMedia) return null
  return window.matchMedia(MOBILE_SOLUTIONS_QUERY)
}

function subscribeToViewport(changeHandler) {
  const query = getMobileQuery()
  if (!query) return () => {}

  // addListener/removeListener retain support for older Safari versions.
  if (query.addEventListener) {
    query.addEventListener('change', changeHandler)
    return () => query.removeEventListener('change', changeHandler)
  }

  query.addListener(changeHandler)
  return () => query.removeListener(changeHandler)
}

function isMobileViewport() {
  return getMobileQuery()?.matches ?? false
}

function AdaptiveSolutionsPage() {
  const useMobileExperience = useSyncExternalStore(
    subscribeToViewport,
    isMobileViewport,
    () => false,
  )

  return useMobileExperience ? <TestSol2Page /> : <SolutionsPage />
}

export default AdaptiveSolutionsPage
