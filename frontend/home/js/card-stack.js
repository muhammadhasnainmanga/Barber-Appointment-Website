const container = document.getElementById('cardStack');

function renderGalleryState({
  title = 'No cuts uploaded yet',
  message = 'Come back soon for fresh fades, tapers, and trims.',
  showRetry = false,
  retryHandler = null
} = {}) {
  const target = document.getElementById('cardStack');
  if (!target) return;

  target.style.height = '260px';
  target.innerHTML = `
    <div class="services-empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>${title}</p>
      ${showRetry ? `<button type="button" class="btn btn-primary" id="retryGalleryBtn">Try Again</button>` : ''}
    </div>
  `;

  if (showRetry && typeof retryHandler === 'function') {
    const retryBtn = document.getElementById('retryGalleryBtn');
    retryBtn?.addEventListener('click', retryHandler);
  }
}

async function getSlides() {
  try {
    const response = await fetch('http://localhost:4000/api/v1/user-gallery/get-all', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Gallery fetch failed:', response.status, response.statusText);
      renderGalleryState({
        title: 'Could not load gallery right now.',
        message: 'Please try again in a moment.',
        showRetry: true,
        retryHandler: loadGallery
      });
      return [];
    }

    const payload = await response.json();
    const slides = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.results)
        ? payload.results
        : [];

    const normalizedSlides = slides.map((item) => ({
      src: item.image_url || item.imageUrl || item.src || '',
      label: item.label || 'Barber cut'
    }));

    if (normalizedSlides.length === 0) {
      renderGalleryState({
        title: 'No cuts uploaded yet.',
        message: 'Come back soon for fresh fades, tapers, and trims.',
        showRetry: false
      });
      return [];
    }

    return normalizedSlides;
  } catch (error) {
    console.error('Gallery fetch failed:', error);
    renderGalleryState({
      title: 'Could not load gallery right now.',
      message: 'Please try again in a moment.',
      showRetry: true,
      retryHandler: loadGallery
    });
    return [];
  }
}

function initCardStack(containerId, items) {
  const container = document.getElementById(containerId);
  container.style.height = '505.56px';
  if (!container) return;

  let deck = [...items];
  let activeCard = null;
  let dragging = false;
  let justSwiped = false;
  let startX = 0;
  let deltaX = 0;

  const VISIBLE_COUNT = 6; // only render the top few — the rest stay queued in `deck`
// 🔧 TWEAK THE FAN SPACING/BLUR HERE
const FAN_STEP_X    = 20;
const FAN_STEP_ROT  = 5;
const FADE_STEP     = 0.24;
const BLUR_STEP     = 0.6;   // 🔧 pehle 1.4 tha, ab kam + suitable
const SCALE_STEP    = 0.035;

function render() {
  container.innerHTML = '';
  deck.slice(0, VISIBLE_COUNT).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'stack-card' + (i === 0 ? ' is-front' : '');

    if (i === 0) {
      card.style.setProperty('--tx', '0px');
      card.style.setProperty('--ty', '0px');
      card.style.setProperty('--rot', '0deg');
      card.style.setProperty('--scale', '1');
      card.style.setProperty('--op', '1');
      card.style.setProperty('--blur', '0px');
    } else {
      // Alternate: odd index → peeks right, even index → peeks left
      const dir = i % 2 === 1 ? 1 : -1;
      const step = Math.ceil(i / 2); // 1,1,2,2,3,3...

      card.style.setProperty('--tx', `${dir * step * FAN_STEP_X}px`);
      card.style.setProperty('--ty', `${step * 6}px`);
      card.style.setProperty('--rot', `${dir * step * FAN_STEP_ROT}deg`);
      card.style.setProperty('--scale', `${1 - step * SCALE_STEP}`);
      card.style.setProperty('--op', `${1 - step * FADE_STEP}`);
      card.style.setProperty('--blur', `${step * BLUR_STEP}px`);
    }
    card.style.setProperty('--z', VISIBLE_COUNT - i);

    card.innerHTML = `
      <img src="${item.src}" alt="${item.label}" draggable="false" />
      <span class="stack-caption">${item.label}</span>
    `;
    container.appendChild(card);
  });
  activeCard = container.querySelector('.is-front');
}

  const ghostLayer = document.getElementById('ghostLayer');

    function dismiss(direction) {
    if (!activeCard) return;

    // Clone the outgoing card and let IT fly away on its own timeline —
    // the real stack updates immediately, independent of this animation.
    const ghost = activeCard.cloneNode(true);
    ghost.classList.add('is-ghost');
    ghostLayer.appendChild(ghost);

    requestAnimationFrame(() => {
        ghost.style.transition = 'transform 320ms cubic-bezier(.2,.8,.2,1), opacity 320ms ease';
        ghost.style.transform = `translate(${direction * 700}px, 40px) rotate(${direction * 22}deg)`;
        ghost.style.opacity = '0';
    });

    setTimeout(() => ghost.remove(), 340);

    // Promote the next card right now — no waiting on the exit animation.
    deck.push(deck.shift());
    render();
    }

  function onPointerDown(e) {
    if (!activeCard || !activeCard.contains(e.target)) return;
    dragging = true;
    startX = e.clientX;
    activeCard.style.transition = 'none';
  }

  function onPointerMove(e) {
    if (!dragging) return;
    deltaX = e.clientX - startX;
    activeCard.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 18}deg)`;
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;

    if (Math.abs(deltaX) > 90) {
      justSwiped = true;
      dismiss(deltaX > 0 ? 1 : -1);
    } else if (activeCard) {
      activeCard.style.transition = 'transform 320ms ease';
      activeCard.style.transform = '';
    }
    deltaX = 0;
  }

  container.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // A plain tap (no real drag) also sends the front card away
  container.addEventListener('click', () => {
    if (justSwiped) { justSwiped = false; return; }
    if (dragging) return;
    dismiss(1);
  });

  render();
}

async function loadGallery() {
  const slides = await getSlides();
  if (Array.isArray(slides) && slides.length > 0) {
    initCardStack('cardStack', slides);
  }
}

(async () => {
  await loadGallery();
})();