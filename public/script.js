gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
const boot = document.querySelector("[data-boot]");
const bootWasSeen = Boolean(sessionStorage.getItem("anikaBootSeenV2"));
if (boot?.hasAttribute("data-page-loader")) {
  // The shared transition controller manages this loader on every page.
} else if (bootWasSeen) {
  boot.classList.add("is-hidden");
} else {
  document.documentElement.style.overflow = "hidden";
  const counter = { value: 0 },
    statuses = [
      "CALIBRATING DETECTION ENVIRONMENT",
      "CONNECTING ACTIVE SAMPLING SYSTEMS",
      "INITIALIZING CHEMICAL INTELLIGENCE",
      "SYSTEM READY",
    ];
  gsap.to(counter, {
    value: 100,
    duration: 2.35,
    ease: "power2.inOut",
    onUpdate: () => {
      const n = Math.round(counter.value);
      document.querySelector("[data-boot-count]").textContent = String(
        n,
      ).padStart(3, "0");
      document.querySelector("[data-boot-bar]").style.width = n + "%";
      document.querySelector("[data-boot-status]").textContent =
        statuses[Math.min(3, Math.floor(n / 26))];
    },
    onComplete: () => {
      sessionStorage.setItem("anikaBootSeenV2", "1");
      boot.classList.add("is-leaving");
      gsap.to(".boot-center,.boot-brand,.boot-progress", {
        opacity: 0,
        y: -12,
        stagger: 0.04,
        duration: 0.35,
      });
      gsap.to(boot, {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
        delay: 0.2,
        onComplete: () => {
          boot.classList.add("is-hidden");
          document.documentElement.style.overflow = "";
          ScrollTrigger.refresh();
          dispatchEvent(new Event("anika:index-ready"));
        },
      });
    },
  });
}

// Precision reticle at rest; contextual action cursor over interactive elements.
if (matchMedia("(pointer:fine)").matches) {
  const ring = document.querySelector(".cursor"),
    dot = document.querySelector(".cursor-dot"),
    label = document.querySelector("[data-cursor-label]");
  let mx = -100,
    my = -100,
    rx = -100,
    ry = -100;
  addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  });
  gsap.ticker.add(() => {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
  });
  document.querySelectorAll("a,button").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.classList.add("is-active");
      label.textContent = "OPEN";
    });
    el.addEventListener("mouseleave", () => {
      ring.classList.remove("is-active");
      label.textContent = "";
    });
  });
  document.querySelectorAll(".product-swiper,.product").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.classList.add("is-drag", "is-active");
      label.textContent = "DRAG";
    });
    el.addEventListener("mouseleave", () => {
      ring.classList.remove("is-drag", "is-active");
      label.textContent = "";
    });
  });
  document.querySelectorAll(".app-panels article").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.classList.add("is-active");
      label.textContent = "VIEW";
    });
    el.addEventListener("mouseleave", () => {
      ring.classList.remove("is-active");
      label.textContent = "";
    });
  });
  addEventListener("mouseleave", () => {
    ring.classList.add("is-hidden");
    dot.classList.add("is-hidden");
  });
  addEventListener("mouseenter", () => {
    ring.classList.remove("is-hidden");
    dot.classList.remove("is-hidden");
  });
  // The orange closing section swallows the orange crosshair, so invert the
  // cursor to white/light over it.
  document.querySelectorAll(".closing").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.classList.add("is-on-orange");
      dot.classList.add("is-on-orange");
    });
    el.addEventListener("mouseleave", () => {
      ring.classList.remove("is-on-orange");
      dot.classList.remove("is-on-orange");
    });
  });
}

const legacyMacSafari = Boolean(window.__anikaLegacyMacSafari);

/* Lenis' interpolated wheel position can fall a frame behind Safari 14's
   sticky repaint on Big Sur. ScrollTrigger then reads the old position and a
   chapter can remain blank until the next wheel gesture. Use the browser's
   native scroll position only on that legacy engine while preserving the
   exact same GSAP/ScrollTrigger animation timelines. */
const createNativeScrollController = () => {
  const listeners = new Set();
  let stopped = false;
  const notify = () => {
    const root = document.documentElement;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const payload = {
      scroll: scrollY,
      progress: Math.max(0, Math.min(1, scrollY / max)),
    };
    listeners.forEach((listener) => listener(payload));
  };
  addEventListener("scroll", notify, { passive: true });
  requestAnimationFrame(notify);
  return {
    on(event, listener) {
      if (event === "scroll" && typeof listener === "function") {
        listeners.add(listener);
      }
    },
    raf() {},
    scrollTo(target) {
      const element = typeof target === "string" ? document.querySelector(target) : null;
      const top = element ? element.getBoundingClientRect().top + scrollY : Number(target);
      if (Number.isFinite(top)) window.scrollTo(0, top);
    },
    stop() {
      if (stopped) return;
      stopped = true;
      document.documentElement.style.overflow = "hidden";
    },
    start() {
      if (!stopped) return;
      stopped = false;
      document.documentElement.style.overflow = "";
      ScrollTrigger.refresh();
    },
  };
};

const lenis = legacyMacSafari
  ? createNativeScrollController()
  : new Lenis({
      lerp: 0.11,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
    });
// Expose the single scroll controller for deterministic refreshes and
// cross-browser diagnostics without creating a second competing instance.
window.__anikaLenis = lenis;
lenis.on("scroll", ScrollTrigger.update);
const pageCompletion = document.querySelector(".page-completion i");
lenis.on("scroll", ({ progress }) => {
  if (pageCompletion) pageCompletion.style.transform = `scaleX(${progress})`;
});
if (!legacyMacSafari) gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

const criticalEnvironments = document.querySelector("#applications");
const secondIndexHero = document.querySelector('[data-index-hero="02"]');
if (criticalEnvironments && secondIndexHero) {
  secondIndexHero.after(criticalEnvironments);
}

// Mobile navigation: toggle the dropdown panel that replaces the desktop nav.
const mnavToggle = document.querySelector("[data-mnav-toggle]"),
  mnavPanel = document.querySelector("[data-mnav-panel]");
if (mnavToggle && mnavPanel) {
  const closeMnav = () => {
    mnavToggle.setAttribute("aria-expanded", "false");
    mnavPanel.classList.remove("is-open");
  };
  mnavToggle.addEventListener("click", () => {
    const open = mnavToggle.getAttribute("aria-expanded") === "true";
    mnavToggle.setAttribute("aria-expanded", String(!open));
    mnavPanel.classList.toggle("is-open", !open);
  });
  mnavPanel.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMnav();
  });
  document.addEventListener("click", (event) => {
    if (
      mnavPanel.classList.contains("is-open") &&
      !event.target.closest("[data-mnav-panel]") &&
      !event.target.closest("[data-mnav-toggle]")
    )
      closeMnav();
  });
}

// Change the navigation glass to complement the section beneath it.
const siteHeader = document.querySelector("header");
const setHeaderTheme = (theme) => {
  if (!siteHeader) return;
  siteHeader.classList.toggle("is-orange-glass", theme === "orange");
  siteHeader.classList.toggle("is-light-section", theme === "light");
  siteHeader.classList.toggle("is-black-glass", theme === "black");
};
setHeaderTheme("black");
document
  .querySelectorAll("main > section:not([hidden])")
  .forEach((section) => {
    const theme = section.matches(".product-parade")
      ? "orange"
      : section.matches(".proof")
        ? "light"
        : "black";
    ScrollTrigger.create({
      trigger: section,
      start: () => `top ${siteHeader?.offsetHeight || 86}px`,
      end: () => `bottom ${siteHeader?.offsetHeight || 86}px`,
      onEnter: () => setHeaderTheme(theme),
      onEnterBack: () => setHeaderTheme(theme),
    });
  });

let heroOneWordTween;
document.querySelectorAll("[data-index-words]").forEach((heading) => {
  const split = new SplitText(heading, {
    type: "words,lines",
    linesClass: "index-word-line",
  });
  gsap.set(split.lines, { overflow: "visible" });
  const isFirstHero = Boolean(heading.closest(".hero-01"));
  const tween = gsap.from(split.words, {
    scrollTrigger: isFirstHero
      ? undefined
      : {
          trigger: heading,
          start: "top 82%",
          once: true,
        },
    paused: isFirstHero,
    opacity: 0,
    yPercent: 70,
    color: "#ff7a00",
    duration: 0.55,
    stagger: 0.1,
    ease: "power3.out",
  });
  if (isFirstHero) heroOneWordTween = tween;
});
const heroOneSealTween = gsap.from(".hero-01 .h1-seal", {
  scale: 0.76,
  clipPath: "circle(0% at 50% 50%)",
  duration: 1.45,
  ease: "expo.out",
  paused: true,
});
const heroOneCopyTween = gsap.from(
  ".hero-01 .h1-copy .index-copy,.hero-01 .h1-copy .index-action",
  {
  opacity: 0,
  x: -28,
  duration: 0.7,
  stagger: 0.14,
    paused: true,
  },
);
let heroOnePlayed = false;
function playIndexHero() {
  if (heroOnePlayed) return;
  heroOnePlayed = true;
  heroOneWordTween.play();
  heroOneSealTween.play();
  gsap.delayedCall(0.55, () => heroOneCopyTween.play());
}
if (boot?.hasAttribute("data-page-loader")) {
  addEventListener("anika:page-ready", playIndexHero, { once: true });
} else if (bootWasSeen) {
  playIndexHero();
} else {
  addEventListener("anika:index-ready", playIndexHero, { once: true });
}
gsap.to(".hero-01 .signal-stack", {
  yPercent: -22,
  ease: "none",
  scrollTrigger: {
    trigger: ".hero-01",
    start: "top top",
    end: "bottom top",
    scrub: 0.7,
  },
});
gsap.to(".hero-02 .h2-scan", {
  left: "78%",
  ease: "none",
  scrollTrigger: {
    trigger: ".hero-02",
    start: "top bottom",
    end: "bottom top",
    scrub: 0.6,
  },
});
gsap.to(".hero-02 .h2-word", {
  xPercent: -7,
  ease: "none",
  scrollTrigger: {
    trigger: ".hero-02",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
});
document
  .querySelectorAll('.index-action[href^="#"]')
  .forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      lenis.scrollTo(link.getAttribute("href"), { duration: 1.25 });
    }),
  );
const techProducts = [...document.querySelectorAll("[data-tech-product]")],
  techChapters = [...document.querySelectorAll("[data-tech-chapter]")],
  techNav = [...document.querySelectorAll("[data-tech-nav]")],
  techCount = document.querySelector("[data-tech-count]"),
  techStatus = document.querySelector("[data-tech-status]"),
  techProgress = document.querySelector("[data-tech-progress]");
const techLabels = ["ANALYZE", "CAPTURE", "TARGET", "VOLUME", "RESET"];
techChapters.forEach((chapter) => {
  const split = new SplitText(chapter.querySelector("h2"), {
    type: "lines,words",
  });
  gsap.set(split.lines, {
    overflow: "visible",
    paddingBottom: "0.12em",
    marginBottom: "-0.12em",
  });
  chapter._headingWords = split.words;
  chapter._headingColors = split.words.map(
    (word) => getComputedStyle(word).color,
  );
});
let techActive = 0;
function showTechChapter(next) {
  if (next === techActive) return;
  const direction = next > techActive ? 1 : -1,
    oldProduct = techProducts[techActive],
    nextProduct = techProducts[next],
    oldChapter = techChapters[techActive],
    nextChapter = techChapters[next];
  gsap.killTweensOf([...techProducts, ...techChapters]);
  oldProduct.classList.remove("is-active");
  oldChapter.classList.remove("is-active");
  gsap.to(oldProduct, {
    xPercent: direction * -14,
    scale: 0.9,
    opacity: 0,
    duration: 0.38,
    ease: "power2.in",
  });
  gsap.to(oldChapter, { y: direction * -24, opacity: 0, duration: 0.24 });
  nextProduct.classList.add("is-active");
  nextChapter.classList.add("is-active");
  gsap.fromTo(
    nextProduct,
    {
      xPercent: direction * 18,
      scale: 0.84,
      rotation: direction * 3,
      opacity: 0,
    },
    {
      xPercent: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 0.72,
      ease: "power3.out",
    },
  );
  gsap.fromTo(
    nextChapter,
    { y: direction * 28, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.48, ease: "power3.out" },
  );
  gsap.fromTo(
    nextChapter._headingWords,
    { yPercent: 90, opacity: 0, color: "#ff7a00" },
    {
      yPercent: 0,
      opacity: 1,
      color: (index) => nextChapter._headingColors[index],
      stagger: 0.055,
      duration: 0.55,
      ease: "power3.out",
    },
  );
  gsap.fromTo(
    nextChapter.querySelectorAll(
      ":scope > span, :scope > p, .technology-tags span, .chapter-action",
    ),
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, stagger: 0.045, duration: 0.42, delay: 0.08 },
  );
  techNav.forEach((button, index) =>
    button.classList.toggle("is-active", index === next),
  );
  techCount.textContent = `${String(next + 1).padStart(2, "0")} / 05`;
  techStatus.textContent = `${techLabels[next]} / ${String(next + 1).padStart(2, "0")}`;
  techProgress.style.transform = `scaleX(${(next + 1) / 5})`;
  techActive = next;
}
gsap.from(".technology-system", {
  y: 45,
  opacity: 0,
  duration: 0.8,
  scrollTrigger: { trigger: ".technology", start: "top 75%" },
});
gsap.from(techProducts[0], {
  scale: 0.84,
  y: 35,
  opacity: 0,
  duration: 0.9,
  ease: "power3.out",
  scrollTrigger: { trigger: ".technology", start: "top 70%" },
});
gsap.from(
  techChapters[0].querySelectorAll(
    ":scope > span, :scope > p, .technology-tags span, .chapter-action",
  ),
  {
    y: 22,
    opacity: 0,
    stagger: 0.055,
    duration: 0.55,
    ease: "power3.out",
    scrollTrigger: { trigger: ".technology", start: "top 68%" },
  },
);
ScrollTrigger.create({
  trigger: ".technology",
  start: "top top",
  end: "bottom bottom",
  onUpdate: ({ progress }) =>
    showTechChapter(Math.min(4, Math.round(progress * 4))),
});
techNav.forEach((button, index) =>
  button.addEventListener("click", () => {
    const section = document.querySelector(".technology");
    lenis.scrollTo(
      section.offsetTop + (section.offsetHeight - innerHeight) * (index / 4),
      { duration: 1.05 },
    );
  }),
);

// Page-wide heading language: reveal once when the heading actually intersects
// the viewport. This avoids stale ScrollTrigger geometry after tall pinned and
// content-visibility sections change the document height.
const observeWordReveal = (heading, options = {}) => {
  const split = new SplitText(heading, { type: "lines,words" });
  gsap.set(split.lines, {
    overflow: "visible",
    paddingBottom: "0.12em",
    marginBottom: "-0.12em",
  });
  const resolvedColors = split.words.map(
    (word) => getComputedStyle(word).color,
  );
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      gsap.fromTo(
        split.words,
        { yPercent: options.yPercent ?? 72, opacity: 0, color: "#ff7a00" },
        {
          yPercent: 0,
          opacity: 1,
          color: (index) => resolvedColors[index],
          duration: options.duration ?? 0.72,
          stagger: options.stagger ?? 0.065,
          ease: "power3.out",
          overwrite: true,
          onComplete: () =>
            gsap.set(split.words, { clearProps: "transform,opacity" }),
        },
      );
    },
    { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
  );
  observer.observe(heading);
  return split;
};

[
  ...document.querySelectorAll(
    "main section:not(.hero) h2, main section:not(.hero) h3",
  ),
]
  .filter(
    (heading) =>
      !heading.closest("dialog") &&
      !heading.closest(".technology-chapter") &&
      !heading.closest(".index-hero-showcase") &&
      !heading.closest(".product-parade") &&
      !heading.closest(".applications"),
  )
  .forEach((heading) => observeWordReveal(heading));

const aactsModal = document.querySelector("[data-aacts-modal]");
document.querySelector("[data-aacts-open]")?.addEventListener("click", () => {
  aactsModal?.showModal();
  lenis.stop();
  document.body.classList.add("modal-open");
});
const closeAactsModal = () => {
  aactsModal?.close();
  lenis.start();
  document.body.classList.remove("modal-open");
};
document
  .querySelector("[data-aacts-close]")
  ?.addEventListener("click", closeAactsModal);
aactsModal?.addEventListener("click", (event) => {
  if (event.target === aactsModal) closeAactsModal();
});
aactsModal?.addEventListener("close", () => {
  lenis.start();
  document.body.classList.remove("modal-open");
});
const proofOverview = document.querySelector("[data-proof-overview]"),
  proofCards = [...document.querySelectorAll(".proof-list article")],
  proofCurrent = document.querySelector("[data-proof-current]"),
  proofProgress = document.querySelector("[data-proof-progress]");
function updateProofCard(active) {
  proofCards.forEach((card, index) =>
    card.classList.toggle("is-active", index === active),
  );
  if (proofCurrent) {
    proofCurrent.textContent = `${String(active + 1).padStart(2, "0")} / 06`;
  }
  if (proofProgress) {
    proofProgress.style.transform = `scaleX(${(active + 1) / 6})`;
  }
}
// Desktop scroll-scrubs a single active card at a time. Mobile has no pinned
// scroll driver, so every card is shown in its resting active state instead of
// leaving only card 01 highlighted.
if (matchMedia("(min-width:801px)").matches) {
  proofCards[0]?.classList.add("is-active");
} else {
  proofCards.forEach((card) => card.classList.add("is-active"));
}
if (proofOverview && matchMedia("(min-width:801px)").matches) {
  ScrollTrigger.create({
    trigger: proofOverview,
    start: "top top",
    end: "bottom bottom",
    invalidateOnRefresh: true,
    onEnter: () => updateProofCard(0),
    onEnterBack: () => updateProofCard(5),
    onLeave: () => updateProofCard(5),
    onUpdate: ({ progress }) => {
      // Give every one of the six cards an equal scroll interval. Rounding
      // across five intervals made the end cards brief and easy to skip.
      const active = Math.min(5, Math.floor(progress * 6));
      updateProofCard(active);
    },
  });
}
gsap.set(".closing>*", { clearProps: "transform,opacity" });
const capWorkflow = document.querySelector("[data-cap-workflow]"),
  capSteps = [...document.querySelectorAll(".cap-loop-steps article")],
  capSignal = document.querySelector("[data-cap-signal]"),
  capIndex = document.querySelector("[data-cap-index]"),
  capBar = document.querySelector("[data-cap-bar]"),
  capState = document.querySelector("[data-cap-state]"),
  capStatus = document.querySelector("[data-cap-status]"),
  capMetric = document.querySelector("[data-cap-metric]");
const capStates = [
  ["SAMPLE RECEIVED", "Input ready", "Sample ready"],
  ["ION FORMATION", "Ionizing", "Ions formed"],
  ["AXIAL MOBILITY", "Dual polarity", "Pattern resolving"],
  ["SIGNAL PROCESSING", "Interpreting", "Spectrum active"],
  ["SIGNATURE MATCH", "Result ready", "Match complete"],
];
if (capWorkflow && !capWorkflow.hidden && innerWidth > 800) {
  ScrollTrigger.create({
    trigger: capWorkflow,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      const n = Math.min(4, Math.floor(self.progress * 5)),
        state = capStates[n];
      capSteps.forEach((step, i) => step.classList.toggle("active", i === n));
      capIndex.textContent = String(n + 1).padStart(2, "0");
      capBar.style.transform = `scaleX(${(n + 1) / 5})`;
      capState.textContent = state[0];
      capStatus.textContent = state[1];
      capMetric.textContent = state[2];
      capSignal.style.strokeDashoffset = String(1800 - self.progress * 1800);
    },
  });
} else if (capSignal) {
  capSignal.style.strokeDashoffset = "0";
}
const appSection = document.querySelector(".applications"),
  appScenes = [...document.querySelectorAll(".app-panels article")],
  appButtons = [...document.querySelectorAll(".app-nav button")];
const appHeadingTitle = document.querySelector(".app-heading h2"),
  appHeadingCopy = document.querySelector(".app-heading p");
const appMeta = [
  [
    "Secure every point<br>of passage.",
    "From terminals to port lanes, active chemical intelligence protects movement without becoming the bottleneck.",
  ],
  [
    "Turn trace evidence<br>into action.",
    "Give field teams a faster chemical decision across checkpoints, investigations and interdiction operations.",
  ],
  [
    "Protect continuity<br>at the source.",
    "Monitor high-consequence facilities before a trace event can become an operational interruption.",
  ],
  [
    "Inspect the flow.<br>Keep it moving.",
    "Screen vehicles, containers and refrigerated cargo without dismantling the logistics chain.",
  ],
  [
    "Preserve evidence.<br>Maintain readiness.",
    "Bring controlled trace collection and chemical analysis into secure facilities and field forensic operations.",
  ],
];
let appActive = 0;
appScenes[0].classList.add("is-active");
gsap.set(appScenes[0].querySelector(".scene-bg"), {
  willChange: "transform",
});
gsap.fromTo(
  appScenes[0].querySelector(".scene-bg"),
  { scale: 1.16, xPercent: 3, yPercent: 2 },
  {
    scale: 1.04,
    xPercent: -2,
    yPercent: -1,
    duration: 5.2,
    ease: "none",
    onComplete: () =>
      gsap.set(appScenes[0].querySelector(".scene-bg"), {
        clearProps: "willChange",
      }),
  },
);
function showEnvironment(next) {
  if (next === appActive) return;
  const old = appScenes[appActive],
    scene = appScenes[next];
  gsap.killTweensOf([
    ...appScenes,
    appHeadingTitle,
    appHeadingCopy,
    ...appScenes.flatMap((item) => [...item.querySelectorAll("b,div>*")]),
  ]);
  gsap.set(
    [
      ...appScenes.map((item) => item.querySelector(".scene-bg")),
      appHeadingTitle,
      appHeadingCopy,
      ...appScenes.flatMap((item) => [...item.querySelectorAll("div>*")]),
    ],
    { clearProps: "willChange" },
  );
  old.classList.remove("is-active");
  gsap.set(old, {
    opacity: 0,
    zIndex: 1,
    visibility: "hidden",
    ...(legacyMacSafari ? { display: "none" } : {}),
  });
  scene.classList.add("is-active");
  gsap.set(scene, {
    opacity: 1,
    zIndex: 4,
    visibility: "visible",
    ...(legacyMacSafari ? { display: "block" } : {}),
  });
  scene.classList.remove("is-scanning");
  void scene.offsetWidth;
  scene.classList.add("is-scanning");
  gsap.set(scene.querySelector("b"), { x: 0, opacity: 1 });
  const sceneCopy = scene.querySelectorAll("div>*");
  gsap.set(sceneCopy, { willChange: "transform, opacity" });
  gsap.fromTo(
    sceneCopy,
    { x: next > appActive ? 45 : -45, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      stagger: 0.045,
      duration: 0.42,
      delay: 0.08,
      onComplete: () => gsap.set(sceneCopy, { clearProps: "willChange" }),
    },
  );
  const bg = scene.querySelector(".scene-bg"),
    direction = next % 2 === 0 ? -1 : 1;
  if (legacyMacSafari) {
    /* Safari 14 fails to repaint a picture layer that was hidden while it had
       an active 3D transform. The scene transition still animates its copy;
       keep the decoded photograph on a stable, untransformed paint layer. */
    gsap.set(bg, { clearProps: "transform,willChange" });
    void bg.offsetHeight;
  } else {
    gsap.set(bg, { willChange: "transform" });
    gsap.fromTo(
      bg,
      { scale: 1.16, xPercent: direction * 3, yPercent: 2 },
      {
        scale: 1.04,
        xPercent: direction * -2,
        yPercent: -1,
        duration: 5.2,
        ease: "none",
        onComplete: () => gsap.set(bg, { clearProps: "willChange" }),
      },
    );
  }
  appHeadingTitle.innerHTML = appMeta[next][0];
  appHeadingCopy.textContent = appMeta[next][1];
  gsap.set([appHeadingTitle, appHeadingCopy], {
    willChange: "transform, opacity",
  });
  gsap.fromTo(
    [appHeadingTitle, appHeadingCopy],
    { opacity: 0, y: next > appActive ? 16 : -16 },
    {
      opacity: 1,
      y: 0,
      stagger: 0.045,
      duration: 0.36,
      overwrite: true,
      onComplete: () =>
        gsap.set([appHeadingTitle, appHeadingCopy], {
          clearProps: "willChange",
        }),
    },
  );
  appButtons.forEach((b, i) => b.classList.toggle("active", i === next));
  appActive = next;
}
const appTrigger = ScrollTrigger.create({
  trigger: appSection,
  start: "top top",
  end: "bottom bottom",
  invalidateOnRefresh: true,
  onUpdate: (self) =>
    showEnvironment(Math.min(4, Math.floor(self.progress * 5))),
});
appButtons.forEach((button, i) =>
  button.addEventListener("click", () => {
    const target =
      appSection.offsetTop + (appSection.offsetHeight - innerHeight) * (i / 4);
    lenis.scrollTo(target, { duration: 1.1 });
  }),
);

// Safari / iOS fix — the "Critical environments" panels (01→05) are driven by
// this pinned section's measured scroll length. Two Safari behaviours corrupt
// that length so panels 02–05 collapse and scroll shoots into the next section:
//   1. The five scene backgrounds are CSS background-images decoded lazily and
//      late, so the section's height isn't final when ScrollTrigger first measures.
//   2. On iOS the URL bar collapses while scrolling, which resizes 100vh (and
//      therefore the section's 520vh/450vh height) after the pin range was cached.
// Preload the scenes, then re-measure once they and the page loader have settled,
// and re-measure again whenever the viewport actually changes size.
{
  const decodeScene = (article) => {
    const raw =
      article.style.getPropertyValue("--scene-mobile") &&
      matchMedia("(max-width: 720px)").matches
        ? article.style.getPropertyValue("--scene-mobile")
        : article.style.getPropertyValue("--scene");
    const url = raw.replace(/^\s*url\(["']?/, "").replace(/["']?\)\s*$/, "");
    if (!url) return Promise.resolve();
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.fetchPriority = "high";
      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode().catch(() => {}).finally(resolve);
        } else {
          resolve();
        }
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  };

  const refreshApp = () => {
    if (appTrigger) appTrigger.refresh();
    else ScrollTrigger.refresh();
  };

  Promise.all(appScenes.map(decodeScene)).then(refreshApp);
  addEventListener("anika:page-ready", refreshApp, { once: true });
  addEventListener("anika:index-ready", refreshApp, { once: true });

  // Only refresh on genuine viewport-width or meaningful height changes — not on
  // every iOS URL-bar nudge — so the pin math is corrected without thrashing.
  let lastW = innerWidth;
  let lastH = innerHeight;
  let resizeRaf = 0;
  addEventListener(
    "resize",
    () => {
      const widthChanged = innerWidth !== lastW;
      const heightJumped = Math.abs(innerHeight - lastH) > 120;
      if (!widthChanged && !heightJumped) return;
      lastW = innerWidth;
      lastH = innerHeight;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(refreshApp);
    },
    { passive: true },
  );
  addEventListener("orientationchange", () => {
    lastW = innerWidth;
    lastH = innerHeight;
    setTimeout(refreshApp, 300);
  });
}

// Product platform / on-scroll: alternating chapters tied to the existing Lenis + GSAP loop.
const productParade = document.querySelector("[data-product-parade]");
if (productParade) {
  const rows = [...productParade.querySelectorAll("[data-parade-row]")];
  const dots = [...productParade.querySelectorAll(".parade-progress b")];
  const progress = productParade.querySelector(".parade-progress");

  const setParadeChapter = (index) => {
    dots.forEach((dot, dotIndex) =>
      dot.classList.toggle("is-active", dotIndex === index),
    );
  };

  rows.forEach((row, index) => {
    const media = row.querySelector(".parade-media");
    const mediaImage = media.querySelector("img");
    const copy = row.querySelector(".parade-copy");
    const title = copy.querySelector("h3");
    const description = copy.querySelector(":scope > p");
    const meta = copy.querySelectorAll(
      ".parade-index, :scope > small, .parade-tags, .parade-action",
    );
    const word = row.querySelector(".parade-word");
    const reversed = row.classList.contains("is-reverse");
    const paradeReducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const setHint = (target, value) =>
      gsap.set(target, { willChange: value });
    const clearHint = (target) =>
      gsap.set(target, { clearProps: "willChange" });

    /* SplitText preserves the headline's <em> styling and line breaks while
       giving every glyph a Safari-safe opacity/transform typing reveal. */
    const titleSplit = paradeReducedMotion
      ? null
      : new SplitText(title, {
          type: "words,chars",
          wordsClass: "parade-type-word",
          charsClass: "parade-type-char",
        });
    const descriptionSplit = paradeReducedMotion
      ? null
      : new SplitText(description, {
          type: "words",
          wordsClass: "parade-copy-word",
        });

    if (!paradeReducedMotion) {
      gsap.set(media, {
        opacity: 1,
        y: 0,
        scale: 1,
        clipPath: "none",
      });
      gsap.set(mediaImage, {
        opacity: 0,
        y: 28,
        scale: 1.035,
        force3D: true,
      });
      gsap.set(meta, { opacity: 0, y: 12 });
      gsap.set(titleSplit.chars, {
        opacity: 0,
        yPercent: 30,
        color: "#ff7a00",
      });
      gsap.set(descriptionSplit.words, { opacity: 0, y: 8 });

      /* The product render has its own fixed early reveal. Its timing no longer
         depends on headline length, and only opacity/transform are composited. */
      gsap.to(mediaImage, {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: media,
          start: "top 94%",
          end: "top 58%",
          scrub: 0.34,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onEnter: () => setHint(mediaImage, "transform, opacity"),
          onEnterBack: () => setHint(mediaImage, "transform, opacity"),
          onLeave: () => clearHint(mediaImage),
          onLeaveBack: () => clearHint(mediaImage),
        },
      });

      const reveal = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: copy,
          start: "top 91%",
          end: "top 48%",
          scrub: 0.4,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          onEnter: () => {
            setParadeChapter(index);
            title.classList.add("is-typing");
            setHint(
              [titleSplit.chars, descriptionSplit.words, meta],
              "transform, opacity, color",
            );
          },
          onEnterBack: () => title.classList.add("is-typing"),
          onLeave: () => {
            title.classList.remove("is-typing");
            clearHint([titleSplit.chars, descriptionSplit.words, meta]);
          },
          onLeaveBack: () => {
            title.classList.remove("is-typing");
            clearHint([titleSplit.chars, descriptionSplit.words, meta]);
          },
        },
      });

      reveal
        .to(
          meta,
          {
            opacity: 1,
            y: 0,
            duration: 0.12,
            stagger: 0.025,
          },
          0.1,
        )
        .to(
          titleSplit.chars,
          {
            opacity: 1,
            yPercent: 0,
            color: "#ff7a00",
            duration: 0.035,
            stagger: 0.018,
          },
          0.14,
        )
        .to(
          titleSplit.chars,
          {
            color: "#f4f6f7",
            duration: 0.035,
            stagger: 0.018,
          },
          0.3,
        )
        .to(
          descriptionSplit.words,
          {
            opacity: 1,
            y: 0,
            duration: 0.07,
            stagger: 0.012,
          },
          0.48,
        );
    } else {
      setParadeChapter(index);
    }

    gsap.to(word, {
      xPercent: reversed ? 10 : -10,
      ease: "none",
      scrollTrigger: {
        trigger: row,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onEnter: () => setHint(word, "transform"),
        onEnterBack: () => setHint(word, "transform"),
        onLeave: () => clearHint(word),
        onLeaveBack: () => clearHint(word),
      },
    });
  });

  ScrollTrigger.create({
    trigger: productParade,
    start: "top 62%",
    end: "bottom 38%",
    onToggle: ({ isActive }) =>
      progress.classList.toggle("is-visible", isActive),
    onUpdate: ({ progress: sectionProgress }) =>
      setParadeChapter(
        Math.min(rows.length - 1, Math.floor(sectionProgress * rows.length)),
      ),
  });

  // SplitText adds inline wrappers and can change line wrapping by a few pixels.
  // Measure once after every parade row has its final DOM in both WebKit and
  // Chromium, otherwise early Chrome measurements can leave the fade at zero.
  requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()));
}

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const smallRenderQuery = window.matchMedia("(max-width: 800px)");

// Lightweight GLSL field: slow orange chemical clouds with ordered dither.
const shaderCanvas = document.querySelector(".shader-bg");
if (shaderCanvas && window.THREE) {
  const renderer = new THREE.WebGLRenderer({
    canvas: shaderCanvas,
    alpha: true,
    antialias: false,
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, smallRenderQuery.matches ? 1 : 1.5),
  );
  const scene = new THREE.Scene(),
    camera = new THREE.Camera();
  const uniforms = { uTime: { value: 0 }, uRes: { value: new THREE.Vector2() } };
  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms,
    vertexShader: `void main(){gl_Position=vec4(position,1.);}`,
    fragmentShader: `precision mediump float;uniform float uTime;uniform vec2 uRes;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}void main(){vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;float n=0.;vec2 p=uv*2.2;for(int i=0;i<4;i++){n+=noise(p+uTime*.035)/pow(2.,float(i)+1.);p=p*2.05+1.7;}float cloud=smoothstep(.47,.78,n+.13*sin(uv.x*3.-uTime*.08));float d=step(.48,hash(floor(gl_FragCoord.xy/2.)));vec3 orange=vec3(1.,.25,0.);gl_FragColor=vec4(orange,cloud*(.05+.025*d));}`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  function sizeShader() {
    const r = shaderCanvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    uniforms.uRes.value.set(
      r.width * renderer.getPixelRatio(),
      r.height * renderer.getPixelRatio(),
    );
  }
  sizeShader();
  addEventListener("resize", sizeShader);

  const renderShader = (t) => {
    uniforms.uTime.value = t * 0.001;
    renderer.render(scene, camera);
  };

  // Only run the WebGL loop while the hero canvas is actually on screen and
  // the tab is visible. This keeps the GPU idle for the rest of the page and
  // in background tabs. Resuming re-renders immediately, so there is no blank
  // frame — the look and behaviour are identical to always-on.
  let shaderInView = true;
  const applyShaderState = () => {
    const shouldRun =
      shaderInView && !document.hidden && !reducedMotionQuery.matches;
    renderer.setAnimationLoop(shouldRun ? renderShader : null);
    // Paint one frame on activation (or in reduced-motion mode) so the
    // visual remains identical even while its continuous loop is dormant.
    if (shaderInView && !document.hidden) renderShader(performance.now());
  };
  applyShaderState();

  const shaderTarget =
    shaderCanvas.closest(".hero-sticky") ||
    shaderCanvas.parentElement ||
    shaderCanvas;
  const shaderObserver = new IntersectionObserver(
    (entries) => {
      shaderInView = entries[0].isIntersecting;
      applyShaderState();
    },
    { rootMargin: "120px" },
  );
  shaderObserver.observe(shaderTarget);
  document.addEventListener("visibilitychange", applyShaderState);
  reducedMotionQuery.addEventListener("change", applyShaderState);
}

// Canvas film grain is live only around the visible hero. Elsewhere the last
// painted frame remains in place, preserving the look without background work.
const grain = document.querySelector(".film-grain"),
  gctx = grain.getContext("2d", { alpha: true });
let grainTick = 0;
function sizeGrain() {
  const divisor = smallRenderQuery.matches ? 5 : 3;
  grain.width = Math.ceil(innerWidth / divisor);
  grain.height = Math.ceil(innerHeight / divisor);
}
sizeGrain();
addEventListener("resize", sizeGrain);
let grainRafId = 0;
function drawGrain(t) {
  const interval = smallRenderQuery.matches ? 140 : 70;
  if (t - grainTick > interval) {
    const im = gctx.createImageData(grain.width, grain.height);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = Math.random() * 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 24;
    }
    gctx.putImageData(im, 0, 0);
    grainTick = t;
  }
  grainRafId = requestAnimationFrame(drawGrain);
}
// The grain is a full-page overlay, so it stays active while the tab is
// visible, but the loop stops entirely in a hidden tab instead of allocating
// a fresh noise buffer several times a second in the background.
function startGrain() {
  if (!grainRafId) grainRafId = requestAnimationFrame(drawGrain);
}
function stopGrain() {
  if (grainRafId) {
    cancelAnimationFrame(grainRafId);
    grainRafId = 0;
  }
}
let grainInView = false;
const applyGrainState = () => {
  const shouldRun =
    grainInView && !document.hidden && !reducedMotionQuery.matches;
  if (shouldRun) startGrain();
  else stopGrain();
  if (grainInView && !document.hidden && reducedMotionQuery.matches) {
    grainTick = 0;
    drawGrain(performance.now());
    stopGrain();
  }
};
const hiddenLegacyHero = document.querySelector(".hero-sticky");
const grainTarget =
  (hiddenLegacyHero?.offsetParent ? hiddenLegacyHero : null) ||
  document.querySelector('[data-index-hero="01"]') ||
  hiddenLegacyHero;
if (grainTarget) {
  new IntersectionObserver(
    ([entry]) => {
      grainInView = entry.isIntersecting;
      applyGrainState();
    },
    { rootMargin: "120px" },
  ).observe(grainTarget);
}
document.addEventListener("visibilitychange", applyGrainState);
reducedMotionQuery.addEventListener("change", applyGrainState);
smallRenderQuery.addEventListener("change", () => {
  sizeGrain();
  grainTick = 0;
  applyGrainState();
});

// Footer: an intentional final reveal with live India time and restrained brand motion.
const footer = document.querySelector("[data-footer]");
if (footer) {
  const footerTitle = footer.querySelector(".footer-statement h2");
  if (footerTitle) {
    observeWordReveal(footerTitle, {
      yPercent: 80,
      duration: 0.8,
      stagger: 0.08,
    });
  }
  const footerObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      footerObserver.disconnect();
      gsap.fromTo(
        ".footer-top > *, .footer-statement > :not(h2), .footer-nav > div",
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.65, ease: "power3.out" },
      );
      gsap.fromTo(
        ".footer-seal",
        { scale: 0.82, opacity: 0, rotation: -8 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.9, ease: "power3.out" },
      );
    },
    { threshold: 0.04 },
  );
  footerObserver.observe(footer);
  gsap.fromTo(
    ".footer-wordmark",
    { clipPath: "inset(0 100% 0 0)", xPercent: -4 },
    {
      clipPath: "inset(0 0% 0 0)",
      xPercent: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".footer-wordmark",
        // Complete the reveal while the wordmark is still comfortably in view.
        // On shorter desktop viewports the footer can sit at the very bottom
        // of the scroll range, so ending too high up (top 62%) left the word
        // permanently part-clipped ("ANIKA STER…"). Finishing near the bottom
        // of the viewport guarantees it fully reveals on every screen.
        start: "top 98%",
        // The stacked mobile footer ends with the wordmark around 86% of the
        // viewport even at maximum scroll, so the desktop 82% endpoint is
        // unreachable and leaves "STERILIS" clipped. Finish earlier on phones.
        end: matchMedia("(max-width: 700px)").matches ? "top 94%" : "top 82%",
        scrub: 0.8,
      },
    },
  );
  gsap.to(".footer-logo i", {
    xPercent: 300,
    duration: 1.3,
    repeat: -1,
    repeatDelay: 3.2,
    ease: "power2.inOut",
  });
  gsap.to(".footer-seal > div", {
    rotation: 55,
    ease: "none",
    scrollTrigger: {
      trigger: footer,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
  gsap.to(".footer-seal img", {
    rotation: -55,
    ease: "none",
    scrollTrigger: {
      trigger: footer,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });

  const footerTime = document.querySelector("[data-footer-time]");
  const updateFooterTime = () => {
    footerTime.textContent = `${new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date())} IST`;
  };
  let footerTimer = 0;
  const syncFooterClock = () => {
    clearInterval(footerTimer);
    footerTimer = 0;
    if (document.hidden) return;
    updateFooterTime();
    footerTimer = setInterval(updateFooterTime, 30000);
  };
  syncFooterClock();
  document.addEventListener("visibilitychange", syncFooterClock);
}

// Recalculate all scroll ranges after fonts and image dimensions settle.
addEventListener("load", () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
