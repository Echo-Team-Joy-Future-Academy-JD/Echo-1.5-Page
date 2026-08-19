import {
  getMemoryProvider,
  memoryDemoConfig,
} from "./memory-demo-data.js";
import { AmbientGlow } from "video-ambient-glow";
import "./Echo-LongVideo-Page-1.0/assets/case-sections.js";

window.ECHO_CASE_MANIFEST = {
  schemaVersion: 1,
  groups: {
    long: [
      {
        title: "Echo 1.5 · Blue Beard Long Case",
        description: "Memory-driven long-form generation showcase.",
        src: "./media/source/blue-beard-long.mp4",
        poster: "./media/blue-beard/visual/shot-01/frame-04.jpg",
        type: "video/mp4",
      },
    ],
    short: Array.from({ length: 6 }, (_, index) => {
      const shot = String(index + 1).padStart(2, "0");
      return {
        title: `Memory Shot ${shot}`,
        description: "Ten-second shot extracted from the Echo 1.5 long case.",
        src: `./media/blue-beard/shots/shot-${shot}.mp4`,
        poster: `./media/blue-beard/visual/shot-${shot}/frame-04.jpg`,
        type: "video/mp4",
      };
    }),
  },
};

document.documentElement.dataset.theme = "dark";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const easeOut = (value) => 1 - Math.pow(1 - value, 3);
const smoothStep = (value) => value * value * (3 - 2 * value);
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const introStage = document.querySelector("[data-intro-stage]");
const scrollProgress = document.querySelector("[data-scroll-progress]");
let introFrame = null;

function renderIntro() {
  const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const pageProgress = clamp(window.scrollY / scrollable, 0, 1);
  scrollProgress?.style.setProperty("transform", `scaleX(${pageProgress.toFixed(4)})`);

  if (!introStage) return;

  const distance = Math.max(introStage.offsetHeight - window.innerHeight, 1);
  const progress = clamp((window.scrollY - introStage.offsetTop) / distance, 0, 1);
  const scatter = smoothStep(clamp((progress - 0.18) / 0.32, 0, 1));
  const nextProgress = clamp((progress - 0.18) / 0.64, 0, 1);
  const next = prefersReducedMotion
    ? (progress > 0.5 ? 1 : 0)
    : smoothStep(nextProgress);
  const memoryOpacity = 1 - next * 0.6;

  const nextVisible = next > 0.52;
  const nextSettled = next > 0.995;
  document.body.classList.toggle("is-past-intro", next > 0.88);
  introStage.classList.toggle("is-next-visible", nextVisible);
  introStage.classList.toggle("is-next-settled", nextSettled);
  window.dispatchEvent(new CustomEvent("echo:intro-progress", {
    detail: { progress, nextVisible, nextSettled, transition: next },
  }));

  if (prefersReducedMotion) {
    const showNext = progress > 0.5;
    introStage.style.setProperty("--intro-memory-opacity", showNext ? "0.4" : "1");
    introStage.style.setProperty("--intro-memory-transform", "translate3d(0, 0, 0) scale(1)");
    introStage.style.setProperty("--intro-glow-opacity", showNext ? "0.14" : "0.62");
    introStage.style.setProperty("--intro-progress-opacity", showNext ? "0" : "1");
    introStage.style.setProperty("--intro-next-opacity", showNext ? "1" : "0");
    introStage.style.setProperty("--intro-next-transform", "translate3d(0, 0, 0)");
    document.body.style.setProperty("--intro-nav-opacity", showNext ? "1" : "0");
    document.body.style.setProperty(
      "--intro-nav-transform",
      showNext ? "translate3d(-50%, 0, 0)" : "translate3d(-50%, -16px, 0)",
    );
    return;
  }

  introStage.style.setProperty(
    "--intro-scroll-transform",
    `translate3d(calc(-50% + ${(24 * scatter).toFixed(2)}vw), ${(34 * scatter).toFixed(2)}vh, 0) rotate(${(14 * scatter).toFixed(2)}deg)`,
  );
  introStage.style.setProperty(
    "--intro-scroll-opacity",
    clamp(1 - scatter * 1.25, 0, 1).toFixed(3),
  );
  introStage.style.setProperty(
    "--intro-glow-opacity",
    (0.62 * (0.22 + 0.78 * (1 - next))).toFixed(3),
  );
  introStage.style.setProperty(
    "--intro-memory-opacity",
    memoryOpacity.toFixed(3),
  );
  introStage.style.setProperty(
    "--intro-memory-transform",
    `translate3d(0, ${(-12 * next).toFixed(2)}px, 0) scale(${(1 - 0.018 * next).toFixed(4)})`,
  );
  introStage.style.setProperty(
    "--intro-progress-opacity",
    clamp(1 - next * 1.28, 0, 1).toFixed(3),
  );
  introStage.style.setProperty("--intro-next-opacity", next.toFixed(3));
  introStage.style.setProperty(
    "--intro-next-transform",
    `translate3d(0, ${((1 - next) * 28).toFixed(2)}px, 0) scale(${(0.985 + next * 0.015).toFixed(4)})`,
  );
  document.body.style.setProperty("--intro-nav-opacity", next.toFixed(3));
  document.body.style.setProperty(
    "--intro-nav-transform",
    `translate3d(-50%, ${(-(1 - next) * 16).toFixed(2)}px, 0)`,
  );
}

function scheduleIntro() {
  if (introFrame) return;
  introFrame = window.requestAnimationFrame(() => {
    introFrame = null;
    renderIntro();
  });
}

if (introStage) {
  document.body.classList.add("intro-ready");
  renderIntro();
  window.addEventListener("scroll", scheduleIntro, { passive: true });
  window.addEventListener("resize", renderIntro);
}

if (introStage) {
  let titleGateLocked = false;
  let titleGatePassed = false;
  let titleGateArrived = false;
  let titleGateReleaseReady = false;
  let titleGateIdleTimer = null;
  let titleGateAnimationFrame = null;
  let titleGateAnimating = false;

  const getTitleGate = () => {
    const distance = Math.max(introStage.offsetHeight - window.innerHeight, 1);
    return {
      start: introStage.offsetTop + distance * 0.5,
      target: introStage.offsetTop + distance * 0.86,
    };
  };

  const scheduleTitleGateRelease = () => {
    if (!titleGateArrived) return;
    titleGateReleaseReady = false;
    window.clearTimeout(titleGateIdleTimer);
    titleGateIdleTimer = window.setTimeout(() => {
      titleGateReleaseReady = true;
    }, 140);
  };

  const stopTitleGateAnimation = () => {
    if (titleGateAnimationFrame) {
      window.cancelAnimationFrame(titleGateAnimationFrame);
      titleGateAnimationFrame = null;
    }
    titleGateAnimating = false;
    document.documentElement.classList.remove("is-title-gate-scrolling");
  };

  const animateToTitlePage = (target) => {
    stopTitleGateAnimation();
    const startY = window.scrollY;
    const distance = target - startY;
    const duration = prefersReducedMotion ? 0 : 820;

    if (!duration || Math.abs(distance) < 1) {
      window.scrollTo(0, target);
      titleGateArrived = true;
      scheduleTitleGateRelease();
      return;
    }

    titleGateAnimating = true;
    document.documentElement.classList.add("is-title-gate-scrolling");
    const startedAt = performance.now();

    const step = (time) => {
      const progress = clamp((time - startedAt) / duration, 0, 1);
      const eased = smoothStep(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        titleGateAnimationFrame = window.requestAnimationFrame(step);
        return;
      }

      window.scrollTo(0, target);
      titleGateAnimationFrame = null;
      titleGateAnimating = false;
      document.documentElement.classList.remove("is-title-gate-scrolling");
      titleGateArrived = true;
      scheduleTitleGateRelease();
    };

    titleGateAnimationFrame = window.requestAnimationFrame(step);
  };

  const holdOnTitlePage = () => {
    const { target } = getTitleGate();
    titleGateLocked = true;
    titleGateArrived = false;
    titleGateReleaseReady = false;
    introStage.classList.add("is-title-held");
    animateToTitlePage(target);
  };

  const releaseTitleGate = () => {
    stopTitleGateAnimation();
    titleGateLocked = false;
    titleGatePassed = true;
    titleGateArrived = true;
    titleGateReleaseReady = false;
    introStage.classList.remove("is-title-held");
    window.clearTimeout(titleGateIdleTimer);
  };

  const resetTitleGate = () => {
    titleGateLocked = false;
    titleGatePassed = false;
    titleGateArrived = false;
    titleGateReleaseReady = false;
    introStage.classList.remove("is-title-held");
    window.clearTimeout(titleGateIdleTimer);
    stopTitleGateAnimation();
  };

  const initialGate = getTitleGate();
  titleGatePassed = window.scrollY > initialGate.target + 36;

  window.addEventListener("wheel", (event) => {
    if (event.ctrlKey) return;
    if (event.deltaY < 0) {
      if (titleGateLocked) resetTitleGate();
      return;
    }
    if (event.deltaY === 0) return;
    const { start, target } = getTitleGate();

    if (!titleGateLocked && window.scrollY < start - 96) {
      resetTitleGate();
    }
    if (titleGatePassed) return;

    if (titleGateLocked) {
      if (titleGateReleaseReady && event.deltaY >= 36) {
        releaseTitleGate();
        return;
      }
      event.preventDefault();
      if (titleGateArrived && !titleGateReleaseReady) scheduleTitleGateRelease();
      return;
    }

    const projectedScroll = window.scrollY + Math.max(event.deltaY, 0);
    if (window.scrollY >= start || projectedScroll >= start) {
      event.preventDefault();
      holdOnTitlePage();
      if (Math.abs(window.scrollY - target) > 1) scheduleIntro();
    }
  }, { passive: false });

  window.addEventListener("scroll", () => {
    const { start, target } = getTitleGate();
    if (!titleGateLocked && window.scrollY < start - 96 && titleGatePassed) {
      resetTitleGate();
      return;
    }
    if (titleGateLocked && !titleGateAnimating && window.scrollY > target + 1) {
      window.scrollTo({ top: target, behavior: "instant" });
      return;
    }
    if (titleGateLocked && !titleGateAnimating && Math.abs(window.scrollY - target) <= 1.5) {
      if (!titleGateArrived) titleGateArrived = true;
      scheduleTitleGateRelease();
    }
  }, { passive: true });

  document.addEventListener("click", (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (target && !introStage.contains(target)) releaseTitleGate();
  }, { capture: true });

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const downKeys = ["ArrowDown", "PageDown", " ", "End"];
    if (!downKeys.includes(event.key) || titleGatePassed) return;
    const { start } = getTitleGate();
    const projectedScroll = window.scrollY + window.innerHeight * 0.82;
    if (window.scrollY < start && projectedScroll < start) return;
    if (titleGateLocked && titleGateReleaseReady) {
      releaseTitleGate();
      return;
    }
    event.preventDefault();
    holdOnTitlePage();
  });
}

if (!prefersReducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      document.documentElement.style.setProperty("--pointer-x", x.toFixed(3));
      document.documentElement.style.setProperty("--pointer-y", y.toFixed(3));
    },
    { passive: true },
  );
}

const typewriter = document.querySelector("[data-typewriter]");
if (typewriter) {
  const phrases = (typewriter.dataset.phrases || "")
    .split("|")
    .map((phrase) => phrase.trim())
    .filter(Boolean);

  if (phrases.length && !prefersReducedMotion) {
    let phraseIndex = 0;
    let length = 0;
    let deleting = false;

    const type = () => {
      const phrase = phrases[phraseIndex];
      length += deleting ? -1 : 1;
      typewriter.textContent = phrase.slice(0, length);

      let delay = deleting ? 26 : 42;
      if (!deleting && length === phrase.length) {
        delay = 1500;
        deleting = true;
      } else if (deleting && length === 0) {
        delay = 280;
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
      window.setTimeout(type, delay);
    };

    type();
  }
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);

document.querySelectorAll(".fade-in-up").forEach((item) => revealObserver.observe(item));

const navLinks = [...document.querySelectorAll(".nav-links a")];
const navSections = [...document.querySelectorAll("main section[id]")];
const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { threshold: 0.34 },
);

navSections.forEach((section) => navObserver.observe(section));

document.querySelectorAll("[data-case-carousel]").forEach((carousel) => {
  const viewport = carousel.querySelector(".case-carousel-viewport");
  const track = carousel.querySelector("[data-case-track]");
  const cards = [...carousel.querySelectorAll(".case-card")];
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  const status = carousel.querySelector("[data-carousel-status]");
  let index = 0;

  const render = () => {
    if (!viewport || !track || !cards.length) return;
    const active = cards[index];
    const center = (viewport.clientWidth - active.offsetWidth) / 2;
    const offset = center - active.offsetLeft;
    track.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === index);
    });
    if (status) status.textContent = `${index + 1} / ${cards.length}`;
  };

  prev?.addEventListener("click", () => {
    index = (index - 1 + cards.length) % cards.length;
    render();
  });

  next?.addEventListener("click", () => {
    index = (index + 1) % cards.length;
    render();
  });

  window.addEventListener("resize", () => window.requestAnimationFrame(render));
  window.requestAnimationFrame(render);
});

const memoryHomeMount = document.querySelector("[data-memory-home-mount]");
const memoryDemoSource = document.querySelector("[data-memory-demo]");

if (memoryHomeMount && memoryDemoSource) {
  memoryHomeMount.append(memoryDemoSource);
}

const memoryDemo = document.querySelector("[data-memory-demo]");

const initMemoryParticleDemo = (demo) => {
  const provider = getMemoryProvider();
  const stage = demo.querySelector(".inference-board");
  const particleLayer = demo.querySelector("[data-memory-particle-layer]");
  const videoTerminal = demo.querySelector(".video-terminal");
  const video = demo.querySelector("[data-memory-video]");
  const playbackProgress = demo.querySelector("[data-memory-playback-progress]");
  const segmentDuration = memoryDemoConfig.shotDuration;
  const audioMemoryPlayer = new Audio();
  const particles = [];
  const pointer = { x: 0, y: 0, active: false };
  let currentShot = -1;
  let renderVersion = 0;
  let activeAudioNode = null;
  let lastPhysicsTime = performance.now();
  let lastPhysicsPaintTime = 0;
  let stageMetricsCache = null;
  let memoryPageActive = !introStage?.classList.contains("is-next-settled");
  let introPageVisible = introStage
    ? introStage.getBoundingClientRect().bottom > 0
    : true;
  let transitionPaused = !introPageVisible;
  let pageHasFocus = document.visibilityState === "visible";
  let progressFocusState = null;
  let playbackActiveState = null;
  let manuallyPaused = false;
  let progressHoverIndex = null;
  let progressPlayhead = null;
  let progressAnimationFrame = null;
  let progressTrackStart = 0;
  let progressTrackWidth = 0;
  const progressTicks = [];
  const isCompactGlow = window.matchMedia("(max-width: 560px)").matches;
  const ambientGlow = video
    ? new AmbientGlow(video, {
      blur: isCompactGlow ? 48 : 64,
      opacity: 0.62,
      brightness: 0.76,
      saturate: isCompactGlow ? 1.52 : 1.62,
      scale: 1.06,
      downscale: isCompactGlow ? 0.04 : 0.05,
      updateInterval: isCompactGlow ? 120 : 90,
      responsiveness: 0.08,
    })
    : null;
  const videoGlow = ambientGlow?.canvas ?? null;

  if (videoGlow) {
    videoGlow.className = "video-glow";
    videoGlow.dataset.memoryVideoGlow = "";
    videoGlow.dataset.renderer = "ambient-glow";
    videoGlow.dataset.targetFps = String(Math.round(1000 / (isCompactGlow ? 120 : 90)));
  }
  demo.dataset.renderer = "ambient-glow";

  audioMemoryPlayer.preload = "metadata";

  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const videoDeadZone = 52;

  const buildPlaybackProgress = () => {
    if (!playbackProgress) return;
    const tickCount = window.matchMedia("(max-width: 560px)").matches ? 61 : 89;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < tickCount; index += 1) {
      const tick = document.createElement("i");
      tick.className = "memory-progress-tick";
      tick.setAttribute("aria-hidden", "true");
      tick.dataset.phase = randomBetween(0, Math.PI * 2).toFixed(4);
      fragment.append(tick);
      progressTicks.push(tick);
    }
    playbackProgress.append(fragment);
    progressPlayhead = document.createElement("i");
    progressPlayhead.className = "memory-progress-playhead";
    progressPlayhead.setAttribute("aria-hidden", "true");
    playbackProgress.append(progressPlayhead);
  };

  const measureProgressTrack = () => {
    if (progressTrackWidth || !playbackProgress || !progressTicks.length) return;
    const progressRect = playbackProgress.getBoundingClientRect();
    const firstRect = progressTicks[0].getBoundingClientRect();
    const lastRect = progressTicks[progressTicks.length - 1].getBoundingClientRect();
    progressTrackStart = firstRect.left - progressRect.left + firstRect.width / 2;
    progressTrackWidth = Math.max(
      lastRect.left - firstRect.left + (lastRect.width - firstRect.width) / 2,
      1,
    );
  };

  const updateProgressPlayhead = () => {
    if (!progressPlayhead || !video) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : 1;
    const progress = clamp(video.currentTime / duration, 0, 1);
    measureProgressTrack();
    const playheadX = progressTrackStart + progress * progressTrackWidth;
    progressPlayhead.style.transform = `translate3d(${playheadX.toFixed(3)}px, -50%, 0) translateX(-50%)`;
  };

  const animateProgressPlayhead = () => {
    updateProgressPlayhead();
    if (!video.paused && memoryPageActive && pageHasFocus) {
      progressAnimationFrame = window.requestAnimationFrame(animateProgressPlayhead);
    } else {
      progressAnimationFrame = null;
    }
  };

  const startProgressAnimation = () => {
    if (progressAnimationFrame || !memoryPageActive || !pageHasFocus) return;
    progressAnimationFrame = window.requestAnimationFrame(animateProgressPlayhead);
  };

  const stopProgressAnimation = () => {
    if (!progressAnimationFrame) return;
    window.cancelAnimationFrame(progressAnimationFrame);
    progressAnimationFrame = null;
  };

  const updatePlaybackProgress = () => {
    if (!playbackProgress || !video || !progressTicks.length) return;
    const duration = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : 1;
    const progress = clamp(video.currentTime / duration, 0, 1);
    const activePosition = progress * (progressTicks.length - 1);

    progressTicks.forEach((tick, index) => {
      const distance = Math.abs(index - activePosition);
      const falloff = Math.exp(-distance / 7.6);
      const idleHeight = 6;
      const height = idleHeight * (1 + falloff * 1.2);
      tick.dataset.baseHeight = height.toFixed(2);
      if (progressHoverIndex === null) {
        tick.style.setProperty("--tick-height", `${height.toFixed(2)}px`);
      }
      tick.style.setProperty("--tick-opacity", (0.14 + falloff * 0.58).toFixed(3));
    });

    updateProgressPlayhead();
    const percent = progress * 100;
    playbackProgress.setAttribute("aria-valuenow", percent.toFixed(1));
    playbackProgress.setAttribute("aria-valuetext", `${percent.toFixed(1)}%`);
  };

  const stopProgressDisturbance = () => {
    progressHoverIndex = null;
    playbackProgress?.classList.remove("is-focused");
    progressTicks.forEach((tick) => {
      tick.style.setProperty("--tick-height", `${tick.dataset.baseHeight || 3}px`);
    });
  };

  const renderProgressFocus = () => {
    if (progressHoverIndex === null) return;
    progressTicks.forEach((tick, index) => {
      const distance = Math.abs(index - progressHoverIndex);
      const influence = Math.exp(-(distance * distance) / (2 * 2.8 * 2.8));
      const baseHeight = Number(tick.dataset.baseHeight) || 3;
      const focusedHeight = baseHeight * (1 + influence * 0.75);
      tick.style.setProperty("--tick-height", `${focusedHeight.toFixed(2)}px`);
    });
  };

  const seekFromProgressPointer = (event) => {
    if (!playbackProgress || !video || !Number.isFinite(video.duration)) return;
    const rect = playbackProgress.getBoundingClientRect();
    measureProgressTrack();
    const progress = clamp(
      (event.clientX - rect.left - progressTrackStart) / progressTrackWidth,
      0,
      1,
    );
    video.currentTime = progress * video.duration;
    manuallyPaused = false;
    updatePlaybackProgress();
  };

  const syncPlayerFocus = () => {
    if (!video) return;
    const progressFocused = memoryPageActive && pageHasFocus;
    if (progressFocused !== progressFocusState) {
      progressFocusState = progressFocused;
      demo.classList.toggle("is-player-focused", progressFocused);
      if (progressFocused) {
        if (!video.paused) {
          startProgressAnimation();
        }
      } else {
        stopProgressDisturbance();
        stopProgressAnimation();
      }
    }

    const shouldPlay = introPageVisible && pageHasFocus && !transitionPaused;
    if (shouldPlay === playbackActiveState) return;
    playbackActiveState = shouldPlay;

    if (shouldPlay) {
      manuallyPaused = false;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  buildPlaybackProgress();
  updatePlaybackProgress();

  playbackProgress?.addEventListener("pointermove", (event) => {
    const rect = playbackProgress.getBoundingClientRect();
    measureProgressTrack();
    progressHoverIndex = clamp(
      Math.round(
        ((event.clientX - rect.left - progressTrackStart) / progressTrackWidth)
        * (progressTicks.length - 1),
      ),
      0,
      progressTicks.length - 1,
    );
    playbackProgress.classList.add("is-focused");
    if (event.buttons === 1) seekFromProgressPointer(event);
    renderProgressFocus();
  });
  playbackProgress?.addEventListener("pointerdown", (event) => {
    playbackProgress.setPointerCapture?.(event.pointerId);
    seekFromProgressPointer(event);
  });
  playbackProgress?.addEventListener("pointerleave", stopProgressDisturbance);
  window.addEventListener("pointermove", (event) => {
    if (progressHoverIndex === null || !playbackProgress) return;
    const rect = playbackProgress.getBoundingClientRect();
    const outside = event.clientX < rect.left
      || event.clientX > rect.right
      || event.clientY < rect.top
      || event.clientY > rect.bottom;
    if (outside) stopProgressDisturbance();
  }, { passive: true });
  playbackProgress?.addEventListener("keydown", (event) => {
    if (!video || !Number.isFinite(video.duration)) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    video.currentTime = clamp(video.currentTime + direction * 5, 0, video.duration);
    manuallyPaused = false;
    updatePlaybackProgress();
  });

  window.addEventListener("echo:intro-progress", (event) => {
    memoryPageActive = !event.detail?.nextSettled;
    const progress = event.detail?.progress ?? 0;
    introPageVisible = progress < 0.999;
    if (progress > 0.995) transitionPaused = true;
    if (progress < 0.985) transitionPaused = false;
    syncPlayerFocus();
  });
  window.addEventListener("focus", () => {
    pageHasFocus = true;
    syncPlayerFocus();
  });
  window.addEventListener("blur", () => {
    pageHasFocus = false;
    syncPlayerFocus();
  });
  document.addEventListener("visibilitychange", () => {
    pageHasFocus = document.visibilityState === "visible";
    syncPlayerFocus();
  });

  const getStageMetrics = () => {
    if (stageMetricsCache) return stageMetricsCache;
    const stageRect = stage.getBoundingClientRect();
    const videoRect = videoTerminal.getBoundingClientRect();
    stageMetricsCache = {
      width: stageRect.width,
      height: stageRect.height,
      centerX: videoRect.left - stageRect.left + videoRect.width / 2,
      centerY: videoRect.top - stageRect.top + videoRect.height / 2,
      videoHalfWidth: videoRect.width / 2,
      videoHalfHeight: videoRect.height / 2,
    };
    return stageMetricsCache;
  };

  const measureParticleCapsule = (element) => {
    const width = Math.max(element.offsetWidth, 1);
    const height = Math.max(element.offsetHeight, 1);
    const radius = Math.min(width, height) / 2;
    return {
      width,
      height,
      halfWidth: width / 2,
      halfHeight: height / 2,
      radius,
      segmentHalf: Math.max(0, width / 2 - radius),
    };
  };

  const getDeadZoneBounds = (metrics, shape, padding = videoDeadZone) => ({
    left: metrics.centerX - metrics.videoHalfWidth - padding - shape.halfWidth,
    right: metrics.centerX + metrics.videoHalfWidth + padding + shape.halfWidth,
    top: metrics.centerY - metrics.videoHalfHeight - padding - shape.halfHeight,
    bottom: metrics.centerY + metrics.videoHalfHeight + padding + shape.halfHeight,
  });

  const constrainParticle = (particle, metrics) => {
    const minX = particle.halfWidth + 10;
    const maxX = metrics.width - particle.halfWidth - 10;
    const minY = particle.halfHeight + 10;
    const maxY = metrics.height - particle.halfHeight - 10;
    particle.x = clamp(particle.x, minX, maxX);
    particle.y = clamp(particle.y, minY, maxY);

    const deadZone = getDeadZoneBounds(metrics, particle);
    const insideDeadZone = particle.x > deadZone.left
      && particle.x < deadZone.right
      && particle.y > deadZone.top
      && particle.y < deadZone.bottom;
    if (!insideDeadZone) return;

    const exits = [
      deadZone.left >= minX
        ? { distance: particle.x - deadZone.left, axis: "x", value: deadZone.left }
        : null,
      deadZone.right <= maxX
        ? { distance: deadZone.right - particle.x, axis: "x", value: deadZone.right }
        : null,
      deadZone.top >= minY
        ? { distance: particle.y - deadZone.top, axis: "y", value: deadZone.top }
        : null,
      deadZone.bottom <= maxY
        ? { distance: deadZone.bottom - particle.y, axis: "y", value: deadZone.bottom }
        : null,
    ].filter(Boolean).sort((a, b) => a.distance - b.distance);
    const exit = exits[0];
    if (!exit) return;

    particle[exit.axis] = exit.value;
    particle[`v${exit.axis}`] = 0;
  };

  const positionOutsideVideo = (shape) => {
    const metrics = getStageMetrics();
    const marginX = shape.halfWidth + 14;
    const marginY = shape.halfHeight + 14;
    const deadZone = getDeadZoneBounds(metrics, shape);

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const x = randomBetween(marginX, Math.max(marginX, metrics.width - marginX));
      const y = randomBetween(marginY, Math.max(marginY, metrics.height - marginY));
      const insideDeadZone = x > deadZone.left
        && x < deadZone.right
        && y > deadZone.top
        && y < deadZone.bottom;
      if (!insideDeadZone) return { x, y };
    }

    const side = Math.random() > 0.5 ? 1 : -1;
    return {
      x: clamp(
        side > 0 ? deadZone.right + 8 : deadZone.left - 8,
        marginX,
        metrics.width - marginX,
      ),
      y: clamp(
        randomBetween(marginY, metrics.height - marginY),
        marginY,
        metrics.height - marginY,
      ),
    };
  };

  const drawImageMemory = (canvas, src) => {
    if (!canvas || !src) return;
    const context = canvas.getContext("2d");
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - side) / 2;
      const sourceY = (image.naturalHeight - side) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        sourceX,
        sourceY,
        side,
        side,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    };
    image.src = src;
  };

  const drawAudioMemory = (canvas, waveform = []) => {
    const context = canvas.getContext("2d");
    const { width, height } = canvas;
    const waveformPeak = Math.max(
      ...waveform.map((sample) => Math.abs(sample)),
      0.06,
    );
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "#ff4a57";
    context.lineWidth = 2;
    context.beginPath();

    for (let x = 0; x < width; x += 1) {
      const sampleIndex = Math.min(
        Math.max(waveform.length - 1, 0),
        Math.floor((x / width) * Math.max(waveform.length, 1)),
      );
      const amplitude = waveform[sampleIndex] || 0;
      const normalizedAmplitude = Math.min(
        Math.abs(amplitude) / (waveformPeak * 0.68),
        1,
      );
      const envelope = Math.sin((x / width) * Math.PI);
      const wave = Math.sin(x * 0.28) * normalizedAmplitude * envelope;
      const y = height / 2 + wave * height * 0.43;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  };

  const stopAudioPreview = () => {
    audioMemoryPlayer.pause();
    activeAudioNode?.classList.remove("is-previewing");
    activeAudioNode = null;
  };

  const previewAudioMemory = async (particle) => {
    const audio = particle.memory.audio;
    if (!audio?.src) return;

    if (activeAudioNode === particle.element && !audioMemoryPlayer.paused) {
      stopAudioPreview();
      return;
    }

    stopAudioPreview();
    video?.pause();
    audioMemoryPlayer.src = audio.src;
    activeAudioNode = particle.element;
    activeAudioNode.classList.add("is-previewing");
    await audioMemoryPlayer.play();
  };

  const createParticleElement = (memory, index) => {
    const isAudio = memory.type === "audio";
    const isText = memory.type === "text";
    const element = document.createElement("figure");

    element.className = isText
      ? "prompt-memory memory-particle"
      : isAudio
        ? "audio-orb memory-particle"
        : "memory-orb memory-particle";
    element.dataset.memoryId = memory.id || `memory-${index + 1}`;
    element.dataset.memoryType = isText ? "text" : isAudio ? "audio" : "img";
    if (memory.metadata?.isConditionImage) element.dataset.conditionImage = "";

    if (isText) {
      const label = document.createElement("figcaption");
      const copy = document.createElement("p");
      const text = memory.text?.text || "";
      const highlightPattern = /^(?:ID_[A-Z]+(?:['’]s)?|PREVIOUS_SHOT|CONDITION_IMAGE|close-up|wide|camera|tracking|push(?:es)?|pull(?:s)?|dolly|pan(?:s)?|tilt(?:s)?|cut|over-the-shoulder|says?|asks?|whispers?|replies?|shouts?|turns?|opens?|holds?|hands?|enters?|reveals?|looks?|walks?|runs?)$/i;
      const words = text.match(/\S+/g) || [];
      words.forEach((word, wordIndex) => {
        const normalizedWord = word.replace(/^[\"“'‘(]+|[\"”'’),.;:!?]+$/g, "");
        const token = document.createElement("span");
        token.className = "prompt-word";
        if (highlightPattern.test(normalizedWord)) token.classList.add("is-keyword");
        if (wordIndex === 0 && memory.text?.fadeStart) {
          token.classList.add("is-buffer", "is-fade-start");
        }
        if (wordIndex === words.length - 1 && memory.text?.fadeEnd) {
          token.classList.add("is-buffer", "is-fade-end");
        }
        token.textContent = word;
        copy.append(token);
        if (wordIndex < words.length - 1) copy.append(document.createTextNode(" "));
      });
      label.textContent = memory.text?.label || "Prompt memory";
      element.setAttribute("aria-label", `${label.textContent}: ${text}`);
      element.append(label, copy);
      return element;
    }

    const canvas = document.createElement("canvas");
    canvas.width = isAudio ? 180 : 160;
    canvas.height = isAudio ? 90 : 160;

    if (isAudio) {
      element.dataset.audioMemory = "";
      element.setAttribute("role", "button");
      element.tabIndex = 0;
      element.title = "Preview audio memory";
      element.setAttribute("aria-label", `Audio memory ${index + 1}`);
      canvas.dataset.audioWave = String(index);
      drawAudioMemory(canvas, memory.audio?.waveform);
    } else {
      element.dataset.memoryOrb = "";
      element.setAttribute("aria-label", `Image memory ${index + 1}`);
      drawImageMemory(canvas, memory.img?.src);
    }

    element.append(canvas);
    return element;
  };

  const retireParticles = () => {
    particles.forEach((particle) => {
      if (particle.retiring) return;
      particle.retiring = true;
      const exitDelay = randomBetween(0, 1.25);
      particle.element.style.setProperty("--particle-exit-delay", `${exitDelay.toFixed(3)}s`);
      particle.element.classList.add("is-leaving");
      window.setTimeout(() => {
        particle.removed = true;
        particle.element.remove();
      }, (exitDelay + 1.1) * 1000);
    });
  };

  const spawnMemoryList = (memoryList) => {
    retireParticles();
    const shuffledReveal = memoryList
      .map((_, index) => ({ index, delay: randomBetween(0, 3) }))
      .sort((a, b) => a.delay - b.delay);
    const revealDelay = new Map(shuffledReveal.map(({ index, delay }) => [index, delay]));

    memoryList.forEach((memory, index) => {
      const element = createParticleElement(memory, index);
      const delay = revealDelay.get(index) || 0;
      element.style.setProperty("--particle-enter-delay", `${delay.toFixed(3)}s`);
      element.dataset.targetTick = delay.toFixed(3);
      particleLayer.append(element);

      const shape = measureParticleCapsule(element);
      const position = positionOutsideVideo(shape);
      const motionScale = memory.metadata?.isConditionImage ? 0.4 : 1;
      const particle = {
        element,
        memory,
        motionScale,
        ...shape,
        x: position.x,
        y: position.y,
        vx: randomBetween(-0.12, 0.12) * motionScale,
        vy: randomBetween(-0.12, 0.12) * motionScale,
        ax: 0,
        ay: 0,
        mass: randomBetween(1.35, 1.9),
        retiring: false,
        removed: false,
      };
      element.style.transform = `translate3d(${(particle.x - particle.halfWidth).toFixed(2)}px, ${(particle.y - particle.halfHeight).toFixed(2)}px, 0)`;

      if (memory.type === "audio") {
        element.addEventListener("click", () => previewAudioMemory(particle));
        element.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          previewAudioMemory(particle);
        });
      }

      particles.push(particle);
      // Two frames guarantee the browser paints the transparent start state
      // before transitioning the particle into view.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => element.classList.add("is-visible"));
      });
    });

    window.dispatchEvent(
      new CustomEvent("echo:memory-list-loaded", {
        detail: {
          shotIndex: currentShot,
          memoryList,
        },
      }),
    );
  };

  const loadShotMemoryList = async (shotIndex) => {
    const version = ++renderVersion;
    currentShot = shotIndex;
    const startTime = shotIndex * segmentDuration;
    const shot = await provider.getShot({
      shotIndex,
      startTime,
      endTime: startTime + segmentDuration,
    });
    const memoryList = await provider.getMemoryList({
      shotIndex,
      targetShotIndex: shotIndex,
      sourceShotIndex: shotIndex - 1,
      shot,
    });
    if (version !== renderVersion) return;
    stopAudioPreview();
    spawnMemoryList(memoryList || []);

    window.dispatchEvent(
      new CustomEvent("echo:shot-change", {
        detail: {
          shotIndex,
          sourceShotIndex: shotIndex - 1,
          shotDuration: segmentDuration,
          memoryList,
          shot,
        },
      }),
    );
  };

  const updateShot = async () => {
    if (!video || !Number.isFinite(video.currentTime)) return;
    const nextShot = await provider.getShotIndexAtTime({ time: video.currentTime });
    if (nextShot !== currentShot) loadShotMemoryList(nextShot);
  };

  const applyPhysics = (time) => {
    const frameInterval = memoryPageActive ? 16 : 32;
    if (time - lastPhysicsPaintTime < frameInterval) {
      window.requestAnimationFrame(applyPhysics);
      return;
    }
    lastPhysicsPaintTime = time;
    const delta = clamp((time - lastPhysicsTime) / 16.667, 0.25, 2);
    lastPhysicsTime = time;
    const metrics = getStageMetrics();
    const liveParticles = particles.filter((particle) => !particle.removed);

    liveParticles.forEach((particle) => {
      let forceX = (metrics.centerX - particle.x) * 0.000035;
      let forceY = (metrics.centerY - particle.y) * 0.000035;
      const deadZone = getDeadZoneBounds(metrics, particle);
      const nearestX = clamp(particle.x, deadZone.left, deadZone.right);
      const nearestY = clamp(particle.y, deadZone.top, deadZone.bottom);
      let deadZoneDx = particle.x - nearestX;
      let deadZoneDy = particle.y - nearestY;
      let deadZoneDistance = Math.hypot(deadZoneDx, deadZoneDy);

      if (deadZoneDistance === 0) {
        const exits = [
          { distance: particle.x - deadZone.left, x: -1, y: 0 },
          { distance: deadZone.right - particle.x, x: 1, y: 0 },
          { distance: particle.y - deadZone.top, x: 0, y: -1 },
          { distance: deadZone.bottom - particle.y, x: 0, y: 1 },
        ].sort((a, b) => a.distance - b.distance);
        deadZoneDx = exits[0].x;
        deadZoneDy = exits[0].y;
        deadZoneDistance = -exits[0].distance;
      } else {
        deadZoneDx /= deadZoneDistance;
        deadZoneDy /= deadZoneDistance;
      }

      const deadZoneSoftEdge = 38;
      if (deadZoneDistance < deadZoneSoftEdge) {
        const strength = deadZoneDistance < 0
          ? 0.32 + Math.min(Math.abs(deadZoneDistance), 90) * 0.012
          : (1 - deadZoneDistance / deadZoneSoftEdge) * 0.32;
        forceX += deadZoneDx * strength;
        forceY += deadZoneDy * strength;
      }

      liveParticles.forEach((other) => {
        if (other === particle) return;
        const pairX = particle.x - other.x;
        const pairY = particle.y - other.y;
        const capsuleX = Math.sign(pairX || 1) * Math.max(
          Math.abs(pairX) - particle.segmentHalf - other.segmentHalf,
          0,
        );
        let collisionX = capsuleX;
        let collisionY = pairY;
        let distance = Math.hypot(collisionX, collisionY);
        if (distance < 0.001) {
          collisionX = pairX || (Math.random() - 0.5);
          collisionY = pairY || (Math.random() - 0.5);
          distance = Math.max(Math.hypot(collisionX, collisionY), 0.001);
        }
        const repelDistance = particle.radius + other.radius + 26;
        if (distance >= repelDistance) return;
        const strength = (1 - distance / repelDistance) * 0.18;
        forceX += (collisionX / distance) * strength;
        forceY += (collisionY / distance) * strength;
      });

      if (pointer.active) {
        const mouseX = particle.x - pointer.x;
        const mouseY = particle.y - pointer.y;
        const mouseDistance = Math.max(Math.hypot(mouseX, mouseY), 1);
        const mouseRadius = 190 + particle.radius;
        if (mouseDistance < mouseRadius) {
          const strength = Math.pow(1 - mouseDistance / mouseRadius, 1.5) * 0.42;
          forceX += (mouseX / mouseDistance) * strength;
          forceY += (mouseY / mouseDistance) * strength;
        }
      }

      const edgeX = particle.halfWidth + 10;
      const edgeY = particle.halfHeight + 10;
      if (particle.x < edgeX) forceX += (edgeX - particle.x) * 0.014;
      if (particle.x > metrics.width - edgeX) {
        forceX -= (particle.x - (metrics.width - edgeX)) * 0.014;
      }
      if (particle.y < edgeY) forceY += (edgeY - particle.y) * 0.014;
      if (particle.y > metrics.height - edgeY) {
        forceY -= (particle.y - (metrics.height - edgeY)) * 0.014;
      }

      const targetAccelerationX = (forceX / particle.mass) * particle.motionScale;
      const targetAccelerationY = (forceY / particle.mass) * particle.motionScale;
      const accelerationResponse = 1 - Math.pow(0.88, delta);
      particle.ax += (targetAccelerationX - particle.ax) * accelerationResponse;
      particle.ay += (targetAccelerationY - particle.ay) * accelerationResponse;
      const damping = particle.motionScale < 1 ? 0.982 : 0.993;
      particle.vx = (particle.vx + particle.ax * delta) * Math.pow(damping, delta);
      particle.vy = (particle.vy + particle.ay * delta) * Math.pow(damping, delta);
      const speed = Math.hypot(particle.vx, particle.vy);
      const maxSpeed = 1.35 * particle.motionScale;
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed;
        particle.vy = (particle.vy / speed) * maxSpeed;
      }
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      constrainParticle(particle, metrics);
      particle.element.style.transform = `translate3d(${(particle.x - particle.halfWidth).toFixed(2)}px, ${(particle.y - particle.halfHeight).toFixed(2)}px, 0)`;
    });

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      if (particles[index].removed) particles.splice(index, 1);
    }
    window.requestAnimationFrame(applyPhysics);
  };

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }, { passive: true });
  stage.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  window.addEventListener("resize", () => {
    stageMetricsCache = null;
    progressTrackStart = 0;
    progressTrackWidth = 0;
  }, { passive: true });

  audioMemoryPlayer.addEventListener("ended", stopAudioPreview);
  audioMemoryPlayer.addEventListener("pause", () => {
    activeAudioNode?.classList.remove("is-previewing");
  });

  if (video) {
    const source = video.querySelector("source");
    if (source) source.src = memoryDemoConfig.video.src;
    video.controls = false;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.poster = memoryDemoConfig.video.poster;
    video.load();

    video.addEventListener("play", () => {
      stopAudioPreview();
      startProgressAnimation();
    });
    video.addEventListener("pause", () => {
      stopProgressAnimation();
    });
    video.addEventListener("timeupdate", () => {
      updateShot();
      updatePlaybackProgress();
    });
    video.addEventListener("loadedmetadata", updatePlaybackProgress);
    video.addEventListener("seeking", () => {
      updateShot();
    });
    video.addEventListener("click", async () => {
      if (video.paused) {
        manuallyPaused = false;
        await video.play();
      } else {
        manuallyPaused = true;
        video.pause();
      }
    });
    video.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (video.paused) {
        manuallyPaused = false;
        await video.play();
      } else {
        manuallyPaused = true;
        video.pause();
      }
    });
  }

  syncPlayerFocus();

  window.ECHO_MEMORY_PARTICLES = {
    get state() {
      return particles.map((particle) => ({
        id: particle.memory.id,
        type: particle.memory.type,
        x: particle.x,
        y: particle.y,
        vx: particle.vx,
        vy: particle.vy,
        ax: particle.ax,
        ay: particle.ay,
        mass: particle.mass,
        width: particle.width,
        height: particle.height,
        capsuleRadius: particle.radius,
        capsuleSegmentHalf: particle.segmentHalf,
        collisionShape: "capsule",
        motionScale: particle.motionScale,
        retiring: particle.retiring,
      }));
    },
    loadShot: loadShotMemoryList,
  };

  loadShotMemoryList(0);
  window.requestAnimationFrame(applyPhysics);
};

if (memoryDemo) {
  initMemoryParticleDemo(memoryDemo);
}

if (memoryDemo?.dataset.renderer === "legacy") {
  const provider = getMemoryProvider();
  const video = memoryDemo.querySelector("[data-memory-video]");
  const videoGlow = memoryDemo.querySelector("[data-memory-video-glow]");
  const memoryOrbs = [...memoryDemo.querySelectorAll("[data-memory-orb]")];
  const memoryCanvases = memoryOrbs.map((orb) => orb.querySelector("canvas"));
  const shotIndexes = [...memoryDemo.querySelectorAll("[data-shot-index]")];
  const memorySource = memoryDemo.querySelector("[data-memory-source]");
  const videoState = memoryDemo.querySelector("[data-video-state]");
  const audioCanvases = [...memoryDemo.querySelectorAll("[data-audio-wave]")];
  const audioMemoryNodes = [...memoryDemo.querySelectorAll("[data-audio-memory]")];
  const audioMemoryLabels = [...memoryDemo.querySelectorAll("[data-audio-memory-label]")];
  const segmentDuration = memoryDemoConfig.shotDuration;
  const memoryCount = memoryDemoConfig.visualMemoryCount;
  const memoryRevealWindow = 3;

  let currentShot = 0;
  let audioContext = null;
  let analyser = null;
  let analyserData = null;
  let mediaSourceConnected = false;
  let audioMemoryWaveform = null;
  let activeAudioMemory = null;
  const audioMemoryPlayer = new Audio();
  audioMemoryPlayer.preload = "metadata";

  const setShotText = (shotIndex) => {
    const label = String(shotIndex + 1).padStart(2, "0");
    shotIndexes.forEach((element) => {
      element.textContent = label;
    });
  };

  const drawMemoryImage = (canvas, src) =>
    new Promise((resolve) => {
      if (!canvas) {
        resolve(false);
        return;
      }

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (!src) {
        resolve(false);
        return;
      }

      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const x = (image.naturalWidth - side) / 2;
        const y = (image.naturalHeight - side) / 2;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, x, y, side, side, 0, 0, canvas.width, canvas.height);
        resolve(true);
      };
      image.onerror = () => resolve(false);
      image.src = src;
    });

  const createRevealTicks = (count, windowSeconds = memoryRevealWindow) => {
    const order = Array.from({ length: count }, (_, index) => index);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }

    const ticks = new Array(count).fill(0);
    const step = count > 1 ? windowSeconds / (count - 1) : 0;
    order.forEach((targetIndex, revealIndex) => {
      const jitter = (Math.random() - 0.5) * step * 0.72;
      ticks[targetIndex] = clamp(revealIndex * step + jitter, 0, windowSeconds);
    });
    return ticks;
  };

  const renderVisualMemories = async (items, sourceShot) => {
    memoryOrbs.forEach((orb) => {
      orb.classList.remove("is-visible", "is-written");
    });

    const normalized = Array.from({ length: memoryCount }, (_, index) => {
      const item = items?.[index];
      if (typeof item === "string") return { src: item };
      return item || { src: null };
    });

    await Promise.all(
      normalized.map((item, index) => drawMemoryImage(memoryCanvases[index], item.src)),
    );

    const revealTicks = createRevealTicks(memoryOrbs.length);
    memoryOrbs.forEach((orb, index) => {
      const hasMemory = Boolean(normalized[index]?.src);
      const seed = (sourceShot + 1) * (index + 3);
      const blur = 0.25 + ((seed * 17) % 10) / 10;
      const rotation = Math.random() * 10 - 5;
      const drift = () => `${Math.round(Math.random() * 38 - 19)}px`;
      const targetTick = revealTicks[index] || 0;
      orb.style.setProperty("--memory-blur", `${blur.toFixed(2)}px`);
      orb.style.setProperty("--drift-x", drift());
      orb.style.setProperty("--drift-y", drift());
      orb.style.setProperty("--drift-x-alt", drift());
      orb.style.setProperty("--drift-y-alt", drift());
      orb.style.setProperty("--memory-fade-delay", `${targetTick.toFixed(3)}s`);
      orb.style.animationDuration = `${(6 + Math.random() * 5).toFixed(2)}s`;
      orb.style.animationDelay = `${(-Math.random() * 6).toFixed(2)}s`;
      orb.style.rotate = `${rotation}deg`;
      orb.dataset.targetTick = targetTick.toFixed(3);
      orb.classList.toggle("is-written", hasMemory);
      orb.classList.toggle("is-empty", !hasMemory);
    });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        memoryOrbs.forEach((orb) => orb.classList.add("is-visible"));
      });
    });
  };

  const renderAudioMemories = (items, sourceShot) => {
    activeAudioMemory = items?.[0] || null;
    audioMemoryWaveform = activeAudioMemory?.waveform || null;
    audioMemoryPlayer.pause();
    audioMemoryPlayer.removeAttribute("src");
    audioMemoryNodes.forEach((node) => {
      node.classList.remove("is-visible");
    });

    if (activeAudioMemory?.src) {
      audioMemoryPlayer.src = activeAudioMemory.src;
    }

    const label = sourceShot < 0
      ? "A-MEM / NO HISTORY"
      : `A-MEM / SHOT ${String(sourceShot + 1).padStart(2, "0")}`;
    audioMemoryLabels.forEach((element) => {
      element.textContent = label;
    });
    const revealTicks = createRevealTicks(audioMemoryNodes.length);
    audioMemoryNodes.forEach((node, index) => {
      const targetTick = revealTicks[index] || 0;
      node.style.setProperty("--audio-fade-delay", `${targetTick.toFixed(3)}s`);
      node.dataset.targetTick = targetTick.toFixed(3);
      node.classList.toggle("has-memory", Boolean(activeAudioMemory));
      node.classList.remove("is-previewing");
      node.setAttribute("aria-disabled", activeAudioMemory ? "false" : "true");
    });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        audioMemoryNodes.forEach((node) => node.classList.add("is-visible"));
      });
    });
  };

  const beginShot = async (shotIndex) => {
    currentShot = shotIndex;
    setShotText(shotIndex);

    if (memorySource) {
      memorySource.textContent = shotIndex === 0
        ? "BOOT"
        : `SHOT ${String(shotIndex).padStart(2, "0")}`;
    }

    const startTime = shotIndex * segmentDuration;
    const shot = await provider.getShot({
      shotIndex,
      startTime,
      endTime: startTime + segmentDuration,
    });
    const visualMemories = await provider.getVisualMemories({
      sourceShotIndex: shotIndex - 1,
      targetShotIndex: shotIndex,
      count: memoryCount,
      shot,
    });
    const audioMemories = await provider.getAudioMemories({
      sourceShotIndex: shotIndex - 1,
      targetShotIndex: shotIndex,
      shot,
    });
    await renderVisualMemories(visualMemories, shotIndex - 1);
    renderAudioMemories(audioMemories, shotIndex - 1);

    window.dispatchEvent(
      new CustomEvent("echo:shot-change", {
        detail: {
          shotIndex,
          sourceShotIndex: shotIndex - 1,
          shotDuration: segmentDuration,
          memoryCount,
          shot,
          audioMemories,
        },
      }),
    );
  };

  const updateInference = async () => {
    if (!video || !Number.isFinite(video.currentTime)) return;
    const nextShot = await provider.getShotIndexAtTime({ time: video.currentTime });

    if (nextShot !== currentShot) {
      await beginShot(nextShot);
    }
  };

  const connectAudioAnalyser = async () => {
    if (!video || mediaSourceConnected) return;
    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserData = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      mediaSourceConnected = true;
    } catch {
      analyser = null;
    }
  };

  const drawAudioMemories = () => {
    if (!audioMemoryWaveform && analyser && analyserData) {
      analyser.getByteTimeDomainData(analyserData);
    }

    audioCanvases.forEach((canvas, channelIndex) => {
      const context = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);
      context.strokeStyle = channelIndex === 1 ? "#ffffff" : "#ff4a57";
      context.lineWidth = 2;
      context.beginPath();

      for (let x = 0; x < width; x += 1) {
        const sampleIndex = Math.min(
          (audioMemoryWaveform?.length || analyserData?.length || 1) - 1,
          Math.floor(
            (x / width) * (audioMemoryWaveform?.length || analyserData?.length || 1),
          ),
        );
        const memoryPeak = audioMemoryWaveform?.[sampleIndex];
        const liveValue = Number.isFinite(memoryPeak)
          ? memoryPeak * Math.sin(x * (0.24 + channelIndex * 0.035) + channelIndex)
          : analyserData
            ? (analyserData[sampleIndex] - 128) / 128
            : 0;
        const envelope = Math.sin((x / width) * Math.PI);
        const y = height / 2 + liveValue * envelope * height * 0.34;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    });

    window.requestAnimationFrame(drawAudioMemories);
  };

  const syncVideoGlow = () => {
    if (!video || !videoGlow || !Number.isFinite(video.currentTime)) return;
    try {
      if (Math.abs(videoGlow.currentTime - video.currentTime) > 0.16) {
        videoGlow.currentTime = video.currentTime;
      }
      videoGlow.playbackRate = video.playbackRate;
    } catch {
      return;
    }
  };

  if (video) {
    const source = video.querySelector("source");
    if (source) source.src = memoryDemoConfig.video.src;
    video.controls = false;
    video.poster = memoryDemoConfig.video.poster;
    video.load();

    if (videoGlow) {
      const glowSource = videoGlow.querySelector("source");
      if (glowSource) glowSource.src = memoryDemoConfig.video.src;
      videoGlow.poster = memoryDemoConfig.video.poster;
      videoGlow.load();
    }

    video.addEventListener("play", async () => {
      audioMemoryPlayer.pause();
      memoryDemo.classList.add("is-playing");
      if (videoState) videoState.textContent = "PLAYBACK";
      syncVideoGlow();
      videoGlow?.play().catch(() => {});
      await connectAudioAnalyser();
      await audioContext?.resume();
    });
    video.addEventListener("pause", () => {
      memoryDemo.classList.remove("is-playing");
      if (videoState) videoState.textContent = "PAUSED";
      videoGlow?.pause();
    });
    video.addEventListener("ended", () => {
      memoryDemo.classList.remove("is-playing");
      if (videoState) videoState.textContent = "COMPLETE";
      videoGlow?.pause();
    });
    video.addEventListener("timeupdate", () => {
      syncVideoGlow();
      updateInference();
    });
    video.addEventListener("seeking", () => {
      syncVideoGlow();
      updateInference();
    });
    video.addEventListener("ratechange", syncVideoGlow);
    video.addEventListener("click", async () => {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    });
    video.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    });
  }

  const toggleAudioMemoryPreview = async () => {
    if (!activeAudioMemory?.src) return;
    if (audioMemoryPlayer.paused) {
      video?.pause();
      await audioMemoryPlayer.play();
    } else {
      audioMemoryPlayer.pause();
    }
  };

  audioMemoryNodes.forEach((node) => {
    node.addEventListener("click", toggleAudioMemoryPreview);
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleAudioMemoryPreview();
    });
  });

  audioMemoryPlayer.addEventListener("play", () => {
    audioMemoryNodes.forEach((node) => node.classList.add("is-previewing"));
  });
  ["pause", "ended"].forEach((eventName) => {
    audioMemoryPlayer.addEventListener(eventName, () => {
      audioMemoryNodes.forEach((node) => node.classList.remove("is-previewing"));
    });
  });

  renderVisualMemories([], -1);
  renderAudioMemories([], -1);
  beginShot(0);
  drawAudioMemories();
}
