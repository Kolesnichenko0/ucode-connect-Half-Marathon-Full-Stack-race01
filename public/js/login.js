document.querySelector('#loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const login = document.querySelector('#login').value;

    const loginRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!loginRegex.test(login)) {
        showError('Invalid login', '3-20 characters, letters, numbers, underscores only.');
        return;
    }

    const formData = new FormData(this);

    fetch('/login-process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    })
        .then(response => {
            if (response.status === 201) {
                showSuccess('Login successful! Redirecting...');
                window.location.href = '/main';
            } else {
                return response.json().then(data => {
                    showError(data.error);
                });
            }
        })
        .catch(() => {
            showError('Something went wrong!');
        });
});

function showError(message, details) {
    const successDiv = document.getElementById('success');
    successDiv.style.display = 'none';
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `<strong>${message}</strong>`;

    if (details) {
        const detailsDiv = document.createElement('div');
        detailsDiv.innerText = details;
        detailsDiv.style.fontSize = '0.8em';
        errorDiv.appendChild(detailsDiv);
    }

    errorDiv.style.display = 'block';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';
    const successDiv = document.getElementById('success');
    successDiv.innerHTML = `<strong>${message}</strong>`;
    successDiv.style.display = 'block';
}

function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(inputId + 'Icon');
    const typeAttribute = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', typeAttribute);
    passwordIcon.classList.toggle('fa-eye');
    passwordIcon.classList.toggle('fa-eye-slash');
}