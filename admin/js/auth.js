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

async function logout() {
  try {
      const response = await fetch('http://localhost:4000/api/v1/admin/logout', {
          method: 'POST',
          credentials: "include",
          headers: { 'Content-Type': 'application/json' }
      });

      if(response.ok){
          localStorage.removeItem('szcutz_admin_token');
          localStorage.removeItem('szcutz_admin_username');
          setTimeout(() => {
              window.location.href = '../html/login.html';
          }, 1000);
          return;
      }else{
        return null;
      }
      
  } catch (error) {
      console.log(error);
  }
}