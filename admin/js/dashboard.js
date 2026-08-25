// ============================================
// SZCUTZ Admin — Dashboard logic (sidebar version)
// MOCK DATA everywhere — every backend-bound action is commented
// with the real route it becomes.
import {protectedFetch} from "./auth.ClientApi.js";

// ============================================
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


const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

// ---------- Greeting + avatar (from what was typed at login) ----------
const savedUsername = localStorage.getItem('szcutz_admin_username') || 'Admin';
document.getElementById('adminGreeting').textContent = `Hi, ${savedUsername}`;
document.getElementById('profileName').textContent = savedUsername;
document.getElementById('profileAvatar').textContent = savedUsername.charAt(0).toUpperCase();

// ---------- Profile popup ----------
const profileTrigger = document.getElementById('profileTrigger');
const profilePopup = document.getElementById('profilePopup');

profileTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  profilePopup.classList.toggle('is-open');
});

document.addEventListener('click', (e) => {
  if (!profilePopup.contains(e.target) && e.target !== profileTrigger) {
    profilePopup.classList.remove('is-open');
  }
});

// ---------- Change Password modal ----------
const passwordModal = document.getElementById('passwordModal');
document.getElementById('changePasswordBtn').addEventListener('click', () => {
  profilePopup.classList.remove('is-open');
  passwordModal.classList.add('is-open');
});
document.getElementById('closePasswordModal').addEventListener('click', () => {
  passwordModal.classList.remove('is-open');
  clearFormMessage();
});

// Password visibility toggles for current / new / confirm fields
document.querySelectorAll('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.classList.toggle('is-visible', isHidden);
    btn.setAttribute('aria-pressed', String(isHidden));
  });
});

// MOCK — becomes: PATCH /api/admin/password  { currentPassword, newPassword }
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const nextPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const formMessagePassword = document.getElementById('formMessage-password');
  clearFormMessage(formMessagePassword);

  if(!currentPassword || !nextPassword || !confirmPassword){
    showFormMessage(formMessagePassword ,'Fill al the fields', 'error');
    return;
  }

  if(nextPassword.length < 6){
    showFormMessage(formMessagePassword ,'New Password must be 6 characters', 'error');
    return;
  }

  if(nextPassword !== confirmPassword){
    showFormMessage(formMessagePassword ,"New passwords don't match.", 'error');
    return;
  }

  try {
    
    const response = await protectedFetch('http://localhost:4000/api/v1/admin/change-password', {
      method: 'POST',
      body: {currentPassword, nextPassword, confirmPassword}
    });

    if(response.ok){
        showFormMessage(formMessagePassword, "Password Changed Successfully", 'success');
        setTimeout(() => {
            passwordModal.classList.remove('is-open');
            clearFormMessage(formMessagePassword);
            e.target.reset();
        }, 1200);
        
    }else{
      const res = await response.json();
      showFormMessage(formMessagePassword, res.message, 'error');
      return;
    }

  } catch (error) {
    showFormMessage(formMessagePassword, error?.message || "Something went wrong try again later !", 'error');
    console.log(error?.message);
  }

});

// ============================================
// SIDEBAR ACCORDIONS (Bookings / Slots groups)
// ============================================

function toggleAccordion(key) {
  const panel = document.getElementById(`accordion-${key}`);
  const toggleBtn = document.querySelector(`[data-accordion="${key}"]`);
  const isOpen = toggleBtn.classList.contains('is-open');

  if (isOpen) {
    panel.style.maxHeight = '0px';
    toggleBtn.classList.remove('is-open');
  } else {
    toggleBtn.classList.add('is-open');
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  }
}

document.querySelectorAll('.accordion-toggle').forEach((btn) => {
  btn.addEventListener('click', () => toggleAccordion(btn.dataset.accordion));
});


// REVEAL ANIMATION (fade + rise)
function playReveal(container) {
  if (!container) return;
  const els = container.querySelectorAll('[data-reveal]');
  els.forEach((el) => el.classList.remove('is-visible'));
  void container.offsetHeight; // forces the reset above to commit before we re-add the class
  els.forEach((el) => {
    const delay = Number(el.dataset.delay ?? 0);
    setTimeout(() => el.classList.add('is-visible'), delay);
  });
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('is-active'));
  document.getElementById(`view-${viewName}`).classList.add('is-active');
}

// Only real navigation items (top-level items with data-view, and the
// sub-items inside accordions) drive view switching — the accordion
// headers themselves are handled separately above, purely for expand/collapse.
document.querySelectorAll('.side-nav-item:not(.accordion-toggle), .side-nav-sub').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.side-nav-item, .side-nav-sub').forEach((b) => b.classList.remove('is-active'));
    document.querySelectorAll('.accordion-toggle').forEach((b) => b.classList.remove('has-active-child'));

    btn.classList.add('is-active');

    // If this is a sub-item, tint its parent accordion header so context
    // stays visible even if the admin collapses the group afterwards.
    const parentPanel = btn.closest('.accordion-panel');
    if (parentPanel) {
      document.querySelector(`[data-accordion="${parentPanel.id.replace('accordion-', '')}"]`)
        .classList.add('has-active-child');
    }

    const view = btn.dataset.view;
    showView(view);

    if (view === 'booking') {
      currentStatusFilter = btn.dataset.status;
      const titleMap = { confirmed: 'Confirmed Bookings', pending: 'Pending Bookings', cancelled: 'Cancelled Bookings', all: 'All Bookings' };
      document.getElementById('bookingViewTitle').textContent = titleMap[currentStatusFilter];
      renderBookings(); // renders the fresh rows — playReveal fires at the end of renderBookings() itself
    } else {
      playReveal(document.getElementById(`view-${view}`));
    }
  });
});

// ============================================
// BOOKINGS — GET /api/admin/bookings, PATCH /api/admin/bookings/:id

//Will create a function here jisme get query hoga with all stuff and then wo query phir renderBookings pe call hogi
async function getBookingsFromServer() {
  try{
    const response = await protectedFetch('http://localhost:4000/api/v1/bookings/get-all-bookings', {
    method: 'GET'
  });
  const result = await response.json();
  if(!response.ok){
    console.log("Failed to fetch bookings from server");
    return "NULL";
  }
  return result.result;
  }catch(error){
    console.log("Error while fetching bookings from server");
    return "NULL";
  }
}

let bookings;
let currentStatusFilter = 'confirmed';

async function renderBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;
  bookings = await getBookingsFromServer();

  //incase of null
  if(bookings === "NULL"){
    tbody.innerHTML =  `
    <tr>
      <td class="empty-state-cell" colspan="8">
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No bookings available - Server error.</p>
        </div>
      </td>
    </tr>
  `;
    playReveal(document.getElementById('view-booking'));
    return;
  }

  //filterization
  const filteredBookings = bookings.filter((b) => {
    const statusMatch = currentStatusFilter === 'all' || b.status === currentStatusFilter;
    const afterFrom = !from || b.date >= from;
    const beforeTo = !to || b.date <= to;
    return statusMatch && afterFrom && beforeTo;
  });

  //incase of no bookings
  if (filteredBookings.length === 0) {
    tbody.innerHTML =  `
    <tr>
      <td class="empty-state-cell" colspan="8">
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No ${currentStatusFilter === 'all' ? '' : `${currentStatusFilter} `}bookings available.</p>
        </div>
      </td>
    </tr>
  `;
  playReveal(document.getElementById('view-booking'));
  return;
  }

  //last case bookings
  tbody.innerHTML = filteredBookings
    .map(
      (b, i) => `
      <tr data-booking-id="${b.id}" data-reveal data-delay="${i * 45}">
        <td class="cell-muted">#${b.id}</td>
        <td>${b.service_name}</td>
        <td>${b.name}</td>
        <td class="cell-muted">${b.phone}</td>
        <td>${b.date} · ${formatTime12h(b.time)}</td>
        <td class="cell-muted">${b.type === 'home_service' ? 'Home Service' : 'At Shop'}</td>
        <td>PKR ${b.amount}</td>
        <td>
          <div class="status-control">
            <select class="status-select ${b.status}" onchange="changeStatus(${b.id}, this.value)">
              <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>🟡 Pending</option>
              <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>🟢 Confirmed</option>
              <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>🔴 Cancelled</option>
            </select>
            <span class="status-error-icon" title="Could not update status" aria-label="Could not update status" hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
          </div>
        </td>
      </tr>`
    )
    .join('');

  playReveal(document.getElementById('view-booking')); // 🔧 runs after the new rows exist, not before
}

document.getElementById('filterFrom').addEventListener('change', renderBookings);
document.getElementById('filterTo').addEventListener('change', renderBookings);
document.getElementById('clearDateFilter').addEventListener('click', () => {
  document.getElementById('filterFrom').value = '';
  document.getElementById('filterTo').value = '';
  renderBookings();
});

// MOCK — becomes: PATCH /api/admin/bookings/:id  { status: newStatus }
async function changeStatus(id, newStatus) {
  const booking = bookings.find((b) => b.id === id);
  const row = document.querySelector(`[data-booking-id="${id}"]`);
  const select = row?.querySelector('.status-select');
  const errorIcon = row?.querySelector('.status-error-icon');
  const previousStatus = booking?.status;
  
  if (select) select.disabled = true;
  if (errorIcon) errorIcon.hidden = true;

  try {
    const response = await protectedFetch(`http://localhost:4000/api/v1/bookings/update-booking-status/${id}`, {
      method: 'PATCH',
      body: {status: newStatus}
    });

    if (!response.ok) {
      if (select) select.value = previousStatus;
      if (errorIcon) errorIcon.hidden = false;
      return;
    }
    if (booking) booking.status = newStatus;
    await renderBookings();
  } catch (error) {
    if (select) select.value = previousStatus;
    if (errorIcon) errorIcon.hidden = false;
    console.log(error?.message || 'Error while updating booking status');
  } finally {
    if (select) select.disabled = false;
  }
}

window.changeStatus = changeStatus;

// ============================================
// DEFAULT SCHEDULE — per (type, day) now, not one rule for many days
// Becomes: POST /api/admin/schedule  { type, days: {...} }
// ============================================

//duration
const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180];
let defaultSchedules = {
  appointment: {},
  home_service: {},
};

let currentDefaultType = 'appointment';
const formMessagedefaultSchedule = document.getElementById('formMessage-defaultSchedule');


async function getDefaultSchedulesFromServer() {
  try {
    const response = await protectedFetch('http://localhost:4000/api/v1/schedule/get-schedule', {
      method: 'GET'
    })
    const result = await response.json();

    if(!response.ok){
      showFormMessage(formMessagedefaultSchedule, response.message, 'error');
      return [];    
    }
    // console.log(result.results);
    return result.results;
  }catch (error) {
    showFormMessage(formMessagedefaultSchedule, error?.message || "Something went wrong try again later !", 'error');
    console.log(error?.message);
    return[];
  }
}

async function loadDefaultSchedules() { 
  ['appointment', 'home_service'].forEach((type) => ensureScheduleShape(type)); // pehle saare 7 din defaults se bhar do

  const rows = await getDefaultSchedulesFromServer();

  rows.forEach((row) => {
    // if(row.is_open){
    const entry = defaultSchedules[row.type][row.day];
    entry.isOpen = !!row.is_open;
    entry.start = entry.isOpen ? row.start_time?.slice(0, 5) : [];   // 🔧 neeche wajah explain ki hai
    entry.end = entry.isOpen ? row.end_time?.slice(0, 5) : [];
    entry.duration = row.slot_duration_minutes;
    entry.times = entry.isOpen ? generateTimes(entry.start, entry.end, entry.duration) : [];
    // }
  });

}

//time generator
function generateTimes(start, end, durationMin) {
  const times = [];
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let cursor = h * 60 + m;
  const endCursor = endH * 60 + endM;

  while (cursor + Number(durationMin) <= endCursor) {
    const hh = Math.floor(cursor / 60);
    const mm = cursor % 60;
    times.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
    cursor += Number(durationMin);
  }
  return times;
}

function formatTime12h(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

function defaultDayEntry() {
  return { isOpen: true, start: '09:00', end: '17:00', duration: 60, times: [] };
}

//making defaultSchedules a 2d array here type + day

// Guarantees every type always has all 7 days present in state,
// even before the admin has touched anything.
function ensureScheduleShape(type) {
  if (!defaultSchedules[type]) defaultSchedules[type] = {};
  DAY_ORDER.forEach((day) => {
    if (!defaultSchedules[type][day]) {
      defaultSchedules[type][day] = defaultDayEntry();
    }
  });
}

function renderScheduleRows(type) {
  ensureScheduleShape(type);
  const container = document.getElementById('defaultScheduleRows');
  clearFormMessage(formMessagedefaultSchedule);

  container.innerHTML = DAY_ORDER.map((day) => {
    const entry = defaultSchedules[type][day];
    return `
      <div class="schedule-row ${entry.isOpen ? '' : 'is-closed'}" data-day="${day}">
        <label class="schedule-day-toggle">
          <input type="checkbox" class="schedule-open-checkbox" ${entry.isOpen ? 'checked' : ''} />
          <span>${DAY_LABELS[day]}</span>
        </label>
        <div class="schedule-time-fields">
          <input type="time" class="schedule-start" value="${entry.start}" ${entry.isOpen ? '' : 'disabled'} />
          <span class="schedule-time-sep">to</span>
          <input type="time" class="schedule-end" value="${entry.end}" ${entry.isOpen ? '' : 'disabled'} />
          <select class="schedule-duration" ${entry.isOpen ? '' : 'disabled'}>
            ${DURATION_OPTIONS.map((d) => `<option value="${d}" ${entry.duration === d ? 'selected' : ''}>${d} min</option>`).join('')}
          </select>
        </div>
      </div>`;
  }).join('');
}
//Agr sirf change kya but save nhi kya tou default me save kar dega for easiness

// Event delegation — one listener handles all 7 rows, since they're
// re-rendered often (no point attaching 21 individual listeners).
document.getElementById('defaultScheduleRows').addEventListener('change', (e) => {
  const row = e.target.closest('.schedule-row');
  if (!row) return;
  const day = row.dataset.day;
  const entry = defaultSchedules[currentDefaultType][day];

  if (e.target.classList.contains('schedule-open-checkbox')) {
    entry.isOpen = e.target.checked;
    if (entry.isOpen && (!entry.start || !entry.end || !entry.duration)) {
      const fallback = defaultDayEntry();
      entry.start = entry.start || fallback.start;
      entry.end = entry.end || fallback.end;
      entry.duration = entry.duration || fallback.duration;
    }

    renderScheduleRows(currentDefaultType);
    return;
  }
  if (e.target.classList.contains('schedule-start')) entry.start = e.target.value;
  if (e.target.classList.contains('schedule-end')) entry.end = e.target.value;
  if (e.target.classList.contains('schedule-duration')) entry.duration = Number(e.target.value);
});

document.getElementById('defaultTypeToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#defaultTypeToggle button').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  currentDefaultType = btn.dataset.type;
  renderScheduleRows(currentDefaultType);
  renderDefaultPreview(currentDefaultType);
});

//the one which we see below sample kind a thing - niche jo sample rows hain wo
function renderDefaultPreview(type) {
  const schedule = defaultSchedules[type];
  const container = document.getElementById('defaultPreviewChips');

  container.innerHTML = DAY_ORDER.map((day) => {
    const entry = schedule[day];
    if (!entry.isOpen) {
      return `<div class="preview-day-row"><strong>${DAY_LABELS[day]}</strong><span class="cell-muted">Closed</span></div>`;
    }
    const chips = (entry.times || [])
      .map((t) => `<span class="slot-chip">${formatTime12h(t)}</span>`)
      .join('');
    return `<div class="preview-day-row"><strong>${DAY_LABELS[day]}</strong><div class="slot-chip-row">${chips || '<span class="cell-muted">No slots</span>'}</div></div>`;
  }).join('');
}

// MOCK — becomes: POST /api/admin/schedule
document.getElementById('saveDefaultScheduleBtn').addEventListener('click', async () => {
  const schedule = defaultSchedules[currentDefaultType];
  clearFormMessage(formMessagedefaultSchedule);

  const dayPayload = [];

  for (const day of DAY_ORDER) {
    const entry = schedule[day];
    if (!entry.isOpen) {
      entry.times = [];
      dayPayload.push({ day, isOpen: false, start: null, end: null, duration: null });
      continue;
    }
    if (!entry.start || !entry.end || entry.start >= entry.end) {
      showFormMessage(formMessagedefaultSchedule, `Start time is after before time on ${DAY_LABELS[day]}`, 'error');
      return;
    }
    entry.times = generateTimes(entry.start, entry.end, entry.duration);
    dayPayload.push({ day, isOpen: true, start: entry.start, end: entry.end, duration: entry.duration});
  }

  try {
      const response = await protectedFetch('http://localhost:4000/api/v1/schedule/post-schedule', {
        method: 'POST',
        body: {
          type: currentDefaultType,
          days: dayPayload,
        }
      });

      if(!response.ok){
         const res = await response.json();
        showFormMessage(formMessagedefaultSchedule, res.message || "Failed to save Default Schedule", 'error');
        return;
      }

      showFormMessage(formMessagedefaultSchedule, "Default Schedule saved successfully", 'success');
      setTimeout(() => {
        clearFormMessage(formMessagedefaultSchedule)
      }, 2000);

    } catch (error) {
      console.log("Error while saving default schedule");
      showFormMessage(formMessagedefaultSchedule, error.message || "Failed to save Default Schedule", 'error');
      return;
    }

    renderDefaultPreview(currentDefaultType);
    renderBlockTimeChips();
    renderWeeklyGrid();
});

// ============================================
// BLOCKED SLOTS — Time dropdown ab Day ke hisaab se bhi badalta hai
// ============================================

let blockedSlots = [];;
let currentBlockedType = 'appointment';
let selectedBlockTimes = new Set();   // specific 'HH:MM' strings
let wholeDaySelected = false;
const formMessageBlockSlots = document.getElementById('formMessage-Block-slots'); 

const blockTimeChipsEl = document.getElementById('blockTimeChips');

function getTimesForCurrentDay() {
  const day = document.getElementById('blockDay').value;
  const schedule = defaultSchedules[currentBlockedType];

  if (day === 'all') {
    const allTimes = new Set();
    DAY_ORDER.forEach((d) => (schedule[d]?.times || []).forEach((t) => allTimes.add(t)));
    return [...allTimes].sort();
  }
  return schedule[day]?.times || [];
}

//We can might change it cuz har action pe button bhi wapsi pure html me laga rha instead pf just adding active wagera
function renderBlockTimeChips() {
  const day = document.getElementById('blockDay').value;
  const timesToShow = getTimesForCurrentDay();
 
  if (timesToShow.length === 0) {
  blockTimeChipsEl.innerHTML = `
    <div class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p>${day === "all" ? "No default schedule available." : `${DAY_LABELS[day]} has no default schedule available.`}</p>
    </div>
  `;
  return;
  }

  //all this backchodi for disabling blocked once
  const isWholeDayBlocked = blockedSlots.some(
    (b) =>
      b.type === currentBlockedType &&
      (b.day === day || b.day === 'all') &&
      (b.time === 'whole_day')
  );

  let wholeDayChip = '';
  if(timesToShow.length >= 2){
    wholeDayChip =  `<button
    type="button"
    class="day-chip all-days ${wholeDaySelected ? 'is-active' : '' }"
    data-time="whole_day" ${isWholeDayBlocked ? 'disabled' : ''}>
    Whole Day
    </button>`;
  }

  //same here
  const timeChips = timesToShow
    .map((t) => {
      const isBlocked = blockedSlots.some(
        (b) =>
          b.type === currentBlockedType &&
          (b.day === day || b.day === 'all') &&
          (b.time === t || b.time === 'whole_day')
      );

      return `
        <button
          type="button"
          class="day-chip ${selectedBlockTimes.has(t) ? 'is-active' : ''}"
          data-time="${t}"
          ${isBlocked ? 'disabled' : ''}
        >
          ${formatTime12h(t)}
        </button>`;
    })
    .join('');

  blockTimeChipsEl.innerHTML = wholeDayChip + timeChips;
}

// jb bhi kio chip pe click hoga uska color change kardega + agr sari select ki tou whole pe shift
blockTimeChipsEl.addEventListener('click', (e) => {
  const activeChips = document.querySelectorAll('.day-chip.is-active, .day-chip:disabled');
  const totalChips = getTimesForCurrentDay();

  const chip = e.target.closest('.day-chip');
  if (!chip) return;
  const time = chip.dataset.time;
  if (time === 'whole_day') {
    wholeDaySelected = !wholeDaySelected;
    if (wholeDaySelected) selectedBlockTimes.clear(); // whole-day individual selections ko override karta hai
  }
  else if(activeChips.length === totalChips.length-1 && !wholeDaySelected){
    wholeDaySelected = true;
    if (wholeDaySelected) selectedBlockTimes.clear();
  }
  else{
    wholeDaySelected = false; // ek specific time chunna whole-day ko cancel kar deta hai
    selectedBlockTimes.has(time) ? selectedBlockTimes.delete(time) : selectedBlockTimes.add(time);
  }
  renderBlockTimeChips();
});

//clear button
document.getElementById('clearAllTimesBtn').addEventListener('click', () => {
  selectedBlockTimes.clear();
  wholeDaySelected = false;
  renderBlockTimeChips();
});

//day change kya tou
document.getElementById('blockDay').addEventListener('change', () => {
  selectedBlockTimes.clear();   // naya din = purani selection irrelevant ho jaati hai
  wholeDaySelected = false;
  renderBlockTimeChips();
});

//toggling home service to shop
document.getElementById('blockedTypeToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#blockedTypeToggle button').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  currentBlockedType = btn.dataset.type;
  selectedBlockTimes.clear();
  wholeDaySelected = false;

  renderBlockTimeChips();
  renderBlockedTable();
  renderWeeklyGrid();
});

//final add block button + api call
document.getElementById('addBlockBtn').addEventListener('click', async () => {
  const day = document.getElementById('blockDay').value;
  const type = currentBlockedType;
  clearFormMessage(formMessageBlockSlots);

  if (!wholeDaySelected && selectedBlockTimes.size === 0) {
    showFormMessage(formMessageBlockSlots, 'Select atleast one option', 'error');
    return;
  }

  // Whole Day ho toh sirf ek entry, warna har selected time ke liye ek —
  // yehi loop-and-collect pattern hai jo humne Default Schedule save karte waqt use kiya tha
  
  const timesToBlock = wholeDaySelected ? ['whole_day'] : [...selectedBlockTimes];
  try {
    const response = await protectedFetch('http://localhost:4000/api/v1/schedule/block-slots', {
      method: 'POST',
      body: {type, day, timesToBlock}
    })
    const res = await response.json();
    if(!response.ok){
      showFormMessage(formMessageBlockSlots, res.message, 'error');
      return;    
    } 
  }catch (error) {
    showFormMessage(formMessageBlockSlots, error?.message || "Something went wrong try again later !", 'error');
    console.log(error?.message);
    return;
  }

  blockedSlots = await getBlockSlots();

  selectedBlockTimes.clear();
  wholeDaySelected = false;

  //re redner chips + weekly schedule + blocked table
  renderBlockTimeChips();
  renderBlockedTable();
  renderWeeklyGrid();
});

//Blocked table rendering with html (Not weekly grid)
function renderBlockedTable() {
  const tbody = document.getElementById('blockedTableBody');
  const rows = blockedSlots.filter((b) => b.type === currentBlockedType);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Nothing blocked yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (b) => `
      <tr>
        <td class="cell-muted">${b.type === 'home_service' ? 'Home Service' : 'At Shop'}</td>
        <td>${b.day === 'all' ? 'All Days' : DAY_LABELS[b.day]}</td>
        <td>${b.time === 'whole_day' ? 'Whole Day' : formatTime12h(b.time)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeBlock('${b.type}', '${b.day}', '${b.time}')">Remove</button></td>
      </tr>`
    )
    .join('');
}

//Remove button for table individual slots
window.removeBlock = async function (type, day, time) {

  try {
    const response = await protectedFetch(`http://localhost:4000/api/v1/schedule/remove-block-slots`, {
      method: 'DELETE',
      body: {type, day, time}
    })
    const res = await response.json();
    if(!response.ok){
      showFormMessage(formMessageBlockSlots, res.message, 'error');
      return;    
    } 
  } catch (error) {
    showFormMessage(formMessageBlockSlots, error?.message || "Something went wrong try again later !", 'error');
    console.log(error?.message);
    return;
  }

  blockedSlots = await getBlockSlots();
  
  renderBlockTimeChips();
  renderBlockedTable();
  renderWeeklyGrid();
}

function isSlotBlocked(type, day, time) {
  return blockedSlots.some(
    (b) => b.type === type && (b.day === 'all' || b.day === day) && (b.time === 'whole_day' || b.time === time)
  );
}

async function getBlockSlots() {
  try {
    const response = await protectedFetch('http://localhost:4000/api/v1/schedule/get-block-slots', {
      method: 'GET'
    });

    if(!response.ok){
      showFormMessage(formMessageBlockSlots, response.message, 'error');
      return [];
    }
    const result = await response.json();
    return result.results;

  } catch (error) {
    showFormMessage(formMessageBlockSlots, error?.message || "Something went wrong try again later ! - Get block schedules", 'error');
    console.log(error?.message);
    return [];
  }
}

// Ab rows (times) har din alag ho sakte hain, isliye grid ki rows
// "saare open-days ke times ka union" se banti hain, sorted.

//Weekly grid table rendering
function renderWeeklyGrid() {
  const grid = document.getElementById('weeklyGrid');
  const schedule = defaultSchedules[currentBlockedType];

  const allTimesSet = new Set();
  DAY_ORDER.forEach((day) => {
    (schedule[day]?.times || []).forEach((t) => allTimesSet.add(t));
  });
  const allTimes = [...allTimesSet].sort();

  if (allTimes.length === 0) {
    grid.innerHTML = `<tr><td class="cell-muted" style="padding:24px;">Default Schedule save karo pehle.</td></tr>`;
    return;
  }

  const headerRow = `<tr><th>Time</th>${DAY_ORDER.map((d) => `<th>${DAY_LABELS[d]}</th>`).join('')}</tr>`;

  const bodyRows = allTimes
    .map((time) => {
      const cells = DAY_ORDER.map((day) => {
        const entry = schedule[day];
        const inSchedule = entry?.isOpen && entry.times?.includes(time);
        if (!inSchedule) return `<td class="grid-blocked">—</td>`;
        const blocked = isSlotBlocked(currentBlockedType, day, time);
        return blocked ? `<td class="grid-blocked">Blocked</td>` : `<td class="grid-open">✓</td>`;
      }).join('');
      return `<tr><td class="time-label">${formatTime12h(time)}</td>${cells}</tr>`;
    })
    .join('');

  grid.innerHTML = headerRow + bodyRows;
}



// ============================================
// DATE OVERRIDES — one-off exceptions to a specific calendar date
// Becomes: POST /api/admin/date-overrides, DELETE /api/admin/date-overrides/:id
// ============================================

let dateOverrides = [];
let currentOverrideType = 'appointment';
const formMessageOverridesSlots = document.getElementById('formMessage-Overrides-slots');

//getting day from the written date
function getDayAbbrFromDate(dateStr) {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const d = new Date(dateStr + 'T00:00:00'); // 'T00:00:00' timezone-shift se bachata hai and set to like strt of the day
  return days[d.getDay()]; //return 7 days of the week
}

document.getElementById('overrideTypeToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#overrideTypeToggle button').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  currentOverrideType = btn.dataset.type;
  populateOverrideTimeDropdown();
  renderOverridesTable();
});

// Date badalte hi — us din ke actual schedule-times dropdown mein dikhao
document.getElementById('overrideDate').addEventListener('change', populateOverrideTimeDropdown);

//creating time options according to the date
function populateOverrideTimeDropdown() {
  const select = document.getElementById('overrideTime');
  const dateVal = document.getElementById('overrideDate').value;
  select.innerHTML = '<option value="whole_day">Whole Day</option>';

  if (!dateVal) return;

  const dayAbbr = getDayAbbrFromDate(dateVal);
  const schedule = defaultSchedules[currentOverrideType]?.[dayAbbr];

  if (!schedule || !schedule.isOpen) return; // us din shop hi band hai — sirf "Whole Day" kaafi hai

  (schedule.times || []).forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = formatTime12h(t);
    select.appendChild(opt);
  });
}

document.getElementById('addOverrideBtn').addEventListener('click', async () => {
  const date = document.getElementById('overrideDate').value;
  const time = document.getElementById('overrideTime').value;
  const reason = document.getElementById('overrideReason').value.trim();
  const type = currentOverrideType;
  clearFormMessage(formMessageOverridesSlots);

  if (!date) {
    showFormMessage(formMessageOverridesSlots, "Select a date first", 'error');
    setTimeout(() => {
    clearFormMessage(formMessageOverridesSlots);
    }, 5000);
    return;
  }

  const alreadyExists = dateOverrides.some(
    (o) => o.type === currentOverrideType && o.date === date && o.time === time
  );
  if (alreadyExists){
  showFormMessage(formMessageOverridesSlots, "Selected date and time are already blocked", 'error');
  setTimeout(() => {
    clearFormMessage(formMessageOverridesSlots);
  }, 5000);
  return;
  }

  try{
    const response = await protectedFetch('http://localhost:4000/api/v1/schedule/post-date-overrides', {
      method: 'POST',
      body: {type, date, time, reason}
    });

    const res = await response.json();
    if(!response.ok){
      showFormMessage(formMessageOverridesSlots, res.message || "Error while adding date override", 'error');
      console.log(res.message || "Error while adding date override");
      return;
    }

  }catch (error) {
    console.error('Error while adding date override', error);
    showFormMessage(formMessageOverridesSlots, "Error while adding date override", 'error');
    setTimeout(() => {
      clearFormMessage(formMessageOverridesSlots);
    }, 2000);
    return;
  }

  dateOverrides = await getOverrideSlots();
  renderOverridesTable();

  document.getElementById('overrideReason').value = '';
});

//for rendering the table of overrides
function renderOverridesTable() {
  const tbody = document.getElementById('overridesTableBody');
  const rows = dateOverrides.filter((o) => o.type === currentOverrideType);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Koi override nahi — sab kuch normal weekly pattern follow karega.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (o) => `
      <tr>
        <td class="cell-muted">${o.type === 'home_service' ? 'Home Service' : 'At Shop'}</td>
        <td>${o.date.split('T')[0]}</td>
        <td class="cell-muted">${DAY_LABELS[getDayAbbrFromDate(o.date)]}</td>
        <td>${o.time === 'whole_day' ? 'Whole Day' : formatTime12h(o.time)}</td>
        <td class="cell-muted">${o.reason || '—'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeOverride('${o.type}', '${o.date}', '${o.time}')">Remove</button></td>
      </tr>`
    )
    .join('');
}

window.removeOverride = async function (type, date, time) {
  try {
    const response = await protectedFetch(`http://localhost:4000/api/v1/schedule/remove-override-slots`, {
      method: 'DELETE',
      body: {type, date, time}
    })
    const res = await response.json();
    if(!response.ok){
      showFormMessage(formMessageOverridesSlots, res.message, 'error');
      return;    
    } 
  } catch (error) {
    showFormMessage(formMessageOverridesSlots, error?.message || "Something went wrong try again later !", 'error');
    console.log(error?.message);
    return;
  }
  
  dateOverrides = await getOverrideSlots();
  renderOverridesTable();
}

async function getOverrideSlots() {
  try {
    const response = await protectedFetch('http://localhost:4000/api/v1/schedule/get-override-slots', {
      method: 'GET'
    });
    const result = await response.json();

    if(!response.ok){
      showFormMessage(formMessageOverridesSlots, response.message, 'error');
      return [];
    }
    return result.results;
  } catch (error) {
    showFormMessage(formMessageOverridesSlots, error?.message || "Something went wrong try again later ! - Get block schedules", 'error');
    console.log(error?.message);
    return [];
  }
}

// Aaj se pehle ki date select hi na ho paye
document.getElementById('overrideDate').min = new Date().toISOString().split('T')[0];


// ============================================
// SERVICES — POST /api/admin/services, PUT /api/admin/services/:id, DELETE /api/admin/services/:id
// ============================================

//Extra one for reducing db calls
let editingServiceId = null;
let deletingServiceId = null;
let services = [];

//both modules
const editModal = document.getElementById('editServiceModal');
const deleteModal = document.getElementById('deleteServiceModal');

//two button of edit module
const editServiceForm = document.getElementById('editServiceForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');

//two button of delete module
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

//Adding services thingy - POST
const serviceForm = document.getElementById('serviceForm');
const formMessageAddservice = document.getElementById('formMessage-Addservice');
if (serviceForm) {
  serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormMessage(formMessageAddservice);
    const name = document.getElementById('serviceName').value.trim();
    const price = Number(document.getElementById('servicePrice').value);
    const duration = document.getElementById('serviceDuration').value.trim();
    if (!name || !price || !duration) return;

    //Post services apicall
    try {
      const response = await protectedFetch('http://localhost:4000/api/v1/services/post-services', {
        method: 'POST',
        body: {name, price, duration}
      });

      if(response.ok){
          renderServices();
          e.target.reset();
      }else{
        const res = await response.json();
        showFormMessage(formMessageAddservice, "Failed to add service. Please try again later.", 'error');
        return;
      }

    } catch (error) {
      showFormMessage(formMessageAddservice, error?.message || "Something went wrong try again later !", 'error');
      console.log(error?.message);
    }
  });
}

//render avail service thing
async function renderServices() {
  const tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;   // guard: agar services table iss page pe nahi hai

  try {
      const response = await protectedFetch('http://localhost:4000/api/v1/services/get-services', {
        method: 'GET'
      });

      if(response.ok){
        const serviceData = await response.json();
        services = serviceData;

        tbody.innerHTML = serviceData
        .map(
          (s) => `
          <tr>
            <td>${s.name}</td>
            <td>PKR ${s.price}</td>
            <td class="cell-muted">${s.duration}</td>
            <td>
              <div class="row-actions">
                <button class="btn btn-outline btn-sm" onclick="openEditModal(${s.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${s.id})">Delete</button>
              </div>
            </td>
          </tr>`
        )
        .join('');
        // console.log(services);
      }else{
        tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No services yet — add your first one above.</td></tr>`;
        return;
      }
  } catch (error) {
    console.log("Service display not working");
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No services yet — add your first one above.</td></tr>`;
  }

}

// ---- Edit flow ---- //

//Edit modal - function
function openEditModal(id) {
  if (!editModal) return;
  
  //Saved services in Get logic render service to avoid a DB call here
  const service = services.find((s) => s.id === id);

  if(!service) {
    console.log("Service not avail");
    return;
  }

  editingServiceId = id;
  document.getElementById('editServiceName').value = service.name;
  document.getElementById('editServicePrice').value = service.price;
  document.getElementById('editServiceDuration').value = service.duration;

  editModal.classList.add('is-open');
  playReveal(editModal);
}

//edit form
if (editServiceForm) {
  editServiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('editServiceName').value.trim();
    const price = Number(document.getElementById('editServicePrice').value);
    const duration = document.getElementById('editServiceDuration').value.trim();
    const formMessageEditService = document.getElementById('formMessage-Editservice');

    try {
      const response = await protectedFetch(`http://localhost:4000/api/v1/services/edit-services/${editingServiceId}`, {
        method: 'PATCH',
        body: {name, price, duration}
      });

      if(response.ok){
        showFormMessage(formMessageEditService, "Service Updated", 'success');
        setTimeout(() => {
            renderServices();
            closeEditModal();
        }, 1200);
      }else{
        showFormMessage(formMessageEditService, "Fail to update service", 'error');
        console.log("Facing issue while editing service")
      }

    } catch (error) {
       showFormMessage(formMessageEditService, error?.message || "Something went wrong try again later !", 'error');
       console.log(error?.message);
    }
  });
}

//Cancel
if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

//close - function
function closeEditModal() {
  const formMessageEditService = document.getElementById('formMessage-Editservice');

  if (editModal) editModal.classList.remove('is-open');
  clearFormMessage(formMessageEditService);
  editingServiceId = null;
  clearFormMessage();
}

// ---- Delete flow ---- //

//delete module - function
function openDeleteModal(id) {
  if (!deleteModal) return;
  deletingServiceId = id;
  deleteModal.classList.add('is-open');
  playReveal(deleteModal);
}

//Confirming delete module
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', async () => {
    //Delete query
    try {
      const response = await protectedFetch(`http://localhost:4000/api/v1/services/delete-services/${deletingServiceId}`, {
        method: 'Delete'
      });

      if(response.ok){
        renderServices();
        closeDeleteModal();
      }else{
        console.log("Facing issues while deleting model");
      }
    } catch (error) {
        showFormMessage(error?.message || "Something went wrong try again later !", 'error');
        console.log(error?.message);
    }

    
  });
}

//Canceling delete module
if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

//closing module - function
function closeDeleteModal() {
  if (deleteModal) deleteModal.classList.remove('is-open');
  deletingServiceId = null;
}

window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;

// ---------- Init ----------


(async () => {
renderBookings();

renderServices();

await loadDefaultSchedules();
renderScheduleRows(currentDefaultType);
renderDefaultPreview(currentDefaultType);

blockedSlots = await getBlockSlots();
renderBlockTimeChips();
renderBlockedTable();
renderWeeklyGrid();

dateOverrides =  await getOverrideSlots(); 
renderOverridesTable();
})();

// 🔧 Dashboard starts "is-active" directly in the HTML (it never passes
// through showView()), so it needs its own explicit first reveal here —
// otherwise its [data-reveal] elements stay stuck at opacity:0 forever.
playReveal(document.getElementById('view-dashboard'));
playReveal(document.querySelector('.content-header'));