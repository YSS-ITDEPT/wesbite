import { useEffect } from 'react'
import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import TechSection from '../components/TechSection.jsx'
import ProductSection from '../components/ProductSection.jsx'
import SolutionSection from '../components/SolutionSection.jsx'
import Footer from '../components/Footer.jsx'

function HomePage() {
  useEffect(() => {
    // Route changes can preserve the previous page's scroll offset in some
    // browsers, which lets the hero initialize mid-story instead of at the
    // opening frame. Force home back to the top and re-dispatch scroll after
    // the DOM settles so the first headline render is always correct.
    window.scrollTo(0, 0)
    window.requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      window.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('resize'))
    })
  }, [])

  return (
    <>
      <Header />
      <main>
        <Hero />
        <TechSection />
        <ProductSection />
        <SolutionSection />
        <Footer />
      </main>
    </>
  )
}

export default HomePage
