// ============================================
// SZCUTZ — Home Page Logic
// ============================================

//gallery logic is on card stack

// ---------- Services ----------
// Static for now — this exact shape is what GET /api/user/services
// will return once the backend exists, so swapping this out later
// is a one-line change (fetch instead of a literal array).
const services = [
  { name: 'Haircut', price: 800, duration: '45 min' },
  { name: 'Shave', price: 400, duration: '30 min' },
  { name: 'Hair cut & Shave', price: 1000, duration: '75 min' }, //fetch query from admin to put more services
  { name: 'Massage', price: 500, duration: '30 min' },
];

const servicesGrid = document.querySelector('.services-grid');

servicesGrid.innerHTML = services
  .map(
    (s) => `
    <div class="service-card">
      <h3>${s.name}</h3>
      <div class="service-meta">
        <span class="service-price">PKR ${s.price}</span>
        <span>${s.duration}</span>
      </div>
      <a class="btn btn-primary" href="appointment.html?service=${encodeURIComponent(s.name.toLowerCase())}">Book Now</a>
    </div>`
  )
  .join('');