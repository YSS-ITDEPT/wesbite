import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './ProductSection.css'

gsap.registerPlugin(ScrollTrigger)

const CARD_BG =
  'https://ik.imagekit.io/jxuol7kjt/ChatGPT%20Image%20Jul%2021,%202026,%2010_33_11%20PM.png'

const PRODUCTS = [
  {
    id: 'handheld',
    name: 'Handheld Sampling System',
    img: 'https://ik.imagekit.io/jxuol7kjt/RGS.png?updatedAt=1725873368249',
  },
  {
    id: 'cleaner',
    name: 'Aspiration Card Cleaner',
    img: 'https://ik.imagekit.io/jxuol7kjt/CLEANER.png?updatedAt=1725873349673',
  },
  {
    id: 'aacts3000',
    name: 'AACTS 3000',
    img: 'https://ik.imagekit.io/7oaqyvwnm/20240920_201159_938-removebg-preview.png?updatedAt=1726844228667',
  },
  {
    id: 'sampler',
    name: 'High Volume Sampler',
    img: 'https://ik.imagekit.io/d9wt8plt0/hh.png?updatedAt=1727107551161',
  },
  {
    id: 'card',
    name: 'Aspiration Sample Card',
    img: 'https://ik.imagekit.io/jxuol7kjt/SAMPLECARD1.png?updatedAt=1725873384833',
  },
]

const SLOT_STYLE = {
  0: { x: 0, scale: 1, opacity: 1, z: 5 },
  1: { x: 330, scale: 0.84, opacity: 0.9, z: 4 },
  '-1': { x: -330, scale: 0.84, opacity: 0.9, z: 4 },
  2: { x: 575, scale: 0.68, opacity: 0.72, z: 3 },
  '-2': { x: -575, scale: 0.68, opacity: 0.72, z: 3 },
}

function slotFor(index, centerIndex, count) {
  return (((index - centerIndex + Math.floor(count / 2)) % count) + count) % count - Math.floor(count / 2)
}

function ProductSection() {
  const sectionRef = useRef(null)
  const [centerIndex, setCenterIndex] = useState(2)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(sectionRef)

      gsap.fromTo(
        q('.product__eyebrow, .product__title, .product__subtitle'),
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          },
        },
      )

      gsap.fromTo(
        q('.product__carousel'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          scrollTrigger: {
            trigger: q('.product__carousel')[0],
            start: 'top 84%',
          },
        },
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const count = PRODUCTS.length
  const next = () => setCenterIndex((i) => (i + 1) % count)
  const prev = () => setCenterIndex((i) => (i - 1 + count) % count)

  return (
    <section id="products" className="product" ref={sectionRef}>
      <div className="product__backdrop" />

      <div className="product__header">
        <span className="product__eyebrow">What We Provide</span>
        <h2 className="product__title">
          Product <span className="product__title-accent">Spotlights</span>
        </h2>
        <p className="product__subtitle">
          Advanced sampling solutions designed for precision, reliability and
          safety.
        </p>
      </div>

      <div className="product__carousel">
        <button
          type="button"
          className="product__arrow product__arrow--prev"
          onClick={prev}
          aria-label="Previous product"
        >
          <ChevronLeft />
        </button>

        <div className="product__track">
          {PRODUCTS.map((product, i) => {
            const slot = slotFor(i, centerIndex, count)
            const style = SLOT_STYLE[slot]
            const isFeatured = slot === 0

            return (
              <article
                className={`product__card ${isFeatured ? 'is-featured' : ''}`}
                key={product.name}
                style={{
                  transform: `translate(-50%, -50%) translateX(${style.x}px) scale(${style.scale})`,
                  opacity: style.opacity,
                  zIndex: style.z,
                }}
              >
                <div
                  className="product__card-bg"
                  style={{ backgroundImage: `url(${CARD_BG})` }}
                >
                  {isFeatured && <span className="product__badge">Featured</span>}
                  <img className="product__card-img" src={product.img} alt={product.name} />
                </div>
                <h3 className="product__card-name">{product.name}</h3>
                <a className="product__card-cta" href={`/solutions?product=${product.id}`}>
                  Explore
                </a>
              </article>
            )
          })}
        </div>

        <button
          type="button"
          className="product__arrow product__arrow--next"
          onClick={next}
          aria-label="Next product"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="product__dots" aria-hidden="true">
        {PRODUCTS.map((product, i) => (
          <span
            className={`product__dot ${i === centerIndex ? 'is-active' : ''}`}
            key={product.name}
          />
        ))}
      </div>
    </section>
  )
}

export default ProductSection
