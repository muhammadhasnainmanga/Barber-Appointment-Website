// ============================================
// SZCUTZ — Home Page Logic
// ============================================

//gallery logic is on card stack

// ---------- Services ----------
// Static for now — this exact shape is what GET /api/user/services
// will return once the backend exists, so swapping this out later
// is a one-line change (fetch instead of a literal array)
import { fetchWithCache } from "../../general/js/fetchWithCache.js";

async function loadServices() {
    const servicesGrid = document.querySelector('.services-grid');
    try {
      const {data: services, isStale} = await fetchWithCache(
        'cached_services',
        'http://localhost:4000/api/v1/user/get-services', 
        { method: 'GET', headers: {'Content-Type': 'application/json'} }
      );

      if(!services || services.length === 0){
        servicesGrid.innerHTML = `<div class="services-empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>

        <p>Services are not available right now.</p>
      </div>`
      return;
      }

      servicesGrid.innerHTML = services
        .map(
          (s) => `
          <div class="service-card">
            <h3>${s.name}</h3>
            <div class="service-meta">
              <span class="service-price">PKR ${s.price}</span>
              <span>${s.duration}</span>
            </div>
            <a class="btn btn-primary" href="../../../frontend/appointment/html/appoinment.html?type=appoinment&service=${s.id}">Book Now</a>
          </div>`
        )
        .join(''); 
    }catch (error) {
        servicesGrid.innerHTML = `<div class="services-empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Could not load services right now.</p>
          <button type="button" class="btn btn-primary" id="retryServicesBtn">Try Again</button>
        </div>`;

        document.getElementById('retryServicesBtn')?.addEventListener('click', loadServices);
        console.log("Error while getting services for frontend");
    }    
}

loadServices();

