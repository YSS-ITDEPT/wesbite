import { useEffect, useState } from 'react'

const LOGO_URL = 'https://ik.imagekit.io/d9wt8plt0/logo.png?updatedAt=1726730990831'
const BASE_URL = import.meta.env.BASE_URL
const pageUrl = (path) => `${BASE_URL}${path.replace(/^\//, '')}`

function Header({ compact = false, hideOverFooter = false }) {
  const pathname = window.location.pathname
  const [menuOpen, setMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isOverFooter, setIsOverFooter] = useState(false)
  // The scroll-collapsing "Navigate" header is a desktop-only treatment; mobile
  // keeps the standard header with its own menu toggle.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches,
  )

  useEffect(() => {
    if (!hideOverFooter) return undefined

    let frame = 0
    const updateFooterBoundary = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const footer = document.querySelector('[data-footer]')
        if (!footer) return
        const headerHeight = isMobile ? 72 : 86
        const bounds = footer.getBoundingClientRect()
        setIsOverFooter(bounds.top <= headerHeight && bounds.bottom > 0)
      })
    }

    updateFooterBoundary()
    window.addEventListener('scroll', updateFooterBoundary, { passive: true })
    window.addEventListener('resize', updateFooterBoundary)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateFooterBoundary)
      window.removeEventListener('resize', updateFooterBoundary)
    }
  }, [hideOverFooter, isMobile])

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 860px)')
    const sync = () => setIsMobile(mobileQuery.matches)
    sync()
    mobileQuery.addEventListener('change', sync)
    return () => mobileQuery.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      const bar = document.querySelector('.index-header .page-completion i')
      if (bar) bar.style.width = `${progress * 100}%`
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined

    const closeFromPageTap = (event) => {
      // The toggle owns its open/close state. Every other tap—including an
      // unused area inside the panel—dismisses the mobile navigation.
      if (event.target.closest('.mnav-toggle, .compact-nav-toggle')) return
      setMenuOpen(false)
    }

    document.addEventListener('click', closeFromPageTap)
    return () => document.removeEventListener('click', closeFromPageTap)
  }, [menuOpen])

  useEffect(() => {
    if (!compact || isMobile) {
      setIsCollapsed(false)
      return
    }

    let baseline = window.scrollY
    let ignoreUntil = performance.now() + 650
    let baselineTimer = 0

    const revealFullHeader = () => {
      setMenuOpen(false)
      setIsCollapsed(false)
      ignoreUntil = performance.now() + 700
      window.clearTimeout(baselineTimer)
      baselineTimer = window.setTimeout(() => {
        baseline = window.scrollY
      }, 180)
    }

    const handleScroll = () => {
      if (window.scrollY <= 12) {
        setIsCollapsed(false)
        baseline = window.scrollY
        return
      }
      if (performance.now() < ignoreUntil) return
      if (Math.abs(window.scrollY - baseline) > 90) setIsCollapsed(true)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('anika:solution-product-change', revealFullHeader)
    return () => {
      window.clearTimeout(baselineTimer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('anika:solution-product-change', revealFullHeader)
    }
  }, [compact, isMobile])

  if (compact && isCollapsed && !isMobile) {
    return (
      <header className={`index-header index-header--compact ${menuOpen ? 'has-open-menu' : ''} ${isOverFooter ? 'is-over-footer' : ''}`}>
        <a className="brand compact-brand" href={pageUrl('/index.html')}>
          <img src={LOGO_URL} alt="Anika Sterilis corporate logo" />
          <span><b>ANIKA STERILIS</b><small>PRIVATE LIMITED</small></span>
        </a>

        <button
          className="compact-nav-toggle"
          type="button"
          aria-label={menuOpen ? 'Close site navigation' : 'Open site navigation'}
          aria-expanded={menuOpen}
          aria-controls="compact-site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="compact-nav-toggle__label">{menuOpen ? 'Close' : 'Navigate'}</span>
          <span className="compact-nav-toggle__icon" aria-hidden="true"><i /><i /></span>
        </button>

        <div className="compact-nav-panel" id="compact-site-navigation">
          <span className="compact-nav-panel__eyebrow">Site navigation / 05</span>
          <nav>
            <a href={pageUrl('/index.html')}><b>01</b><span>Platform</span></a>
            <a href={pageUrl('/capability.html')}><b>02</b><span>Capabilities</span></a>
            <a className="is-active" aria-current="page" href={pageUrl('/solutions/')}><b>03</b><span>Solutions</span></a>
            <a href={pageUrl('/about/')}><b>04</b><span>About Us</span></a>
            <a href={pageUrl('/contact/')}><b>05</b><span>Contact</span></a>
          </nav>
        </div>
        <div className="page-completion" aria-hidden="true"><i /></div>
      </header>
    )
  }

  return (
    <header className={`index-header ${compact ? 'index-header--solutions-full' : ''} ${isOverFooter ? 'is-over-footer' : ''}`}>
      <a className="brand" href={pageUrl('/index.html')}>
        <img src={LOGO_URL} alt="Anika Sterilis corporate logo" />
        <span>
          <b>ANIKA STERILIS</b>
          <small>PRIVATE LIMITED</small>
        </span>
      </a>
      <nav>
        <a href={pageUrl('/index.html')}>Platform</a>
        <a href={pageUrl('/capability.html')}>Capabilities</a>
        <a className={pathname.endsWith('/solutions') || pathname.endsWith('/solutions/') ? 'is-active' : ''} aria-current={pathname.endsWith('/solutions') || pathname.endsWith('/solutions/') ? 'page' : undefined} href={pageUrl('/solutions/')}>Solutions</a>
        <a className={pathname.endsWith('/about') || pathname.endsWith('/about/') ? 'is-active' : ''} aria-current={pathname.endsWith('/about') || pathname.endsWith('/about/') ? 'page' : undefined} href={pageUrl('/about/')}>About Us</a>
      </nav>
      <a className={`contact ${pathname.endsWith('/contact') || pathname.endsWith('/contact/') ? 'is-active' : ''}`} aria-current={pathname.endsWith('/contact') || pathname.endsWith('/contact/') ? 'page' : undefined} href={pageUrl('/contact/')}>
        Contact <span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M8 7h9v9" /></svg></span>
      </a>
      <button
        className="mnav-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="mobile-site-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span>Menu</span>
        <i aria-hidden="true"><b /><b /></i>
      </button>
      <div className={`mnav-panel ${menuOpen ? 'is-open' : ''}`} id="mobile-site-navigation">
        <span>Site navigation / 05</span>
        <nav>
          <a href={pageUrl('/index.html')}><b>01</b>Platform</a>
          <a href={pageUrl('/capability.html')}><b>02</b>Capabilities</a>
          <a className={pathname.endsWith('/solutions') || pathname.endsWith('/solutions/') ? 'is-active' : ''} href={pageUrl('/solutions/')}><b>03</b>Solutions</a>
          <a className={pathname.endsWith('/about') || pathname.endsWith('/about/') ? 'is-active' : ''} href={pageUrl('/about/')}><b>04</b>About Us</a>
          <a className={pathname.endsWith('/contact') || pathname.endsWith('/contact/') ? 'is-active' : ''} href={pageUrl('/contact/')}><b>05</b>Contact</a>
        </nav>
      </div>
      <div className="page-completion" aria-hidden="true"><i /></div>
    </header>
  )
}

export default Header
