import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

// Recreates the index/capability page motion language for a React page:
//  - headings reveal word-by-word, each word rising into place while its
//    colour resolves from the brand orange to its final colour (scroll-scrubbed)
//  - supporting elements (copy, cards, media) fade and lift in on entry
//
// Pass a ref to the page's <main> and a config describing which selectors get
// which treatment. All animations are scoped via gsap.context so they clean up
// on unmount, and everything is disabled under prefers-reduced-motion.
export function useScrollReveal(
  scopeRef,
  {
    intro = [],
    introHeadings = [],
    headings = [],
    groups = [],
    headingStart = 'top 88%',
    headingEnd = 'top 46%',
    headingScrub = 1.1,
  } = {},
) {
  useLayoutEffect(() => {
    const root = scopeRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const eventCleanups = []
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const entranceAnimations = []

      // Above-the-fold intro: reveal on load (not scroll) so the hero animates
      // immediately, matching the static pages' entrance choreography.
      intro.forEach(({ items, y = 28, stagger = 0.12, delay = 0.15, from = 'y' }) => {
        const targets = q(items)
        if (!targets.length) return
        const animation = gsap.fromTo(
          targets,
          from === 'clip'
            ? { clipPath: 'inset(100% 0 0 0)', yPercent: 8 }
            : { opacity: 0, y },
          {
            ...(from === 'clip'
              ? { clipPath: 'inset(0% 0 0 0)', yPercent: 0 }
              : { opacity: 1, y: 0 }),
            duration: from === 'clip' ? 1.1 : 0.85,
            stagger,
            delay,
            paused: true,
            ease: from === 'clip' ? 'power4.inOut' : 'power3.out',
          },
        )
        entranceAnimations.push(animation)
      })

      // Above-the-fold headings use the same word-by-word entrance as the
      // index hero, but wait until the shared loader has fully cleared.
      introHeadings.forEach((selector) => {
        q(selector).forEach((heading) => {
          const split = new SplitText(heading, { type: 'words,lines' })
          gsap.set(split.lines, { overflow: 'visible' })
          const finalColors = split.words.map((word) => getComputedStyle(word).color)
          entranceAnimations.push(
            gsap.fromTo(
              split.words,
              { opacity: 0, yPercent: 70, color: '#ff7a00' },
              {
                opacity: 1,
                yPercent: 0,
                color: (i) => finalColors[i],
                duration: 0.55,
                stagger: 0.1,
                delay: 0.12,
                paused: true,
                ease: 'power3.out',
              },
            ),
          )
        })
      })

      const playEntrance = () => entranceAnimations.forEach((animation) => animation.play())
      const loader = document.querySelector('[data-page-loader]')
      if (!loader || loader.classList.contains('is-hidden')) {
        playEntrance()
      } else {
        window.addEventListener('anika:page-ready', playEntrance, { once: true })
        eventCleanups.push(() => window.removeEventListener('anika:page-ready', playEntrance))
      }

      // Word-by-word heading reveal — the site's signature effect.
      headings.forEach((selector) => {
        q(selector).forEach((heading) => {
          const split = new SplitText(heading, { type: 'lines,words' })
          // Match platform.html: words remain visible while rising and resolving
          // from brand orange to their authored final colour.
          gsap.set(split.lines, {
            overflow: 'visible',
            paddingBottom: '0.12em',
            marginBottom: '-0.12em',
          })
          const finalColors = split.words.map((word) => getComputedStyle(word).color)
          gsap.fromTo(
            split.words,
            { yPercent: 115, opacity: 0, color: '#ff7a00' },
            {
              yPercent: 0,
              opacity: 1,
              color: (i) => finalColors[i],
              duration: 1.2,
              stagger: 0.14,
              ease: 'none',
              scrollTrigger: {
                trigger: heading,
                start: headingStart,
                end: headingEnd,
                scrub: headingScrub,
              },
            },
          )
        })
      })

      // Staggered fade-up for supporting content, grouped so items in a row
      // animate together as the group scrolls into view.
      groups.forEach(({ trigger, items, y = 26, stagger = 0.09, start = 'top 82%' }) => {
        const triggerEl = q(trigger)[0]
        const targets = q(items)
        if (!triggerEl || !targets.length) return
        gsap.fromTo(
          targets,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger,
            ease: 'power3.out',
            scrollTrigger: { trigger: triggerEl, start },
          },
        )
      })

      // Recompute positions once fonts/images settle.
      ScrollTrigger.refresh()
    }, scopeRef)

    return () => {
      eventCleanups.forEach((cleanup) => cleanup())
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
