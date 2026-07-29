// ============================================
// SZCUTZ — Reveal animations
// data-reveal="load"   → fires immediately on page load, staggered
// data-reveal="scroll" → fires once when the element enters the viewport
// ============================================

// 🔧 Load-triggered (hero) — tweak per-element stagger via data-delay
document.querySelectorAll('[data-reveal="load"]').forEach((el, i) => {
  const delay = el.dataset.delay ?? i * 110;
  setTimeout(() => el.classList.add('is-visible'), Number(delay));
});

// Scroll-triggered (everything else) — one-time, like stats-counter.js
const scrollRevealEls = document.querySelectorAll('[data-reveal="scroll"]');

const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 } // 🔧 kitna % visible hone pe trigger ho
);

scrollRevealEls.forEach((el) => revealObserver.observe(el));