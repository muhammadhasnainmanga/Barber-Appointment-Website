// ============================================
// SZCUTZ — Appointment page logic
// Every block below marked "MOCK DATA" or "MOCK SUBMIT" is exactly
// where a real fetch() call replaces the static array/object once
// the backend exists. The shape of the data is deliberately written
// to match what the real API route will return.
// ============================================

// ---------- Mobile nav toggle (same pattern as home.js) ----------
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

// ---------- Read booking type from the URL ----------
// index.html links here as appointment.html?type=appointment or ?type=home_service
const params = new URLSearchParams(window.location.search);
let currentType = params.get('type') === 'home_service' ? 'home_service' : 'appointment';

// ---------- MOCK DATA (shapes match the planned backend routes) ----------

// Will become: GET /api/user/services
const services = [
  { id: 'haircut', name: 'Haircut', price: 800, duration: '45 min' },
  { id: 'shave', name: 'Shave', price: 400, duration: '30 min' },
];

// Will become: GET /api/user/dates?type=appointment | home_service
// (separate availability pools, as decided earlier)
const datesByType = {
  appointment: [
    { id: 'd1', label: 'Mon, 27 Jul' },
    { id: 'd2', label: 'Tue, 28 Jul' },
  ],
  home_service: [
    { id: 'd3', label: 'Wed, 29 Jul' },
    { id: 'd4', label: 'Thu, 30 Jul' },
  ],
};

// Will become: GET /api/user/times/:dateId  (only unbooked slots)
const timesByDate = {
  d1: ['1:00 PM', '3:00 PM', '5:00 PM'],
  d2: ['5:00 PM', '7:00 PM'],
  d3: ['2:00 PM'],
  d4: ['4:00 PM', '6:00 PM'],
};

// ---------- Element references ----------
const typeToggle = document.getElementById('typeToggle');
const serviceSelect = document.getElementById('service');
const dateSelect = document.getElementById('date');
const timeSelect = document.getElementById('time');
const addressGroup = document.getElementById('addressGroup');
const addressField = document.getElementById('address');
const locationLink = document.getElementById('locationLink');
const amountValue = document.getElementById('amountValue');
const bookingForm = document.getElementById('bookingForm');
const confirmationPanel = document.getElementById('confirmationPanel');
const confirmationSummary = document.getElementById('confirmationSummary');
const bookAnotherBtn = document.getElementById('bookAnotherBtn');
const formMessage = document.getElementById('formMessage');
const AppointmentBtn = document.getElementById('appointmentBtn');
const HomeserviceBtn = document.getElementById('homeserviceBtn');

function showFormMessage(message) {
  formMessage.textContent = message;
  formMessage.hidden = false;
}

function clearFormMessage() {
  formMessage.textContent = '';
  formMessage.hidden = true;
}

// ---------- Populate Services (runs once) ----------
function populateServices() {
  serviceSelect.innerHTML = '<option value="" disabled selected>Choose a service</option>';
  services.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.dataset.price = s.price;
    opt.textContent = `${s.name} — PKR ${s.price} (${s.duration})`;
    serviceSelect.appendChild(opt);
  });
}

// ---------- Populate Dates (re-runs whenever type changes) ----------
function populateDates() {
  dateSelect.innerHTML = '<option value="" disabled selected>Choose a date</option>';
  datesByType[currentType].forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.label;
    dateSelect.appendChild(opt);
  });

  // Date changed meaning → reset whatever time was previously selected
  timeSelect.innerHTML = '<option value="" disabled selected>Pick a date first</option>';
  timeSelect.disabled = true;
}

// ---------- Populate Times (runs when a date is picked) ----------
dateSelect.addEventListener('change', () => {
  const slots = timesByDate[dateSelect.value] || [];
  timeSelect.innerHTML = '<option value="" disabled selected>Choose a time</option>';
  slots.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    timeSelect.appendChild(opt);
  });
  timeSelect.disabled = slots.length === 0;
});

// ---------- Amount — always derived from the service, never hand-typed ----------
// (Same trust-boundary rule the backend will enforce: the server recalculates
// this from service_id too, so a tampered client value can never change the price.)
serviceSelect.addEventListener('change', () => {
  const selected = serviceSelect.selectedOptions[0];
  const price = selected ? selected.dataset.price : null;
  amountValue.textContent = price ? `PKR ${price}` : 'PKR —';
});

// ---------- Type toggle (shop visit vs. home service) ----------
function applyType(type) {
  currentType = type;

  typeToggle.querySelectorAll('.type-option').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.type === type);
  });

  const isHomeService = type === 'home_service';
  addressGroup.hidden = !isHomeService;
  addressField.required = isHomeService;
  locationLink.style.display = isHomeService ? 'none' : '';

  clearFormMessage();
  populateDates();
}

typeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.type-option');
  if (!btn) return;
  applyType(btn.dataset.type);
});

// ---------- Form submit ----------
// MOCK SUBMIT — this whole handler's fetch-shaped logic gets replaced by:
//   const res = await fetch('/api/user/bookings', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ name, phone, serviceId, dateId, time, type, address })
//   });
bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const serviceOpt = serviceSelect.selectedOptions[0];
  const dateOpt = dateSelect.selectedOptions[0];
  const timeVal = timeSelect.value;

  if (!name || !phone || !serviceOpt?.value || !dateOpt?.value || !timeVal) {
    showFormMessage('Please fill every field before confirming.');
    return;
  }
  if (currentType === 'home_service' && !addressField.value.trim()) {
    showFormMessage('Please add your address for a home service booking.');
    return;
  }

  clearFormMessage();

  const summary = `
    ${serviceOpt.textContent.split(' — ')[0]} for ${name} on ${dateOpt.textContent} at ${timeVal}.
    ${currentType === 'home_service' ? "We'll come to you." : 'See you at the shop.'}
  `;

  bookingForm.hidden = true;
  confirmationPanel.hidden = false;
  confirmationSummary.textContent = summary.trim();
  AppointmentBtn.disabled = true;
  HomeserviceBtn.disabled = true;

});

bookAnotherBtn.addEventListener('click', () => {
  bookingForm.reset();
  bookingForm.hidden = false;
  confirmationPanel.hidden = true;
  AppointmentBtn.disabled = false;
  HomeserviceBtn.disabled = false;
  clearFormMessage();
  applyType(currentType);
  amountValue.textContent = 'PKR —';
});

// ---------- Init ----------
populateServices();
applyType(currentType);