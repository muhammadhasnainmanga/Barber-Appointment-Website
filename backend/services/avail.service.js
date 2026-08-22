const { GetDb } = require('../database/connect.db.js');

const DAY_ABBR_BY_INDEX = ['sun','mon','tue','wed','thu','fri','sat'];

function formatTime12h(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

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

// 🔧 yehi wo reusable function hai — get-times endpoint AUR baad mein
// booking-submit validation, dono isko call karenge
async function getAvailableTimesForDate(currentType, selectedDate) {
  const db = GetDb();
  const dayAbbr = DAY_ABBR_BY_INDEX[new Date(selectedDate + 'T00:00:00').getDay()];

  // Check 1 — us din ka schedule (tumne sahi kaha, is_open manually
  // dobara check karna zaroori nahi UI-flow ke liye, lekin agar row
  // hi na mile — jaise koi corrupted/missing data — safe-fail karna hai)
  const [scheduleRows] = await db.promise().query(
    'SELECT * FROM default_schedules WHERE type = ? AND day = ?',
    [currentType, dayAbbr]
  );
  const scheduleRow = scheduleRows[0];
  if (!scheduleRow || !scheduleRow.is_open) return [];

  let times = generateTimes(
    scheduleRow.start_time.slice(0, 5),
    scheduleRow.end_time.slice(0, 5),
    scheduleRow.slot_duration_minutes
  );

  // Check 2 — day-level recurring blocks ('mon' ya 'all')
  const [dayBlocks] = await db.promise().query(
    'SELECT * FROM block_slots WHERE type = ? AND (day = ? OR day = ?)',
    [currentType, dayAbbr, 'all']
  );
  if (dayBlocks.some((b) => b.time === 'whole_day')) {
    times = [];
  } else {
    const blockedTimes = dayBlocks.map((b) => b.time);
    times = times.filter((t) => !blockedTimes.includes(t));
  }

  // Check 3 — is exact date ke specific overrides
  const [overrides] = await db.promise().query(
    'SELECT * FROM override_schedules WHERE type = ? AND date = ?',
    [currentType, selectedDate]
  );
  if (overrides.some((o) => o.time === 'whole_day')) {
    times = [];
  } else {
    const overrideTimes = overrides.map((o) => o.time);
    times = times.filter((t) => !overrideTimes.includes(t));
  }
  const formattedTimes = times.map((t) => formatTime12h(t));
  // Check 4 (TODO — booking system banne ke baad):
  // yahan ek query add hogi 'bookings' table se, is exact date pe
  // already-booked times ko bhi `times` se filter out karne ke liye
  return formattedTimes;
}

module.exports = { getAvailableTimesForDate };