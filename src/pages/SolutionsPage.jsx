import { useLayoutEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import AactsShowcase from '../components/AactsShowcase.jsx'
import './SolutionsPage.css'

function SolutionsPage() {
  useLayoutEffect(() => {
    const resetEntryScroll = () => {
      const root = document.documentElement
      const previousBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      window.scrollTo(0, 0)
      root.style.scrollBehavior = previousBehavior
    }

    resetEntryScroll()
    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      resetEntryScroll()
      secondFrame = window.requestAnimationFrame(resetEntryScroll)
    })
    const settleTimer = window.setTimeout(resetEntryScroll, 180)

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      window.clearTimeout(settleTimer)
    }
  }, [])

  return (
    <>
      <Header compact hideOverFooter />
      <main className="solutions-page">
        <AactsShowcase testMobileCanvas singleLayerTest />
      </main>
      <Footer />
    </>
  )
}

export default SolutionsPage
