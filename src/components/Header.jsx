import { useEffect, useState } from 'react'

const LOGO_URL = 'https://ik.imagekit.io/d9wt8plt0/logo.png?updatedAt=1726730990831'
const BASE_URL = import.meta.env.BASE_URL
const pageUrl = (path) => `${BASE_URL}${path.replace(/^\//, '')}`

function Header({ compact = false, hideOverFooter = false }) {
  const pathname = window.location.pathname
  const isCapabilities = pathname.includes('/capabilities/') || pathname.endsWith('/capability.html')
  const isDeepTechnology = pathname.endsWith('/deep-technology') || pathname.endsWith('/deep-technology/')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState(null)
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
      if (event.target.closest('.mnav-toggle, .compact-nav-toggle, .mnav-submenu-toggle')) return
      setMenuOpen(false)
      setOpenMobileSubmenu(null)
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
          <span className="compact-nav-panel__eyebrow">Site navigation / 06</span>
          <nav>
            <a href={pageUrl('/index.html')}><b>01</b><span>Platform</span></a>
            <a href={pageUrl('/deep-technology')}><b>02</b><span>Deep Technology</span></a>
            <a href={pageUrl('/capability.html')}><b>03</b><span>Capabilities</span></a>
            <a className="is-active" aria-current="page" href={pageUrl('/solutions/')}><b>04</b><span>Solutions</span></a>
            <a href={pageUrl('/about/')}><b>05</b><span>About Us</span></a>
            <a href={pageUrl('/contact/')}><b>06</b><span>Contact</span></a>
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
        <a className={isDeepTechnology ? 'is-active' : ''} aria-current={isDeepTechnology ? 'page' : undefined} href={pageUrl('/deep-technology')}>Deep Technology</a>
        <div className="nav-menu">
          <a className={isCapabilities ? 'is-active' : ''} aria-current={isCapabilities ? 'page' : undefined} href={pageUrl('/capability.html')}>Capabilities</a>
          <div className="nav-submenu">
            <div className="nav-submenu__intro"><span>02 / Capabilities</span><h2>Detection science,<br />engineered for certainty.</h2><p>Explore the disciplines behind rapid, defensible trace-threat identification.</p></div>
            <div className="nav-submenu__links"><a href={pageUrl('/capabilities/deep-technology')}><b>01</b><span>Deep Technology</span><i>Science into capability</i></a><a href={pageUrl('/capability.html')}><b>02</b><span>Our Expertise</span><i>Explore our established capabilities</i></a></div>
            <a className="nav-submenu__feature" href={pageUrl('/capabilities/deep-technology')}><img src={pageUrl('/nav-capabilities-science.png')} alt="Precision analytical science translating physical particles into a measurable signal" /><span>Inside the science</span><strong>Deep technology for the physical world</strong></a>
          </div>
        </div>
        <div className="nav-menu">
          <a className={pathname.endsWith('/solutions') || pathname.endsWith('/solutions/') ? 'is-active' : ''} aria-current={pathname.endsWith('/solutions') || pathname.endsWith('/solutions/') ? 'page' : undefined} href={pageUrl('/solutions/')}>Solutions</a>
          <div className="nav-submenu">
            <div className="nav-submenu__intro"><span>03 / Solutions</span><h2>One platform.<br />Critical environments.</h2><p>Discover deployable systems built for real-world security operations.</p></div>
            <div className="nav-submenu__links"><a href={pageUrl('/index.html#applications')}><b>01</b><span>Application Domains</span><i>Where AACTS operates</i></a><a href={pageUrl('/solutions/')}><b>02</b><span>Products</span><i>Explore the product family</i></a></div>
            <a className="nav-submenu__feature" href={pageUrl('/solutions/')}><img src={pageUrl('/nav-solutions-detection.png')} alt="Active trace-detection system inspecting a rugged cargo case" /><span>AACTS® platform</span><strong>See the detection systems</strong></a>
          </div>
        </div>
        <div className="nav-menu">
          <a className={pathname.endsWith('/about') || pathname.endsWith('/about/') ? 'is-active' : ''} aria-current={pathname.endsWith('/about') || pathname.endsWith('/about/') ? 'page' : undefined} href={pageUrl('/about/')}>About Us</a>
          <div className="nav-submenu">
            <div className="nav-submenu__intro"><span>04 / About</span><h2>Innovation with<br />protective intent.</h2><p>Meet the company advancing active chemical threat scanning.</p></div>
            <div className="nav-submenu__links"><a href={pageUrl('/about/#vision-intent')}><b>01</b><span>Vision &amp; Intent</span><i>Why we build</i></a><a href={pageUrl('/about/')}><b>02</b><span>Our Company</span><i>Discover Anika Sterilis</i></a></div>
            <a className="nav-submenu__feature" href={pageUrl('/about/')}><img src={pageUrl('/nav-about-engineers.png')} alt="Anika deep-technology engineers validating analytical equipment" /><span>Our purpose</span><strong>Technology that safeguards life</strong></a>
          </div>
        </div>
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
        <span>Site navigation / 06</span>
        <nav>
          <a href={pageUrl('/index.html')}><b>01</b>Platform</a>
          <a className={isDeepTechnology ? 'is-active' : ''} href={pageUrl('/deep-technology')}><b>02</b>Deep Technology</a>
          <div className={`mnav-group ${openMobileSubmenu === 'capabilities' ? 'is-expanded' : ''}`}>
            <button className={`mnav-submenu-toggle ${isCapabilities ? 'is-active' : ''}`} type="button" aria-expanded={openMobileSubmenu === 'capabilities'} onClick={() => setOpenMobileSubmenu((item) => item === 'capabilities' ? null : 'capabilities')}><b>03</b><span>Capabilities</span><i aria-hidden="true">+</i></button>
            <div className="mnav-submenu"><a href={pageUrl('/capabilities/deep-technology')}>Deep Technology</a><a href={pageUrl('/capability.html')}>Our Expertise</a></div>
          </div>
          <div className={`mnav-group ${openMobileSubmenu === 'solutions' ? 'is-expanded' : ''}`}>
            <button className={`mnav-submenu-toggle ${pathname.endsWith('/solutions') || pathname.endsWith('/solutions/') ? 'is-active' : ''}`} type="button" aria-expanded={openMobileSubmenu === 'solutions'} onClick={() => setOpenMobileSubmenu((item) => item === 'solutions' ? null : 'solutions')}><b>04</b><span>Solutions</span><i aria-hidden="true">+</i></button>
            <div className="mnav-submenu"><a href={pageUrl('/index.html#applications')}>Application Domains</a><a href={pageUrl('/solutions/')}>Products</a></div>
          </div>
          <div className={`mnav-group ${openMobileSubmenu === 'about' ? 'is-expanded' : ''}`}>
            <button className={`mnav-submenu-toggle ${pathname.endsWith('/about') || pathname.endsWith('/about/') ? 'is-active' : ''}`} type="button" aria-expanded={openMobileSubmenu === 'about'} onClick={() => setOpenMobileSubmenu((item) => item === 'about' ? null : 'about')}><b>05</b><span>About Us</span><i aria-hidden="true">+</i></button>
            <div className="mnav-submenu"><a href={pageUrl('/about/#vision-intent')}>Vision &amp; Intent</a><a href={pageUrl('/about/')}>Our Company</a></div>
          </div>
          <a className={pathname.endsWith('/contact') || pathname.endsWith('/contact/') ? 'is-active' : ''} href={pageUrl('/contact/')}><b>06</b>Contact</a>
        </nav>
      </div>
      <div className="page-completion" aria-hidden="true"><i /></div>
    </header>
  )
}

export default Header
