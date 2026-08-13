import { useEffect, useLayoutEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import './TestSol2Page.css'

const frame = (path) => `${import.meta.env.BASE_URL}${path}`
const pageUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
const LOGO_URL = 'https://ik.imagekit.io/jxuol7kjt/logo.png?updatedAt=1765784361412'

const PRODUCT_ROUTE_ALIASES = {
  aacts3000: 'aacts-3000',
  'aacts-3000': 'aacts-3000',
  card: 'sample-card',
  'sample-card': 'sample-card',
  handheld: 'handheld',
  sampler: 'high-volume',
  'high-volume': 'high-volume',
  cleaner: 'cleaner',
}

const products = [
  {
    id: 'aacts-3000',
    number: '01',
    category: 'Threat analysis platform',
    name: 'AACTS 3000',
    statement: 'Chemical intelligence in twenty seconds.',
    copy: 'A field-proven analyser built for rapid identification of narcotics and explosives at trace levels. Dual-polarity AACTS–AIMS gives operators one clear, defensible result.',
    facts: [['20 sec', 'analysis'], ['NG–PG', 'sensitivity'], ['17 kg', 'system weight']],
    specs: [
      ['Technology', 'AACTS TRU-RAD AIMS'],
      ['Sensitivity', 'Nanogram to picogram levels'],
      ['Analysis time', '20 seconds'],
      ['Weight', '17 kg (37.5 lbs)'],
      ['Dimensions', '40cm (L) × 39cm (W) × 34cm (H)'],
      ['Narcotics detected', 'Heroin, Fentanyl, Cocaine, MDMA, Marijuana, and others'],
      ['Explosives detected', 'NG, AN, DNT, TNT, RDX, PETN, TATP, HMTD, and others'],
      ['Target analyte', 'The machine can be updated for any target analyte'],
    ],
    image: frame('aacts-frames-mobile/frame_000096.webp'),
  },
  {
    id: 'sample-card',
    number: '02',
    category: 'Sample capture medium',
    name: 'Aspiration Sample Card',
    statement: 'A controlled interface between air and analysis.',
    copy: 'A reusable fine-wire collection surface engineered to capture microscopic particles and vapours, then transfer the sample into the analytical workflow without unnecessary handling.',
    facts: [['SPME', 'treated mesh'], ['Reusable', 'field cycle'], ['Trace', 'particle capture']],
    specs: [
      ['Material', 'Fine wire mesh treated with patented SPME for effective adsorption'],
      ['Design', 'Heat-resistant handle moulded to the mesh for easy handling'],
      ['Reusability', 'Can be cleaned and reused after each sampling cycle'],
      ['Sample capture', 'Adsorbs microscopic airborne particles and vapour samples'],
    ],
    image: frame('sample-card-frames-mobile/frame_000078.webp'),
  },
  {
    id: 'handheld',
    number: '03',
    category: 'Portable sampling system',
    name: 'Handheld Sampler',
    statement: 'Take active sampling to the point of interest.',
    copy: 'A battery-powered sampler for vehicles, parcels and hard-to-reach interiors. The operator controls collection time and flow while the compact system does the physical work.',
    facts: [['18V', 'battery'], ['150 L/min', 'flow rate'], ['4.5 lb', 'field weight']],
    specs: [
      ['Power', '18V quick-swappable lithium-ion battery; 1-hour continuous use, up to 80 samples'],
      ['Sampling time', '10 seconds to 2 minutes, user-controlled'],
      ['Flow rate', 'Aspiration Card: 150 L/min'],
      ['Weight', '4.5 lbs with battery; 3.0 lbs without battery'],
      ['Dimensions', '19.9cm (L) × 11.3cm (W) × 22.1cm (H)'],
      ['Operating conditions', '-20°C to +50°C, RH > 9, non-condensing'],
    ],
    image: frame('handheld-frames-mobile/frame_000083.webp'),
  },
  {
    id: 'high-volume',
    number: '04',
    category: 'Large-area collection',
    name: 'High Volume Sampler',
    statement: 'Move more air. Examine more surface.',
    copy: 'High-throughput collection for containers, cargo, enclosures and large surfaces where swabbing is impractical. Built to make difficult sampling locations operationally accessible.',
    facts: [['9.5 kg', 'portable unit'], ['110/220V', 'configurations'], ['0–40°C', 'operation']],
    specs: [
      ['Electrical configuration', 'HVS-1000: 110VAC, 11A max, 60Hz. HVS-1000E: 220VAC, 10A max, 50Hz'],
      ['Dimensions', '30.5cm (L) × 36cm (W) × 26cm (H)'],
      ['Weight', '9.5 kg'],
      ['Fuse type', '12 amps'],
      ['Hood dimensions', '39cm (L) × 28cm (W) × 15cm (H)'],
      ['Operating temperature', '0°C to 40°C, <95% relative humidity, non-condensing'],
    ],
    image: frame('high-volume-frames-mobile/frame_000080.webp'),
  },
  {
    id: 'cleaner',
    number: '05',
    category: 'Rapid card recovery',
    name: 'Aspiration Card Cleaner',
    statement: 'Reset the sampling workflow in five minutes.',
    copy: 'A compact decontamination station that restores up to five aspiration cards in one controlled cycle, keeping teams supplied without compromising repeatability.',
    facts: [['5 min', 'cleaning cycle'], ['5 cards', 'simultaneously'], ['2.95 kg', 'system weight']],
    specs: [
      ['Electrical requirements', '24V DC, 5A max'],
      ['Power supply', '100–240V AC, 2.5A, 50/60Hz, 150W max'],
      ['Cleaning cycle time', '5 minutes'],
      ['Operating temperature', '0°C to 40°C'],
      ['Weight', '6.5 lbs (2.95 kg)'],
      ['Dimensions', '27.5cm (L) × 25.5cm (W) × 12.5cm (H)'],
    ],
    image: frame('card-cleaner-frames-mobile/frame_000082.webp'),
  },
]

function ProductStudy({ product }) {
  return (
    <article className="sol2-product" id={product.id} data-sol2-reveal>
      <div className="sol2-product__runway">
        <div className="sol2-product__scene">
          <div className="sol2-product__progress" aria-hidden="true"><i /></div>
          <div className="sol2-product__index" aria-hidden="true">
            <span>{product.number}</span><i /> <small>05</small>
          </div>

          <div className="sol2-product__copy">
            <p className="sol2-kicker">{product.category}</p>
            <h2>{product.name}</h2>
            <h3>{product.statement}</h3>
            <p className="sol2-product__description">{product.copy}</p>
            <dl className="sol2-facts">
              {product.facts.map(([value, label]) => (
                <div key={label}>
                  <dt>{value}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={`sol2-study${product.id === 'high-volume' ? ' sol2-study--high-volume' : ''}`} aria-label={`${product.name} product study`}>
            <div className="sol2-study__cue" aria-hidden="true"><i /><span>Scroll to examine</span><b>↓</b></div>
            <figure className="sol2-study__primary">
              <img src={product.image} alt={product.name} loading={product.number === '01' ? 'eager' : 'lazy'} />
              <div className="sol2-brand-overlay" aria-hidden="true"><img src={LOGO_URL} alt="" /></div>
              <div className="sol2-image-hud" aria-hidden="true"><span>Frame / verified</span><b>AS—{product.number}</b></div>
            </figure>
          </div>
        </div>
      </div>

      <section className="sol2-specifications" aria-labelledby={`${product.id}-spec-title`}>
        <div className="sol2-specifications__lockup" aria-hidden="true">
          <b>{product.number}</b>
          <span>{product.name}</span>
          <i>Product dossier</i>
        </div>
        <header>
          <p className="sol2-kicker">Verified system data / {product.number}</p>
          <h3 id={`${product.id}-spec-title`}>Complete specifications</h3>
          <span>{String(product.specs.length).padStart(2, '0')} entries</span>
        </header>
        <dl>
          {product.specs.map(([label, value], index) => (
            <div key={label}>
              <dt><b>{String(index + 1).padStart(2, '0')}</b>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  )
}

function TestSol2Page() {
  useLayoutEffect(() => {
    if (document.querySelector('link[data-sol2-shell]')) return undefined
    const stylesheet = document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.href = frame('index-chrome.css')
    stylesheet.dataset.sol2Shell = 'true'
    document.head.appendChild(stylesheet)
    return () => stylesheet.remove()
  }, [])

  useLayoutEffect(() => {
    const requestedProduct = new URLSearchParams(window.location.search)
      .get('product')
      ?.toLowerCase()
    const requestedHash = window.location.hash.slice(1).toLowerCase()
    const targetId = PRODUCT_ROUTE_ALIASES[requestedProduct]
      || PRODUCT_ROUTE_ALIASES[requestedHash]

    const scrollToEntry = () => {
      const root = document.documentElement
      const previousBehavior = root.style.scrollBehavior
      const target = targetId ? document.getElementById(targetId) : null
      const top = target
        ? target.getBoundingClientRect().top + window.scrollY - 72
        : 0

      root.style.scrollBehavior = 'auto'
      window.scrollTo(0, Math.max(0, top))
      root.style.scrollBehavior = previousBehavior
    }

    scrollToEntry()
    const settleFrame = window.requestAnimationFrame(scrollToEntry)
    const settleTimer = window.setTimeout(scrollToEntry, 120)

    return () => {
      window.cancelAnimationFrame(settleFrame)
      window.clearTimeout(settleTimer)
    }
  }, [])

  useEffect(() => {
    const elements = [...document.querySelectorAll('[data-sol2-reveal]')]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      }),
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const mobileQuery = window.matchMedia('(max-width: 700px)')
    const isIOS = /iP(?:hone|ad|od)/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const root = document.documentElement
    root.classList.toggle('sol2-ios-motion', isIOS)

    // Cache every node once. Querying and measuring the whole chapter during
    // every touch-scroll frame causes visible hitching in mobile Safari.
    const studies = [...document.querySelectorAll('.sol2-product')].map((study) => ({
      element: study,
      runway: study.querySelector('.sol2-product__runway'),
      scene: study.querySelector('.sol2-product__scene'),
      index: study.querySelector('.sol2-product__index'),
      copy: study.querySelector('.sol2-product__copy'),
      studyElement: study.querySelector('.sol2-study'),
      studyCue: study.querySelector('.sol2-study__cue'),
      primary: study.querySelector('.sol2-study__primary'),
      primaryImage: study.querySelector('.sol2-study__primary > img'),
      brandOverlay: study.querySelector('.sol2-brand-overlay'),
      imageHud: study.querySelector('.sol2-image-hud'),
      progressRail: study.querySelector('.sol2-product__progress i'),
      isHighVolume: study.id === 'high-volume',
      top: 0,
      scrollable: 1,
      studyHeight: 0,
      overflowLift: 0,
      replacementLift: 0,
      current: 0,
      target: 0,
      rendered: false,
    }))
    let animationFrame = 0
    let resizeFrame = 0
    let viewportHeight = window.visualViewport?.height || window.innerHeight
    const clamp = (value) => Math.min(1, Math.max(0, value))
    const ease = (value) => value * value * (3 - 2 * value)

    const measure = () => {
      resizeFrame = 0
      viewportHeight = window.visualViewport?.height || window.innerHeight
      const scrollY = window.scrollY || window.pageYOffset
      const mobileChapters = mobileQuery.matches

      studies.forEach((chapter) => {
        const { element, runway, scene, index, copy, studyElement } = chapter
        const measuredElement = runway || element
        const rect = measuredElement.getBoundingClientRect()
        chapter.top = rect.top + scrollY
        chapter.scrollable = Math.max(1, rect.height - (viewportHeight - 72))

        if (mobileChapters && copy && studyElement) {
          // These values are stable for the chapter. Writing them once avoids
          // Safari's forced layout loop while a finger is moving the page.
          const naturalCopyBottom = copy.offsetTop + copy.offsetHeight
          chapter.studyHeight = studyElement.offsetHeight
          // Short iPhone viewports can leave the image below the clipped sticky
          // scene. Record the exact overflow so the compositor can lift the
          // complete product study into view without another layout read.
          chapter.overflowLift = Math.max(
            0,
            Math.round(naturalCopyBottom + 14 + chapter.studyHeight - (scene?.clientHeight || 0)),
          )
          const revealedTop = naturalCopyBottom + 14 - chapter.overflowLift
          const replacementTop = (index?.offsetTop || 0) + (index?.offsetHeight || 0) + 12
          chapter.replacementLift = Math.max(0, Math.round(revealedTop - replacementTop))
          studyElement.style.top = `${Math.round(naturalCopyBottom + 14)}px`
          studyElement.style.bottom = 'auto'
          const finalImageBottom = replacementTop + chapter.studyHeight
          element.style.setProperty(
            '--spec-lift',
            `${Math.max(0, Math.round((scene?.clientHeight || 0) - finalImageBottom))}px`,
          )
        }
      })
    }

    const render = () => {
      animationFrame = 0
      let needsAnotherFrame = false
      const scrollY = window.scrollY || window.pageYOffset
      const mobileChapters = mobileQuery.matches
      studies.forEach((chapter) => {
        const {
          copy, studyElement, studyCue, primary,
          primaryImage, brandOverlay, imageHud, progressRail, isHighVolume,
        } = chapter
        const targetProgress = mobileChapters
          ? clamp((scrollY - chapter.top + 72) / chapter.scrollable)
          : clamp((viewportHeight * .9 - (chapter.top - scrollY)) / (viewportHeight * .72))
        chapter.target = targetProgress
        const distance = Math.abs(targetProgress - chapter.current)
        if (chapter.rendered && distance <= .0008) {
          chapter.current = targetProgress
          return
        }
        // A slightly stronger response on iOS follows the finger closely while
        // retaining the soft Apple-like settle after momentum scrolling stops.
        const smoothing = isIOS && mobileChapters ? .24 : .16
        const raw = chapter.current + (targetProgress - chapter.current) * smoothing
        chapter.current = raw
        if (Math.abs(targetProgress - raw) > .0008) needsAnotherFrame = true
        const progress = ease(raw)
        const studyProgress = mobileChapters
          ? ease(clamp((raw - .08) / .48))
          : progress
        const copyExit = mobileChapters ? ease(clamp((raw - .52) / .34)) : 0

        if (progressRail) progressRail.style.transform = `scaleY(${Math.max(.035, raw)})`
        if (copy) {
          copy.style.opacity = String(1 - copyExit * (mobileChapters ? 1 : .82))
          copy.style.transform = `translate3d(0, ${-copyExit * 34}px, 0) scale(${1 - copyExit * .025})`
        }
        if (studyElement && mobileChapters) {
          const entryFactor = isIOS && viewportHeight < 650 ? .48 : .68
          const entryOffset = (1 - studyProgress) * chapter.studyHeight * entryFactor
          const viewportLift = studyProgress * chapter.overflowLift
          const textReplacementLift = copyExit * chapter.replacementLift
          studyElement.style.transform = `translate3d(0, ${entryOffset - viewportLift - textReplacementLift}px, 0)`
          if (!isIOS) studyElement.style.boxShadow = `0 -26px 70px rgba(0,0,0,${studyProgress * .62})`
        } else if (studyElement) {
          studyElement.style.top = ''
          studyElement.style.bottom = ''
          studyElement.style.transform = ''
          studyElement.style.boxShadow = ''
        }
        if (studyCue) {
          studyCue.style.opacity = String(1 - studyProgress)
          studyCue.style.transform = `translateY(${studyProgress * 12}px)`
        }

        if (primary) {
          // clip-path on a large composited image is the main iOS Safari
          // bottleneck. iPhones receive the same scroll reveal as a GPU fade
          // and rise; Android retains the directional scan/wipe.
          if (!isIOS) primary.style.clipPath = `inset(0 ${Math.max(0, (1 - studyProgress) * 100)}% 0 0)`
          const baseImageOpacity = isIOS && mobileChapters ? .3 : .18
          primary.style.opacity = String(baseImageOpacity + studyProgress * (1 - baseImageOpacity))
          if (!isIOS) primary.style.setProperty('--scan-progress', String(studyProgress))
          if (isIOS) primary.style.transform = `translate3d(0, ${(1 - studyProgress) * 16}px, 0)`
        }
        if (primaryImage) {
          const productImageShift = isHighVolume ? -8 : 0
          primaryImage.style.transform = `translate3d(0, ${(1 - studyProgress) * 18 + productImageShift}px, 0) scale(${1.1 - studyProgress * .1})`
        }
        const brandProgress = ease(clamp((raw - .42) / .26))
        if (brandOverlay) {
          // The source frames contain a small sparkle watermark underneath
          // this verification plate. On mobile the plate must remain fully
          // opaque while its parent image fades/rises; independently fading
          // or scaling the plate briefly exposes the embedded watermark.
          brandOverlay.style.opacity = mobileChapters ? '1' : String(brandProgress)
          brandOverlay.style.transform = mobileChapters
            ? 'translate(-50%, -50%) scale(1)'
            : `translate(-50%, -50%) scale(${.72 + brandProgress * .28})`
        }
        if (imageHud) {
          imageHud.style.opacity = String(ease(clamp((raw - .3) / .24)))
        }
        chapter.rendered = true
      })
      if (needsAnotherFrame) animationFrame = window.requestAnimationFrame(render)
    }

    const requestRender = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(render)
    }
    measure()
    studies.forEach((chapter) => {
      const scrollY = window.scrollY || window.pageYOffset
      chapter.current = mobileQuery.matches
        ? clamp((scrollY - chapter.top + 72) / chapter.scrollable)
        : 0
    })
    render()
    window.addEventListener('scroll', requestRender, { passive: true })
    const requestMeasure = () => {
      if (resizeFrame) return
      resizeFrame = window.requestAnimationFrame(() => {
        measure()
        requestRender()
      })
    }
    window.addEventListener('resize', requestMeasure)
    // iOS fires VisualViewport resize continuously while Safari's address bar
    // collapses. Measuring all sticky chapters during that gesture is costly;
    // the normal resize/orientation event is enough for this svh-based layout.
    if (!isIOS) window.visualViewport?.addEventListener('resize', requestMeasure)
    window.addEventListener('load', requestMeasure, { once: true })
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.cancelAnimationFrame(resizeFrame)
      window.removeEventListener('scroll', requestRender)
      window.removeEventListener('resize', requestMeasure)
      if (!isIOS) window.visualViewport?.removeEventListener('resize', requestMeasure)
      window.removeEventListener('load', requestMeasure)
      root.classList.remove('sol2-ios-motion')
    }
  }, [])

  return (
    <>
      <Header compact hideOverFooter />
      <main className="sol2">
        <section className="sol2-intro">
          <div className="sol2-intro__meta"><span>Product systems</span><b>India / 2026</b></div>
          <p className="sol2-kicker">AACTS operational family</p>
          <h1>Five tools.<br /><em>One traceable workflow.</em></h1>
          <p className="sol2-intro__copy">From collecting a sample to identifying a threat and preparing for the next operation—each product owns one precise part of the chain.</p>
          <nav className="sol2-index" aria-label="Products on this page">
            {products.map((product) => <a href={`#${product.id}`} key={product.id}><b>{product.number}</b><span>{product.name}</span></a>)}
          </nav>
        </section>

        <section className="sol2-catalogue">
          {products.map((product) => <ProductStudy product={product} key={product.id} />)}
        </section>

        <section className="sol2-outro">
          <p className="sol2-kicker">System principle / 05</p>
          <h2>Collect clearly.<br />Identify rapidly.<br /><em>Act confidently.</em></h2>
          <a href={pageUrl('/contact')}>Discuss your requirement <span aria-hidden="true">→</span></a>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default TestSol2Page
