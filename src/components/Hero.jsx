import { useCallback, useEffect, useRef, useState } from 'react'
import './Hero.css'

const FRAME_COUNT = 96
const USE_MOBILE_FRAMES =
  typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches
const frameUrl = (i) =>
  `${import.meta.env.BASE_URL}hero-frames-${USE_MOBILE_FRAMES ? 'mobile' : 'webp'}/frame_${String(i).padStart(6, '0')}.webp`

const HEADLINE_LINES = [
  ['Advanced', 'Active'],
  ['Chemical', 'Threat'],
  ['Scanning'],
]
const HEADLINE_WORD_COUNT = HEADLINE_LINES.reduce(
  (count, line) => count + line.length,
  0,
)

const COPY_WORDS =
  'Redefining security with Advanced Active Chemical Threat Scanning (AACTS®) systems, our patented technology provides unmatched accuracy and real-time threat detection. Committed to safeguarding lives and assets, we set new benchmarks for safety and security in critical environments.'.split(
    ' ',
  )

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// Words land in a cool blue and settle into their resting color as they
// reveal — bright white for the headline, softer mist for the copy.
const WORD_FROM = [58, 130, 246]
const HEADLINE_WORD_TO = [244, 248, 250]
const COPY_WORD_TO = [183, 199, 209]

function wordColor(t, to = HEADLINE_WORD_TO) {
  const r = Math.round(WORD_FROM[0] + (to[0] - WORD_FROM[0]) * t)
  const g = Math.round(WORD_FROM[1] + (to[1] - WORD_FROM[1]) * t)
  const b = Math.round(WORD_FROM[2] + (to[2] - WORD_FROM[2]) * t)
  return `rgb(${r}, ${g}, ${b})`
}

// Scroll choreography, expressed as fractions of the hero's total scroll
// distance. Ranges overlap slightly at their edges so one beat is already
// easing out while the next eases in, instead of hard-cutting between them.
//   - video: the longest, slowest beat — the cinematic centerpiece.
//   - headline / copy: quicker word-by-word beats once the video has landed.
const PHASE = {
  video: [0.0, 0.58],
  headline: [0.54, 0.74],
  copy: [0.7, 1.0],
}

function Hero() {
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const desiredFrameRef = useRef(0)
  const [progress, setProgress] = useState(0)

  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current
    const img = imagesRef.current[index]
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return

    const dpr = Math.min(window.devicePixelRatio || 1, USE_MOBILE_FRAMES ? 1.25 : 2)
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    const targetW = Math.round(cw * dpr)
    const targetH = Math.round(ch * dpr)
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
    }

    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const imgRatio = img.naturalWidth / img.naturalHeight
    const canvasRatio = cw / ch
    let dw, dh, dx, dy
    if (canvasRatio > imgRatio) {
      dw = cw
      dh = cw / imgRatio
      dx = 0
      dy = (ch - dh) / 2
    } else {
      dh = ch
      dw = ch * imgRatio
      dx = (cw - dw) / 2
      dy = 0
    }
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [])

  // Preload every frame; redraw the current one as each finishes loading so
  // the scrub feels responsive even before the whole sequence is cached.
  useEffect(() => {
    const imgs = new Array(FRAME_COUNT)
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.onload = () => {
        if (i === desiredFrameRef.current) drawFrame(i)
      }
      img.src = frameUrl(i)
      imgs[i] = img
    }
    imagesRef.current = imgs
    drawFrame(0)
  }, [drawFrame])

  useEffect(() => {
    let ticking = false

    const update = () => {
      ticking = false
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const scrollable = rect.height - window.innerHeight
      const scrolled = clamp(-rect.top, 0, scrollable)
      setProgress(scrollable > 0 ? scrolled / scrollable : 0)
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const videoProgress = clamp(
    (progress - PHASE.video[0]) / (PHASE.video[1] - PHASE.video[0]),
    0,
    1,
  )
  const frameIndex = Math.min(
    FRAME_COUNT - 1,
    Math.floor(videoProgress * FRAME_COUNT),
  )

  useEffect(() => {
    desiredFrameRef.current = frameIndex
    drawFrame(frameIndex)
  }, [frameIndex, drawFrame])

  useEffect(() => {
    const onResize = () => drawFrame(desiredFrameRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [drawFrame])

  const cueOpacity = clamp(1 - progress / 0.08, 0, 1)

  const [headlineStart, headlineEnd] = PHASE.headline
  const headlineWindow = headlineEnd - headlineStart
  const headlineStep = headlineWindow / HEADLINE_WORD_COUNT
  const headlineWordDuration = headlineStep * 1.6

  const [copyStart, copyEnd] = PHASE.copy
  const copyWindow = copyEnd - copyStart
  const copyStep = copyWindow / COPY_WORDS.length
  const copyWordDuration = copyStep * 3.2

  let headlineWordIndex = 0
  const lastWordStart =
    headlineStart + (HEADLINE_WORD_COUNT - 1) * headlineStep * 0.7
  const dividerProgress = clamp(
    (progress - lastWordStart) / headlineWordDuration,
    0,
    1,
  )

  return (
    <section id="home" className="hero" ref={sectionRef}>
      <div className="hero__sticky">
        <div className="hero__media">
          <canvas ref={canvasRef} className="hero__canvas" />
          <div className="hero__overlay" />
        </div>

        <div className="hero__content">
          <h1 className="hero__headline">
            {HEADLINE_LINES.map((line, lineIdx) => (
              <span className="hero__line" key={lineIdx}>
                {line.map((word) => {
                  const start =
                    headlineStart + headlineWordIndex * headlineStep * 0.7
                  const wordProgress = clamp(
                    (progress - start) / headlineWordDuration,
                    0,
                    1,
                  )
                  headlineWordIndex += 1
                  return (
                    <span className="hero__word-wrap" key={word}>
                      <span
                        className="hero__word"
                        style={{
                          opacity: wordProgress,
                          transform: `translateY(${(1 - wordProgress) * 28}px)`,
                          color: wordColor(wordProgress),
                        }}
                      >
                        {word}
                      </span>
                    </span>
                  )
                })}
              </span>
            ))}
          </h1>

          <div
            className="hero__divider"
            style={{ transform: `scaleX(${dividerProgress})` }}
          />

          <div className="hero__copy">
            <p>
              {COPY_WORDS.map((word, i) => {
                const start = copyStart + i * copyStep * 0.55
                const wordProgress = clamp(
                  (progress - start) / copyWordDuration,
                  0,
                  1,
                )
                return (
                  <span className="hero__copy-word-wrap" key={i}>
                    <span
                      className="hero__copy-word"
                      style={{
                        opacity: wordProgress,
                        transform: `translateY(${(1 - wordProgress) * 12}px)`,
                        color: wordColor(wordProgress, COPY_WORD_TO),
                      }}
                    >
                      {word}
                    </span>
                  </span>
                )
              })}
            </p>
          </div>
        </div>

        <div className="hero__cue" style={{ opacity: cueOpacity }}>
          <span>Scroll</span>
          <div className="hero__cue-line" />
        </div>
      </div>
    </section>
  )
}

export default Hero
