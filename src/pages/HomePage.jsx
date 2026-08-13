import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import TechSection from '../components/TechSection.jsx'
import ProductSection from '../components/ProductSection.jsx'
import SolutionSection from '../components/SolutionSection.jsx'
import Footer from '../components/Footer.jsx'

function HomePage() {
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
