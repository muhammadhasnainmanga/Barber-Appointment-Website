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

const DAY_ABBR_BY_INDEX = ['sun','mon','tue','wed','thu','fri','sat'];
const params = new URLSearchParams(window.location.search);
let currentType = params.get('type') === 'home_service' ? 'home_service' : 'appointment';

// ---------- Mobile nav toggle (same pattern as home.js) ----------
const navToggle = document.querySelector('.nav-toggle');

const mainNav = document.querySelector('.main-nav');
navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

function applyType(type) {
  currentType = type;

  typeToggle.querySelectorAll('.type-option').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.type === type);
  });

  const isHomeService = type === 'home_service';
  addressGroup.hidden = !isHomeService;
  addressField.required = isHomeService;
  locationLink.style.display = isHomeService ? 'none' : '';

  clearFormMessage(formMessage);
  //service will be same everytime but dates will change with respect to toggle - so putting this function here
  populateDates(type);
}

typeToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.type-option');
  if (!btn) return;
  applyType(btn.dataset.type);
});

// ---------- Populate Services (runs once) ----------
async function populateServices() {
  try {
    const response = await fetch('http://localhost:4000/api/v1/appointment/get-services', {
      method: 'GET',
      headers: {'Content-Type': 'application/json'}
    });

    const services = await response.json();
    if(!response.ok || services.length === 0){
      serviceSelect.innerHTML = '<option value="" disabled selected>No services are avaliable</option>';
      return;
    }

    serviceSelect.innerHTML = '<option value="" disabled selected>Choose a service</option>';
    services.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.dataset.price = s.price;
    opt.textContent = `${s.name} — PKR ${s.price} (${s.duration})`;
    serviceSelect.appendChild(opt);
    });
  }catch (error) {
    serviceSelect.innerHTML = '<option value="" disabled selected>Choose a service</option>';
    console.log("Error while getting services for appointment");
  }
}

serviceSelect.addEventListener('change', () => {
  const selected = serviceSelect.selectedOptions[0];
  const price = selected ? selected.dataset.price : null;
  amountValue.textContent = price ? `PKR ${price}` : 'PKR —';
});

// ---------- Date and time  ----------
function generateTimes(start, end, durationMin) {
  const times = [];
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let cursor = h * 60 + m;
  const endCursor = endH * 60 + endM;
  while (cursor + Number(durationMin) <= endCursor) {
    const hh = Math.floor(cursor / 60);
    const mm = cursor % 60;
    times.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
    cursor += Number(durationMin);
  }
  return times;
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateAvailableDates(scheduleRows, dayBlock, dateOverride) {
  // Lookup table banao: 'mon' -> { isOpen, times: [...] }
  //get all the days mon - sun with avaliable dates from defualt schedule
  const scheduleByDay = {};
  scheduleRows.forEach((row) => {
    scheduleByDay[row.day] = {
      isOpen: !!row.is_open,
      times: row.is_open
        ? generateTimes(row.start_time.slice(0, 5), row.end_time.slice(0, 5), row.slot_duration_minutes)
        : [],
    };
  });

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 7);   // min-advance booking window

  const results = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const isoDate = toISODate(date);
    const dayAbbr = DAY_ABBR_BY_INDEX[date.getDay()];

    const daySchedule = scheduleByDay[dayAbbr];
    if (!daySchedule || !daySchedule.isOpen) continue;   // Step 2 — poora din band

    let availableTimes = {
      dateId: isoDate,
      time : [...daySchedule.times]
    }

    // Step 3a — recurring day/time blocks
    //yhn par block day where time == whole_day hai ko filter kar rhe
    const wholeDayBlocked = dayBlock.some(
      (b) => (b.day === dayAbbr || b.day === 'all') && b.time === 'whole_day'
    );
    if (wholeDayBlocked) {
      availableTimes.time = [];
    } else {
      //filtering specific block times here
      const blockedTimes = dayBlock
        .filter((b) => b.day === dayAbbr || b.day === 'all')
        .map((b) => b.time);
      availableTimes.time = availableTimes.time.filter((t) => !blockedTimes.includes(t));
    }

    // Step 3b — specific-date overrides
    const overrideWholeDay = dateOverride.some((o) => o.date === isoDate && o.time === 'whole_day');
    if (overrideWholeDay) {
      availableTimes.time = [];
    } else {
      //specific time jo block hai override me usko hta rha
      const overrideTimes = dateOverride.filter((o) => o.date === isoDate).map((o) => o.time);
      availableTimes.time = availableTimes.time.filter((t) => !overrideTimes.includes(t));
    }

    //agr upper whole day aya ya single single karke sare times block kar diya us date/day ke tou hum yhn usko result me add nhi karenge
    if (availableTimes.time.length === 0) continue;   // Step 4 — kuch bacha hi nahi, is date ko dikhao hi mat

    const label = date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
    results.push({ id: isoDate, label });
  }
  return results;
}

async function populateDates(type) {
  timeSelect.innerHTML = '<option value="" disabled selected>Choose a time</option>';
  timeSelect.disabled = true;
  try {
    const response = await fetch(`http://localhost:4000/api/v1/appointment/get-dates/${type}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();

    if (!response.ok) {
      dateSelect.innerHTML = '<option value="" disabled selected>Could not load dates</option>';
      return;
    }

    const availableDates = generateAvailableDates(result.schedule, result.dayBlock, result.dateOverride);
    if(availableDates.length === 0){
      dateSelect.innerHTML = '<option value="" disabled selected>No dates avaliable</option>';
      return;
    }

    dateSelect.innerHTML = '<option value="" disabled selected>Choose a date</option>';
    availableDates.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.label;
      dateSelect.appendChild(opt);
    });
  } catch (error) {
    dateSelect.innerHTML = '<option value="" disabled selected>Could not load dates</option>';
    console.log(error.message || "Error while getting dates for appointment");
  }
}

// ---------- Populate Times (runs when a date is picked) ---------- //
dateSelect.addEventListener('change', async () => {
  const selectedDate = dateSelect.value;
  timeSelect.innerHTML = '<option value="" disabled selected>Choose a time</option>';
  timeSelect.disabled = true;

  try {
    const response = await fetch(`http://localhost:4000/api/v1/appointment/get-time/${currentType}/${selectedDate}`,{
      method: 'GET'
    });
    const time = await response.json();

    if(!response.ok || time.times.length === 0){
      timeSelect.innerHTML = '<option value="" disabled selected>Could not load time</option>';
      return;
    }

    time.times.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    timeSelect.appendChild(opt);
    });

    timeSelect.disabled = false;
  } catch (error) {
    timeSelect.innerHTML = '<option value="" disabled selected>Could not load time</option>';
    console.log(error.message || "Error while getting time for selected date - appointment");
  }
});

// ---------- Form submit ----------
bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const serviceOpt = serviceSelect.selectedOptions[0];
  const dateOpt = dateSelect.selectedOptions[0];
  const timeVal = timeSelect.value;

  if (!name || !phone || !serviceOpt?.value || !dateOpt?.value || !timeVal) {
    showFormMessage(formMessage, 'Please fill every field before confirming.', 'error');
    return;
  }
  if (currentType === 'home_service' && !addressField.value.trim()) {
    showFormMessage(formMessage, 'Please add your address for a home service booking.', 'error');
    return;
  }

  clearFormMessage(formMessage);

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
  clearFormMessage(formMessage);
  applyType(currentType);
  amountValue.textContent = 'PKR —';
});

// ---------- Init ----------
populateServices();
applyType(currentType);