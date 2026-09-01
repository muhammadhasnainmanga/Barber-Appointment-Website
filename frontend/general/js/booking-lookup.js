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
        <div class="form-message_Bk" id="formMessage_Bk" role="alert" hidden></div>
        <button type="button" class="btn btn-primary" id="modalLookupBtn" data-reveal="load" data-delay="270">Find My Booking</button>
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

  function showFormMessage(el, message, type = 'error') {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('form-message-success', 'form-message-error');
  el.classList.add(type === 'success' ? 'form-message-success' : 'form-message-error');
  el.hidden = false;
 }

 function clearFormMessage(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.remove('form-message-success', 'form-message-error');
  el.hidden = true;
 }

 function formatTime12h(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

  function openModal() {
    clearFormMessage(formMessage_Bk);
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    phoneInput.focus();

    // Reset, force a reflow, then stagger back in — same easing/curve
    // as the rest of the site's [data-reveal] elements.
    revealEls.forEach((el) => el.classList.remove('is-visible'));
    void overlay.offsetHeight; // forces the browser to apply the reset above before re-adding the class
    lookupResult.textContent = ``;
    
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
  
 lookupBtn.addEventListener('click', async () => {
  const phone = phoneInput.value.trim();
  clearFormMessage(formMessage_Bk);

  if (!phone) {
     showFormMessage(formMessage_Bk, 'Enter the number you booked with.', 'error');
     return;
  }

  if(phone.length !== 11){
    showFormMessage(formMessage_Bk, 'Enter 11 digit phone number', 'error');
     return;
  }

  try {
    const response  = await fetch(`http://localhost:4000/api/v1/appointment/get-booking/${phone}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json()
    if(!response.ok || result.bookings.length === 0){
      lookupResult.textContent = ``;
      showFormMessage(formMessage_Bk, `No bookings are avaliable on ${phone} `, 'error');
      return;
    }

    lookupResult.innerHTML = result.bookings
    .map(
      (b) => `
        <div class="lookup-booking-item">
          <div class="booking-main">
            <div class="booking-service">
              ${b.service_name}
            </div>

            <div class="booking-details">
              <span>
                📅 ${b.date}
              </span>
              <span>
                🕒 ${formatTime12h(b.time)}
              </span>
            </div>
          </div>

          <div class="booking-status ${b.status.toLowerCase()}">
            ${b.status}
          </div>
        </div>
      `
    )
    .join('');
    
  } catch (error) {
    showFormMessage(formMessage_Bk, 'Server error. Try again later. Booking lookup', 'error');
    console.log(error.message || 'Error while looking up bookings');
  }
  });
})();