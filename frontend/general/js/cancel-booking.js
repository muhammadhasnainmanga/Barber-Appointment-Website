// ============================================
// SZCUTZ — Shared "Cancel Booking" modal
// Same self-injecting pattern as booking-lookup.js — reuses the
// site's [data-reveal] fade+rise CSS, manually replayed on open.
// ============================================

(function () {
  const modalHTML = `
    <div class="modal-overlay" id="cancelBookingOverlay">
      <div class="modal-card">
        <button type="button" class="modal-close" aria-label="Close">&times;</button>

        <!-- Step 1: phone lookup -->
        <div id="cancelLookupPanel">
          <span class="eyebrow" data-reveal="load" data-delay="0">Cancel Booking</span>
          <h3 data-reveal="load" data-delay="90">Cancel Your Booking</h3>
          <div class="form-group" data-reveal="load" data-delay="180">
            <label for="cancelLookupPhone">Your Number</label>
            <input type="tel" id="cancelLookupPhone" placeholder="03XX XXXXXXX" />
          </div>
          <div class="form-message_Bk" id="formMessage-lookup" role="alert" hidden></div>
          <button type="button" class="btn btn-primary" id="cancelLookupBtn" data-reveal="load" data-delay="270">Find My Bookings</button>
          <div class="lookup-result" id="cancelLookupResult"></div>
        </div>

        <!-- Step 2: confirm cancellation for one specific booking -->
        <div id="cancelConfirmPanel" hidden>
          <div class="cancel-confirm-panel">
            <span class="eyebrow">Confirm</span>
            <h3>Cancel this booking?</h3>
            <p id="cancelConfirmSummary"></p>
            <div class="form-message_Bk" id="formMessage-cancel" role="alert" hidden></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-primary" id="cancelConfirmBackBtn">Go Back</button>
              <button type="button" class="btn btn-danger btn-sm" id="cancelConfirmYesBtn">Yes, Cancel It</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const overlay = document.getElementById('cancelBookingOverlay');
  const closeBtn = overlay.querySelector('.modal-close');

  const lookupPanel = document.getElementById('cancelLookupPanel');
  const lookupBtn = document.getElementById('cancelLookupBtn');
  const lookupResult = document.getElementById('cancelLookupResult');
  const phoneInput = document.getElementById('cancelLookupPhone');

  const confirmPanel = document.getElementById('cancelConfirmPanel');
  const confirmSummary = document.getElementById('cancelConfirmSummary');
  const confirmBackBtn = document.getElementById('cancelConfirmBackBtn');
  const confirmYesBtn = document.getElementById('cancelConfirmYesBtn');

  const formMessage = document.getElementById('formMessage-cancel');
  const formMessage_lookup = document.getElementById('formMessage-lookup');
  const revealEls = overlay.querySelectorAll('[data-reveal]');
  let pendingCancelId = null;   // jis booking ko cancel karna hai, uska id yahan hold hota hai

  function formatTime12h(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
  }

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

  function playReveal() {
    revealEls.forEach((el) => el.classList.remove('is-visible'));
    void overlay.offsetHeight;
    revealEls.forEach((el) => {
      const delay = Number(el.dataset.delay ?? 0);
      setTimeout(() => el.classList.add('is-visible'), delay);
    });
  }

  function showLookupStep() {
    lookupPanel.hidden = false;
    confirmPanel.hidden = true;
    pendingCancelId = null;
  }

  function openModal() {
    showLookupStep();
    clearFormMessage(formMessage_lookup);
    lookupResult.innerHTML = '';
    phoneInput.value = '';
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    phoneInput.focus();
    playReveal();
  }

  function closeModal() {
    clearFormMessage(formMessage_lookup);
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    revealEls.forEach((el) => el.classList.remove('is-visible'));
  }

  document.querySelectorAll('[data-open-cancel-booking]').forEach((trigger) => {
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

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&#39;');
  }

  lookupResult.addEventListener('click', (event) => {
    const cancelBtn = event.target.closest('[data-cancel-id]');
    if (!cancelBtn) return;

    const id = Number(cancelBtn.dataset.cancelId);
    const serviceName = cancelBtn.dataset.serviceName || 'Service';
    const date = cancelBtn.dataset.date || '';
    const time = cancelBtn.dataset.time || '';

    openConfirmStep(id, serviceName, date, time);
  });

  // ---------- Step 1: lookup bookings by phone ----------
  // Reuses the same GET /api/v1/appointment/get-my-bookings?phone=... endpoint
  lookupBtn.addEventListener('click', async () => {
    const phone = phoneInput.value.trim();
    clearFormMessage(formMessage_lookup);
    if (!phone) {
      showFormMessage(formMessage_lookup, "Please enter your phone number")
      return;
    }

    if(phone.length !== 11){
     showFormMessage(formMessage_lookup, 'Enter 11 digit phone number', 'error');
     return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/appointment/get-booking/${phone}`,
        { method: 'GET' }
      );
      const result = await response.json();

      if (!response.ok) {
        showFormMessage(formMessage_lookup, 'Something went wrong - Try again', 'error');
        console.log('Error while getting bookings for cancel booking');
        return;
      }

      const cancellable = result.bookings.filter((b) => b.status !== 'cancelled');

      if (cancellable.length === 0) {
        showFormMessage(formMessage_lookup, `No booking against ${phone}`, 'error');
        return;
      }
      console.log(cancellable);
      lookupResult.innerHTML = cancellable
        .map(
          (b) => `
          <div class="cancel-booking-item">
            <div class="booking-main">
              <div class="booking-service">
                ${escapeHtml(b.service_name)}
              </div>

              <div class="booking-details">
                <span>📅 ${escapeHtml(b.date)}</span>
                <span>🕒 ${escapeHtml(formatTime12h(b.time))}</span>
              </div>
            </div>

            <div class="booking-actions">
              <div class="booking-status ${String(b.status).toLowerCase()}">
                ${escapeHtml(b.status)}
              </div>

              <button
                type="button"
                class="btn btn-danger btn-sm"
                data-cancel-id="${b.id}"
                data-service-name="${escapeHtml(b.service_name)}"
                data-date="${escapeHtml(b.date)}"
                data-time="${escapeHtml(formatTime12h(b.time))}"
              >Cancel</button>
            </div>
          </div>`
        )
        .join('');
    } catch (error) {
      lookupResult.innerHTML = '<div class="lookup-empty-state">Server error — please try again later.</div>';
      console.log(error.message || 'Error while looking up bookings');
    }
  });

  // ---------- Step 2: confirm cancellation ----------
  function openConfirmStep(id, serviceName, date, time) {
    pendingCancelId = id;
    confirmSummary.textContent = `${serviceName} on ${date} at ${time}`;
    lookupPanel.hidden = true;
    confirmPanel.hidden = false;
  }

  confirmBackBtn.addEventListener('click', showLookupStep);

  confirmYesBtn.addEventListener('click', async () => {
    if (!pendingCancelId) {
        console.log("No cancel id avaliable");
        return;
    }
    confirmYesBtn.disabled = true;

    try {
        const response = await fetch(`http://localhost:4000/api/v1/appointment/delete-booking/${pendingCancelId}`, {
            method: 'DELETE',
        });
    
        if(!response.ok){
            showFormMessage(formMessage, "Error - please try again", 'error');
            return;
        }
        confirmYesBtn.disabled = false;
        closeModal();
    } catch (error) {
        showFormMessage(formMessage, 'Server error. Try again later. Booking lookup', 'error');
        console.log(error.message || 'Error while looking up bookings');
    }
  });

  // Inline onclick se call karne ke liye global expose kiya —
  // bilkul waisa hi jaisa admin-side ke modals mein already ho raha hai
  window.__openCancelConfirm = openConfirmStep;
})();