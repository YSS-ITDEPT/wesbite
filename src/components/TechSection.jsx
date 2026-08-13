import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Wind,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Target,
  Layers,
  Zap,
  RefreshCw,
  Thermometer,
  Activity,
  Waves,
  Blend,
  Search,
  CornerDownRight,
  Split,
  BarChart3,
  Move,
  Grid3x3,
  CheckCircle2,
  LineChart,
  Network,
} from 'lucide-react'
import './TechSection.css'

gsap.registerPlugin(ScrollTrigger)

// Scene 1 -> 8, each an actual still from the TRU-RAD X-AIMS animation.
// Image and text swap sides every other step. Icons are Lucide components.
const ICONS = {
  airflow: Wind,
  particles: Sparkles,
  shield: ShieldCheck,
  card: CreditCard,
  target: Target,
  layers: Layers,
  bolt: Zap,
  refresh: RefreshCw,
  thermometer: Thermometer,
  pulse: Activity,
  waveform: Waves,
  overlapCircles: Blend,
  search: Search,
  degrees90: CornerDownRight,
  arrowList: Split,
  bars: BarChart3,
  crossArrows: Move,
  venn: Blend,
  dotsGrid: Grid3x3,
  burst: Sparkles,
  chart: LineChart,
  network: Network,
  check: CheckCircle2,
}

function IconBadge({ icon, color }) {
  const Icon = ICONS[icon]
  return (
    <span className="tech__feature-icon" style={color ? { color } : undefined}>
      <Icon strokeWidth={1.6} />
    </span>
  )
}

// Renders a headline with one or more phrases picked out in the accent color.
function Highlighted({ text, highlight }) {
  if (!highlight) return text
  const phrases = (Array.isArray(highlight) ? highlight : [highlight]).filter(
    (p) => text.includes(p),
  )
  if (!phrases.length) return text
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'))
  return parts.map((part, i) =>
    phrases.includes(part) ? (
      <span className="tech__step-highlight" key={i}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}

const SCENES = [
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2009_28_10%20PM.png',
    eyebrow: 'Scene 01 — Sampling',
    headline: 'An invisible chemical trace leaves a measurable signature.',
    highlight: 'measurable signature.',
    body: 'Microscopic neutral particles, undetectable to the eye, are drawn by controlled airflow into a fine filter structure on the aspiration sample card.',
    features: [
      {
        icon: 'airflow',
        title: 'Controlled Airflow',
        text: 'Precision airflow ensures consistent and reliable particle collection.',
      },
      {
        icon: 'particles',
        title: 'Invisible Particles',
        text: 'Microscopic particles remain invisible but leave a unique chemical trace.',
      },
      {
        icon: 'shield',
        title: 'Reliable Capture',
        text: 'Advanced filter technology captures particles for accurate analysis.',
      },
    ],
  },
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2009_32_32%20PM.png',
    eyebrow: 'Scene 02 — Entry',
    headline: 'At the core of AACTS-3000: TRU-RAD X-AIMS.',
    highlight: 'TRU-RAD X-AIMS.',
    body: 'The sample card enters the AACTS-3000 enclosure. The pathway leads inward toward the detection engine at its center.',
    features: [
      {
        icon: 'card',
        title: 'Smart Entry',
        text: 'Precision-guided sample card insertion.',
      },
      {
        icon: 'target',
        title: 'Direct Pathway',
        text: 'Engineered flow directs the sample inward.',
      },
      {
        icon: 'shield',
        title: 'Secure Enclosure',
        text: 'Sealed environment for accurate detection.',
      },
    ],
    stats: [
      {
        icon: 'layers',
        title: 'Precision Engineering',
        text: 'Built for reliability, designed for accuracy.',
      },
      {
        icon: 'bolt',
        title: 'Advanced Detection',
        text: 'Powerful engine at the core delivers rapid, precise results.',
      },
      {
        icon: 'refresh',
        title: 'Optimized Flow',
        text: 'Streamlined pathway ensures consistent sample delivery.',
      },
      {
        icon: 'shield',
        title: 'Trusted Technology',
        text: 'TRU-RAD X-AIMS for next-generation threat detection.',
      },
    ],
  },
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2009_36_36%20PM.png',
    eyebrow: 'Scene 03 — Ionization',
    headline: 'The captured sample is released and converted into detectable ions.',
    highlight: 'detectable ions.',
    body: 'Controlled thermal desorption releases the trapped molecules. A regulated energy field converts neutral molecules into charged ions ready for measurement.',
    features: [
      {
        icon: 'thermometer',
        color: 'var(--color-amber)',
        title: 'Thermal Desorption',
        text: 'Releases trapped molecules with precise temperature control.',
      },
      {
        icon: 'bolt',
        color: 'var(--color-violet)',
        title: 'Energy Conversion',
        text: 'A regulated energy field ionizes neutral molecules into charged ions.',
      },
      {
        icon: 'target',
        title: 'Detectable Ions',
        text: 'Generated ions are guided to the detector for accurate measurement.',
      },
    ],
    statPair: [
      {
        icon: 'pulse',
        color: 'var(--color-amber)',
        label: 'Ionization Efficiency',
        value: '> 99.9%',
      },
      {
        icon: 'shield',
        label: 'Detection Readiness',
        value: 'Instant',
      },
    ],
    process: [
      {
        icon: 'thermometer',
        color: 'var(--color-amber)',
        title: 'Desorption',
        text: 'Heat releases trapped molecules.',
      },
      {
        icon: 'bolt',
        color: 'var(--color-violet)',
        title: 'Ionization',
        text: 'Energy field converts neutral molecules.',
      },
      {
        icon: 'target',
        title: 'Ion Detection',
        text: 'Charged ions are ready for analysis.',
      },
    ],
  },
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2009_43_06%20PM.png',
    eyebrow: 'Scene 04 — First Axis',
    headline: 'First-axis ion mobility separation.',
    highlight: ['ion mobility', 'separation.'],
    body: 'Inside the drift tube, ions move through a directional electric field, separating by size, shape, charge and mobility. Most groups resolve clearly — two remain close.',
    features: [
      {
        icon: 'arrowList',
        title: 'Directional Field',
        text: 'Ions driven by a controlled electric field.',
      },
      {
        icon: 'burst',
        title: 'Separation By Mobility',
        text: 'Separated by size, shape, charge and mobility.',
      },
      {
        icon: 'waveform',
        title: 'High Resolution',
        text: 'Most ion groups resolve clearly.',
      },
      {
        icon: 'overlapCircles',
        title: 'Close Groups',
        text: 'Two ion groups remain close.',
      },
    ],
    statPair: [
      { icon: 'target', label: 'Separation Accuracy', value: '> 99.9%' },
      { icon: 'shield', label: 'Detection Confidence', value: 'High' },
    ],
    process: [
      {
        icon: 'dotsGrid',
        title: 'Injection',
        text: 'Ions enter the drift tube as a mixed population.',
      },
      {
        icon: 'arrowList',
        title: 'Mobility Separation',
        text: 'Ions travel through the electric field and separate by mobility.',
      },
      {
        icon: 'burst',
        title: 'Resolved Groups',
        text: 'Most groups resolve clearly — two remain close.',
      },
    ],
  },
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2009_47_15%20PM.png',
    eyebrow: 'Scene 05 — Ambiguity',
    headline: 'Some chemical signatures can overlap in a single dimension.',
    highlight: 'overlap in a single dimension.',
    body: 'Rendered as a drift-time graph, two signal peaks sit close together — not an error, but a scientifically ambiguous result that calls for a second measurement.',
    features: [
      {
        icon: 'waveform',
        title: 'Overlap',
        text: 'Peaks may overlap in a single dimension.',
      },
      {
        icon: 'target',
        title: 'Not An Error',
        text: 'This overlap is expected and scientifically valid.',
      },
      {
        icon: 'search',
        title: 'Needs Confirmation',
        text: 'A second measurement provides the clarity needed.',
      },
    ],
    statPair: [
      { icon: 'pulse', label: 'Measurement Precision', value: '> 99.9%' },
      { icon: 'shield', label: 'Result Reliability', value: 'High' },
    ],
    insight: {
      icon: 'overlapCircles',
      title: 'Scientific Ambiguity',
      text: 'Two peaks. One dimension. Multiple possibilities. A second axis brings the truth into focus.',
    },
  },
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2009_54_59%20PM.png',
    eyebrow: 'Scene 06 — Second Axis',
    headline: 'A perpendicular second axis reveals additional mobility differences.',
    highlight: ['second axis', 'mobility differences.'],
    body: 'The overlapping ion groups are redirected into a second drift pathway, positioned at 90 degrees to the first, where they separate into distinct trajectories.',
    features: [
      {
        icon: 'degrees90',
        title: 'Perpendicular Axis',
        text: 'Second drift pathway at 90 degrees to the first axis.',
      },
      {
        icon: 'refresh',
        title: 'Redirection',
        text: 'Overlapping ion groups are redirected.',
      },
      {
        icon: 'arrowList',
        title: 'Separation',
        text: 'Ions separate into distinct trajectories based on mobility.',
      },
      {
        icon: 'waveform',
        title: 'Enhanced Resolution',
        text: 'Additional mobility differences are revealed.',
      },
    ],
    statPair: [
      { icon: 'target', label: 'Improved Clarity', value: '> 99.9%' },
      { icon: 'bars', label: 'Mobility Differences', value: 'Revealed' },
    ],
    process: [
      {
        icon: 'burst',
        title: 'Overlap',
        text: 'Ion groups overlap in the first axis.',
      },
      {
        icon: 'degrees90',
        title: 'Second Axis',
        text: 'Redirected into a perpendicular (90°) drift pathway.',
      },
      {
        icon: 'arrowList',
        title: 'Separation',
        text: 'Ions separate into distinct trajectories by mobility.',
      },
    ],
  },
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2009_58_45%20PM.png',
    eyebrow: 'Scene 07 — Mobility Map',
    headline: 'Two axial measurements create a more distinctive chemical signature.',
    highlight: 'distinctive chemical signature.',
    body: 'Trajectories resolve into a two-dimensional mobility map. Compounds that once overlapped now occupy distinct, separable coordinates.',
    features: [
      {
        icon: 'crossArrows',
        title: 'Two Axes',
        text: 'Measurements taken along two perpendicular axes.',
      },
      {
        icon: 'venn',
        title: 'Resolve Overlap',
        text: 'Overlapping compounds separate into unique positions.',
      },
      {
        icon: 'dotsGrid',
        title: 'Clear Signature',
        text: 'A more distinctive chemical signature is revealed.',
      },
    ],
  },
  {
    img: 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2010_05_19%20PM.png',
    eyebrow: 'Scene 08 — Identification',
    headline: 'Physical separation becomes actionable chemical intelligence.',
    highlight: 'actionable chemical intelligence.',
    body: 'Resolved mobility coordinates pass into DDMS analysis, where correlated peaks converge on a single, confidently distinguished signature.',
    features: [
      {
        icon: 'target',
        title: 'Resolved Separation',
        text: 'Physical separation delivers distinct mobility peaks.',
      },
      {
        icon: 'chart',
        title: 'Correlated Peaks',
        text: 'Peaks are correlated across dimensions for accuracy.',
      },
      {
        icon: 'network',
        title: 'DDMS Analysis',
        text: 'Data enters DDMS for advanced analysis.',
      },
      {
        icon: 'check',
        title: 'Identification Complete',
        text: 'A single, confidently distinguished signature.',
      },
    ],
  },
]

// Relative scroll weight per scene — every step moves at the same unhurried
// pace.
const DURATIONS = SCENES.map(() => 7)
const VH_WEIGHTS = SCENES.map(() => 65)
const TOTAL_VH = VH_WEIGHTS.reduce((a, b) => a + b, 0)

function TechSection() {
  const sectionRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(sectionRef)
      const stage = q('.tech__stage')[0]

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          pin: stage,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              DURATIONS.length - 1,
              Math.floor(self.progress * DURATIONS.length),
            )
            q('.tech__progress-item').forEach((item, i) => {
              item.classList.toggle('is-active', i === idx)
            })
          },
        },
      })

      // Step 1 is on screen from the start.
      tl.fromTo(
        q('.tech__step--1 .tech__step-text > *'),
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.12 },
        0.3,
      ).to({}, { duration: Math.max(0, DURATIONS[0] - 1.5) })

      // Steps 2-8: outgoing step slides/fades out toward its own side while
      // the incoming step slides/fades in from the opposite side — this
      // reinforces the left/right swap instead of a flat crossfade.
      for (let i = 1; i < SCENES.length; i++) {
        const label = `scene${i + 1}`
        const duration = DURATIONS[i]
        const outReversed = i % 2 === 0 // step i (1-indexed i) reverse state
        const outExitX = outReversed ? 40 : -40
        const inReversed = (i + 1) % 2 === 0
        const inEnterX = inReversed ? -40 : 40

        tl.addLabel(label)
          .to(
            q(`.tech__step--${i}`),
            { opacity: 0, x: outExitX, duration: 0.9 },
            label,
          )
          .fromTo(
            q(`.tech__step--${i + 1}`),
            { opacity: 0, x: inEnterX },
            { opacity: 1, x: 0, duration: 0.9 },
            label,
          )
          .fromTo(
            q(`.tech__step--${i + 1} .tech__step-text > *`),
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 1, stagger: 0.12 },
            '<0.3',
          )
          // Spacer: holds this step on screen for its full allotted scroll
          // distance without any further motion on the image.
          .to({}, { duration: Math.max(0, duration - 2.2) })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="technology"
      className="tech"
      ref={sectionRef}
      style={{ height: `${TOTAL_VH}vh` }}
    >
      <div className="tech__stage">
        <div className="tech__backdrop" />

        <div className="tech__kicker">Core Technology</div>

        <div className="tech__progress">
          {DURATIONS.map((_, i) => (
            <span key={i} className={`tech__progress-item ${i === 0 ? 'is-active' : ''}`}>
              <span className="tech__dot" />
              <span className="tech__progress-num">{String(i + 1).padStart(2, '0')}</span>
            </span>
          ))}
        </div>

        <div className="tech__steps">
          {SCENES.map((scene, i) => {
            const reversed = i % 2 === 1
            const isRichCard = Boolean(scene.features)

            return (
              <div
                key={i}
                className={`tech__step tech__step--${i + 1} ${
                  isRichCard ? 'tech__step--card' : reversed ? 'tech__step--reverse' : ''
                } ${i === 0 ? 'is-visible' : ''}`}
              >
                {isRichCard ? (
                  <>
                    <div className={`tech__card ${reversed ? 'tech__card--reverse' : ''}`}>
                      <div className="tech__card-media">
                        <img className="tech__card-img" src={scene.img} alt={scene.headline} />
                        {scene.process && (
                          <div className="tech__process">
                            {scene.process.map((step, idx) => (
                              <div className="tech__process-step" key={step.title}>
                                <div className="tech__process-item">
                                  <IconBadge icon={step.icon} color={step.color} />
                                  <div>
                                    <span className="tech__process-title">
                                      {idx + 1}. {step.title}
                                    </span>
                                    <p className="tech__process-text">{step.text}</p>
                                  </div>
                                </div>
                                {idx < scene.process.length - 1 && (
                                  <span className="tech__process-arrow">»</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {scene.insight && (
                          <div className="tech__insight">
                            <IconBadge icon={scene.insight.icon} />
                            <div>
                              <h5 className="tech__insight-title">{scene.insight.title}</h5>
                              <p className="tech__insight-text">{scene.insight.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="tech__step-text">
                        <span className="tech__step-index">{scene.eyebrow}</span>
                        <h3 className="tech__step-title">
                          <Highlighted text={scene.headline} highlight={scene.highlight} />
                        </h3>
                        <p className="tech__step-caption">{scene.body}</p>
                        <div className="tech__features">
                          {scene.features.map((feature) => (
                            <div className="tech__feature" key={feature.title}>
                              <IconBadge icon={feature.icon} color={feature.color} />
                              <h4 className="tech__feature-title">{feature.title}</h4>
                              <p className="tech__feature-text">{feature.text}</p>
                            </div>
                          ))}
                        </div>
                        {scene.statPair && (
                          <div className="tech__stat-pair">
                            {scene.statPair.map((stat) => (
                              <div className="tech__stat-pair-item" key={stat.label}>
                                <IconBadge icon={stat.icon} color={stat.color} />
                                <div>
                                  <span className="tech__stat-pair-label">{stat.label}</span>
                                  <span className="tech__stat-pair-value">{stat.value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {scene.stats && (
                      <div className="tech__stats-bar">
                        {scene.stats.map((stat) => (
                          <div className="tech__stat" key={stat.title}>
                            <IconBadge icon={stat.icon} color={stat.color} />
                            <div className="tech__stat-copy">
                              <h5 className="tech__stat-title">{stat.title}</h5>
                              <p className="tech__stat-text">{stat.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="tech__step-media">
                      <div className="tech__step-frame">
                        <img className="tech__step-img" src={scene.img} alt={scene.headline} />
                      </div>
                    </div>
                    <div className="tech__step-text">
                      <span className="tech__step-index">{scene.eyebrow}</span>
                      <h3 className="tech__step-title">{scene.headline}</h3>
                      <p className="tech__step-caption">{scene.body}</p>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TechSection
