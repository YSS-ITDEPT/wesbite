import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Award,
  Crosshair,
  Factory,
  Gauge,
  Globe,
  Landmark,
  Settings,
  ShieldCheck,
  Star,
  Target,
  Timer,
  Trophy,
} from 'lucide-react'

// Match the deploy base ('/website/' in production) so anchors resolve on the
// static index page instead of the domain root.
const BASE_URL = import.meta.env.BASE_URL
const pageUrl = (path) => `${BASE_URL}${path.replace(/^\//, '')}`

const PROCESS_CARDS = [
  {
    icon: Target,
    title: 'Precision Engineered',
    text: 'Built with micron-level accuracy for superior performance.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assured',
    text: '95%+ critical components manufactured in-house.',
  },
  {
    icon: Gauge,
    title: 'Faster Production',
    text: 'Streamlined processes ensure on-time delivery.',
  },
  {
    icon: Settings,
    title: 'Reliable & Consistent',
    text: 'Tight process control ensures long-term reliability.',
  },
]

const ABOUT_BADGES = [
  { icon: Target, label: 'Precision Detection' },
  { icon: ShieldCheck, label: 'Proactive Protection' },
  { icon: Settings, label: 'Engineered Excellence' },
  { icon: Globe, label: 'Global Impact' },
]

const ABOUT_CLOSING_BG =
  'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2023,%202026,%2011_04_10%20AM.png'

// Safari 14 (the Safari generation shipped with macOS Big Sur) calculates
// this decorative rail differently from current engines. Keep its compact
// geometry local to this section instead of changing the shared desktop UI.
const IS_LEGACY_DESKTOP_SAFARI =
  typeof navigator !== 'undefined' &&
  /Macintosh/.test(navigator.userAgent) &&
  /Version\/14(?:\.|\s)/.test(navigator.userAgent) &&
  /Safari\//.test(navigator.userAgent) &&
  !/(?:Chrome|Chromium|CriOS|Edg|OPR)\//.test(navigator.userAgent)
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'
import './AboutPage.css'

const HERO_FEATURES = [
  {
    icon: Crosshair,
    title: 'Advanced Detection',
    text: 'Detecting chemical threats with unmatched accuracy and speed.',
  },
  {
    icon: ShieldCheck,
    title: 'Mission Critical',
    text: 'Reliable solutions for defense, homeland security, and critical infrastructure.',
  },
  {
    icon: Settings,
    title: 'Engineered Excellence',
    text: 'Innovation, precision, and quality engineering in every technology we build.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    text: 'Protecting lives and enabling a safer world through innovation and trust.',
  },
]

const HERO_STATS = [
  { icon: Timer, value: '20 SEC', label: 'Identification Time' },
  { icon: Gauge, value: 'NG–PG', label: 'Trace-Level Sensitivity' },
  { icon: Globe, value: '30+', label: 'Operational Domains' },
  { icon: Factory, value: '123,842', label: 'Sq. Ft. Integrated Facility' },
]

const ABOUT_BG =
  'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2023,%202026,%2011_20_50%20AM.png'
const PROCESS_IMAGE =
  'https://ik.imagekit.io/jxuol7kjt/WhatsApp%20Image%202026-05-20%20at%206.07.03%20PM.jpeg'
const PROCESS_IMAGE_2 =
  'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2023,%202026,%2012_28_24%20PM.png?updatedAt=1784790620239'
const ACHIEVEMENTS_VIDEO = 'https://ik.imagekit.io/d9wt8plt0/tekno.mp4?updatedAt=1729138558192'
const ACHIEVEMENTS_POSTER = pageUrl('/about-achievements-poster.webp')

const ACHIEVEMENTS = [
  {
    year: '2018',
    title: 'Astor Awards',
    icon: Trophy,
    copy: 'The AACTS 3000 analysis device received Platinum Award in the USA in 2018 as best detection system for CBRNE substances. This prestigious award honors industry leaders in the following areas: physical and border security, cyber security, emergency preparedness, law enforcement and public safety.',
  },
  {
    year: '2022',
    title: 'House of Commons, UK Awards',
    icon: Landmark,
    copy: 'The awards recognizes the inspirational teams and organizations who have impressed and shown dedication and commitment towards thriving parliamentary democracy and people.',
  },
  {
    year: 'July 2022',
    title: 'Outstanding Achievement Award',
    icon: Star,
    copy: 'On the occasion of 15th International Business Conclave on "Global Business Opportunities: Atmanirbhar Bharat".',
  },
  {
    year: 'September 2022',
    title: 'International Business Summit & Awards',
    icon: Award,
    copy: 'Excellence Award in health care technology of the year is conferred to Anika Sterilis Pvt. Ltd.',
  },
]

function AboutPage() {
  const mainRef = useRef(null)
  const achievementsMediaRef = useRef(null)
  const achievementsVideoRef = useRef(null)
  const [videoInView, setVideoInView] = useState(false)

  useScrollReveal(mainRef, {
    intro: [
      { items: '.about-hero__eyebrow, .about-hero__divider, .about-hero__copy, .about-hero__button-frame', stagger: 0.1, delay: 0.2 },
      { items: '.about-hero__features .about-hero__feature, .about-stat', stagger: 0.09, delay: 0.5 },
    ],
    introHeadings: ['.about-hero__title'],
    headings: [
      /* Achievement cards already reveal as complete timeline items. Splitting
         their h3 elements into a second scroll-scrubbed animation can leave
         lower awards half orange/translated after the card is visible. */
      'section:not(.about-hero):not(.about-achievements) h2, section:not(.about-hero):not(.about-achievements) h3, section:not(.about-hero) h4',
    ],
    groups: [
      { trigger: '.about-mission__content', items: '.about-mission__kicker, .about-mission__content p', start: 'top 78%' },
      { trigger: '.about-process__cards', items: '.about-process__card', start: 'top 82%', stagger: 0.1 },
      { trigger: '.about-process__content', items: '.about-process__badge, .about-process__copy, .about-process__button-frame', start: 'top 72%' },
      { trigger: '.about-achievements__panel', items: '.about-achievements__badge, .about-achievements__heading', start: 'top 90%', y: 20, stagger: 0.08 },
      { trigger: '.about-achievements__timeline', items: '.about-achievements__timeline li', start: 'top 88%', y: 26, stagger: 0.1 },
      { trigger: '.about-closing__badges', items: '.about-closing__badge', start: 'top 84%', stagger: 0.1 },
    ],
  })

  useEffect(() => {
    const media = achievementsMediaRef.current
    const video = achievementsVideoRef.current
    if (!media || !video) return

    // Begin fetching during the loader instead of waiting until this
    // below-the-fold section approaches the viewport. The global loader waits
    // for the first decoded frame via data-loader-media.
    video.muted = true
    video.defaultMuted = true
    video.volume = 0
    video.preload = 'auto'
    if (video.networkState === 0) video.load()

    // Playback remains tied to the real visible section.
    const playbackObserver = new IntersectionObserver(([entry]) => {
      setVideoInView(entry.isIntersecting)
    }, { threshold: 0.22 })

    playbackObserver.observe(media)
    return () => {
      playbackObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const video = achievementsVideoRef.current
    if (!video) return

    const syncPlayback = () => {
      if (videoInView) video.play().catch(() => {})
      else video.pause()
    }
    syncPlayback()
    video.addEventListener('canplay', syncPlayback)
    return () => video.removeEventListener('canplay', syncPlayback)
  }, [videoInView])

  return (
    <>
      <Header alwaysVisible />
      <main className="about-page" ref={mainRef}>
        <section className="about-hero" aria-label="About Anika Sterilis">
          <img className="about-hero__image" src={ABOUT_BG} alt="" aria-hidden="true" />
          <div className="about-hero__overlay" />

          <div className="about-hero__body">
            <div className="about-hero__content">
              <p className="about-hero__eyebrow">Welcome to Anika Sterilis</p>
              <h1 className="about-hero__title">
                <span className="about-hero__title-line">Anika Sterilis is where</span>
                <span className="about-hero__title-line about-hero__title-accent">
                  Innovation
                </span>
                <span className="about-hero__title-line">protects the future.</span>
              </h1>
              <span className="about-hero__divider" />
              <p className="about-hero__copy">
                We build advanced detection technologies that empower defense,
                security, and critical industries against modern chemical threats.
                Designed to deliver faster awareness, greater confidence, and
                uncompromising protection.
              </p>
              <div className="about-hero__button-frame">
                <a className="about-hero__button" href={`${pageUrl('/index.html')}#products`}>
                  Explore Our Technology
                </a>
              </div>
            </div>
          </div>

          <div className="about-hero__bottom">
            <div className="about-hero__features">
              {HERO_FEATURES.map(({ icon: Icon, title, text }) => (
                <div className="about-hero__feature" key={title}>
                  <span className="about-hero__feature-icon">
                    <Icon aria-hidden="true" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="about-stats" aria-label="Anika Sterilis by the numbers">
              {HERO_STATS.map(({ icon: Icon, value, label }) => (
                <div className="about-stat" key={label}>
                  <span className="about-stat__icon">
                    <Icon aria-hidden="true" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="about-stat__value">{value}</p>
                    <p className="about-stat__label">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="about-mission" aria-labelledby="about-mission-title">
          <div className="about-mission__stage">
            <div className="about-mission__content">
              <p className="about-mission__kicker">Our Mission</p>
              <h2 id="about-mission-title">Our Philosophy &amp; Mission</h2>
              <p>
                Our mission is to safeguard lives, assets, and environments by delivering the
                most advanced and reliable threat detection systems available. We are committed
                to continuous innovation, ensuring that our clients are equipped with the tools
                necessary to respond to potential threats swiftly and effectively.
              </p>
            </div>
          </div>
        </section>

        <section className="about-process" aria-labelledby="about-process-title">
          <div className="about-process__inner">
            <div className="about-process__content">
              <span className="about-process__badge">
                <span className="about-process__badge-square" />
                Our Process
              </span>
              <h2 id="about-process-title" className="about-process__heading">
                <span className="about-process__heading-line">In-House Precision</span>
                <span className="about-process__heading-line about-process__heading-accent">
                  Manufacturing
                </span>
              </h2>
              <span className="about-process__divider" />
              <p className="about-process__copy">
                At Anika Sterilis, every product is engineered with precision using
                our advanced state-of-art facility. Nearly{' '}
                <span className="about-process__highlight">95%+</span> of all critical
                components are manufactured within our own production campus. This
                ensures superior quality, tighter process control, faster production,
                and uncompromising reliability. Every component is crafted to meet the
                highest standards before final assembly, reflecting our commitment to
                engineering excellence.
              </p>

              <div className="about-process__cards">
                {PROCESS_CARDS.map(({ icon: Icon, title, text }) => (
                  <div className="about-process__card" key={title}>
                    <span className="about-process__card-icon">
                      <Icon aria-hidden="true" strokeWidth={1.75} />
                    </span>
                    <h4>{title}</h4>
                    <p>{text}</p>
                  </div>
                ))}
              </div>

              <div className="about-process__button-frame">
                <a className="about-process__button" href={pageUrl('/capability.html')}>
                  Explore Our Capabilities
                  <ArrowRight aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="about-process__media">
              <img
                className="about-process__media-img about-process__media-img--left"
                src={PROCESS_IMAGE_2}
                alt="Anika Sterilis CNC bending machine on the production floor"
              />
              <img
                className="about-process__media-img about-process__media-img--right"
                src={PROCESS_IMAGE}
                alt="Technician precision-machining a component in-house"
              />
              <span className="about-process__seam about-process__seam--0" aria-hidden="true" />
              <span className="about-process__seam about-process__seam--1" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section
          className={`about-closing${IS_LEGACY_DESKTOP_SAFARI ? ' about-closing--legacy-safari' : ''}`}
          aria-labelledby="about-closing-title"
          style={{ backgroundImage: `url(${ABOUT_CLOSING_BG})` }}
        >
          <div className="about-closing__inner">
            <div className="about-closing__text">
              <p className="about-closing__eyebrow">Who We Are</p>
              <h2 id="about-closing-title" className="about-closing__heading">
                About <span>Us</span>
              </h2>
              <div className="about-closing__dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="about-closing__copy">
                <p>
                  Anika Sterilis is a global innovator in Advanced Active Chemical
                  Threat Scanning (
                  <span className="about-closing__highlight">AACTS®</span>)
                  technologies, delivering next-generation security solutions. Our
                  systems protected by granted global patents detect hazardous vapors and particles with
                  exceptional precision for proactive threat identification.
                </p>
                <p>
                  Operating from a{' '}
                  <span className="about-closing__highlight">123,842 sq. ft.</span>{' '}
                  state-of-the-art manufacturing facility, we combine advanced
                  engineering with uncompromising quality.
                </p>
                <p>
                  <span className="about-closing__highlight">With</span> extensive
                  in-house design and manufacturing capabilities,{' '}
                  <span className="about-closing__highlight">we</span> ensure
                  reliability, performance, and innovation in every solution.
                </p>
                <p>
                  Our technologies protect defense, homeland security,
                  transportation, critical infrastructure, and public safety
                  organizations worldwide.
                </p>
              </div>
            </div>

            <div className="about-closing__badges">
              {ABOUT_BADGES.map(({ icon: Icon, label }) => (
                <div className="about-closing__badge" key={label}>
                  <span className="about-closing__badge-hex">
                    <svg className="about-closing__hex-outline" viewBox="0 0 100 112" aria-hidden="true">
                      <polygon
                        points="50,3 95,29 95,83 50,109 5,83 5,29"
                        fill="none"
                        stroke="#ff7a00"
                        strokeWidth="3"
                      />
                    </svg>
                    <Icon className="about-closing__badge-icon" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="about-closing__badge-label">{label}</span>
                  <span className="about-closing__badge-tail" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="about-achievements" aria-labelledby="about-achievements-title">
          <div className="about-achievements__media" ref={achievementsMediaRef}>
            <video
              ref={achievementsVideoRef}
              className="about-achievements__video"
              src={ACHIEVEMENTS_VIDEO}
              poster={ACHIEVEMENTS_POSTER}
              muted
              loop
              playsInline
              preload="auto"
              data-loader-media
            />
          </div>
          <div className="about-achievements__panel">
            <p className="about-achievements__badge">
              <span className="about-achievements__badge-dot" />
              Our Achievements
            </p>
            <h2 id="about-achievements-title" className="about-achievements__heading">
              Milestones &amp; Recognition
            </h2>
            <ol className="about-achievements__timeline">
              {ACHIEVEMENTS.map((item) => (
                <li key={item.year + item.title}>
                  <span className="about-achievements__year">{item.year}</span>
                  <span className="about-achievements__node">
                    <item.icon aria-hidden="true" strokeWidth={1.75} />
                  </span>
                  <div className="about-achievements__card">
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
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

export default AboutPage
