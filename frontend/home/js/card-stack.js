// ============================================
// SZCUTZ — Swipeable card stack (gallery)
// Pointer Events API unifies mouse + touch, so one
// set of handlers works for both drag and tap.
// ============================================

// Get query and will take images

// const slides = [
//   { src: '../../../assets/cuts_image/01_Curly_Taper_Fade.jpg', label: 'Curly Taper Fade' },
//   { src: '../../../assets/cuts_image/02_Textured_Crop_Taper_Fade!.jpg', label: 'Textured Crop Taper Fade' },
//   { src: '../../../assets/cuts_image/03_Shag_Wolf_Cut!.jpg', label: 'Shag Wolf Cut' },
//   { src: '../../../assets/cuts_image/04_Textured_Fringe_Low_Fade!.jpg', label: 'Textured Fringe Low Fade' },
//   { src: '../../../assets/cuts_image/05_Low_Taper_Crew_Cut!.jpg', label: 'Low Taper Crew Cut' },
//   { src: '../../../assets/cuts_image/06_Side_Part_Pompadour_Fade!.jpg', label: 'Side Part Pompadour Fade' },
//   { src: '../../../assets/cuts_image/07_Textured_Mullet_Fade!.jpg', label: 'Textured Mullet Fade' },
//   { src: '../../../assets/cuts_image/08_Curly_Fade_Hair_Tattoo_Design.jpg', label: 'Curly Fade Hair Tattoo Design' },
//   { src: '../../../assets/cuts_image/09_Messy_Textured_Crop_Fade!.jpg', label: 'Messy Textured Crop Fade' },
//   { src: '../../../assets/cuts_image/10_Curly_Fringe_Low_Fade.jpg', label: 'Curly Fringe Low Fade' },
//   { src: '../../../assets/cuts_image/11_Curly_Mullet_Fade.jpg', label: 'Curly Mullet Fade' },
//   { src: '../../../assets/cuts_image/12_Buzz_Cut_Hair_Tattoo_Star_Design.jpg', label: 'Buzz Cut Hair Tattoo Star Design' },
// ];

async function getSlides() {
  try {
    const response = await fetch('http://localhost:4000/api/v1/gallery/get-all', {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        cache: 'no-store'
    });

    if(response.ok){
      const slides = await response.json();

      if (slides.length === 0) {
        const container = document.getElementById('cardStack');
        if (!container) return;

        container.innerHTML = `
          <div class="stack-empty-state" style="display:flex; align-items:center; justify-content:center; min-height: 240px; padding: 2rem; border: 1px solid rgba(255,255,255,0.12); border-radius: 22px; background: rgba(18,18,18,0.35); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);">
            <div style="text-align:center; max-width: 440px;">
              <p style="margin:0; font-size: 1rem; letter-spacing:0.08em; text-transform: uppercase; color: rgba(255,255,255,0.7);">Recent Work</p>
              <h3 style="margin: 0.6rem 0 0.4rem; font-size: clamp(1.5rem, 3vw, 2.2rem);">No cuts uploaded yet</h3>
              <p style="margin:0; color: rgba(255,255,255,0.68); line-height: 1.7;">Come back soon for fresh fades, tapers, and trims.</p>
            </div>
          </div>
        `;
      }
      console.log(slides);
      return slides;
    }
  } catch (error) {
    console.error('Gallery fetch failed:', error);
  }
}

function initCardStack(containerId, items) {
  const container = document.getElementById(containerId);
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
(async () => {
const slides = await getSlides();
initCardStack('cardStack', slides);
})();
