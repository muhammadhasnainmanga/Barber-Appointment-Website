// ============================================
// SZCUTZ Admin — Auth guard
// Runs first thing on any protected page. No token → bounce to login.
// This is a UX convenience only — the REAL gate is the backend
// rejecting any /api/admin/* call that doesn't carry a valid token.
// ============================================

(function () {
  const token = localStorage.getItem('szcutz_admin_token');
  if (!token) {
    window.location.href = 'login.html';
  }
})();

function logout() {
  localStorage.removeItem('szcutz_admin_token');
  localStorage.removeItem('szcutz_admin_username');
  window.location.href = 'login.html';
}