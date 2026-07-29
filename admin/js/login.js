// ============================================
// SZCUTZ Admin — Login logic
// MOCK AUTH — replace the marked block with a real call to
// POST /api/admin/login once the backend exists. The real response
// will include the admin's name/username too — swap the localStorage
// line for whatever the backend actually returns, same idea either way.
// ============================================
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const formMessage = document.getElementById('formMessage');


function showFormMessage(message) {
    formMessage.textContent = message;
    formMessage.hidden = false;
}

function clearFormMessage() {
    formMessage.textContent = '';
    formMessage.hidden = true;
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  // ---- MOCK CHECK — swap this whole if/else for a fetch() call ----
  //
  // const res = await fetch('/api/admin/login', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ username, password }),
  // });
  // if (!res.ok) { loginError.hidden = false; return; }
  // const { token, username: returnedName } = await res.json();
  // localStorage.setItem('szcutz_admin_token', token);
  // localStorage.setItem('szcutz_admin_username', returnedName);
  // window.location.href = 'dashboard.html';

  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem('szcutz_admin_token', 'mock-token');
    // Saved here so dashboard.html can greet "Hi, {username}" instead
    // of a hardcoded "Hi, Admin".
    localStorage.setItem('szcutz_admin_username', username);
    window.location.href = '../html/dashboard.html';
  } else {
     if(username === '' || password === ''){
            showFormMessage('Either username or password is empty');
            return;
        }else{
            showFormMessage('Incorrect Username or Password');
            return;
        }
  }
});