import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Cpu,
  Gauge,
  Timer,
  Weight,
  Ruler,
  FlaskConical,
  Bomb,
  Target,
} from 'lucide-react'
import './AactsShowcase.css'

const LOGO_URL = 'https://ik.imagekit.io/jxuol7kjt/logo.png?updatedAt=1765784361412'
const FRAME_COUNT = 121
const USE_MOBILE_FRAMES =
  typeof window !== 'undefined' &&
  // Touch input alone does not mean phone: iPads and Android tablets use a
  // coarse pointer too. The shorter physical screen dimension keeps portrait
  // and landscape phones on the mobile sequence while tablets use desktop.
  (
    window.matchMedia('(max-width: 600px)').matches ||
    (
      window.matchMedia('(pointer: coarse)').matches &&
      Math.min(window.screen.width, window.screen.height) <= 600
    )
  )
const IS_TESTSOL_ROUTE =
  typeof window !== 'undefined' && /(?:^|\/)(?:testsol1?|solutions)\/?$/i.test(window.location.pathname)
const IS_TESTSOL1_ROUTE =
  typeof window !== 'undefined' && /(?:^|\/)(?:testsol1|solutions)\/?$/i.test(window.location.pathname)
const USE_TESTSOL1_PORTRAIT_FRAMES =
  typeof window !== 'undefined' &&
  /(?:^|\/)testsol1\/?$/i.test(window.location.pathname) &&
  USE_MOBILE_FRAMES
const IS_DUAL_TESTSOL_ROUTE =
  typeof window !== 'undefined' && /(?:^|\/)testsol\/?$/i.test(window.location.pathname)
const IS_SAFARI =
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent)
const IS_IOS_DEVICE =
  typeof navigator !== 'undefined' &&
  (
    /iP(?:hone|ad|od)/i.test(navigator.userAgent) ||
    // Since iPadOS 13, Safari may advertise a desktop-style Macintosh user
    // agent. maxTouchPoints distinguishes that iPad identity from an actual
    // Mac so reverse product handoffs use the native iOS end-frame landing.
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  )
const IS_DESKTOP_SAFARI =
  IS_SAFARI &&
  typeof navigator !== 'undefined' &&
  /Macintosh/i.test(navigator.userAgent) &&
  !/Mobile\//i.test(navigator.userAgent)
const SAFARI_MAJOR =
  typeof navigator !== 'undefined'
    ? Number(navigator.userAgent.match(/Version\/(\d+)/)?.[1] || 0)
    : 0
// Big Sur commonly ships Safari 14. Its canvas compositor softens the baked
// sparkle/Veo mark beyond the source-pixel bounds used by newer WebKit, so the
// normal 82px proportional cover can leave a small lower-right edge exposed.
// Keep this optical correction isolated from current Safari, iOS and Windows.
const IS_BIG_SUR_SAFARI =
  IS_DESKTOP_SAFARI &&
  Boolean(
    (SAFARI_MAJOR && SAFARI_MAJOR <= 14) ||
    (typeof CSS !== 'undefined' && !CSS.supports('aspect-ratio', '1 / 1')),
  )
function needsStaticSafariFallback() {
  if (!IS_SAFARI) return false
  const safariMajor = Number(navigator.userAgent.match(/Version\/(\d+)/)?.[1] || 0)
  // Safari 17 is the final Safari generation supported by macOS Monterey.
  // Its sticky-canvas compositor remains unreliable even on higher-core Macs.
  if (safariMajor && safariMajor <= 17) return true
  if ((navigator.hardwareConcurrency || 8) <= 4) return true

  try {
    const probe = document.createElement('canvas')
    const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl')
    if (!gl) return true
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(
      debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
    )
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return /intel|amd radeon/i.test(renderer)
  } catch {
    return true
  }
}
const USE_STATIC_SAFARI_FALLBACK =
  typeof document !== 'undefined' && !IS_IOS_DEVICE && needsStaticSafariFallback()
const USE_FIXED_FRAME_SAFARI =
  IS_DESKTOP_SAFARI && Boolean(SAFARI_MAJOR && SAFARI_MAJOR <= 18)
const USE_SAFARI_GESTURE_FALLBACK =
  USE_STATIC_SAFARI_FALLBACK || USE_FIXED_FRAME_SAFARI
// Native multi-viewport sticky runways are unstable when iPhone Safari grows
// and collapses its browser chrome during a finger gesture. Keep the document
// stationary and map touch distance directly to frame progress instead.
// The promoted /solutions/ experience uses the native sticky-scroll
// architecture on iPhone. The archived /sol/ route retains the former gesture
// fallback implementation.
const USE_IOS_TOUCH_SCRUBBER = IS_IOS_DEVICE && !IS_TESTSOL_ROUTE
const USE_PROMOTED_IOS_REVERSE_LANDING = IS_TESTSOL1_ROUTE && IS_IOS_DEVICE
// Five intentional beats keep the iPhone journey readable while the canvas
// eases through the decoded anchor frames between each beat. This retains the
// predictable product handoff but removes the old four-frame visual jump.
const IOS_PROGRESS_STEPS = [0, 0.24, 0.5, 0.76, 1]
const frameUrlFor = (directory, i) =>
  `${import.meta.env.BASE_URL}${directory}-${USE_TESTSOL1_PORTRAIT_FRAMES ? 'portrait' : USE_MOBILE_FRAMES ? 'mobile' : 'webp'}/frame_${String(i).padStart(6, '0')}.webp`
const canvasDpr = () =>
  // Source frames are 1280x720. A 2x Retina backing store can exceed five
  // million painted pixels per scroll tick without adding source detail.
  Math.min(window.devicePixelRatio || 1, USE_MOBILE_FRAMES || IS_SAFARI ? 1 : 1.25)
const frameUrl = (i) => frameUrlFor('aacts-frames', i)
const SAMPLE_CARD_START_FRAME = 35
const SAMPLE_CARD_FRAME_COUNT = 121
const sampleCardFrameUrl = (i) => frameUrlFor('sample-card-frames', i)
const HANDHELD_START_FRAME = 35
const HANDHELD_FRAME_COUNT = 121
const handheldFrameUrl = (i) => frameUrlFor('handheld-frames', i)
const HIGH_VOLUME_START_FRAME = 45
const HIGH_VOLUME_FRAME_COUNT = 121
const highVolumeFrameUrl = (i) => frameUrlFor('high-volume-frames', i)
const CLEANER_START_FRAME = 36
const CLEANER_FRAME_COUNT = 121
const cleanerFrameUrl = (i) => frameUrlFor('card-cleaner-frames', i)

// Product stages unmount when their tab changes. Safari can otherwise create
// a fresh Image object for the next stage and briefly expose the canvas's
// default 300x150 bitmap while that first frame decodes. Keep decoded images
// shared across handoffs and warm the next product's opening frames.
const frameImageCache = new Map()
const MAX_SHARED_FRAMES = 48
function getCachedFrame(url, priority = 'auto', retain = false) {
  let img = frameImageCache.get(url)
  if (img) return img
  img = new Image()
  img.decoding = 'async'
  if ('fetchPriority' in img) img.fetchPriority = priority
  img.src = url
  if (retain) {
    frameImageCache.set(url, img)
    while (frameImageCache.size > MAX_SHARED_FRAMES) {
      frameImageCache.delete(frameImageCache.keys().next().value)
    }
  }
  return img
}

const TABS = [
  { id: 'aacts3000', label: 'AACTS 3000' },
  {
    id: 'card',
    label: 'Aspiration Sample Card',
    img: 'https://ik.imagekit.io/jxuol7kjt/SAMPLECARD1.png?updatedAt=1725873384833',
  },
  {
    id: 'handheld',
    label: 'Handheld Sampling System',
    img: 'https://ik.imagekit.io/7oaqyvwnm/20240920_201159_938-removebg-preview.png?updatedAt=1726844228667',
  },
  {
    id: 'sampler',
    label: 'High Volume Sampler',
    img: 'https://ik.imagekit.io/d9wt8plt0/hh.png?updatedAt=1727107551161',
  },
  {
    id: 'cleaner',
    label: 'Aspiration Card Cleaner',
    img: 'https://ik.imagekit.io/jxuol7kjt/CLEANER.png?updatedAt=1725873349673',
  },
]

const SPECS = [
  {
    icon: Cpu,
    label: 'Technology',
    value: 'AACTS TRU-RAD AIMS',
  },
  { icon: Gauge, label: 'Sensitivity', value: 'Nanogram to picogram levels' },
  {
    icon: Timer,
    label: 'Analysis Time',
    value: '20 seconds',
  },
  { icon: Weight, label: 'Weight', value: '17 kg (37.5 lbs)' },
  { icon: Ruler, label: 'Dimensions', value: '40cm(L) x 39cm(W) x 34cm(H)' },
  {
    icon: FlaskConical,
    label: 'Narcotics Detected',
    value: 'Heroin, Fentanyl, Cocaine, MDMA, Marijuana, and others',
  },
  {
    icon: Bomb,
    label: 'Explosive Detected',
    value: 'NG, AN, DNT, TNT, RDX, PETN, TATP, HMTD, and others',
  },
  {
    icon: Target,
    label: 'Target Analyte',
    value: 'The machine can be updated for any target analyte.',
  },
]

const SAMPLE_CARD_DETAILS = [
  {
    title: 'Material',
    text: 'Fine wire mesh treated with patented SPME (Solid Phase Microextraction) for effective adsorption.',
  },
  {
    title: 'Design',
    text: 'Heat-resistant handle molded to the mesh for easy handling.',
  },
  {
    title: 'Reusability',
    text: 'Can be cleaned and reused after each sampling cycle.',
  },
  {
    title: 'Sample Capture',
    text: 'Capable of adsorbing microscopic airborne particles and vapor sample.',
  },
]

const HANDHELD_SPECS = [
  {
    title: 'Power',
    text: '18V quick-swappable lithium-ion battery with 1-hour continuous use, up to 80 samples.',
  },
  {
    title: 'Sampling Time',
    text: '10 seconds to 2 minutes, user-controlled.',
  },
  {
    title: 'Flow Rate',
    text: 'Aspiration Card: 150 L/min.',
  },
  {
    title: 'Weight',
    text: '4.5 lbs with battery, 3.0 lbs without battery.',
  },
  {
    title: 'Dimensions',
    text: '19.9cm (L) x 11.3cm (W) x 22.1cm (H).',
  },
  {
    title: 'Operating Conditions',
    text: '-20C to +50C, RH > 9, non-condensing.',
  },
]

const HIGH_VOLUME_SPECS = [
  {
    title: 'Electrical Configuration',
    text: 'HVS-1000: 110VAC, 11A max, 60Hz. HVS-1000E: 220VAC, 10A max, 50Hz.',
  },
  {
    title: 'Dimensions',
    text: '30.5 cm (L) x 36 cm (W) x 26 cm (H) for easy portability.',
  },
  {
    title: 'Weight',
    text: '9.5 kg, portable and easy to handle for field operatives.',
  },
  {
    title: 'Fuse Type',
    text: '12 amps for protection against electrical surges.',
  },
  {
    title: 'Hood Dimensions',
    text: '39 cm (L) x 28 cm (W) x 15 cm (H), designed to cover large areas efficiently.',
  },
  {
    title: 'Operating Temperature',
    text: '0C to 40C, < 95% relative humidity, non-condensing.',
  },
]

const CLEANER_SPECS = [
  {
    title: 'Electrical Requirements',
    text: '24V DC, 5A max ensures efficient energy consumption for varied power environments.',
  },
  {
    title: 'Power Supply',
    text: '100-240V AC, 2.5A, 50/60Hz, 150W max for flexible global operation.',
  },
  {
    title: 'Cleaning Cycle Time',
    text: 'A quick 5-minute cycle decontaminates cards for near-immediate reuse.',
  },
  {
    title: 'Operating Temperature',
    text: '0C to 40C for effective operation across a wide range of conditions.',
  },
  {
    title: 'Weight',
    text: 'Lightweight at 6.5 lbs (2.95 kg) for easy portability.',
  },
  {
    title: 'Dimensions',
    text: '27.5cm (L) x 25.5cm (W) x 12.5cm (H), compact for convenient deployment.',
  },
]

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function contentState(opacity) {
  return {
    opacity,
    visibility: opacity > 0.01 ? 'visible' : 'hidden',
  }
}

function ProductFramePoster({ startSrc, endSrc, activeSrc, progress }) {
  if (USE_FIXED_FRAME_SAFARI) {
    return (
      <img
        className="product-frame-poster product-frame-poster--active"
        src={activeSrc}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
    )
  }

  return (
    <>
      <img
        className="product-frame-poster product-frame-poster--start"
        src={startSrc}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      {USE_STATIC_SAFARI_FALLBACK && (
        <img
          className="product-frame-poster product-frame-poster--end"
          src={endSrc}
          alt=""
          aria-hidden="true"
          style={{ opacity: smoothstep(0.44, 0.58, progress) }}
        />
      )}
    </>
  )
}

function instantScrollTo(top) {
  const root = document.documentElement
  const previous = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  window.scrollTo({ top, left: 0, behavior: 'auto' })
  root.style.scrollBehavior = previous
}

// On phones both content panels occupy the same readable column. Give the
// opening copy and the specification copy separate scroll phases so they can
// never sit on top of one another. Desktop keeps its established timing.
function mobileContentPhases(progress, { switchAt = 0.52 } = {}) {
  /* Both panels occupy the same compact mobile reading band. A cross-fade
     makes two full text layouts overlap, while separated fades create a blank
     viewport between them. Use a deterministic hand-off so one complete panel
     is always readable on iOS/WebKit and low-powered mobile browsers. */
  return progress < switchAt
    ? { intro: 1, detail: 0 }
    : { intro: 0, detail: 1 }
}

// The source frames are 1280x720 with a decorative "sparkle" watermark baked
// in. The canvas paints frames with "cover" scaling, so the watermark's
// on-screen position shifts with the viewport's aspect ratio — the brand card
// that masks it must be placed with the same cover math, not a fixed viewport
// offset, or it only lines up at one window size (which is exactly why the
// card drifted off between the laptop and other desktops).
const FRAME_RATIO = 1280 / 720
// Sparkle watermark centre, as a fraction of the frame.
const SPARKLE_X = 0.905
const SPARKLE_Y = 0.833

// Desktop keeps the established cover composition, filling its box
// completely and cropping whatever does not fit. The archived /sol route's
// portrait phone layout uses a contain fit instead so the complete frame
// stays visible, letterboxed, inside its small media band.
//
// coverFit opts the promoted /solutions mobile composition into the same
// edge-to-edge cover behaviour as desktop. Its framed panel's aspect ratio
// (roughly 1.79:1) sits close to the source frame's own 16:9, so filling the
// panel completely crops only a sliver off one axis — enough to remove every
// letterboxed margin without meaningfully cropping the subject.
function frameFit(cw, ch, frameRatio = FRAME_RATIO, fullStageMobile = false, coverFit = false) {
  const boxRatio = cw / ch

  if (USE_MOBILE_FRAMES && !fullStageMobile && !coverFit) {
    // The canvas itself is now a dedicated bottom media bay on mobile, so fit
    // the complete 16:9 render inside that bay rather than positioning a tiny
    // frame within the full sticky viewport.
    const drawH = Math.min((cw * 0.94) / frameRatio, ch * 0.9)
    const drawW = drawH * frameRatio
    return {
      drawW,
      drawH,
      offsetX: (cw - drawW) / 2,
      offsetY: (ch - drawH) / 2,
    }
  }

  if (boxRatio > frameRatio) {
    const drawW = cw
    const drawH = cw / frameRatio
    return { drawW, drawH, offsetX: 0, offsetY: (ch - drawH) / 2 }
  }
  const drawH = ch
  const drawW = ch * frameRatio
  return { drawW, drawH, offsetX: (cw - drawW) / 2, offsetY: 0 }
}

// Portrait test composition: keep the complete 16:9 frame sharp in a lower
// safe band while a second cover canvas fills the viewport behind it.
function foregroundFrameFit(cw, ch, frameRatio = FRAME_RATIO) {
  const drawW = Math.min(cw * 0.94, ch * 0.46 * frameRatio)
  const drawH = drawW / frameRatio
  const safeBottom = Math.max(64, ch * 0.085)
  return {
    drawW,
    drawH,
    offsetX: (cw - drawW) / 2,
    offsetY: ch - drawH - safeBottom,
  }
}

function VideoBrandOverlay({ variant = 'default' }) {
  const cardRef = useRef(null)

  useLayoutEffect(() => {
    const card = cardRef.current
    const stage = card?.offsetParent
    if (!card || !stage) return

    const place = () => {
      const foregroundCanvas =
        stage.querySelector('.product-frame-foreground') ||
        (IS_TESTSOL_ROUTE ? stage.querySelector('canvas') : null)
      if (IS_DUAL_TESTSOL_ROUTE && foregroundCanvas) {
        const cw = foregroundCanvas.clientWidth || stage.clientWidth
        const ch = foregroundCanvas.clientHeight || stage.clientHeight
        if (!cw || !ch) return
        const { drawW, drawH, offsetX, offsetY } = foregroundFrameFit(cw, ch)
        const size = card.offsetWidth || Math.round(Math.max(52, cw * 0.14))
        card.style.left = `${Math.round(offsetX + drawW * SPARKLE_X - size / 2)}px`
        card.style.top = `${Math.round(offsetY + drawH * SPARKLE_Y - size / 2)}px`
        return
      }

      const canvas = stage.querySelector('canvas')
      const canvasRect = canvas?.getBoundingClientRect()
      const stageRect = stage.getBoundingClientRect()
      const cw = canvas?.clientWidth || stage.clientWidth
      const ch = canvas?.clientHeight || stage.clientHeight
      if (!cw || !ch) return
      // Viewport rectangles are unstable while iPhone Safari collapses its
      // browser chrome and the sticky header settles. Resolve the canvas
      // position through its offset-parent chain so the card remains anchored
      // to the media bay rather than to an earlier viewport position.
      let originX = 0
      let originY = 0
      let offsetNode = canvas
      const useStableDesktopOrigin =
        IS_TESTSOL1_ROUTE && window.matchMedia('(min-width: 861px)').matches
      if (useStableDesktopOrigin) {
        // The single-layer desktop canvas fills its stage. Safari can report a
        // temporary body offsetParent while sticky positioning initializes,
        // so do not walk that transient ancestor chain here.
        originX = canvas.offsetLeft || 0
        originY = canvas.offsetTop || 0
      } else {
        while (offsetNode && offsetNode !== stage) {
          originX += offsetNode.offsetLeft || 0
          originY += offsetNode.offsetTop || 0
          offsetNode = offsetNode.offsetParent
        }
        if (offsetNode !== stage && canvasRect) {
          originX = canvasRect.left - stageRect.left
          originY = canvasRect.top - stageRect.top
        }
      }

      // IS_DUAL_TESTSOL_ROUTE (/testsol) already returned above, so this only
      // runs for /solutions and /testsol1. On an actual mobile viewport those
      // routes now frame the product image in its own small panel (see the
      // mobile composition in the CSS) rather than a full-bleed cover crop
      // filling the whole stage, so the badge needs that panel's own fit
      // rectangle — otherwise it is still placed against the old full-stage
      // cover-fit math and lands off-screen. Desktop keeps the existing
      // cover-fit badge placement unchanged.
      const { drawW, drawH, offsetX, offsetY } = frameFit(
        cw,
        ch,
        FRAME_RATIO,
        IS_TESTSOL_ROUTE && !USE_MOBILE_FRAMES,
        IS_TESTSOL_ROUTE && USE_MOBILE_FRAMES,
      )

      // Branded card centred on the sparkle. 82px was tuned against a
      // 1280-wide render, so scale it with the frame so it covers the
      // watermark by the same proportion at every viewport.
      // The downscaled sparkle stays optically larger than a perfectly linear
      // card scale because of its soft glow. Keep a small mobile floor so none
      // of that glow can remain visible around the brand card.
      const size = Math.max(
        USE_MOBILE_FRAMES ? (IS_IOS_DEVICE ? 40 : 32) : 0,
        Math.round(82 * (drawW / 1280)),
      )
      card.style.width = `${size}px`
      // Safari 14 / macOS Big Sur does not support CSS aspect-ratio. Setting
      // both dimensions keeps the mask square there; on newer browsers this
      // resolves to the exact same size they already render.
      card.style.height = `${size}px`
      card.style.left = `${Math.round(originX + offsetX + drawW * SPARKLE_X - size / 2)}px`
      card.style.top = `${Math.round(originY + offsetY + drawH * SPARKLE_Y - size / 2)}px`
    }

    place()
    const ro = new ResizeObserver(place)
    ro.observe(stage)
    const canvas = stage.querySelector('canvas')
    if (canvas) ro.observe(canvas)
    window.addEventListener('resize', place)
    window.visualViewport?.addEventListener('resize', place)
    const settleFrame = window.requestAnimationFrame(place)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('resize', place)
      window.cancelAnimationFrame(settleFrame)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={`video-brand-overlay video-brand-overlay--${variant}`}
      aria-hidden="true"
    >
      <img src={LOGO_URL} alt="" />
    </div>
  )
}

// Phone-only readout chrome for the framed product image (see the mobile
// composition in AactsShowcase.css). Built from the same instrument-panel
// language already established elsewhere on the site — corner brackets, a
// monospace code/counter pair, a live fill track — rather than a generic
// caption. Purely decorative: every number here already exists as visible
// copy or scroll position, so it is hidden from assistive tech.
function MobileFrameHud({ code, progress }) {
  const percent = Math.round(clamp(progress, 0, 1) * 100)
  return (
    <div className="aacts__frame-hud" aria-hidden="true">
      <i className="aacts__frame-hud-bracket aacts__frame-hud-bracket--tl" />
      <i className="aacts__frame-hud-bracket aacts__frame-hud-bracket--tr" />
      <i className="aacts__frame-hud-bracket aacts__frame-hud-bracket--bl" />
      <i className="aacts__frame-hud-bracket aacts__frame-hud-bracket--br" />
      <div className="aacts__frame-hud-top">
        <span className="aacts__frame-hud-code">{code}</span>
        <span className="aacts__frame-hud-readout">
          <i className="aacts__frame-hud-track">
            <b style={{ width: `${percent}%` }} />
          </i>
          <strong>{String(percent).padStart(3, '0')}</strong>
        </span>
      </div>
    </div>
  )
}

// Frame playback is deliberately non-linear: it lingers on the opening and
// closing beats (device settled right, then settled left) and races through
// the cinematic pan/zoom in between — slow, fast, slow.
const SEGMENTS = [
  [0, 0.18, 0, 20],
  [0.18, 0.55, 20, 96],
  [0.55, 1, 96, FRAME_COUNT - 1],
]

function frameForProgress(p) {
  for (const [s0, s1, f0, f1] of SEGMENTS) {
    if (p <= s1) {
      const local = s1 === s0 ? 0 : (p - s0) / (s1 - s0)
      return Math.round(f0 + (f1 - f0) * clamp(local, 0, 1))
    }
  }
  return FRAME_COUNT - 1
}

function sampleCardFrameForProgress(p) {
  const segments = [
    [0, 0.22, 35, 50],
    [0.22, 0.62, 50, 92],
    [0.62, 1, 92, 120],
  ]

  for (const [s0, s1, f0, f1] of segments) {
    if (p <= s1) {
      const local = s1 === s0 ? 0 : (p - s0) / (s1 - s0)
      return Math.round(f0 + (f1 - f0) * clamp(local, 0, 1))
    }
  }
  return SAMPLE_CARD_FRAME_COUNT - 1
}

function handheldFrameForProgress(p) {
  const segments = [
    [0, 0.2, 35, 50],
    [0.2, 0.6, 50, 92],
    [0.6, 1, 92, 120],
  ]

  for (const [s0, s1, f0, f1] of segments) {
    if (p <= s1) {
      const local = s1 === s0 ? 0 : (p - s0) / (s1 - s0)
      return Math.round(f0 + (f1 - f0) * clamp(local, 0, 1))
    }
  }
  return HANDHELD_FRAME_COUNT - 1
}

function highVolumeFrameForProgress(p) {
  const segments = [
    [0, 0.2, 45, 58],
    [0.2, 0.6, 58, 92],
    [0.6, 1, 92, 120],
  ]

  for (const [s0, s1, f0, f1] of segments) {
    if (p <= s1) {
      const local = s1 === s0 ? 0 : (p - s0) / (s1 - s0)
      return Math.round(f0 + (f1 - f0) * clamp(local, 0, 1))
    }
  }
  return HIGH_VOLUME_FRAME_COUNT - 1
}

function cleanerFrameForProgress(p) {
  const segments = [
    [0, 0.2, 36, 52],
    [0.2, 0.62, 52, 92],
    [0.62, 1, 92, 120],
  ]

  for (const [s0, s1, f0, f1] of segments) {
    if (p <= s1) {
      const local = s1 === s0 ? 0 : (p - s0) / (s1 - s0)
      return Math.round(f0 + (f1 - f0) * clamp(local, 0, 1))
    }
  }
  return CLEANER_FRAME_COUNT - 1
}

// Drives one scroll-scrubbed frame-sequence "stage": preloads frames,
// tracks scroll progress without forcing layout on every tick, paints the
// current frame to a canvas whose CSS size is cached via ResizeObserver
// (not re-read on every draw), and fires forward/backward handoffs once the
// user has genuinely scrolled past the section's start/end.
//
// Perf notes (this is the hot path — it runs on every scroll frame):
//  - `progress` itself is NOT React state. Only derived, low-frequency
//    values (frame index, opacity buckets) go through setState, and only
//    when they actually change, so scrolling doesn't force a full
//    component re-render on every pixel.
//  - Canvas CSS size is measured once (mount) and on resize/orientation
//    change via ResizeObserver, never inside the scroll handler — reading
//    clientWidth/clientHeight there would force a synchronous layout on
//    every scroll tick.
//  - drawImage is skipped entirely if the target frame index hasn't
//    changed since the last paint.
function useFrameScrubber({
  frameCount,
  startFrame = 0,
  frameUrl: frameUrlFn,
  frameForProgress: frameForProgressFn,
  onComplete,
  onBack,
  suppressInitialForward = false,
  fullStageMobile = false,
  dualLayerMobile = false,
  coverFit = false,
}) {
  const initialProgress =
    (USE_SAFARI_GESTURE_FALLBACK || USE_IOS_TOUCH_SCRUBBER || USE_PROMOTED_IOS_REVERSE_LANDING) && suppressInitialForward
    ? (USE_FIXED_FRAME_SAFARI || USE_IOS_TOUCH_SCRUBBER || USE_PROMOTED_IOS_REVERSE_LANDING ? 1 : 0.7)
    : 0
  const initialFrame = frameForProgressFn(initialProgress)
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const imagesRef = useRef([])
  const sizeRef = useRef({ cw: 0, ch: 0, dpr: 1 })
  const lastDrawnFrameRef = useRef(-1)
  const backgroundDrawnFrameRef = useRef(-1)
  const lastRequestedFrameRef = useRef(initialFrame)
  const lastProgressRef = useRef(initialProgress)
  const requestFrameRef = useRef(() => {})
  const armedRef = useRef(false)
  const completedRef = useRef(false)
  const backedRef = useRef(false)
  const mountedAtRef = useRef(0)
  const rafRef = useRef(0)
  const gestureAnimationRef = useRef(0)
  const reverseLandingPendingRef = useRef(
    USE_PROMOTED_IOS_REVERSE_LANDING && suppressInitialForward,
  )

  const [frameIndex, setFrameIndex] = useState(initialFrame)
  const [progress, setProgress] = useState(initialProgress)
  const [fixedReleased, setFixedReleased] = useState(false)

  const drawFrame = useCallback((index) => {
    if (index === lastDrawnFrameRef.current) return
    const canvas = canvasRef.current
    let img = imagesRef.current[index]
    let drawnIndex = index
    if (!canvas) return
    if (USE_SAFARI_GESTURE_FALLBACK) {
      canvas.dataset.frameIndex = String(index)
      return
    }

    // Fast Safari trackpad scrolling can request a later frame before its
    // ordered batch has decoded. Paint the closest ready frame instead of
    // leaving a blank/default-sized canvas while that exact frame catches up.
    if (!img || !img.complete || img.naturalWidth === 0) {
      const images = imagesRef.current
      for (let distance = 1; distance < images.length; distance++) {
        const before = images[index - distance]
        const after = images[index + distance]
        if (before?.complete && before.naturalWidth > 0) {
          img = before
          drawnIndex = index - distance
          break
        }
        if (after?.complete && after.naturalWidth > 0) {
          img = after
          drawnIndex = index + distance
          break
        }
      }
    }
    if (!img || !img.complete || img.naturalWidth === 0) return

    const { cw, ch, dpr } = sizeRef.current
    if (cw === 0 || ch === 0) return

    const targetW = Math.round(cw * dpr)
    const targetH = Math.round(ch * dpr)
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
      backgroundDrawnFrameRef.current = -1
    }

    let ctx = ctxRef.current
    if (!ctx) {
      ctx = canvas.getContext('2d')
      ctxRef.current = ctx
    }
    const imgRatio = img.naturalWidth / img.naturalHeight
    if (!dualLayerMobile || backgroundDrawnFrameRef.current !== drawnIndex) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const {
      drawW: dw,
      drawH: dh,
      offsetX: dx,
      offsetY: dy,
    } = frameFit(cw, ch, imgRatio, fullStageMobile, coverFit)
    ctx.clearRect(0, 0, cw, ch)
    if (dualLayerMobile) {
      const ambientScale = 1.14
      const ambientW = dw * ambientScale
      const ambientH = dh * ambientScale
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.filter = 'blur(22px) saturate(68%) brightness(54%)'
      ctx.drawImage(
        img,
        dx - (ambientW - dw) / 2,
        dy - (ambientH - dh) / 2,
        ambientW,
        ambientH,
      )
      ctx.restore()
    } else {
      ctx.drawImage(img, dx, dy, dw, dh)
    }

    // Paint out the generator's baked-in "Veo" text in the frame's extreme
    // bottom-right corner. The text overlaps a bright horizontal floor-
    // reflection line, so copying background from above would erase that line
    // and leave a dark gap. Instead copy an equally sized clean block from
    // immediately to the LEFT of the text (same rows — identical floor line,
    // no text) and paint it over the text. That preserves the floor line and
    // matches the frame's own background at any brightness. All coordinates
    // are fractions of the source image, mapped through the same fit rectangle
    // as the frame.
    const nW = img.naturalWidth
    const nH = img.naturalHeight
    const boxL = 0.94 * nW // text region left, including compressed glow
    const boxT = 0.92 * nH // text region top, including compressed glow
    const boxW = nW - boxL // to the frame's right edge
    const boxH = nH - boxT // to the frame's bottom edge
    const toCanvasX = (sx) => dx + (sx / nW) * dw
    const toCanvasY = (sy) => dy + (sy / nH) * dh
    // Copy the clean block just left of the text over it. The horizontal copy
    // keeps the bright floor-reflection line continuous (a vertical copy would
    // erase it and leave a dark gap). The inner boundary lands in soft, mostly
    // uniform smoke, so it isn't perceptible at normal viewing.
    if (!dualLayerMobile) {
      ctx.drawImage(
        img,
        boxL - boxW, boxT, boxW, boxH,
        toCanvasX(boxL), toCanvasY(boxT), (boxW / nW) * dw, (boxH / nH) * dh,
      )
    }
      if (dualLayerMobile) {
        const foregroundFit = foregroundFrameFit(cw, ch, imgRatio)
        ctx.drawImage(
          img,
          foregroundFit.offsetX,
          foregroundFit.offsetY,
          foregroundFit.drawW,
          foregroundFit.drawH,
        )
        ctx.drawImage(
          img,
          boxL - boxW, boxT, boxW, boxH,
          foregroundFit.offsetX + (boxL / nW) * foregroundFit.drawW,
          foregroundFit.offsetY + (boxT / nH) * foregroundFit.drawH,
          (boxW / nW) * foregroundFit.drawW,
          (boxH / nH) * foregroundFit.drawH,
        )
      }
      backgroundDrawnFrameRef.current = drawnIndex
      canvas.dataset.frameIndex = String(drawnIndex)
    }

    lastDrawnFrameRef.current = drawnIndex
  }, [dualLayerMobile, fullStageMobile, coverFit])

  // Cache the canvas's CSS box size once and on resize, instead of reading
  // clientWidth/clientHeight (a forced layout) inside the scroll handler.
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const measure = () => {
      sizeRef.current = {
        cw: canvas.clientWidth,
        ch: canvas.clientHeight,
        dpr: canvasDpr(),
      }
      // Size the backing store immediately. Previously this happened only
      // after an image was ready, exposing Safari's default 300x150 canvas
      // during rapid product handoffs.
      const { cw, ch, dpr } = sizeRef.current
      const targetW = Math.round(cw * dpr)
      const targetH = Math.round(ch * dpr)
      if (canvas.width !== targetW) canvas.width = targetW
      if (canvas.height !== targetH) canvas.height = targetH
      backgroundDrawnFrameRef.current = -1
      lastDrawnFrameRef.current = -1
      drawFrame(lastRequestedFrameRef.current)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    mountedAtRef.current = Date.now()
  }, [])

  // Loading all ~120 frames at once floods the browser's connection pool
  // with no priority order, so late frames can still be mid-flight when a
  // fast scroll reaches them — the canvas then freezes on the last-ready
  // frame until they catch up, which reads as stutter near the end of the
  // sequence. Loading in small ordered batches guarantees earlier frames
  // finish before later ones are even requested, while still redrawing
  // immediately the moment the frame currently on screen becomes ready.
  useEffect(() => {
    let cancelled = false
    const imgs = new Array(frameCount)
    const inFlight = new Map()
    const BATCH_SIZE = 6

    if (USE_STATIC_SAFARI_FALLBACK && !USE_FIXED_FRAME_SAFARI) {
      imagesRef.current = imgs
      requestFrameRef.current = () => {}
      return () => {
        cancelled = true
        requestFrameRef.current = () => {}
      }
    }

    const loadOne = (i, priority = 'auto') => {
      if (i < startFrame || i >= frameCount) return Promise.resolve()
      if (imgs[i]?.complete && imgs[i].naturalWidth > 0) return Promise.resolve()
      if (inFlight.has(i)) return inFlight.get(i)
      const promise = new Promise((resolve) => {
        const img = getCachedFrame(
          frameUrlFn(i),
          priority,
          priority === 'high',
        )
        let settled = false
        const done = () => {
          if (settled) return
          settled = true
          inFlight.delete(i)
          if (!cancelled && i === lastRequestedFrameRef.current) drawFrame(i)
          resolve()
        }
        imgs[i] = img
        const decoded = () => {
          // Older WebKit can keep decode() promises pending while the canvas
          // is inside a sticky compositing layer. A completed image is already
          // safe for drawImage, so do not make Safari wait on that promise.
          if (!IS_SAFARI && typeof img.decode === 'function') img.decode().catch(() => {}).finally(done)
          else done()
        }
        if (img.complete && img.naturalWidth > 0) {
          decoded()
        } else {
          img.addEventListener('load', decoded, { once: true })
          img.addEventListener('error', done, { once: true })
        }
      })
      inFlight.set(i, promise)
      return promise
    }

    requestFrameRef.current = (i) => {
      loadOne(i, 'high')
      if (IS_SAFARI) return
      // Decode immediate neighbours too; scroll normally advances into one of
      // them on the next frame, so Safari rarely has to wait twice.
      loadOne(i - 1, 'high')
      loadOne(i + 1, 'high')
    }

    async function loadAll() {
      if (USE_IOS_TOUCH_SCRUBBER) {
        // Decode every sixth source frame rather than only the five content
        // checkpoints. The gesture animation can now paint roughly 15–21
        // distinct frames without loading the full 121-frame sequence into
        // iPhone memory.
        const checkpointFrames = []
        for (let frame = startFrame; frame < frameCount; frame += 6) {
          checkpointFrames.push(frame)
        }
        if (checkpointFrames.at(-1) !== frameCount - 1) {
          checkpointFrames.push(frameCount - 1)
        }
        await Promise.all(
          checkpointFrames.map((frame) => loadOne(frame, 'high')),
        )
        return
      }

      // Cover the entire timeline first. A user can now jump anywhere and the
      // nearest decoded frame is at most six frames away.
      const anchorStep = IS_TESTSOL_ROUTE && IS_IOS_DEVICE ? 3 : 6
      const anchors = []
      for (let i = startFrame; i < frameCount; i += anchorStep) anchors.push(i)
      if (anchors.at(-1) !== frameCount - 1) anchors.push(frameCount - 1)
      for (let start = 0; start < anchors.length; start += BATCH_SIZE) {
        if (cancelled) return
        const batch = anchors.slice(start, start + BATCH_SIZE)
          .map((i) => loadOne(i, start === 0 ? 'high' : 'auto'))
        await Promise.all(batch)
      }

      // Safari/WebKit retains decoded WebP surfaces aggressively. The sparse
      // timeline plus on-demand frames keeps scrolling fluid on modern Macs
      // and avoids canvas-process memory exhaustion on Monterey hardware.
      if (IS_SAFARI) return

      // Fill the intermediate frames after timeline coverage is available.
      const anchorSet = new Set(anchors)
      const remaining = []
      for (let i = startFrame; i < frameCount; i++) {
        if (!anchorSet.has(i)) remaining.push(i)
      }
      for (let start = 0; start < remaining.length; start += BATCH_SIZE) {
        if (cancelled) return
        await Promise.all(
          remaining.slice(start, start + BATCH_SIZE).map((i) => loadOne(i)),
        )
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    imagesRef.current = imgs
    loadAll()

    return () => {
      cancelled = true
      requestFrameRef.current = () => {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, startFrame, frameUrlFn, drawFrame])

  useEffect(() => {
    let ticking = false
    let stateRafId = 0
    let pendingProgress = null
    let backwardWheelIntent = 0
    let forwardWheelIntent = 0
    let backwardIntentTimer = 0
    let touchStartY = null
    let touchGestureEligible = false
    let iosGestureHandled = false
    let iosStageReleased = false
    let touchReady = false
    let fallbackPhase = initialProgress >= 0.5 ? 1 : 0
    let virtualProgress = initialProgress
    let fixedStageReleased = false
    const gestureHandoffDelay = IS_TESTSOL_ROUTE && USE_MOBILE_FRAMES
      ? 180
      : USE_IOS_TOUCH_SCRUBBER
      ? 180
      : USE_FIXED_FRAME_SAFARI
      ? 220
      : (USE_STATIC_SAFARI_FALLBACK ? 420 : 900)
    const minimumStageAge = IS_TESTSOL_ROUTE && USE_MOBILE_FRAMES
      ? 220
      : USE_IOS_TOUCH_SCRUBBER
      ? 180
      : USE_FIXED_FRAME_SAFARI
      ? 220
      : (USE_STATIC_SAFARI_FALLBACK ? 380 : 650)
    let wheelReadyAt = performance.now() + gestureHandoffDelay
    const touchReadyTimer = window.setTimeout(() => {
      touchReady = true
    }, gestureHandoffDelay)

    const isAtStageStart = () => {
      const rect = sectionRef.current?.getBoundingClientRect()
      return Boolean(
        rect &&
        (
          USE_SAFARI_GESTURE_FALLBACK ||
          USE_IOS_TOUCH_SCRUBBER ||
          // Mobile browser chrome can leave the sticky runway a few pixels
          // inside its first step even though the user is visually at the top.
          lastProgressRef.current <= 0.04
        ) &&
        rect.top > -80 &&
        rect.top < window.innerHeight * 0.3
      )
    }

    const showFallbackPhase = (phase) => {
      fallbackPhase = phase
      const nextProgress = phase === 0 ? 0 : 0.7
      const nextFrame = frameForProgressFn(nextProgress)
      lastProgressRef.current = nextProgress
      lastRequestedFrameRef.current = nextFrame
      setFrameIndex(nextFrame)
      setProgress(nextProgress)
    }

    const showVirtualProgress = (value) => {
      virtualProgress = clamp(value, 0, 1)
      const mappedFrame = frameForProgressFn(virtualProgress)
      // The fixed Safari renderer preloads every sixth frame across the full
      // timeline. Display those decoded anchors directly instead of changing
      // <img src> to an in-between frame that old Safari may not paint until
      // several gestures later.
      const nextFrame = virtualProgress >= 0.999
        ? frameCount - 1
        : clamp(
            startFrame + Math.round((mappedFrame - startFrame) / 6) * 6,
            startFrame,
            frameCount - 1,
          )
      lastProgressRef.current = virtualProgress
      lastRequestedFrameRef.current = nextFrame
      requestFrameRef.current(nextFrame)
      if (USE_IOS_TOUCH_SCRUBBER) drawFrame(nextFrame)
      setFrameIndex((previous) => previous === nextFrame ? previous : nextFrame)
      setProgress((previous) => Math.abs(previous - virtualProgress) < 0.001
        ? previous
        : virtualProgress)
    }

    const animateVirtualProgress = (targetValue) => {
      window.cancelAnimationFrame(gestureAnimationRef.current)
      const from = virtualProgress
      const target = clamp(targetValue, 0, 1)
      const startedAt = performance.now()
      const duration = 320

      const tick = (now) => {
        const elapsed = clamp((now - startedAt) / duration, 0, 1)
        // Smoothstep starts and settles gently, matching finger-driven
        // momentum without allowing an animation to cross a product boundary.
        const eased = elapsed * elapsed * (3 - 2 * elapsed)
        showVirtualProgress(from + (target - from) * eased)
        if (elapsed < 1) {
          gestureAnimationRef.current = window.requestAnimationFrame(tick)
        } else {
          gestureAnimationRef.current = 0
        }
      }

      gestureAnimationRef.current = window.requestAnimationFrame(tick)
    }

    const requestBack = (freshTouch = false) => {
      const atStageStart = isAtStageStart()
      if (
        !onBack ||
        backedRef.current ||
        (!freshTouch && Date.now() - mountedAtRef.current < minimumStageAge) ||
        !atStageStart
      ) {
        return
      }
      backedRef.current = true
      onBack()
    }

    const requestForward = () => {
      if (!onComplete || completedRef.current) return
      completedRef.current = true
      onComplete()
    }

    const onWheel = (event) => {
      const now = performance.now()
      // A product handoff happens while the initiating trackpad gesture may
      // still be emitting momentum (including a small reverse/bounce tail).
      // Wait for a quiet boundary before treating input as a new gesture.
      if (now < wheelReadyAt) {
        // On old WebKit the product runway has deliberately been reduced to
        // one viewport. Do not allow the tail of the previous gesture to move
        // the document through that viewport and expose the footer/blank gap.
        if (USE_SAFARI_GESTURE_FALLBACK && (onComplete || onBack)) {
          event.preventDefault()
          // Require a real quiet boundary between phase reveal and product
          // handoff. A single long Monterey trackpad gesture must never count
          // as both actions.
          wheelReadyAt = now + 120
        }
        backwardWheelIntent = 0
        return
      }
      if (USE_FIXED_FRAME_SAFARI) {
        const rect = sectionRef.current?.getBoundingClientRect()

        if (fixedStageReleased) {
          // Let native scrolling return from the footer. Once the complete
          // product viewport has returned, snap to its origin and reactivate
          // the fixed frame scrubber at its final frame.
          if (
            event.deltaY < 0 &&
            rect &&
            rect.bottom >= window.innerHeight * 0.78
          ) {
            event.preventDefault()
            instantScrollTo(rect.top + window.scrollY)
            fixedStageReleased = false
            setFixedReleased(false)
            wheelReadyAt = now + 160
          }
          return
        }

        if (!isAtStageStart()) return
        event.preventDefault()

        if (event.deltaY > 0) {
          if (virtualProgress >= 0.999) {
            if (onComplete) requestForward()
            else {
              fixedStageReleased = true
              setFixedReleased(true)
              // Cleaner is the last product. Safari 14 releases its fixed
              // poster one compositor frame before native scrolling advances,
              // exposing the empty dark runway between the stage and footer.
              // Move to the exact end of this final wrapper in the same action
              // only on Big Sur; all current browsers retain native handoff.
              if (IS_BIG_SUR_SAFARI && rect) {
                const destination = rect.top + window.scrollY + rect.height
                requestAnimationFrame(() => instantScrollTo(destination))
              }
            }
            return
          }
          const step = Math.min(0.12, Math.max(0.015, Math.abs(event.deltaY) / 850))
          showVirtualProgress(virtualProgress + step)
          if (virtualProgress >= 0.999) wheelReadyAt = now + 520
          return
        }

        if (event.deltaY < 0) {
          if (virtualProgress <= 0.001) {
            requestBack()
            return
          }
          const step = Math.min(0.12, Math.max(0.015, Math.abs(event.deltaY) / 850))
          showVirtualProgress(virtualProgress - step)
          if (virtualProgress <= 0.001) wheelReadyAt = now + 520
        }
        return
      }
      if (USE_STATIC_SAFARI_FALLBACK) {
        const aligned = isAtStageStart()
        // Outside the product viewport (notably while returning from the
        // footer), preserve native document scrolling until it is aligned.
        if (!aligned) return

        if (event.deltaY > 0) {
          if (fallbackPhase === 1 && !onComplete) return
          event.preventDefault()
          forwardWheelIntent += event.deltaY
          backwardWheelIntent = 0
          if (forwardWheelIntent >= 42) {
            forwardWheelIntent = 0
            if (fallbackPhase === 0) {
              showFallbackPhase(1)
              wheelReadyAt = now + 340
            } else {
              requestForward()
            }
          }
          return
        }

        if (event.deltaY < 0) {
          event.preventDefault()
          backwardWheelIntent += Math.abs(event.deltaY)
          forwardWheelIntent = 0
          if (backwardWheelIntent >= 36) {
            backwardWheelIntent = 0
            if (fallbackPhase === 1) {
              showFallbackPhase(0)
              wheelReadyAt = now + 340
            } else {
              requestBack()
            }
          }
          return
        }
        return
      }
      if (event.deltaY >= 0 || !isAtStageStart()) {
        backwardWheelIntent = 0
        return
      }
      backwardWheelIntent += Math.abs(event.deltaY)
      window.clearTimeout(backwardIntentTimer)
      backwardIntentTimer = window.setTimeout(() => {
        backwardWheelIntent = 0
      }, 180)
      if (backwardWheelIntent >= 18) requestBack()
    }

    const onTouchStart = (event) => {
      // A new Android touchstart is already a clean gesture boundary. Do not
      // make the user wait for the post-handoff timer before they can reverse
      // from a product's opening frame. Safari keeps the carry-over guard.
      touchGestureEligible = touchReady ||
        (!USE_SAFARI_GESTURE_FALLBACK && !USE_IOS_TOUCH_SCRUBBER)
      if (USE_IOS_TOUCH_SCRUBBER) {
        const rect = sectionRef.current?.getBoundingClientRect()
        if (rect && rect.top > 1 && rect.top < window.innerHeight * 0.35) {
          instantScrollTo(window.scrollY + rect.top)
        }
      }
      iosGestureHandled = false
      touchStartY = event.touches[0]?.clientY ?? null
    }

    const onTouchMove = (event) => {
      const currentY = event.touches[0]?.clientY
      if (!touchGestureEligible || touchStartY === null || currentY === undefined) return
      if (USE_IOS_TOUCH_SCRUBBER && isAtStageStart()) {
        if (iosStageReleased) return
        const delta = touchStartY - currentY
        if (!onComplete && virtualProgress >= 0.999 && delta > 0) {
          // The completed Cleaner hands the gesture back to native scrolling
          // from its first pixel so the footer follows without an extra swipe.
          iosStageReleased = true
          touchGestureEligible = false
          return
        }
        // Capture the gesture before iOS starts native page scrolling. Once
        // WebKit commits the first few pixels to native scroll it may cancel
        // later touchmoves, leaving both the frame and product unchanged.
        event.preventDefault()
        if (Math.abs(delta) < 42) return

        if (iosGestureHandled) {
          return
        }

        const currentStep = IOS_PROGRESS_STEPS.reduce((closest, value, index) =>
          Math.abs(value - virtualProgress) <
          Math.abs(IOS_PROGRESS_STEPS[closest] - virtualProgress)
            ? index
            : closest, 0)

        if (delta > 0) {
          if (currentStep < IOS_PROGRESS_STEPS.length - 1) {
            animateVirtualProgress(IOS_PROGRESS_STEPS[currentStep + 1])
            iosGestureHandled = true
            return
          }
          if (onComplete) {
            requestForward()
            iosGestureHandled = true
            touchGestureEligible = false
            return
          }
          // The Cleaner is the last product. Release this upward gesture so
          // the footer follows naturally after the completed final frame.
          iosStageReleased = true
          touchGestureEligible = false
          return
        }

        if (currentStep > 0) {
          animateVirtualProgress(IOS_PROGRESS_STEPS[currentStep - 1])
          iosGestureHandled = true
          return
        }
        // Reverse navigation mirrors the forward journey. First walk this
        // product back through its completed frame, specification readout and
        // opening copy. Only a fresh downward swipe from the opening phase may
        // mount the preceding product, which itself lands on its final/specs
        // phase. Previously onBack ran first and skipped these readable beats.
        if (onBack) {
          requestBack()
          iosGestureHandled = true
          touchGestureEligible = false
        }
        return
      }
      if (USE_FIXED_FRAME_SAFARI && isAtStageStart()) {
        const delta = touchStartY - currentY

        if (fixedStageReleased) return
        if (Math.abs(delta) < 2) return

        if (delta > 0 && virtualProgress >= 0.999) {
          if (onComplete) {
            event.preventDefault()
            requestForward()
          } else {
            fixedStageReleased = true
            setFixedReleased(true)
          }
          touchGestureEligible = false
          return
        }
        if (delta < 0 && virtualProgress <= 0.001) {
          event.preventDefault()
          requestBack()
          touchGestureEligible = false
          return
        }

        event.preventDefault()
        showVirtualProgress(virtualProgress + delta / 700)
        touchStartY = currentY
        return
      }
      if (USE_STATIC_SAFARI_FALLBACK && isAtStageStart()) {
        const delta = touchStartY - currentY
        if (delta >= 42) {
          if (fallbackPhase === 1 && !onComplete) return
          event.preventDefault()
          if (fallbackPhase === 0) showFallbackPhase(1)
          else requestForward()
          touchGestureEligible = false
          return
        }
        if (delta <= -42) {
          event.preventDefault()
          if (fallbackPhase === 1) showFallbackPhase(0)
          else requestBack()
          touchGestureEligible = false
          return
        }
      }
      // Moving the finger down is backward page-scroll intent on touch UIs.
      const backwardTouchDistance = currentY - touchStartY
      // At document scrollY=0 Android Chrome reserves this gesture for
      // pull-to-refresh. Claim it as soon as its direction is known whenever
      // an active product can navigate backward; waiting for the handoff
      // threshold lets the browser take ownership and show its reload UI.
      if (
        USE_MOBILE_FRAMES &&
        onBack &&
        backwardTouchDistance > 0 &&
        isAtStageStart()
      ) {
        event.preventDefault()
      }
      if (backwardTouchDistance >= 36) {
        if (USE_STATIC_SAFARI_FALLBACK && onBack) event.preventDefault()
        requestBack(true)
        touchStartY = currentY
      }
    }

    const onTouchEnd = () => {
      // If this stage mounted during an existing swipe, its touchend marks the
      // boundary. Only the next touchstart may request reverse navigation.
      touchReady = true
      touchGestureEligible = false
      iosGestureHandled = false
      touchStartY = null
    }

    // The canvas redraw is the latency-critical part users perceive as
    // "the image following my scroll" — it happens synchronously in the
    // same frame as the scroll-driven rAF. The React state update (which
    // drives text-opacity re-renders) is comparatively cheap per call but
    // its commit+paint competes with the canvas paint for the same frame
    // budget; deferring it to the *next* rAF spreads the two paints across
    // two frames instead of stacking them, which is what caused visible
    // stutter on small, closely-spaced scroll steps.
    const flushState = () => {
      stateRafId = 0
      if (pendingProgress === null) return
      const { nextFrame, nextProgress } = pendingProgress
      pendingProgress = null
      setFrameIndex((prev) => (prev === nextFrame ? prev : nextFrame))
      setProgress((prev) => (Math.abs(prev - nextProgress) < 0.001 ? prev : nextProgress))
    }

    const update = (isUserScroll) => {
      ticking = false
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (
        USE_FIXED_FRAME_SAFARI &&
        fixedStageReleased &&
        rect.top > -80 &&
        rect.top < window.innerHeight * 0.3
      ) {
        fixedStageReleased = false
        setFixedReleased(false)
      }
      if (
        USE_IOS_TOUCH_SCRUBBER &&
        iosStageReleased &&
        rect.top > -80 &&
        rect.top < window.innerHeight * 0.3
      ) {
        iosStageReleased = false
      }
      if (USE_SAFARI_GESTURE_FALLBACK || USE_IOS_TOUCH_SCRUBBER) {
        return
      }
      // Use the sticky stage's stable CSS height rather than Safari's
      // fluctuating innerHeight while its address bar expands/collapses.
      const stableViewportHeight = el.firstElementChild?.clientHeight || window.innerHeight
      const scrollable = rect.height - stableViewportHeight
      const scrolled = clamp(-rect.top, 0, scrollable)
      const nextProgress = scrollable > 0 ? scrolled / scrollable : 0

      // A reverse iPhone handoff can mount during the same finger gesture
      // that requested it. Safari may briefly report the new runway at zero
      // before touchend restores the intended end position. Keep the final
      // frame/specifications painted during that transient measurement.
      if (reverseLandingPendingRef.current) {
        if (nextProgress >= 0.8) {
          reverseLandingPendingRef.current = false
        } else if (Date.now() - mountedAtRef.current < 1600) {
          return
        } else {
          reverseLandingPendingRef.current = false
        }
      }

      const settled = Date.now() - mountedAtRef.current > 500
      const movingForward = nextProgress > lastProgressRef.current
      lastProgressRef.current = nextProgress

      if (
        USE_STATIC_SAFARI_FALLBACK &&
        suppressInitialForward &&
        isUserScroll &&
        nextProgress <= 0.15
      ) {
        // A reverse landing starts near the previous product's end. It may
        // move forward again only after the user has genuinely returned to
        // that product's beginning.
        armedRef.current = true
      } else if (
        USE_STATIC_SAFARI_FALLBACK &&
        !suppressInitialForward &&
        isUserScroll &&
        nextProgress >= 0.08
      ) {
        // The Monterey input guard already blocks carry-over momentum. Arm
        // from actual movement so a quick first gesture cannot reach the end
        // while the older mount-age guard is still waiting.
        armedRef.current = true
      } else if (
        isUserScroll &&
        settled &&
        (nextProgress < 0.2 || (movingForward && nextProgress > 0.9))
      ) {
        armedRef.current = true
      }

      const mappedFrame = frameForProgressFn(nextProgress)
      const nextFrame = IS_SAFARI
        ? clamp(
            startFrame + Math.round((mappedFrame - startFrame) / 3) * 3,
            startFrame,
            frameCount - 1,
          )
        : mappedFrame
      lastRequestedFrameRef.current = nextFrame
      requestFrameRef.current(nextFrame)
      drawFrame(nextFrame)

      pendingProgress = { nextFrame, nextProgress }
      if (!stateRafId) {
        stateRafId = window.requestAnimationFrame(flushState)
      }

      // Old WebKit may restore the first mounted runway near its end without
      // emitting the normal sequence of intermediate scroll events. It also
      // releases sticky layers early. For that isolated fallback, measured
      // progress is sufficient proof of intent and hands off while the full
      // last frame is still pinned. Modern browsers retain gesture arming.
      const shouldComplete = armedRef.current && nextProgress >= 0.995
      if (!completedRef.current && shouldComplete) {
        completedRef.current = true
        onComplete?.()
      }
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        rafRef.current = window.requestAnimationFrame(() => update(true))
      }
    }

    update(false)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const gestureOptions = {
      passive: !(
        USE_SAFARI_GESTURE_FALLBACK ||
        USE_IOS_TOUCH_SCRUBBER ||
        (USE_MOBILE_FRAMES && onBack)
      ),
    }
    window.addEventListener('wheel', onWheel, gestureOptions)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, gestureOptions)
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.clearTimeout(backwardIntentTimer)
      window.clearTimeout(touchReadyTimer)
      window.cancelAnimationFrame(rafRef.current)
      window.cancelAnimationFrame(stateRafId)
      window.cancelAnimationFrame(gestureAnimationRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, startFrame, frameForProgressFn, drawFrame, onComplete, onBack, suppressInitialForward])

  return { sectionRef, canvasRef, progress, frameIndex, fixedReleased }
}

function AactsExperience({ onComplete, suppressInitialForward, testMobileCanvas = false, dualLayerMobile = testMobileCanvas }) {
  // On an actual phone, the promoted single-layer route (/solutions,
  // /testsol1) frames the product image in its own panel instead of running
  // it full-bleed behind the copy — see the mobile composition in the CSS.
  // That panel needs the complete, uncropped frame, so the draw call must use
  // the contain-fit branch of frameFit() there. Desktop and the dual-layer
  // /testsol route are untouched: fullStageMobile only affects the branch
  // frameFit() takes when USE_MOBILE_FRAMES is true, which desktop never is,
  // and dualLayerMobile routes keep their existing cover-fit ambient layer.
  const useMobileFrameCard = testMobileCanvas && !dualLayerMobile && USE_MOBILE_FRAMES
  const { sectionRef, canvasRef, progress, frameIndex, fixedReleased } = useFrameScrubber({
    frameCount: FRAME_COUNT,
    frameUrl,
    frameForProgress,
    onComplete,
    suppressInitialForward,
    fullStageMobile: useMobileFrameCard ? false : testMobileCanvas,
    coverFit: useMobileFrameCard,
    dualLayerMobile,
  })

  const mobilePhases = mobileContentPhases(progress)
  const useTestMobileComposition = testMobileCanvas && USE_MOBILE_FRAMES
  const useSafeContentHandoff =
    (USE_MOBILE_FRAMES || USE_SAFARI_GESTURE_FALLBACK) && !useTestMobileComposition
  const introOpacity = useTestMobileComposition
    ? 1 - smoothstep(0.42, 0.58, progress)
    : useSafeContentHandoff
      ? mobilePhases.intro
      : 1 - smoothstep(60, 63, frameIndex)
  const specsOpacity = useTestMobileComposition
    ? smoothstep(0.48, 0.64, progress)
    : useSafeContentHandoff
      ? mobilePhases.detail
      : smoothstep(0.63, 0.75, progress)

  return (
    <div className="aacts__stage-wrap" ref={sectionRef}>
      <div className={`aacts__stage${fixedReleased ? ' is-fixed-released' : ''}`}>
        {/* ProductFramePoster is a sibling of .aacts__media, not nested inside
            it — same reason as the frame-HUD below: .aacts__media is already
            inset by the mobile panel's gutter, so the poster's own inset CSS
            would apply that gutter a second time relative to the already-
            narrowed box. On desktop .aacts__media has zero inset, so this is
            equivalent there either way. */}
        <ProductFramePoster
          startSrc={frameUrl(0)}
          endSrc={frameUrl(FRAME_COUNT - 1)}
          activeSrc={frameUrl(frameIndex)}
          progress={progress}
        />
        <div className="aacts__media">
          <canvas ref={canvasRef} className={`aacts__canvas${testMobileCanvas ? ' product-frame-background' : ''}`} />
        </div>
        {/* Sibling of .aacts__media, not nested inside it: the CSS positions
            this against .aacts__stage with the same box the panel uses, and
            .aacts__media's own overflow:hidden would clip it if it were a
            child instead. */}
        {useMobileFrameCard && <MobileFrameHud code="AACTS · 3000" progress={progress} />}
        <VideoBrandOverlay variant="aacts" />

        <div className="aacts__content">
          <div
            className="aacts__block aacts__block--intro"
            style={contentState(introOpacity)}
          >
            <span className="aacts__eyebrow">AACTS 3000 / Threat Platform</span>
            <h2 className="aacts__headline">
              AACTS 3000 Analyzer delivers{' '}
              <span>rapid chemical detection</span> for
              high-security screening.
            </h2>
            <p className="aacts__body">
              The AACTS 3000 Analyzer is designed for{' '}
              <strong>security screening</strong> and{' '}
              <strong>threat detection</strong> in high-security environments.
              It uses <span>dual polarity AACTS-AIMS</span> to rapidly identify
              banned substances including <strong>narcotics</strong> and{' '}
              <strong>explosives.</strong>
            </p>
            <p className="aacts__certified">Operational / Field Certified</p>
          </div>

          <div
            className="aacts__block aacts__block--stacked aacts__block--specs"
            style={contentState(specsOpacity)}
          >
            <span className="aacts__eyebrow">System Readout</span>
            <h3 className="aacts__spec-title">Specifications</h3>
            <div className="aacts__specs">
              {SPECS.map(({ icon: Icon, label, value }) => (
                <div className="aacts__spec" key={label}>
                  <span className="aacts__spec-icon">
                    <Icon strokeWidth={1.6} />
                  </span>
                  <div>
                    <h5>{label}</h5>
                    <p>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SampleCardExperience({ onComplete, onBack, suppressInitialForward, testMobileCanvas = false, dualLayerMobile = testMobileCanvas }) {
  const useMobileFrameCard = testMobileCanvas && !dualLayerMobile && USE_MOBILE_FRAMES
  const { sectionRef, canvasRef, progress, frameIndex, fixedReleased } = useFrameScrubber({
    frameCount: SAMPLE_CARD_FRAME_COUNT,
    startFrame: SAMPLE_CARD_START_FRAME,
    frameUrl: sampleCardFrameUrl,
    frameForProgress: sampleCardFrameForProgress,
    onComplete,
    onBack,
    suppressInitialForward,
    fullStageMobile: useMobileFrameCard ? false : testMobileCanvas,
    coverFit: useMobileFrameCard,
    dualLayerMobile,
  })

  const mobilePhases = mobileContentPhases(progress)
  const useTestMobileComposition = testMobileCanvas && USE_MOBILE_FRAMES
  const useSafeContentHandoff =
    (USE_MOBILE_FRAMES || USE_SAFARI_GESTURE_FALLBACK) && !useTestMobileComposition
  const introOpacity = useTestMobileComposition
    ? 1 - smoothstep(0.42, 0.58, progress)
    : useSafeContentHandoff
      ? mobilePhases.intro
      : 1 - smoothstep(57, 60, frameIndex)
  const detailsOpacity = useTestMobileComposition
    ? smoothstep(0.48, 0.64, progress)
    : useSafeContentHandoff
      ? mobilePhases.detail
      : smoothstep(0.7, 0.82, progress)

  return (
    <div className="sample-card__stage-wrap" ref={sectionRef}>
      <div className={`sample-card__stage${fixedReleased ? ' is-fixed-released' : ''}`}>
        <ProductFramePoster
          startSrc={sampleCardFrameUrl(SAMPLE_CARD_START_FRAME)}
          endSrc={sampleCardFrameUrl(SAMPLE_CARD_FRAME_COUNT - 1)}
          activeSrc={sampleCardFrameUrl(frameIndex)}
          progress={progress}
        />
        <canvas ref={canvasRef} className={`sample-card__canvas${testMobileCanvas ? ' product-frame-background' : ''}`} />
        {useMobileFrameCard && <MobileFrameHud code="ASC · 02" progress={progress} />}
        <VideoBrandOverlay variant="sample-card" />

        <div className="sample-card__content sample-card__content--left" style={contentState(introOpacity)}>
          <span className="sample-card__eyebrow">Aspiration Sample Card</span>
          <h2>Aspiration Sample Card</h2>
          <p className="sample-card__provider">Sample Capture Medium</p>
          <p>
            The Aspiration Sample Card is an essential tool for{' '}
            <strong>efficient sample capture</strong> and analysis. Designed for
            advanced <span>trace analytics / trace chemical collection</span>, the card
            features a unique chemically treated fine wire mesh that ensures
            precise sampling for quick identification in analyzer systems.
          </p>
        </div>

        <div className="sample-card__content sample-card__content--right" style={contentState(detailsOpacity)}>
          <span className="sample-card__eyebrow">Capture Details</span>
          <h2>Engineered for repeatable collection.</h2>
          <div className="sample-card__details">
            {SAMPLE_CARD_DETAILS.map((item) => (
              <div className="sample-card__detail" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HandheldExperience({ onComplete, onBack, suppressInitialForward, testMobileCanvas = false, dualLayerMobile = testMobileCanvas }) {
  const useMobileFrameCard = testMobileCanvas && !dualLayerMobile && USE_MOBILE_FRAMES
  const { sectionRef, canvasRef, progress, frameIndex, fixedReleased } = useFrameScrubber({
    frameCount: HANDHELD_FRAME_COUNT,
    startFrame: HANDHELD_START_FRAME,
    frameUrl: handheldFrameUrl,
    frameForProgress: handheldFrameForProgress,
    onComplete,
    onBack,
    suppressInitialForward,
    fullStageMobile: useMobileFrameCard ? false : testMobileCanvas,
    coverFit: useMobileFrameCard,
    dualLayerMobile,
  })

  const mobilePhases = mobileContentPhases(progress)
  const useTestMobileComposition = testMobileCanvas && USE_MOBILE_FRAMES
  const useSafeContentHandoff =
    (USE_MOBILE_FRAMES || USE_SAFARI_GESTURE_FALLBACK) && !useTestMobileComposition
  const introOpacity = useTestMobileComposition
    ? 1 - smoothstep(0.42, 0.58, progress)
    : useSafeContentHandoff
      ? mobilePhases.intro
      : 1 - smoothstep(56, 59, frameIndex)
  const specsOpacity = useTestMobileComposition
    ? smoothstep(0.48, 0.64, progress)
    : useSafeContentHandoff
      ? mobilePhases.detail
      : smoothstep(0.68, 0.8, progress)

  return (
    <div className="handheld__stage-wrap" ref={sectionRef}>
      <div className={`handheld__stage${fixedReleased ? ' is-fixed-released' : ''}`}>
        <ProductFramePoster
          startSrc={handheldFrameUrl(HANDHELD_START_FRAME)}
          endSrc={handheldFrameUrl(HANDHELD_FRAME_COUNT - 1)}
          activeSrc={handheldFrameUrl(frameIndex)}
          progress={progress}
        />
        <canvas ref={canvasRef} className={`handheld__canvas${testMobileCanvas ? ' product-frame-background' : ''}`} />
        {useMobileFrameCard && <MobileFrameHud code="HHS · 03" progress={progress} />}
        <VideoBrandOverlay variant="handheld" />

        <div className="handheld__content handheld__content--left" style={contentState(introOpacity)}>
          <span className="handheld__eyebrow">Handheld Sampler / Identifier</span>
          <h2>
            Handheld Sampler for <span>rapid portable air sampling.</span>
          </h2>
          <p>
            The Handheld Sampler offers a <strong>rapid, portable solution</strong>{' '}
            for acquiring air samples using specially designed aspiration systems.
            Perfect for vehicles, packages, and personal screening,
            it gives operators <span>controlled sampling flow and timing</span>{' '}
            for efficient, reliable results.
          </p>
        </div>

        <div className="handheld__content handheld__content--right" style={contentState(specsOpacity)}>
          <span className="handheld__eyebrow">System Readout</span>
          <h2>Specifications</h2>
          <div className="handheld__specs">
            {HANDHELD_SPECS.map((item) => (
              <div className="handheld__spec" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HighVolumeExperience({ onComplete, onBack, suppressInitialForward, testMobileCanvas = false, dualLayerMobile = testMobileCanvas }) {
  const useMobileFrameCard = testMobileCanvas && !dualLayerMobile && USE_MOBILE_FRAMES
  const { sectionRef, canvasRef, progress, frameIndex, fixedReleased } = useFrameScrubber({
    frameCount: HIGH_VOLUME_FRAME_COUNT,
    startFrame: HIGH_VOLUME_START_FRAME,
    frameUrl: highVolumeFrameUrl,
    frameForProgress: highVolumeFrameForProgress,
    onComplete,
    onBack,
    suppressInitialForward,
    fullStageMobile: useMobileFrameCard ? false : testMobileCanvas,
    coverFit: useMobileFrameCard,
    dualLayerMobile,
  })

  const mobilePhases = mobileContentPhases(progress)
  const useTestMobileComposition = testMobileCanvas && USE_MOBILE_FRAMES
  const useSafeContentHandoff =
    (USE_MOBILE_FRAMES || USE_SAFARI_GESTURE_FALLBACK) && !useTestMobileComposition
  const introOpacity = useTestMobileComposition
    ? 1 - smoothstep(0.42, 0.58, progress)
    : useSafeContentHandoff
      ? mobilePhases.intro
      : 1 - smoothstep(57, 60, frameIndex)
  const specsOpacity = useTestMobileComposition
    ? smoothstep(0.48, 0.64, progress)
    : useSafeContentHandoff
      ? mobilePhases.detail
      : smoothstep(0.68, 0.8, progress)

  return (
    <div className="high-volume__stage-wrap" ref={sectionRef}>
      <div className={`high-volume__stage${fixedReleased ? ' is-fixed-released' : ''}`}>
        <ProductFramePoster
          startSrc={highVolumeFrameUrl(HIGH_VOLUME_START_FRAME)}
          endSrc={highVolumeFrameUrl(HIGH_VOLUME_FRAME_COUNT - 1)}
          activeSrc={highVolumeFrameUrl(frameIndex)}
          progress={progress}
        />
        <canvas ref={canvasRef} className={`high-volume__canvas${testMobileCanvas ? ' product-frame-background' : ''}`} />
        {useMobileFrameCard && <MobileFrameHud code="HVS · 04" progress={progress} />}
        <VideoBrandOverlay variant="high-volume" />

        <div className="high-volume__content high-volume__content--left" style={contentState(introOpacity)}>
          <span className="high-volume__eyebrow">High Volume Sampler / Identifier</span>
          <h2>
            High Volume Sampler for <span>challenging air collection.</span>
          </h2>
          <p>
            The High Volume Sampler is designed to efficiently collect air
            samples from <strong>containers, vehicles, enclosures, and large volume surfaces</strong>,
            especially where swabbing is impractical. It captures airborne trace
            chemicals and particles, even from under canvas or the top of air cargo,
            making it ideal for <span>comprehensive sampling</span> in difficult
            locations.
          </p>
        </div>

        <div className="high-volume__content high-volume__content--right" style={contentState(specsOpacity)}>
          <span className="high-volume__eyebrow">System Readout</span>
          <h2>Specifications</h2>
          <div className="high-volume__specs">
            {HIGH_VOLUME_SPECS.map((item) => (
              <div className="high-volume__spec" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CleanerExperience({ onBack, suppressInitialForward, testMobileCanvas = false, dualLayerMobile = testMobileCanvas }) {
  const useMobileFrameCard = testMobileCanvas && !dualLayerMobile && USE_MOBILE_FRAMES
  const { sectionRef, canvasRef, progress, frameIndex, fixedReleased } = useFrameScrubber({
    frameCount: CLEANER_FRAME_COUNT,
    startFrame: CLEANER_START_FRAME,
    frameUrl: cleanerFrameUrl,
    frameForProgress: cleanerFrameForProgress,
    onBack,
    suppressInitialForward,
    fullStageMobile: useMobileFrameCard ? false : testMobileCanvas,
    coverFit: useMobileFrameCard,
    dualLayerMobile,
  })

  const mobilePhases = mobileContentPhases(progress, { switchAt: 0.5 })
  const useTestMobileComposition = testMobileCanvas && USE_MOBILE_FRAMES
  const useSafeContentHandoff =
    (USE_MOBILE_FRAMES || USE_SAFARI_GESTURE_FALLBACK) && !useTestMobileComposition
  const introOpacity = useTestMobileComposition
    ? 1 - smoothstep(0.42, 0.58, progress)
    : useSafeContentHandoff ? mobilePhases.intro : 1
  const specsOpacity = useTestMobileComposition
    ? smoothstep(0.48, 0.64, progress)
    : useSafeContentHandoff
      ? mobilePhases.detail
      : smoothstep(0.48, 0.62, progress)

  return (
    <div className="cleaner__stage-wrap" ref={sectionRef}>
      <div className={`cleaner__stage${fixedReleased ? ' is-fixed-released' : ''}`}>
        <ProductFramePoster
          startSrc={cleanerFrameUrl(CLEANER_START_FRAME)}
          endSrc={cleanerFrameUrl(CLEANER_FRAME_COUNT - 1)}
          activeSrc={cleanerFrameUrl(frameIndex)}
          progress={progress}
        />
        <canvas ref={canvasRef} className={`cleaner__canvas${testMobileCanvas ? ' product-frame-background' : ''}`} />
        {useMobileFrameCard && <MobileFrameHud code="ACC · 05" progress={progress} />}
        <VideoBrandOverlay variant="cleaner" />

        <div className="cleaner__content cleaner__content--left" style={contentState(introOpacity)}>
          <span className="cleaner__eyebrow">Aspiration Card Cleaner / Cleaner</span>
          <h2>
            Aspiration Card Cleaner for <span>rapid card reuse.</span>
          </h2>
          <p>
            The Aspiration Card Cleaner is a <strong>state-of-the-art cleaning device</strong>{' '}
            that restores up to 5 aspiration cards simultaneously. Built for rapid
            operation and precision, it delivers effective decontamination in a
            swift <span>5-minute cycle</span>, keeping sample cards ready for
            continuous, accurate threat detection.
          </p>
        </div>

        <div className="cleaner__content cleaner__content--right" style={contentState(specsOpacity)}>
          <span className="cleaner__eyebrow">System Readout</span>
          <h2>Specifications</h2>
          <div className="cleaner__specs">
            {CLEANER_SPECS.map((item) => (
              <div className="cleaner__spec" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AactsPlaceholder({ tab }) {
  return (
    <div className="aacts__placeholder">
      {tab.img && (
        <div className="aacts__placeholder-media">
          <img src={tab.img} alt={tab.label} />
        </div>
      )}
      <h3>{tab.label}</h3>
      <p>Full specifications for this product are coming soon.</p>
    </div>
  )
}

function AactsShowcase({ testMobileCanvas = false, singleLayerTest = false }) {
  const showcaseRef = useRef(null)
  const tabsBarRef = useRef(null)
  const pendingScrollPositionRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedProduct = searchParams.get('product')
  const initialTab = TABS.some((tab) => tab.id === requestedProduct)
    ? requestedProduct
    : 'aacts3000'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isReverseLanding, setIsReverseLanding] = useState(false)
  const activeTabData = TABS.find((t) => t.id === activeTab)
  const dualLayerMobile = testMobileCanvas && !singleLayerTest

  useEffect(() => {
    if (USE_SAFARI_GESTURE_FALLBACK) return undefined
    const configs = {
      aacts3000: { start: 0, count: FRAME_COUNT, url: frameUrl },
      card: { start: SAMPLE_CARD_START_FRAME, count: SAMPLE_CARD_FRAME_COUNT, url: sampleCardFrameUrl },
      handheld: { start: HANDHELD_START_FRAME, count: HANDHELD_FRAME_COUNT, url: handheldFrameUrl },
      sampler: { start: HIGH_VOLUME_START_FRAME, count: HIGH_VOLUME_FRAME_COUNT, url: highVolumeFrameUrl },
      cleaner: { start: CLEANER_START_FRAME, count: CLEANER_FRAME_COUNT, url: cleanerFrameUrl },
    }
    const index = TABS.findIndex((tab) => tab.id === activeTab)
    const warmFrames = () => {
      const nextId = TABS[index + 1]?.id
      const previousId = TABS[index - 1]?.id

      // Prepare sparse frames across the next product's full timeline rather
      // than only its opening. This gives Safari a decoded frame near every
      // possible scroll position before the automatic handoff occurs.
      if (nextId) {
        const config = configs[nextId]
        for (let frame = config.start; frame < config.count; frame += 6) {
          getCachedFrame(
            config.url(frame),
            frame === config.start ? 'high' : 'low',
            true,
          )
        }
        getCachedFrame(config.url(config.count - 1), 'low', true)
      }

      // Keep a smaller backward window for reverse scrolling/navigation.
      if (previousId) {
        const config = configs[previousId]
        const end = Math.min(config.count, config.start + 8)
        for (let frame = config.start; frame < end; frame++) {
          getCachedFrame(config.url(frame), 'low', true)
        }
      }
    }

    let idleId
    let timeoutId
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(warmFrames, { timeout: 1200 })
    } else {
      timeoutId = window.setTimeout(warmFrames, 450)
    }
    return () => {
      if (idleId) window.cancelIdleCallback(idleId)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [activeTab])

  useEffect(() => {
    const updateTabsHeight = () => {
      const height = tabsBarRef.current?.offsetHeight ?? 0
      showcaseRef.current?.style.setProperty('--aacts-tabs-height', `${height}px`)
    }

    updateTabsHeight()
    window.addEventListener('resize', updateTabsHeight)
    return () => window.removeEventListener('resize', updateTabsHeight)
  }, [])

  // On small screens the tabs row scrolls horizontally — keep the active
  // product tab centered so it is always visible.
  useEffect(() => {
    const tabs = tabsBarRef.current?.querySelector('.aacts__tabs')
    const active = tabs?.querySelector('.aacts__tab.is-active')
    if (!tabs || !active || tabs.scrollWidth <= tabs.clientWidth) return
    tabs.scrollTo({
      left: active.offsetLeft - (tabs.clientWidth - active.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }, [activeTab])

  const resetShowcaseScroll = useCallback(() => {
    const target = USE_IOS_TOUCH_SCRUBBER
      ? showcaseRef.current?.querySelector(
          '.aacts__stage-wrap, .sample-card__stage-wrap, .handheld__stage-wrap, .high-volume__stage-wrap, .cleaner__stage-wrap',
        )
      : showcaseRef.current
    const top = (target?.getBoundingClientRect().top ?? 0) + window.scrollY
    instantScrollTo(top)
  }, [])

  // After switching to a tab whose stage should open scrolled near its own
  // end (backward navigation), the new section's height is only known once
  // it has mounted — so we land at the top first, then nudge down once its
  // real height is in the DOM.
  useLayoutEffect(() => {
    const pendingPosition = pendingScrollPositionRef.current
    if (!pendingPosition) return
    pendingScrollPositionRef.current = null

    // Forward mobile handoffs mount the next product first, then restore the
    // showcase origin during layout, before the browser can paint the old
    // stage's footer boundary or a newly mounted blank canvas.
    const usesVirtualReverseLanding =
      pendingPosition === 'end' &&
      (USE_SAFARI_GESTURE_FALLBACK || USE_IOS_TOUCH_SCRUBBER)

    if (pendingPosition === 'start' || usesVirtualReverseLanding) {
      resetShowcaseScroll()
      // Gesture-driven Safari/iOS stages carry their reverse position in
      // virtualProgress, not in the document's scroll offset. Keep the newly
      // mounted previous product anchored at its origin so downward gestures
      // can reveal specifications and then the heading instead of first
      // spending an entire runway merely returning the page to the top.
      // Android Chrome may also commit one final momentum-scroll position
      // after a forward handoff, so reassert the origin across two frames.
      let raf2 = 0
      const raf1 = window.requestAnimationFrame(() => {
        resetShowcaseScroll()
        raf2 = window.requestAnimationFrame(resetShowcaseScroll)
      })
      const settle1 = window.setTimeout(resetShowcaseScroll, 80)
      const settle2 = window.setTimeout(resetShowcaseScroll, 220)
      return () => {
        window.cancelAnimationFrame(raf1)
        if (raf2) window.cancelAnimationFrame(raf2)
        window.clearTimeout(settle1)
        window.clearTimeout(settle2)
      }
    }

    const landAtProductEnd = (force = false) => {
      const stageWrap = showcaseRef.current?.querySelector(
        '.aacts__stage-wrap, .sample-card__stage-wrap, .handheld__stage-wrap, .high-volume__stage-wrap, .cleaner__stage-wrap',
      )
      if (!stageWrap) return
      const rect = stageWrap.getBoundingClientRect()
      const viewportHeight = USE_PROMOTED_IOS_REVERSE_LANDING
        ? (stageWrap.firstElementChild?.clientHeight || window.innerHeight)
        : window.innerHeight
      const scrollable = rect.height - viewportHeight
      if (scrollable <= 0) return
      const currentProgress = clamp(-rect.top / scrollable, 0, 1)
      // Once the previous product is genuinely inside its reverse timeline,
      // never snap it back to the end. Delayed corrections are only for the
      // false near-zero position produced by iPhone's finishing momentum.
      if (!force && currentProgress > 0.15) return
      // iPhone/iPad reverse navigation must visibly re-enter on the genuine
      // final product frame. Desktop retains its established 97% landing,
      // while 99.5% maps iOS/iPad to frame 120 without arming a forward handoff.
      const reverseLandingProgress = IS_IOS_DEVICE ? 0.995 : 0.97
      const targetTop = window.scrollY + rect.top + scrollable * reverseLandingProgress
      instantScrollTo(targetTop)
    }

    let raf2 = 0
    let touchRaf = 0
    let touchSettleTimer = 0
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => landAtProductEnd(true))
    })
    const settleTimers = USE_PROMOTED_IOS_REVERSE_LANDING
      ? [100, 280, 620].map((delay) => window.setTimeout(() => landAtProductEnd(), delay))
      : []
    const landAfterTouch = () => {
      window.removeEventListener('touchend', landAfterTouch)
      window.removeEventListener('touchcancel', landAfterTouch)
      touchRaf = window.requestAnimationFrame(() => {
        landAtProductEnd()
        touchSettleTimer = window.setTimeout(() => landAtProductEnd(), 80)
      })
    }
    if (USE_PROMOTED_IOS_REVERSE_LANDING) {
      window.addEventListener('touchend', landAfterTouch, { once: true })
      window.addEventListener('touchcancel', landAfterTouch, { once: true })
    }
    return () => {
      window.cancelAnimationFrame(raf1)
      window.cancelAnimationFrame(raf2)
      window.cancelAnimationFrame(touchRaf)
      window.clearTimeout(touchSettleTimer)
      settleTimers.forEach(window.clearTimeout)
      window.removeEventListener('touchend', landAfterTouch)
      window.removeEventListener('touchcancel', landAfterTouch)
    }
  }, [activeTab, resetShowcaseScroll])

  const selectTab = useCallback((id, options = { resetScroll: true }) => {
    if (id !== activeTab) {
      window.dispatchEvent(new Event('anika:solution-product-change'))
    }
    if (options.resetScroll || options.scrollPosition) {
      if (options.scrollPosition === 'end') {
        pendingScrollPositionRef.current = 'end'
        setIsReverseLanding(true)
        setActiveTab(id)
        setSearchParams(id === 'aacts3000' ? {} : { product: id })
        return
      }
      pendingScrollPositionRef.current = 'start'
      setIsReverseLanding(false)
      setActiveTab(id)
      setSearchParams(id === 'aacts3000' ? {} : { product: id })
      return
    }
    setIsReverseLanding(false)
    setActiveTab(id)
    setSearchParams(id === 'aacts3000' ? {} : { product: id })
  }, [activeTab, setSearchParams])

  const advanceToSampleCard = useCallback(() => {
    selectTab('card', { resetScroll: true, scrollPosition: 'start' })
  }, [selectTab])

  const advanceToHandheld = useCallback(() => {
    selectTab('handheld', { resetScroll: true, scrollPosition: 'start' })
  }, [selectTab])

  const advanceToHighVolume = useCallback(() => {
    selectTab('sampler', { resetScroll: true, scrollPosition: 'start' })
  }, [selectTab])

  const advanceToCleaner = useCallback(() => {
    selectTab('cleaner', { resetScroll: true, scrollPosition: 'start' })
  }, [selectTab])

  const retreatToAacts3000 = useCallback(() => {
    selectTab('aacts3000', { resetScroll: true, scrollPosition: 'end' })
  }, [selectTab])

  const retreatToSampleCard = useCallback(() => {
    selectTab('card', { resetScroll: true, scrollPosition: 'end' })
  }, [selectTab])

  const retreatToHandheld = useCallback(() => {
    selectTab('handheld', { resetScroll: true, scrollPosition: 'end' })
  }, [selectTab])

  const retreatToHighVolume = useCallback(() => {
    selectTab('sampler', { resetScroll: true, scrollPosition: 'end' })
  }, [selectTab])

  return (
    <section
      className={`aacts${USE_SAFARI_GESTURE_FALLBACK ? ' aacts--static-safari' : ''}${USE_FIXED_FRAME_SAFARI ? ' aacts--fixed-safari' : ''}${IS_BIG_SUR_SAFARI ? ' aacts--big-sur' : ''}${USE_IOS_TOUCH_SCRUBBER ? ' aacts--ios-touch' : ''}${testMobileCanvas ? ' aacts--testsol' : ''}${singleLayerTest ? ' aacts--testsol1' : ''}${testMobileCanvas && IS_IOS_DEVICE ? ' aacts--testsol-ios' : ''}`}
      ref={showcaseRef}
    >
      <div className="aacts__tabs-bar" ref={tabsBarRef}>
        <label className="aacts__mobile-select-wrap">
          <span className="aacts__mobile-select-index">
            {String(TABS.findIndex((tab) => tab.id === activeTab) + 1).padStart(2, '0')}
          </span>
          <select
            className="aacts__mobile-select"
            value={activeTab}
            onChange={(event) => selectTab(event.target.value, { resetScroll: true })}
            aria-label="Select a product"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
          <span className="aacts__mobile-select-chevron" aria-hidden="true" />
        </label>
        <div className="aacts__tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              className={`aacts__tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => selectTab(tab.id, { resetScroll: true })}
            >
              <span className="aacts__tab-num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="aacts__tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'aacts3000' ? (
        <AactsExperience onComplete={advanceToSampleCard} suppressInitialForward={isReverseLanding} testMobileCanvas={testMobileCanvas} dualLayerMobile={dualLayerMobile} />
      ) : activeTab === 'handheld' ? (
        <HandheldExperience onComplete={advanceToHighVolume} onBack={retreatToSampleCard} suppressInitialForward={isReverseLanding} testMobileCanvas={testMobileCanvas} dualLayerMobile={dualLayerMobile} />
      ) : activeTab === 'sampler' ? (
        <HighVolumeExperience onComplete={advanceToCleaner} onBack={retreatToHandheld} suppressInitialForward={isReverseLanding} testMobileCanvas={testMobileCanvas} dualLayerMobile={dualLayerMobile} />
      ) : activeTab === 'card' ? (
        <SampleCardExperience onComplete={advanceToHandheld} onBack={retreatToAacts3000} suppressInitialForward={isReverseLanding} testMobileCanvas={testMobileCanvas} dualLayerMobile={dualLayerMobile} />
      ) : activeTab === 'cleaner' ? (
        <CleanerExperience onBack={retreatToHighVolume} suppressInitialForward={isReverseLanding} testMobileCanvas={testMobileCanvas} dualLayerMobile={dualLayerMobile} />
      ) : (
        <AactsPlaceholder tab={activeTabData} />
      )}
    </section>
  )
}

export default AactsShowcase
