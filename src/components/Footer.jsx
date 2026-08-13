import { useEffect, useRef, useState } from 'react'

const LOGO_URL = 'https://ik.imagekit.io/d9wt8plt0/logo.png?updatedAt=1726730990831'
const BASE_URL = import.meta.env.BASE_URL
const pageUrl = (path) => `${BASE_URL}${path.replace(/^\//, '')}`

function Footer() {
  const [time, setTime] = useState('--:-- IST')
  const footerRef = useRef(null)
  const sweepRef = useRef(null)

  useEffect(() => {
    const updateTime = () => {
      const value = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date())
      setTime(`${value} IST`)
    }
    let timer = 0
    const syncClock = () => {
      window.clearInterval(timer)
      timer = 0
      if (document.hidden) return
      updateTime()
      timer = window.setInterval(updateTime, 30000)
    }
    syncClock()
    document.addEventListener('visibilitychange', syncClock)
    return () => {
      document.removeEventListener('visibilitychange', syncClock)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const footer = footerRef.current
    const sweep = sweepRef.current
    if (!footer || !sweep) return undefined

    let frame = 0
    let visibilityFrame = 0
    let visible = false

    const stop = () => {
      if (!frame) return
      window.cancelAnimationFrame(frame)
      frame = 0
    }

    const draw = (now) => {
      if (!visible || document.hidden) {
        frame = 0
        return
      }
      const angle = ((now % 5000) / 5000) * 360
      sweep.style.transform = `rotate(${angle}deg)`
      frame = window.requestAnimationFrame(draw)
    }

    const start = () => {
      if (!frame && visible && !document.hidden) {
        frame = window.requestAnimationFrame(draw)
      }
    }

    const updateVisibility = () => {
      const bounds = footer.getBoundingClientRect()
      const nextVisible = bounds.top <= window.innerHeight + 120 && bounds.bottom >= -120
      if (nextVisible === visible) return
      visible = nextVisible
      if (visible) start()
      else stop()
    }

    const queueVisibilityUpdate = () => {
      if (visibilityFrame) return
      visibilityFrame = window.requestAnimationFrame(() => {
        visibilityFrame = 0
        updateVisibility()
      })
    }

    const syncVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    updateVisibility()
    window.addEventListener('scroll', queueVisibilityUpdate, { passive: true })
    window.addEventListener('resize', queueVisibilityUpdate)
    document.addEventListener('visibilitychange', syncVisibility)
    return () => {
      window.removeEventListener('scroll', queueVisibilityUpdate)
      window.removeEventListener('resize', queueVisibilityUpdate)
      document.removeEventListener('visibilitychange', syncVisibility)
      window.cancelAnimationFrame(visibilityFrame)
      stop()
    }
  }, [])

  const scrollToTop = (event) => {
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="site-footer" id="footer" data-footer ref={footerRef}>
      <div className="footer-grid" aria-hidden="true" />
      <div className="footer-top">
        <a className="footer-brand" href="#top" onClick={scrollToTop} aria-label="Back to top">
          <span className="footer-logo"><img src={LOGO_URL} alt="Anika Sterilis" /><i /></span>
          <span><b>ANIKA STERILIS</b><small>PRIVATE LIMITED</small></span>
        </a>
        <div className="footer-status"><i /><span>AACTS® PLATFORM / OPERATIONAL</span></div>
        <a className="footer-toplink" href="#top" onClick={scrollToTop}>Return to top <b>↑</b></a>
      </div>

      <div className="footer-main">
        <div className="footer-statement">
          <span>CHEMICAL INTELLIGENCE / INDIA</span>
          <h2>Make the invisible<br /><em>actionable.</em></h2>
          <p>Advanced Active Chemical Threat Scanning systems engineered for security environments where every trace matters.</p>
          <a href={pageUrl('/contact/')}>Start a conversation <b>↗</b></a>
        </div>

        <div className="footer-seal" aria-label="Anika Sterilis identity">
          <span>ANIKA STERILIS / PRIVATE LIMITED</span>
          <div><i className="footer-seal__sweep" ref={sweepRef} /><img src={LOGO_URL} alt="Anika Sterilis" /></div>
          <small>PATENTED DETECTION PLATFORM / 3000</small>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <div>
            <span>Platform</span>
            <a href={pageUrl('/solutions/')}>AACTS® 3000</a>
            <a href={`${pageUrl('/index.html')}#products`}>Product platform</a>
            <a href={pageUrl('/capability.html')}>Capabilities</a>
            <a href={`${pageUrl('/index.html')}#applications`}>Applications</a>
          </div>
          <div>
            <span>Company</span>
            <a href={pageUrl('/about/')}>About us</a>
            <a href={pageUrl('/solutions/')}>Solutions</a>
            <a href={pageUrl('/contact/')}>Contact</a>
          </div>
          <div>
            <span>Legal</span>
            <a href={pageUrl('/privacy/')}>Privacy</a>
            <a href={pageUrl('/terms/')}>Terms</a>
          </div>
        </nav>
      </div>

      <div className="footer-wordmark" aria-hidden="true">ANIKA <em>STERILIS</em></div>
      <div className="footer-bottom">
        <span>© 2026 ANIKA STERILIS PRIVATE LIMITED</span>
        <span>ADVANCED ACTIVE CHEMICAL THREAT SCANNING</span>
        <span>LOCAL TIME <b>{time}</b></span>
      </div>
    </footer>
  )
}

export default Footer
