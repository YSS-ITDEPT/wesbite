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

  // Back/forward cache restoration does not execute this script again. The
  // browser can therefore restore the exact pre-navigation snapshot where the
  // handoff loader covered the page and <html> was scroll-locked. Release that
  // stale state synchronously on pageshow for every static and React route.
  const restoreFromHistory = (event) => {
    const navigation = performance.getEntriesByType?.('navigation')?.[0]
    const isHistoryRestore = event.persisted || navigation?.type === 'back_forward'
    if (!isHistoryRestore) return

    try {
      loader.getAnimations({ subtree: true }).forEach((animation) => animation.cancel())
    } catch {
      loader.getAnimations?.().forEach((animation) => animation.cancel())
    }
    loader.classList.remove('is-handoff', 'is-leaving')
    loader.classList.add('is-hidden')
    loader.style.removeProperty('transform')
    loader.style.removeProperty('opacity')
    loader.style.removeProperty('--boot-duration')
    loader.querySelectorAll('.boot-center,.boot-brand,.boot-progress,.boot-status').forEach((element) => {
      element.style.removeProperty('opacity')
      element.style.removeProperty('transform')
    })
    document.documentElement.style.overflow = ''
    document.body?.style.removeProperty('overflow')
    sessionStorage.removeItem('anikaPageHandoff')

    // Re-measure sticky/scroll-driven layouts after Safari/Firefox restore
    // their previous scroll position and compositing layers.
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('anika:page-ready'))
      window.ScrollTrigger?.refresh?.()
    })
  }
  window.addEventListener('pageshow', restoreFromHistory)

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

  // Hold the loader until critical images and explicitly marked media have
  // decoded enough to paint. This keeps scroll-driven layouts settled and
  // prevents below-the-fold video panels from appearing blank on Safari/iOS.
  // The hard cap remains a last-resort escape for failed network requests.
  const ABOUT_PAGE = /(?:^|\/)about\/?$/.test(location.pathname)
  const ASSET_WAIT_CAP = ABOUT_PAGE ? 12000 : 6500
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

    // Keep the lightweight fallback frame ready even if the video request
    // fails and the loader must continue after the media error.
    document.querySelectorAll('video[data-loader-media][poster]').forEach((video) => {
      if (video.poster) sources.add(video.poster)
    })

    const imagePromises = [...sources].map(
      (src) =>
        new Promise((resolve) => {
          const probe = new Image()
          probe.onload = probe.onerror = () => resolve()
          probe.src = src
        }),
    )

    // Videos marked as loader-critical only hold the page until their first
    // frame is decoded. Waiting for an entire long-form MP4 would punish slow
    // connections, while loadeddata is sufficient to prevent Safari from
    // revealing a blank media panel and lets buffering continue underneath.
    const mediaPromises = [...document.querySelectorAll('video[data-loader-media]')]
      .map((video) => new Promise((resolve) => {
        if (video.readyState >= 2) {
          resolve()
          return
        }

        let settled = false
        const done = () => {
          if (settled) return
          settled = true
          video.removeEventListener('loadeddata', done)
          video.removeEventListener('error', done)
          resolve()
        }
        video.addEventListener('loadeddata', done, { once: true })
        video.addEventListener('error', done, { once: true })
        video.preload = 'auto'
        if (video.networkState === 0) video.load()
      }))

    return Promise.all([...imagePromises, ...mediaPromises])
  }

  // This script is intentionally loaded before the application module. On a
  // constrained connection React and its CSS may not exist yet when the boot
  // animation begins, so wait for the real window load event before checking
  // imagery. This prevents the loader from exposing an unstyled/empty root.
  const documentLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve()
    else window.addEventListener('load', resolve, { once: true })
  })

  let assetsSettled = false
  Promise.race([
    documentLoaded.then(criticalAssetsReady),
    new Promise((resolve) => setTimeout(resolve, ASSET_WAIT_CAP)),
  ]).then(() => {
    assetsSettled = true
  })

  const tick = (now) => {
    const progress = Math.min(1, (now - started) / duration)
    const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    // Stay in the "initializing" status while resources are outstanding;
    // "system ready" is reserved for the real content handoff.
    const ceiling = assetsSettled ? 100 : 75
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
    // The loader's first word-scan has already finished on this document.
    // Reset it to the outline state before sliding it back into view; the
    // destination document then performs the single outline-to-white reveal.
    loader.classList.add('is-handoff')
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
