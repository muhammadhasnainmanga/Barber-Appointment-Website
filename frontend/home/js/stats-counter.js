// ============================================
// SZCUTZ — Animated stat counters (About section)
// Counts up from 0 to data-target once the row
// scrolls into view, using an eased curve.
// ============================================

function animateCount(el, duration = 1200) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const start = performance.now();

  // Fast at the start, settles gently at the end — feels more natural
  // than a flat linear count.
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = easeOutExpo(progress);
    el.textContent = Math.round(eased * target) + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

const statsEl = document.querySelector('.about-stats');

if (statsEl) {
  const counters = statsEl.querySelectorAll('strong[data-target]');

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach((el) => animateCount(el));
          obs.unobserve(entry.target); // 🔧 sirf ek baar chalta hai, dobara scroll karne pe repeat nahi hoga
        }
      });
    },
    { threshold: 0.4 } // section ka 40% visible hote hi trigger
  );

  observer.observe(statsEl);
}