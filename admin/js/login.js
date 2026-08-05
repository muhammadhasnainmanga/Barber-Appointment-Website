// ============================================
// SZCUTZ Admin — Login logic
// MOCK AUTH — replace the marked block with a real call to
// POST /api/admin/login once the backend exists. The real response
// will include the admin's name/username too — swap the localStorage
// line for whatever the backend actually returns, same idea either way.
// ============================================

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


const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const formMessage = document.getElementById('formMessage');


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

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // clearFormMessage();

    const Username = document.getElementById('username').value.trim();
    const Password = document.getElementById('password').value.trim();

    if(!Username || !Password){
            showFormMessage('Either username or password is empty', 'error');
            return;
    }

    try {
        const response = await fetch('http://localhost:4000/api/v1/admin/login', {
            method: 'POST',
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Username, Password })
        });

        const result = await response.json();

        if(response.ok){
            // Saved here so dashboard.html can greet "Hi, {username}" instead
            // of a hardcoded "Hi, Admin".
            localStorage.setItem('szcutz_admin_token', 'mock-token');
            localStorage.setItem('szcutz_admin_username', Username);
            showFormMessage('Loading...', 'success');
            setTimeout(() => {
                window.location.href = '../html/dashboard.html';
            }, 1200);
            return;
        }else{
            showFormMessage('Incorrect Username or Password', 'error');
            return;
        }
    } catch (error) {
        showFormMessage('Server request failed...', 'error');
        console.log(error.message);
    }
});