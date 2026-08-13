(() => {
  const loader = document.querySelector('[data-page-loader]')
  if (!loader) return

  const count = loader.querySelector('[data-boot-count]')
  const bar = loader.querySelector('[data-boot-bar]')
  const status = loader.querySelector('[data-boot-status]')
  const statuses = [
    'CALIBRATING DETECTION ENVIRONMENT',
    'CONNECTING ACTIVE SAMPLING SYSTEMS',
    'INITIALIZING CHEMICAL INTELLIGENCE',
    'SYSTEM READY',
  ]
  const isHandoff = sessionStorage.getItem('anikaPageHandoff') === '1'
  sessionStorage.removeItem('anikaPageHandoff')
  const duration = isHandoff ? 1050 : 1850
  const initialProgress = isHandoff ? 18 : 0
  const started = performance.now()

  document.documentElement.style.overflow = 'hidden'
  loader.style.setProperty('--boot-duration', `${duration}ms`)

  const paint = (value) => {
    const n = Math.min(100, Math.round(value))
    count.textContent = String(n).padStart(3, '0')
    bar.style.width = `${n}%`
    status.textContent = statuses[Math.min(3, Math.floor(n / 26))]
  }

  const finish = () => {
    loader.classList.add('is-leaving')
    loader.querySelectorAll('.boot-center,.boot-brand,.boot-progress,.boot-status').forEach((element, index) => {
      element.animate(
        [{ opacity: 1, transform: element.classList.contains('boot-center') ? 'translate(-50%, -50%)' : 'translateY(0)' },
         { opacity: 0, transform: element.classList.contains('boot-center') ? 'translate(-50%, calc(-50% - 12px))' : 'translateY(-12px)' }],
        { duration: 300, delay: index * 25, fill: 'forwards', easing: 'ease-out' },
      )
    })
    const exit = loader.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
      { duration: 720, delay: 180, fill: 'forwards', easing: 'cubic-bezier(.76,0,.24,1)' },
    )
    let loaderReleased = false
    const releaseLoader = () => {
      if (loaderReleased) return
      loaderReleased = true
      loader.classList.add('is-hidden')
      document.documentElement.style.overflow = ''
      window.dispatchEvent(new Event('anika:page-ready'))
    }
    // Firefox can reject Animation.finished when its compositor replaces or
    // cancels a layer during navigation. Never let that leave the black loader
    // covering an otherwise-ready page.
    exit.finished.then(releaseLoader, releaseLoader)
    setTimeout(releaseLoader, 1150)
  }

  // Hold the loader until the page's critical below-the-fold imagery has
  // decoded, so scroll-driven sections (the "Critical environments" pinned
  // panels) are measured against a settled layout instead of shooting past
  // panels 02–05 on Safari/iOS. Bounded by a hard cap so it can never hang.
  const ASSET_WAIT_CAP = 3500
  const criticalAssetsReady = () => {
    const mobile = matchMedia('(max-width: 720px)').matches
    const sources = new Set()

    // CSS background scenes (--scene / --scene-mobile) on the panels.
    document.querySelectorAll('.app-panels article').forEach((article) => {
      const raw =
        (mobile && article.style.getPropertyValue('--scene-mobile')) ||
        article.style.getPropertyValue('--scene')
      const url = raw.replace(/^\s*url\(["']?/, '').replace(/["']?\)\s*$/, '')
      if (url) sources.add(url)
    })

    // Eager <img> elements already in the initial markup.
    document.querySelectorAll('img:not([loading="lazy"])').forEach((img) => {
      if (img.currentSrc || img.src) sources.add(img.currentSrc || img.src)
    })

    if (!sources.size) return Promise.resolve()
    return Promise.all(
      [...sources].map(
        (src) =>
          new Promise((resolve) => {
            const probe = new Image()
            probe.onload = probe.onerror = () => resolve()
            probe.src = src
          }),
      ),
    )
  }

  let assetsSettled = false
  Promise.race([
    criticalAssetsReady(),
    new Promise((resolve) => setTimeout(resolve, ASSET_WAIT_CAP)),
  ]).then(() => {
    assetsSettled = true
  })

  const tick = (now) => {
    const progress = Math.min(1, (now - started) / duration)
    const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    // Cap the visible bar at 92% until the critical assets have settled, then
    // let it run to 100% and hand off.
    const ceiling = assetsSettled ? 100 : 92
    paint(Math.min(ceiling, initialProgress + eased * (100 - initialProgress)))
    if (progress < 1 || !assetsSettled) requestAnimationFrame(tick)
    else finish()
  }
  paint(initialProgress)
  requestAnimationFrame(tick)

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]')
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (link.target === '_blank' || link.hasAttribute('download')) return

    const destination = new URL(link.href, location.href)
    if (destination.origin !== location.origin) return
    const sameDocument = destination.pathname === location.pathname && destination.search === location.search
    if (sameDocument && destination.hash) return
    if (destination.href === location.href) return

    event.preventDefault()
    sessionStorage.setItem('anikaPageHandoff', '1')
    try {
      loader.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
    } catch {
      loader.getAnimations().forEach((animation) => animation.cancel())
    }
    loader.classList.remove('is-hidden', 'is-leaving')
    loader.style.setProperty('--boot-duration', '480ms')
    loader.style.transform = 'translateY(100%)'
    loader.style.opacity = '1'
    loader.querySelectorAll('.boot-center,.boot-brand,.boot-progress,.boot-status').forEach((element) => {
      element.style.opacity = '1'
      element.style.transform = ''
    })
    paint(18)
    document.documentElement.style.overflow = 'hidden'
    const handoff = loader.animate(
      [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
      { duration: 480, fill: 'forwards', easing: 'cubic-bezier(.76,0,.24,1)' },
    )
    let navigationStarted = false
    const navigate = () => {
      if (navigationStarted) return
      navigationStarted = true
      location.href = destination.href
    }
    handoff.finished.then(navigate, navigate)
    setTimeout(navigate, 700)
  })
})()
