// ============================================
// SZCUTZ Admin — Dashboard logic (sidebar version)
// MOCK DATA everywhere — every backend-bound action is commented
// with the real route it becomes.
import {protectedFetch} from "./auth.ClientApi.js";

// ============================================
function showFormMessage(message, type = 'error') {
    formMessage.textContent = message;
    formMessage.classList.remove('form-message-success', 'form-message-error');

    if (type === 'success') {
        formMessage.classList.add('form-message-success');
    } else {
        formMessage.classList.add('form-message-error');
    }

    formMessage.hidden = false;
}

function clearFormMessage() {
    formMessage.textContent = '';
    formMessage.classList.remove('form-message-success', 'form-message-error');
    formMessage.hidden = true;
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
  const formMessage = document.getElementById('formMessage').hidden;
  clearFormMessage();

  if(!currentPassword || !nextPassword || !confirmPassword){
    showFormMessage('Fill al the fields', 'error');
    formMessage.hidden = false;
    return;
  }

  if(nextPassword.length < 6){
    showFormMessage('New Password must be 6 characters', 'error');
    formMessage.hidden = false;
    return;
  }

  if(nextPassword !== confirmPassword){
    showFormMessage("New passwords don't match.", 'error');
    formMessage.hidden = false;
    return;
  }

  try {
    
    const response = await protectedFetch('http://localhost:4000/api/v1/admin/change-password', {
      method: 'POST',
      body: {currentPassword, nextPassword, confirmPassword}
    });

    if(response.ok){
        showFormMessage("Password Changed Successfully", 'success');
        setTimeout(() => {
            passwordModal.classList.remove('is-open');
            clearFormMessage();
            e.target.reset();
        }, 1200);
        
    }else{
      const res = await response.json();
      showFormMessage(res.message, 'error');
      return;
    }

  } catch (error) {
    showFormMessage(error?.message || "Something went wrong try again later !", 'error');
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

// ============================================
// REVEAL ANIMATION (fade + rise)
// Views are shown/hidden by clicks, not scroll, so this replays
// manually every time — same reset → force-reflow → stagger technique
// used for the customer-facing "Check My Booking" modal.
// ============================================

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
// (Only 3 states now — "Completed" was dropped per the redesign.)
// ============================================

let bookings = [
  { id: 1, service: 'Haircut', name: 'Ali Khan', phone: '0300-1234567', date: '2026-08-02', time: '3:00 PM', type: 'appointment', amount: 800, status: 'confirmed' },
  { id: 2, service: 'Shave', name: 'Bilal Ahmed', phone: '0312-9876543', date: '2026-07-20', time: '5:00 PM', type: 'home_service', amount: 400, status: 'confirmed' },
  { id: 3, service: 'Haircut', name: 'Usman Tariq', phone: '0333-4567890', date: '2026-07-15', time: '1:00 PM', type: 'appointment', amount: 800, status: 'cancelled' },
  { id: 4, service: 'Haircut', name: 'Hamza Raza', phone: '0345-1112223', date: '2026-08-05', time: '5:00 PM', type: 'home_service', amount: 800, status: 'pending' },
];

let currentStatusFilter = 'confirmed';

function renderBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  const from = document.getElementById('filterFrom').value;
  const to = document.getElementById('filterTo').value;

  const filtered = bookings.filter((b) => {
    const statusMatch = currentStatusFilter === 'all' || b.status === currentStatusFilter;
    const afterFrom = !from || b.date >= from;
    const beforeTo = !to || b.date <= to;
    return statusMatch && afterFrom && beforeTo;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="empty-row" data-reveal><td colspan="8">No bookings match this filter.</td></tr>`;
    playReveal(document.getElementById('view-booking'));
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (b, i) => `
      <tr data-reveal data-delay="${i * 45}">
        <td class="cell-muted">#${b.id}</td>
        <td>${b.service}</td>
        <td>${b.name}</td>
        <td class="cell-muted">${b.phone}</td>
        <td>${b.date} · ${b.time}</td>
        <td class="cell-muted">${b.type === 'home_service' ? 'Home Service' : 'At Shop'}</td>
        <td>PKR ${b.amount}</td>
        <td>
          <select class="status-select ${b.status}" onchange="changeStatus(${b.id}, this.value)">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>🟡 Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>🟢 Confirmed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>🔴 Cancelled</option>
          </select>
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
function changeStatus(id, newStatus) {
  const booking = bookings.find((b) => b.id === id);
  if (booking) booking.status = newStatus;
  renderBookings();
}

// ============================================
// DEFAULT SCHEDULE — the recurring weekly pattern, per type
// Becomes: POST /api/admin/schedule  { type, days, startTime, endTime, duration }
// ============================================

let defaultSchedules = {
  appointment: null,
  home_service: null,
};

let selectedDefaultDays = new Set(DAY_ORDER); // start with "All Days" selected
let currentDefaultType = 'appointment';

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

// ---------- Day chip toggling (with "All Days" as a smart shortcut) ----------
const defaultDayChipsEl = document.getElementById('defaultDayChips');

function syncAllDaysChip() {
  const allChip = defaultDayChipsEl.querySelector('[data-day="all"]');
  allChip.classList.toggle('is-active', selectedDefaultDays.size === DAY_ORDER.length);
}

function renderDayChips() {
  defaultDayChipsEl.querySelectorAll('.day-chip:not(.all-days)').forEach((chip) => {
    chip.classList.toggle('is-active', selectedDefaultDays.has(chip.dataset.day));
  });
  syncAllDaysChip();
}

defaultDayChipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.day-chip');
  if (!chip) return;
  const day = chip.dataset.day;

  if (day === 'all') {
    if (selectedDefaultDays.size === DAY_ORDER.length) {
      selectedDefaultDays.clear(); // all were on → turn all off
    } else {
      DAY_ORDER.forEach((d) => selectedDefaultDays.add(d)); // turn all on
    }
  } else {
    selectedDefaultDays.has(day) ? selectedDefaultDays.delete(day) : selectedDefaultDays.add(day);
  }
  renderDayChips();
});

// ---------- Type toggle (Default Schedule view) ----------
document.getElementById('defaultTypeToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#defaultTypeToggle button').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  currentDefaultType = btn.dataset.type;
  loadDefaultScheduleIntoForm(currentDefaultType);
});

function loadDefaultScheduleIntoForm(type) {
  const schedule = defaultSchedules[type];
  if (schedule) {
    selectedDefaultDays = new Set(schedule.days);
    document.getElementById('defaultStartTime').value = schedule.startTime;
    document.getElementById('defaultEndTime').value = schedule.endTime;
    document.getElementById('defaultDuration').value = schedule.duration;
  } else {
    selectedDefaultDays = new Set(DAY_ORDER);
    document.getElementById('defaultStartTime').value = '09:00';
    document.getElementById('defaultEndTime').value = '17:00';
    document.getElementById('defaultDuration').value = '60';
  }
  renderDayChips();
  renderDefaultPreview(type);
}

function renderDefaultPreview(type) {
  const schedule = defaultSchedules[type];
  const previewChips = document.getElementById('defaultPreviewChips');
  const previewDays = document.getElementById('defaultPreviewDays');

  if (!schedule) {
    previewChips.innerHTML = `<span class="cell-muted">No schedule saved yet for this type.</span>`;
    previewDays.textContent = 'Applies to: —';
    return;
  }

  previewDays.textContent = `Applies to: ${schedule.days.length === 7 ? 'All Days' : schedule.days.map((d) => DAY_LABELS[d]).join(', ')}`;
  previewChips.innerHTML = schedule.times.map((t) => `<span class="slot-chip">${formatTime12h(t)}</span>`).join('');
}

// MOCK — becomes: POST /api/admin/schedule
document.getElementById('saveDefaultScheduleBtn').addEventListener('click', () => {
  const startTime = document.getElementById('defaultStartTime').value;
  const endTime = document.getElementById('defaultEndTime').value;
  const duration = document.getElementById('defaultDuration').value;

  if (selectedDefaultDays.size === 0) {
    alert('Pick at least one day.');
    return;
  }
  if (startTime >= endTime) {
    alert('End time must be after start time.');
    return;
  }

  defaultSchedules[currentDefaultType] = {
    days: [...selectedDefaultDays],
    startTime,
    endTime,
    duration,
    times: generateTimes(startTime, endTime, duration),
  };

  renderDefaultPreview(currentDefaultType);
  populateBlockTimeDropdown(); // the Blocked Slots view depends on this
  renderWeeklyGrid();
});

// ============================================
// BLOCKED SLOTS (exceptions) — per type
// Becomes: POST /api/admin/blocks, DELETE /api/admin/blocks/:id
// ============================================

let blockedSlots = [];
let nextBlockId = 1;
let currentBlockedType = 'appointment';

document.getElementById('blockedTypeToggle').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  document.querySelectorAll('#blockedTypeToggle button').forEach((b) => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  currentBlockedType = btn.dataset.type;
  populateBlockTimeDropdown();
  renderBlockedTable();
  renderWeeklyGrid();
});

// The Time dropdown only offers times that actually exist in that
// type's Default Schedule — you can't block a time that was never open.
function populateBlockTimeDropdown() {
  const select = document.getElementById('blockTime');
  const schedule = defaultSchedules[currentBlockedType];

  select.innerHTML = '<option value="whole_day">Whole Day</option>';
  if (schedule) {
    schedule.times.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = formatTime12h(t);
      select.appendChild(opt);
    });
  }
}

document.getElementById('addBlockBtn').addEventListener('click', () => {
  const day = document.getElementById('blockDay').value;
  const time = document.getElementById('blockTime').value;
  const type = currentBlockedType;

  const alreadyExists = blockedSlots.some((b) => b.type === type && b.day === day && b.time === time);
  if (alreadyExists) return;

  blockedSlots.push({ id: nextBlockId++, type, day, time });
  renderBlockedTable();
  renderWeeklyGrid();
});

function renderBlockedTable() {
  const tbody = document.getElementById('blockedTableBody');
  const rows = blockedSlots.filter((b) => b.type === currentBlockedType);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Nothing blocked yet everything in the default schedule is open.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (b) => `
      <tr>
        <td class="cell-muted">${b.type === 'home_service' ? 'Home Service' : 'At Shop'}</td>
        <td>${b.day === 'all' ? 'All Days' : DAY_LABELS[b.day]}</td>
        <td>${b.time === 'whole_day' ? 'Whole Day' : formatTime12h(b.time)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeBlock(${b.id})">Remove</button></td>
      </tr>`
    )
    .join('');
}

// MOCK — becomes: DELETE /api/admin/blocks/:id
function removeBlock(id) {
  blockedSlots = blockedSlots.filter((b) => b.id !== id);
  renderBlockedTable();
  renderWeeklyGrid();
}

// ---------- Weekly availability grid — the visual payoff of "reverse availability" ----------
function isSlotBlocked(type, day, time) {
  return blockedSlots.some(
    (b) => b.type === type && (b.day === 'all' || b.day === day) && (b.time === 'whole_day' || b.time === time)
  );
}

function renderWeeklyGrid() {
  const grid = document.getElementById('weeklyGrid');
  const schedule = defaultSchedules[currentBlockedType];

  if (!schedule) {
    grid.innerHTML = `<tr><td class="cell-muted" style="padding:24px;">Save a Default Schedule for this type first.</td></tr>`;
    return;
  }

  const headerRow = `<tr><th>Time</th>${DAY_ORDER.map((d) => `<th>${DAY_LABELS[d]}</th>`).join('')}</tr>`;

  const bodyRows = schedule.times
    .map((time) => {
      const cells = DAY_ORDER.map((day) => {
        const inSchedule = schedule.days.includes(day);
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
// SERVICES — POST /api/admin/services, PUT /api/admin/services/:id, DELETE /api/admin/services/:id
// ============================================

let services = [
  { id: 'haircut', name: 'Haircut', price: 800, duration: '45 min' },
  { id: 'shave', name: 'Shave', price: 400, duration: '30 min' },
];

function renderServices() {
  const tbody = document.getElementById('servicesTableBody');

  if (services.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No services yet — add your first one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = services
    .map(
      (s) => `
      <tr>
        <td>${s.name}</td>
        <td>PKR ${s.price}</td>
        <td class="cell-muted">${s.duration}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="editService('${s.id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">Delete</button>
          </div>
        </td>
      </tr>`
    )
    .join('');
}

document.getElementById('serviceForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('serviceName').value.trim();
  const price = Number(document.getElementById('servicePrice').value);
  const duration = document.getElementById('serviceDuration').value.trim();
  if (!name || !price || !duration) return;

  services.push({ id: name.toLowerCase().replace(/\s+/g, '-'), name, price, duration });
  renderServices();
  e.target.reset();
});

function editService(id) {
  const service = services.find((s) => s.id === id);
  if (!service) return;
  const newPrice = prompt(`New price for ${service.name} (PKR)`, service.price);
  if (newPrice === null) return;
  service.price = Number(newPrice) || service.price;
  renderServices();
}

function deleteService(id) {
  if (!confirm('Remove this service? It will no longer show up for customers.')) return;
  services = services.filter((s) => s.id !== id);
  renderServices();
}

// ---------- Init ----------
renderDayChips();
loadDefaultScheduleIntoForm('appointment');
playReveal(document.getElementById('view-dashboard'));

// Seed both types with a sensible starting schedule so the Blocked Slots
// dropdown/grid aren't empty on first visit — remove this once real data exists.
document.getElementById('saveDefaultScheduleBtn').click();
document.getElementById('defaultTypeToggle').querySelector('[data-type="home_service"]').click();
document.getElementById('saveDefaultScheduleBtn').click();
document.getElementById('defaultTypeToggle').querySelector('[data-type="appointment"]').click();

renderBookings();
populateBlockTimeDropdown();
renderBlockedTable();
renderWeeklyGrid();
renderServices();

// 🔧 Dashboard starts "is-active" directly in the HTML (it never passes
// through showView()), so it needs its own explicit first reveal here —
// otherwise its [data-reveal] elements stay stuck at opacity:0 forever.
playReveal(document.getElementById('view-dashboard'));
playReveal(document.querySelector('.content-header'));