import { useEffect, useRef } from 'react'
import { Atom, BrainCircuit, Building2, ChartNoAxesCombined, ChevronsRight, Cog, Crosshair, Droplets, Factory, Globe2, Grid2X2, HeartPulse, Landmark, Microscope, Network, ScanLine, ScanSearch, ShieldAlert, ShieldCheck, Target, TestTube2, Wind } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'
import './CapabilityDetailPage.css'

const BASE_URL = import.meta.env.BASE_URL
const pageUrl = (path) => `${BASE_URL}${path.replace(/^\//, '')}`
const assetUrl = (path) => pageUrl(`/${path}`)

const PROBLEM_AREAS = [
  [ShieldAlert, 'Security', 'Protect people from hazards they cannot see.', 'Chemical threats, explosives, narcotics and hazardous substances can be present before conventional awareness catches up.', 'Active chemical intelligence', 'deeptech-problem-security.png'],
  [HeartPulse, 'Health', 'Access information the human body is already producing.', 'Breath contains chemical information. Sampling and analytical science can create new possibilities for non-invasive diagnostics.', 'VOC intelligence', 'deeptech-problem-health.png'],
  [Factory, 'Industry', 'Understand chemical environments before consequences.', 'Industrial operations depend on chemistry. Better information can support safer operations and earlier response.', 'Chemical intelligence', 'deeptech-problem-industry.png'],
  [Droplets, 'Food + Water', 'Protect what sustains society.', 'Food and water systems require better ways to understand chemical conditions, contaminants and change.', 'Extend the sensing capability', 'deeptech-problem-food-water.png'],
  [Building2, 'Infrastructure', 'Make critical places more aware.', 'Airports, ports, borders, facilities and cities depend on information from the environments around them.', 'Physical-world intelligence', 'deeptech-problem-infrastructure.png'],
  [Landmark, 'National Security', 'Make better decisions when the threat is uncertain.', 'Strategic environments require technology that can turn difficult chemical information into usable understanding.', 'Sovereign capability', 'deeptech-problem-national-security.png'],
]

const OPENING_PROBLEMS = [
  [ShieldAlert, 'Security'],
  [HeartPulse, 'Health'],
  [Factory, 'Industry'],
  [ShieldCheck, 'Defence'],
  [Building2, 'Infrastructure'],
  [Landmark, 'National Security'],
]

const OPENING_OUTCOMES = [
  [ScanLine, 'Measure', 'Physical measurement.'],
  [Target, 'Understand', 'Chemical information.'],
  [ChevronsRight, 'Act', 'Support action.'],
]

const OPENING_FACTS = [
  [ShieldAlert, 'AACTS®', 'Active chemical intelligence platform'],
  [HeartPulse, 'IMS', 'Core analytical technology'],
  [Factory, '30+', 'Application domains stated publicly'],
  [ShieldCheck, '123,842', 'Sq. ft. facility stated publicly'],
  [Building2, 'INDIA', 'Technology + manufacturing base'],
]

const DISCIPLINE_PRESENTATION = [Microscope, Cog, BrainCircuit, Factory]
const CHAIN_ICONS = [Globe2, Wind, TestTube2, ScanSearch, Network, Target]


const CAPABILITY_DOMAINS = [
  ['Defense + CBRNE', 'Threat intelligence', 'Forward environments, base security, explosives, chemical agents and CBRNE response.'],
  ['Aviation + Ports', 'High-throughput security', 'Passenger, baggage, cargo, aircraft, vehicles and maritime logistics environments.'],
  ['Borders + Customs', 'Checkpoint intelligence', 'Vehicles, parcels, personnel and cargo at borders, ports and courier hubs.'],
  ['Narcotics', 'Illicit substance detection', 'Trace detection of narcotics in security and law-enforcement environments.'],
  ['Healthcare', 'Breath diagnostics', 'Non-invasive VOC sampling and analysis for clinical research and validated applications.'],
  ['Industrial', 'Chemical safety', 'Toxic industrial chemicals, workplace exposure and chemical leak identification.'],
  ['Forensics', 'Evidence and trace profiling', 'Post-blast residue, drug traces and evidence-oriented chemical identification.'],
  ['Environment', 'Environmental intelligence', 'VOC monitoring, hazardous chemical identification and broader physical-world awareness.'],
  ['Ordnance', 'Condition understanding', 'Applying chemical intelligence to the safety and condition of stored or ageing energetic materials.'],
  ['Critical Infrastructure', 'Place-based security', 'Extending chemical intelligence into the environments surrounding critical assets.'],
  ['Research', 'New scientific applications', 'Using the platform as a scientific instrument where chemical information is difficult to obtain.'],
  ['What comes next', 'New problems', 'The category expands wherever the underlying science can produce a materially better answer.'],
]

const FUTURE_CAPABILITIES = [
  ['Measure more of the physical world.', 'Expand what can be sampled, analysed and understood in real environments.'],
  ['Advance the underlying science.', 'Continue developing chemistry, physics, instrumentation, sampling and analytical methods.'],
  ['Make intelligence deeper.', 'Use computation and AI to extract more meaning from complex scientific signals without losing the physical foundation.'],
  ['Turn capabilities into platforms.', 'Build reusable scientific and engineering foundations that can serve multiple domains rather than isolated products.'],
  ['Grow deployment and network.', 'Work with governments, institutions, industries, researchers and partners to place useful capability where it matters.'],
  ['Build for the problems that come next.', 'As new threats, health challenges, industrial environments and societal needs emerge, develop the technology to address them.'],
]

const INSTITUTIONAL_POINTS = [
  ['Scientific depth', 'Technology begins with physical measurement, chemistry and analytical science.'],
  ['Engineering depth', 'Sampling, analysis, electronics, software and systems engineering are integrated around the problem.'],
  ['Industrial capability', 'A real manufacturing base connects development to production and deployment.'],
  ['Multi-domain applicability', 'The same scientific foundations can address security, health, industry and environmental problems.'],
  ['AI as a multiplier', "Advanced intelligence can improve capability without becoming the company's identity."],
  ['A mission with consequence', 'The end objective is not more technology. It is a safer, healthier and more resilient world.'],
]

const INSTITUTIONAL_ICONS = [Atom, Cog, Factory, Grid2X2, ChartNoAxesCombined, Crosshair]

const PAGES = {
  deepTechnology: {
    index: '01',
    eyebrow: 'Capabilities / Deep Technology',
    title: <>Deep technology begins with the <em>physical world.</em></>,
    intro: 'It is not a software layer looking for an application. It begins with science, difficult engineering and a problem that cannot be solved adequately with what already exists.',
    supporting: 'The outcome is not a demo. It is a capability that can be engineered, manufactured, deployed, improved and applied to problems beyond the one that started it.',
    label: 'What a real deep technology company is',
    items: [
      ['Science', 'Understand what is physically happening.', 'Chemistry, physics, biology and materials science establish what can be measured and how.'],
      ['Engineering', 'Turn science into a working system.', 'Sampling, instruments, electronics, software and mechanical systems have to operate together.'],
      ['Intelligence', 'Extract more meaning from information.', 'Algorithms and AI can extend interpretation, classification and decision support where they genuinely help.'],
      ['Industrialisation', 'Make the capability real.', 'Manufacturing, validation, deployment and support turn technology into something an institution can depend on.'],
    ],
  },
  technologyChain: {
    index: '02',
    eyebrow: 'Capabilities / Technology Chain',
    title: <>From environment<br />to <em>decision.</em></>,
    intro: "Anika's technology capability is not one instrument. It is a complete chain that begins with the physical environment and ends with information that can support action.",
    label: 'The Anika technology chain',
    items: [
      ['Environment', 'Understand where the target exists and how it behaves.'],
      ['Sampling', 'Capture relevant vapours, particles or breath from the real environment.'],
      ['Sample Handling', 'Prepare and transfer the sample for analytical measurement.'],
      ['Analysis', 'Use scientific measurement to generate chemical information.'],
      ['Identification', 'Interpret signals and correlate them with compounds and libraries.'],
      ['Decision', 'Deliver an answer that can be used operationally or clinically.'],
    ],
    ai: [
      ['AI is inside the system.', 'Anika uses computation and AI as tools for adaptive detection, pattern recognition, classification, correlation and interpretation where those methods increase capability.'],
      ['AI is not the business.', 'The business is solving difficult real-world problems. AI is one of the tools available to do that better.'],
    ],
  },
  technologyFoundation: {
    index: '03',
    eyebrow: 'Capabilities / Technology Foundation',
    title: <>The evidence is<br />in the <em>system.</em></>,
    intro: "Anika's public technical material describes a developed technology stack spanning active sampling, analytical physics, adaptive intelligence, application-specific libraries, manufacturing and multiple deployment domains.",
    label: 'What the technology capability has achieved',
    items: [
      ['AACTS®', 'A complete active chemical intelligence ecosystem.', 'The AACTS® platform integrates active sampling, sample handling, IMS analysis and intelligent identification. The published ecosystem is positioned across defense, aviation, healthcare, industrial safety, borders, forensics and environmental applications.', 'AACTS® / MULTI-DOMAIN PLATFORM'],
      ['ANALYTICAL PHYSICS', 'TRU-RAD dual-axial IMS and X-AIMS.', 'Public technical material describes a dual-axial drift-tube architecture with orthogonal ion pathways, forming the analytical core of the AACTS-3000.', 'IMS / DUAL AXIAL / X-AIMS'],
      ['ACTIVE SAMPLING', 'Different sampling architectures for different environments.', 'Published systems include HVS high-volume sampling, HHS handheld sampling and BRX breath sampling. The architecture starts with the sample rather than treating sampling as an afterthought.', 'HVS · HHS · BRX'],
      ['ADAPTIVE INTELLIGENCE', 'DDMS brings adaptive control into detection.', 'The published DDMS architecture dynamically changes detection modes to balance sensitivity, selectivity and throughput without changing the core hardware.', 'DDMS / ADAPTIVE DETECTION'],
      ['HEALTHCARE', 'The same scientific foundation reaches diagnostics.', 'Public material describes non-invasive breath VOC work and a validated TB screening use case, demonstrating how the analytical platform can be applied outside conventional security.', 'BREATH / VOC / TB SCREENING'],
      ['INDUSTRIAL CAPABILITY', 'Technology has moved into manufacturing.', 'Anika publicly describes a 123,842 sq.ft. integrated facility at AMTZ Visakhapatnam supporting R&D, manufacturing, validation and deployment.', 'ANIKA ONE / VISAKHAPATNAM'],
    ],
  },
}

function CapabilityDetailPage() {
  const content = PAGES.deepTechnology
  const chainContent = PAGES.technologyChain
  const foundationContent = PAGES.technologyFoundation
  const mainRef = useRef(null)

  useScrollReveal(mainRef, {
    headingStart: 'top 92%',
    headingEnd: 'top 68%',
    headingScrub: 0.55,
    introHeadings: ['.cap-detail__hero h1'],
    headings: [
      '.cap-detail__opening h1',
      '.cap-detail__statement h2',
      '.cap-detail__science-copy h2',
      '.cap-detail__acts h3',
      '.cap-detail__factory h2',
      '.cap-detail__manifesto p',
      '.cap-detail__chain-intro h2',
      '.cap-detail__ai h2',
      '.cap-detail__foundation-intro h2',
      '.cap-detail__problems h2',
      '.cap-detail__boundaries h2',
      '.cap-detail__future h2',
      '.cap-detail__next h2',
    ],
  })

  useEffect(() => {
    const requestedSection = window.location.hash
    if (requestedSection) {
      window.requestAnimationFrame(() => document.querySelector(requestedSection)?.scrollIntoView())
    } else {
      window.scrollTo(0, 0)
    }
    const elements = mainRef.current?.querySelectorAll('[data-cap-reveal]') || []
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' })
    elements.forEach((element) => observer.observe(element))
    const updateScrollStory = () => {
      const root = mainRef.current
      if (!root) return
      const range = root.scrollHeight - window.innerHeight
      root.style.setProperty('--page-progress', Math.max(0, Math.min(1, window.scrollY / Math.max(range, 1))))
      const opening = root.querySelector('.cap-detail__opening')
      if (opening) {
        const rect = opening.getBoundingClientRect()
        const scrollable = Math.max(opening.offsetHeight - window.innerHeight, 1)
        opening.style.setProperty('--opening-progress', Math.max(0, Math.min(1, -rect.top / scrollable)))
      }
      root.querySelectorAll('[data-cap-parallax]').forEach((element) => {
        const rect = element.getBoundingClientRect()
        const position = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
        element.style.setProperty('--parallax', Math.max(0, Math.min(1, position)))
      })
    }
    updateScrollStory()
    window.addEventListener('scroll', updateScrollStory, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateScrollStory)
    }
  }, [])

  return (
    <>
      <Header hideOverFooter />
      <main className="cap-detail cap-exact" ref={mainRef}>
        <section className="cap-detail__opening cap-exact__opening">
          <div className="cap-detail__opening-stage">
          <div className="cap-detail__opening-grid" aria-hidden="true" />
          <header data-cap-reveal>
            <span>ANIKA STERILIS / TRANSFORMATIONAL DEEP TECHNOLOGY</span>
            <b>Physical world · Real systems · Real decisions</b>
          </header>
          <div className="cap-detail__opening-layout">
            <div className="cap-detail__opening-copy">
              <div className="cap-detail__opening-message cap-detail__opening-message--primary">
                <span>TRANSFORMATIONAL DEEP TECHNOLOGY</span>
                <h1>The world has<br /><strong>difficult problems.</strong><br /><em>We build the answers.</em></h1>
                <p>Anika Sterilis is building transformational deep technology around problems that matter to human safety, health, security, industry and the environments on which society depends.</p>
              </div>
              <div className="cap-detail__opening-message cap-detail__opening-message--physical">
                <span>01 / WHAT A REAL DEEP TECHNOLOGY COMPANY IS</span>
                <h2>Deep technology<br />begins with the<br /><em>physical world.</em></h2>
                <p>It is not a software layer looking for an application. It begins with science, difficult engineering and a problem that cannot be solved adequately with what already exists.</p>
                <p>The outcome is not a demo. It is a capability that can be engineered, manufactured, deployed, improved and applied to problems beyond the one that started it.</p>
                <div className="cap-detail__opening-principle cap-detail__opening-principle--system"><Crosshair aria-hidden="true" strokeWidth={1.25} /><p>Science · Engineering · Technology · Intelligence<small>Physical world · Real systems · Real decisions</small></p></div>
              </div>
            </div>
            <div className="cap-detail__problem-engine" data-cap-reveal>
              <div className="cap-detail__problem-engine-head"><span>THE PROBLEMS ANIKA CHOOSES</span><b>06 DOMAINS / 01 CAPABILITY</b></div>
              <div className="cap-detail__problem-inputs">
                {OPENING_PROBLEMS.map(([Icon, name], index) => <article key={name}><Icon aria-hidden="true" strokeWidth={1.25} /><span>{name}</span><small>{String(index + 1).padStart(2, '0')}</small></article>)}
              </div>
              <div className="cap-detail__technology-core">
                <div><span>Environment</span><small>Physical world</small></div><i aria-hidden="true" /><b>Anika<br />technology<br />capability</b><i aria-hidden="true" /><div><span>Decision</span><small>Information that can support action</small></div>
              </div>
              <div className="cap-detail__answer-output" aria-label="Capability outcomes">
                {OPENING_OUTCOMES.map(([Icon, name, copy], index) => <div key={name}><b>0{index + 1}</b><Icon aria-hidden="true" strokeWidth={1.25} /><p><span>{name}</span><small>{copy}</small></p></div>)}
              </div>
            </div>
          </div>

          <div className="cap-detail__opening-facts" data-cap-reveal>
            {OPENING_FACTS.map(([Icon, value, label]) => <article key={value}><i><Icon aria-hidden="true" strokeWidth={1.25} /></i><p><b>{value}</b><span>{label}</span></p></article>)}
          </div>
          <div className="cap-detail__opening-status" aria-hidden="true"><i /><span>Built to solve</span></div>
          </div>
        </section>


        <section className="cap-exact__deep">
          <div className="cap-exact__wrap">
            <div className="cap-exact__manifesto cap-exact__manifesto--image" data-cap-reveal>
              <figure data-cap-parallax><img src={assetUrl('deeptech-matter-v2.png')} alt="Physical matter being translated into a measurable scientific signal" /></figure>
              <div><span>ANIKA / PROBLEM-LED TECHNOLOGY</span><p>At Anika, <em>the problem determines the technology.</em><br />The technology does not determine the problem.</p></div>
            </div>
            <div className="cap-exact__discipline-board">
              {content.items.map(([name, heading, copy], index) => {
                const Icon = DISCIPLINE_PRESENTATION[index]
                return <article data-cap-reveal key={name}>
                  <header><b>{String(index + 1).padStart(2, '0')}</b><span>{name}</span></header>
                  <figure><i><Icon aria-hidden="true" strokeWidth={1.35} /></i></figure>
                  <div><h3>{heading}</h3><p>{copy}</p></div>
                  <footer>FOUNDATION: {name}</footer>
                </article>
              })}
            </div>
          </div>
        </section>

        <section className="cap-exact__problems">
          <div className="cap-exact__wrap">
            <div className="cap-exact__eyebrow" data-cap-reveal>02 / The problems Anika chooses</div>
            <h2 data-cap-reveal>Important problems<br />do not wait.</h2>
            <p className="cap-exact__lead" data-cap-reveal>They exist in airports, borders, hospitals, factories, military environments, cities, laboratories and the everyday world.</p>
            <div className="cap-detail__problem-grid">
              {PROBLEM_AREAS.map(([Icon, name, heading, copy, capability, image], index) => <article data-cap-reveal key={name}><figure><img src={assetUrl(image)} alt="" loading="lazy" /></figure><div className="cap-detail__problem-card-head"><b>{String(index + 1).padStart(2, '0')}</b><Icon aria-hidden="true" strokeWidth={1.3} /></div><div className="cap-detail__problem-card-copy"><small>{name}</small><h3>{heading}</h3><p>{copy}</p><footer><b>ANIKA</b> / {capability}</footer></div></article>)}
            </div>
          </div>
        </section>

        <section className="cap-exact__capability">
          <div className="cap-exact__wrap">
            <div className="cap-exact__split"><div><div className="cap-exact__eyebrow" data-cap-reveal>03 / The capability</div><h2 data-cap-reveal>From environment<br />to decision.</h2></div><div><p className="cap-exact__lead" data-cap-reveal>Anika's technology capability is not one instrument. It is a complete chain that begins with the physical environment and ends with information that can support action.</p></div></div>
            <div className="cap-exact__architecture">
              <header><h3>The Anika technology chain</h3><span>Science → Engineering → Intelligence → Decision</span></header>
              <div className="cap-exact__chain">{chainContent.items.map(([name, copy], index) => { const Icon = CHAIN_ICONS[index]; return <article data-cap-reveal key={name}><b>{String(index + 1).padStart(2, '0')}</b><i><Icon aria-hidden="true" strokeWidth={1.25} /></i><h4>{name}</h4><span aria-hidden="true" /><p>{copy}</p></article> })}</div>
              <div className="cap-exact__ai">{chainContent.ai.map(([heading, copy]) => <article data-cap-reveal key={heading}><h3>{heading}</h3><p>{copy}</p></article>)}</div>
            </div>
          </div>
        </section>

        <section className="cap-exact__achieved">
          <div className="cap-exact__wrap">
            <div className="cap-exact__eyebrow" data-cap-reveal>04 / What the technology capability has achieved</div>
            <h2 data-cap-reveal>The evidence is<br />in the system.</h2>
            <p className="cap-exact__lead" data-cap-reveal>Anika's public technical material describes a developed technology stack spanning active sampling, analytical physics, adaptive intelligence, application-specific libraries, manufacturing and multiple deployment domains.</p>
            <div className="cap-exact__achieved-grid">{foundationContent.items.map(([name, heading, copy, metric], index) => <article data-cap-reveal key={name}><b>{String(index + 1).padStart(2, '0')} / {name}</b><h3>{heading}</h3><p>{copy}</p><small>{metric}</small></article>)}</div>
          </div>
        </section>

        <section className="cap-exact__domains">
          <div className="cap-exact__wrap">
            <div className="cap-exact__eyebrow" data-cap-reveal>05 / The domains</div>
            <h2 data-cap-reveal>The capability crosses<br />boundaries because problems do.</h2>
            <p className="cap-exact__lead" data-cap-reveal>The same underlying science can create different answers when the environment, sampling strategy and operational question change.</p>
            <div className="cap-exact__domain-grid">{CAPABILITY_DOMAINS.map(([domain, heading, copy], index) => <article data-cap-reveal key={domain}><b>{String(index + 1).padStart(2, '0')} / {domain}</b><h3>{heading}</h3><p>{copy}</p></article>)}</div>
          </div>
        </section>

        <section className="cap-exact__future">
          <div className="cap-exact__wrap">
            <div className="cap-exact__eyebrow" data-cap-reveal>06 / What we intend to do</div>
            <h2 data-cap-reveal>Take the capability<br />further.</h2>
            <p className="cap-exact__lead" data-cap-reveal>No artificial timelines. No need to predict a particular future. The intent is to keep building the capabilities required by important problems.</p>
            <div className="cap-exact__future-grid">{FUTURE_CAPABILITIES.map(([heading, copy], index) => <article data-cap-reveal key={heading}><span>{String(index + 1).padStart(2, '0')}</span><h3>{heading}</h3><p>{copy}</p></article>)}</div>
            <div className="cap-exact__future-close" data-cap-reveal>We are not building around a technology trend.<br /><br /><em>We are building technology around the problems humanity cannot afford to ignore.</em></div>
          </div>
        </section>

        <section className="cap-exact__institutional">
          <div className="cap-exact__wrap cap-exact__institutional-grid">
            <div><div className="cap-exact__eyebrow" data-cap-reveal>07 / Why this matters at institutional scale</div><h2 data-cap-reveal>Deep technology becomes <em>transformational</em> when one capability keeps opening <em>new problems.</em></h2><p data-cap-reveal>Anika's opportunity is not defined by one detector, one market or one application. It comes from the ability to combine science, engineering, manufacturing and intelligence around difficult physical-world problems.</p></div>
            <div>{INSTITUTIONAL_POINTS.map(([heading, copy], index) => { const Icon = INSTITUTIONAL_ICONS[index]; return <article data-cap-reveal key={heading}><span>{String(index + 1).padStart(2, '0')}</span><i><Icon aria-hidden="true" strokeWidth={1.35} /></i><div><b>{heading}</b><small>{copy}</small></div><strong aria-hidden="true">›</strong></article> })}</div>
          </div>
        </section>

        <section className="cap-exact__final">
          <div className="cap-exact__wrap">
            <div className="cap-exact__eyebrow" data-cap-reveal>08 / Anika Sterilis</div>
            <h2 data-cap-reveal>SCIENCE IS THE FOUNDATION.<br />TECHNOLOGY IS THE CAPABILITY.<br />AI IS A TOOL.<br /><span>THE PROBLEM IS THE PURPOSE.</span></h2>
            <div data-cap-reveal><p>We intend to keep building the technologies required to solve difficult problems — wherever they exist.</p><a href={pageUrl('/contact/')}>Start a conversation ↗</a></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default CapabilityDetailPage
