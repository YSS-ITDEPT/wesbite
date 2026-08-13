(() => {
  if (!matchMedia('(pointer: fine)').matches) return

  const trail = document.querySelector('[data-site-cursor]')
  const crosshair = document.querySelector('[data-site-cursor-dot]')
  if (!trail || !crosshair) return

  let pointerX = -100
  let pointerY = -100
  let trailX = -100
  let trailY = -100

  const renderTrail = () => {
    trailX += (pointerX - trailX) * 0.16
    trailY += (pointerY - trailY) * 0.16
    trail.style.transform = `translate(${trailX}px,${trailY}px) translate(-50%,-50%)`
    requestAnimationFrame(renderTrail)
  }

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX
    pointerY = event.clientY
    crosshair.style.transform = `translate(${pointerX}px,${pointerY}px) translate(-50%,-50%)`

    const contrastSurface = event.target.closest('[data-cursor-contrast]')
    trail.classList.toggle('is-on-orange', Boolean(contrastSurface))
    crosshair.classList.toggle('is-on-orange', Boolean(contrastSurface))
  }, { passive: true })

  document.addEventListener('pointerover', (event) => {
    const interactive = event.target.closest('a,button,input,textarea,select,[role="button"]')
    trail.classList.toggle('is-active', Boolean(interactive))
    crosshair.classList.toggle('is-active', Boolean(interactive))
  })

  document.documentElement.addEventListener('mouseleave', () => {
    trail.classList.add('is-hidden')
    crosshair.classList.add('is-hidden')
  })
  document.documentElement.addEventListener('mouseenter', () => {
    trail.classList.remove('is-hidden')
    crosshair.classList.remove('is-hidden')
  })

  requestAnimationFrame(renderTrail)
})()
