import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronDown,
  Globe2,
  Mail,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  Send,
  User,
} from 'lucide-react'
import { useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import IndiaDotMap from '../components/IndiaDotMap.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'
import './ContactPage.css'

const CONTACT_HERO_BG = 'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2023,%202026,%2009_35_04%20AM.png'
const CONTACT_FORM_IMAGE =
  'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2023,%202026,%2001_18_50%20PM.png'

const LOCATIONS = [
  {
    country: 'India',
    name: 'Corporate Headquarters',
    address: ['Anika Sterilis Private Limited', '21st Floor, SVH 83 Metro Street,','Gurugram,','Haryana, PIN-122004'],
    email: 'hq@anikasterilis.com',
    phone: '+91 11 6934 3900',
    mapsUrl: 'https://www.google.com/maps?q=SVH+83+Metro+Street+Haryana+122004',
  },
  {
    country: 'India',
    name: 'Manufacturing Facility',
    address: ['Anika ONE, AMTZ Campus', 'Pragati Maidan, VM Steel Project S.O,', 'Visakhapatnam,', 'Andhra Pradesh, PIN-530031'],
    email: 'info@anikasterilis.com',
    phone: '+91 11 6934 3900',
    mapsUrl: 'https://maps.app.goo.gl/2pwdAiiiHz9eajEF8',
  },
]

const COUNTRIES = [
  'India',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Saudi Arabia',
  'Singapore',
  'Germany',
  'France',
  'Netherlands',
  'Italy',
  'Spain',
  'Japan',
  'South Korea',
  'China',
  'Brazil',
  'Mexico',
  'South Africa',
  'Nigeria',
  'Kenya',
  'Qatar',
  'Kuwait',
  'Israel',
  'Turkey',
  'Other',
]

function ContactPage() {
  const mainRef = useRef(null)
  const formRef = useRef(null)
  const [formStatus, setFormStatus] = useState({ type: 'idle', message: '' })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const form = event.currentTarget
    if (!form.reportValidity() || formStatus.type === 'submitting') return

    setFormStatus({ type: 'submitting', message: 'Sending your message…' })

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/contact.php`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Your message could not be submitted. Please try again.')
      }

      formRef.current?.reset()
      setFormStatus({
        type: 'success',
        message: 'Submitted successfully. Thank you — our team will contact you shortly.',
      })
    } catch (error) {
      setFormStatus({
        type: 'error',
        message: error.message || 'Your message could not be submitted. Please try again.',
      })
    }
  }

  useScrollReveal(mainRef, {
    intro: [
      { items: '.contact-hero__kicker, .contact-hero__heading span, .contact-hero__lead', stagger: 0.1, delay: 0.2 },
    ],
    groups: [
      {
        trigger: '.contact-locations',
        items: '.contact-locations__kicker, .contact-locations__title, .contact-locations__subtitle',
        start: 'top 94%',
        y: 20,
        stagger: 0.07,
      },
      {
        trigger: '.contact-locations',
        items: '.contact-locations__card, .contact-locations__media',
        start: 'top 90%',
        y: 28,
        stagger: 0.09,
      },
      { trigger: '.contact-inquiry__form', items: '.contact-inquiry__field, .contact-inquiry__actions', start: 'top 82%', stagger: 0.06 },
    ],
  })

  return (
    <>
      <Header alwaysVisible />
      <main className="contact-page" ref={mainRef}>
        <section className="contact-hero" aria-label="Contact Anika Sterilis">
          <img className="contact-hero__image" src={CONTACT_HERO_BG} alt="" aria-hidden="true" />
          <div className="contact-hero__overlay" />

          <div className="contact-hero__content">
            <p className="contact-hero__kicker">Locations</p>
            <h1 className="contact-hero__heading">
              <span>Our global</span>
              <span>presence</span>
            </h1>
            <p className="contact-hero__lead">
              Wherever you are in the world, the challenges of securing critical infrastructure, law
              enforcement, and defense are global. Anika Sterilis offers the solution with advanced
              AACTS® systems that ensure precise, real-time threat detection. We tackle these
              worldwide security issues, safeguarding lives and assets with unmatched expertise.
            </p>
          </div>
        </section>

        <section className="contact-locations" aria-labelledby="contact-locations-title">
          <div className="contact-locations__header">
            <p className="contact-locations__kicker">
              <span />
              Our Presence
              <span />
            </p>
            <h2 id="contact-locations-title" className="contact-locations__title">
              Strategic <span>Locations</span>
            </h2>
            <p className="contact-locations__subtitle">
              Driving innovation and delivering excellence from key locations across India.
            </p>
          </div>

          <div className="contact-locations__grid">
            <div className="contact-locations__card" key={LOCATIONS[0].name}>
              <div className="contact-locations__icon">
                <MapPinned aria-hidden="true" />
              </div>
              <p className="contact-locations__country">{LOCATIONS[0].country}</p>
              <h3 className="contact-locations__name">{LOCATIONS[0].name}</h3>

              <ul className="contact-locations__details">
                <li>
                  <MapPin size={18} aria-hidden="true" />
                  <span>
                    {LOCATIONS[0].address.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </span>
                </li>
                <li>
                  <Mail size={18} aria-hidden="true" />
                  <span>Email: {LOCATIONS[0].email}</span>
                </li>
                <li>
                  <Phone size={18} aria-hidden="true" />
                  <span>Phone: {LOCATIONS[0].phone}</span>
                </li>
              </ul>

              <a
                className="contact-locations__button"
                href={LOCATIONS[0].mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={18} aria-hidden="true" />
                Get Directions
                <ArrowRight size={18} aria-hidden="true" className="contact-locations__button-arrow" />
              </a>
            </div>

            <div className="contact-locations__media">
              <IndiaDotMap background="transparent" size={520} />
            </div>

            <div className="contact-locations__card" key={LOCATIONS[1].name}>
              <div className="contact-locations__icon">
                <MapPinned aria-hidden="true" />
              </div>
              <p className="contact-locations__country">{LOCATIONS[1].country}</p>
              <h3 className="contact-locations__name">{LOCATIONS[1].name}</h3>

              <ul className="contact-locations__details">
                <li>
                  <MapPin size={18} aria-hidden="true" />
                  <span>
                    {LOCATIONS[1].address.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </span>
                </li>
                <li>
                  <Mail size={18} aria-hidden="true" />
                  <span>Email: {LOCATIONS[1].email}</span>
                </li>
                <li>
                  <Phone size={18} aria-hidden="true" />
                  <span>Phone: {LOCATIONS[1].phone}</span>
                </li>
              </ul>

              <a
                className="contact-locations__button"
                href={LOCATIONS[1].mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={18} aria-hidden="true" />
                Get Directions
                <ArrowRight size={18} aria-hidden="true" className="contact-locations__button-arrow" />
              </a>
            </div>
          </div>
        </section>

        <section className="contact-inquiry" aria-labelledby="contact-inquiry-title">
          <div className="contact-inquiry__shell">
            <div
              className="contact-inquiry__visual"
              style={{ backgroundImage: `url(${CONTACT_FORM_IMAGE})` }}
            >
              <div className="contact-inquiry__copy">
                <p className="contact-inquiry__eyebrow">Get In Touch</p>
                <h2 id="contact-inquiry-title" className="contact-inquiry__title">
                  <span>Let&rsquo;s Build</span>
                  <span>Smarter</span>
                  <span className="contact-inquiry__title-accent">Solutions.</span>
                </h2>
                <p className="contact-inquiry__lead">
                  Have a question, idea, or project in mind?
                  <br />
                  We&rsquo;d love to hear from you.
                </p>
              </div>
            </div>

            <form
              className="contact-inquiry__form"
              ref={formRef}
              onSubmit={handleSubmit}
              onInput={() => {
                if (formStatus.type === 'success' || formStatus.type === 'error') {
                  setFormStatus({ type: 'idle', message: '' })
                }
              }}
            >
              <label className="contact-inquiry__field">
                <User aria-hidden="true" />
                <input type="text" name="firstName" placeholder="First Name" autoComplete="given-name" minLength="2" maxLength="80" required />
              </label>
              <label className="contact-inquiry__field">
                <User aria-hidden="true" />
                <input type="text" name="lastName" placeholder="Last Name" autoComplete="family-name" minLength="2" maxLength="80" required />
              </label>
              <label className="contact-inquiry__field">
                <Mail aria-hidden="true" />
                <input type="email" name="email" placeholder="Email" autoComplete="email" maxLength="190" required />
              </label>
              <label className="contact-inquiry__field">
                <Phone aria-hidden="true" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  autoComplete="tel"
                  minLength="7"
                  maxLength="25"
                  pattern="[0-9+().\-\s]{7,25}"
                  title="Enter a valid phone number using digits, spaces, +, -, or parentheses."
                  required
                />
              </label>
              <label className="contact-inquiry__field">
                <Building2 aria-hidden="true" />
                <input type="text" name="company" placeholder="Company" autoComplete="organization" minLength="2" maxLength="150" required />
              </label>
              <label className="contact-inquiry__field">
                <Briefcase aria-hidden="true" />
                <input type="text" name="jobTitle" placeholder="Job Title" autoComplete="organization-title" minLength="2" maxLength="120" required />
              </label>
              <label className="contact-inquiry__field contact-inquiry__field--select">
                <Globe2 aria-hidden="true" />
                <select name="country" defaultValue="" autoComplete="country-name" required>
                  <option value="" disabled>
                    Country/Region
                  </option>
                  {COUNTRIES.map((country) => (
                    <option
                      key={country}
                      value={country}
                      className={country === 'India' ? 'contact-inquiry__country-primary' : undefined}
                    >
                      {country}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="contact-inquiry__select-arrow" />
              </label>
              <label className="contact-inquiry__field contact-inquiry__field--message">
                <MessageCircle aria-hidden="true" />
                <textarea name="message" placeholder="Your Message" minLength="10" maxLength="5000" required />
              </label>
              <div className="contact-inquiry__actions">
                <button
                  className="contact-inquiry__button"
                  type="submit"
                  disabled={formStatus.type === 'submitting'}
                >
                  <Send aria-hidden="true" />
                  {formStatus.type === 'submitting' ? 'Sending…' : 'Send Message'}
                </button>
                <span className="contact-inquiry__note">
                  <svg
                    className="contact-inquiry__note-arrow"
                    viewBox="0 0 64 34"
                    aria-hidden="true"
                  >
                    <path
                      d="M60 25C45 31 25 28 8 17"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 17l11-3M8 17l6 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  We typically reply within 24 hrs
                </span>
              </div>
              <p
                className={`contact-inquiry__status contact-inquiry__status--${formStatus.type}`}
                role="status"
                aria-live="polite"
              >
                {formStatus.message}
              </p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default ContactPage
