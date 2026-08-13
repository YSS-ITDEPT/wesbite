import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Crosshair,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
import './SolutionSection.css'

const SOLUTIONS = [
  {
    icon: ShieldCheck,
    title: 'Advanced Detection',
    text: 'Identify threats with high-precision chemical detection technology.',
  },
  {
    icon: Building2,
    title: 'Infrastructure Protection',
    text: 'Safeguard critical infrastructure and key assets.',
  },
  {
    icon: BadgeCheck,
    title: 'Defense Operations',
    text: 'Enhance mission readiness with reliable security solutions.',
  },
  {
    icon: UserRoundCheck,
    title: 'Law Enforcement Support',
    text: 'Empower authorities with tools for safer communities.',
  },
  {
    icon: Crosshair,
    title: 'Operational Safety',
    text: 'Ensure safe operations with unmatched precision.',
  },
]

function SolutionSection() {
  return (
    <section id="solutions" className="solution">
      <div className="solution__panel">
        <div className="solution__header">
          <span className="solution__eyebrow">What To Choose</span>
          <h2 className="solution__title">
            Looking for the right <span>security solution?</span>
          </h2>
          <p className="solution__copy">
            Choosing the right technology is crucial for effective security. Our
            advanced detection systems safeguard infrastructure, defense
            operations and law enforcement activities.
          </p>
          <p className="solution__copy">
            At the forefront is the <strong>AACTS 3000</strong> system,
            complemented by products designed to protect checkpoints and ensure
            operational safety with unmatched precision.
          </p>
        </div>

        <div className="solution__cards">
          {SOLUTIONS.map(({ icon: Icon, title, text }) => (
            <article className="solution__card" key={title}>
              <span className="solution__icon">
                <Icon strokeWidth={1.6} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <Link className="solution__cta" to="/solutions">
          Browse Solutions <ArrowRight strokeWidth={1.8} />
        </Link>
      </div>
    </section>
  )
}

export default SolutionSection
