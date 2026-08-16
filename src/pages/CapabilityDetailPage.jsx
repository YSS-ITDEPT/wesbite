import { useEffect, useRef } from 'react'
import { Activity, Binary, Blocks, Building2, ChevronsRight, Crosshair, DraftingCompass, Droplets, Eye, Factory, HeartPulse, Landmark, Microscope, Radio, ScanLine, ShieldAlert, ShieldCheck, Target, Waves, Wind } from 'lucide-react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'
import './CapabilityDetailPage.css'

const BASE_URL = import.meta.env.BASE_URL
const pageUrl = (path) => `${BASE_URL}${path.replace(/^\//, '')}`
const assetUrl = (path) => pageUrl(`/${path}`)

const DEEP_TECH_ICONS = [Microscope, DraftingCompass, Binary, Blocks]
const DEEP_TECH_IMAGES = ['deeptech-discipline-science.png', 'deeptech-discipline-engineering.png', 'deeptech-discipline-intelligence.png', 'nav-detection-lab.png']
const DEEP_TECH_POINTS = [
  ['Molecular understanding', 'Physical behaviour', 'What can be measured'],
  ['System integration', 'Precision instrumentation', 'Reliable operation'],
  ['Pattern recognition', 'Classification and correlation', 'Decision support'],
  ['Manufacturing at scale', 'Validation and quality', 'Deployment and support'],
]
const CHAIN_POINTS = [
  ['Identify the environment', 'Understand target behaviour', 'Assess conditions and variables'],
  ['Select the appropriate sampler', 'Collect a representative sample', 'Ensure sample integrity'],
  ['Condition and stabilise the sample', 'Transfer to analytical media', 'Maintain chain of integrity'],
  ['Ionise and separate', 'Detect and measure', 'Generate analytical data'],
  ['Process and clean signals', 'Match against libraries', 'Confirm compounds of interest'],
  ['Evaluate and classify', 'Deliver an actionable result', 'Enable informed action'],
]
const SIGNAL_STAGES = [
  [Wind, 'Capture', 'Vapour / particle'],
  [Waves, 'Measure', 'Physical response'],
  [Activity, 'Resolve', 'Usable signal'],
]

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
  [ScanLine, 'Measure', 'Reveal the signal.'],
  [Target, 'Understand', 'Resolve meaning.'],
  [ChevronsRight, 'Act', 'Support decisions.'],
]

const OPENING_APPROACH = [
  [Crosshair, 'Our approach', 'Rooted in science. Driven by purpose. Built for impact.'],
  [Eye, 'Real problems', 'We focus on problems that matter.'],
  [Radio, 'Difficult signals', 'We extract what others cannot see.'],
  [ShieldCheck, 'Dependable answers', 'We deliver intelligence you can depend on.'],
]

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
      ['AACTS®', 'A complete active chemical intelligence ecosystem.', 'The AACTS® platform integrates active sampling, sample handling, IMS analysis and intelligent identification. The published ecosystem is positioned across defense, aviation, healthcare, industrial safety, borders, forensics and environmental applications.', 'AACTS® / Multi-domain platform'],
      ['Analytical Physics', 'TRU-RAD dual-axial IMS and X-AIMS.', 'Public technical material describes a dual-axial drift-tube architecture with orthogonal ion pathways, forming the analytical core of the AACTS-3000.', 'IMS / Dual axial / X-AIMS'],
      ['Active Sampling', 'Different sampling architectures for different environments.', 'Published systems include HVS high-volume sampling, HHS handheld sampling and BRX breath sampling. The architecture starts with the sample rather than treating sampling as an afterthought.', 'HVS · HHS · BRX'],
      ['Adaptive Intelligence', 'DDMS brings adaptive control into detection.', 'The published DDMS architecture dynamically changes detection modes to balance sensitivity, selectivity and throughput without changing the core hardware.', 'DDMS / Adaptive detection'],
      ['Healthcare', 'The same scientific foundation reaches diagnostics.', 'Public material describes non-invasive breath VOC work and a validated TB screening use case, demonstrating how the analytical platform can be applied outside conventional security.', 'Breath / VOC / TB screening'],
      ['Industrial Capability', 'Technology has moved into manufacturing.', 'Anika publicly describes a 123,842 sq.ft. integrated facility at AMTZ Visakhapatnam supporting R&D, manufacturing, validation and deployment.', 'Anika One / Visakhapatnam'],
    ],
  },
}

const PAGE_LINKS = [
  ['01', 'Deep Technology', '/capabilities/deep-technology'],
  ['02', 'Technology Chain', '/capabilities/deep-technology#technology-chain'],
  ['03', 'Technology Foundation', '/capabilities/deep-technology#technology-foundation'],
]

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
      <main className="cap-detail cap-detail--complete" ref={mainRef}>
        <section className="cap-detail__opening">
          <div className="cap-detail__opening-grid" aria-hidden="true" />
          <header data-cap-reveal>
            <span>Anika Sterilis / Transformational Deep Technology</span>
            <b>Physical world → operational answer</b>
          </header>
          <div className="cap-detail__opening-layout">
            <div className="cap-detail__opening-copy">
              <span data-cap-reveal>Problem-led innovation / 01</span>
              <h1 data-cap-reveal>The world has<br /><strong>difficult problems.</strong><br /><em>We build the answers.</em></h1>
              <p data-cap-reveal>Deep technology begins where the problem is real, the signal is difficult to obtain and an institution needs an answer it can depend on.</p>
              <div className="cap-detail__opening-principle" data-cap-reveal><b>01</b><Target aria-hidden="true" strokeWidth={1.25} /><p>The problem determines the technology.<small>Never the other way around.</small></p></div>
            </div>
            <div className="cap-detail__problem-engine" data-cap-reveal>
              <div className="cap-detail__problem-engine-head"><span>Live problem field</span><b>06 inputs / 01 capability</b></div>
              <div className="cap-detail__problem-inputs">
                {OPENING_PROBLEMS.map(([Icon, name], index) => (
                  <article key={name}><Icon aria-hidden="true" strokeWidth={1.25} /><span>{name}</span><small>S-{String(index + 1).padStart(2, '0')}</small></article>
                ))}
              </div>
              <div className="cap-detail__technology-core">
                <div><span>Physical input</span><small>Raw signals from<br />the real world.</small></div><i aria-hidden="true" /><b>Anika<br />technology<br />core</b><i aria-hidden="true" /><div><span>Usable answer</span><small>Actionable intelligence<br />for real decisions.</small></div>
              </div>
              <div className="cap-detail__answer-output" aria-label="Capability outcomes">
                {OPENING_OUTCOMES.map(([Icon, name, copy], index) => <div key={name}><b>0{index + 1}</b><Icon aria-hidden="true" strokeWidth={1.25} /><p><span>{name}</span><small>{copy}</small></p></div>)}
              </div>
            </div>
          </div>
          <div className="cap-detail__opening-approach" data-cap-reveal>
            {OPENING_APPROACH.map(([Icon, name, copy]) => <article key={name}><Icon aria-hidden="true" strokeWidth={1.2} /><p><b>{name}</b><span>{copy}</span></p></article>)}
          </div>
          <div className="cap-detail__opening-status" aria-hidden="true"><i /><span>Problem field / active</span></div>
        </section>

        <section className="cap-detail__hero">
          <div className="cap-detail__grid" aria-hidden="true" />
          <div className="cap-detail__scroll-progress" aria-hidden="true"><i /><span>Physical world to decision</span></div>
          <figure className="cap-detail__hero-media" aria-hidden="true" data-cap-parallax>
            <img src={assetUrl('deeptech-matter-v2.png')} alt="" />
            <figcaption><b>AACTS® 3000</b><span>Physical science / Engineered system</span></figcaption>
          </figure>
          <div className="cap-detail__hero-inner">
            <div className="cap-detail__breadcrumb" data-cap-reveal>
              <span>{content.index}</span><b>{content.eyebrow}</b>
            </div>
            <h1 data-cap-reveal>{content.title}</h1>
            <div className="cap-detail__hero-copy" data-cap-reveal>
              <p>{content.intro}</p>
              <small>Science · Engineering · Technology · Intelligence<br />Physical world · Real systems · Real decisions</small>
            </div>
            <div className="cap-detail__hero-system" data-cap-reveal aria-label="Technology progression">
              <div><b>01</b><span>Matter</span><small>Physical phenomenon</small></div>
              <i aria-hidden="true" />
              <div><b>02</b><span>Measurement</span><small>Engineered signal</small></div>
              <i aria-hidden="true" />
              <div><b>03</b><span>Decision</span><small>Information for action</small></div>
            </div>
          </div>
        </section>

        <nav className="cap-detail__switcher" aria-label="Capability pages">
          {PAGE_LINKS.map(([number, label, href]) => (
            <a className={number === content.index ? 'is-current' : ''} href={pageUrl(href)} key={href}>
              <b>{number}</b><span>{label}</span><i aria-hidden="true">↗</i>
            </a>
          ))}
        </nav>

        <section className="cap-detail__chapter" id="deep-technology">
          <div className="cap-detail__chapter-head" data-cap-reveal><b>01</b><span>Deep Technology</span><i>Science · Engineering · Intelligence · Industrialisation</i></div>
          <section className="cap-detail__statement">
              <div className="cap-detail__section-label" data-cap-reveal><span>01</span>{content.label}</div>
              <div className="cap-detail__statement-grid">
                <h2 data-cap-reveal>Science becomes capability when it can leave the laboratory.</h2>
                <p data-cap-reveal>{content.supporting}</p>
              </div>
          </section>
          <section className="cap-detail__science-window" data-cap-reveal data-cap-parallax>
            <figure><img src={assetUrl('deeptech-pathway-v2.png')} alt="Cutaway of a precision sampling pathway translating particles into a measurable signal" /></figure>
            <div className="cap-detail__science-copy">
              <span>Physical phenomenon / 01</span>
              <h2>Before intelligence,<br />there must be <em>a signal.</em></h2>
              <p>The work begins where vapour, particles, materials and ion behaviour become measurable. Every layer that follows depends on the integrity of this first physical interaction.</p>
              <div className="cap-detail__signal-path" aria-label="Physical signal sequence">
                {SIGNAL_STAGES.map(([Icon, label, detail], index) => (
                  <div key={label}>
                    <span><Icon aria-hidden="true" strokeWidth={1.45} /></span>
                    <p><b>{label}</b><small>{detail}</small></p>
                    {index < SIGNAL_STAGES.length - 1 && <i aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="cap-detail__acts">
              <div className="cap-detail__acts-heading" data-cap-reveal>
                <span>One capability / Four connected disciplines</span>
                <b>Science becomes dependable only when every layer works together.</b>
              </div>
              {content.items.map(([name, heading, copy], index) => {
                const DeepTechIcon = DEEP_TECH_ICONS[index]
                return (
                  <article data-cap-reveal data-cap-parallax key={name}>
                    <div className="cap-detail__card-index"><b>{String(index + 1).padStart(2, '0')}</b><span>{name}</span></div>
                    <figure className="cap-detail__act-media">
                      <img src={assetUrl(DEEP_TECH_IMAGES[index])} alt="" loading="lazy" />
                      <span aria-hidden="true"><DeepTechIcon strokeWidth={1.35} /></span>
                    </figure>
                    <div className="cap-detail__act-copy"><h3>{heading}</h3><p>{copy}</p><ul>{DEEP_TECH_POINTS[index].map((point) => <li key={point}>{point}</li>)}</ul></div>
                    <footer>Foundation: {name}</footer>
                  </article>
                )
              })}
          </section>
          <section className="cap-detail__factory">
            <figure data-cap-reveal data-cap-parallax><img src={assetUrl('deeptech-operation-v2.png')} alt="Scientific detection system operating in critical infrastructure" /></figure>
            <div data-cap-reveal><span>Industrial reality / 04</span><h2>The laboratory is only the beginning.</h2><p>Repeatability, validation and manufacturing turn a scientific result into infrastructure that institutions can trust.</p><small>From controlled measurement to operational consequence</small></div>
          </section>
          <section className="cap-detail__manifesto">
              <p data-cap-reveal>At Anika, <em>the problem determines the technology.</em><br />The technology does not determine the problem.</p>
          </section>
        </section>

        <section className="cap-detail__chapter" id="technology-chain">
          <div className="cap-detail__chapter-head" data-cap-reveal><b>02</b><span>Technology Chain</span><i>Environment · Sampling · Analysis · Decision</i></div>
          <section className="cap-detail__chain-intro">
            <div data-cap-reveal><span>03 / The capability</span><h2>{chainContent.title}</h2></div>
            <p data-cap-reveal>{chainContent.intro}</p>
          </section>
          <section className="cap-detail__chain-section">
              <div className="cap-detail__section-label" data-cap-reveal><span>03</span>{chainContent.label}<i>Science → Engineering → Intelligence → Decision</i></div>
              <div className="cap-detail__chain-simple" data-cap-reveal>
                <div className="cap-detail__chain-phases" aria-hidden="true">
                  <span>Physical world</span><i /><span>Analytical core</span><i /><span>Operational decision</span>
                </div>
                <div className="cap-detail__chain">
                  {chainContent.items.map(([name, copy], index) => (
                    <article key={name}>
                      <b>{String(index + 1).padStart(2, '0')}</b>
                      <div><small>{['Observe', 'Capture', 'Condition', 'Measure', 'Interpret', 'Act'][index]}</small><h3>{name}</h3><p>{copy}</p><ul>{CHAIN_POINTS[index].map((point) => <li key={point}>{point}</li>)}</ul></div>
                      {index < chainContent.items.length - 1 && <span aria-hidden="true">→</span>}
                    </article>
                  ))}
                </div>
                <div className="cap-detail__chain-continuity"><i aria-hidden="true" />This is a continuous capability chain—from understanding the environment to delivering the right decision.</div>
              </div>
          </section>
          <section className="cap-detail__ai">
              {chainContent.ai.map(([heading, copy], index) => (
                <article data-cap-reveal key={heading}><span>0{index + 1} / Intelligence principle</span><h2>{heading}</h2><p>{copy}</p></article>
              ))}
          </section>
        </section>

        <section className="cap-detail__chapter" id="technology-foundation">
          <div className="cap-detail__chapter-head cap-detail__chapter-head--light" data-cap-reveal><b>03</b><span>Technology Foundation</span><i>Physics · Sampling · Intelligence · Manufacturing</i></div>
          <section className="cap-detail__foundation">
            <div className="cap-detail__foundation-intro">
              <div data-cap-reveal><span>04 / What the technology capability has achieved</span><h2>{foundationContent.title}</h2></div>
              <p data-cap-reveal>{foundationContent.intro}</p>
            </div>
            <div className="cap-detail__section-label" data-cap-reveal><span>04</span>{foundationContent.label}</div>
            <div className="cap-detail__foundation-grid">
              {foundationContent.items.map(([name, heading, copy, metric], index) => {
                return (
                  <article data-cap-reveal key={name}>
                    <div className="cap-detail__card-index"><b>{String(index + 1).padStart(2, '0')}</b><span>{name}</span></div>
                    <h2>{heading}</h2><p>{copy}</p><small>{metric}</small>
                  </article>
                )
              })}
            </div>
          </section>
        </section>

        <section className="cap-detail__reference-extension">
          <section className="cap-detail__problems">
            <header data-cap-reveal>
              <span>05 / The problems</span>
              <h2>Important problems<br /><em>do not wait.</em></h2>
              <p>They exist in airports, borders, hospitals, factories, military environments, cities, laboratories and the everyday world.</p>
            </header>
            <div className="cap-detail__problem-grid">
              {PROBLEM_AREAS.map(([Icon, name, heading, copy, capability, image], index) => (
                <article data-cap-reveal key={name}>
                  <figure><img src={assetUrl(image)} alt="" loading="lazy" /></figure>
                  <div className="cap-detail__problem-card-head"><b>{String(index + 1).padStart(2, '0')}</b><Icon aria-hidden="true" strokeWidth={1.3} /></div>
                  <div className="cap-detail__problem-card-copy"><small>{name}</small><h3>{heading}</h3><p>{copy}</p><footer>Anika / {capability}</footer></div>
                </article>
              ))}
            </div>
          </section>

          <section className="cap-detail__boundaries">
            <header data-cap-reveal>
              <span>06 / Where the capability goes</span>
              <h2>The capability crosses boundaries<br /><em>because problems do.</em></h2>
              <p>The same underlying science can create different answers when the environment, sampling strategy and operational question change.</p>
            </header>
            <div className="cap-detail__domain-index">
              {CAPABILITY_DOMAINS.map(([domain, heading, copy], index) => (
                <article data-cap-reveal key={domain}><b>{String(index + 1).padStart(2, '0')}</b><small>{domain}</small><h3>{heading}</h3><p>{copy}</p></article>
              ))}
            </div>
          </section>

          <section className="cap-detail__future">
            <header data-cap-reveal>
              <span>07 / Take the capability further</span>
              <h2>Build for the problems<br /><em>that come next.</em></h2>
              <p>No artificial timelines. No need to predict a particular future. The intent is to keep building the capabilities required by important problems.</p>
            </header>
            <div className="cap-detail__future-grid">
              {FUTURE_CAPABILITIES.map(([heading, copy], index) => (
                <article data-cap-reveal key={heading}><b>{String(index + 1).padStart(2, '0')}</b><div><h3>{heading}</h3><p>{copy}</p></div></article>
              ))}
            </div>
            <aside data-cap-reveal><span>Why this matters at institutional scale</span><p>Deep technology becomes transformational when one capability keeps opening new problems. Anika's opportunity is not defined by one detector, one market or one application. It comes from the ability to combine science, engineering, manufacturing and intelligence around difficult physical-world problems.</p></aside>
          </section>
        </section>

        <section className="cap-detail__next">
          <span data-cap-reveal>Capabilities / Continue exploring</span>
          <h2 data-cap-reveal>One scientific foundation.<br /><em>Multiple paths to action.</em></h2>
          <a data-cap-reveal href={pageUrl('/contact/')}>Start a conversation <b>↗</b></a>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default CapabilityDetailPage
