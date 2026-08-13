import { useEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import './LegalPage.css'

function LegalPage({ eyebrow, title, subtitle, effectiveDate, intro, sections }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return (
    <>
      <Header />
      <main className="legal-page">
        <section className="legal-hero" aria-label={title}>
          <div className="legal-hero__glow" aria-hidden="true" />
          <div className="legal-hero__grid" aria-hidden="true" />
          <div className="legal-hero__inner">
            <p className="legal-hero__eyebrow">
              <span />
              {eyebrow}
            </p>
            <h1 className="legal-hero__title">{title}</h1>
            {subtitle && <p className="legal-hero__subtitle">{subtitle}</p>}
            {effectiveDate && (
              <p className="legal-hero__meta">Effective Date: {effectiveDate}</p>
            )}
          </div>
        </section>

        <section className="legal-body" aria-label={`${title} content`}>
          <div className="legal-body__inner">
            {intro && <p className="legal-lead">{intro}</p>}

            <ol className="legal-sections">
              {sections.map((section, i) => (
                <li className="legal-section" key={section.heading}>
                  <div className="legal-section__index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="legal-section__content">
                    <h2 className="legal-section__heading">{section.heading}</h2>
                    {section.body.map((paragraph, j) => (
                      <p className="legal-section__text" key={j}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default LegalPage
