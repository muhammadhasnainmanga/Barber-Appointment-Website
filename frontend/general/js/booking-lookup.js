// ============================================
// SZCUTZ — Shared "Check My Booking" modal
// Reuses the site's [data-reveal] fade+rise CSS (see style.css),
// but triggers it manually on every open — reveal.js's automatic
// pass runs before this modal even exists in the DOM, so it can't
// pick these elements up on its own.
// ============================================

(function () {
  const modalHTML = `
    <div class="modal-overlay" id="bookingLookupOverlay">
      <div class="modal-card">
        <button type="button" class="modal-close" aria-label="Close">&times;</button>
        <span class="eyebrow" data-reveal="load" data-delay="0">Check Booking</span>
        <h3 data-reveal="load" data-delay="90">Find Your Appointment</h3>
        <div class="form-group" data-reveal="load" data-delay="180">
          <label for="modalLookupPhone">Your Number</label>
          <input type="tel" id="modalLookupPhone" placeholder="03XX XXXXXXX" />
        </div>
        <button type="button" class="btn btn-primary" id="modalLookupBtn" data-reveal="load" data-delay="270">Find My Booking</button>
        <div class="form-message_Bk" id="formMessage_Bk" role="alert" hidden></div>
        <div class="lookup-result" id="modalLookupResult"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const overlay = document.getElementById('bookingLookupOverlay');
  const closeBtn = overlay.querySelector('.modal-close');
  const lookupBtn = document.getElementById('modalLookupBtn');
  const lookupResult = document.getElementById('modalLookupResult');
  const phoneInput = document.getElementById('modalLookupPhone');
  const revealEls = overlay.querySelectorAll('[data-reveal]');
  const formMessage_Bk = document.getElementById('formMessage_Bk');


  function showFormMessage_Bk(message) {
    formMessage_Bk.textContent = message;
    formMessage_Bk.hidden = false;
  }

  function clearFormMessage_Bk() {
    formMessage_Bk.textContent = '';
    formMessage_Bk.hidden = true;
  }

  function openModal() {
    clearFormMessage_Bk();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    phoneInput.focus();

    // Reset, force a reflow, then stagger back in — same easing/curve
    // as the rest of the site's [data-reveal] elements.
    revealEls.forEach((el) => el.classList.remove('is-visible'));
    void overlay.offsetHeight; // forces the browser to apply the reset above before re-adding the class

    revealEls.forEach((el) => {
      const delay = Number(el.dataset.delay ?? 0);
      setTimeout(() => el.classList.add('is-visible'), delay);
    });
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    revealEls.forEach((el) => el.classList.remove('is-visible')); // reset for next open
  }

  document.querySelectorAll('[data-open-booking-lookup]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });

  

  // MOCK — becomes: GET /api/user/bookings?phone=<value>
  lookupBtn.addEventListener('click', () => {
    clearFormMessage_Bk();
    lookupResult.textContent = ``;
    const phone = phoneInput.value.trim();
    if (!phone) {
      showFormMessage_Bk('Enter the number you booked with.');
      return;
    }
    lookupResult.textContent = `No live lookup yet — once the backend is connected, this will show any bookings made with ${phone}.`;
  });
})();